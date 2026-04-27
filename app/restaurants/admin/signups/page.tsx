"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type SignupStatus =
  | "new"
  | "reviewing"
  | "contacted"
  | "approved"
  | "rejected";

type RestaurantSignup = {
  id: string;
  restaurantName?: string;
  ownerName?: string;
  phone?: string;
  email?: string;
  hubId?: string;
  hubName?: string;
  area?: string;
  cuisine?: string;
  notes?: string;
  source?: string;
  status?: SignupStatus;
  reviewed?: boolean;
  contactAttempted?: boolean;
  createdAt?: any;
  updatedAt?: any;

  // backward compatibility with your old data
  name?: string;
  owner?: string;
  hub?: string;
};

function safeText(value?: string) {
  return (value || "").trim();
}

function normalizeText(value?: string) {
  return safeText(value).toLowerCase();
}

function formatDateTime(value: any) {
  try {
    if (!value) return "—";
    if (typeof value?.toDate === "function") {
      return value.toDate().toLocaleString();
    }
    return "—";
  } catch {
    return "—";
  }
}

function getStatusBadgeClass(status: SignupStatus | string | undefined) {
  switch (status) {
    case "new":
      return "bg-blue-100 text-blue-800";
    case "reviewing":
      return "bg-amber-100 text-amber-800";
    case "contacted":
      return "bg-purple-100 text-purple-800";
    case "approved":
      return "bg-green-100 text-green-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    default:
      return "bg-neutral-100 text-neutral-700";
  }
}

export default function RestaurantSignupAdminPage() {
  const [rows, setRows] = useState<RestaurantSignup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [savingId, setSavingId] = useState("");
  const [msg, setMsg] = useState("");

  async function loadRows() {
    try {
      setLoading(true);
      setMsg("");

      const q = query(
        collection(db, "restaurant_signups"),
        orderBy("createdAt", "desc")
      );

      const snap = await getDocs(q);

      const list: RestaurantSignup[] = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<RestaurantSignup, "id">),
      }));

      setRows(list);
    } catch (error) {
      console.error("Failed to load restaurant signups:", error);
      setMsg("Failed to load signup applications.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRows();
  }, []);

  async function handleStatusChange(id: string, nextStatus: SignupStatus) {
    try {
      setSavingId(id);
      setMsg("");

      await updateDoc(doc(db, "restaurant_signups", id), {
        status: nextStatus,
        reviewed: nextStatus !== "new",
        contactAttempted:
          nextStatus === "contacted" || nextStatus === "approved",
        updatedAt: serverTimestamp(),
      });

      setRows((prev) =>
        prev.map((row) =>
          row.id === id
            ? {
                ...row,
                status: nextStatus,
                reviewed: nextStatus !== "new",
                contactAttempted:
                  nextStatus === "contacted" || nextStatus === "approved",
              }
            : row
        )
      );

      setMsg("Signup status updated.");
    } catch (error) {
      console.error("Failed to update signup status:", error);
      setMsg("Failed to update signup status.");
    } finally {
      setSavingId("");
    }
  }

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();

    return rows.filter((row) => {
      const restaurantName = safeText(row.restaurantName || row.name);
      const ownerName = safeText(row.ownerName || row.owner);
      const hubName = safeText(row.hubName || row.hub);

      const matchesSearch =
        !q ||
        normalizeText(restaurantName).includes(q) ||
        normalizeText(ownerName).includes(q) ||
        normalizeText(row.phone).includes(q) ||
        normalizeText(row.email).includes(q) ||
        normalizeText(hubName).includes(q) ||
        normalizeText(row.area).includes(q) ||
        normalizeText(row.cuisine).includes(q) ||
        normalizeText(row.notes).includes(q);

      const matchesStatus =
        selectedStatus === "All" || safeText(row.status) === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [rows, search, selectedStatus]);

  const stats = useMemo(() => {
    return {
      total: rows.length,
      new: rows.filter((r) => r.status === "new").length,
      reviewing: rows.filter((r) => r.status === "reviewing").length,
      contacted: rows.filter((r) => r.status === "contacted").length,
      approved: rows.filter((r) => r.status === "approved").length,
      rejected: rows.filter((r) => r.status === "rejected").length,
    };
  }, [rows]);

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex rounded-full bg-amber-100 px-4 py-1 text-sm font-semibold text-amber-900">
                Admin Panel
              </div>

              <h1 className="mt-4 text-3xl font-bold text-neutral-900 md:text-4xl">
                Restaurant Signup Applications
              </h1>

              <p className="mt-3 max-w-3xl text-neutral-600">
                Review incoming restaurant signup requests, track status, and
                manage onboarding progress.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/restaurants"
                className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                Back to restaurants
              </Link>

              <button
                type="button"
                onClick={loadRows}
                className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                Refresh
              </button>
            </div>
          </div>

          {msg ? (
            <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
              {msg}
            </div>
          ) : null}

          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
            <div className="rounded-2xl bg-neutral-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Total
              </div>
              <div className="mt-2 text-2xl font-bold text-neutral-900">
                {stats.total}
              </div>
            </div>

            <div className="rounded-2xl bg-blue-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                New
              </div>
              <div className="mt-2 text-2xl font-bold text-blue-900">
                {stats.new}
              </div>
            </div>

            <div className="rounded-2xl bg-amber-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                Reviewing
              </div>
              <div className="mt-2 text-2xl font-bold text-amber-900">
                {stats.reviewing}
              </div>
            </div>

            <div className="rounded-2xl bg-purple-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-purple-600">
                Contacted
              </div>
              <div className="mt-2 text-2xl font-bold text-purple-900">
                {stats.contacted}
              </div>
            </div>

            <div className="rounded-2xl bg-green-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-green-600">
                Approved
              </div>
              <div className="mt-2 text-2xl font-bold text-green-900">
                {stats.approved}
              </div>
            </div>

            <div className="rounded-2xl bg-red-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-red-600">
                Rejected
              </div>
              <div className="mt-2 text-2xl font-bold text-red-900">
                {stats.rejected}
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-700">
                Search
              </label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search restaurant, owner, phone, hub..."
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-700">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-amber-500"
              >
                <option value="All">All</option>
                <option value="new">new</option>
                <option value="reviewing">reviewing</option>
                <option value="contacted">contacted</option>
                <option value="approved">approved</option>
                <option value="rejected">rejected</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSelectedStatus("All");
                }}
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                Clear filters
              </button>
            </div>
          </div>

          {loading ? (
            <div className="mt-10 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
              <div className="text-lg font-semibold text-neutral-900">
                Loading applications...
              </div>
              <p className="mt-2 text-sm text-neutral-600">
                Please wait while signup applications are loaded.
              </p>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
              <div className="text-lg font-semibold text-neutral-900">
                No applications found
              </div>
              <p className="mt-2 text-sm text-neutral-600">
                Try another search or filter.
              </p>
            </div>
          ) : (
            <div className="mt-10 space-y-5">
              {filteredRows.map((row) => {
                const restaurantName = safeText(
                  row.restaurantName || row.name
                );
                const ownerName = safeText(row.ownerName || row.owner);
                const hubName = safeText(row.hubName || row.hub);

                return (
                  <div
                    key={row.id}
                    className="rounded-2xl border border-neutral-200 bg-white p-5"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                            Restaurant
                          </div>
                          <div className="mt-1 text-base font-semibold text-neutral-900">
                            {restaurantName || "—"}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                            Owner
                          </div>
                          <div className="mt-1 text-sm text-neutral-900">
                            {ownerName || "—"}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                            Phone
                          </div>
                          <div className="mt-1 text-sm text-neutral-900">
                            {safeText(row.phone) || "—"}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                            Email
                          </div>
                          <div className="mt-1 break-all text-sm text-neutral-900">
                            {safeText(row.email) || "—"}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                            Hub
                          </div>
                          <div className="mt-1 text-sm text-neutral-900">
                            {hubName || "—"}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                            Cuisine
                          </div>
                          <div className="mt-1 text-sm text-neutral-900">
                            {safeText(row.cuisine) || "—"}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                            Area
                          </div>
                          <div className="mt-1 text-sm text-neutral-900">
                            {safeText(row.area) || "—"}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                            Created
                          </div>
                          <div className="mt-1 text-sm text-neutral-900">
                            {formatDateTime(row.createdAt)}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                            Status
                          </div>
                          <div className="mt-2">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                                row.status
                              )}`}
                            >
                              {safeText(row.status) || "new"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="w-full xl:w-72">
                        <label className="mb-2 block text-sm font-semibold text-neutral-700">
                          Update status
                        </label>
                        <select
                          value={safeText(row.status) || "new"}
                          onChange={(e) =>
                            handleStatusChange(
                              row.id,
                              e.target.value as SignupStatus
                            )
                          }
                          disabled={savingId === row.id}
                          className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-amber-500 disabled:opacity-60"
                        >
                          <option value="new">new</option>
                          <option value="reviewing">reviewing</option>
                          <option value="contacted">contacted</option>
                          <option value="approved">approved</option>
                          <option value="rejected">rejected</option>
                        </select>

                        {savingId === row.id ? (
                          <div className="mt-2 text-xs text-neutral-500">
                            Saving...
                          </div>
                        ) : null}

                        <Link
                          href={`/restaurants/admin/signups/${row.id}`}
                          className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                        >
                          Open details
                        </Link>
                      </div>
                    </div>

                    {safeText(row.notes) ? (
                      <div className="mt-4 rounded-2xl bg-neutral-50 p-4">
                        <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          Notes
                        </div>
                        <div className="mt-2 whitespace-pre-line text-sm text-neutral-700">
                          {row.notes}
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-neutral-500">
                      <span className="rounded-full bg-neutral-100 px-3 py-1">
                        reviewed: {row.reviewed ? "yes" : "no"}
                      </span>
                      <span className="rounded-full bg-neutral-100 px-3 py-1">
                        contactAttempted: {row.contactAttempted ? "yes" : "no"}
                      </span>
                      <span className="rounded-full bg-neutral-100 px-3 py-1">
                        source: {safeText(row.source) || "—"}
                      </span>
                      <span className="rounded-full bg-neutral-100 px-3 py-1">
                        id: {row.id}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}