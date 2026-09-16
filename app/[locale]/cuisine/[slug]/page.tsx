import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getCuisineBySlug, getCuisineDisplayName } from "@/lib/cuisines";
import { buildLocaleAlternates } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import CuisineDetailClient from "@/components/cuisine/CuisineDetailClient";

type Params = { params: Promise<{ slug: string; locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const cuisine = getCuisineBySlug(slug);
  const locale = await getLocale();

  if (!cuisine) {
    return { title: "Cuisine not found | London Food Hubs" };
  }

  const displayName = getCuisineDisplayName(cuisine, locale);

  return {
    title: locale === "en" ? cuisine.seoTitle : `${displayName} Food in London | London Food Hubs`,
    description: cuisine.seoDescription,
    alternates: {
      canonical: `/${locale}/cuisine/${cuisine.slug}`,
      languages: buildLocaleAlternates(`/cuisine/${cuisine.slug}`),
    },
    openGraph: {
      title: cuisine.seoTitle,
      description: cuisine.seoDescription,
      url: `${SITE_URL}/${locale}/cuisine/${cuisine.slug}`,
      siteName: "London Food Hubs",
      type: "website",
    },
  };
}

export default async function CuisinePage({ params }: Params) {
  const { slug } = await params;
  const cuisine = getCuisineBySlug(slug);

  if (!cuisine) {
    notFound();
  }

  return <CuisineDetailClient cuisine={cuisine} />;
}
