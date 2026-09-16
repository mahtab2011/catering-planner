import type { DietaryAttribute } from "@/lib/types";

/**
 * Pure filter predicates shared by the customer discovery pages (the
 * restaurants browse page today; usable anywhere else that filters a
 * restaurant list) — see docs/RESTAURANT-DISCOVERY.md. Extracted so
 * they can be unit tested without React/Firebase (Task H), mirroring
 * lib/restaurantClaim.ts and lib/restaurantOwnership.ts from Tasks F/G.
 */

export type ServiceFilterValue = "All" | "dineIn" | "takeaway" | "delivery" | "collection";

/**
 * Does a restaurant offer the service a filter value represents?
 * Reads ONLY the existing boolean fields already in the data model —
 * `dineIn`/`takeaway`/`delivery`/`collectionEnabled`. A restaurant
 * marked "delivery" means the restaurant itself offers delivery —
 * London Food Hubs does not operate, dispatch, or process any
 * delivery, order, or payment (see docs/RESTAURANT-DISCOVERY.md).
 */
export function restaurantOffersService(
  restaurant: { dineIn?: boolean; takeaway?: boolean; delivery?: boolean; collectionEnabled?: boolean },
  service: ServiceFilterValue
): boolean {
  if (service === "All") return true;
  if (service === "dineIn") return Boolean(restaurant.dineIn);
  if (service === "takeaway") return Boolean(restaurant.takeaway);
  if (service === "delivery") return Boolean(restaurant.delivery);
  return Boolean(restaurant.collectionEnabled);
}

/**
 * Does a restaurant carry a given dietary attribute? Checks ONLY the
 * structured `dietaryAttributes`/`dietaryCertifications` arrays and
 * the legacy `isHalal` boolean — see lib/dietary.ts and
 * docs/RESTAURANT-DATA-PROVENANCE.md. Deliberately never inspects
 * free-text fields (`tags`, `shortDescription`, `cuisine`) — a
 * restaurant's own wording (e.g. a tag that happens to say
 * "vegetarian-friendly") must never be treated as a verified platform
 * dietary claim. See the import pipeline's `validateDietaryClaims.ts`
 * for the equivalent safeguard at data-entry time.
 */
export function restaurantHasDietaryAttribute(
  restaurant: { isHalal?: boolean; dietaryAttributes?: DietaryAttribute[]; dietaryCertifications?: DietaryAttribute[] },
  attr: DietaryAttribute
): boolean {
  if (attr === "halal" && restaurant.isHalal) return true;
  return (
    (restaurant.dietaryAttributes || []).includes(attr) ||
    (restaurant.dietaryCertifications || []).includes(attr)
  );
}
