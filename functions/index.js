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
 * docs/SECURITY-FOLLOWUP.md and functions/scripts/README.md for the
 * exact manual steps required, including the one that must happen
 * BEFORE this deploys: bootstrapping the very first admin (see below
 * — setAdminClaim can't grant the first admin, since it requires an
 * existing admin to call it).
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
  const grantAdmin = data?.admin === true;

  if (!targetUid) {
    throw new functions.https.HttpsError("invalid-argument", "uid is required.");
  }

  const targetUser = await auth.getUser(targetUid);
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
 */
async function recomputeRestaurantRating(restaurantId) {
  if (!restaurantId) return;

  const approvedReviews = await db
    .collection("reviews")
    .where("restaurantId", "==", restaurantId)
    .where("status", "==", "approved")
    .get();

  const ratings = approvedReviews.docs
    .map((d) => d.data().rating)
    .filter((r) => typeof r === "number");

  const reviewCount = ratings.length;
  const rating =
    reviewCount === 0
      ? 0
      : Math.round((ratings.reduce((sum, r) => sum + r, 0) / reviewCount) * 10) / 10;

  const restaurantRef = db.collection("restaurants").doc(restaurantId);
  const restaurantSnap = await restaurantRef.get();

  // Don't create a restaurant document as a side effect of a review
  // write racing a restaurant delete/typo — only update one that
  // actually exists.
  if (!restaurantSnap.exists) return;

  await restaurantRef.update({ rating, reviewCount });
}

/**
 * Fires on every review create/update/delete and keeps the owning
 * restaurant's aggregate in sync. Recomputes from scratch each time
 * (simplest correct approach at this data volume) rather than trying
 * to increment/decrement, which would drift on retries or partial
 * failures.
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
