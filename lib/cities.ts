import type { City } from "./types";

/**
 * Canonical city registry for the multi-city discovery architecture.
 *
 * London Food Hubs is the first and, for now, ONLY active city
 * edition — this file intentionally contains a single entry. Adding
 * a second city later (Dubai, Paris, New York, Berlin, Rome, Makkah,
 * Madinah, Delhi, Mumbai, Singapore, Hong Kong, Beijing, or any
 * other) means adding one more object here with its own
 * priorityLanguages/prominentDietaryFilters — no other file in the
 * discovery domain (lib/cuisines.ts, lib/hubs.ts, lib/dietary.ts,
 * the review/article/recommendation types) should need to change,
 * since they all refer to a city by `citySlug`, not by name or by
 * assuming "london" anywhere in their own logic.
 *
 * Do not add placeholder entries for future cities here "just in
 * case" — that would be building city datasets ahead of when they're
 * actually needed, which this architecture is explicitly meant to
 * avoid. Add a city only when it's actually being launched.
 */
export const CITIES: Record<string, City> = {
  london: {
    id: "london",
    slug: "london",
    name: "London",
    countryCode: "GB",
    currencyCode: "GBP",
    // Reflects what this codebase actually has real translated
    // content for today (see lib/i18n.ts / the homepage's language
    // dictionaries) — en and bn are the only two languages with real
    // copy throughout the app; the rest of AppLanguage is supported
    // by the type system but not yet populated. Not aspirational.
    priorityLanguages: ["en", "bn"],
    // Halal and vegetarian discovery already have real signal in
    // this city's existing hub/restaurant content (see lib/hubs.ts's
    // cuisineTags and the existing isHalal field); vegan/kosher/jain
    // remain fully supported filters, just not the ones featured
    // first for this particular city edition.
    prominentDietaryFilters: ["halal", "vegetarian"],
    isActive: true,
    seoTitle: "London Food Hubs",
    seoDescription:
      "Discover restaurants, home cooks, caterers and bakeries from every community across London.",
  },
};

export function getCityBySlug(slug: string): City | undefined {
  return CITIES[slug];
}

export function getAllCities(): City[] {
  return Object.values(CITIES);
}

export function getActiveCities(): City[] {
  return getAllCities().filter((c) => c.isActive);
}

/** The current city edition this deployment serves. Every place in
 *  the app that needs "the active city" (restaurant creation
 *  defaults, hub filtering, language-priority defaults) should read
 *  this rather than hardcoding the string "london", so switching
 *  which edition a given deployment serves — or supporting more than
 *  one at once — is a change in one place. */
export const DEFAULT_CITY_SLUG = "london";

/**
 * Does a listing belong to this deployment's active city edition?
 *
 * A missing `citySlug` counts as belonging (returns true) —
 * deliberately, not a bug: every restaurant that exists today predates
 * or otherwise lacks this field was created before/without
 * `citySlug`, back when London was implicitly the only possibility
 * (see `firestore.rules`' `restaurants` create rule, which has
 * required `citySlug` on every NEW restaurant since the multi-city
 * architecture was introduced — but does not retroactively backfill
 * older documents). Treating "no citySlug" as "this city" avoids
 * silently hiding real, already-live restaurants just because they
 * predate the field — see docs/RESTAURANT-DISCOVERY.md's "London-only
 * scope" section. This is a client-side READ-time filter only; it
 * never writes or migrates any restaurant document.
 */
export function belongsToActiveCity(citySlug: string | undefined, activeCitySlug: string = DEFAULT_CITY_SLUG): boolean {
  return !citySlug || citySlug === activeCitySlug;
}
