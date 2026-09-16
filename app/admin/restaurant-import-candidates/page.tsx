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
import type { RestaurantImportCandidateDoc, RestaurantImportCandidateStatus } from "@/lib/import/types";

/**
 * Admin review queue for the restaurant import pipeline's staging
 * collection (`restaurant_import_candidates`) — see
 * docs/RESTAURANT-IMPORT-PIPELINE.md.
 *
 * This page can only ever change a candidate's own status/review
 * fields (via the isAdmin()-gated Firestore rule on that collection —
 * see firestore.rules). It NEVER creates a restaurant document
 * itself: promoting an APPROVED candidate into a real, public
 * restaurant is done exclusively by
 * functions/scripts/applyApprovedImportBatch.js, run manually outside
 * this app with explicit --project/--env/--confirm-production
 * safeguards. This page's "Copy approved IDs" button exists only to
 * make hand-assembling that script's --batch file easier — it does
 * not write anything beyond the candidate's own status.
 *
 * Candidates can only ever be CREATED by
 * functions/scripts/stageImportCandidates.js via the Admin SDK
 * (firestore.rules denies every client create, including an admin's)
 * — so there is no "add candidate" button here by design.
 */
export default function AdminRestaurantImportCandidatesPage() {
  const { checking, allowed } = useAdminGate();
  const [candidates, setCandidates] = useState<RestaurantImportCandidateDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<RestaurantImportCandidateStatus>("PENDING_REVIEW");
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    if (!allowed) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed, statusFilter]);

  async function load() {
    setLoading(true);
    try {
      const snap = await getDocs(
        query(collection(db, "restaurant_import_candidates"), where("status", "==", statusFilter))
      );
      setCandidates(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<RestaurantImportCandidateDoc, "id">) }))
      );
    } catch (err) {
      console.error("Failed to load import candidates:", err);
      setError("Failed to load import candidates.");
    } finally {
      setLoading(false);
    }
  }

  async function setStatus(candidate: RestaurantImportCandidateDoc, status: RestaurantImportCandidateStatus) {
    setActioningId(candidate.id);
    try {
      await updateDoc(doc(db, "restaurant_import_candidates", candidate.id), {
        status,
        reviewedByUid: auth.currentUser?.uid || "",
        reviewedAt: serverTimestamp(),
        reviewNote: noteDrafts[candidate.id] || candidate.reviewNote || "",
        updatedAt: serverTimestamp(),
      });
      await load();
    } catch (err) {
      console.error("Failed to update candidate status:", err);
      setError("Failed to update this candidate.");
    } finally {
      setActioningId(null);
    }
  }

  function copyApprovedIds() {
    const approvedIds = candidates.filter((c) => c.status === "APPROVED").map((c) => c.id);
    const batch = {
      batchId: `manual-export-${new Date().toISOString().slice(0, 10)}`,
      approvedAt: new Date().toISOString(),
      approvedByUid: auth.currentUser?.uid || "",
      candidateIds: approvedIds,
    };
    navigator.clipboard?.writeText(JSON.stringify(batch, null, 2));
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
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Restaurant import candidates</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Review staged candidates from the import pipeline. Approving a candidate here does not
          create a restaurant — that requires a separate, manual run of
          functions/scripts/applyApprovedImportBatch.js with explicit project/environment
          confirmation. See docs/RESTAURANT-IMPORT-PIPELINE.md.
        </p>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-2">
        {(["PENDING_REVIEW", "APPROVED", "REJECTED", "DUPLICATE", "NEEDS_RESEARCH", "IMPORTED"] as const).map(
          (status) => (
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
          )
        )}

        {statusFilter === "APPROVED" ? (
          <button
            type="button"
            onClick={copyApprovedIds}
            className="ml-auto rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            Copy approved-batch JSON
          </button>
        ) : null}
      </div>

      {loading ? <p className="text-sm text-neutral-500">Loading...</p> : null}
      {!loading && candidates.length === 0 ? (
        <p className="text-sm text-neutral-500">No candidates with status {statusFilter}.</p>
      ) : null}

      <div className="space-y-3">
        {candidates.map((candidate) => (
          <div key={candidate.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-neutral-900">{candidate.name}</div>
                <div className="mt-1 text-xs text-neutral-500">
                  {[candidate.addressLine1, candidate.postcode].filter(Boolean).join(", ")}
                </div>
                <div className="mt-1 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5">
                    source: {candidate.sourceType} ({candidate.sourceName})
                  </span>
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5">
                    cuisine: {candidate.cuisineClassificationStatus === "classified"
                      ? (candidate.cuisineSlugs || []).join(", ") || "(none)"
                      : "unknown — requires review"}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 ${
                      candidate.duplicateClassification === "match"
                        ? "bg-red-100 text-red-800"
                        : candidate.duplicateClassification === "possible_match"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-neutral-100"
                    }`}
                  >
                    duplicate: {candidate.duplicateClassification || "unknown"}
                  </span>
                  {(candidate.dietaryAttributes || []).length > 0 ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800">
                      dietary: {(candidate.dietaryAttributes || []).join(", ")}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <textarea
              value={noteDrafts[candidate.id] ?? candidate.reviewNote ?? ""}
              onChange={(e) => setNoteDrafts((prev) => ({ ...prev, [candidate.id]: e.target.value }))}
              placeholder="Review note (optional)"
              rows={2}
              className="mt-3 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-black"
            />

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={actioningId === candidate.id}
                onClick={() => setStatus(candidate, "APPROVED")}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                Approve
              </button>
              <button
                type="button"
                disabled={actioningId === candidate.id}
                onClick={() => setStatus(candidate, "REJECTED")}
                className="rounded-lg border border-neutral-300 px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
              >
                Reject
              </button>
              <button
                type="button"
                disabled={actioningId === candidate.id}
                onClick={() => setStatus(candidate, "DUPLICATE")}
                className="rounded-lg border border-neutral-300 px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
              >
                Mark duplicate
              </button>
              <button
                type="button"
                disabled={actioningId === candidate.id}
                onClick={() => setStatus(candidate, "NEEDS_RESEARCH")}
                className="rounded-lg border border-neutral-300 px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
              >
                Needs research
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
