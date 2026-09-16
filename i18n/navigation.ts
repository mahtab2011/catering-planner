import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * Locale-aware Link/useRouter/usePathname/redirect, scoped to the
 * `routing` config above (the app/[locale] subtree only). Import
 * these instead of next/link and next/navigation inside any
 * component under app/[locale] — they automatically prepend the
 * current locale to generated hrefs so switching pages within a
 * locale never silently drops back to the default locale.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
