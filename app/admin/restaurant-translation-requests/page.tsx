"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDocs, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAdminGate } from "@/hooks/useAdminGate";
import type { RestaurantTranslationRequestDoc, RestaurantTranslationRequestStatus } from "@/lib/types";

/**
 * Admin queue for the restaurant content-translation request workflow
 * (`restaurant_translation_requests`) — see
 * docs/MULTILINGUAL-ARCHITECTURE.md and docs/ADMIN-OPERATIONS.md.
 * This page did not previously exist anywhere in the app — Task I's
 * one genuine gap in this area.
 *
 * DELIBERATELY DOES NOT COLLECT A QUOTE AMOUNT OR ANY PAYMENT
 * INFORMATION. This page only advances `status` (plus the matching
 * timestamp field already in the data model) through the sequence the
 * architecture already defines: REQUESTED -> QUOTED -> PAYMENT_PENDING
 * -> IN_TRANSLATION -> OWNER_REVIEW -> PUBLISHED, with CANCELLED
 * reachable from any non-terminal state. `quotedAmount`/`quotedCurrency`
 * remain part of the data model (Task D) but this task's UI does not
 * expose an entry field for them, to avoid building anything that
 * could be read as pricing/payment functionality — see
 * docs/ADMIN-OPERATIONS.md for why.
 *
 * Marking a request PUBLISHED here is a workflow-tracking action ONLY
 * — it never writes to `restaurants/{id}.contentTranslations`. Making
 * a translation actually live on the public listing is, and remains,
 * a separate, deliberate admin edit to the restaurant document itself
 * (no UI exists for that either — see "known limitations" in
 * docs/ADMIN-OPERATIONS.md). This intentionally matches
 * firestore.rules' own comment on this collection: reaching PUBLISHED
 * in the request never auto-publishes anything.
 */

const STATUS_SEQUENCE: RestaurantTranslationRequestStatus[] = [
  "REQUESTED",
  "QUOTED",
  "PAYMENT_PENDING",
  "IN_TRANSLATION",
  "OWNER_REVIEW",
  "PUBLISHED",
];

const NEXT_STATUS: Partial<Record<RestaurantTranslationRequestStatus, RestaurantTranslationRequestStatus>> = {
  REQUESTED: "QUOTED",
  QUOTED: "PAYMENT_PENDING",
  PAYMENT_PENDING: "IN_TRANSLATION",
  IN_TRANSLATION: "OWNER_REVIEW",
  OWNER_REVIEW: "PUBLISHED",
};

const STATUS_TIMESTAMP_FIELD: Partial<Record<RestaurantTranslationRequestStatus, string>> = {
  QUOTED: "quotedAt",
  PAYMENT_PENDING: "paymentReceivedAt",
  IN_TRANSLATION: "translationStartedAt",
  OWNER_REVIEW: "ownerReviewRequestedAt",
  PUBLISHED: "publishedAt",
  CANCELLED: "cancelledAt",
};

const STATUS_BADGE_CLASS: Record<RestaurantTranslationRequestStatus, string> = {
  REQUESTED: "bg-amber-100 text-amber-800",
  QUOTED: "bg-blue-100 text-blue-800",
  PAYMENT_PENDING: "bg-blue-100 text-blue-800",
  IN_TRANSLATION: "bg-purple-100 text-purple-800",
  OWNER_REVIEW: "bg-purple-100 text-purple-800",
  PUBLISHED: "bg-green-100 text-green-800",
  CANCELLED: "bg-neutral-200 text-neutral-700",
};

const FILTERS: ("All" | RestaurantTranslationRequestStatus)[] = ["All", ...STATUS_SEQUENCE, "CANCELLED"];

export default function AdminRestaurantTranslationRequestsPage() {
  const { checking, allowed } = useAdminGate();
  const [requests, setRequests] = useState<RestaurantTranslationRequestDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | RestaurantTranslationRequestStatus>("All");
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!allowed) return;
    load();
  }, [allowed]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const snap = await getDocs(collection(db, "restaurant_translation_requests"));
      setRequests(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<RestaurantTranslationRequestDoc, "id">) })));
    } catch (err) {
      console.error("Failed to load translation requests:", err);
      setError("Failed to load translation requests.");
    } finally {
      setLoading(false);
    }
  }

  const filteredRequests = useMemo(() => {
    if (statusFilter === "All") return requests;
    return requests.filter((r) => r.status === statusFilter);
  }, [requests, statusFilter]);

  async function advanceStatus(request: RestaurantTranslationRequestDoc, nextStatus: RestaurantTranslationRequestStatus) {
    setActioningId(request.id);
    try {
      const timestampField = STATUS_TIMESTAMP_FIELD[nextStatus];
      await updateDoc(doc(db, "restaurant_translation_requests", request.id), {
        status: nextStatus,
        ...(timestampField ? { [timestampField]: serverTimestamp() } : {}),
        notes: noteDrafts[request.id] ?? request.notes ?? "",
        updatedAt: serverTimestamp(),
      });
      await load();
    } catch (err) {
      console.error("Failed to update translation request status:", err);
      setError("Failed to update this request.");
    } finally {
      setActioningId(null);
    }
  }

  if (checking) {
    return <div className="mx-auto max-w-5xl p-6 text-sm text-neutral-500">Checking access...</div>;
  }

  if (!allowed) {
    return (
      <div className="mx-auto max-w-5xl p-6">
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
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Restaurant translation requests</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Only a restaurant&apos;s own approved owner can submit one of these — see
            docs/MULTILINGUAL-ARCHITECTURE.md. This page tracks workflow status only; it never
            generates a translation automatically, never sets a price, and never publishes translated
            content to the restaurant&apos;s public listing by itself.
          </p>
        </div>
        <Link href="/admin" className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
          Back to Admin
        </Link>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
              statusFilter === status
                ? "border-amber-600 bg-amber-600 text-white"
                : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {loading ? <p className="text-sm text-neutral-500">Loading...</p> : null}
      {!loading && filteredRequests.length === 0 ? (
        <p className="text-sm text-neutral-500">No requests{statusFilter !== "All" ? ` with status ${statusFilter}` : ""}.</p>
      ) : null}

      <div className="space-y-3">
        {filteredRequests.map((request) => {
          const nextStatus = NEXT_STATUS[request.status];
          const busy = actioningId === request.id;
          const isTerminal = request.status === "PUBLISHED" || request.status === "CANCELLED";

          return (
            <div key={request.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link href={`/restaurants/${request.restaurantId}`} className="font-semibold text-neutral-900 hover:underline">
                    Restaurant {request.restaurantId}
                  </Link>
                  <div className="mt-1 text-xs text-neutral-500">
                    Requested by uid: {request.requestedByUid} · Target locales: {(request.targetLocales || []).join(", ") || "—"}
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE_CLASS[request.status]}`}>
                  {request.status}
                </span>
              </div>

              <textarea
                value={noteDrafts[request.id] ?? request.notes ?? ""}
                onChange={(e) => setNoteDrafts((prev) => ({ ...prev, [request.id]: e.target.value }))}
                placeholder="Admin/ops note (optional, never shown publicly)"
                rows={2}
                className="mt-3 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-black"
              />

              {!isTerminal ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {nextStatus ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => advanceStatus(request, nextStatus)}
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      Advance to {nextStatus}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => advanceStatus(request, "CANCELLED")}
                    className="rounded-lg border border-neutral-300 px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
                  >
                    Cancel request
                  </button>
                </div>
              ) : (
                <p className="mt-3 text-xs text-neutral-500">
                  {request.status === "PUBLISHED"
                    ? "Marked published in this queue. Publishing the actual translated text to the restaurant's listing is a separate, manual step — see docs/ADMIN-OPERATIONS.md."
                    : "This request was cancelled."}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
