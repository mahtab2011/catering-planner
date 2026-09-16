import type { RestaurantOwnerClaimStatus } from "@/lib/types";

/**
 * Pure helpers for the admin restaurant overview page — see
 * docs/ADMIN-OPERATIONS.md. `ownerUid` remains the sole authoritative
 * ownership fact throughout this codebase (see
 * docs/RESTAURANT-CLAIM-WORKFLOW.md / docs/RESTAURANT-OWNER-WORKSPACE.md);
 * this module only derives a human-readable label for admin display,
 * never a second ownership model.
 */

export type OwnershipDisplayState = "claimed" | "claim_pending" | "claim_rejected" | "unclaimed";

export const OWNERSHIP_DISPLAY_LABEL: Record<OwnershipDisplayState, string> = {
  claimed: "Claimed",
  claim_pending: "Claim pending",
  claim_rejected: "Claim rejected",
  unclaimed: "Unclaimed",
};

/**
 * `ownerUid` wins whenever it's set — an admin could, in principle, see
 * a restaurant with `ownerUid` set AND a stale `ownerClaimStatus` left
 * over from before approval; the actual authoritative fact
 * (`ownerUid`) must never be shadowed by the workflow-state field. Only
 * once `ownerUid` is empty does `ownerClaimStatus` distinguish pending
 * from rejected from never-claimed.
 */
export function deriveOwnershipDisplayState(restaurant: {
  ownerUid?: string;
  ownerClaimStatus?: RestaurantOwnerClaimStatus;
}): OwnershipDisplayState {
  if (restaurant.ownerUid) return "claimed";
  if (restaurant.ownerClaimStatus === "claim_pending") return "claim_pending";
  if (restaurant.ownerClaimStatus === "claim_rejected") return "claim_rejected";
  return "unclaimed";
}

/**
 * Does a restaurant match a free-text admin search term? Checks only
 * fields already meaningful for admin lookup (name, city, hub/area,
 * cuisine, postcode) — never restaurant free text run through any
 * translation, and never a claimant's private contact details (those
 * are shown only on the dedicated claims queue, never searchable from
 * this general overview).
 */
export function restaurantMatchesAdminSearch(
  restaurant: {
    name?: string;
    citySlug?: string;
    city?: string;
    hubName?: string;
    area?: string;
    cuisine?: string;
    postcode?: string;
  },
  term: string
): boolean {
  const q = term.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    restaurant.name,
    restaurant.citySlug,
    restaurant.city,
    restaurant.hubName,
    restaurant.area,
    restaurant.cuisine,
    restaurant.postcode,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}
