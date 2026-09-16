"use client";

import NextLink from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Cuisine, ArticleDoc, RecommendationDoc, DietaryAttribute, RestaurantContentTranslation } from "@/lib/types";
import { getAllCuisines, getCuisineDisplayName, restaurantMatchesCuisineSlug } from "@/lib/cuisines";
import { getAllHubs } from "@/lib/hubs";
import { buildDietaryBadgeAttributes } from "@/lib/dietary";
import { getLocalizedRestaurantContent } from "@/lib/restaurantTranslations";
import RestaurantCard from "@/components/restaurants/RestaurantCard";
import SiteHeader from "@/components/discovery/SiteHeader";
import SiteFooter from "@/components/discovery/SiteFooter";

type LiveRestaurant = {
  id: string;
  name: string;
  cuisine?: string;
  cuisineSlugs?: string[];
  hubName?: string;
  area?: string;
  shortDescription?: string;
  coverImage?: string;
  tags?: string[];
  popularItems?: string[];
  isHalal?: boolean;
  dietaryAttributes?: DietaryAttribute[];
  dietaryCertifications?: DietaryAttribute[];
  status?: string;
  rating?: number;
  reviewCount?: number;
  /** See docs/MULTILINGUAL-ARCHITECTURE.md — owner-approved
   *  translations only, never auto-translated. */
  contentTranslations?: Partial<Record<string, RestaurantContentTranslation>>;
};

function safeText(value?: string) {
  return (value || "").trim();
}

export default function CuisineDetailClient({ cuisine }: { cuisine: Cuisine }) {
  const locale = useLocale();
  const t = useTranslations("CuisineDetail");
  const tCommon = useTranslations("Common");
  const tHome = useTranslations("Home");
  const tBlog = useTranslations("Blog");
  const displayName = getCuisineDisplayName(cuisine, locale);

  const [restaurants, setRestaurants] = useState<LiveRestaurant[]>([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [articles, setArticles] = useState<ArticleDoc[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationDoc[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadRestaurants() {
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
          setRestaurants(rows.filter((r) => restaurantMatchesCuisineSlug(r, cuisine)));
        }
      } catch (error) {
        console.error("Failed to load restaurants for cuisine page:", error);
        if (!cancelled) setRestaurants([]);
      } finally {
        if (!cancelled) setLoadingRestaurants(false);
      }
    }

    async function loadArticles() {
      try {
        const q = query(
          collection(db, "articles"),
          where("status", "==", "published"),
          where("relatedCuisineSlugs", "array-contains", cuisine.slug)
        );
        const snap = await getDocs(q);
        if (!cancelled) {
          setArticles(
            snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ArticleDoc, "id">) }))
          );
        }
      } catch (error) {
        console.error("Failed to load related articles:", error);
        if (!cancelled) setArticles([]);
      }
    }

    async function loadRecommendations() {
      try {
        const q = query(
          collection(db, "recommendations"),
          where("targetType", "==", "cuisine"),
          where("targetId", "==", cuisine.slug),
          where("isActive", "==", true)
        );
        const snap = await getDocs(q);
        if (!cancelled) {
          setRecommendations(
            snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<RecommendationDoc, "id">) }))
          );
        }
      } catch (error) {
        console.error("Failed to load cuisine recommendations:", error);
        if (!cancelled) setRecommendations([]);
      }
    }

    loadRestaurants();
    loadArticles();
    loadRecommendations();

    return () => {
      cancelled = true;
    };
  }, [cuisine]);

  const relatedHubs = useMemo(() => {
    const terms = [cuisine.name.toLowerCase(), ...cuisine.matchTerms.map((term) => term.toLowerCase())];
    return getAllHubs().filter((hub) =>
      (hub.cuisineTags || []).some((tag) => terms.includes(tag.toLowerCase()))
    );
  }, [cuisine]);

  const relatedCuisines = useMemo(() => {
    return getAllCuisines()
      .filter((c) => c.slug !== cuisine.slug && c.region === cuisine.region)
      .slice(0, 3);
  }, [cuisine]);

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-amber-100 px-4 py-1 text-sm font-semibold text-amber-900">
              {t("regionCuisineBadge", { region: cuisine.region })}
            </span>
            {(cuisine.dietaryTags || []).map((tag) => (
              <span
                key={tag}
                className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800"
              >
                {tag}
              </span>
            ))}
          </div>

          <h1 className="mt-4 text-3xl font-bold text-neutral-900 md:text-4xl">
            {t("foodInLondon", { cuisine: displayName })}
          </h1>

          <p className="mt-4 max-w-3xl text-base leading-7 text-neutral-600">
            {cuisine.shortDescription}
          </p>

          <div className="mt-6 max-w-3xl space-y-4 text-sm leading-7 text-neutral-700">
            {cuisine.longDescription.split("\n\n").map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/restaurants"
              className="rounded-xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white hover:bg-amber-700"
            >
              {t("browseCuisineRestaurants", { cuisine: displayName })}
            </Link>
            <NextLink
              href="/signup/restaurant"
              className="rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              {t("ownBusinessCta", { cuisine: displayName })}
            </NextLink>
          </div>
        </div>

        {recommendations.length > 0 ? (
          <section className="mt-6 rounded-3xl border border-purple-200 bg-purple-50 p-6">
            <h2 className="text-lg font-bold text-purple-900">{tHome("recommends")}</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              {recommendations.map((rec) => (
                <Link
                  key={rec.id}
                  href={rec.linkHref}
                  className="rounded-2xl border border-purple-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="text-xs font-semibold uppercase tracking-wide text-purple-700">
                    {rec.title}
                  </div>
                  <p className="mt-2 text-sm text-neutral-700">{rec.blurb}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* Dishes */}
        <section className="mt-6 rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-neutral-900">
            {cuisine.kind === "dish-guide" ? t("aboutDishes") : t("popularDishes", { cuisine: displayName })}
          </h2>

          {cuisine.featuredDishes && cuisine.featuredDishes.length > 0 ? (
            <div className="mt-6 space-y-5">
              {cuisine.featuredDishes.map((dish) => (
                <div key={dish.name} className="rounded-2xl border border-neutral-200 p-5">
                  <div className="text-base font-semibold text-neutral-900">{dish.name}</div>
                  {dish.description ? (
                    <p className="mt-2 text-sm leading-6 text-neutral-600">{dish.description}</p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : cuisine.dishCategories && cuisine.dishCategories.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              {cuisine.dishCategories.map((category) => (
                <div key={category.title} className="rounded-2xl border border-neutral-200 p-5">
                  <h3 className="text-sm font-semibold text-amber-800">{category.title}</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {category.items.map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : cuisine.dishes.length > 0 ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {cuisine.dishes.map((dish) => (
                <span
                  key={dish}
                  className="rounded-full bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-700"
                >
                  {dish}
                </span>
              ))}
            </div>
          ) : null}
        </section>

        {/* Restaurants offering this cuisine */}
        <section className="mt-6 rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-neutral-900">
            {t("restaurantsHeading", { cuisine: displayName })}
          </h2>

          {loadingRestaurants ? (
            <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 p-6 text-sm text-neutral-500">
              {tCommon("loading")}
            </div>
          ) : restaurants.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 p-6 text-sm text-neutral-500">
              {t("noRestaurantsYet", { cuisine: displayName })}{" "}
              <NextLink href="/signup/restaurant" className="font-semibold text-amber-700 underline">
                {t("beFirstToJoin")}
              </NextLink>
              .
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {restaurants.map((r) => {
                const content = getLocalizedRestaurantContent(r, locale);
                return (
                <RestaurantCard
                  key={r.id}
                  name={safeText(content.name) || "Restaurant"}
                  cuisine={safeText(r.cuisine) || displayName}
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
        </section>

        {/* Related hubs */}
        {relatedHubs.length > 0 ? (
          <section className="mt-6 rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-neutral-900">
              {t("whereToFind", { cuisine: displayName })}
            </h2>
            <div className="mt-6 flex flex-wrap gap-3">
              {relatedHubs.map((hub) => (
                <Link
                  key={hub.slug}
                  href={`/hubs/${hub.slug}`}
                  className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100"
                >
                  {hub.name} →
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* Related blog posts */}
        <section className="mt-6 rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-neutral-900">{tHome("fromTheBlog")}</h2>
          {articles.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 p-6 text-sm text-neutral-500">
              {tBlog("noArticlesYet")}
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              {articles.map((a) => (
                <Link
                  key={a.id}
                  href={`/blog/${a.slug}`}
                  className="rounded-2xl border border-neutral-200 p-5 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    {a.category}
                  </div>
                  <div className="mt-2 text-base font-semibold text-neutral-900">{a.title}</div>
                  <p className="mt-2 line-clamp-2 text-sm text-neutral-600">{a.excerpt}</p>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Explore other cuisines */}
        {relatedCuisines.length > 0 ? (
          <section className="mt-6 rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-neutral-900">
              {t("exploreMoreRegion", { region: cuisine.region })}
            </h2>
            <div className="mt-6 flex flex-wrap gap-3">
              {relatedCuisines.map((c) => (
                <Link
                  key={c.slug}
                  href={`/cuisine/${c.slug}`}
                  className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  {getCuisineDisplayName(c, locale)} →
                </Link>
              ))}
              <Link
                href="/cuisines"
                className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                {t("allCuisines")} →
              </Link>
            </div>
          </section>
        ) : null}
      </div>
      </main>
      <SiteFooter />
    </>
  );
}
