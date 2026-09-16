"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAdminGate } from "@/hooks/useAdminGate";
import type { RestaurantClaimDoc, RestaurantCorrectionRequestDoc } from "@/lib/types";

/** A claim record joined with the restaurant's own (public) name for
 *  display — the claim record itself never stores a copy of the
 *  restaurant's name, so this is looked up once per pending claim
 *  when the queue loads. See docs/RESTAURANT-CLAIM-WORKFLOW.md. */
type ClaimRow = RestaurantClaimDoc & { restaurantName: string };

/**
 * Admin review queue for restaurant ownership claims and
 * correction/removal requests — see
 * docs/RESTAURANT-CLAIM-WORKFLOW.md.
 *
 * Claimant identity/contact details are read from the private
 * `restaurant_claims` collection (Task K) — never from the public
 * `restaurants` document, which no longer carries this data at all
 * (see docs/PRODUCTION-READINESS-AUDIT.md's "J-01"). Approving a
 * claim is the ONLY place in the app that sets `ownerUid` from a
 * claim's `claimantUid` — it does so via a batched, admin-
 * authenticated Firestore write (both the claim record and the
 * restaurant document update together, atomically), which
 * firestore.rules allows only because this page is gated by
 * isAdmin() (a Firebase Auth custom claim, not the client-writable
 * users/{uid}.role field — see useAdminGate). No Cloud Function is
 * required for this because the existing isAdmin() rules branches are
 * already unrestricted for admins.
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
        getDocs(query(collection(db, "restaurant_claims"), where("status", "==", "pending"))),
        getDocs(query(collection(db, "restaurant_correction_requests"), where("status", "==", "pending"))),
      ]);

      const rawClaims = claimsSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<RestaurantClaimDoc, "id">),
      }));

      // The claim record only stores restaurantId — look up each
      // restaurant's (public) name for display, once per pending
      // claim. Admin can already read any restaurant regardless of
      // status via the isAdmin() branch on that collection's own rule.
      const claimRows = await Promise.all(
        rawClaims.map(async (claim) => {
          let restaurantName = claim.restaurantId;
          try {
            const restaurantSnap = await getDoc(doc(db, "restaurants", claim.restaurantId));
            if (restaurantSnap.exists()) {
              restaurantName = (restaurantSnap.data().name as string) || claim.restaurantId;
            }
          } catch (err) {
            console.error(`Failed to load restaurant ${claim.restaurantId} for claim ${claim.id}:`, err);
          }
          return { ...claim, restaurantName };
        })
      );

      setClaims(claimRows);
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
    setActioningId(claim.id);
    try {
      const adminUid = auth.currentUser?.uid || "";
      const decidedAt = serverTimestamp();
      const batch = writeBatch(db);
      // Both writes commit together or not at all — see
      // docs/RESTAURANT-CLAIM-WORKFLOW.md's "Multi-document
      // consistency" section.
      batch.update(doc(db, "restaurants", claim.restaurantId), {
        ownerUid: claim.claimantUid,
        ownerClaimStatus: "claimed",
        updatedAt: decidedAt,
      });
      batch.update(doc(db, "restaurant_claims", claim.id), {
        status: "approved",
        decidedAt,
        decidedBy: adminUid,
        updatedAt: decidedAt,
      });
      await batch.commit();
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
      const adminUid = auth.currentUser?.uid || "";
      const decidedAt = serverTimestamp();
      const batch = writeBatch(db);
      batch.update(doc(db, "restaurants", claim.restaurantId), {
        ownerClaimStatus: "claim_rejected",
        updatedAt: decidedAt,
      });
      batch.update(doc(db, "restaurant_claims", claim.id), {
        status: "rejected",
        decidedAt,
        decidedBy: adminUid,
        updatedAt: decidedAt,
      });
      await batch.commit();
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
          on the restaurant&apos;s edit page afterwards.
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
                  <Link href={`/restaurants/${claim.restaurantId}`} className="font-semibold text-neutral-900 hover:underline">
                    {claim.restaurantName}
                  </Link>
                  <div className="mt-1 text-sm text-neutral-700">
                    {claim.claimantName || "(no name given)"}
                    {claim.claimantRole ? ` — ${claim.claimantRole}` : ""}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {claim.claimantContactEmail || "(no email given)"}
                    {claim.claimantContactPhone ? ` · ${claim.claimantContactPhone}` : ""}
                  </div>
                  {claim.claimantNote ? (
                    <div className="mt-1 max-w-md text-xs text-neutral-600">
                      &ldquo;{claim.claimantNote}&rdquo;
                    </div>
                  ) : null}
                  <div className="mt-1 text-xs text-neutral-400">Claimant uid: {claim.claimantUid}</div>
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
