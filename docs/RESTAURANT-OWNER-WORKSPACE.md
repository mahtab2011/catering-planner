# Restaurant Owner Management Workspace

Written for: whoever next touches restaurant-owner-facing functionality
(the edit page, a future dashboard, or the Firestore rules governing
either). Records what Task G found by auditing the existing workspace and
what it changed — not a design for a future rebuild. Not deployed (see
`docs/SECURITY-FOLLOWUP.md`).

## Summary: a workspace already existed

`app/restaurants/[id]/edit/page.tsx` is a pre-existing, functional
restaurant-management page — this task did not build a parallel system.
It already covered nearly everything Task G asked for: profile fields,
opening hours, service options, dietary/cuisine tagging, owner free-text
tags, and a full inline menu builder, all gated by the correct
authoritative ownership check. Task G's job was mostly **audit,
document, and close one real gap** (below), not build new UI.

## Access requirements & the authoritative ownership mechanism

Exactly one fact grants management access:

```
restaurant.ownerUid === <signed-in user's uid>
```

(or the signed-in user is an admin, via the `isAdmin()` Firebase Auth
custom claim — never the client-writable `users/{uid}.role` field).

`ownerClaimStatus` and `claimantUid` (see `docs/RESTAURANT-CLAIM-WORKFLOW.md`)
are claim **workflow state**, not authorization — a `claim_pending` or
`claim_rejected` restaurant grants no management access to anyone but an
admin, regardless of who the claimant is or was. This was already true
before Task G (confirmed, not changed) and is now backed by an explicit
pure-function unit test suite (see "Tests" below) in addition to the
existing Firestore rule.

This logic is extracted into `lib/restaurantOwnership.ts`'s
`deriveManagementAccess()` (Task G) — a straight, behavior-preserving
extraction of the edit page's pre-existing inline gate logic, done so it
could be unit tested without a browser or Firebase. **This function is a
UI-convenience mirror, not the security boundary** — the real boundary is
the `restaurants/{restaurantId}` `update` rule in `firestore.rules`,
independently enforced regardless of what the UI shows or hides.

Verified states (unit-tested in `tests/restaurant-owner-workspace/run-ownership-tests.ts`,
and the claim-status-independence half already covered by Task F's
Firestore rules tests):

| Viewer | Can manage? |
|---|---|
| Approved owner (`ownerUid` matches) | Yes |
| Admin | Yes, always, including a blocked restaurant |
| Pending claimant | No |
| Rejected claimant | No |
| Unrelated authenticated user | No |
| Owner of a *different* restaurant | No (only for that other restaurant) |
| Owner, but restaurant is `status: 'blocked'` | No — admin must unblock first |
| Anyone, unclaimed restaurant (`ownerUid` empty) | No — admin-only until claimed |

## Field / capability matrix

Every field the workspace touches, its live Firestore name, where it's
edited, what enforces access, where it's shown publicly, and its
classification. "Owner-supplied" fields must never be auto-translated —
see "Platform vocabulary vs. restaurant-supplied content" below.

| Field | Editable by owner? | Validation | Public display | Classification |
|---|---|---|---|---|
| `name` | Yes | Non-empty, ≥2 chars | `<h1>`, cards | Owner-supplied |
| `slug` | No (derived from `name`, read-only in UI) | — | URL | Derived |
| `ownerName` | Yes | None | Not shown | Owner-supplied |
| `phone` / `email` | Yes | None | Contact section | Owner-supplied |
| `hubId` / `hubName` / `area` / `locationId` / `fullAddress` / `postcode` | Yes | None | Location section | Owner-supplied |
| `cuisine` (free text) | Derived from `cuisineSlugs` selection | — | Legacy display fallback | Derived |
| `cuisineSlugs` / `primaryCuisineSlug` | Yes, via checkboxes | Must be from `lib/cuisines.ts`'s canonical list | Cuisine badges, filters | **Platform vocabulary** |
| `tags` | Yes, free text (comma-separated) | None | Card/detail "owner tags" | **Owner-supplied — never translated** |
| `priceRange` | Yes, from a fixed `£`/`££`/`£££` select | Enum | Card/detail | Platform vocabulary (small closed set) |
| `shortDescription` / `longDescription` | Yes | `shortDescription` ≥12 chars required before `status: 'active'` | Detail page | **Owner-supplied — never translated** (unless an approved `contentTranslations` entry exists — see below) |
| `popularItems` | Yes, free text (comma-separated) | None | Detail page | Owner-supplied |
| `coverImage` / `videoUrl` | Yes, plain URL text field | None | Cover image / video embed | Owner-supplied URL (see "Media" below — no upload) |
| `websiteUrl` / `facebookUrl` / `instagramUrl` / `tiktokUrl` | Yes, plain URL text fields | None | Detail page links | Owner-supplied |
| `openingHoursText` | Yes, free text | None (required before `status: 'active'`) | Detail page | Owner-supplied |
| `dineIn` / `takeaway` / `delivery` / `collectionEnabled` | Yes, checkboxes | Boolean | Detail page | Platform vocabulary (fixed set) |
| `isHalal` / `isHmcApproved` | Yes, checkboxes | Boolean | Badges | Platform vocabulary |
| `dietaryAttributes` | Yes, checkboxes | Must be from `lib/dietary.ts`'s canonical `DIETARY_ATTRIBUTES` | Dietary badges (translated label, canonical key stored) | **Platform vocabulary** |
| `isPremium` / `subscriptionPlan` / `offersEnabled` / `loyaltyEnabled` / `adsEnabled` | Yes | None | Not publicly rendered today | Owner-supplied (pre-existing scaffolding — see `docs/RESTAURANT-CLAIM-WORKFLOW.md`'s "Owner upgrade path"; no pricing/payment exists) |
| `status` | Yes, from `draft`/`active`/`pending` (not `blocked` — admin-only) | Must pass a readiness checklist to reach `active` | Governs public visibility (`firestore.rules`) | System/workflow — owner-controlled within limits |
| `menuCategories` | Yes, full CRUD via the Menu Builder | Empty categories/items dropped on save | Detail page menu | **Owner-supplied — never translated** |
| `lastVerifiedAt` | Set automatically on every save | — | Not shown directly | System — intentionally owner-triggered (saving counts as reverifying) |
| **`ownerUid`** | **No** | Rule-pinned | — | Administrative — set only by admin claim approval |
| **`citySlug`** | **No** | Rule-pinned | — | Administrative |
| **`rating` / `reviewCount`** | **No** | Rule-pinned | Star rating | System — Cloud Function (Admin SDK) only |
| **`isFeatured` / `isApproved`** | **No** | Rule-pinned | Featured placement | Administrative |
| **`ownerClaimStatus`** | **No — Task G fix, see below** | Rule-pinned | Public claim-state UX (unclaimed/pending/claimed/rejected) | Administrative workflow state |
| **(retired — Task K)** `claimantUid` / `claimSubmittedAt` / `claimDecidedAt` / `claimDecidedBy` / `claimantName` / `claimantRole` / `claimantContactEmail` / `claimantContactPhone` / `claimantNote` | N/A — no longer fields on this document at all | Structurally blocked (`restaurantDocHasNoClaimantPii()`) | N/A | Moved to the private `restaurant_claims` collection after an audit found this document's public readability exposed them — see `docs/RESTAURANT-CLAIM-WORKFLOW.md` and `docs/PRODUCTION-READINESS-AUDIT.md`'s "J-01" |
| **`sourceType` / `sourceName` / `sourceUrl` / `sourceRetrievedAt` / `dataConfidence`** | **No — Task G fix, see below** | Rule-pinned | Provenance notice | Administrative / data provenance |
| `contentTranslations` | No (not writable via this page at all) | — | Detail page, per-field fallback | Set only via the separate translation-request/admin-publish workflow — see `docs/MULTILINGUAL-ARCHITECTURE.md` |

The edit page's own UI already never renders or exposes any of the
administrative/protected fields — confirmed by reading the whole form;
no code change was needed there. The gap was entirely at the rules
layer (below).

## The gap Task G found and fixed

**Before this task**, the owner-update branch of the `restaurants/{id}`
`update` rule in `firestore.rules` pinned only six fields with
`unchanged()`: `ownerUid`, `citySlug`, `rating`, `reviewCount`,
`isFeatured`, `isApproved`. It did **not** pin the claim-audit fields
(`ownerClaimStatus`, `claimantUid`, `claimSubmittedAt`, `claimDecidedAt`,
`claimDecidedBy`, and the Task F contact fields) or the provenance/trust
fields (`sourceType`, `sourceName`, `sourceUrl`, `sourceRetrievedAt`,
`dataConfidence`).

**Practical impact**: this rule branch has no `diff().affectedKeys().hasOnly([...])`
restriction (unlike the claim-submission branch a few lines below it), so
an approved owner performing an otherwise-legitimate profile write could,
in the same request, have also set e.g. `dataConfidence: 'verified'` or
rewritten `claimDecidedBy` — not through the UI (which never offers
this), but via a direct Firestore SDK call. The UI never exposed this
possibility, but the rule — the actual security boundary — allowed it.

Nothing anywhere documents these fields as owner-editable; the opposite
is stated repeatedly in `docs/RESTAURANT-CLAIM-WORKFLOW.md` and
`docs/RESTAURANT-DATA-PROVENANCE.md`. This was an unambiguous gap, not a
policy question, so it was fixed: all fifteen fields are now pinned with
`unchanged()` on the owner-update branch (see `firestore.rules`'s
comment at that exact spot for the full list and reasoning).
`lastVerifiedAt` was deliberately **left unpinned** — the existing,
documented design is that an owner saving their own profile counts as
reverifying it.

This is a narrowly scoped rule change to an already-owned, already-well-documented
part of the rules file. It does not touch, resolve, or guess at any of
the ten `REQUIRES MANUAL POLICY DECISION` SmartServeUK collections from
`docs/FIRESTORE-COLLECTION-INVENTORY.md` / `docs/FIRESTORE-SECURITY-AUDIT.md`.

## Menu management

**Already fully functional — no new system was built.** The live menu
model is an inline array on the restaurant document itself:

```ts
type MenuItem = { name: string; price: string; note?: string };
type MenuCategory = { category: string; items: MenuItem[] };
// RestaurantDoc.menuCategories?: MenuCategory[]
```

There is no separate menu collection, so menu edits go through the exact
same `restaurants/{id}` `update` rule as every other profile field — an
owner cannot edit another restaurant's menu for the same reason they
can't edit its description (confirmed by a new rules test, see below).
The Menu Builder UI already supports adding/removing categories and
items, and `handleSave()`'s `sanitizeMenuCategories()` drops empty rows
before saving (trims strings, filters blank categories/items) — a light
validation step, not a transformation of owner-entered text.

**A separate, unused type exists and was found dead**:
`RestaurantMenuCategoryDoc`/`RestaurantMenuItemDoc` in `lib/types.ts`
describe a normalized, separate-collection menu model (per-item
`isAvailable`, `dietaryAttributes`, `currency`, owner-supplied
`translatedNames`/`translatedDescriptions`). A repo-wide search confirms
**no collection, no Firestore rule, and no UI references either type at
all** — it's scaffolding from an earlier task that was never wired up.
Task G did not wire it up: doing so would mean either migrating live
menu data to a new shape or running two menu systems side by side,
neither of which is "reuse existing functionality," and per-item
availability/dietary attributes were not requested. This is recorded as
a known limitation, not built.

## Opening hours

**Already functional, one representation only.** The live field is
`openingHoursText: string` — a single free-text block (e.g. "Mon-Thu
12:00-22:00, Fri-Sat 12:00-23:30, Sun 12:00-21:30"), already editable via
a textarea and already required before a listing can reach `status:
'active'`.

**A separate, unused field exists**: `RestaurantDoc.openingHours?:
Record<string, string>` (a structured day→hours map) is declared in the
canonical type but a repo-wide search confirms it is never read or
written anywhere. Per Task G's explicit instruction ("support the
existing representation rather than inventing a second hours format"),
no structured per-day editor was built — the free-text field already
works and is what both the edit page and the public detail page
actually use.

## Media / photos

**No upload system exists anywhere in this codebase to reuse.** A
repo-wide search found: no `storage.rules` file, no `firebase.json`
storage configuration, and zero references to `getStorage`,
`firebase/storage`, or `uploadBytes` in `app/`, `lib/`, or `components/`.
Owners manage images today via plain URL text fields — `coverImage`,
`logoUrl` (declared on the canonical type but not rendered in this edit
page — see the field matrix), `videoUrl` — the owner pastes a link to an
already-hosted image/video. This is real, functional, and already
protected by the same ownership rule as every other field; it's just not
a file-upload widget.

Per Task G's explicit instruction ("do NOT create a new upload system if
one already exists" / "if secure upload authorization cannot be
confirmed, document the blocker rather than weakening security"), **no
Firebase Storage integration was built in this task.** Building one would
require: a `storage.rules` file (new — currently absent entirely),
Storage SDK integration (new dependency-equivalent surface), file-type
and size-limit validation, and a safe per-restaurant storage path design
— a genuinely new subsystem, not "connecting" an existing one, and
explicitly out of scope for this pass. `lib/types.ts`'s `MediaAsset` /
`mediaAssets` type (provenance-tagged media list) is similarly declared
but confirmed unused everywhere — same situation as the menu/hours
scaffolding above.

## Platform vocabulary vs. restaurant-supplied content

Unchanged policy (see `docs/MULTILINGUAL-ARCHITECTURE.md`), reconfirmed
by inspection and now backed by an automated static guard (see
"Tests"):

- **Platform vocabulary** — `cuisineSlugs` (from `lib/cuisines.ts`),
  `dietaryAttributes` (from `lib/dietary.ts`), the fixed
  dine-in/takeaway/delivery/collection/halal/HMC booleans, `priceRange`.
  Stored as canonical identifiers (slugs/enum values), never as
  pre-translated label strings — the identifier is translated for
  *display* elsewhere (card/detail pages, via `next-intl`), never at
  save time.
- **Restaurant-supplied content** — `name`, `shortDescription`,
  `longDescription`, `tags` (free text), `popularItems`, `menuCategories`
  item names/notes, `openingHoursText`. Saved and displayed exactly as
  the owner typed it. `getLocalizedRestaurantContent()` (the one
  sanctioned read-time fallback for an *approved* translation) is
  correctly used only on public display pages, never on this save path
  — confirmed by a static source check
  (`tests/restaurant-owner-workspace/run-content-policy-tests.ts`) that
  fails if that function, `useTranslations`, or `buildDietaryBadgeLabels`
  ever appear in the edit page's source.

**The edit page itself is not locale-routed** (it lives at
`/restaurants/[id]/edit`, outside `app/[locale]/`, like `/admin/*`,
`/staff/*`, `/customers/*`) — this predates Task G and is consistent
with every other internal/operational tool in this codebase. No new
platform-owned UI text was introduced by this task's changes (the
ownership-gate refactor preserves the exact same English messages it
replaced), so there is nothing new requiring EN/BN/AR/FR translation
here. If the owner workspace is ever made consumer-facing/multilingual,
that is a larger, separate decision — deferred, not attempted here.

## Security boundaries verified (Task G)

Static review plus:
- 7 new pure-function unit tests (`tests/restaurant-owner-workspace/run-ownership-tests.ts`) — **executed, 7/7 passing**.
- 4 new static content-policy guards (`tests/restaurant-owner-workspace/run-content-policy-tests.ts`) — **executed, 4/4 passing**.
- 5 new Firestore rules test cases (`tests/firestore-rules/rules.test.js`) — **written, reviewed, NOT executed** (Java unavailable — see `docs/FIRESTORE-SECURITY-AUDIT.md`).

| Requirement | How verified |
|---|---|
| Approved owner can update permitted fields (incl. menu, in one write) | Existing + new rules test (unexecuted); existing behavior, unchanged |
| Pending/rejected claimant cannot update | Task F rules tests (unexecuted); ownership-gate unit test confirms claim status isn't even an input |
| Unrelated authenticated user cannot update | Existing rules test (unexecuted) |
| Owner A cannot update restaurant B (incl. menu) | Existing + new rules test with two real seeded owners (unexecuted); unit test |
| Owner cannot modify `ownerUid` | Existing rules test (unexecuted) |
| Owner cannot (re)introduce any claimant PII field name | **Updated (Task K)** rules test (unexecuted) — was a real gap (Task G fixed it as a pinned-field list; Task K hardened it into a structural named-field blocklist once the fields moved to the private `restaurant_claims` collection) |
| Owner cannot self-change claim status | **New** rules test (unexecuted) — was a real gap, now fixed |
| Owner cannot modify administrative/provenance fields | **New** rules test (unexecuted) — was a real gap, now fixed |
| Owner content saved without translation transformation | **New** static source-inspection guard — **executed, passing** |
| Controlled vocabulary uses canonical identifiers | **New** static source-inspection guard — **executed, passing** |
| Menu operations respect restaurant ownership | **New** rules tests (unexecuted); menu is inline on the same document as every other protected field, so it was always structurally covered — now explicitly tested |

## Admin relationship

Unchanged from `docs/RESTAURANT-CLAIM-WORKFLOW.md`: an admin (Firebase
Auth custom claim, `isAdmin()`) can edit any restaurant including a
blocked one, and is the only path that ever promotes a claim to
ownership. `app/admin/restaurant-signups/page.tsx` and
`app/admin/restaurant-claims/page.tsx` remain the relevant admin
surfaces; neither was changed by this task.

## Known limitations / deferred

- No file-upload media system (see "Media / photos" above) — documented
  as a genuine architectural gap, not built.
- No per-menu-item dietary attributes, availability toggle, or currency
  field in the live (inline) menu model — the normalized, richer type
  exists but is entirely unused scaffolding; wiring it up was judged out
  of scope (would require either a data migration or running two menu
  systems).
- No structured per-day opening hours editor — the live field is free
  text and already works; a second, structured field exists in the type
  but is dead code.
- `hubId`/`hubName` (legacy, owner-managed) vs. `hubIds: string[]`
  (structured, canonical) — the owner workspace only ever manages the
  legacy pair. Whether `hubIds` should also become owner-editable, or is
  intentionally admin/curatorial, was not determined this task — no
  clear existing policy to follow, so it wasn't guessed at.
- The edit/public restaurant pages each declare their own local,
  duplicated `RestaurantDoc`-shaped type rather than importing the
  canonical one from `lib/types.ts` (now additively extended in Task G
  to match reality). Unifying them was judged too large/risky a
  refactor for this task's scope; the canonical type is now at least
  *accurate*, even though it isn't yet the single source of truth in
  practice.
- Firestore rules tests remain unexecuted in this environment (Java
  unavailable) — see `docs/FIRESTORE-SECURITY-AUDIT.md`. This document's
  "reviewed but unexecuted" caveat applies to every Firestore-rules-level
  claim above.
