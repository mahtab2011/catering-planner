import type { Metadata } from "next";
import SiteHeader from "@/components/discovery/SiteHeader";
import SiteFooter from "@/components/discovery/SiteFooter";
import HomeHero from "@/components/discovery/HomeHero";
import CuisinePreviewSection from "@/components/discovery/CuisinePreviewSection";
import HubPreviewSection from "@/components/discovery/HubPreviewSection";
import FeaturedRestaurantsSection from "@/components/discovery/FeaturedRestaurantsSection";
import DishesToDiscoverSection from "@/components/discovery/DishesToDiscoverSection";
import RecommendsPreviewSection from "@/components/discovery/RecommendsPreviewSection";
import LatestReviewsSection from "@/components/discovery/LatestReviewsSection";
import BlogPreviewSection from "@/components/discovery/BlogPreviewSection";
import RestaurantCTASection from "@/components/discovery/RestaurantCTASection";
import CommunityCTASection from "@/components/discovery/CommunityCTASection";

export const metadata: Metadata = {
  title: "London Food Hubs | Discover the World of Food Across London",
  description:
    "Discover restaurants, home cooks, caterers and bakeries from every community across London — Bangladeshi, Indian, Pakistani, Turkish, Thai, Middle Eastern, African, Caribbean and more.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "London Food Hubs",
    description: "Discover the world of food across London.",
    url: "https://londonfoodhubs.com",
    siteName: "London Food Hubs",
    type: "website",
  },
};

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-neutral-50">
        <HomeHero />

        <div className="mx-auto max-w-7xl space-y-16 px-4 py-16 sm:px-6 lg:px-8">
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
