import type { RestaurantContentTranslation } from "./types";
import type { LocaleCode } from "./locales";

export type LocalizedRestaurantContent = {
  name: string;
  shortDescription: string;
  longDescription: string;
  /** True only when this locale has an owner-approved translation for
   *  every field that had original content to translate — lets a UI
   *  show "not translated yet" only when genuinely relevant. */
  isTranslated: boolean;
};

/**
 * Resolves a restaurant's own name/description text for a given
 * locale — see docs/MULTILINGUAL-ARCHITECTURE.md's "Restaurant-
 * supplied content" policy.
 *
 * Restaurant-supplied content is NEVER auto-translated. This function
 * reads `RestaurantDoc.contentTranslations[locale]` ONLY — a field
 * that is populated exclusively once a
 * `RestaurantTranslationRequestDoc` for that locale has reached
 * `PUBLISHED` (i.e. the restaurant itself approved the translation).
 * There is no machine-translation call anywhere in this function or
 * anything it depends on. When no approved translation exists for a
 * field (the overwhelmingly common case today — no restaurant has
 * ever requested or received one), that field falls back to the
 * canonical original text, unchanged, in every locale — switching the
 * platform's UI language never silently rewrites what a restaurant
 * wrote about itself.
 *
 * Every field falls back independently, the same pattern as
 * lib/articles.ts's getLocalizedArticleContent() for editorial
 * content — a restaurant that approved a translated description but
 * not an alternative name still shows its real original name.
 */
export function getLocalizedRestaurantContent(
  restaurant: {
    name?: string;
    shortDescription?: string;
    longDescription?: string;
    contentTranslations?: Partial<Record<LocaleCode, RestaurantContentTranslation>>;
  },
  locale: LocaleCode | string
): LocalizedRestaurantContent {
  const translation = restaurant.contentTranslations?.[locale as LocaleCode];

  const name = translation?.name || restaurant.name || "";
  const shortDescription = translation?.shortDescription || restaurant.shortDescription || "";
  const longDescription = translation?.longDescription || restaurant.longDescription || "";

  const hasOriginalShort = Boolean(restaurant.shortDescription);
  const hasOriginalLong = Boolean(restaurant.longDescription);
  const isTranslated =
    (!hasOriginalShort || Boolean(translation?.shortDescription)) &&
    (!hasOriginalLong || Boolean(translation?.longDescription));

  return { name, shortDescription, longDescription, isTranslated };
}
