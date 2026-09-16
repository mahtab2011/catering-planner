import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildLocaleAlternates } from "@/lib/seo";
import SiteHeader from "@/components/discovery/SiteHeader";
import SiteFooter from "@/components/discovery/SiteFooter";
import HomeHero from "@/components/discovery/HomeHero";
import TouristDiscoverySection from "@/components/discovery/TouristDiscoverySection";
import CuisinePreviewSection from "@/components/discovery/CuisinePreviewSection";
import HubPreviewSection from "@/components/discovery/HubPreviewSection";
import FeaturedRestaurantsSection from "@/components/discovery/FeaturedRestaurantsSection";
import DishesToDiscoverSection from "@/components/discovery/DishesToDiscoverSection";
import RecommendsPreviewSection from "@/components/discovery/RecommendsPreviewSection";
import LatestReviewsSection from "@/components/discovery/LatestReviewsSection";
import BlogPreviewSection from "@/components/discovery/BlogPreviewSection";
import RestaurantCTASection from "@/components/discovery/RestaurantCTASection";
import CommunityCTASection from "@/components/discovery/CommunityCTASection";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Home");
  return {
    title: `London Food Hubs | ${t("heroTitle")}`,
    description: t("heroSubtitle"),
    alternates: { canonical: "/", languages: buildLocaleAlternates("") },
    openGraph: {
      title: "London Food Hubs",
      description: t("heroSubtitle"),
      url: "https://londonfoodhubs.com",
      siteName: "London Food Hubs",
      type: "website",
    },
  };
}

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-neutral-50">
        <HomeHero />

        <div className="mx-auto max-w-7xl space-y-16 px-4 py-16 sm:px-6 lg:px-8">
          <TouristDiscoverySection />
          <CuisinePreviewSection />
          <HubPreviewSection />
          <FeaturedRestaurantsSection />
          <DishesToDiscoverSection />
          <RecommendsPreviewSection />
          <LatestReviewsSection limit={6} />
          <BlogPreviewSection />
          <RestaurantCTASection />
          <CommunityCTASection />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
