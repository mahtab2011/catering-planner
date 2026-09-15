import { MetadataRoute } from "next";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAllCuisines } from "@/lib/cuisines";
import { getAllHubs } from "@/lib/hubs";

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now },
    { url: `${BASE_URL}/restaurants`, lastModified: now },
    { url: `${BASE_URL}/suppliers`, lastModified: now },
    { url: `${BASE_URL}/cuisines`, lastModified: now },
    { url: `${BASE_URL}/hubs`, lastModified: now },
    { url: `${BASE_URL}/recommendations`, lastModified: now },
    { url: `${BASE_URL}/reviews`, lastModified: now },
    { url: `${BASE_URL}/blog`, lastModified: now },
    { url: `${BASE_URL}/search`, lastModified: now },
  ];

  const cuisineRoutes: MetadataRoute.Sitemap = getAllCuisines().map((cuisine) => ({
    url: `${BASE_URL}/cuisine/${cuisine.slug}`,
    lastModified: now,
  }));

  const hubRoutes: MetadataRoute.Sitemap = getAllHubs().map((hub) => ({
    url: `${BASE_URL}/hubs/${hub.slug}`,
    lastModified: now,
  }));

  const articleSlugs = await getPublishedArticleSlugs();
  const articleRoutes: MetadataRoute.Sitemap = articleSlugs.map((slug) => ({
    url: `${BASE_URL}/blog/${slug}`,
    lastModified: now,
  }));

  return [...staticRoutes, ...cuisineRoutes, ...hubRoutes, ...articleRoutes];
}
