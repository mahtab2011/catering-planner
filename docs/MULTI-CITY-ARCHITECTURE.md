# Multi-City Architecture

Written for: whoever eventually launches a second city edition (Dubai, Paris, New York, Berlin, Rome, Makkah, Madinah, Delhi, Mumbai, Singapore, Hong Kong, Beijing, or elsewhere).

**London is the only active city today.** Nothing in this document has been used to build another city's pages, routes, domain, or data — this is the domain-model preparation only, per the explicit instruction not to build any of that yet.

## What "city-aware" means here

A new `City` type (`lib/types.ts`) is the anchor: every city-scoped entity refers to a city by its `citySlug` (a string like `"london"`), never by a hardcoded name or an assumption baked into shared logic. `lib/cities.ts` is the registry — today it holds exactly one entry, `london`, with `isActive: true`.

| Entity | City-scoped? | How |
|---|---|---|
| `FoodHub` (`lib/hubs.ts`) | Yes — a hub is always inside one city | `citySlug: string` field, required |
| Restaurant (`RestaurantDoc`, the live Firestore shape) | Yes | `citySlug` field, required at creation, immutable after (`firestore.rules`) |
| `Cuisine` (`lib/cuisines.ts`) | **No, intentionally** | Cuisines (Bangladeshi, Turkish, Lebanese…) are the same concept everywhere; what's city-specific is *which restaurants in a city serve that cuisine*, which is already handled through the restaurant's own `citySlug` + `cuisine` text. A `City.prominentCuisineSlugs` field exists for a city edition to feature certain cuisines first, without duplicating the cuisine data itself. |
| Dish (`CuisineDish`, editorial dish content) | No, same reasoning as Cuisine | |
| `ReviewDoc` | Implicitly, via its restaurant | Not denormalized — a review's city is always derivable through `restaurantId`, so adding a redundant `citySlug` field risked drift for no query benefit at the current single-city scale. |
| `ArticleDoc` | Optionally | `citySlug?: string` — left undefined for cuisine guides and other pieces that read the same in every city; set only for genuinely city-specific pieces (a hub spotlight, "New in [City]"). |
| `RecommendationDoc` | Optionally | Same reasoning as articles — a restaurant/hub-targeted recommendation already implies a city through its target; the optional field exists for cuisine/dish-type picks that want to be scoped to one city's homepage. |

## Language architecture

`lib/i18n.ts`'s `AppLanguage` union (what the *platform* can translate into) is unchanged and shared across all cities — adding a language there means every city edition can potentially use it. What differs per city is *priority*: `City.priorityLanguages: AppLanguage[]` says which of those languages a given city edition should lead with in its language switcher / auto-detection. London's is `["en", "bn"]`, reflecting what this codebase actually has real translated content for today. A future Paris edition might set `["fr", "en"]`; Makkah/Madinah might set `["ar", "en", "ur"]`. Nothing about *how* translation works changes per city — only which languages are surfaced first.

## Dietary architecture

`DietaryAttribute` (`lib/types.ts`) is a fixed, structured set — `vegetarian | vegan | non_vegetarian | halal | kosher | jain` — supported everywhere, in every city, at all times. What differs per city is which of these a city edition chooses to *feature* as discovery filter chips: `City.prominentDietaryFilters`. London's is `["halal", "vegetarian"]` because that's what the existing hub/restaurant content actually reflects; a Mumbai or Delhi edition would likely feature `jain` prominently, a city with a large Jewish community might feature `kosher` — without adding or changing the underlying attribute set.

**These are always self-declared, never inferred.** `lib/dietary.ts` says this explicitly in comments, and nothing in this codebase computes a `DietaryAttribute` from a cuisine name or from review text — every place it's set is a checkbox a restaurant owner or admin ticked (see the "Dietary certifications" section on the restaurant create/edit forms). Structured attributes live alongside the legacy `isHalal` boolean rather than replacing it — `lib/dietary.ts`'s `buildDietaryBadgeLabels()` merges both without showing a duplicate "Halal" badge, so existing data isn't disturbed.

## One canonical business/menu entity, not duplicated per language

This was already true of the existing menu model before this task and is preserved, not reinvented: a menu item has one document with `translatedNames`/`translatedDescriptions` maps (`MenuLanguages`, keyed by language) rather than a separate document per language. The same restaurant document, the same review, the same article exists once regardless of how many languages it's displayed in. Nothing in the City/dietary work introduces per-language duplication anywhere.

## How to add a second city later (not done in this task)

1. Add one entry to `lib/cities.ts` (the file's own comments describe exactly what a `City` needs — name, countryCode, currencyCode, priorityLanguages, prominentDietaryFilters, isActive).
2. Add that city's hubs to `lib/hubs.ts` with the new `citySlug`.
3. Add that city's cuisine content to `lib/cuisines.ts` if it needs cuisine pages with new copy (most cuisines will already exist — a Dubai edition reuses the existing Lebanese/Indian/Turkish entries as-is).
4. Restaurant signup/creation flows need a city selector once more than one city is active — today `DEFAULT_CITY_SLUG` ("london") is applied automatically since there's only one option; this is the one piece of UI that was deliberately left unbuilt, since building it for a single-city launch would be premature.
5. Decide the routing/domain strategy (a `/[city]/...` prefix, a separate domain per city via `proxy.ts`'s existing pattern, or something else) — not decided or scaffolded here, since it depends on product decisions (subdomain vs. path vs. separate domain) that weren't specified.
6. Firestore rules already require `citySlug` at restaurant-creation time and treat it as immutable — no rules change needed to support a second city, only application code to let a user pick one at signup.

## What was NOT done in this task

- No second city's routes, pages, or domain.
- No placeholder data for Dubai/Paris/etc. in `lib/cities.ts` — only `london` exists.
- No city switcher UI (nothing to switch to yet).
- No per-dish dietary tagging UI — `RestaurantMenuItemDoc.dietaryAttributes` exists in the type system, but the live menu-editing UI (`app/restaurants/[id]/edit`) still uses a simpler untyped `{name, price, note}` shape with no per-item tagging; wiring that up is a larger UI change tracked separately, not attempted here since it wasn't the ask (business-level dietary certification is what the restaurant forms now support).
