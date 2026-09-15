import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCuisineBySlug } from "@/lib/cuisines";
import CuisineDetailClient from "@/components/cuisine/CuisineDetailClient";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const cuisine = getCuisineBySlug(slug);

  if (!cuisine) {
    return { title: "Cuisine not found | London Food Hubs" };
  }

  return {
    title: cuisine.seoTitle,
    description: cuisine.seoDescription,
    alternates: { canonical: `/cuisine/${cuisine.slug}` },
    openGraph: {
      title: cuisine.seoTitle,
      description: cuisine.seoDescription,
      url: `https://londonfoodhubs.com/cuisine/${cuisine.slug}`,
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
