import type { RecommendationTargetType, RecommendationType } from "./types";

/**
 * Configurable labels for editorial recommendation types. This is the
 * single place new recommendation types get named — the admin form,
 * the public recommendations page and any badges all read from here.
 */
export const RECOMMENDATION_TYPE_LABELS: Record<RecommendationType, string> = {
  editors_choice: "Editor's Choice",
  dish_of_the_week: "Dish of the Week",
  hidden_gem: "Hidden Gem",
  worth_the_journey: "Worth the Journey",
  family_favourite: "Family Favourite",
  budget_favourite: "Budget Favourite",
  traditional_favourite: "Traditional Favourite",
  vegetarian_discovery: "Vegetarian Discovery",
  halal_discovery: "Halal Discovery",
  special_occasion: "Special Occasion",
};

export const RECOMMENDATION_TARGET_LABELS: Record<RecommendationTargetType, string> = {
  restaurant: "Restaurant",
  dish: "Dish",
  cuisine: "Cuisine",
  hub: "Food Hub",
  article: "Blog Article",
};

export const RECOMMENDATION_TYPES = Object.keys(
  RECOMMENDATION_TYPE_LABELS
) as RecommendationType[];

export const RECOMMENDATION_TARGET_TYPES = Object.keys(
  RECOMMENDATION_TARGET_LABELS
) as RecommendationTargetType[];
