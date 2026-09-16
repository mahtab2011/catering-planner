/**
 * Pure decision logic for "can this signed-in user manage this
 * restaurant?" — see docs/RESTAURANT-OWNER-WORKSPACE.md.
 *
 * This mirrors app/restaurants/[id]/edit/page.tsx's existing access
 * gate exactly (extracted, not redesigned — Task G) so it can be unit
 * tested without a browser or Firebase. It is a UI-convenience mirror
 * of the real security boundary, not the boundary itself — the actual
 * enforcement is the restaurants/{restaurantId} update rule in
 * firestore.rules. Nothing here should ever be treated as
 * authoritative for whether a write will succeed.
 *
 * The authoritative ownership fact is exactly one comparison:
 * `restaurant.ownerUid === signed-in user's uid`. `ownerClaimStatus`
 * and `claimantUid` are workflow state from docs/RESTAURANT-CLAIM-WORKFLOW.md,
 * not authorization — this function deliberately takes no claim-status
 * parameter at all, because management access never depends on one.
 */
export type ManagementAccessReason =
  | "admin"
  | "owner"
  | "owner_but_blocked"
  | "unclaimed"
  | "not_owner";

export function deriveManagementAccess(params: {
  isAdmin: boolean;
  restaurantOwnerUid?: string;
  viewerUid?: string;
  status?: string;
}): { canManage: boolean; reason: ManagementAccessReason } {
  const { isAdmin, restaurantOwnerUid, viewerUid, status } = params;

  if (isAdmin) return { canManage: true, reason: "admin" };

  const isOwner = Boolean(restaurantOwnerUid) && restaurantOwnerUid === viewerUid;

  if (isOwner && status === "blocked") {
    return { canManage: false, reason: "owner_but_blocked" };
  }
  if (isOwner) return { canManage: true, reason: "owner" };

  return { canManage: false, reason: restaurantOwnerUid ? "not_owner" : "unclaimed" };
}
