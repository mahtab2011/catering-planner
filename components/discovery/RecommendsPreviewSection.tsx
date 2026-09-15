"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { RecommendationDoc } from "@/lib/types";
import { RECOMMENDATION_TYPE_LABELS } from "@/lib/recommendations";

export default function RecommendsPreviewSection() {
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
            snap.docs
              .slice(0, 4)
              .map((d) => ({ id: d.id, ...(d.data() as Omit<RecommendationDoc, "id">) }))
          );
        }
      } catch (error) {
        console.error("Failed to load recommendation preview:", error);
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

  if (loading) return null;

  return (
    <section className="rounded-3xl border border-purple-200 bg-purple-50 p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-neutral-900">London Food Hubs Recommends</h2>
        <Link href="/recommendations" className="text-sm font-semibold text-purple-700 hover:underline">
          See All →
        </Link>
      </div>

      {recommendations.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-600">
          Our editorial picks — Dish of the Week, Hidden Gems, Family Favourites and more — will
          appear here as they&apos;re published.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {recommendations.map((rec) => (
            <Link
              key={rec.id}
              href={rec.linkHref}
              className="rounded-2xl border border-purple-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="text-xs font-semibold uppercase tracking-wide text-purple-700">
                {RECOMMENDATION_TYPE_LABELS[rec.type]}
              </div>
              <div className="mt-2 text-sm font-bold text-neutral-900">{rec.title}</div>
              <p className="mt-1 line-clamp-2 text-xs text-neutral-600">{rec.blurb}</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
