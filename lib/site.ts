/**
 * Centralized, environment-aware site origin — see
 * docs/HOSTINGER-DEPLOYMENT.md. This is the ONE place the production
 * domain is defined; every canonical URL, hreflang alternate,
 * sitemap entry, OpenGraph/Twitter URL, and robots.txt sitemap
 * reference reads from here instead of hardcoding a domain literal.
 *
 * Before this existed, the domain was already inconsistently
 * hardcoded across the codebase — some files had "smartserveuk.com"
 * (the legacy default), others had "londonfoodhubs.com" typed
 * directly. This fixes that inconsistency, not just future-proofs
 * against one.
 *
 * Resolution order:
 *   1. NEXT_PUBLIC_SITE_URL, if set — lets a staging deployment (or
 *      any future environment) use its own origin without touching
 *      code or corrupting the production default. Must be a full
 *      origin with no trailing slash, e.g. "https://staging.example.com".
 *   2. In development (NODE_ENV !== "production"), localhost — so
 *      local dev never accidentally emits production URLs in
 *      metadata/canonical tags.
 *   3. Otherwise, the production origin below.
 *
 * This governs only London Food Hubs' own consumer-facing metadata
 * (the app/[locale] subtree). SmartServeUK's own operational branding
 * (app/layout.tsx's default metadata, lib/auth.ts's password-reset
 * link) intentionally still points at smartserveuk.com — that's a
 * different, legitimate domain for a different part of this
 * application, not something this constant should absorb.
 */

export const PRODUCTION_SITE_URL = "https://londonfoodhubs.com";

function resolveSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/+$/, "");

  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:3000";
  }

  return PRODUCTION_SITE_URL;
}

export const SITE_URL = resolveSiteUrl();
