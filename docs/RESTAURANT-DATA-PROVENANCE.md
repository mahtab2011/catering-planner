# Restaurant Data Provenance

Status: implemented and live in `lib/types.ts`, wired into the restaurant
signup/edit forms and the restaurant detail page's public notice. This
document explains the model; it is not aspirational.

## Why this exists

Before this task, a `RestaurantDoc` had no record of where its data came
from, whether it had been verified, or whether the business behind it had
any relationship with the platform. As London Food Hubs starts to include
data that isn't purely self-submitted (open datasets, editorial research,
eventually licensed providers), every listing needs to honestly answer
three questions for a customer or a reviewing admin: *where did this come
from, has anyone confirmed it's accurate, and who — if anyone — actually
runs this business on the platform.*

## The fields

All on `RestaurantDoc` (`lib/types.ts`), all optional (so nothing breaks for
existing documents written before this task):

| Field | Type | Meaning |
|---|---|---|
| `sourceType` | `RestaurantSourceType` | How the record entered the platform — see below. |
| `sourceName` | `string` | Human-readable name of the source (e.g. "Restaurant self-signup form", "Camden Council food hygiene open dataset"). |
| `sourceUrl` | `string` | Public URL of the source record, when the source is an external dataset/page. Never a competitor listing page — see `RESTAURANT-IMPORT-PIPELINE.md`'s prohibited-sources list. |
| `sourceRetrievedAt` | timestamp | When the source data was captured. |
| `lastVerifiedAt` | timestamp | Last time an admin or the owning business confirmed the core facts are still accurate. Distinct from `updatedAt`, which changes on *any* edit whether or not anything was actually re-verified. |
| `dataConfidence` | `RestaurantDataConfidence` | `verified` / `unverified` / `flagged` — a plain stored value, **never computed** from ratings, review sentiment, or popularity. |

### `RestaurantSourceType`

```ts
type RestaurantSourceType =
  | "restaurant_submitted"    // the business itself filled in the signup form
  | "owner_claimed"           // an owner claimed a listing that started as unclaimed
  | "open_data"                // a public open dataset (e.g. council/government)
  | "licensed_provider"        // a commercial data provider under a license
  | "official_public_source"   // an official public source not fitting "open_data"
  | "editorial_research";      // London Food Hubs' own editorial team
```

`sourceUrl` is required (by `lib/import/validateCandidate.ts`, for anything
going through the import pipeline) for every type except
`restaurant_submitted`, `owner_claimed`, and `editorial_research` — those
three have no external page to point to by definition.

## What actually stamps these fields today

- **`app/restaurants/new/page.tsx`** (self-signup): every new restaurant is
  stamped `sourceType: "restaurant_submitted"`, `sourceName: "Restaurant
  self-signup form"`, `sourceRetrievedAt`/`lastVerifiedAt: serverTimestamp()`,
  `dataConfidence: "unverified"`, and — because a self-signup restaurant has
  an owner (its creator) from the moment it exists — `ownerClaimStatus:
  "claimed"`.
- **`app/restaurants/[id]/edit/page.tsx`**: every save stamps
  `lastVerifiedAt: serverTimestamp()` — the owner confirming/saving their
  own profile counts as re-verifying it.
- **`functions/scripts/applyApprovedImportBatch.js`** (not yet run against
  any real data — see `docs/RESTAURANT-IMPORT-PIPELINE.md`) stamps all of
  these from the staging candidate's own values, carried through unchanged
  from whatever `functions/scripts/stageImportCandidates.js` staged.
  `dataConfidence` always starts `"unverified"` for an imported restaurant
  — importing a record is never itself a verification.
- **No restaurant in this codebase currently has `sourceType` values other
  than `restaurant_submitted`** — no import has actually been run against
  real data.

## Ownership claim fields

Separate from provenance, but documented here since they're on the same
document and read by the same public notice:

| Field | Type | Meaning |
|---|---|---|
| `ownerClaimStatus` | `RestaurantOwnerClaimStatus` | `unclaimed` / `claim_pending` / `claimed` / `claim_rejected`. |
| `claimantUid` | `string` | Uid of a user who submitted a claim — **never** treated as ownership by itself. |
| `claimSubmittedAt` / `claimDecidedAt` / `claimDecidedBy` | timestamp / timestamp / uid | Audit trail. |

Full workflow, including the security model for how `claimantUid` can (and
specifically cannot) become `ownerUid`, is in
`docs/RESTAURANT-CLAIM-WORKFLOW.md`.

## Dietary declaration basis (import pipeline only, today)

`lib/import/types.ts`'s `DietaryDeclarationBasis` (`restaurant_declared` /
`source_reported` / `platform_verified`) tracks *how confident* an import
candidate's dietary claim is, separately from whether the attribute is
present at all. See `docs/RESTAURANT-IMPORT-PIPELINE.md`'s "Dietary claims"
section for the full rule — in short: `validateDietaryClaims()` requires an
explicit basis for every claimed attribute, and specifically refuses
`"platform_verified"` at import time, since an import pipeline reading a
local file has no way to have actually verified anything itself.

**This concept does not exist yet on the live `RestaurantDoc` shape** — a
self-signup or owner-edited restaurant's `dietaryAttributes` has no
per-attribute basis tracking today, only the flat array. Extending
`RestaurantDoc` itself to carry a declaration basis per attribute (so a
customer could eventually see "self-declared" vs. "verified by London Food
Hubs" next to a Halal badge, for instance) would be a reasonable future
step, deliberately not built in this task since it wasn't asked for beyond
the import pipeline's own internal validation.

## Data freshness and re-verification

`sourceRetrievedAt` and `lastVerifiedAt` together let a future process
identify restaurants whose information hasn't been confirmed in a while.
This task documents, but does not implement, the intended direction: after
an appropriate (currently undecided) period, a listing may be marked
`NEEDS_REVERIFICATION` — a prompt for an admin or the owning business to
confirm the listing is still accurate, never an automatic deletion or
hiding of the listing for being old. No field, status, or scheduled job for
this exists in the codebase today; this section exists so the intent is
recorded rather than lost, for whoever eventually designs the actual
threshold and automation.

## Media provenance (separate from data provenance)

A restaurant's *facts* (address, cuisine, phone) and its *photos* can have
different origins — a business can be owner-claimed while still using a
platform-created cover photo, or vice versa. So media provenance is its own
type, not reused from `RestaurantSourceType`:

```ts
type MediaProvenance = "owner_uploaded" | "platform_created" | "licensed" | "open_license";

type MediaAsset = {
  url: string;
  provenance: MediaProvenance;
  attribution?: string; // required in practice (not type-enforced) for
                         // "licensed"/"open_license", per that license's terms
  uploadedAt?: unknown;
};
```

`RestaurantDoc.mediaAssets?: MediaAsset[]` is additive alongside the
existing `imageUrl`/`logoUrl` fields, not a replacement. **No UI currently
writes to `mediaAssets`** — this task defines the type so a future photo
upload flow has somewhere correct to record provenance, but does not build
that upload flow (out of scope; the existing `imageUrl`/`logoUrl` text-field
inputs are unchanged).

## The public-facing notice

`components/restaurants/PublicListingNotice.tsx` (backed by
`lib/listingNotice.ts`) renders a short, neutral paragraph on every
restaurant detail page, built from these provenance fields. Its ground
rules (enforced by code review, not by a runtime check — see the comment
block at the top of `lib/listingNotice.ts`):

- Never claims London Food Hubs is affiliated with, endorsed by, or
  certifies the business, unless `dataConfidence` genuinely reflects an
  actual verification.
- Never claims any government, council, tourism-board, or other official
  affiliation.
- Always distinguishes three things that are easy to conflate: facts the
  business itself provided/confirmed, facts from a named external source,
  and customer reviews (which are the reviewers' own opinions, never London
  Food Hubs').

## What this task did not do

- Did not backfill provenance fields onto any pre-existing restaurant
  document — they're `undefined` for anything created before this task,
  and the notice component/copy handles that gracefully (falls back to
  "provided to London Food Hubs" phrasing).
- Did not build a `dataConfidence` review/promotion workflow (e.g. an admin
  action that flips `unverified` → `verified`) — the field exists and is
  read by the UI, but nothing currently writes `verified` or `flagged`.
  That would be a reasonable next step, tracked here rather than guessed at.
- Did not build the media-provenance upload flow (see above).
