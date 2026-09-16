import { ACTIVE_LOCALES, DEFAULT_LOCALE } from "./locales";

/**
 * Builds the `alternates.languages` map (hreflang) for a given path
 * within the app/[locale] tree, e.g. buildLocaleAlternates("/cuisines")
 * -> { en: "/en/cuisines", bn: "/bn/cuisines", ..., "x-default": "/en/cuisines" }.
 *
 * Used in every locale page's generateMetadata() so search engines
 * know the en/bn/ar/fr versions of a page are alternates of each
 * other, with English as the x-default fallback — matching this
 * codebase's canonical-English-fallback rule everywhere else.
 */
export function buildLocaleAlternates(path: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of ACTIVE_LOCALES) {
    languages[locale] = `/${locale}${path}`;
  }
  languages["x-default"] = `/${DEFAULT_LOCALE}${path}`;
  return languages;
}
