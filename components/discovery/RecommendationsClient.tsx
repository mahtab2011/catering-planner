"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { RecommendationDoc } from "@/lib/types";
import { RECOMMENDATION_TYPE_LABELS } from "@/lib/recommendations";
import SiteHeader from "@/components/discovery/SiteHeader";
import SiteFooter from "@/components/discovery/SiteFooter";

export default function RecommendationsClient() {
  const t = useTranslations("Recommendations");
  const [recommendations, setRecommendations] = useState<RecommendationDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const q = query(collection(db, "recommendations"), where("isActive", "==", true));
        const snap = await getDocs(q);
        if (!cancelled) {
          setRecommendations(
            snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<RecommendationDoc, "id">) }))
          );
        }
      } catch (error) {
        console.error("Failed to load recommendations:", error);
        if (!cancelled) setRecommendations([]);
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
    <>
      <SiteHeader />
      <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <div className="rounded-3xl border border-purple-200 bg-purple-50 p-8">
          <div className="inline-flex rounded-full bg-purple-600 px-4 py-1 text-sm font-semibold text-white">
            {t("badge")}
          </div>
          <h1 className="mt-4 text-3xl font-bold text-neutral-900 md:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-neutral-700">
            {t("subtitle")}
          </p>
        </div>

        <div className="mt-8">
          {loading ? (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
              {t("loading")}
            </div>
          ) : recommendations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
              {t("empty")}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {recommendations.map((rec) => (
                <Link
                  key={rec.id}
                  href={rec.linkHref}
                  className="overflow-hidden rounded-3xl border border-purple-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  {rec.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={rec.image} alt={rec.title} className="h-40 w-full object-cover" />
                  ) : (
                    <div className="h-40 w-full bg-linear-to-br from-purple-100 via-fuchsia-50 to-amber-50" />
                  )}
                  <div className="p-5">
                    <div className="text-xs font-semibold uppercase tracking-wide text-purple-700">
                      {RECOMMENDATION_TYPE_LABELS[rec.type]}
                    </div>
                    <div className="mt-2 text-lg font-bold text-neutral-900">{rec.title}</div>
                    <p className="mt-2 text-sm text-neutral-600">{rec.blurb}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      </main>
      <SiteFooter />
    </>
  );
}
