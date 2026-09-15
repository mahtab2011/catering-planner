"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAdminGate } from "@/hooks/useAdminGate";
import type { ReviewDoc } from "@/lib/types";

export default function AdminReviewsPage() {
  const { checking, allowed } = useAdminGate();
  const [reviews, setReviews] = useState<ReviewDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!allowed) return;

    let cancelled = false;

    async function load() {
      try {
        const q = query(collection(db, "reviews"), where("status", "==", "pending"));
        const snap = await getDocs(q);
        if (!cancelled) {
          setReviews(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ReviewDoc, "id">) })));
        }
      } catch (error) {
        console.error("Failed to load pending reviews:", error);
        if (!cancelled) setReviews([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [allowed]);

  async function moderate(id: string, status: "approved" | "rejected") {
    setBusyId(id);
    try {
      await updateDoc(doc(db, "reviews", id), {
        status,
        moderatedBy: auth.currentUser?.uid || "",
        moderatedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error("Failed to moderate review:", error);
    } finally {
      setBusyId(null);
    }
  }

  if (checking) {
    return <div className="mx-auto max-w-4xl p-6 text-sm text-neutral-500">Checking access...</div>;
  }

  if (!allowed) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          This page is restricted to admin accounts.{" "}
          <Link href="/login" className="font-semibold underline">
            Sign in
          </Link>{" "}
          with an admin account to continue.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-2 text-2xl font-bold text-neutral-900">Review Moderation</h1>
      <p className="mb-6 text-sm text-neutral-600">
        Approve or reject customer reviews before they appear on restaurant pages.
      </p>

      {loading ? (
        <div className="text-sm text-neutral-500">Loading pending reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 p-6 text-sm text-neutral-500">
          No reviews waiting for moderation.
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-2xl border border-neutral-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-neutral-900">{review.displayName}</div>
                  <div className="text-xs text-neutral-500">
                    Restaurant ID: {review.restaurantId}
                  </div>
                </div>
                <div className="text-amber-600">
                  {"★".repeat(review.rating)}
                  {"☆".repeat(5 - review.rating)}
                </div>
              </div>

              {review.title ? (
                <div className="mt-2 text-sm font-semibold text-neutral-800">{review.title}</div>
              ) : null}
              <p className="mt-2 text-sm leading-6 text-neutral-700">{review.reviewText}</p>

              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  disabled={busyId === review.id}
                  onClick={() => moderate(review.id, "approved")}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={busyId === review.id}
                  onClick={() => moderate(review.id, "rejected")}
                  className="rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
