# Multi-City Roadmap

Written for: whoever eventually launches a second city edition. This is a
**practical launch checklist**, complementary to
`docs/MULTI-CITY-ARCHITECTURE.md` (which explains *why* the domain model is
shaped the way it is). Read that first if you haven't; this document
assumes it and focuses on *what's left to actually do*.

**London remains the only active city.** Nothing in this task built a
second city's data, routes, or domain — that instruction from the original
multi-city task still holds, and this task's own instructions repeated it
explicitly ("design globally, implement London").

## What this task added that's relevant to a future city launch

Everything built for the "London Launch" task (cuisine taxonomy, data
provenance, import pipeline, claim/correction workflow) was built
city-agnostic on purpose, per that task's explicit "no `LondonRestaurant`-
style names, citySlug-scoped generics" instruction:

- **Cuisine taxonomy** (`docs/CUISINE-TAXONOMY.md`) was already
  city-independent before this task (see `MULTI-CITY-ARCHITECTURE.md`'s
  table) and remains so — a second city reuses the existing cuisine
  entries as-is; it doesn't need its own Turkish/Lebanese/Indian pages.
- **`RestaurantSourceType`, `RestaurantDataConfidence`,
  `RestaurantOwnerClaimStatus`, `MediaProvenance`** (all in `lib/types.ts`)
  are plain enums with no city concept baked in at all — they apply
  identically to a London restaurant or a future Paris one.
- **`restaurant_correction_requests`** (the new Firestore collection) has
  no city field — correction/removal requests reference a `restaurantId`,
  and that restaurant's own `citySlug` already establishes which city it
  belongs to, exactly the same "don't denormalize what's already derivable"
  reasoning `MULTI-CITY-ARCHITECTURE.md` applied to `ReviewDoc`.
- **The import-pipeline validator** (`lib/import/validateCandidate.ts`)
  already checks `candidate.citySlug` against the real `lib/cities.ts`
  registry rather than hardcoding `"london"` — so a second city's import
  candidates would validate correctly today, once that city exists in the
  registry, with zero changes to the validator itself.
- **None of the new UI components** (`RestaurantClaimPanel`,
  `PublicListingNotice`, the admin claims queue) reference London or any
  city name — they operate purely on the restaurant document passed to
  them.

In short: this task's additions don't create new multi-city debt. The
punch list below is the same one `MULTI-CITY-ARCHITECTURE.md` already laid
out, plus the two new items this task's own additions introduce.

## Punch list to launch city #2

Carried over from `MULTI-CITY-ARCHITECTURE.md` (still accurate, repeated
here for a single checklist):

1. Add one entry to `lib/cities.ts`.
2. Add that city's hubs to `lib/hubs.ts` with the new `citySlug`.
3. Add new cuisine content to `lib/cuisines.ts` only if the new city
   genuinely needs cuisines not already covered — most won't.
4. Build a city selector on restaurant signup/creation (currently
   `DEFAULT_CITY_SLUG` is applied automatically since there's only one
   option).
5. Decide and build the routing/domain strategy for the new city
   (`/[city]/...` prefix vs. subdomain vs. separate domain) — not decided
   here, depends on product/SEO decisions this task wasn't asked to make.
6. No Firestore rules changes needed — `citySlug` is already
   required-at-creation and immutable.

New, from this task:

7. **Point the import pipeline at the new city.** `lib/import/validateCandidate.ts`
   already validates against the real city registry, so once step 1 is
   done, import candidates for the new city will validate correctly. No
   pipeline code change needed — but remember the pipeline is still
   dry-run only (see `docs/RESTAURANT-IMPORT-PIPELINE.md`); actually
   importing any city's data still requires building the write step
   described there first.
8. **Decide the new city's public-listing notice tone, if different.**
   `lib/listingNotice.ts`'s copy doesn't currently vary by city or locale.
   If a new city edition has different legal/regulatory disclosure
   requirements (this varies by country), that file is the one place to
   make the notice configurable per city — it isn't today, because it
   hasn't needed to be with only one city and one legal jurisdiction (the
   UK) in play.

## What this task deliberately did not do

- Did not add a second `lib/cities.ts` entry, even a placeholder — per
  both this task's and the original multi-city task's explicit
  instruction not to build ahead of an actual launch.
- Did not build the city selector UI (item 4 above) — premature for a
  single-active-city deployment.
- Did not decide the routing/domain strategy (item 5) — a product
  decision, not an inspection-and-implement one.
- Did not make `lib/listingNotice.ts` per-city configurable (item 8) — no
  second city/jurisdiction exists yet to need it.
