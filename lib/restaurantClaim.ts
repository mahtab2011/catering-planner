import type { RestaurantOwnerClaimStatus } from "@/lib/types";

/**
 * Pure decision logic for the restaurant claim state machine — see
 * docs/RESTAURANT-CLAIM-WORKFLOW.md. Extracted out of
 * components/restaurants/RestaurantClaimPanel.tsx so it can be unit
 * tested without a browser/Firebase — see
 * tests/restaurant-claim/run-fixture-tests.js.
 *
 * This is a UI-convenience mirror of the real security boundary, not
 * the boundary itself — the actual enforcement is the
 * restaurants/{restaurantId} update rule in firestore.rules. Nothing
 * here should ever be treated as authoritative for whether a write
 * will succeed.
 */
export type ClaimViewerState = {
  /** No ownerUid at all — the restaurant has never had an approved
   *  owner (or a prior owner link was removed by an admin). */
  isUnclaimed: boolean;
  /** The signed-in viewer IS the restaurant's current approved
   *  owner (ownerUid matches their uid). */
  isOwnerViewer: boolean;
  /** The restaurant's most recent claim was rejected — a fresh claim
   *  is allowed, but the UI should say so rather than pretend no
   *  claim was ever attempted. */
  wasPreviouslyRejected: boolean;
  /** Whether the "claim this listing" action should be offered at
   *  all right now — false while a claim is already pending, or
   *  while the restaurant already has an approved owner. */
  canSubmitClaim: boolean;
};

export function deriveClaimViewerState(params: {
  ownerUid?: string;
  ownerClaimStatus?: RestaurantOwnerClaimStatus;
  viewerUid?: string | null;
}): ClaimViewerState {
  const { ownerUid, ownerClaimStatus, viewerUid } = params;

  const isUnclaimed = !ownerUid;
  const isOwnerViewer = Boolean(viewerUid) && Boolean(ownerUid) && ownerUid === viewerUid;
  const wasPreviouslyRejected = ownerClaimStatus === "claim_rejected";
  const canSubmitClaim =
    isUnclaimed &&
    (ownerClaimStatus === undefined || ownerClaimStatus === "unclaimed" || wasPreviouslyRejected);

  return { isUnclaimed, isOwnerViewer, wasPreviouslyRejected, canSubmitClaim };
}

/** Minimum viable claim submission: an admin needs a name and a way
 *  to reach the claimant — see the required-field check on
 *  firestore.rules' claim-submission branch, which this mirrors. */
export function isClaimFormComplete(fields: {
  claimantName: string;
  claimantContactEmail: string;
}): boolean {
  return Boolean(fields.claimantName.trim()) && Boolean(fields.claimantContactEmail.trim());
}
