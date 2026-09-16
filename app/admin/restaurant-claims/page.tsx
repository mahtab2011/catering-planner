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
import type { RestaurantCorrectionRequestDoc, RestaurantDoc } from "@/lib/types";

type ClaimRow = Pick<
  RestaurantDoc,
  "id" | "name" | "ownerClaimStatus" | "claimantUid" | "claimSubmittedAt"
>;

/**
 * Admin review queue for restaurant ownership claims and
 * correction/removal requests — see
 * docs/RESTAURANT-CLAIM-WORKFLOW.md.
 *
 * Approving a claim is the ONLY place in the app that sets
 * `ownerUid` from a `claimantUid` — it does so via a direct,
 * admin-authenticated Firestore write, which firestore.rules allows
 * only because this page is gated by isAdmin() (a Firebase Auth
 * custom claim, not the client-writable users/{uid}.role field — see
 * useAdminGate). No Cloud Function is required for this because the
 * existing isAdmin() rules branch is already unrestricted; see the
 * doc for the reasoning.
 *
 * Accepting a correction/removal request does NOT automatically edit
 * or delete the restaurant — an admin makes that change by hand on
 * the restaurant's own edit page. This queue only records the
 * decision.
 */
export default function AdminRestaurantClaimsPage() {
  const { checking, allowed } = useAdminGate();
  const [claims, setClaims] = useState<ClaimRow[]>([]);
  const [requests, setRequests] = useState<RestaurantCorrectionRequestDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!allowed) return;
    load();
  }, [allowed]);

  async function load() {
    setLoading(true);
    try {
      const [claimsSnap, requestsSnap] = await Promise.all([
        getDocs(query(collection(db, "restaurants"), where("ownerClaimStatus", "==", "claim_pending"))),
        getDocs(query(collection(db, "restaurant_correction_requests"), where("status", "==", "pending"))),
      ]);
      setClaims(
        claimsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ClaimRow, "id">) }))
      );
      setRequests(
        requestsSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<RestaurantCorrectionRequestDoc, "id">),
        }))
      );
    } catch (err) {
      console.error("Failed to load claims/requests:", err);
      setError("Failed to load claims and requests.");
    } finally {
      setLoading(false);
    }
  }

  async function approveClaim(claim: ClaimRow) {
    if (!claim.claimantUid) return;
    setActioningId(claim.id);
    try {
      await updateDoc(doc(db, "restaurants", claim.id), {
        ownerUid: claim.claimantUid,
        ownerClaimStatus: "claimed",
        claimDecidedAt: serverTimestamp(),
        claimDecidedBy: auth.currentUser?.uid || "",
      });
      await load();
    } catch (err) {
      console.error("Failed to approve claim:", err);
      setError("Failed to approve this claim.");
    } finally {
      setActioningId(null);
    }
  }

  async function rejectClaim(claim: ClaimRow) {
    setActioningId(claim.id);
    try {
      await updateDoc(doc(db, "restaurants", claim.id), {
        ownerClaimStatus: "claim_rejected",
        claimDecidedAt: serverTimestamp(),
        claimDecidedBy: auth.currentUser?.uid || "",
      });
      await load();
    } catch (err) {
      console.error("Failed to reject claim:", err);
      setError("Failed to reject this claim.");
    } finally {
      setActioningId(null);
    }
  }

  async function moderateRequest(request: RestaurantCorrectionRequestDoc, status: "accepted" | "rejected") {
    setActioningId(request.id);
    try {
      await updateDoc(doc(db, "restaurant_correction_requests", request.id), {
        status,
        moderatedBy: auth.currentUser?.uid || "",
        moderatedAt: serverTimestamp(),
      });
      await load();
    } catch (err) {
      console.error("Failed to moderate request:", err);
      setError("Failed to update this request.");
    } finally {
      setActioningId(null);
    }
  }

  if (checking) {
    return <div className="mx-auto max-w-4xl p-6 text-sm text-neutral-500">Checking access...</div>;
  }

  if (!allowed) {
    return (
      <div className="mx-auto max-w-4xl p-6">
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
    <div className="mx-auto max-w-5xl space-y-10 p-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Restaurant claims & correction requests</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Review pending ownership claims and public correction/removal requests. Accepting a
          correction request does not edit the listing automatically — make the change yourself
          on the restaurant's edit page afterwards.
        </p>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {loading ? <p className="text-sm text-neutral-500">Loading...</p> : null}

      <section>
        <h2 className="text-lg font-semibold text-neutral-900">Pending ownership claims ({claims.length})</h2>
        {!loading && claims.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">No pending claims.</p>
        ) : null}
        <div className="mt-3 space-y-3">
          {claims.map((claim) => (
            <div key={claim.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Link href={`/restaurants/${claim.id}`} className="font-semibold text-neutral-900 hover:underline">
                    {claim.name}
                  </Link>
                  <div className="text-xs text-neutral-500">Claimant uid: {claim.claimantUid}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={actioningId === claim.id}
                    onClick={() => approveClaim(claim)}
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={actioningId === claim.id}
                    onClick={() => rejectClaim(claim)}
                    className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-neutral-900">
          Pending correction/removal requests ({requests.length})
        </h2>
        {!loading && requests.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">No pending requests.</p>
        ) : null}
        <div className="mt-3 space-y-3">
          {requests.map((request) => (
            <div key={request.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/restaurants/${request.restaurantId}`}
                    className="font-semibold text-neutral-900 hover:underline"
                  >
                    Restaurant {request.restaurantId}
                  </Link>
                  <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                    {request.requestType}
                  </div>
                  <p className="mt-2 text-sm text-neutral-700">
                    {request.requestType === "correction" ? request.suggestedValueNote : request.reasonNote}
                  </p>
                  <div className="mt-1 text-xs text-neutral-500">
                    Submitted by uid: {request.submittedByUid}
                    {request.submittedByEmail ? ` (${request.submittedByEmail})` : ""}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={actioningId === request.id}
                    onClick={() => moderateRequest(request, "accepted")}
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    disabled={actioningId === request.id}
                    onClick={() => moderateRequest(request, "rejected")}
                    className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
