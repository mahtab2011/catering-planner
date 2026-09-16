# Cuisine Taxonomy

Status: implemented and live in `lib/cuisines.ts` / `lib/types.ts`. This document
explains the model; it is not aspirational.

## Principles

1. **Cuisines are distinct, never merged for convenience.** Bangladeshi and
   Indian are the paradigm case: closely related, frequently served by the
   same restaurant, but two different cuisines with their own entries
   (`bangladeshi-food-east-london`, `indian-food-london`). The same rule
   applies to every other pair that could tempt a lazy merge — Ethiopian and
   Somali, for instance, are also kept separate (see below).
2. **Slugs are the canonical, language-independent identity.** A cuisine's
   `slug` (e.g. `turkish-food-london`) is also its Firestore/route identity
   and never changes based on the viewer's language. Display names can be
   translated (see "Multilingual names" below) without ever creating a
   second entity for the same cuisine.
3. **A restaurant can belong to more than one cuisine.** `RestaurantDoc` has
   `cuisineSlugs: string[]` (every cuisine slug that genuinely applies) and
   `primaryCuisineSlug` (the one to show when only one can be displayed, e.g.
   a card badge). Selecting both Bangladeshi and Indian for a genuinely
   mixed restaurant is correct; picking one because it's "close enough" is
   not.
4. **Parent groupings supplement, they never replace.** `Cuisine.region`
   (South Asian, Middle Eastern, East Asian, Southeast Asian, African,
   Caribbean, European, Americas) is the parent-grouping layer, used for
   homepage variety and `getCuisinesByRegion()`'s grouped browsing. It is
   *reused* rather than duplicated with a second field — see "Why `region`
   and not a new field" below.

## Data model

```ts
// lib/types.ts
type Cuisine = {
  id: string;
  slug: string;                 // canonical, language-independent
  kind: "cuisine" | "dish-guide";
  name: string;                 // English display name
  localizedName?: LocalizedText;// optional locale-keyed overrides
  region: "South Asian" | "Middle Eastern" | "East Asian" | "Southeast Asian"
        | "African" | "European" | "Americas" | "Caribbean";
  matchTerms: string[];         // substring-match terms for legacy free-text data
  // ...dishes, descriptions, SEO fields
};

type RestaurantDoc = {
  cuisine?: string;              // legacy free-text, kept for backward compat
  cuisineSlugs?: string[];       // canonical, structured, multi-value
  primaryCuisineSlug?: string;   // one of cuisineSlugs, for single-value display
  // ...
};
```

## Why `region` and not a new field

The task that introduced this taxonomy asked for "parent groupings like South
Asian/Middle Eastern/etc as supplements not replacements." `Cuisine.region`
already existed for exactly this purpose (homepage variety, avoiding the site
skewing toward one part of the world) and is already an enum of sensible
top-level groupings. Adding a second, parallel "parent group" field would
have meant keeping two overlapping taxonomies in sync for no benefit — so
`region` was documented and promoted as *the* parent-grouping mechanism, and
`getCuisinesByRegion()` (in `lib/cuisines.ts`) was added to group cuisines by
it in a fixed, sensible order (`CUISINE_REGION_ORDER`).

## Multilingual names

`Cuisine.localizedName?: LocalizedText` is a locale-keyed map (same
`LocalizedText` type used elsewhere — `Partial<Record<AppLanguage, string>>`)
for a human-translated display name. It is optional and additive:

- The `slug` never changes based on language — a cuisine is one entity
  everywhere, never duplicated per language.
- An absent locale falls back to `name` (English).
- **No entries currently exist.** Populating `localizedName` requires real,
  human-reviewed translated copy, same rule as every other translated field
  in this codebase (see `docs/MULTILINGUAL-ARCHITECTURE.md` if present, and
  the "never fabricate translations" rule that governs it) — nothing should
  auto-translate a cuisine name and write it here.

## Structured matching vs. legacy free-text matching

Two matching functions exist in `lib/cuisines.ts`:

- `restaurantMatchesCuisineSlug(restaurant, cuisine)` — **preferred**. Exact
  match against `restaurant.cuisineSlugs`. Used by
  `components/cuisine/CuisineDetailClient.tsx`.
- `restaurantMatchesCuisine(cuisineText, cuisine)` — **legacy fallback**.
  Case-insensitive substring match of `cuisine.matchTerms` against a
  restaurant's free-text `cuisine` field. `restaurantMatchesCuisineSlug`
  falls back to this automatically when a restaurant has no
  `cuisineSlugs` yet, so untagged legacy listings don't disappear from
  cuisine pages during the transition.

The restaurant directory (`app/restaurants/page.tsx`) uses a related helper,
`restaurantCuisineNames()`, for its filter dropdown — it prefers
`cuisineSlugs` resolved to canonical names and falls back to splitting the
legacy free-text field on `/` (needed because the signup/edit forms now
write a joined string like `"Bangladeshi / Indian"` for multi-cuisine
restaurants — see below).

## Current taxonomy (27 entries)

Full cuisines (`kind: "cuisine"`), by region:

- **South Asian:** Bangladeshi, Indian, Pakistani, Nepalese, Sri Lankan
- **Middle Eastern:** Lebanese, Turkish, Persian/Iranian
- **East Asian:** Japanese, Chinese, Korean
- **Southeast Asian:** Thai, Vietnamese, Filipino
- **African:** African (West/Central/Southern), Ethiopian & Eritrean, Somali
- **Caribbean:** Jamaican
- **European:** British, Greek, Italian, Polish
- **Americas:** American, Brazilian, Mexican

Dish-guides (`kind: "dish-guide"`, not region-grouped): Biryani & Pulao,
Chicken Tikka.

This is **not exhaustive of world cuisines** on purpose — see
`lib/cuisines.ts`'s own header comment. It only contains cuisines with real,
non-fabricated content (either previously-written copy migrated from legacy
hardcoded pages, or well-known, generic, non-restaurant-specific facts about
the cuisine itself — no invented dishes, no claims about specific London
restaurants). Adding a cuisine later means adding one more entry to
`CUISINES` in `lib/cuisines.ts`; no route or component code needs to change.

### Distinct-but-related pairs, deliberately kept apart

- **Bangladeshi / Indian** — the original example this principle is built
  around.
- **Ethiopian & Eritrean / Somali** — both were previously folded into the
  generic "African" entry's `matchTerms`; they've been split out into their
  own entries and removed from "African"'s match terms so a restaurant
  tagged with either no longer double-matches the broader page.

## Restaurant signup/edit forms

`app/restaurants/new/page.tsx` and `app/restaurants/[id]/edit/page.tsx` both
replaced a single hardcoded 10-option `<select>` (which included
non-cuisines like "Global Street Food" and "Mixed / Fusion", and cuisines
not in the taxonomy like "Chinese") with a multi-select checkbox grid built
from `getCuisinesByRegion()`. The legacy `cuisine` text field is derived
automatically from the selection (joined with `" / "`) rather than edited
directly, so every restaurant has both the structured and free-text form
from day one.

## What this task did not do

- Did not attempt to build an exhaustive global cuisine taxonomy (hundreds of
  entries) — 27 is a meaningful expansion from the original 15, not a
  claim of completeness.
- Did not populate `localizedName` for any cuisine (no real translated copy
  exists yet).
- Did not migrate every existing restaurant document's free-text `cuisine`
  field to `cuisineSlugs` — that would require either owner action (editing
  their listing) or an admin backfill script, neither of which was run
  against any real data. New/edited restaurants get `cuisineSlugs` going
  forward; existing untouched ones keep working via the legacy fallback
  paths described above.
