"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ReviewDoc } from "@/lib/types";

function tsToMs(value: unknown) {
  const v = value as { seconds?: number } | undefined;
  if (v?.seconds != null) return v.seconds * 1000;
  return 0;
}

type ReviewWithRestaurant = ReviewDoc & { restaurantName?: string };

export default function LatestReviewsSection({
  limit = 6,
  heading,
  showEmptyState = true,
}: {
  limit?: number;
  heading?: string;
  showEmptyState?: boolean;
}) {
  const t = useTranslations("Home");
  const tCommon = useTranslations("Common");
  const tReviews = useTranslations("Reviews");
  const resolvedHeading = heading ?? t("latestReviews");
  const [reviews, setReviews] = useState<ReviewWithRestaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const q = query(collection(db, "reviews"), where("status", "==", "approved"));
        const snap = await getDocs(q);
        let rows: ReviewWithRestaurant[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<ReviewDoc, "id">),
        }));
        rows.sort((a, b) => tsToMs(b.createdAt) - tsToMs(a.createdAt));
        rows = rows.slice(0, limit);

        const uniqueRestaurantIds = Array.from(new Set(rows.map((r) => r.restaurantId)));
        const names = await Promise.all(
          uniqueRestaurantIds.map(async (id) => {
            try {
              const snapshot = await getDoc(doc(db, "restaurants", id));
              return [id, (snapshot.data()?.name as string) || "Restaurant"] as const;
            } catch {
              return [id, "Restaurant"] as const;
            }
          })
        );
        const nameMap = new Map(names);

        if (!cancelled) {
          setReviews(rows.map((r) => ({ ...r, restaurantName: nameMap.get(r.restaurantId) })));
        }
      } catch (error) {
        console.error("Failed to load latest reviews:", error);
        if (!cancelled) setReviews([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [limit]);

  if (loading) {
    return (
      <section>
        <h2 className="text-2xl font-bold text-neutral-900">{resolvedHeading}</h2>
        <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 p-6 text-sm text-neutral-500">
          {tCommon("loading")}
        </div>
      </section>
    );
  }

  if (reviews.length === 0) {
    if (!showEmptyState) return null;
    return (
      <section>
        <h2 className="text-2xl font-bold text-neutral-900">{resolvedHeading}</h2>
        <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 p-6 text-sm text-neutral-500">
          {tReviews("noApprovedReviews")}
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-2xl font-bold text-neutral-900">{resolvedHeading}</h2>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reviews.map((review) => (
          <Link
            key={review.id}
            href={`/restaurants/${review.restaurantId}`}
            className="rounded-2xl border border-neutral-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="font-semibold text-neutral-900">{review.restaurantName}</div>
              <div className="text-amber-600 text-sm">
                {"★".repeat(review.rating)}
                {"☆".repeat(5 - review.rating)}
              </div>
            </div>
            <div className="mt-1 text-xs text-neutral-500">{review.displayName}</div>
            <p className="mt-2 line-clamp-3 text-sm text-neutral-700">{review.reviewText}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
