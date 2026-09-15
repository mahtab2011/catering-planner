/**
 * London Food Hubs — trusted server-side operations.
 *
 * NOT DEPLOYED. This directory is written and version-controlled but
 * has never been run against the live Firebase project (no
 * `firebase deploy --only functions` has been executed). It exists
 * because two pieces of this app's security model cannot be done
 * safely from the client, no matter how the Firestore rules are
 * written:
 *
 *  1. Granting admin authorization. Firestore rules can check a
 *     custom claim (`request.auth.token.admin`), but only the Admin
 *     SDK can set one — see setAdminClaim() below.
 *  2. Maintaining a trusted restaurant rating aggregate. If a client
 *     (even the restaurant owner) could write `restaurants/{id}.rating`
 *     directly, ratings would be self-servable and meaningless — see
 *     recomputeRestaurantRating() below.
 *
 * Before this can be deployed: `firebase deploy --only functions`
 * requires an authenticated `firebase login` and a real project,
 * neither of which this session has. See
 * docs/SECURITY-FOLLOWUP.md and functions/README.md for the exact
 * manual steps required, including the one that must happen BEFORE
 * this deploys: bootstrapping the very first admin (see
 * scripts/bootstrapFirstAdmin.js — setAdminClaim can't grant the
 * first admin, since it requires an existing admin to call it).
 */

const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");
const functions = require("firebase-functions/v1");

initializeApp();

const auth = getAuth();
const db = getFirestore();

/**
 * Callable function: grants or revokes the `admin` custom claim on a
 * target user. Callable ONLY by an existing admin — this is enforced
 * here, not by Firestore rules (custom claims aren't Firestore data).
 *
 * Client call shape:
 *   const grant = httpsCallable(functions, "setAdminClaim");
 *   await grant({ uid: "<target uid>", admin: true });
 */
exports.setAdminClaim = functions.https.onCall(async (data, context) => {
  if (!context.auth || context.auth.token.admin !== true) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only an existing admin can grant or revoke admin access."
    );
  }

  const targetUid = typeof data?.uid === "string" ? data.uid.trim() : "";

  if (!targetUid) {
    throw new functions.https.HttpsError("invalid-argument", "uid is required.");
  }

  // `admin` must be an explicit boolean. Defaulting a missing/malformed
  // value to `false` would silently REVOKE instead of erroring — an
  // easy way for a caller who forgot the `admin` field to accidentally
  // demote someone instead of getting a clear failure.
  if (typeof data?.admin !== "boolean") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "admin must be explicitly true or false."
    );
  }
  const grantAdmin = data.admin;

  // Guard against an admin locking themselves (and everyone else) out
  // by revoking their own claim through this function — self-revocation
  // is a deliberate, rare action that should go through the Firebase
  // console (or another admin), not this callable, so a mistaken or
  // automated call can't strand the project with zero admins.
  if (targetUid === context.auth.uid && grantAdmin === false) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Use the Firebase console to revoke your own admin access, not this function."
    );
  }

  let targetUser;
  try {
    targetUser = await auth.getUser(targetUid);
  } catch (error) {
    throw new functions.https.HttpsError(
      "not-found",
      `No user found for uid ${targetUid}.`,
      error?.message
    );
  }

  const existingClaims = targetUser.customClaims || {};

  await auth.setCustomUserClaims(targetUid, {
    ...existingClaims,
    admin: grantAdmin,
  });

  // Informational mirror only — the Firestore users/{uid}.role field is
  // never treated as an authorization source by the rules; this write
  // (via the Admin SDK, which bypasses Firestore rules) just lets the
  // admin UI display current admin status without a second lookup.
  await db.collection("users").doc(targetUid).set(
    { isAdminClaim: grantAdmin, adminClaimUpdatedAt: new Date() },
    { merge: true }
  );

  return { uid: targetUid, admin: grantAdmin };
});

/**
 * Recomputes a restaurant's rating aggregate from its approved
 * reviews and writes it with the Admin SDK, which is not subject to
 * Firestore rules — this is the only way `restaurants/{id}.rating`
 * and `.reviewCount` are ever set. The rules in firestore.rules
 * explicitly forbid any client (including the restaurant's own
 * owner) from writing those two fields directly.
 *
 * Runs inside a transaction so two review writes landing for the same
 * restaurant in quick succession (e.g. two customers reviewing around
 * the same time, each triggering their own onReviewWrite invocation)
 * can't race a read-then-write and have the slower one overwrite the
 * faster one with a stale count. Firestore retries a transaction
 * automatically if its reads are invalidated by a concurrent write,
 * so this converges correctly rather than merely self-healing on the
 * next unrelated write.
 */
async function recomputeRestaurantRating(restaurantId) {
  if (!restaurantId) return;

  const restaurantRef = db.collection("restaurants").doc(restaurantId);

  await db.runTransaction(async (transaction) => {
    const restaurantSnap = await transaction.get(restaurantRef);

    // Don't create a restaurant document as a side effect of a review
    // write racing a restaurant delete/typo — only update one that
    // actually exists.
    if (!restaurantSnap.exists) return;

    const approvedReviews = await transaction.get(
      db
        .collection("reviews")
        .where("restaurantId", "==", restaurantId)
        .where("status", "==", "approved")
    );

    // Defensive range check: normal app writes are already constrained
    // to 1-5 by firestore.rules, but this aggregate is computed with
    // Admin SDK privileges (which bypass those rules), so a malformed
    // or out-of-range value written by any other trusted process
    // should never be allowed to skew the public-facing average.
    const ratings = approvedReviews.docs
      .map((d) => d.data().rating)
      .filter((r) => typeof r === "number" && r >= 1 && r <= 5);

    const reviewCount = ratings.length;
    const rating =
      reviewCount === 0
        ? 0
        : Math.round((ratings.reduce((sum, r) => sum + r, 0) / reviewCount) * 10) / 10;

    transaction.update(restaurantRef, { rating, reviewCount });
  });
}

/**
 * Fires on every review create/update/delete and keeps the owning
 * restaurant's aggregate in sync. Recomputes from scratch each time
 * (simplest correct approach at this data volume) rather than trying
 * to increment/decrement, which would drift on retries or partial
 * failures.
 *
 * This is a 1st-gen Firestore trigger with no failurePolicy set, so a
 * transient failure is NOT automatically retried by the platform. In
 * practice this is low-risk: because the function always recomputes
 * from the full set of approved reviews rather than incrementing, the
 * very next review write for the same restaurant (approve, edit, or
 * delete) recomputes correctly from scratch regardless of whether an
 * earlier invocation was dropped.
 */
exports.onReviewWrite = functions.firestore
  .document("reviews/{reviewId}")
  .onWrite(async (change) => {
    const before = change.before.exists ? change.before.data() : null;
    const after = change.after.exists ? change.after.data() : null;

    const restaurantIds = new Set();
    if (before?.restaurantId) restaurantIds.add(before.restaurantId);
    if (after?.restaurantId) restaurantIds.add(after.restaurantId);

    await Promise.all([...restaurantIds].map(recomputeRestaurantRating));
  });
