# Restaurant Import Pipeline

Status: **full architecture designed and implemented; nothing has been
executed against real data.** Validation, cuisine classification, dietary-
claim validation, and duplicate-detection logic are implemented and tested
against local fixtures (`tests/restaurant-import/run-fixture-tests.js`, 8/8
passing). The staging collection and its Firestore rules exist locally but
are not deployed. The stage/apply scripts exist and are syntax-checked, but
have never been run against any Firestore project — this sandbox has no
Firebase credentials and neither script was executed with any. No real
restaurant has ever been created by this pipeline, staged, or imported.

## Hard constraints (do not weaken these)

- **No mass scraping.** Never scrapes Google, TripAdvisor, Yelp, OpenTable,
  Deliveroo, Uber Eats, Just Eat, or any similar platform. Those platforms'
  data is not this project's to copy.
- **No copyrighted content.** Never copies another site's descriptive text,
  photos, menus, or reviews into a listing.
- **No bypassing access controls.** Never bypasses `robots.txt`,
  authentication, or rate limits on any source.
- **No production Firestore connection from this task.** Nothing built or
  run in this task read from or wrote to a live Firestore database.
- **Dry run is the default everywhere.** Every tool in this pipeline
  (`importRestaurantsDryRun.js`, `stageImportCandidates.js`,
  `applyApprovedImportBatch.js`) requires an explicit `--apply` flag to
  write anything, and refuses to run at all if its target environment is
  unclear (see "Safe target requirements" below) — not just refuses to
  write.
- **Cuisine is never guessed.** Never inferred from a restaurant's name, an
  owner's apparent nationality, the neighbourhood, or review text — see
  "Cuisine classification" below.
- **Dietary attributes are never inferred from cuisine**, and an import
  pipeline can never self-assign `"platform_verified"` as a claim's basis —
  see "Dietary claims" below.
- **Never auto-merges ambiguous records**, and **never overwrites an
  owner-claimed restaurant** — `applyApprovedImportBatch.js` only ever
  *creates* new restaurant documents (`.add()`), never updates an existing
  one, so this is true by construction, not just policy.

## Pipeline architecture

```
SOURCE FILE (local JSON, human-supplied)
  -> parse / normalize            (the operator's own step, outside this
                                    pipeline — see "What sourcing a real
                                    file requires" below)
  -> validateCandidate()           lib/import/validateCandidate.ts
  -> classifyCuisine()             lib/import/classifyCuisine.ts
  -> validateDietaryClaims()       lib/import/validateDietaryClaims.ts
  -> classifyDuplicate()           lib/import/duplicateDetection.ts
  -> DRY RUN REPORT                lib/import/runDryRun.ts /
                                    functions/scripts/importRestaurantsDryRun.js
  -> [human review of the report]
  -> STAGE                         functions/scripts/stageImportCandidates.js
                                    -> restaurant_import_candidates (Firestore)
  -> [human review in the admin UI — app/admin/restaurant-import-candidates]
  -> approved batch (explicit local JSON file, human-produced)
  -> APPLY                         functions/scripts/applyApprovedImportBatch.js
                                    -> restaurants (Firestore, public)
  -> [post-import verification — see below]
  -> [owner claim / correction / removal — existing workflows, unchanged]
```

Two distinct write steps exist, each independently gated, because staging
and public creation are different trust decisions: staging just says "worth
a human's attention"; apply says "a human has actually decided this should
be a public listing."

## `lib/import/` — canonical implementation

- **`types.ts`** — `ImportCandidate`, `DuplicateMatchClassification`,
  `CuisineClassificationStatus`, `DietaryDeclarationBasis`,
  `RestaurantImportCandidateStatus` (the staging lifecycle),
  `RestaurantImportCandidateDoc` (the staging Firestore shape),
  `ApprovedImportBatch` (the human-produced artifact the apply step acts
  on).
- **`validateCandidate.ts`** — checks `name`, `citySlug` (against
  `lib/cities.ts`), `addressLine1`, `postcode` (loose UK shape check),
  `sourceType`, `sourceName`, `sourceUrl` (required only for genuinely
  external source types — see `RESTAURANT-DATA-PROVENANCE.md`). An
  explicitly-provided but unrecognised `cuisineSlugs` entry is an error;
  an *absent* `cuisineSlugs` is not — see "Cuisine classification" below.
- **`classifyCuisine.ts`** — see "Cuisine classification" below.
- **`validateDietaryClaims.ts`** — see "Dietary claims" below.
- **`duplicateDetection.ts`** — `classifyDuplicate()`, unchanged from the
  original design (see "Duplicate detection design" below).
- **`runDryRun.ts`** — orchestrates all four into a per-row report with a
  `recommendedAction` (`would_create` / `skip` / `human_review`).

## Cuisine classification

`classifyCuisine.ts` does not classify anything in the sense of inferring —
it only confirms whether the **source itself** already provided
`cuisineSlugs`. If it did, each slug is checked against the real
`lib/cuisines.ts` registry (an unrecognised slug is dropped as an error). If
it didn't — no cuisine data at all — the result is
`"unknown_requires_review"`, `cuisineSlugs` comes back empty, and
`runDryRun.ts` routes the row to `human_review` rather than `would_create`.

**This function will never look at a restaurant's name, an owner's
apparent nationality, the neighbourhood/postcode, or review text to guess a
cuisine.** A human operator resolves an unknown-cuisine candidate later,
with actual judgement, in the admin review UI
(`app/admin/restaurant-import-candidates`) — there is no heuristic anywhere
in this codebase standing in for that.

## Dietary claims

`validateDietaryClaims.ts` accepts a dietary attribute only when the source
provided **both** the attribute and an explicit `DietaryDeclarationBasis`
for it:

- `"restaurant_declared"` — the business itself told the source this.
- `"source_reported"` — the source dataset/provider asserts it as fact,
  without it being a first-party restaurant declaration.
- `"platform_verified"` — London Food Hubs itself confirmed this. **An
  import pipeline can never assign this basis to itself** —
  `validateDietaryClaims()` specifically rejects any candidate claiming
  `"platform_verified"` at import time, since a script reading a local file
  has no way to have actually verified anything. Only a genuine, documented
  downstream review process may ever upgrade a claim to this basis.

An attribute with no declared basis, or an unearned `"platform_verified"`
basis, is **dropped** (not kept with a weaker guarantee than it appears to
carry) — the candidate otherwise still proceeds; only that one attribute is
lost.

Never infers a dietary attribute from cuisine (an "Indian" cuisine slug
does not imply vegetarian; a "Middle Eastern" one does not imply halal) —
this was true before this task and remains a hard rule.

## Duplicate detection design

Unchanged from the original design — `classifyDuplicate()` compares a
candidate against a supplied existing-restaurant set using five signals
(normalized name, postcode, address, phone, website domain):

- **`match`** — two or more independent signals agree on the same existing
  record, or a single phone/website-domain match alone (those two are
  specific enough on their own). Never imported — `runDryRun.ts` recommends
  `skip`, and `stageImportCandidates.js` never stages a `skip` row at all,
  so a `match` candidate never even reaches the staging queue.
- **`possible_match`** — some signal fired but not a strong-enough
  combination. Always routed to a human (`human_review`) — never
  auto-resolved.
- **`requires_review`** — the candidate itself doesn't carry enough
  identifying data (no postcode, phone, *or* website) to compare with any
  confidence. Never defaults to `new`.
- **`new`** — no signal fired against any existing record.

`applyApprovedImportBatch.js` adds one more layer of defense: even if a
candidate's live `duplicateClassification` somehow reads `"match"` at apply
time (it shouldn't, by construction, but defense in depth costs nothing
here), the apply step refuses to create a restaurant for it regardless of
its `APPROVED` status.

## The staging collection: `restaurant_import_candidates`

See `firestore.rules`' `restaurant_import_candidates` block. Entirely
admin-only: `read`/`update`/`delete` require the `isAdmin()` custom-claim
check; **`create` is denied unconditionally, for every client including an
admin.** Candidates can only ever be created by
`functions/scripts/stageImportCandidates.js` via the Admin SDK, which
bypasses Firestore rules entirely (the same trust model as
`functions/scripts/bootstrapFirstAdmin.js`). This keeps "what's in the
staging queue" fully auditable to whoever actually ran the staging script —
there is no client-side path for a candidate to appear any other way.

### Status lifecycle

`PENDING_REVIEW` (initial) → `APPROVED` | `REJECTED` | `DUPLICATE` |
`NEEDS_RESEARCH` (human decision, via the admin UI) → `IMPORTED` (set only
by `applyApprovedImportBatch.js`, atomically with creating the public
restaurant document, in the same Firestore transaction — a candidate can
never be double-imported by re-running the apply script, since its status
is no longer `APPROVED` after the first successful run).

### Admin review UI

`app/admin/restaurant-import-candidates/page.tsx` — filter by status,
review each candidate's provenance/cuisine/dietary/duplicate summary, add a
review note, and set status. It never creates a restaurant itself; its
"Copy approved-batch JSON" button only assembles the `ApprovedImportBatch`
JSON structure `applyApprovedImportBatch.js` expects, to make that manual
hand-off less error-prone — it still requires the operator to actually run
the apply script themselves, outside the app, with real credentials.

## Safe target requirements

Both `stageImportCandidates.js` and `applyApprovedImportBatch.js`:

- Default to a **dry run** — nothing is written unless `--apply` is passed.
- Require `--env`, exactly `"production"` or `"staging"`. **Missing or any
  other value is a hard stop — the script refuses to run at all**, not
  just refuses to write.
- Require `--project <firebase-project-id>`, cross-checked against the
  project actually resolved from the credentials
  (`GOOGLE_APPLICATION_CREDENTIALS`). A mismatch is a hard error — this
  catches "my credentials are for the wrong project" before anything is
  written.
- For `--env production` specifically: `--apply` alone is **not** enough.
  `--confirm-production` must also be passed. This is the "additional
  explicit flag/confirmation" production requires beyond every other
  environment.
- Never accept or embed a credential in any argument or file this
  repository defines — auth comes only from
  `GOOGLE_APPLICATION_CREDENTIALS`, exactly like every other Admin SDK
  script in `functions/scripts/`.

Neither script was run against any real Firestore project in this task —
this sandbox has no Firebase credentials, and none were provided or used.
Even the early argument-validation logic (missing `--env`, invalid `--env`,
missing `--project`) could not be exercised end-to-end here, because both
scripts `require("firebase-admin/*")` at module-load time and
`functions/node_modules` has never had `npm install` run in it in this
sandbox — the same limitation that has applied to every existing Admin SDK
script (`bootstrapFirstAdmin.js`, `backfillRestaurantOwners.js`) since they
were first written. The validation *ordering* was manually reviewed to
confirm every safety check happens before any Firebase call, but "reviewed"
is not "tested" — flagged honestly, not glossed over.

## Post-import verification (what to do after a real `--apply` run)

Not automated — a manual checklist for whoever runs `applyApprovedImportBatch.js`
for real:

1. Confirm the script's own summary count (`Created N restaurant(s)`)
   matches the number of `APPROVED` candidates in the batch file.
2. Spot-check a handful of newly-created restaurant documents in the
   Firebase console: `ownerUid` is empty, `ownerClaimStatus` is
   `"unclaimed"`, `status` is `"pending"` (not live yet — same as any other
   newly-submitted restaurant, needs an admin's normal activation review),
   `sourceType`/`sourceName`/`sourceRetrievedAt`/`dataConfidence` are all
   populated and accurate.
3. Confirm the corresponding staging candidates are now `IMPORTED` with a
   valid `importedRestaurantId`.
4. Spot-check that none of the newly-created restaurants appear to
   duplicate an existing one that the automated duplicate detection missed
   (a human sanity check, not a re-run of the algorithm).
5. Only after this checklist does an admin move a restaurant from
   `status: "pending"` to active/live, following the exact same review
   process as any restaurant-submitted or owner-claimed listing — importing
   a restaurant does not skip that step.

## The FIRST 100 RESTAURANTS procedure

The recommended pilot size is **50–100 London restaurants**, reviewed for
quality before scaling further. Do not attempt to populate every London
restaurant in one run.

1. **Source approval.** A human decides which source to use (e.g. a named
   open dataset, a licensed provider, or editorial research) — this
   pipeline has no opinion on sourcing and does not fetch anything itself.
   Confirm the source is not a prohibited platform (see "Hard constraints").
2. **License/source check.** Confirm the source's terms actually permit
   this use (an open dataset's stated license, a licensed provider's
   contract terms, or — for editorial research — that no third-party
   copyrighted text/photos are being copied). Record the outcome in
   `sourceName`/`sourceUrl` for every candidate from this source.
3. **Local source file.** Produce a local JSON file matching
   `ImportCandidate`'s shape (`lib/import/types.ts`) — 50–100 rows for the
   pilot. This file never leaves the operator's machine as part of this
   pipeline's own tooling.
4. **Dry run.** `node functions/scripts/importRestaurantsDryRun.js
   --candidates ... --existing ... --out ./dry-run-report.json`.
5. **Duplicate report.** Review the dry-run report's `duplicateCheck` per
   row — especially every `possible_match`/`requires_review`, which are
   never auto-resolved.
6. **Human review.** A person reads through the full report (all
   `recommendedAction` values, not just `would_create`), including every
   `cuisineClassificationStatus: "unknown_requires_review"` row and every
   `dietaryErrors` entry.
7. **Approval → staging.** `node functions/scripts/stageImportCandidates.js
   --report ... --candidates ... --project ... --env staging --batch-id
   2026-pilot-1 --apply` (staging environment first, always).
8. **Staging review.** In `app/admin/restaurant-import-candidates`, an
   admin works through each `PENDING_REVIEW` candidate, resolves any
   `unknown_requires_review` cuisine by hand, and sets `APPROVED` /
   `REJECTED` / `DUPLICATE` / `NEEDS_RESEARCH`.
9. **Safe apply.** Assemble the approved-batch JSON (the admin UI's "Copy
   approved-batch JSON" button helps), then
   `node functions/scripts/applyApprovedImportBatch.js --batch ... --project
   ... --env staging --apply` — staging first; only once the pilot batch
   has been reviewed live on staging does the same procedure repeat with
   `--env production --confirm-production`.
10. **Post-import verification.** See the checklist above.
11. **Owner claim.** Every imported restaurant starts unclaimed and goes
    through the existing claim workflow unchanged —
    `docs/RESTAURANT-CLAIM-WORKFLOW.md`.
12. **Correction/removal.** Also unchanged — `restaurant_correction_requests`,
    reviewed by an admin, never auto-applied.

## Data freshness

Every imported (and self-submitted) restaurant carries `sourceRetrievedAt`
and `lastVerifiedAt` (see `RESTAURANT-DATA-PROVENANCE.md`). This task adds
the *concept* of a future `NEEDS_REVERIFICATION` status for a public
restaurant whose `lastVerifiedAt` has aged past some as-yet-undecided
threshold — **not implemented as a type, field, or automated job in this
task**, only documented as the intended direction: after an appropriate
period, a listing may be flagged for re-verification, never automatically
deleted or hidden for being old. Deciding the actual threshold and building
the automation is future work, deliberately not designed in detail here
since it wasn't asked for beyond acknowledging the concept.

## What sourcing a real file requires (outside this pipeline)

This pipeline has no scraper, no API client, no data-fetching code of any
kind — parsing/normalizing a real source into the `ImportCandidate` shape
is entirely a human/operator step using whatever tool fits that specific
source (a spreadsheet export, a dataset's own CLI, a manual editorial
write-up). Building a source-specific parser was not attempted — it would
require an actual chosen, approved source first, which this task explicitly
did not select.

## What this task did not do

- Did not connect to any real data source, open dataset, or licensed
  provider — no source has been identified, approved, or integrated.
- Did not run `stageImportCandidates.js` or `applyApprovedImportBatch.js`
  against any real Firestore project, staging or production.
- Did not deploy `firestore.rules`' new `restaurant_import_candidates`
  block.
- Did not build a source-specific parser/normalizer (see above).
- Did not implement `NEEDS_REVERIFICATION` as an actual field/status/job —
  documented as a future concept only.
- Did not import, stage, or create a single real restaurant record.
