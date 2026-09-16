"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAdminGate } from "@/hooks/useAdminGate";
import { assessRestaurantDataQuality, DATA_QUALITY_FLAG_LABEL, type DataQualityFlag } from "@/lib/adminDataQuality";
import {
  deriveOwnershipDisplayState,
  OWNERSHIP_DISPLAY_LABEL,
  restaurantMatchesAdminSearch,
  type OwnershipDisplayState,
} from "@/lib/adminRestaurantOverview";
import { getCuisineBySlug } from "@/lib/cuisines";
import type { RestaurantOwnerClaimStatus, RestaurantDataConfidence, RestaurantSourceType } from "@/lib/types";

/**
 * Admin restaurant overview/inspection page — the one general "browse
 * every restaurant with data-quality and ownership visibility" view
 * that did not previously exist (see docs/ADMIN-OPERATIONS.md). This
 * page never edits a restaurant itself; every action links out to the
 * already-existing, already-ownership-gated edit page
 * (/restaurants/[id]/edit, which an admin can already use for any
 * restaurant) or the public detail page. No new restaurant-editing UI
 * was built here — reuse over duplication, per this task's own
 * instruction.
 *
 * Reads the full `restaurants` collection ONCE per page load (not a
 * live listener) — a single bounded read appropriate for a
 * single-city launch's restaurant count, not a per-render or
 * decorative cost. Does not fetch or display claimant contact details
 * (name/email/phone/note) — that stays on the dedicated claims queue
 * (/admin/restaurant-claims) where it's already reviewable; this page
 * only shows the ownership *state*, never claimant PII, to avoid
 * duplicating sensitive data across two admin surfaces.
 */

type AdminRestaurantRow = {
  id: string;
  name?: string;
  status?: string;
  ownerUid?: string;
  ownerClaimStatus?: RestaurantOwnerClaimStatus;
  citySlug?: string;
  city?: string;
  hubName?: string;
  area?: string;
  cuisine?: string;
  cuisineSlugs?: string[];
  postcode?: string;
  fullAddress?: string;
  shortDescription?: string;
  longDescription?: string;
  description?: string;
  phone?: string;
  email?: string;
  openingHoursText?: string;
  coverImage?: string;
  imageUrl?: string;
  menuCategories?: { category?: string; items?: unknown[] }[];
  sourceType?: RestaurantSourceType;
  dataConfidence?: RestaurantDataConfidence;
};

const OWNERSHIP_FILTERS: ("All" | OwnershipDisplayState)[] = ["All", "unclaimed", "claim_pending", "claimed", "claim_rejected"];
const STATUS_FILTERS = ["All", "active", "pending", "draft", "blocked"];

export default function AdminRestaurantsOverviewPage() {
  const { checking, allowed } = useAdminGate();
  const [restaurants, setRestaurants] = useState<AdminRestaurantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [ownershipFilter, setOwnershipFilter] = useState<"All" | OwnershipDisplayState>("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [issuesOnly, setIssuesOnly] = useState(false);

  useEffect(() => {
    if (!allowed) return;
    load();
  }, [allowed]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const snap = await getDocs(collection(db, "restaurants"));
      setRestaurants(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AdminRestaurantRow, "id">) })));
    } catch (err) {
      console.error("Failed to load restaurants for admin overview:", err);
      setError("Failed to load restaurants.");
    } finally {
      setLoading(false);
    }
  }

  const rows = useMemo(() => {
    return restaurants.map((r) => ({
      restaurant: r,
      ownership: deriveOwnershipDisplayState(r),
      flags: assessRestaurantDataQuality(r),
    }));
  }, [restaurants]);

  const filteredRows = useMemo(() => {
    return rows.filter(({ restaurant, ownership, flags }) => {
      if (!restaurantMatchesAdminSearch(restaurant, search)) return false;
      if (ownershipFilter !== "All" && ownership !== ownershipFilter) return false;
      if (statusFilter !== "All" && (restaurant.status || "") !== statusFilter) return false;
      if (issuesOnly && flags.length === 0) return false;
      return true;
    });
  }, [rows, search, ownershipFilter, statusFilter, issuesOnly]);

  const summary = useMemo(() => {
    const total = rows.length;
    const unclaimed = rows.filter((r) => r.ownership === "unclaimed").length;
    const claimPending = rows.filter((r) => r.ownership === "claim_pending").length;
    const claimed = rows.filter((r) => r.ownership === "claimed").length;
    const withIssues = rows.filter((r) => r.flags.length > 0).length;
    return { total, unclaimed, claimPending, claimed, withIssues };
  }, [rows]);

  if (checking) {
    return <div className="mx-auto max-w-6xl p-6 text-sm text-neutral-500">Checking access...</div>;
  }

  if (!allowed) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600">
          This page is restricted to admin accounts.{" "}
          <Link href="/login" className="font-semibold text-amber-700 hover:underline">
            Log in
          </Link>{" "}
          with an admin account to continue.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Restaurants</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Inspect every restaurant, its ownership state, and factual data-quality signals. Editing
            happens on each restaurant&apos;s own profile page — this view is for finding what needs
            attention.
          </p>
        </div>
        <Link href="/admin" className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
          Back to Admin
        </Link>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="text-xs font-medium text-neutral-500">Total</div>
          <div className="mt-1 text-xl font-bold text-neutral-900">{summary.total}</div>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="text-xs font-medium text-neutral-500">Unclaimed</div>
          <div className="mt-1 text-xl font-bold text-neutral-900">{summary.unclaimed}</div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-xs font-medium text-amber-700">Claim pending</div>
          <div className="mt-1 text-xl font-bold text-amber-900">{summary.claimPending}</div>
        </div>
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
          <div className="text-xs font-medium text-green-700">Claimed</div>
          <div className="mt-1 text-xl font-bold text-green-900">{summary.claimed}</div>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="text-xs font-medium text-red-700">With data-quality flags</div>
          <div className="mt-1 text-xl font-bold text-red-900">{summary.withIssues}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, city, hub, cuisine, postcode..."
          className="min-w-64 flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-black"
        />

        <select
          value={ownershipFilter}
          onChange={(e) => setOwnershipFilter(e.target.value as "All" | OwnershipDisplayState)}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        >
          {OWNERSHIP_FILTERS.map((v) => (
            <option key={v} value={v}>
              {v === "All" ? "All ownership states" : OWNERSHIP_DISPLAY_LABEL[v]}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        >
          {STATUS_FILTERS.map((v) => (
            <option key={v} value={v}>
              {v === "All" ? "All statuses" : v}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 rounded-lg border border-neutral-300 px-3 py-2 text-sm">
          <input type="checkbox" checked={issuesOnly} onChange={(e) => setIssuesOnly(e.target.checked)} />
          Has data-quality flags
        </label>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-500">Loading restaurants...</p>
      ) : filteredRows.length === 0 ? (
        <p className="text-sm text-neutral-500">No restaurants match these filters.</p>
      ) : (
        <p className="text-xs text-neutral-500">
          Showing {filteredRows.length} of {summary.total}
        </p>
      )}

      <div className="space-y-3">
        {filteredRows.map(({ restaurant, ownership, flags }) => {
          const cuisineNames =
            (restaurant.cuisineSlugs || []).map((slug) => getCuisineBySlug(slug)?.name).filter(Boolean).join(", ") ||
            restaurant.cuisine ||
            "";

          return (
            <div key={restaurant.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-neutral-900">{restaurant.name || "(no name)"}</div>
                  <div className="mt-1 flex flex-wrap gap-1.5 text-xs">
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5">status: {restaurant.status || "unknown"}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 ${
                        ownership === "claimed"
                          ? "bg-green-100 text-green-800"
                          : ownership === "claim_pending"
                          ? "bg-amber-100 text-amber-800"
                          : ownership === "claim_rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-neutral-100 text-neutral-700"
                      }`}
                    >
                      {OWNERSHIP_DISPLAY_LABEL[ownership]}
                    </span>
                    {restaurant.citySlug ? (
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5">city: {restaurant.citySlug}</span>
                    ) : null}
                    {restaurant.hubName || restaurant.area ? (
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5">
                        {[restaurant.hubName, restaurant.area].filter(Boolean).join(" / ")}
                      </span>
                    ) : null}
                    {cuisineNames ? <span className="rounded-full bg-neutral-100 px-2 py-0.5">{cuisineNames}</span> : null}
                    {restaurant.sourceType ? (
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5">source: {restaurant.sourceType}</span>
                    ) : null}
                    {restaurant.dataConfidence ? (
                      <span
                        className={`rounded-full px-2 py-0.5 ${
                          restaurant.dataConfidence === "flagged"
                            ? "bg-red-100 text-red-800"
                            : restaurant.dataConfidence === "unverified"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        confidence: {restaurant.dataConfidence}
                      </span>
                    ) : null}
                  </div>

                  {flags.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {flags.map((flag: DataQualityFlag) => (
                        <span key={flag} className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs text-red-700">
                          {DATA_QUALITY_FLAG_LABEL[flag]}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-emerald-700">No data-quality flags</div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {ownership === "claim_pending" ? (
                    <Link
                      href="/admin/restaurant-claims"
                      className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700"
                    >
                      Review claim
                    </Link>
                  ) : null}
                  <Link
                    href={`/restaurants/${restaurant.id}`}
                    className="rounded-lg border border-neutral-300 px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                  >
                    View public page
                  </Link>
                  <Link
                    href={`/restaurants/${restaurant.id}/edit`}
                    className="rounded-lg bg-neutral-900 px-3 py-2 text-xs font-semibold text-white hover:bg-neutral-800"
                  >
                    Manage profile
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
