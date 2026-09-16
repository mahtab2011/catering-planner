"use client";

import NextLink from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { ReviewDoc } from "@/lib/types";
import { averageRating, ratingDistribution } from "@/lib/reviews";

function tsToMs(value: unknown) {
  const v = value as { seconds?: number } | undefined;
  if (v?.seconds != null) return v.seconds * 1000;
  return 0;
}

// /login is a SmartServeUK operational route outside app/[locale] —
// plain next/link, not the locale-aware Link.
export default function RestaurantReviews({
  restaurantId,
  restaurantName,
}: {
  restaurantId: string;
  restaurantName: string;
}) {
  const t = useTranslations("Reviews");
  const tCommon = useTranslations("Common");
  const [reviews, setReviews] = useState<ReviewDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [justSubmitted, setJustSubmitted] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const q = query(
          collection(db, "reviews"),
          where("restaurantId", "==", restaurantId),
          where("status", "==", "approved")
        );
        const snap = await getDocs(q);
        if (!cancelled) {
          const rows = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<ReviewDoc, "id">),
          }));
          rows.sort((a, b) => tsToMs(b.createdAt) - tsToMs(a.createdAt));
          setReviews(rows);
        }
      } catch (error) {
        console.error("Failed to load reviews:", error);
        if (!cancelled) setReviews([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  const avg = useMemo(() => averageRating(reviews), [reviews]);
  const distribution = useMemo(() => ratingDistribution(reviews), [reviews]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");

    if (!user) {
      setSubmitError(t("pleaseSignIn"));
      return;
    }

    if (!reviewText.trim()) {
      setSubmitError(t("pleaseWriteAFewWords"));
      return;
    }

    setSubmitting(true);

    try {
      let displayName = user.displayName || "";

      if (!displayName) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        displayName = (userDoc.data()?.fullName as string) || user.email?.split("@")[0] || "Guest";
      }

      await addDoc(collection(db, "reviews"), {
        restaurantId,
        userId: user.uid,
        displayName,
        rating,
        title: title.trim() || undefined,
        reviewText: reviewText.trim(),
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setJustSubmitted(true);
      setShowForm(false);
      setTitle("");
      setReviewText("");
      setRating(5);
    } catch (error) {
      console.error("Failed to submit review:", error);
      setSubmitError(t("submitErrorMessage"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">{t("customerReviews")}</h2>
          {reviews.length > 0 ? (
            <div className="mt-2 flex items-center gap-3">
              <span className="text-2xl font-bold text-amber-700">{avg.toFixed(1)}</span>
              <span className="text-sm text-neutral-600">
                {t("outOf5")} · {t("reviewCount", { count: reviews.length })}
              </span>
            </div>
          ) : (
            <p className="mt-2 text-sm text-neutral-500">{t("noApprovedReviews")}</p>
          )}
        </div>

        {user ? (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
          >
            {showForm ? t("cancel") : t("writeAReview")}
          </button>
        ) : (
          <NextLink
            href="/login"
            className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            {t("signInToReview")}
          </NextLink>
        )}
      </div>

      {reviews.length > 0 ? (
        <div className="mt-4 space-y-1">
          {([5, 4, 3, 2, 1] as const).map((star) => {
            const count = distribution[star];
            const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
            return (
              <div key={star} className="flex items-center gap-2 text-xs text-neutral-600">
                <span className="w-10 shrink-0">{t("starLabel", { count: star })}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
                  <div className="h-full bg-amber-400" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-8 shrink-0 text-end">{count}</span>
              </div>
            );
          })}
        </div>
      ) : null}

      {justSubmitted ? (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          {t("thankYouSubmitted")}
        </div>
      ) : null}

      {showForm ? (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl border border-neutral-200 p-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-700">
              {t("yourRating", { restaurant: restaurantName })}
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  aria-label={t("starLabel", { count: star })}
                  className={`h-10 w-10 rounded-full text-lg font-semibold transition ${
                    star <= rating
                      ? "bg-amber-500 text-white"
                      : "bg-neutral-100 text-neutral-400 hover:bg-neutral-200"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-700">
              {t("titleOptional")}
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-amber-500"
              placeholder={t("sumUpVisitPlaceholder")}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-700">
              {t("yourReview")}
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              maxLength={2000}
              rows={4}
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-amber-500"
              placeholder={t("reviewTextPlaceholder")}
            />
          </div>

          {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
          >
            {submitting ? t("submitting") : t("submitReview")}
          </button>

          <p className="text-xs text-neutral-500">
            {t("moderationNote")}
          </p>
        </form>
      ) : null}

      <div className="mt-6 space-y-4">
        {loading ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 p-6 text-sm text-neutral-500">
            {tCommon("loading")}
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 p-6 text-sm text-neutral-500">
            {t("beFirstToReview", { restaurant: restaurantName })}
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="rounded-2xl border border-neutral-200 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-semibold text-neutral-900">{review.displayName}</div>
                <div className="text-amber-600">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</div>
              </div>
              {review.title ? (
                <div className="mt-2 text-sm font-semibold text-neutral-800">{review.title}</div>
              ) : null}
              <p className="mt-2 text-sm leading-6 text-neutral-700">{review.reviewText}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
