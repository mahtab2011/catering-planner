import type { ArticleDoc } from "./types";
import type { LocaleCode } from "./locales";

export type LocalizedArticleContent = {
  title: string;
  excerpt: string;
  body: string;
  /** True when at least one field came from a real translation rather
   *  than the canonical English fallback — lets the UI show an
   *  explicit "shown in English" note only when it's actually
   *  relevant (see docs/MULTILINGUAL-ARCHITECTURE.md's editorial
   *  localization section). */
  isFullyTranslated: boolean;
};

/**
 * Resolves an article's reader-facing text for a given locale.
 *
 * One article has one canonical identity (its `slug`, `id`) and one
 * English version, which always exists. `translations` is optional
 * and per-field — a locale entry doesn't need every field filled in.
 * Fallback is explicit and per-field: a missing translated title
 * falls back to the English title even if the excerpt/body for that
 * locale DO exist, rather than falling back all-or-nothing.
 *
 * Never applies to customer reviews — those are a different
 * collection (`reviews`) and are never translated as if they were
 * editorial content.
 */
export function getLocalizedArticleContent(
  article: ArticleDoc,
  locale: LocaleCode | string
): LocalizedArticleContent {
  const translation = article.translations?.[locale as LocaleCode];

  const title = translation?.title || article.title;
  const excerpt = translation?.excerpt || article.excerpt;
  const body = translation?.body || article.body;

  const isFullyTranslated = Boolean(
    translation?.title && translation?.excerpt && translation?.body
  );

  return { title, excerpt, body, isFullyTranslated };
}
