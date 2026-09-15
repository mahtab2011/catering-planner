"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAllCuisines } from "@/lib/cuisines";
import { getAllHubs } from "@/lib/hubs";
import type { ArticleDoc } from "@/lib/types";
import SiteHeader from "@/components/discovery/SiteHeader";
import SiteFooter from "@/components/discovery/SiteFooter";

type LiveRestaurant = {
  id: string;
  name: string;
  cuisine?: string;
  hubName?: string;
  area?: string;
  postcode?: string;
  fullAddress?: string;
  shortDescription?: string;
  status?: string;
  menuCategories?: { category?: string; items?: { name?: string }[] }[];
};

type MenuMatch = { restaurantId: string; restaurantName: string; itemName: string };

function norm(value?: string) {
  return (value || "").trim().toLowerCase();
}

export default function SearchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialPostcode = searchParams.get("postcode") || "";

  const [q, setQ] = useState(initialQuery);
  const [postcode, setPostcode] = useState(initialPostcode);
  const [restaurants, setRestaurants] = useState<LiveRestaurant[]>([]);
  const [articles, setArticles] = useState<ArticleDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [restaurantSnap, articleSnap] = await Promise.all([
          getDocs(query(collection(db, "restaurants"), where("status", "in", ["active", "pending"]))),
          getDocs(query(collection(db, "articles"), where("status", "==", "published"))),
        ]);

        if (!cancelled) {
          setRestaurants(
            restaurantSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<LiveRestaurant, "id">) }))
          );
          setArticles(articleSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ArticleDoc, "id">) })));
        }
      } catch (error) {
        console.error("Search failed to load data:", error);
        if (!cancelled) {
          setRestaurants([]);
          setArticles([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const term = norm(q);
  const postcodeTerm = norm(postcode);

  const matchedCuisines = useMemo(() => {
    if (!term) return [];
    return getAllCuisines().filter(
      (c) => norm(c.name).includes(term) || c.matchTerms.some((t) => norm(t).includes(term))
    );
  }, [term]);

  const matchedHubs = useMemo(() => {
    if (!term && !postcodeTerm) return [];
    return getAllHubs().filter((hub) => {
      const haystack = `${hub.name} ${hub.areaLabel}`.toLowerCase();
      return (term && haystack.includes(term)) || (postcodeTerm && haystack.includes(postcodeTerm));
    });
  }, [term, postcodeTerm]);

  const matchedRestaurants = useMemo(() => {
    if (!term && !postcodeTerm) return [];
    return restaurants.filter((r) => {
      const haystack = [r.name, r.cuisine, r.area, r.hubName, r.shortDescription]
        .map(norm)
        .join(" ");
      const addressHaystack = [r.postcode, r.fullAddress, r.area].map(norm).join(" ");
      const matchesTerm = term && haystack.includes(term);
      const matchesPostcode = postcodeTerm && addressHaystack.includes(postcodeTerm);
      return matchesTerm || matchesPostcode;
    });
  }, [restaurants, term, postcodeTerm]);

  const matchedDishes = useMemo(() => {
    if (!term) return [];
    const results: MenuMatch[] = [];
    for (const r of restaurants) {
      for (const category of r.menuCategories || []) {
        for (const item of category.items || []) {
          if (item.name && norm(item.name).includes(term)) {
            results.push({ restaurantId: r.id, restaurantName: r.name, itemName: item.name });
          }
        }
      }
    }
    return results.slice(0, 20);
  }, [restaurants, term]);

  const matchedArticles = useMemo(() => {
    if (!term) return [];
    return articles.filter(
      (a) => norm(a.title).includes(term) || norm(a.excerpt).includes(term) || norm(a.category).includes(term)
    );
  }, [articles, term]);

  const hasQuery = Boolean(term || postcodeTerm);
  const totalResults =
    matchedCuisines.length + matchedHubs.length + matchedRestaurants.length + matchedDishes.length + matchedArticles.length;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (postcode.trim()) params.set("postcode", postcode.trim());
    router.push(`/search${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-neutral-50">
        <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
          <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
            <h1 className="text-3xl font-bold text-neutral-900">Search London Food Hubs</h1>
            <p className="mt-2 text-sm text-neutral-600">
              Search across restaurants, dishes, cuisines, food hubs and blog articles.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search restaurants, dishes or cuisines"
                className="flex-1 rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-amber-500"
              />
              <input
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                placeholder="Postcode or area"
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-amber-500 sm:w-48"
              />
              <button
                type="submit"
                className="rounded-xl bg-amber-600 px-6 py-3 text-sm font-bold text-white hover:bg-amber-700"
              >
                Search
              </button>
            </form>
            <p className="mt-2 text-xs text-neutral-500">
              Postcode search currently matches against restaurant addresses and hub names as
              text — proper postcode-radius discovery is planned for a future release.
            </p>
          </div>

          <div className="mt-8">
            {loading ? (
              <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
                Loading...
              </div>
            ) : !hasQuery ? (
              <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
                Enter a search term or postcode/area to get started.
              </div>
            ) : totalResults === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
                No results for &quot;{q || postcode}&quot;. Try a different cuisine, dish or area name.
              </div>
            ) : (
              <div className="space-y-8">
                {matchedRestaurants.length > 0 ? (
                  <section>
                    <h2 className="text-lg font-bold text-neutral-900">Restaurants</h2>
                    <div className="mt-3 space-y-2">
                      {matchedRestaurants.map((r) => (
                        <Link
                          key={r.id}
                          href={`/restaurants/${r.id}`}
                          className="block rounded-xl border border-neutral-200 bg-white p-4 hover:shadow-sm"
                        >
                          <div className="font-semibold text-neutral-900">{r.name}</div>
                          <div className="text-xs text-neutral-500">
                            {[r.cuisine, r.area || r.hubName].filter(Boolean).join(" · ")}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                ) : null}

                {matchedDishes.length > 0 ? (
                  <section>
                    <h2 className="text-lg font-bold text-neutral-900">Dishes</h2>
                    <div className="mt-3 space-y-2">
                      {matchedDishes.map((m, i) => (
                        <Link
                          key={`${m.restaurantId}-${m.itemName}-${i}`}
                          href={`/restaurants/${m.restaurantId}`}
                          className="block rounded-xl border border-neutral-200 bg-white p-4 hover:shadow-sm"
                        >
                          <div className="font-semibold text-neutral-900">{m.itemName}</div>
                          <div className="text-xs text-neutral-500">at {m.restaurantName}</div>
                        </Link>
                      ))}
                    </div>
                  </section>
                ) : null}

                {matchedCuisines.length > 0 ? (
                  <section>
                    <h2 className="text-lg font-bold text-neutral-900">Cuisines</h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {matchedCuisines.map((c) => (
                        <Link
                          key={c.slug}
                          href={`/cuisine/${c.slug}`}
                          className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100"
                        >
                          {c.name} →
                        </Link>
                      ))}
                    </div>
                  </section>
                ) : null}

                {matchedHubs.length > 0 ? (
                  <section>
                    <h2 className="text-lg font-bold text-neutral-900">Food Hubs</h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {matchedHubs.map((hub) => (
                        <Link
                          key={hub.slug}
                          href={`/hubs/${hub.slug}`}
                          className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                        >
                          {hub.name} →
                        </Link>
                      ))}
                    </div>
                  </section>
                ) : null}

                {matchedArticles.length > 0 ? (
                  <section>
                    <h2 className="text-lg font-bold text-neutral-900">Blog Articles</h2>
                    <div className="mt-3 space-y-2">
                      {matchedArticles.map((a) => (
                        <Link
                          key={a.id}
                          href={`/blog/${a.slug}`}
                          className="block rounded-xl border border-neutral-200 bg-white p-4 hover:shadow-sm"
                        >
                          <div className="font-semibold text-neutral-900">{a.title}</div>
                          <div className="text-xs text-neutral-500">{a.category}</div>
                        </Link>
                      ))}
                    </div>
                  </section>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
