"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLanguage } from "@/hooks/useLanguage";
import { isRTL } from "@/lib/i18n";
import { getHubBySlug } from "@/lib/hubs";
import { getAllCuisines } from "@/lib/cuisines";
import RestaurantCard from "@/components/restaurants/RestaurantCard";
import SiteHeader from "@/components/discovery/SiteHeader";
import SiteFooter from "@/components/discovery/SiteFooter";

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
  status?: string;
  rating?: number;
  reviewCount?: number;
};

function safeText(value?: string) {
  return (value || "").trim();
}

function formatSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function HubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { lang } = useLanguage();
  const hub = getHubBySlug(slug);

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
        const rows: LiveRestaurant[] = snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<LiveRestaurant, "id">),
        }));

        if (!cancelled) {
          setRestaurants(
            rows.filter((r) => {
              const hubName = safeText(r.hubName).toLowerCase();
              const targetName = (hub?.name || formatSlug(slug)).toLowerCase();
              return hubName && (hubName === targetName || hubName.includes(slug.replace(/-/g, " ")));
            })
          );
        }
      } catch (error) {
        console.error("Failed to load restaurants for hub page:", error);
        if (!cancelled) setRestaurants([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [slug, hub]);

  const cuisinesInHub = useMemo(() => {
    if (!hub?.cuisineTags?.length) return [];
    const tags = hub.cuisineTags.map((t) => t.toLowerCase());
    return getAllCuisines().filter(
      (c) =>
        c.kind === "cuisine" &&
        (tags.includes(c.name.toLowerCase()) ||
          c.matchTerms.some((term) => tags.includes(term.toLowerCase())))
    );
  }, [hub]);

  const rtl = isRTL(lang);
  const hubName = hub?.name || formatSlug(slug);
  const description = hub?.description[lang] || hub?.description.en || "";
  const travelInfo = hub?.travelInfo?.[lang] || hub?.travelInfo?.en;

  return (
    <>
      <SiteHeader />
      <main dir={rtl ? "rtl" : "ltr"} className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
          <div className="inline-flex rounded-full bg-amber-100 px-4 py-1 text-sm font-semibold text-amber-900">
            Food Hub{hub?.areaLabel ? ` · ${hub.areaLabel}` : ""}
          </div>

          <h1 className="mt-4 text-3xl font-bold text-neutral-900 md:text-4xl">{hubName}</h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-600">
            {description ||
              "Explore this hub for nearby food places, local catering options, and area-based food services."}
          </p>

          {hub?.editorialIntro ? (
            <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-600">{hub.editorialIntro}</p>
          ) : null}

          {travelInfo ? (
            <div className="mt-6 rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-600">
              <span className="font-semibold text-neutral-800">Getting there: </span>
              {travelInfo}
            </div>
          ) : null}

          {cuisinesInHub.length > 0 ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {cuisinesInHub.map((c) => (
                <Link
                  key={c.slug}
                  href={`/cuisine/${c.slug}`}
                  className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-200"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        {hub?.gallery && hub.gallery.length > 0 ? (
          <section className="mt-6 rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-bold text-neutral-900">Photos</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {hub.gallery.slice(0, 12).map((photo, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={`${photo}-${i}`}
                  src={photo}
                  alt={`${hubName} photo ${i + 1}`}
                  loading="lazy"
                  className="h-32 w-full rounded-xl object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-6 rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-neutral-900">Restaurants in {hubName}</h2>

          {loading ? (
            <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 p-6 text-sm text-neutral-500">
              Loading restaurants...
            </div>
          ) : restaurants.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 p-6 text-sm text-neutral-500">
              No restaurants listed for {hubName} yet.{" "}
              <Link href="/signup/restaurant" className="font-semibold text-amber-700 underline">
                Own a business here? List it free
              </Link>
              .
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {restaurants.map((r) => (
                <RestaurantCard
                  key={r.id}
                  name={safeText(r.name) || "Restaurant"}
                  cuisine={safeText(r.cuisine) || "Cuisine not added"}
                  area={safeText(r.area) || hubName}
                  tags={[...(r.isHalal ? ["Halal"] : []), ...(r.tags || [])].slice(0, 5)}
                  popularItems={(r.popularItems || []).slice(0, 3)}
                  imageUrl={r.coverImage}
                  shortDescription={r.shortDescription}
                  rating={r.rating}
                  reviewCount={r.reviewCount}
                  href={`/restaurants/${r.id}`}
                  lang={lang}
                />
              ))}
            </div>
          )}
        </section>
      </div>
      </main>
      <SiteFooter />
    </>
  );
}
