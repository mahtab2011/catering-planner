import { defineRouting } from "next-intl/routing";
import { ACTIVE_LOCALES, DEFAULT_LOCALE } from "@/lib/locales";

/**
 * next-intl routing config for the London Food Hubs consumer-facing
 * subtree (everything under app/[locale]/...). SmartServeUK
 * operational routes, CikenTikka, and BlackCab are NOT part of this
 * routing config and are untouched by it — see
 * docs/MULTILINGUAL-ARCHITECTURE.md's "SmartServeUK boundary"
 * section.
 *
 * localePrefix "always" means every locale, including the default,
 * appears in the URL (/en/restaurants, not a prefix-less
 * /restaurants for English). This was chosen over "as-needed"
 * because this app already has unprefixed legacy URLs
 * (/restaurants, /cuisine/[slug], etc.) that need to keep working via
 * redirect — an unprefixed /restaurants meaning "English" would
 * collide with that legacy path instead of cleanly redirecting to
 * it. See the URL/SEO section of the architecture doc.
 */
export const routing = defineRouting({
  locales: ACTIVE_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "always",
});
