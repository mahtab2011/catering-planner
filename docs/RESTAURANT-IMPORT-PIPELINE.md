# Restaurant Import Pipeline

Status: **dry-run foundation only**. Validation and duplicate-detection
logic is implemented and smoke-tested; no real import has been run, no
restaurant has ever been created by this pipeline, and it has no connection
to Firestore (production or otherwise). This document describes exactly
what exists and, just as importantly, what does not.

## Hard constraints (do not weaken these)

This pipeline was built under explicit instructions that remain binding for
any future work on it:

- **No mass scraping.** Never scrapes Google, TripAdvisor, Yelp, OpenTable,
  Deliveroo, Uber Eats, Just Eat, or any similar platform. Those platforms'
  data is not this project's to copy.
- **No copyrighted content.** Never copies another site's descriptive text
  or photos into a listing.
- **No bypassing access controls.** Never bypasses `robots.txt`,
  authentication, or rate limits on any source.
- **No production Firestore connection.** The pipeline, as it exists today,
  never reads from or writes to a live Firestore database — see
  "How it actually runs" below.
- **Validates before anything else.** name, city, address, postcode,
  cuisine, and source are all checked (`lib/import/validateCandidate.ts`)
  before a candidate is considered further.
- **Duplicate detection is mandatory and conservative.** See below — the
  design deliberately biases toward flagging a human over guessing.
- **Never auto-overwrites owner-claimed content.** Nothing in this
  pipeline writes to Firestore at all yet (see below), so this is currently
  true by construction rather than by a specific guard — but it must remain
  true if a real write step is ever added: a `claimed` restaurant's
  business-provided fields must never be silently overwritten by an import.

## What exists today

### `lib/import/` — canonical implementation

- **`types.ts`** — `ImportCandidate`, validation/duplicate-check result
  shapes, and `DuplicateMatchClassification`
  (`match` / `possible_match` / `new` / `requires_review`).
- **`validateCandidate.ts`** — checks a candidate's `name`, `citySlug`
  (against `lib/cities.ts`'s real registry), `addressLine1`, `postcode`
  (loose UK postcode shape check), `cuisineSlugs` (against
  `lib/cuisines.ts`'s real registry), `sourceType`, `sourceName`, and
  `sourceUrl` (required only for genuinely external source types — see
  `RESTAURANT-DATA-PROVENANCE.md`).
- **`duplicateDetection.ts`** — `classifyDuplicate()`. See "Duplicate
  detection design" below.
- **`runDryRun.ts`** — orchestrates the two into a per-row report with a
  `recommendedAction`.

### `functions/scripts/importRestaurantsDryRun.js` — standalone CLI

A zero-dependency, zero-build-step Node script. It is a **deliberate
standalone port** of the same logic in `lib/import/*.ts` (rather than
importing those files, which use Next.js's `@/` path alias and would need a
bundler to run outside the app) — this is a documented decision: any change
to the validation or duplicate-detection rules must be applied to *both*
`lib/import/*.ts` and this script, or they drift out of sync.

Usage:

```bash
node functions/scripts/importRestaurantsDryRun.js \
  --candidates ./my-candidates.json \
  --existing ./my-existing-export.json \
  [--out ./import-dry-run-report.json]
```

### How it actually runs — and what it deliberately does NOT do

Both `--candidates` and `--existing` are **local JSON files the operator
supplies**. Neither is ever fetched over the network or read from a live
Firestore query by this pipeline:

- `--candidates`: the restaurants being considered for import — produced
  however the operator sourced them (this pipeline has no opinion on that,
  and does not fetch them itself).
- `--existing`: a **manually-produced local export** of restaurants already
  in the directory, used only so duplicate detection has something to
  compare against. Producing this export (e.g. from the Firebase console,
  or an admin manually copying the current restaurants list) is a separate
  human step **outside this script**.

The script prints a report and, if `--out` is given, writes it to a local
file. **It never creates, updates, or deletes anything in Firestore.**
`recommendedAction: "would_create"` is exactly that — a recommendation. It
does not mean anything was created. Actually importing a row into the live
restaurants collection requires a separate, deliberate write step that
**does not exist in this repository**. Building that write step was
explicitly out of scope for this task; if/when it's built, it should:

- Use the Firebase Admin SDK from a trusted, credentialed environment (the
  same trust model as `functions/scripts/bootstrapFirstAdmin.js`) — never
  a client-side write.
- Re-run validation and duplicate detection immediately before writing
  (data can change between a dry run and the actual import).
- Refuse to touch any restaurant with `ownerClaimStatus: "claimed"`.
- Require an explicit `--apply` flag (or equivalent), defaulting to a dry
  run, matching the pattern already used by
  `functions/scripts/bootstrapFirstAdmin.js`.

## Duplicate detection design

`classifyDuplicate()` compares one candidate against the supplied existing
set using five signals:

- normalized name (lowercased, punctuation stripped, common words like
  "the"/"restaurant"/"ltd" removed)
- postcode (normalized: uppercased, whitespace stripped)
- address line (normalized: lowercased, punctuation stripped)
- phone (normalized: digits and leading `+` only)
- website domain (parsed, `www.` stripped)

### Classification rules

- **`match`** — two or more independent signals agree on the *same*
  existing record, OR a single phone/website-domain match (those two are
  specific enough on their own — an exact shared phone number or website
  domain is not a coincidence between two unrelated businesses). A `match`
  is never imported.
- **`possible_match`** — some signal fired but not a strong-enough
  combination (e.g. name matches but nothing else does). **Always** routed
  to a human — never auto-resolved either way.
- **`requires_review`** — the candidate itself doesn't carry enough
  identifying data to compare with any confidence (no postcode, phone, *or*
  website — name alone isn't enough, since names collide across an entire
  city). **Never** defaults to `new`.
- **`new`** — no signal fired against any existing record. Safe to treat as
  genuinely new, subject to `validateCandidate()` also passing.

This is deliberately conservative in one direction only: a false
`possible_match`/`requires_review` costs a human reviewer two minutes; a
false `new` creates a duplicate listing that actively confuses customers
and undermines the directory's usefulness. The design accepts the former
cost to avoid the latter.

### Smoke test

Run against sample data during this task (not committed as a fixture,
reproducible from the examples in this doc): an exact duplicate (same name,
postcode, address, phone, website) was correctly classified `match` and
recommended `skip`; a name-variant with the same postcode/address ("The
Spice House Ltd" vs. "Spice House") was also correctly caught as `match`
via the normalized-name + postcode/address combination; a candidate with no
postcode and no phone/website was correctly routed to `requires_review`
rather than guessed as `new`; a genuinely new, valid candidate was
correctly recommended `would_create`.

## What this task did not do

- Did not connect to any real data source (open dataset, licensed provider,
  or otherwise) — no source has been identified or integrated.
- Did not build the actual write/import step (see above) — dry-run
  reporting only.
- Did not run any real import, dry or otherwise, against production data.
- Did not build an admin UI for triggering imports — this is a CLI tool
  today, matching the trust model of the existing admin scripts
  (`functions/scripts/`), which all require local execution with explicit
  credentials/flags rather than a web-exposed trigger.
