# Customer Restaurant Discovery & Browse Experience

Written for: whoever next touches the customer-facing browse/search/detail
journey. Records what Task H found by auditing the existing discovery
experience and what it changed — not a design for a future rebuild. This
task is about discovery and information; it deliberately does not add
checkout, ordering, delivery dispatch, payment, booking, loyalty, paid
advertising, or AI recommendations, and nothing here should be read as
laying groundwork for any of those. Not deployed (see
`docs/SECURITY-FOLLOWUP.md`).

## Summary: an extensive discovery experience already existed

The homepage, restaurant browse/filter page, cuisine pages, hub pages,
search page, restaurant cards, and restaurant detail page were all already
built and functional — this task did not build a parallel discovery
system. Task H's job was audit, close a real scope gap (restaurants from
outside the active city were never excluded), fix two real localization
bugs, add one genuinely missing filter, complete an incomplete URL-state
implementation, and document everything precisely.

## Current-state discovery matrix

| Capability | UI | Data field(s) | Query mechanism | URL state | Localized? | Known limitation |
|---|---|---|---|---|---|---|
| Text search (browse page) | Search input, `app/[locale]/restaurants/page.tsx` | `name`, `ownerName`, `hubName`, `area`, `cuisine`, `shortDescription`, `fullAddress`, `postcode`, `tags`, `popularItems` | Client-side substring match over all active/pending restaurants (see "Firestore limitations" below) | `q` param, read on load and **now written back** (Task H) | UI labels yes; matched restaurant text is never translated (correct) | Substring match only, no ranking/relevance, no typo tolerance |
| Text search (site-wide `/search`) | `components/discovery/SearchClient.tsx` | Same restaurant fields, plus cuisine display names/match terms, hub names, article title/excerpt, menu item names | Same client-side approach, separately fetched | `q`, `postcode` params, read on load, written on submit only (not live-as-you-type) | Cuisine/hub labels localized; restaurant/article text never translated | Same substring-match limitation; menu-item search caps at 20 results |
| Cuisine filter | `<select>`, browse page; dedicated `/cuisine/[slug]` pages | `cuisineSlugs` (canonical), falls back to splitting legacy `cuisine` text for untagged restaurants | Client-side, resolved via `lib/cuisines.ts` | `cuisine` param (canonical **name**, not translated label) | Filter labels localized via `getCuisineDisplayName()`; filter *value* is the canonical name, so switching UI language never breaks an active filter | None significant |
| Regional cuisine group filter | `<select>`, browse page | Same `cuisineSlugs`, resolved to `Cuisine.region` | Client-side | `region` param | Region names shown as declared in `lib/cuisines.ts` (English category names — not yet run through a translation namespace) | Region label text itself (e.g. "South Asian") is not localized — pre-existing, not changed this task |
| Dietary filter | `<select>`, browse page | `dietaryAttributes` / legacy `dietaryCertifications` / `isHalal`, never free text | Client-side, `restaurantHasDietaryAttribute()` (`lib/restaurantDiscoveryFilters.ts`, Task H extraction) | `dietary` param | **Fixed this task** — was rendering hardcoded English labels (`DIETARY_ATTRIBUTE_LABELS`) even in bn/ar/fr; now uses the `Dietary` translation namespace, matching the cards | None |
| Service filter (dine-in/takeaway/delivery/collection) | **New this task** — `<select>`, browse page | `dineIn`/`takeaway`/`delivery`/`collectionEnabled` booleans, nothing invented | Client-side, `restaurantOffersService()` (`lib/restaurantDiscoveryFilters.ts`) | `service` param | Labels reused from the existing `RestaurantDetail` translation namespace | A restaurant marked "delivery" means the restaurant itself offers delivery — London Food Hubs does not operate, dispatch, or process it |
| London area/hub filter | `<select>`, browse page; dedicated `/hubs/[slug]` pages | `hubName` (legacy free text) — **not** `hubIds` (structured) or `hubId` | Client-side string match | `hub` param | Hub names shown as stored (not translated — they're place names) | See "Hub field ambiguity" below — unresolved, not attempted this task |
| Restaurant status filter | `<select>`, browse page (defaults to `active`) | `status` | Client-side; public Firestore read rule already restricts to `active`/`pending` | Not URL-tracked (deliberately excluded — see below) | **Fixed this task** — option labels were literal `"active"`/`"pending"`; now reuse the detail page's translated `liveListing`/`pendingApproval` labels | `draft`/`blocked` restaurants are never in the fetched set at all (rules-level), so there's nothing to filter for those |
| Restaurant cards | `components/restaurants/RestaurantCard.tsx` | name/cuisine/area/rating/reviewCount/tags/dietaryAttributes/ownerTags/popularItems | — | — | Platform tags + dietary badges translated; owner tags/popular items never translated (verified this task, see "Tests") | None found |
| Restaurant detail page | `app/[locale]/restaurants/[id]/page.tsx` | Full profile — see `docs/RESTAURANT-OWNER-WORKSPACE.md`'s field matrix | Single `getDoc` | — | Platform sections (labels, notices, dietary) translated; name/description/menu/tags never translated except via an approved `contentTranslations` entry | Gallery section always shows an empty state — no media beyond a single cover image exists in the data model (see `docs/RESTAURANT-OWNER-WORKSPACE.md`'s media section) |
| Menu | Detail page's "Menu" section | `menuCategories` (inline array — the only live menu model, see `docs/RESTAURANT-OWNER-WORKSPACE.md`) | Read from the same restaurant document | — | Category/item names/notes never translated; empty-state and "price on request" copy translated | No per-item dietary tags or availability flag exist in the data model — not invented |
| Reviews | `components/reviews/RestaurantReviews.tsx` | `reviews` collection, `restaurantId`-scoped, `status: 'approved'` only | Separate query | — | UI (labels, rating summary text) translated; review title/text/displayName never translated, shown in the language the reviewer wrote it | No stored review language field exists — nothing to display, not invented |
| Opening hours | Detail page's dedicated section | `openingHoursText` (free text — the only live representation) | Read from the restaurant document | — | Section label translated; the hours text itself never translated | No "open now" calculation — the data is unstructured free text, calculating this reliably isn't possible without a schema change, correctly not attempted |

## London-only scope (Phase 3) — the real gap this task closed

**Before this task**, all five places that query the `restaurants`
collection for customer discovery — the browse page, `/search`, featured
restaurants on the homepage, cuisine detail pages, and hub detail pages —
fetched every `active`/`pending` restaurant with **no city scoping at
all**. This was invisible today only because every restaurant in this
deployment happens to be London's. If a second city were ever added
without a corresponding fix, its restaurants would appear mixed into every
London-scoped discovery surface with no separation.

**Fixed** by adding `lib/cities.ts`'s `belongsToActiveCity(citySlug)` — a
pure, client-side (not a Firestore `where` clause — see "Firestore
limitations" below) filter applied after fetch in all five places. A
missing `citySlug` (any restaurant created before the multi-city
architecture existed) still counts as belonging to the active city,
deliberately — this is a read-time filter, not a data migration, and
never touches or backfills any restaurant document. The multi-city
architecture (`lib/cities.ts`'s `CITIES` registry, `City` type,
`citySlug` field) is untouched and still exists for future expansion —
adding a second city later is unaffected by this change; the discovery
pages would need their own follow-up work to become city-aware (e.g. a
city switcher), which is out of scope here.

## Search (Phase 4)

No third-party search infrastructure (Algolia, Elasticsearch, etc.) was
added or considered — client-side substring matching over an
already-fetched restaurant list remains the approach, appropriate for a
single-city launch's data volume. Matching never mutates or translates
restaurant text — confirmed both by code reading and a new static test
(see "Tests" below) that fails if a translation function is ever called
on the search path.

## Cuisine filtering (Phase 5)

Unchanged architecture, reconfirmed correct: `lib/cuisines.ts` remains the
one canonical taxonomy. Filtering keys off the canonical cuisine `name`
(resolved from `cuisineSlugs`), never a translated label — switching UI
language mid-session never invalidates an active cuisine filter. Cards,
filters, and detail pages all resolve display names through the same
`getCuisineDisplayName()` — no competing taxonomy was found or created.

## Dietary filtering (Phase 6)

`restaurantHasDietaryAttribute()` (now in `lib/restaurantDiscoveryFilters.ts`,
extracted from the browse page for unit testing — Task H) reads only the
structured `dietaryAttributes`/`dietaryCertifications` arrays and the
legacy `isHalal` boolean. It never inspects `tags`, `shortDescription`, or
any other free text — the same safeguard already enforced at import time
by `lib/import/validateDietaryClaims.ts` (see
`docs/RESTAURANT-IMPORT-PIPELINE.md`) is preserved at discovery time.
**The one bug found and fixed**: the browse page's dietary filter
`<select>` rendered hardcoded English labels (`DIETARY_ATTRIBUTE_LABELS`,
the constant meant for the non-locale owner/admin tooling — see
`docs/RESTAURANT-OWNER-WORKSPACE.md`) instead of the translated `Dietary`
namespace already used correctly on restaurant cards. Fixed to match.

## London area / hub filtering (Phase 7) — unresolved ambiguity, not guessed at

The authoritative read/filter mechanism for customer discovery is
confirmed to be `hubName` (legacy free text) — used consistently by the
browse page's hub filter, the hub grouping on that same page, and the
dedicated `/hubs/[slug]` pages' restaurant-matching logic. The structured
`hubIds: string[]` field is not read by any discovery page.

This matches the ambiguity `docs/RESTAURANT-OWNER-WORKSPACE.md` (Task G)
already flagged from the owner-management side: it's unclear whether
`hubIds` is meant to become the real mechanism (with `hubName` as a
display-only legacy holdover) or whether `hubName` free text is the
intended long-term design. **Task H did not guess or migrate anything** —
customer discovery continues to use exactly the mechanism that already
works (`hubName`), and no legacy field was touched or removed.

## Service filters (Phase 8)

New: a filter for `dineIn`/`takeaway`/`delivery`/`collectionEnabled` on
the browse page, reading only these existing boolean fields — nothing
invented. The wording is explicit in code comments and this document:
**a restaurant marked "delivery" means the restaurant itself offers
delivery** — London Food Hubs does not operate, dispatch, process, or
take any commission on any order, delivery, or payment. No cart, order,
or checkout UI exists or was added.

## Restaurant cards (Phase 9)

Reconfirmed compliant, unchanged: name/cuisine/area/rating/review-count
only shown when a genuine review exists (`reviewCount > 0 && rating > 0`
gate — never a fabricated "0.0 (0)"), platform tags and dietary badges
translated, owner tags and popular items (dish names) never translated.
Verified this task by a static regression test asserting every
`RestaurantCard` call site wires the restaurant's own `tags` field
through the `ownerTags` prop, never the translated `tags` prop.

## Restaurant detail page (Phase 10)

Reconfirmed compliant. `getLocalizedRestaurantContent()` is the one
sanctioned translation-aware read for name/description, falling back to
the canonical original per field. No administrative/import metadata is
rendered beyond the intentional, existing `PublicListingNotice`
(`sourceType`/`sourceName`/`ownerClaimStatus` only — never `sourceUrl`,
`sourceRetrievedAt`, `dataConfidence`, or any claim-audit field). Claim,
correction/removal, and translation-request actions remain on
`RestaurantClaimPanel` — see "Claim/correction/translation separation"
below.

**A Firestore-model caveat, not a discovery-code bug**: because
`firestore.rules`' public read rule grants access to the *entire*
restaurant document (Firestore has no field-level security rules),
`sourceUrl`/`sourceRetrievedAt`/`dataConfidence` and similar provenance
fields are technically fetchable by anyone reading the document
directly — regardless of what any discovery page's UI chooses to render.
This is a pre-existing architectural trade-off across the whole app (the
owner workspace, the detail page, and every discovery page all read the
same whole document), not something Task H introduced. What Task H *did*
verify and can state confidently: **no discovery page's rendered UI
displays any of these fields** — confirmed by a repo-wide search finding
zero references to `sourceUrl`, `sourceRetrievedAt`, or any claim-audit
field anywhere in the discovery components.

**(Task K, later)** This same caveat used to apply to actual claimant
*PII* too (`claimantContactEmail`, `claimantContactPhone`, etc.) — that
part was a genuine defect, not just a theoretical trade-off (see
`docs/PRODUCTION-READINESS-AUDIT.md`'s "J-01"), and has since been fixed
by moving those fields to a private `restaurant_claims` collection that
is never publicly readable at all — see
`docs/RESTAURANT-CLAIM-WORKFLOW.md`. The remaining provenance-field
caveat above (`sourceUrl` etc.) is lower-sensitivity internal metadata,
not personal data, and was left as documented rather than restructured.

## Menu display (Phase 11)

Uses the inline `menuCategories` architecture exclusively, confirmed as
the only live model (see `docs/RESTAURANT-OWNER-WORKSPACE.md`). The dead
`RestaurantMenuCategoryDoc`/`RestaurantMenuItemDoc` scaffolding was not
touched or revived. Category names, item names, and notes render exactly
as the owner entered them; no cart/order/price-action controls exist or
were added.

## Opening hours (Phase 12)

Uses `openingHoursText` exclusively — the only live representation (see
`docs/RESTAURANT-OWNER-WORKSPACE.md`). The dead structured `openingHours`
field was not revived. No "open now" calculation exists — the
underlying data is unstructured free text, so a reliable calculation
isn't possible without a schema change; not attempted, per this task's
explicit instruction.

## Reviews (Phase 13)

Reconfirmed compliant, unchanged: review `title`/`reviewText`/
`displayName` render exactly as submitted, never translated; the rating
summary (`averageRating`/`ratingDistribution` in `lib/reviews.ts`) is
computed only from real approved review documents — never fabricated.
`ReviewDoc` has no stored language field, so there is nothing to display
there; one was not added (out of scope — "do not add speculative
features").

## Claim / correction / translation-request separation (Phase 14)

Reconfirmed unchanged and correctly distinct — see
`docs/RESTAURANT-CLAIM-WORKFLOW.md`. `RestaurantClaimPanel` (rendered on
the detail page) exposes exactly two customer-facing actions ("Claim this
listing" for an unclaimed restaurant; "Suggest an update" / "Request
removal" for anyone) and never exposes the owner-only translation-request
workflow — that remains reachable only via the (not-yet-built, per Task
D/F) owner-side request UI, never from a customer-facing surface.

## Responsive UX / RTL (Phase 15)

No site-wide redesign was performed. Arabic RTL is handled globally: the
root `app/layout.tsx` sets `dir` on `<html>` from the active locale
(`isRTLLocale(locale)`), so every page — including the three discovery
components that don't separately declare `dir` on their own root
(`CuisineDetailClient`, `FeaturedRestaurantsSection`, `SearchClient`) —
correctly inherits RTL layout from the browser's cascade. The
restaurant detail and browse pages additionally set `dir` on their own
`<main>` explicitly (defensive/redundant, not required, left as-is — not
a bug). No concrete usability defect was found that needed a targeted
fix beyond what's already described above.

## URL / navigation state (Phase 16)

**Completed, was previously incomplete.** The browse page already read
`q`/`hub`/`cuisine`/`region`/`dietary` from the URL on initial load, but
never wrote filter changes back — so changing a filter and reloading (or
sharing the URL) silently reverted to the stale initial values. Fixed
with a `useEffect` that shallow-replaces the URL (`router.replace`, no
history entry per change, no full page reload) whenever search or any
filter changes, using the locale-aware navigation wrapper
(`@/i18n/navigation`) so the current locale prefix is never dropped.
`/search`'s existing behavior (URL updates only on submit, not live) was
left as-is — a deliberate, different, already-reasonable choice for that
page, not touched. The `status` filter is intentionally excluded from URL
state — it exists as a "show pending listings too" toggle, not something
worth persisting or sharing a link to.

## Empty / loading / error states (Phase 17)

Reconfirmed compliant across all five discovery data-fetching
components: every fetch is wrapped in try/catch, every catch path logs to
the console (developer-only) and falls back to an empty result set (never
a raw Firebase error shown to a customer), and every component has a
translated loading state and a translated "nothing found" state. No
changes were needed here.

## Four-language support (Phase 18)

New platform-owned strings added this task: `Restaurants.serviceLabel`
and the four service option labels (reused from the existing
`RestaurantDetail` namespace, not duplicated). All real-translated
(not placeholder) across en/bn/ar/fr; key parity verified: 308 keys ×
4 locales, byte-identical key sets.

## Security / data integrity (Phase 19)

No Firestore or Storage rule was changed by this task — discovery is
read-only and the existing public read rule (`status in ['active',
'pending']`) already covers every query used here. See "Restaurant detail
page" above for the one important, pre-existing caveat about whole-document
public reads (not a new issue, not fixed, honestly documented rather than
silently accepted or over-claimed as safe).

## Tests (Phase 20)

New, executable in this environment (no Java/emulator required):

- `lib/cities.ts`'s `belongsToActiveCity()` and
  `lib/restaurantDiscoveryFilters.ts`'s `restaurantOffersService()` /
  `restaurantHasDietaryAttribute()` were extracted from the browse page
  (Task H, mirroring the Task F/G pattern) specifically so they could be
  unit tested. `tests/restaurant-discovery/run-discovery-filter-tests.ts`
  — **11/11 passing** — covers London-only scope (including the
  missing-`citySlug` inclusive-by-default case), each service filter
  reading only its own field, and dietary matching never falling back to
  free text.
- `tests/restaurant-discovery/run-content-policy-tests.ts` — **3/3
  passing** — static source-inspection guards: every `RestaurantCard`
  call site wires owner tags through `ownerTags` not `tags`; the browse
  and search pages never call `buildDietaryBadgeLabels` (the
  pre-translated, English-only helper); the browse page filters via the
  shared `belongsToActiveCity()` helper, not a hardcoded string.

No Firestore rules were changed, so no new rules tests were needed.
Existing rules tests remain unexecuted in this environment (Java
unavailable) — unchanged from Tasks E/F/G, see
`docs/FIRESTORE-SECURITY-AUDIT.md`.

## Known Firestore limitations

- Client-side substring search only — no relevance ranking, no typo
  tolerance, no full-text index. Appropriate for a single-city launch;
  revisit if/when result volume grows.
- The London-only city filter is applied client-side (post-fetch), not
  as a Firestore `where` clause — deliberately, to avoid requiring a new
  composite index (which would need production deployment, out of scope
  and forbidden this task) and to correctly include pre-`citySlug`
  restaurants without a migration.
- Public restaurant reads return the entire document (see "Restaurant
  detail page" above) — a whole-app architectural trade-off, not
  something introduced or fixed by this task.

## Intentionally deferred (not built)

- Checkout, ordering, delivery dispatch, payment, commission, booking,
  loyalty, restaurant advertising/payment, AI recommendations — explicitly
  out of scope per this task's own instructions.
- A city switcher / multi-city-aware discovery UI — the architecture
  (`lib/cities.ts`) supports it, but building the actual UI is separate,
  future work.
- Third-party search infrastructure (Algolia, Elasticsearch, etc.).
- "Open now" calculation from opening hours — would require a schema
  change to structured hours data.
- A stored review-language field / language badge on reviews — nothing
  currently stores this; not invented.
- Region filter label translation (e.g. "South Asian") — pre-existing
  gap, not touched this task.
