import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Single robots.txt for the whole app (SmartServeUK operational
 * routes, London Food Hubs consumer routes, CikenTikka, BlackCab all
 * share one Next.js deployment, so they share one robots.txt).
 * Disallows account/admin/checkout-style private areas; everything
 * else — including every /en, /bn, /ar, /fr consumer page — is
 * crawlable. Sitemap reference uses the centralized production
 * origin (lib/site.ts), never a hardcoded/Vercel URL.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/admin/",
        "/dashboard",
        "/dashboard/",
        "/dashboard.old",
        "/account/",
        "/checkout",
        "/checkout/",
        "/orders",
        "/orders/",
        "/staff",
        "/staff/",
        "/kitchen",
        "/kitchen/",
        "/activity",
        "/locked",
        "/restaurants/admin/",
        "/restaurants/new",
        "/restaurants/*/edit",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
