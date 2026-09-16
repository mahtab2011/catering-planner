import type { DietaryAttribute } from "@/lib/types";

/**
 * Deterministic, factual data-quality signals for a restaurant listing
 * — see docs/ADMIN-OPERATIONS.md. Every flag is a plain "this field is
 * empty" check against the actual schema, computed the same way every
 * time from the same input. This is NOT a scoring system — there is no
 * 0-100 number, no weighting, no AI/LLM involvement, and no attempt to
 * judge subjective listing quality. An admin decides what a flag means
 * for a given restaurant; this only surfaces the facts.
 */
export type DataQualityFlag =
  | "missing_name"
  | "missing_address"
  | "missing_description"
  | "missing_cuisine"
  | "missing_contact"
  | "missing_hours"
  | "missing_image"
  | "no_menu"
  | "no_hub"
  | "unclaimed"
  | "provenance_needs_review";

export const DATA_QUALITY_FLAG_LABEL: Record<DataQualityFlag, string> = {
  missing_name: "Missing name",
  missing_address: "Missing address",
  missing_description: "Missing description",
  missing_cuisine: "Missing cuisine",
  missing_contact: "Missing contact info",
  missing_hours: "Missing opening hours",
  missing_image: "Missing image",
  no_menu: "No menu",
  no_hub: "No hub/area",
  unclaimed: "Unclaimed",
  provenance_needs_review: "Provenance needs review",
};

function empty(value: string | undefined | null): boolean {
  return !value || !value.trim();
}

/**
 * A restaurant shape broad enough to cover both the canonical
 * `RestaurantDoc` fields and the legacy-but-live fields the
 * edit/detail/discovery pages actually read/write (see
 * `docs/RESTAURANT-OWNER-WORKSPACE.md`'s field/capability matrix for
 * why both exist).
 */
export type DataQualityInput = {
  name?: string;
  fullAddress?: string;
  postcode?: string;
  shortDescription?: string;
  longDescription?: string;
  description?: string;
  cuisine?: string;
  cuisineSlugs?: string[];
  phone?: string;
  email?: string;
  openingHoursText?: string;
  coverImage?: string;
  imageUrl?: string;
  menuCategories?: { category?: string; items?: unknown[] }[];
  hubName?: string;
  area?: string;
  ownerUid?: string;
  dataConfidence?: "verified" | "unverified" | "flagged";
  dietaryAttributes?: DietaryAttribute[];
};

function hasAnyMenuItems(menuCategories?: { items?: unknown[] }[]): boolean {
  return (menuCategories || []).some((cat) => Array.isArray(cat?.items) && cat.items.length > 0);
}

/**
 * Compute every applicable data-quality flag for a restaurant. Order
 * is stable (declaration order below) so admin UI lists render
 * consistently.
 */
export function assessRestaurantDataQuality(restaurant: DataQualityInput): DataQualityFlag[] {
  const flags: DataQualityFlag[] = [];

  if (empty(restaurant.name)) flags.push("missing_name");
  if (empty(restaurant.fullAddress) && empty(restaurant.postcode)) flags.push("missing_address");
  if (empty(restaurant.shortDescription) && empty(restaurant.longDescription) && empty(restaurant.description)) {
    flags.push("missing_description");
  }
  if (empty(restaurant.cuisine) && (restaurant.cuisineSlugs || []).length === 0) flags.push("missing_cuisine");
  if (empty(restaurant.phone) && empty(restaurant.email)) flags.push("missing_contact");
  if (empty(restaurant.openingHoursText)) flags.push("missing_hours");
  if (empty(restaurant.coverImage) && empty(restaurant.imageUrl)) flags.push("missing_image");
  if (!hasAnyMenuItems(restaurant.menuCategories)) flags.push("no_menu");
  if (empty(restaurant.hubName) && empty(restaurant.area)) flags.push("no_hub");
  if (empty(restaurant.ownerUid)) flags.push("unclaimed");
  if (restaurant.dataConfidence === "flagged" || restaurant.dataConfidence === "unverified") {
    flags.push("provenance_needs_review");
  }

  return flags;
}
