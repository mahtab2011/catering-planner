"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAdminGate } from "@/hooks/useAdminGate";
import { deriveOwnershipDisplayState } from "@/lib/adminRestaurantOverview";
import { assessRestaurantDataQuality } from "@/lib/adminDataQuality";
import type { RestaurantOwnerClaimStatus, RestaurantDataConfidence } from "@/lib/types";

type SalesSignupStatus = "new" | "reviewing" | "approved" | "rejected";

type SalesSignup = {
  id: string;
  fullName?: string;
  phone?: string;
  email?: string;
  area?: string;
  address?: string;
  notes?: string;
  status?: SalesSignupStatus;
  reviewed?: boolean;
  reviewedAt?: any;
  reviewedBy?: string;
  createdAt?: any;
  updatedAt?: any;
};

type OrderStatus =
  | "new"
  | "accepted"
  | "preparing"
  | "ready"
  | "served"
  | "delivered"
  | "cancelled";

type PaymentStatus = "unpaid" | "partial" | "paid";

type OrderDoc = {
  id: string;
  orderNumber?: number | string;
  customerName?: string;
  orderType?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  grandTotal?: number;
  subtotal?: number;
  discount?: number;
  cancelReason?: string;
  createdAt?: any;
};

/** Minimal shape for the restaurant-marketplace overview counts below
 *  — see docs/ADMIN-OPERATIONS.md. Deliberately does not include
 *  claimant contact fields; this page only ever shows counts, never
 *  individual claimant details (those stay on /admin/restaurant-claims). */
type AdminRestaurantSummaryRow = {
  id: string;
  ownerUid?: string;
  ownerClaimStatus?: RestaurantOwnerClaimStatus;
  name?: string;
  fullAddress?: string;
  postcode?: string;
  shortDescription?: string;
  longDescription?: string;
  cuisine?: string;
  cuisineSlugs?: string[];
  phone?: string;
  email?: string;
  openingHoursText?: string;
  coverImage?: string;
  imageUrl?: string;
  menuCategories?: { items?: unknown[] }[];
  hubName?: string;
  area?: string;
  dataConfidence?: RestaurantDataConfidence;
};

function tsToMs(value: any) {
  if (value?.seconds != null) return value.seconds * 1000;
  if (value instanceof Date) return value.getTime();
  return 0;
}

function isTodayTs(value: any) {
  const ms = tsToMs(value);
  if (!ms) return false;

  const d = new Date(ms);
  const now = new Date();

  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function money(n: number) {
  return Number(n || 0).toFixed(2);
}

export default function AdminPage() {
  const { checking: checkingAdmin, allowed: isAdmin } = useAdminGate();
  const [sales, setSales] = useState<SalesSignup[]>([]);
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [marketplaceRestaurants, setMarketplaceRestaurants] = useState<AdminRestaurantSummaryRow[]>([]);
  const [pendingCorrectionsCount, setPendingCorrectionsCount] = useState(0);
  const [pendingTranslationRequestsCount, setPendingTranslationRequestsCount] = useState(0);
  const [pendingImportCandidatesCount, setPendingImportCandidatesCount] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;

    const salesQ = query(
      collection(db, "sales_signups"),
      orderBy("createdAt", "desc")
    );

    const unsubSales = onSnapshot(salesQ, (snap) => {
      const rows: SalesSignup[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<SalesSignup, "id">),
      }));
      setSales(rows);
    });

    const ordersQ = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc")
    );

    const unsubOrders = onSnapshot(ordersQ, (snap) => {
      const rows: OrderDoc[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<OrderDoc, "id">),
      }));
      setOrders(rows);
    });

    // Restaurant-marketplace overview (Task I) — see
    // docs/ADMIN-OPERATIONS.md. One listener on the whole restaurants
    // collection (bounded, single-city launch) plus three narrowly
    // filtered listeners for the pending queues, so this stays a
    // handful of reads rather than an expensive analytics query.
    const unsubRestaurants = onSnapshot(collection(db, "restaurants"), (snap) => {
      setMarketplaceRestaurants(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AdminRestaurantSummaryRow, "id">) }))
      );
    });

    const unsubCorrections = onSnapshot(
      query(collection(db, "restaurant_correction_requests"), where("status", "==", "pending")),
      (snap) => setPendingCorrectionsCount(snap.size)
    );

    const unsubTranslationRequests = onSnapshot(
      query(collection(db, "restaurant_translation_requests"), where("status", "==", "REQUESTED")),
      (snap) => setPendingTranslationRequestsCount(snap.size)
    );

    const unsubImportCandidates = onSnapshot(
      query(collection(db, "restaurant_import_candidates"), where("status", "==", "PENDING_REVIEW")),
      (snap) => setPendingImportCandidatesCount(snap.size)
    );

    return () => {
      unsubSales();
      unsubOrders();
      unsubRestaurants();
      unsubCorrections();
      unsubTranslationRequests();
      unsubImportCandidates();
    };
  }, [isAdmin]);

  const marketplaceOwnership = useMemo(() => {
    let unclaimed = 0;
    let claimPending = 0;
    let claimed = 0;
    let withDataQualityFlags = 0;
    for (const r of marketplaceRestaurants) {
      const state = deriveOwnershipDisplayState(r);
      if (state === "claimed") claimed += 1;
      else if (state === "claim_pending") claimPending += 1;
      else unclaimed += 1;
      if (assessRestaurantDataQuality(r).length > 0) withDataQualityFlags += 1;
    }
    return { total: marketplaceRestaurants.length, unclaimed, claimPending, claimed, withDataQualityFlags };
  }, [marketplaceRestaurants]);

  const newLeads = useMemo(
    () => sales.filter((s) => (s.status || "new") === "new"),
    [sales]
  );

  const todayOrders = useMemo(
    () => orders.filter((o) => isTodayTs(o.createdAt)),
    [orders]
  );

  const totalOrdersToday = todayOrders.length;

  const totalRevenueToday = useMemo(
    () =>
      todayOrders.reduce((sum, o) => {
        if (o.status === "cancelled") return sum;
        return sum + Number(o.grandTotal || 0);
      }, 0),
    [todayOrders]
  );

  const cancelledToday = useMemo(
    () => todayOrders.filter((o) => o.status === "cancelled").length,
    [todayOrders]
  );

  const readyNow = useMemo(
    () => orders.filter((o) => o.status === "ready").length,
    [orders]
  );

  const completedToday = useMemo(
    () =>
      todayOrders.filter(
        (o) => o.status === "served" || o.status === "delivered"
      ).length,
    [todayOrders]
  );

  const unpaidToday = useMemo(
    () => todayOrders.filter((o) => o.paymentStatus === "unpaid").length,
    [todayOrders]
  );

  const partialToday = useMemo(
    () => todayOrders.filter((o) => o.paymentStatus === "partial").length,
    [todayOrders]
  );

  const paidToday = useMemo(
    () => todayOrders.filter((o) => o.paymentStatus === "paid").length,
    [todayOrders]
  );

  const recentOrders = useMemo(() => orders.slice(0, 8), [orders]);

  if (checkingAdmin) {
    return (
      <div className="mx-auto w-full max-w-6xl p-6 text-sm text-neutral-500">
        Checking access...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto w-full max-w-6xl p-6">
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
    <div className="mx-auto w-full max-w-6xl p-6">
      <h1 className="mb-2 text-2xl font-bold text-neutral-900">
        Admin Dashboard
      </h1>
      <p className="mb-6 text-sm text-neutral-600">
        Daily summary for restaurant operations, orders, and sales onboarding
      </p>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Link
          href="/admin/restaurants"
          className="rounded-xl border border-neutral-200 bg-white p-4 hover:shadow"
        >
          <div className="font-semibold text-neutral-900">
            Restaurants Overview
          </div>
          <div className="text-sm text-neutral-500">
            Inspect ownership state and data-quality flags for every restaurant
          </div>
        </Link>

        <Link
          href="/admin/restaurant-signups"
          className="rounded-xl border border-neutral-200 bg-white p-4 hover:shadow"
        >
          <div className="font-semibold text-neutral-900">
            Restaurant Signups
          </div>
          <div className="text-sm text-neutral-500">
            Review and approve restaurants
          </div>
        </Link>

        <Link
          href="/admin/restaurant-claims"
          className="rounded-xl border border-neutral-200 bg-white p-4 hover:shadow"
        >
          <div className="font-semibold text-neutral-900">
            Restaurant Claims
          </div>
          <div className="text-sm text-neutral-500">
            Review ownership claims and correction requests
          </div>
        </Link>

        <Link
          href="/admin/restaurant-translation-requests"
          className="rounded-xl border border-neutral-200 bg-white p-4 hover:shadow"
        >
          <div className="font-semibold text-neutral-900">
            Translation Requests
          </div>
          <div className="text-sm text-neutral-500">
            Track owner-submitted translation requests through their workflow
          </div>
        </Link>

        <Link
          href="/admin/restaurant-import-candidates"
          className="rounded-xl border border-neutral-200 bg-white p-4 hover:shadow"
        >
          <div className="font-semibold text-neutral-900">
            Import Candidates
          </div>
          <div className="text-sm text-neutral-500">
            Review staged restaurant import candidates
          </div>
        </Link>

        <Link
          href="/orders/search"
          className="rounded-xl border border-neutral-200 bg-white p-4 hover:shadow"
        >
          <div className="font-semibold text-neutral-900">Order Search</div>
          <div className="text-sm text-neutral-500">
            Find any order quickly
          </div>
        </Link>

        <Link
          href="/sales-signup"
          className="rounded-xl border border-neutral-200 bg-white p-4 hover:shadow"
        >
          <div className="font-semibold text-neutral-900">
            Add Sales Person
          </div>
          <div className="text-sm text-neutral-500">
            Register new field agents
          </div>
        </Link>
      </div>

      <h2 className="mb-3 text-lg font-semibold text-neutral-900">
        Restaurant Marketplace
      </h2>
      <div className="mb-6 grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Link href="/admin/restaurants" className="rounded-2xl border border-neutral-200 bg-white p-4 hover:shadow">
          <div className="text-sm font-medium text-neutral-600">Restaurants</div>
          <div className="mt-1 text-2xl font-bold text-neutral-900">{marketplaceOwnership.total}</div>
        </Link>
        <Link href="/admin/restaurants" className="rounded-2xl border border-neutral-200 bg-white p-4 hover:shadow">
          <div className="text-sm font-medium text-neutral-600">Unclaimed</div>
          <div className="mt-1 text-2xl font-bold text-neutral-900">{marketplaceOwnership.unclaimed}</div>
        </Link>
        <Link href="/admin/restaurant-claims" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 hover:shadow">
          <div className="text-sm font-medium text-amber-700">Pending Claims</div>
          <div className="mt-1 text-2xl font-bold text-amber-900">{marketplaceOwnership.claimPending}</div>
        </Link>
        <Link href="/admin/restaurant-claims" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 hover:shadow">
          <div className="text-sm font-medium text-amber-700">Pending Corrections</div>
          <div className="mt-1 text-2xl font-bold text-amber-900">{pendingCorrectionsCount}</div>
        </Link>
        <Link href="/admin/restaurant-translation-requests" className="rounded-2xl border border-blue-200 bg-blue-50 p-4 hover:shadow">
          <div className="text-sm font-medium text-blue-700">Translation Requests</div>
          <div className="mt-1 text-2xl font-bold text-blue-900">{pendingTranslationRequestsCount}</div>
        </Link>
        <Link href="/admin/restaurant-import-candidates" className="rounded-2xl border border-purple-200 bg-purple-50 p-4 hover:shadow">
          <div className="text-sm font-medium text-purple-700">Staged Imports</div>
          <div className="mt-1 text-2xl font-bold text-purple-900">{pendingImportCandidatesCount}</div>
        </Link>
      </div>
      {marketplaceOwnership.withDataQualityFlags > 0 ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <Link href="/admin/restaurants" className="font-semibold hover:underline">
            {marketplaceOwnership.withDataQualityFlags} restaurant{marketplaceOwnership.withDataQualityFlags === 1 ? "" : "s"} have data-quality flags →
          </Link>
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 md:grid-cols-5">
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <div className="text-sm font-medium text-blue-700">
            Orders Today
          </div>
          <div className="mt-1 text-2xl font-bold text-blue-900">
            {totalOrdersToday}
          </div>
        </div>

        <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
          <div className="text-sm font-medium text-green-700">
            Revenue Today
          </div>
          <div className="mt-1 text-2xl font-bold text-green-900">
            £{money(totalRevenueToday)}
          </div>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="text-sm font-medium text-red-700">
            Cancelled Today
          </div>
          <div className="mt-1 text-2xl font-bold text-red-900">
            {cancelledToday}
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-sm font-medium text-amber-700">Ready Now</div>
          <div className="mt-1 text-2xl font-bold text-amber-900">
            {readyNow}
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="text-sm font-medium text-emerald-700">
            Completed Today
          </div>
          <div className="mt-1 text-2xl font-bold text-emerald-900">
            {completedToday}
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="text-sm font-medium text-neutral-600">Unpaid</div>
          <div className="mt-1 text-2xl font-bold text-neutral-900">
            {unpaidToday}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="text-sm font-medium text-neutral-600">Partial</div>
          <div className="mt-1 text-2xl font-bold text-neutral-900">
            {partialToday}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="text-sm font-medium text-neutral-600">Paid</div>
          <div className="mt-1 text-2xl font-bold text-neutral-900">
            {paidToday}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="text-sm font-medium text-neutral-600">
            New Sales Leads
          </div>
          <div className="mt-1 text-2xl font-bold text-neutral-900">
            {newLeads.length}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold text-neutral-900">
            Latest Orders
          </h2>

          {recentOrders.length === 0 ? (
            <div className="text-sm text-neutral-500">No orders found</div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((o) => (
                <div
                  key={o.id}
                  className="rounded-xl border border-neutral-200 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-neutral-900">
                        #{o.orderNumber || o.id.slice(0, 6)}
                      </div>
                      <div className="mt-1 text-sm text-neutral-600">
                        {o.customerName || "Unknown customer"}
                        {o.orderType ? ` · ${o.orderType}` : ""}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-semibold text-neutral-900">
                        £{money(Number(o.grandTotal || 0))}
                      </div>
                      <div className="mt-1 text-xs text-neutral-500 uppercase">
                        {o.status || "unknown"}
                      </div>
                    </div>
                  </div>

                  {o.cancelReason ? (
                    <div className="mt-2 text-xs text-red-600">
                      Cancel reason: {o.cancelReason}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold text-neutral-900">
            New Sales Leads
          </h2>

          {newLeads.length === 0 ? (
            <div className="text-sm text-neutral-500">No new sales leads</div>
          ) : (
            <div className="space-y-3">
              {newLeads.slice(0, 8).map((s) => (
                <div
                  key={s.id}
                  className="rounded-xl border border-neutral-200 p-3"
                >
                  <div className="font-medium text-neutral-900">
                    {s.fullName || "No name"}
                  </div>
                  <div className="mt-1 text-sm text-neutral-600">
                    {s.phone || "—"}
                    {s.area ? ` · ${s.area}` : ""}
                  </div>
                  {s.email ? (
                    <div className="mt-1 text-sm text-neutral-600">
                      {s.email}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}