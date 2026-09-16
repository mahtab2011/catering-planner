"use client";

import NextLink from "next/link";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { buildDietaryBadgeAttributes } from "@/lib/dietary";
import { getLocalizedRestaurantContent } from "@/lib/restaurantTranslations";
import { belongsToActiveCity } from "@/lib/cities";
import type { DietaryAttribute, RestaurantContentTranslation } from "@/lib/types";
import RestaurantCard from "@/components/restaurants/RestaurantCard";

type LiveRestaurant = {
  id: string;
  name: string;
  cuisine?: string;
  hubName?: string;
  area?: string;
  shortDescription?: string;
  coverImage?: string;
  tags?: string[];
  popularItems?: string[];
  isHalal?: boolean;
  dietaryAttributes?: DietaryAttribute[];
  dietaryCertifications?: DietaryAttribute[];
  isFeatured?: boolean;
  status?: string;
  citySlug?: string;
  rating?: number;
  reviewCount?: number;
  /** See docs/MULTILINGUAL-ARCHITECTURE.md — owner-approved
   *  translations only, never auto-translated. */
  contentTranslations?: Partial<Record<string, RestaurantContentTranslation>>;
};

function safeText(value?: string) {
  return (value || "").trim();
}

export default function FeaturedRestaurantsSection() {
  const t = useTranslations("Home");
  const locale = useLocale();
  const [restaurants, setRestaurants] = useState<LiveRestaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const q = query(
          collection(db, "restaurants"),
          where("status", "in", ["active", "pending"])
        );
        const snap = await getDocs(q);
        // London is the only active launch city — see
        // docs/RESTAURANT-DISCOVERY.md.
        const rows: LiveRestaurant[] = snap.docs
          .map((d) => ({
            id: d.id,
            ...(d.data() as Omit<LiveRestaurant, "id">),
          }))
          .filter((r) => belongsToActiveCity(r.citySlug));

        const featured = rows.filter((r) => r.isFeatured);
        const chosen = (featured.length > 0 ? featured : rows).slice(0, 6);

        if (!cancelled) setRestaurants(chosen);
      } catch (error) {
        console.error("Failed to load featured restaurants:", error);
        if (!cancelled) setRestaurants([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-neutral-900">{t("featuredRestaurants")}</h2>
        <Link href="/restaurants" className="text-sm font-semibold text-amber-700 hover:underline">
          {t("browseAllRestaurants")} →
        </Link>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
            {t("loadingRestaurants")}
          </div>
        ) : restaurants.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
            {t("noRestaurantsYet")}{" "}
            <NextLink href="/signup/restaurant" className="font-semibold text-amber-700 underline">
              {t("beFirstToJoin")}
            </NextLink>
            .
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {restaurants.map((r) => {
              const content = getLocalizedRestaurantContent(r, locale);
              return (
              <RestaurantCard
                key={r.id}
                name={safeText(content.name) || "Restaurant"}
                cuisine={safeText(r.cuisine) || "Cuisine not added"}
                area={safeText(r.area) || safeText(r.hubName) || "London"}
                dietaryAttributes={buildDietaryBadgeAttributes(r)}
                ownerTags={r.tags || []}
                popularItems={(r.popularItems || []).slice(0, 3)}
                imageUrl={r.coverImage}
                shortDescription={content.shortDescription}
                rating={r.rating}
                reviewCount={r.reviewCount}
                href={`/restaurants/${r.id}`}
              />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
