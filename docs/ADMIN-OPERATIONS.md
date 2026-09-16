# Admin Operations & Restaurant Data Quality

Written for: whoever next operates or extends the admin side of London
Food Hubs. Records what Task I found by auditing the existing admin
architecture and what it added — not a design for a future rebuild. This
task is not authorization to run production imports or make production
changes; nothing here changes that. Not deployed (see
`docs/SECURITY-FOLLOWUP.md`).

## Summary: most of the admin architecture already existed

Restaurant signups, ownership claims, corrections/removals, and import
candidate review all already had working admin pages before this task —
this task did not rebuild any of them. The two real gaps closed: **no
general restaurant overview/inspection page existed** (only three narrow
queues), and **no admin UI existed at all** for
`restaurant_translation_requests`.

## Admin authorization (Phase 12) — audited, unchanged, documented precisely

Every admin page in this codebase, including the two new ones, uses the
same two-layer pattern:

1. **`useAdminGate()`** (`hooks/useAdminGate.ts`) — a client-side hook
   that reads `users/{uid}.role` via `lib/authGuard.ts`'s
   `getCurrentAccount()`/`canAccess()`. **This is a UX convenience, not a
   security boundary** — `users/{uid}.role` is a normal, client-writable
   Firestore field (any signed-in user could set their own `role` to
   `"admin"` in their own profile document), so this check alone proves
   nothing to the server.
2. **`isAdmin()`** in `firestore.rules` — `request.auth.token.admin ==
   true`, a Firebase Auth **custom claim**, settable only via the Admin
   SDK (`functions/index.js`'s `setAdminClaim` callable, or a trusted
   script) — never by any client Firestore write. **This is the actual
   security boundary.** Every admin-only read/write in this codebase is
   enforced here, independent of whether the UI shows or hides a button.

This was true before Task I and remains true after it — nothing about
this mechanism was touched, weakened, or duplicated. Both new pages
(`/admin/restaurants`, `/admin/restaurant-translation-requests`) use
`useAdminGate()` for the UI exactly like every existing admin page, and
rely on the pre-existing `isAdmin()` rule branches on `restaurants` and
`restaurant_translation_requests` for actual enforcement — no rule was
changed to support them (see "Firestore rules" below).

## Admin capability matrix

| Area | Route | Data source | Authorization | Available actions | Gaps found | Security concern |
|---|---|---|---|---|---|---|
| Operations overview | `/admin` | `sales_signups`, `orders` (existing); **`restaurants`, `restaurant_correction_requests`, `restaurant_translation_requests`, `restaurant_import_candidates` (new, Task I)** | `useAdminGate()` + `isAdmin()` | View counts, navigate | Previously had zero restaurant-marketplace visibility | None — read-only |
| Restaurant overview/inspection | **`/admin/restaurants` (new, Task I)** | `restaurants` (full collection, one-time read) | `useAdminGate()` + `isAdmin()` | Search/filter, view data-quality flags, link to public page and edit page | Did not exist before this task | None — read-only, never renders claimant PII (see "Privacy" below) |
| Restaurant signups | `/admin/restaurant-signups` | `restaurant_signups` | `useAdminGate()` + `isAdmin()` (write side: `restaurant_signups` update rule) | Mark contacted/rejected, create the live restaurant profile | None found | Unchanged, not touched |
| Ownership claims | `/admin/restaurant-claims` | **`restaurant_claims` (`status == 'pending'`) for claimant data — Task K; `restaurants` only for a display-only name lookup** | `useAdminGate()` + `isAdmin()` (the only path from a claim's `claimantUid` to `ownerUid`) | Approve/reject via one atomic `WriteBatch` updating both the private claim record and the public restaurant status | None found — already shows claimant name/role/email/phone/note (Task F), now sourced from the private collection instead of the public restaurant document (Task K, closing J-01) | None — see `docs/RESTAURANT-CLAIM-WORKFLOW.md` |
| Corrections/removals | `/admin/restaurant-claims` (same page) | `restaurant_correction_requests` | `useAdminGate()` + `isAdmin()` | Accept/reject the *request* only — never auto-edits the restaurant | None found | None — see "Corrections/removals" below |
| Translation requests | **`/admin/restaurant-translation-requests` (new, Task I)** | `restaurant_translation_requests` | `useAdminGate()` + `isAdmin()` | Advance status one step at a time, or cancel; optional admin note | **Did not exist at all before this task** | Deliberately excludes any price/payment field — see "Translation requests" below |
| Import candidate review | `/admin/restaurant-import-candidates` | `restaurant_import_candidates` (`status`-filtered) | `useAdminGate()` + `isAdmin()`; create is `allow create: if false` for every client | Approve/reject/mark duplicate/needs research; copy an approved-batch JSON for the offline apply script | None found — already thorough | None — apply remains a separate, manual, off-app script (unchanged, not run this task) |
| Restaurant profile editing | `/restaurants/[id]/edit` | `restaurants/{id}` | Owner (`ownerUid` match) or admin — see `docs/RESTAURANT-OWNER-WORKSPACE.md` | Full profile/menu edit | None found | Unchanged, not touched — both new admin pages link here rather than duplicating edit UI |
| Destructive actions | — | — | — | **None added.** No page (existing or new) offers a restaurant/candidate/request delete button. | — | See "Safe admin actions" below |

## Admin operations overview (Phase 3)

`/admin`'s existing SmartServeUK operations dashboard (orders today,
revenue, sales leads — all pre-existing, untouched) now also shows a
**Restaurant Marketplace** section: total restaurants, unclaimed, pending
claims, claimed count derived internally, pending corrections, pending
translation requests, and staged import candidates awaiting review, plus
a banner linking to `/admin/restaurants` when any restaurant has a
data-quality flag. Every count comes from data already fetched for a
genuine operational purpose (the same collections the dedicated queues
already query) — nothing was added purely for decoration, and no new
aggregation/analytics infrastructure was built. Restaurant counts use one
`onSnapshot` listener on the whole `restaurants` collection (appropriate
for a single-city launch's size) plus three status-filtered listeners for
the three pending queues — six live listeners total on this page,
consistent with the two the page already had.

## Restaurant overview / inspection (Phase 4)

New: `/admin/restaurants`. One-time read of the full `restaurants`
collection (admin's `isAdmin()` rule branch grants this regardless of
`status`, unlike the public read rule which only exposes
`active`/`pending`). Supports free-text search (name, city, hub/area,
cuisine, postcode — see `restaurantMatchesAdminSearch()` in
`lib/adminRestaurantOverview.ts`), an ownership-state filter, a `status`
filter, and a "has data-quality flags" toggle. Each row links to the
public listing and to the existing edit page — **no new restaurant-editing
UI was built**; editing continues to happen exactly where it already did.

## Data-quality signals (Phase 5)

`lib/adminDataQuality.ts`'s `assessRestaurantDataQuality()` — a pure,
deterministic function, **not a score**. Every flag is a plain "is this
already-existing field empty" check:

| Flag | Condition |
|---|---|
| Missing name | `name` empty |
| Missing address | both `fullAddress` and `postcode` empty |
| Missing description | `shortDescription`, `longDescription`, and the legacy `description` all empty |
| Missing cuisine | `cuisine` empty AND `cuisineSlugs` has no entries |
| Missing contact info | both `phone` and `email` empty |
| Missing opening hours | `openingHoursText` empty |
| Missing image | both `coverImage` and `imageUrl` empty |
| No menu | every `menuCategories` entry has zero items |
| No hub/area | both `hubName` and `area` empty |
| Unclaimed | `ownerUid` empty |
| Provenance needs review | `dataConfidence` is `"unverified"` or `"flagged"` |

No AI, no weighting, no 0–100 number. An admin decides what a flag means
for a given restaurant — this only surfaces the facts. Unit-tested (see
"Tests" below).

## Claim operations (Phase 6)

**Not rebuilt — verified and reconfirmed.** `/admin/restaurant-claims`
already shows claimant name, role, business email, phone, and
verification note (added in Task F; sourced from the private
`restaurant_claims` collection rather than the public restaurant document
since Task K's privacy fix — see `docs/PRODUCTION-READINESS-AUDIT.md`'s
"J-01"), and already enforces approve/reject exclusively through
`isAdmin()` rule branches on both collections — no automatic approval
exists or was added, and no identity-document verification was built
(unchanged, per this task's own instruction not to add it). The new
`/admin` overview and `/admin/restaurants` pages both
link directly to this queue whenever a pending claim exists, closing the
one real navigation gap (previously reachable only via one static card on
`/admin`, with no count or signal anywhere else).

## Correction / removal operations (Phase 7)

Audited, unchanged:

- **Who may submit**: any signed-in user (not anonymous — see
  `docs/RESTAURANT-CLAIM-WORKFLOW.md`'s "Why anonymous submission isn't
  supported").
- **What's collected**: `restaurantId`, `requestType`
  (`correction`/`removal`), `submittedByUid`/`submittedByEmail`, and a
  free-text note (`suggestedValueNote` or `reasonNote`).
- **Where reviewed**: `/admin/restaurant-claims`, in its own section
  below the claims queue.
- **What accept/reject means**: **informational/manual only.** Accepting
  a request updates only the request document's own `status` — it
  **never** automatically edits or deletes the restaurant. An admin who
  accepts a request is expected to make the actual change themselves,
  by hand, on the restaurant's edit page afterward. There is no
  automatic deletion from an unauthenticated (or any) correction/removal
  request — confirmed unchanged this task.

## Translation request operations (Phase 8) — the one page built from scratch

**Did not exist as an admin surface at all before this task** — confirmed
by a repo-wide search in Task E and reconfirmed here. New:
`/admin/restaurant-translation-requests`.

What it does: lists requests, filterable by status, and lets an admin
advance a request one step through the architecture's own sequence
(`REQUESTED → QUOTED → PAYMENT_PENDING → IN_TRANSLATION → OWNER_REVIEW →
PUBLISHED`), or cancel it from any non-terminal state. An optional
free-text admin/ops note (`notes`, already part of the data model, never
shown publicly) can be attached at any step.

**What it deliberately does not do, and why**:

- **No quote-amount or currency input field.** `quotedAmount`/
  `quotedCurrency` remain part of the data model (Task D built them as
  plain, admin-filled, never-computed-or-charged values), but this task's
  UI does not expose a form field for them. Given "do not introduce
  pricing" is listed among this task's non-negotiable safety rules (not
  just a phase instruction), the conservative reading — build the status
  workflow, leave price entry outside this task's surface entirely — was
  chosen deliberately, even though the rules would technically permit an
  admin to set these fields through this page. Setting a quote amount
  today still requires a direct data write outside this UI. A future task
  that's explicitly scoped to pricing/payment would be the right place to
  add that field, with its own deliberate review.
- **No payment processing of any kind** — no Stripe, no payment
  gateway, no charge logic. Confirmed by a static test (see "Tests").
- **No automatic translation generation** — nothing in this page or
  anywhere else calls a translation API or generates text.
- **Marking a request `PUBLISHED` never writes to
  `restaurants/{id}.contentTranslations`.** This matches
  `firestore.rules`' own existing comment on this collection: reaching
  `PUBLISHED` in the request is a workflow-tracking fact only. Making a
  translation actually appear on the public listing remains a separate,
  deliberate admin edit to the restaurant document — **and no UI exists
  for that edit either**, on this page or anywhere else. This is an
  honest, documented gap, not a silent one: an admin who marks a request
  `PUBLISHED` today still has to go edit
  `restaurants/{id}.contentTranslations` by hand (e.g. via the Firebase
  console) to actually make the translation live. Building that editor
  was not requested and was not attempted.

## Import candidate operations (Phase 9)

**Not rebuilt — reconfirmed thorough.** `/admin/restaurant-import-candidates`
already shows candidate identity, address, source/provenance
(`sourceType`/`sourceName`), cuisine classification status and slugs,
duplicate-match classification, declared dietary attributes, and a review
note, with status transitions to `APPROVED`/`REJECTED`/`DUPLICATE`/
`NEEDS_RESEARCH`, plus an `IMPORTED` filter tab (set only by the separate,
manual `applyApprovedImportBatch.js` script — confirming whether a
candidate has already been applied is already possible via this existing
status). **Apply was not run.** No production Firebase project was
connected. No restaurant was imported into production. The stage → review
→ apply separation is unchanged: candidates can only ever be created by
the Admin-SDK staging script (client `create` is `allow create: if
false` for everyone, including admins), and only the offline apply
script — never this page — ever promotes an `APPROVED` candidate into a
real `restaurants/{id}` document.

## Provenance / data confidence (Phase 10)

`sourceType`, `sourceName`, `dataConfidence` are now visible on the new
`/admin/restaurants` overview (as compact badges) in addition to their
existing visibility on the import-candidates queue and the public
`PublicListingNotice` (which shows `sourceType`/`sourceName`/
`ownerClaimStatus` only — never `dataConfidence`, `sourceUrl`, or
`sourceRetrievedAt`, unchanged from Task H's audit). No owner-facing UI
was given the ability to alter any provenance field — Task G's
firestore.rules fix (pinning these fields on the owner-update branch)
remains in force and was not touched.

## Restaurant ownership visibility (Phase 11)

`lib/adminRestaurantOverview.ts`'s `deriveOwnershipDisplayState()` maps a
restaurant to exactly one of `claimed` / `claim_pending` /
`claim_rejected` / `unclaimed`, with `ownerUid` always winning over a
possibly-stale `ownerClaimStatus` — the same authoritative-ownership
principle established in Tasks F/G, applied here as a *display* helper
only (no second ownership model, no new stored field). Used on both the
new `/admin/restaurants` page and the `/admin` overview counts.
Claimant contact details (name/email/phone/note) are **not** shown on
either — those stay on `/admin/restaurant-claims`, confirmed by a static
test (see "Tests").

## Privacy / security (Phase 16)

No customer-facing route was touched by this task. The two new lib
modules (`lib/adminDataQuality.ts`, `lib/adminRestaurantOverview.ts`) are
confirmed, by a static test, to be imported only from `app/admin/*`. No
Firestore rule was broadened. Admin visibility of provenance/ownership
data is unchanged in scope from what `isAdmin()` already granted before
this task — the new pages surface more of what was already readable by
an admin, not anything newly exposed.

## Safe admin actions (Phase 13)

Both new admin pages follow the same conventions already established
across this codebase's admin surfaces:

- Every write is a narrow `updateDoc()` with an explicit field list —
  never a full-document overwrite.
- Every action button is disabled while a request for that specific row
  is in flight (`actioningId`/`busy` pattern), preventing double-click
  duplicate writes.
- Every write is wrapped in try/catch; failures log to the console and
  show a short, generic message — never a raw Firebase error string.
- **No delete/destructive action was added anywhere.** The translation-
  requests page's "Cancel" is a status change, not a deletion, and (like
  every other status-change button in this codebase's admin pages) has
  no confirmation dialog — consistent with existing convention, not a
  new gap.
- No admin action in this task overwrites a protected field — the
  translation-request status buttons only ever set `status`, the
  matching timestamp field, and the free-text `notes` field.

## Four-language / platform-language policy (Phase 15)

Admin interfaces remain outside the `app/[locale]` tree, English-only,
consistent with every existing admin/operational page (`/admin/*`,
`/restaurants/[id]/edit`, `/staff/*`, etc.) — this was true before Task I
and was not changed. No customer-facing string was added or modified by
this task, so EN/BN/AR/FR message-catalog parity is unaffected (unchanged
key count, see "Validation").

## Firestore rules (Phase 18)

**No rule was changed by this task.** Every action this task's new UI
performs was already permitted by an existing `isAdmin()` branch:
`restaurants` (read, for the overview), `restaurant_translation_requests`
(read + the already-unrestricted-for-admins update), and the pre-existing
`restaurant_correction_requests`/`restaurant_import_candidates` rules
(read-only, unmodified, used by the new dashboard counts). No unresolved
SmartServeUK collection policy from Task E was touched.

**(Later, Task K)** the `/admin/restaurant-claims` page's own rules *did*
change, as part of fixing the claimant-PII exposure this document's
"Privacy" section already flagged as a concern — see
`docs/RESTAURANT-CLAIM-WORKFLOW.md` and
`docs/PRODUCTION-READINESS-AUDIT.md`'s "J-01". That change is unrelated to
anything this task (I) built.

## Tests (Phase 17)

New, executable in this environment (no Java/emulator required):

- `tests/admin-operations/run-data-quality-tests.ts` — **12/12
  passing**. Covers: a fully complete restaurant has zero flags; a bare
  restaurant flags every applicable check; a menu with only empty
  categories still counts as `no_menu`; either phone or email alone
  satisfies the contact check; `dataConfidence` "flagged"/"unverified"
  trigger `provenance_needs_review`, "verified" does not; `ownerUid`
  always wins over a stale claim status; the admin search predicate
  matches only on intended fields.
- `tests/admin-operations/run-content-policy-tests.ts` — **4/4
  passing**. Static source-inspection guards: the translation-requests
  page's actual code (comments stripped) never references
  `quotedAmount`/`quotedCurrency` or any payment-adjacent vocabulary;
  it never touches `contentTranslations`; the admin-only lib modules are
  never imported outside `app/admin`; the restaurant overview page never
  renders claimant PII fields.

No Firestore rules were changed, so no new rules tests were needed.
Existing rules tests remain unexecuted in this environment (Java
unavailable) — unchanged from Tasks E through H, see
`docs/FIRESTORE-SECURITY-AUDIT.md`.

## Known limitations / unresolved business-policy questions

- **No UI exists to actually publish a translation** (write
  `restaurants/{id}.contentTranslations`) — a genuine gap, documented
  rather than guessed at or silently left implicit. Building it would
  need its own scoped task (what text goes where, who authors/reviews
  it, how a partial-locale translation is represented in the form).
- **No quote-amount entry UI** — deliberately excluded this task; see
  "Translation request operations" above. Whoever eventually owns
  pricing/payment for this feature should treat that as its own task,
  not an extension of this one.
- **Corrections/removals resolution is manual by design** — an admin
  must still make the actual restaurant edit by hand after accepting a
  request. Whether this should ever become semi-automated (e.g.
  pre-filling the edit form from the suggested value) is an open product
  question, not attempted here.
- **The `hubName` vs. `hubIds` ambiguity** (flagged in Task G, reconfirmed
  in Task H) is unchanged — the new admin overview displays `hubName`
  only, matching the same field the rest of the app actually uses.
- **`/admin/restaurant-import-candidates`'s own field visibility** (e.g.
  `sourceUrl`, `duplicateSignals`, `dietaryDeclarationBasis` detail) was
  judged already sufficient for launch and left as-is — expanding it
  further wasn't necessary this task.
