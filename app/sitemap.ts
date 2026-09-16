import { MetadataRoute } from "next";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAllCuisines } from "@/lib/cuisines";
import { getAllHubs } from "@/lib/hubs";
import { ACTIVE_LOCALES, DEFAULT_LOCALE } from "@/lib/locales";

// The live consumer domain today. Swap this one constant when
// londonfoodhubs.com becomes canonical — nothing else in this file
// needs to change.
const BASE_URL = "https://smartserveuk.com";

async function getPublishedArticleSlugs(): Promise<string[]> {
  try {
    const snap = await getDocs(query(collection(db, "articles"), where("status", "==", "published")));
    return snap.docs.map((d) => (d.data().slug as string) || d.id).filter(Boolean);
  } catch (error) {
    console.error("sitemap: failed to load published articles, omitting from sitemap:", error);
    return [];
  }
}

/**
 * Builds one sitemap entry per active locale for a given path, plus
 * an `alternates.languages` map (hreflang) linking every locale
 * version of that same page to each other, with `x-default` pointing
 * at the English version — the canonical fallback everywhere else in
 * this codebase treats English as. Every consumer route in
 * app/[locale]/... exists in all 4 active locales (there's no partial
 * locale coverage at the route level — only content within a page,
 * like an untranslated article, can fall back internally), so this is
 * safe to generate unconditionally for every path passed in.
 */
function localizedEntries(path: string, lastModified: Date): MetadataRoute.Sitemap {
  const languages: Record<string, string> = {};
  for (const locale of ACTIVE_LOCALES) {
    languages[locale] = `${BASE_URL}/${locale}${path}`;
  }
  languages["x-default"] = `${BASE_URL}/${DEFAULT_LOCALE}${path}`;

  return ACTIVE_LOCALES.map((locale) => ({
    url: `${BASE_URL}/${locale}${path}`,
    lastModified,
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPaths = ["", "/restaurants", "/cuisines", "/hubs", "/recommendations", "/reviews", "/blog", "/search"];
  const staticRoutes = staticPaths.flatMap((path) => localizedEntries(path, now));

  // /suppliers is a SmartServeUK operational route outside app/[locale]
  // — not locale-prefixed, listed once as-is.
  const operationalRoutes: MetadataRoute.Sitemap = [{ url: `${BASE_URL}/suppliers`, lastModified: now }];

  const cuisineRoutes = getAllCuisines().flatMap((cuisine) => localizedEntries(`/cuisine/${cuisine.slug}`, now));
  const hubRoutes = getAllHubs().flatMap((hub) => localizedEntries(`/hubs/${hub.slug}`, now));

  const articleSlugs = await getPublishedArticleSlugs();
  const articleRoutes = articleSlugs.flatMap((slug) => localizedEntries(`/blog/${slug}`, now));

  return [...staticRoutes, ...operationalRoutes, ...cuisineRoutes, ...hubRoutes, ...articleRoutes];
}
