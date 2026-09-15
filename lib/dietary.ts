import type { DietaryAttribute } from "./types";

/**
 * Configurable labels for structured dietary attributes. This is the
 * single place a new attribute would be added/renamed — restaurant
 * forms, filter chips, and badges all read from here rather than
 * hardcoding the list.
 *
 * IMPORTANT: these are self-declared facts, entered by a restaurant
 * owner or admin. Nothing in this codebase should ever set a
 * DietaryAttribute by inferring it from a cuisine name (e.g.
 * assuming "Indian" implies vegetarian-friendly) or from review text
 * (a customer mentioning "good vegan options" is not a certification).
 * If you're adding code that touches DietaryAttribute, it should be
 * reading a value someone explicitly entered, never computing one.
 */
export const DIETARY_ATTRIBUTE_LABELS: Record<DietaryAttribute, string> = {
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  non_vegetarian: "Non-Vegetarian",
  halal: "Halal",
  kosher: "Kosher",
  jain: "Jain",
};

export const DIETARY_ATTRIBUTES = Object.keys(
  DIETARY_ATTRIBUTE_LABELS
) as DietaryAttribute[];

/** Short description shown next to each attribute in admin/owner
 *  forms, to discourage guessing — e.g. a restaurant shouldn't tick
 *  "Kosher" unless it actually holds that certification. */
export const DIETARY_ATTRIBUTE_HELP: Record<DietaryAttribute, string> = {
  vegetarian: "The business offers genuinely vegetarian dishes (no meat or fish).",
  vegan: "The business offers genuinely vegan dishes (no animal products).",
  non_vegetarian: "The business serves meat and/or fish.",
  halal: "The business holds Halal certification, or all meat served is Halal.",
  kosher: "The business holds Kosher certification.",
  jain: "The business offers Jain-friendly dishes (no root vegetables, strict vegetarian).",
};

/**
 * Builds a deduplicated list of dietary badge labels for a restaurant
 * card/page, combining the structured `dietaryCertifications` array
 * with the legacy `isHalal` boolean so both data shapes display
 * consistently without showing "Halal" twice. Shared by every place
 * that renders a restaurant card so the display logic lives in one
 * place rather than being re-implemented per page.
 */
export function buildDietaryBadgeLabels(business: {
  isHalal?: boolean;
  dietaryCertifications?: DietaryAttribute[];
}): string[] {
  const attributes = new Set<DietaryAttribute>(business.dietaryCertifications || []);
  if (business.isHalal) attributes.add("halal");
  return [...attributes].map((attr) => DIETARY_ATTRIBUTE_LABELS[attr]);
}
