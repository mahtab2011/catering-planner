import { redirect } from "next/navigation";

/**
 * In practice this file is now unreachable on the main domain: proxy.ts's
 * next-intl middleware intercepts "/" first and redirects to "/en" before
 * Next.js ever resolves a page for it. This redirect exists anyway as an
 * explicit fallback/documentation trail, consistent with every other
 * migrated route in this app, and covers any path (e.g. a static export,
 * a middleware bypass) where the proxy genuinely doesn't run. The real
 * homepage implementation is app/[locale]/page.tsx — see
 * docs/MULTILINGUAL-ARCHITECTURE.md.
 */
export default function LegacyHomePageRedirect() {
  redirect("/en");
}
