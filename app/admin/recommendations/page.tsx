"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAdminGate } from "@/hooks/useAdminGate";
import type { RecommendationDoc, RecommendationTargetType, RecommendationType } from "@/lib/types";
import {
  RECOMMENDATION_TARGET_LABELS,
  RECOMMENDATION_TARGET_TYPES,
  RECOMMENDATION_TYPE_LABELS,
  RECOMMENDATION_TYPES,
} from "@/lib/recommendations";

const emptyForm = {
  type: RECOMMENDATION_TYPES[0],
  targetType: RECOMMENDATION_TARGET_TYPES[0] as RecommendationTargetType,
  targetId: "",
  dishName: "",
  title: "",
  blurb: "",
  linkHref: "/restaurants",
  image: "",
};

export default function AdminRecommendationsPage() {
  const { checking, allowed } = useAdminGate();
  const [recommendations, setRecommendations] = useState<RecommendationDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!allowed) return;
    load();
  }, [allowed]);

  async function load() {
    try {
      const snap = await getDocs(query(collection(db, "recommendations")));
      setRecommendations(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<RecommendationDoc, "id">) }))
      );
    } catch (err) {
      console.error("Failed to load recommendations:", err);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.title.trim() || !form.blurb.trim() || !form.linkHref.trim()) {
      setError("Title, blurb and link are required.");
      return;
    }

    setSaving(true);
    try {
      await addDoc(collection(db, "recommendations"), {
        type: form.type,
        targetType: form.targetType,
        targetId: form.targetId.trim() || undefined,
        dishName: form.dishName.trim() || undefined,
        title: form.title.trim(),
        blurb: form.blurb.trim(),
        linkHref: form.linkHref.trim(),
        image: form.image.trim() || undefined,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setForm(emptyForm);
      await load();
    } catch (err) {
      console.error("Failed to create recommendation:", err);
      setError("Something went wrong saving this recommendation.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(rec: RecommendationDoc) {
    try {
      await updateDoc(doc(db, "recommendations", rec.id), {
        isActive: !rec.isActive,
        updatedAt: serverTimestamp(),
      });
      await load();
    } catch (err) {
      console.error("Failed to update recommendation:", err);
    }
  }

  async function remove(rec: RecommendationDoc) {
    try {
      await deleteDoc(doc(db, "recommendations", rec.id));
      await load();
    } catch (err) {
      console.error("Failed to delete recommendation:", err);
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
      <h1 className="mb-2 text-2xl font-bold text-neutral-900">Editorial Recommendations</h1>
      <p className="mb-6 text-sm text-neutral-600">
        Manage &quot;London Food Hubs Recommends&quot; — editorial picks shown on the homepage, cuisine
        pages and the recommendations page. Distinct from customer reviews.
      </p>

      <form onSubmit={handleSubmit} className="mb-8 space-y-4 rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-700">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as RecommendationType }))}
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-amber-500"
            >
              {RECOMMENDATION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {RECOMMENDATION_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-700">Target type</label>
            <select
              value={form.targetType}
              onChange={(e) =>
                setForm((f) => ({ ...f, targetType: e.target.value as RecommendationTargetType }))
              }
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-amber-500"
            >
              {RECOMMENDATION_TARGET_TYPES.map((t) => (
                <option key={t} value={t}>
                  {RECOMMENDATION_TARGET_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {form.targetType === "dish" ? (
          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-700">Dish name</label>
            <input
              value={form.dishName}
              onChange={(e) => setForm((f) => ({ ...f, dishName: e.target.value }))}
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-amber-500"
            />
          </div>
        ) : (
          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-700">
              Target ID / slug (restaurant id, cuisine slug, hub slug, or article slug)
            </label>
            <input
              value={form.targetId}
              onChange={(e) => setForm((f) => ({ ...f, targetId: e.target.value }))}
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-amber-500"
            />
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-semibold text-neutral-700">Title</label>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-amber-500"
            placeholder="e.g. Royal Bengal Kitchen — Hidden Gem"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-neutral-700">Blurb</label>
          <textarea
            value={form.blurb}
            onChange={(e) => setForm((f) => ({ ...f, blurb: e.target.value }))}
            rows={2}
            className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-amber-500"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-700">
              Link (where the card goes)
            </label>
            <input
              value={form.linkHref}
              onChange={(e) => setForm((f) => ({ ...f, linkHref: e.target.value }))}
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-amber-500"
              placeholder="/restaurants/abc123"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-700">
              Image URL (optional)
            </label>
            <input
              value={form.image}
              onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Add Recommendation"}
        </button>
      </form>

      <h2 className="mb-3 text-lg font-bold text-neutral-900">All Recommendations</h2>
      {loading ? (
        <div className="text-sm text-neutral-500">Loading...</div>
      ) : recommendations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 p-6 text-sm text-neutral-500">
          No recommendations yet.
        </div>
      ) : (
        <div className="space-y-3">
          {recommendations.map((rec) => (
            <div key={rec.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-purple-700">
                  {RECOMMENDATION_TYPE_LABELS[rec.type]}
                </div>
                <div className="font-semibold text-neutral-900">{rec.title}</div>
                <div className="text-xs text-neutral-500">{rec.linkHref}</div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    rec.isActive ? "bg-emerald-100 text-emerald-800" : "bg-neutral-200 text-neutral-600"
                  }`}
                >
                  {rec.isActive ? "Active" : "Inactive"}
                </span>
                <button
                  type="button"
                  onClick={() => toggleActive(rec)}
                  className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  {rec.isActive ? "Deactivate" : "Activate"}
                </button>
                <button
                  type="button"
                  onClick={() => remove(rec)}
                  className="rounded-xl border border-red-300 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
