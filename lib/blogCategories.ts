/**
 * Configurable blog category taxonomy. This is the single place to
 * add/rename/remove categories — nothing else in the blog feature
 * hardcodes this list.
 */
export const BLOG_CATEGORIES = [
  "London Food Stories",
  "Cuisine Guides",
  "Restaurant Stories",
  "What to Eat",
  "Food Hubs",
  "Healthy Choices",
  "Traditional Food",
  "New in London",
  "Festival & Seasonal Food",
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];
