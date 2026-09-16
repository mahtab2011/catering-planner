import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

/**
 * Loads messages/{locale}.json for the negotiated locale, falling
 * back to the default locale (English) if the requested locale isn't
 * one of routing.locales — this is next-intl's own fallback
 * mechanism, not a custom one, so it stays correct automatically as
 * ACTIVE_LOCALES grows.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
