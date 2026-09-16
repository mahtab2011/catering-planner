# Firestore Security Audit — Task E

Written for: whoever decides when `firestore.rules` is safe to deploy. This
is a synthesis/verification pass, not a redesign — it inspects what already
exists (`firestore.rules`, `docs/FIRESTORE-COLLECTION-INVENTORY.md`,
`docs/SECURITY-FOLLOWUP.md`, `tests/firestore-rules/`), closes two real gaps
found during inspection (a test-harness dependency conflict and two missing
test cases), and records exactly what was and wasn't verified. It does not
replace `docs/FIRESTORE-COLLECTION-INVENTORY.md` (the authoritative,
file-by-file trace of every collection's application-code access pattern) —
read that one for the "why" behind each collection's classification below.

**Firestore rules were NOT deployed as part of this audit, and this document
does not certify them ready for deployment.** See "Deployment readiness" at
the end.

## Collections audited

All 30 collections currently referenced anywhere in this codebase were
re-enumerated directly from source (not from memory of the prior inventory
doc) via a repo-wide search for `collection(db, "...")` / string-literal
collection name references across `app/`, `lib/`, `components/`, and
`functions/`. This matched the existing `docs/FIRESTORE-COLLECTION-INVENTORY.md`
inventory exactly, plus the two collections added since that document was
written (`restaurant_import_candidates`, `restaurant_translation_requests`,
both already documented in `firestore.rules`'s own header and in
`docs/RESTAURANT-IMPORT-PIPELINE.md` / `docs/MULTILINGUAL-ARCHITECTURE.md`).
No drift was found — no collection is referenced in application code without
also appearing in `firestore.rules` or the inventory's
`REQUIRES MANUAL POLICY DECISION` section.

Notably confirmed: **no client-side code anywhere references
`restaurant_translation_requests`** — grep across `app/`, `lib/`,
`components/` returns zero matches. This confirms Task D's own claim that
only the data architecture and Firestore rules were built, with no request
UI — there is currently no way for a real user to create one of these
documents except directly through the Firestore SDK (gated by the rule) or
an Admin SDK script (none exists yet either).

## Security matrix

| Collection | Public read | Auth'd customer read | Owner read | Owner write | Admin read | Admin write | Server/Admin SDK | Ownership mechanism | Ambiguity |
|---|---|---|---|---|---|---|---|---|---|
| `restaurants` | active/pending only | same | own doc (any status) | profile fields only; `ownerUid`/`citySlug`/`rating`/`reviewCount`/`isFeatured`/`isApproved` pinned; blocked-status transitions denied both ways | yes | yes, unrestricted | `functions/index.js` `onReviewWrite` updates `rating`/`reviewCount` via Admin SDK (bypasses rules) | `ownerUid` field, cross-checked, never client-settable once set | none — reviewed and tested |
| `reviews` | approved only | own (any status) + approved others | n/a | own review, content only, while still `pending`; can never touch moderation fields or re-approve self | own + all | yes (moderation fields only, content pinned) | `onReviewWrite` (Admin SDK, rating aggregate) | `userId` field | none |
| `restaurant_correction_requests` | no | own only | n/a | create only, moderation fields blocked at create | yes | yes | none | `submittedByUid` | none |
| `restaurant_import_candidates` | no | no | n/a | **no client create at all, including admin** | yes | yes (status/review fields) | `functions/scripts/stageImportCandidates.js` (create), `applyApprovedImportBatch.js` (promotes to `restaurants`) — both Admin SDK, bypass rules entirely | none (Admin-SDK-only collection by design) | none |
| `restaurant_translation_requests` | no | no | own requests only | create only, in status `REQUESTED`, cross-checked against the target restaurant's real `ownerUid` via `get()`; no price/payment fields settable at create | yes | yes, but `restaurantId`/`requestedByUid` pinned on update | none yet (no Admin SDK script exists for this collection) | `requestedByUid`, cross-checked against `restaurants/{id}.ownerUid` | Admin can move `status` to any value in any order (no state-machine enforcement in rules) — see "Documented, not fixed" below |
| `restaurant_signups` | no | own only | n/a | create as self, status forced to `new` | yes | yes | none | doc id == uid | none |
| `users` | no | own only | n/a | own profile, `role` pinned | yes | yes | none | doc id == uid | none |
| `articles` | published only | same | n/a | admin-only | yes | yes | none | n/a (editorial, not owned) | none |
| `recommendations` | active only | same | n/a | admin-only | yes | yes | none | n/a | none |
| `staff` (SmartServeUK) | no | no | own (`ownerUid`) | own | yes | yes | none | `ownerUid` | app has no role gate beyond "signed in," but data isolation itself is sound (see inventory doc) |
| `customers` (SmartServeUK) | no | no | own (`bossUid`) | own | yes | yes | none | `bossUid` | none |
| `events` (SmartServeUK) | no | no | own (`bossUid`) | own | yes | yes | none | `bossUid` | one legacy dashboard skips a role check but still filters by `bossUid` — feature-appropriateness gap, not a data leak |
| `sales_signups` | create only | n/a | n/a | n/a | yes | yes | none | none needed (lead form) | none |
| `blackcab_*` (early_access/bookings/journey_ratings/concerns) | create only | n/a | n/a | n/a | yes | yes | none | none needed (lead/booking forms) | `app/admin/blackcab-leads/page.tsx` has no app-level gate (pre-existing, BlackCab code, not touched — see inventory doc); the Firestore rule itself still closes the data-layer exposure regardless |
| `blackcab_signups`, `catering_house_signups`, `customer_signups`, `supplier_signups` | no | own only | n/a | create as self | yes | yes | none | doc id == uid | no admin review UI reads these at all yet (dead-end collections today, but the rule is still correctly scoped) |
| `blackcabs`, `blackcab_drivers` | no | no | own | own | yes | yes | none | doc id == uid | none |
| `riderCorrectionLogs` | no | no | n/a | create only (`ownerUid` self-scoped) | n/a | yes (read/update/delete) | none | `ownerUid` on create; **read is intentionally NOT covered** | `app/orders/rider-corrections/page.tsx` reads the whole collection unscoped — deploying this rule as-is would break that page (see inventory doc) |
| `orders`, `counters`, `riders`, `rider_signups` (read), `suppliers`, `supplier_items`, `supplier_orders`, `catering_houses`, `ingredients`, `activity_logs` (read) | **NOT COVERED — default deny** | — | — | — | — | — | — | — | genuinely undecidable from code alone; see `docs/FIRESTORE-COLLECTION-INVENTORY.md`'s `REQUIRES MANUAL POLICY DECISION` section, unchanged by this audit |
| everything else (e.g. `promotions`, referenced nowhere in code) | **NOT COVERED — default deny** | — | — | — | — | — | — | — | no application code found referencing it |

Menu items: confirmed via `firestore.rules`'s own comment and a source read
that menu data (`menuCategories`) lives inline on the `restaurants` document,
not a separate collection — the `restaurants` update rule already covers
menu edits, there is nothing separate to audit.

## Documented, not fixed (ambiguous — per Phase 4, not guessed at)

- **`restaurant_translation_requests` admin update has no state-machine
  enforcement.** The rule allows an admin to move `status` to any value in
  any order (e.g. straight from `REQUESTED` to `PUBLISHED`, skipping
  `QUOTED`/`PAYMENT_PENDING`/`IN_TRANSLATION`/`OWNER_REVIEW`), and to set
  `publishedAt` without any corresponding write ever having happened to
  `restaurants/{id}.contentTranslations`. This is consistent with every
  other admin-write branch in this file (admins are already fully trusted
  elsewhere — e.g. they can set a restaurant straight to `blocked` with no
  intermediate state, or approve a review with no review-of-the-review
  step) — so this was **not** treated as a defect and **not** changed. If a
  stricter admin-side state machine is wanted, that is a product decision
  outside this audit's "fix only unambiguous defects" scope.
- **The 10 `REQUIRES MANUAL POLICY DECISION` collections** from the prior
  inventory (`orders`/`counters`, `riders`, `rider_signups` read scope,
  `suppliers`, `supplier_items`, `supplier_orders`, `catering_houses`,
  `ingredients`, `activity_logs` read scope) remain exactly as documented —
  this audit re-confirmed via source search that the underlying application
  code has not changed since that document was written, so the blockers
  still stand. No new policy decision was made for any of them.
- **`riderCorrectionLogs` read scope** remains undecided for the same
  reason: `app/orders/rider-corrections/page.tsx` still reads the whole
  collection with no filter, so any read rule tighter than "admin only"
  (already in place) would need that page fixed first.

## Tests added this session

`tests/firestore-rules/rules.test.js` already had comprehensive coverage
(60+ cases) for every collection above from prior sessions, including both
new collections. Two real coverage gaps were found and closed:

1. **`restaurant_translation_requests` — cross-restaurant-owner read
   denial.** The existing test only checked that an unrelated signed-in
   user (`random-user`, who owns nothing) can't read another restaurant's
   translation request. Added a stricter case: a *different, verified*
   restaurant owner (who owns their own real restaurant, `owner-2` of
   `r-translate-2`) still cannot read `owner-1`'s request for
   `r-translate-1` — confirming the rule scopes on `requestedByUid`, not on
   "any restaurant owner may read any request."
2. **`restaurant_translation_requests` — protected-field manipulation on
   admin update.** No test previously exercised the `unchanged('restaurantId')`
   / `unchanged('requestedByUid')` guards on the admin update branch. Added
   a case confirming an admin cannot reassign either field via update, even
   while otherwise legitimately progressing the workflow (e.g. to
   `QUOTED`).

No other gap met the bar for "obvious, high-confidence" — see "Documented,
not fixed" above for what was found but deliberately left alone.

## Commands executed (exact)

```
git rev-parse --show-toplevel
git branch --show-current
git rev-parse HEAD
git status --short
git remote -v
git merge-base --is-ancestor 1f3b35d HEAD
git merge-base --is-ancestor 26874fe HEAD
npx tsc --noEmit
npm run lint
java -version
npx --no-install firebase --version
cd tests/firestore-rules && npm install
npx firebase emulators:exec --only firestore "npm test"      # README's documented command — confirmed broken, see below
npx --yes firebase-tools --version
npx --yes firebase-tools emulators:exec --only firestore "npm test"
npm audit
node --check tests/firestore-rules/rules.test.js
```

## Exact results

- `git status --short` at start: clean; HEAD exactly `26874fe720652cde4ddfa764b6ed146827888e8b` as expected.
- `npx tsc --noEmit`: clean, no errors.
- `npm run lint`: 681 pre-existing problems (539 errors, 142 warnings) across the wider codebase — all pre-existing, none in any file this audit touched, not caused by or fixed in this task (out of scope: "do not perform unrelated refactoring").
- `java -version`: `bash: java: command not found`.
- `npx --no-install firebase --version`: fails (`could not determine executable to run`) — confirms no `firebase-tools` is available without a network fetch.
- `cd tests/firestore-rules && npm install`: **initially failed** with `ERESOLVE unable to resolve dependency tree` — `@firebase/rules-unit-testing@^3.0.4`'s peer dependency (`firebase@^10.0.0`) conflicts with this repo's actual `firebase@^12.8.0`. This is a real defect: the test harness as committed could never have installed cleanly, in this sandbox or anywhere else, against this repo's Firebase SDK version. **Fixed** by bumping `tests/firestore-rules/package.json`'s `@firebase/rules-unit-testing` to `^5.0.2` (whose peer range is `^12.0.0`, matching this repo exactly). Re-ran `npm install`: succeeded, 131 packages installed, `package-lock.json` generated.
- `npx firebase emulators:exec --only firestore "npm test"` (the command the README documented before this audit): **fails** — `npm error could not determine executable to run`. Root cause: `npx firebase` resolves the local `firebase` devDependency (the JS SDK, which has no CLI binary) instead of fetching `firebase-tools` (the actual CLI package). This was a real defect in the README's own instructions, now fixed (README updated to document `npx firebase-tools emulators:exec ...` instead).
- `npx --yes firebase-tools --version`: succeeds, `15.30.1`, confirming the correct package is fetchable.
- `npx --yes firebase-tools emulators:exec --only firestore "npm test"`: **fails** with the precise, expected message: `Error: Could not spawn `java -version`. Please make sure Java is installed and on your system PATH.` (Preceded by a harmless "not currently authenticated" warning — expected, no `firebase login` is needed or was performed for local emulator use; no real Firebase project or credentials were touched.)
- `npm audit` (inside `tests/firestore-rules`, dev-only harness dependencies, never shipped to production): 5 vulnerabilities (3 moderate, 1 high, 1 critical), all transitive through `vitest@2.x`'s bundled `vite`/`esbuild` dev-server tooling (path traversal / arbitrary file read in the *Vitest dev server*, not in application code or in anything that runs against production). A fix is available only via a breaking `vitest@5` upgrade, which was **not** applied — out of scope for a security-rules audit, and untestable here anyway without Java to confirm the suite still passes after the bump. Flagged for a future, separate task.
- `node --check tests/firestore-rules/rules.test.js`: syntax OK, both new times it was checked (after the two new test cases, and after the header-comment update).

## Did the full emulator suite actually run?

**No, as of Task E — this has since changed. See "STATUS UPDATE (Task L)"
immediately below; the rest of this section is preserved as Task E
originally wrote it, for an accurate historical record.**

**No.** The Firestore emulator itself could not start — `java` is not
installed in this environment (`command not found`), confirmed both via a
direct `java -version` check and via the emulator's own startup failure.
This is an environment limitation, not a rules or test-code problem: the
test harness now installs cleanly (previously it did not, due to the
version-conflict defect fixed above) and every test file passes a syntax
check, but **zero test cases have ever actually executed against the real
rules engine**, in this session or any prior one. Nothing in this
repository claims otherwise.

### STATUS UPDATE (Task L) — the suite has now run, for real

Task L (2026-09-16) installed a local, portable Eclipse Temurin 21.0.12.1+1
JDK (no admin rights required, authorized specifically for this purpose)
and executed the exact command below for the first time in this project's
history, from `tests/firestore-rules`:

```
npx firebase-tools emulators:exec --only firestore "npm test"
```

Result: the Firestore Emulator genuinely started (`Firestore Emulator was
started in standard edition`), and **105/105 tests passed** across all 15
top-level test suites (every London Food Hubs collection covered by this
file, plus every SmartServeUK collection: `staff`, `customers`/`events`,
`sales_signups`, `blackcab_early_access`, `users`, `reviews`, `articles`,
`recommendations`). No rule defect was found; no rule text needed to
change. This supersedes the "zero test cases have ever actually executed"
statement above — that was true when Task E wrote it and is no longer
true. **This is local emulator verification, not production deployment**
— `firestore.rules` has still never been deployed to any real Firebase
project; see `docs/PRODUCTION-READINESS-AUDIT.md`'s "STATUS UPDATE
(Task L)" for the full detail and the J-01/J-02 status update.

## Unresolved SmartServeUK compatibility questions

Unchanged from `docs/FIRESTORE-COLLECTION-INVENTORY.md` — this audit did
not find anything that resolves them, and did not attempt to guess:

- `orders`/`counters`: kitchen/ready/search/delivery pages have zero auth
  checks; guest checkout and the order-tracking-by-id page are intentionally
  open. Deploying any rule here requires an application-code decision first.
- `riders`: `app/riders/page.tsx` does unfiltered read/write with no auth,
  contradicting the ownerUid-scoped pattern used by every other rider page.
- `rider_signups` (read): restaurant/staff review page has no per-restaurant
  filter — cross-restaurant visibility of rider applications may or may not
  be intentional.
- `suppliers`, `supplier_items`, `catering_houses`, `ingredients`: fully
  unauthenticated read/write in application code today; unclear whether
  that's intentional (shared platform data) or a gap.
- `supplier_orders`: writes have no owner field at all — needs an
  application-code change before any rule can scope it.
- `activity_logs` (read): unfiltered read with no auth, while writes are
  already `bossUid`-scoped.
- `riderCorrectionLogs` (read): unfiltered read in
  `app/orders/rider-corrections/page.tsx`; the rule (admin-only read) would
  break that page as currently written if deployed.
- `app/create-account` bypasses every approval-staging flow for 7 roles —
  a pre-existing, separate finding from the inventory doc, not something
  this Firestore-rules audit can resolve on its own.

## Deployment readiness

**Rules are still NOT considered ready for a deployment decision — but the
reason has narrowed.** As of Task L, the rules have been genuinely
emulator-verified (105/105 passed locally); the remaining blockers are the
undecided SmartServeUK collections below and the separate, explicit
authorization deployment itself would require:

- The rules file itself looks internally consistent and was re-read in
  full during this audit; no unambiguous defect was found beyond the two
  test-coverage gaps closed above.
- **(Task L, 2026-09-16)** Every test in `tests/firestore-rules/` has now
  actually run against the real local rules engine — 105/105 passed, zero
  rule changes required. This is no longer static analysis only. See the
  "STATUS UPDATE (Task L)" section above for the full result.
- 10 collections remain genuinely undecidable and would go from
  "unprotected today" to "fully denied, including to admins" the instant
  these rules deploy — some of those (`orders`, `riders`) back
  currently-working, unauthenticated operational pages. Deploying without
  resolving those first would break live SmartServeUK functionality. Task
  L deliberately did not attempt to resolve these — they are business/
  application-code policy questions, not rule defects, and resolving them
  was explicitly out of Task L's scope.
- Before any real deployment decision: resolve or explicitly accept each
  of the 10 undecided collections, then obtain separate explicit
  authorization for `firebase deploy --only firestore:rules` against the
  correct production project — see
  `docs/LONDON-FOOD-HUBS-LAUNCH-CHECKLIST.md` for the full ordered
  sequence. Local emulator verification (now done) was a prerequisite for
  that decision, not a substitute for it.
