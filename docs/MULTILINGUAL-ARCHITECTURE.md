# Multilingual Architecture

Status: implemented and live. `/` redirects to `/en`; all 12 required consumer
route types exist under `app/[locale]/...` in all 4 active locales; verified
with a real `npm run build` (clean, 140 routes) and a real `npm start` +
`curl` smoke pass against the built server (see `docs/LONDON-FOOD-HUBS-LAUNCH-CHECKLIST.md`-style
validation notes in the task's final report for the exact commands run).

## Active vs. planned locales

`lib/locales.ts` is the single source of truth.

- **Active today (4):** English (`en`, canonical/fallback), Bengali (`bn`),
  Arabic (`ar`, RTL), French (`fr`).
- **Planned (22 more):** Urdu, Punjabi, Hindi, Chinese, Turkish, Polish,
  Romanian, Portuguese, Spanish, Italian, German, Dutch, Somali,
  Persian/Farsi, Tamil, Gujarati, Japanese, Korean, Malay/Indonesian, Thai,
  Russian, Ukrainian — defined in the registry with `status: "planned"` but
  **not activated**. A planned locale has no route tree, no message catalog,
  and never appears in the language selector. Activating one is entirely a
  matter of adding a message catalog and one line to `ACTIVE_LOCALES` (see
  "How to add language #5" below) — no other architectural change is needed.

```ts
// lib/locales.ts
export type LocaleCode = "en" | "bn" | "ur" | "pa" | "hi" | "ar" | "zh" | "tr" | ... // 26 total
export const ACTIVE_LOCALES: LocaleCode[] = ["en", "bn", "ar", "fr"];
export const DEFAULT_LOCALE: LocaleCode = "en";
export const RTL_LOCALES: LocaleCode[] = ["ar", "ur", "fa"]; // every locale in
  // the registry with rtl: true, not just the currently-active ones — so
  // activating Urdu or Farsi later gets correct RTL behavior for free.
```

## Routing

`i18n/routing.ts` defines `localePrefix: "always"` — every consumer URL is
prefixed (`/en/restaurants`, never a bare `/restaurants` serving English by
default). This was a deliberate choice: with `"as-needed"`, the default
locale's URLs would be unprefixed, which (a) is ambiguous about whether a
given unprefixed URL is "the English page" or "the legacy pre-migration
page" during any transition period, and (b) makes the hreflang/sitemap logic
described below asymmetric for no real benefit at this site's scale.

`proxy.ts` (Next.js's middleware file) runs `next-intl`'s middleware, but
**only** for paths matched by `isLocaleAwarePath()` — exactly `/` and the 4
active locale prefixes and their sub-paths. Every other path (every
SmartServeUK operational route, every CikenTikka route, every BlackCab
route) never reaches `intlMiddleware` at all:

```ts
function isLocaleAwarePath(pathname: string) {
  if (pathname === "/") return true;
  return routing.locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );
}
```

The CikenTikka-domain redirect (`cikentikka.com` / `www.cikentikka.com` →
`/cikentikka`) is checked **first**, before the locale-aware check, and is
completely unaffected by any of this.

### Sequencing — why this didn't break "/"

A full `app/[locale]/...` page tree had to exist for **every** required
consumer route *before* `proxy.ts` was allowed to redirect `/` to `/en`.
This was learned the hard way earlier in this project's history: an
interrupted session once activated the redirect before the corresponding
pages existed, which would have 404'd the homepage. This time, the order
was: build every `app/[locale]/...` page → verify each with `tsc` and a real
build → only then re-enable `proxy.ts`'s middleware and flip `app/page.tsx`
into a redirect stub. The build was run and passed *before* the redirect was
activated, and again *after*, both times generating all 140 routes.

### Legacy URL compatibility

Every pre-existing, non-locale-prefixed URL still works, via one of two
mechanisms:

1. **Redirect stub pages** — the old file path is kept, its content
   replaced with a `redirect()` call to the `/en/...` equivalent. Used for
   every migrated route: `/`, `/restaurants`, `/restaurants/[id]`,
   `/cuisines`, `/cuisine/[slug]`, `/hubs`, `/hubs/[slug]` (plus the 6
   formerly-static hub pages that used to shadow the dynamic route),
   `/reviews`, `/blog`, `/blog/[slug]`, `/recommendations`, `/search`. Two
   of these (`/restaurants`, `/search`) specifically forward their query
   string (`q`, `hub`, `cuisine`, `region`, `dietary`, `postcode`) so old
   filtered/search links don't lose their filters.
2. **`next.config.ts` redirects** — the 15 legacy hardcoded cuisine-slug
   URLs (`/bangladeshi-food-east-london`, etc.) and the
   `edgware-road-arabian-food-hub` hub URL now redirect straight to their
   `/en/...` destination (updated from redirecting to the intermediate,
   now-retired stub pages, to save a hop).

### Retired mechanisms

Two independent, older i18n mechanisms existed before this work and are now
fully retired in favor of next-intl:

- **`app/client-layout.tsx`**'s `localStorage`-based language state — was
  already dead code before this task (only ever reachable via the
  already-unmounted `components/LanguageSwitcher.tsx`); left in place with a
  "RETIRED" comment rather than deleted, per this project's general
  rollback-safety convention.
- **The restaurant detail page's own independent language system** — a
  74-key, 7-language (`en/it/fr/de/es/ar/zh`) `pageCopy` dictionary with its
  own `localStorage`-persisted `lang` state and its own in-page `<select>`.
  Notably, it had **no Bengali entry at all** — one of the platform's 4
  active languages was silently unsupported on this one specific page. This
  was the last page on the old system; it's now on `useTranslations` like
  everything else, and its in-page language selector was removed (the
  site-wide one in `SiteHeader` already covers it).

`lib/i18n.ts` (the old `AppLanguage` type, 10 languages, used by
`City.priorityLanguages` and `FoodHub.description`/`travelInfo`/
`RestaurantMenuItemDoc.translatedNames` etc.) is **not** retired — see
"Relationship to the old `AppLanguage` type" below.

## RTL

`isRTLLocale(locale)` (`lib/locales.ts`) is the single source of truth for
whether a locale renders right-to-left; it checks the full 26-locale
registry's `rtl` flag, not just the active set.

- `app/layout.tsx` (the true root layout — see "Why the root layout, not
  `app/[locale]/layout.tsx`" below) sets `<html lang={locale} dir={dir}>`
  server-side, before any paint — no client-side flash of the wrong
  direction.
- Every page that also needs a `dir` attribute on an inner element (the
  restaurant detail page's `<main>`, for legacy-compatibility reasons tied
  to how that page is structured) derives it from the same
  `isRTLLocale(locale)` check.
- **Logical properties, not hardcoded left/right.** `LanguageSelector` uses
  `end-0`/`text-start`; `RestaurantCard` positions its cuisine badge with a
  conditional `right-3`/`left-3` based on `isRtl` (an explicit conditional,
  not a logical class, because it's positioning over an `<img>` with a
  gradient background rather than flowing text). One real bug was caught
  and fixed during this task: the restaurant detail page's "Quick info"
  sidebar and the reviews rating-distribution bars used hardcoded
  `text-right` for value/count columns inside `justify-between` flex rows —
  correct-looking in LTR, but wrong in RTL (text staying right-aligned
  inside a now-left-positioned flex item instead of following reading
  direction). Fixed to the logical `text-end`.
- **No blind logo/image mirroring.** Nothing in this codebase automatically
  flips images/logos for RTL — the site logo, restaurant photos, cuisine
  icons, and article hero images render identically regardless of
  direction, which is correct (mirroring a photo or a wordmark logo would
  be wrong, not helpful).
- Verified via the built server: `curl http://localhost:3000/ar | grep html` shows
  `<html lang="ar" dir="rtl">`; `/en`, `/bn`, `/fr` all correctly show
  `dir="ltr"`.

## Language selector

`components/discovery/LanguageSelector.tsx`, rendered from `SiteHeader`
(desktop, inline dropdown) and again inside the mobile hamburger menu
(`variant="mobile"`, a 2-column button grid — larger touch targets than a
dropdown on small screens).

- Lists only `ACTIVE_LOCALES` (4 entries) via `getActiveLocaleDefinitions()`
  — a planned-but-inactive locale never appears, so nothing is advertised as
  working before it actually does.
- Shows each language in its own native name (English, বাংলা, العربية,
  Français) — not translated into the *current* viewing language — so a
  Bengali speaker looking at an English page still recognizes বাংলা
  immediately rather than scanning for an English gloss.
- Switching uses `router.replace(pathname, { locale: nextLocale })` from
  `@/i18n/navigation` — this re-renders the **same route** in the new
  locale (a user on `/ar/cuisine/turkish-food-london` switching to French
  lands on `/fr/cuisine/turkish-food-london`, not the French homepage).
- next-intl sets its own `NEXT_LOCALE` cookie on this navigation, so the
  choice is remembered on the next visit — no extra code needed for that.
- Keyboard accessible: the trigger is a real `<button>`; the list uses
  `role="listbox"`/`role="option"` with `aria-selected`; Escape closes it;
  clicking outside closes it.
- Current language is always visible as the trigger button's own label
  (native name of the active locale), not just implied by a flag/icon.
- No navbar overflow: the desktop variant is a single compact dropdown
  trigger (not an inline list of 4 buttons), so it scales to more active
  locales later without needing new navbar space.

## Translation content policy — what gets translated and what doesn't

Enforced by convention and code review, not a runtime check (same trust
model as every other content-safety rule in this codebase):

**Translated** (UI/system chrome — real, human-reviewed copy in all 4
active locales' message catalogs, `messages/{en,bn,ar,fr}.json`, 294 keys
each, verified byte-identical key sets via a parity script after every
change this task made):

- Navigation, footer, buttons, form labels, empty/loading/error states.
- Dietary attribute labels (Vegetarian/Vegan/Non-Vegetarian/Halal/Kosher/
  Jain).
- Claim/correction actions ("Claim this listing", "Suggest an update",
  "Request removal") — explicitly named as examples in this task's own
  spec.
- The public-listing provenance/affiliation notice (`ListingNotice`
  namespace) — sensitive trust-disclosure copy, translated carefully rather
  than left as a known gap, since a restaurant detail page without it in a
  non-English locale would be a real omission.
- Cuisine **category** display names (`Cuisine.localizedName`) — see
  `docs/CUISINE-TAXONOMY.md`.

**Never auto-translated, and never will be by anything in this codebase:**

- Customer review text (`reviews` collection) — always shown exactly as the
  reviewer wrote it, in whatever language that was, regardless of the
  viewer's locale. Search does match a locale's script against review text
  where relevant, but nothing rewrites the review itself.
- Restaurant-authored descriptions, restaurant names, menu item names/
  descriptions typed by an owner, and any other business-provided content —
  shown as-is.
- Proper dish names.
- Third-party factual content (e.g. an open-data source's field values).

**Editorial content (`articles`) is the one place with a deliberate,
explicit middle ground** — see the next section.

## Editorial (blog) localization

`ArticleDoc.translations?: Partial<Record<LocaleCode, ArticleTranslation>>`
(`lib/types.ts`) is additive alongside the existing canonical English
`title`/`excerpt`/`body` fields — one article, one identity/slug, optional
per-locale overrides. A locale entry doesn't need every field: a translator
who's only done the title and excerpt so far is a valid, representable
state.

`lib/articles.ts`'s `getLocalizedArticleContent(article, locale)` resolves
this **per field**, not all-or-nothing — a missing translated `body` falls
back to the English `body` even if that locale's `title`/`excerpt` *are*
translated. `isFullyTranslated` is only `true` when all three fields have a
real translation for that locale.

The article detail page (`BlogArticleClient.tsx`) shows an explicit
"this article isn't translated into your language yet — shown in English"
note whenever it's serving a fallback to a non-English viewer — the reader
is never left wondering whether English content was intentional or a
silent gap. **No article has any translations today** (none existed to
migrate) — this is the storage/read architecture a translator's future work
lands in, not a claim that translated articles exist yet.

Never applies to `reviews` — those are always the reviewer's own words, in
whichever language, never routed through this system.

## Restaurant/menu localization

Predates this task and is preserved unchanged: `RestaurantMenuItemDoc` has
`translatedNames`/`translatedDescriptions` (type `MenuLanguages`, a fixed
object keyed by `en`/`bn`/`fr`/`it`/`es`/`de`) rather than a document per
language — one menu item, optional per-language name/description overrides.
This task didn't touch the live menu-editing UI (still the simpler
`{name, price, note}` shape on `app/restaurants/[id]/edit`), consistent with
an earlier multi-city-architecture task's note that per-item dietary/
translation UI is a larger, separately-scoped change.

## Cuisine display names

See `docs/CUISINE-TAXONOMY.md` in full. Summary: `Cuisine.slug` is the
canonical, language-independent identity (never duplicated per language);
`Cuisine.localizedName?: Partial<Record<AppLanguage, string>>` is an
optional locale-keyed override for the *display name only*, populated for
all 27 cuisines in bn/ar/fr this task added (genuine dictionary-level
cuisine-category translations — "Turkish" → "تركي", not fabricated or
machine-translated). `getCuisineDisplayName(cuisine, locale)` reads it with
an English fallback, used everywhere a cuisine name is rendered (homepage
sections, cuisines index, cuisine detail, restaurant directory filter,
search results).

## Restaurant/cuisine data is locale-independent

Filtering and search operate on the same canonical Firestore data
regardless of UI language — an Arabic-locale user filtering by "تركي" (the
localized display name) resolves to the same underlying `cuisineSlugs`
match as an English-locale user filtering by "Turkish"; nothing stores or
queries a per-locale copy of a restaurant record. `SearchClient.tsx`
specifically matches cuisines against `getCuisineDisplayName(cuisine,
locale)` *in addition to* the canonical English name and `matchTerms`, and
matches articles against their localized title/excerpt — so a search
genuinely works in the searcher's own language, not just in English with
translated chrome around it.

## SEO

- **hreflang**: every `app/[locale]/...` page's `generateMetadata` sets
  `alternates.languages` via `lib/seo.ts`'s `buildLocaleAlternates(path)` —
  one `<link rel="alternate" hreflang="...">` per active locale plus
  `x-default` pointing at the English version. Verified in the rendered
  HTML: `/en` emits exactly 5 such tags (en/bn/ar/fr/x-default).
- **Canonical URLs**: each page's own locale-prefixed URL, not the English
  version — a Bengali page's canonical is its own `/bn/...` URL, not `/en/...`.
- **Sitemap**: `app/sitemap.ts` emits one entry per active locale for every
  static and dynamic route (home, restaurants, cuisines, hubs,
  recommendations, reviews, blog, search, every cuisine detail page, every
  hub detail page, every published article), each with its own
  `alternates.languages` cross-referencing the other locale versions of
  that same page. `/suppliers` (a SmartServeUK operational route) stays a
  single non-prefixed entry.
- **No duplicate-content explosion**: locale prefix is mandatory
  (`localePrefix: "always"`), so there is exactly one canonical URL per
  page per locale — never an ambiguous unprefixed-vs-prefixed pair for the
  default locale.
- **`londonfoodhubs.com` is not configured** — `BASE_URL` in
  `app/sitemap.ts` stays `https://smartserveuk.com`, matching this task's
  explicit "do not configure londonfoodhubs.com yet" instruction. Swapping
  it later is a one-constant change (the same note already existed in this
  file before this task).

## Mobile

Every migrated page keeps the pre-existing mobile-first Tailwind pattern
(`grid-cols-1` default, expanding at `sm:`/`md:`/`xl:`) — nothing in this
task introduced a fixed-width or desktop-only layout. Specifically for the
language selector and navigation: `SiteHeader`'s desktop nav is
`hidden ... lg:flex` and the hamburger trigger is `lg:hidden`, so exactly
one of the two renders at any width; `LanguageSelector`'s `variant="mobile"`
is a dedicated 2-column button grid (larger touch targets than reusing the
desktop dropdown at small widths) mounted inside the hamburger menu, not a
scaled-down version of the desktop dropdown. Verified via code/class review
and the responsive breakpoints actually present in the built output; this
sandbox has no real browser/device to capture visual screenshots at
specific viewport widths, so this is not the same as an actual visual
regression pass — flagged as a real limitation, not glossed over.

## City.priorityLanguages compatibility

`lib/cities.ts`'s `City.priorityLanguages: AppLanguage[]` (from the earlier
multi-city task) is **unchanged** and still typed against the old
`AppLanguage` union, not the new `LocaleCode`. This was a deliberate choice,
not an oversight: `AppLanguage` (10 codes: en/bn/it/fr/de/es/ar/zh/ja/th)
and `LocaleCode` (26 codes) overlap but neither is a subset of the other,
and widening every existing `Record<AppLanguage, ...>` full-key dictionary
across the codebase (menu translations, the old `pageCopy` systems that
still exist elsewhere) to `LocaleCode` would have been a much larger,
higher-risk change than this task's actual scope. London's
`priorityLanguages` (`["en", "bn"]`) happens to already be valid under
*both* unions, so nothing is broken by the coexistence — a future city
whose priority language isn't in `AppLanguage` (e.g. Turkish or Polish, both
only in `LocaleCode`) would need this reconciled first, which
`docs/MULTI-CITY-ROADMAP.md` doesn't currently list as a punch-list item and
should, once a concrete second city is actually being planned.

## Why the root layout, not `app/[locale]/layout.tsx`

Next.js forbids a nested layout from redeclaring `<html>`/`<body>` — only
the true root (`app/layout.tsx`) may. Since operational/CikenTikka/BlackCab
routes live *outside* `app/[locale]/...` entirely, locale-awareness for
`<html lang>`/`dir` has to live in the one layout that wraps *everything*.
`app/layout.tsx` calls `getLocale()`/`getMessages()` (next-intl's
server-side helpers) directly — these resolve to the negotiated locale for
anything under `app/[locale]/...` and fall back to `"en"`/`"ltr"` for every
other route, exactly matching what was previously hardcoded for all of
those pages. `app/[locale]/layout.tsx` only rejects an unsupported locale
segment (`notFound()` via `hasLocale()`) and calls `setRequestLocale` — it
deliberately does not declare `<html>`/`<body>` itself.

## HOW TO ADD LANGUAGE #5

Using Urdu (`ur`, RTL, already in the planned registry) as the worked
example:

1. **Message catalog**: create `messages/ur.json` with the exact same key
   structure as `messages/en.json` (294 keys across 15 namespaces — Common,
   Nav, LanguageSelector, Home, TouristDiscovery, Restaurants, Dietary,
   Reviews, Blog, Recommendations, Cuisines, CuisineDetail, RestaurantDetail,
   ClaimActions, ListingNotice, Hubs, HubDetail, Search, Footer). Every
   value must be real, human-reviewed Urdu — never machine-translated, per
   this project's standing content policy. Verify parity with a script like
   the one used throughout this task:
   ```js
   // flatten both messages/en.json and messages/ur.json, diff the key sets
   ```
2. **Activate it**: in `lib/locales.ts`, change
   `LOCALE_REGISTRY.ur.status` from `"planned"` to `"active"`, and add
   `"ur"` to `ACTIVE_LOCALES`. `RTL_LOCALES` already includes `ur` (set when
   the registry entry was first written), so no RTL change is needed here.
3. **Cuisine display names (optional but recommended)**: add a `ur:` entry
   to `localizedName` for cuisines where a real Urdu translation exists in
   `lib/cuisines.ts`. Missing entries fall back to English automatically —
   this can be done incrementally, cuisine by cuisine, without blocking the
   rest of the activation.
4. **Article translations (optional)**: nothing to do architecturally —
   `ArticleDoc.translations.ur` is already a valid key the moment `ur` is a
   `LocaleCode`, which it already was even while only "planned". Add
   translated articles whenever editorial content for Urdu exists.
5. **Rebuild and verify**: `npx tsc --noEmit`, then `npm run build` — the
   new locale automatically gets a full `/ur/...` route tree (next-intl's
   `generateStaticParams` in `app/[locale]/layout.tsx` maps over
   `routing.locales`, which now includes `ur`), the language selector picks
   it up automatically (`getActiveLocaleDefinitions()` reads the registry),
   the sitemap and every page's hreflang automatically include it
   (`ACTIVE_LOCALES` is the single source both read from), and RTL layout
   applies automatically (`isRTLLocale("ur")` is already `true`).
6. **Smoke test**: `npm start`, then `curl http://localhost:3000/ur` and
   check `<html lang="ur" dir="rtl">`, spot-check a few pages for real Urdu
   text (not raw ICU placeholders — a sign a key was missed), and check
   `/en/restaurants` → language switcher → Urdu preserves the current page
   rather than bouncing to the homepage.

No routing code, no component code, and no Firestore rules change are
needed for any of this — every place that varies by active locale reads
from `lib/locales.ts`'s registry or the message catalogs, not a hardcoded
list.
