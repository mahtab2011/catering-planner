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
 * card/page, combining the structured `dietaryAttributes` array (or
 * its deprecated predecessor `dietaryCertifications`, for documents
 * that haven't been re-saved since the rename) with the legacy
 * `isHalal` boolean so all three data shapes display consistently
 * without showing "Halal" twice. Shared by every place that renders a
 * restaurant card so the display logic lives in one place rather than
 * being re-implemented per page.
 */
export function buildDietaryBadgeLabels(business: {
  isHalal?: boolean;
  dietaryAttributes?: DietaryAttribute[];
  /** @deprecated Use `dietaryAttributes`. Still read here so
   *  documents written before the rename keep displaying correctly. */
  dietaryCertifications?: DietaryAttribute[];
}): string[] {
  return buildDietaryBadgeAttributes(business).map((attr) => DIETARY_ATTRIBUTE_LABELS[attr]);
}

/** Same dedup logic as buildDietaryBadgeLabels(), but returns the raw
 *  DietaryAttribute keys rather than pre-translated (always-English)
 *  label strings — for any locale-aware caller (e.g.
 *  components/restaurants/RestaurantCard.tsx) that needs to translate
 *  each attribute itself via useTranslations("Dietary") +
 *  DIETARY_ATTRIBUTE_TRANSLATION_KEY. Prefer this over
 *  buildDietaryBadgeLabels() in any component that renders under
 *  next-intl. */
export function buildDietaryBadgeAttributes(business: {
  isHalal?: boolean;
  dietaryAttributes?: DietaryAttribute[];
  dietaryCertifications?: DietaryAttribute[];
}): DietaryAttribute[] {
  const attributes = new Set<DietaryAttribute>([
    ...(business.dietaryAttributes || []),
    ...(business.dietaryCertifications || []),
  ]);
  if (business.isHalal) attributes.add("halal");
  return [...attributes];
}

/** Maps DietaryAttribute's snake_case values to the "Dietary" message
 *  namespace's camelCase keys (messages/{en,bn,ar,fr}.json) — the
 *  single place this mapping is defined; every locale-aware renderer
 *  of a dietary badge should import this rather than redefining it. */
export const DIETARY_ATTRIBUTE_TRANSLATION_KEY: Record<DietaryAttribute, string> = {
  vegetarian: "vegetarian",
  vegan: "vegan",
  non_vegetarian: "nonVegetarian",
  halal: "halal",
  kosher: "kosher",
  jain: "jain",
};
