/**
 * ONE-TIME MANUAL SCRIPT. Not run by this session, not run in CI,
 * not part of the deployed app. Do not run this against a project
 * you don't control, and never commit the service account key it
 * needs.
 *
 * Why this exists: functions/index.js's setAdminClaim() can only be
 * called BY an existing admin, by design — that's what makes it
 * safe. But that means it cannot grant the very first admin; nobody
 * has the claim yet to call it with. This script is the one
 * legitimate way to break that circularity: run locally, once, with
 * a Firebase service account key, to grant the first admin(s)
 * directly via the Admin SDK. After that, use the setAdminClaim
 * callable (or the Firebase console) for every admin added later.
 *
 * Usage (run locally by the site owner, not by this session):
 *   1. Firebase console → Project settings → Service accounts →
 *      Generate new private key. Save it somewhere outside this repo.
 *   2. GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json \
 *      node functions/scripts/bootstrapFirstAdmin.js <uid>
 *   3. Confirm in the Firebase console (Authentication → user →
 *      custom claims, or by calling admin.auth().getUser(uid)) that
 *      customClaims.admin === true.
 *   4. Delete the local copy of the service account key when done,
 *      or store it somewhere access-controlled if you'll need it
 *      again — never inside this repository.
 */

const { initializeApp, applicationDefault } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

const targetUid = process.argv[2];

if (!targetUid) {
  console.error("Usage: node bootstrapFirstAdmin.js <uid>");
  process.exit(1);
}

initializeApp({ credential: applicationDefault() });

getAuth()
  .getUser(targetUid)
  .then(async (user) => {
    await getAuth().setCustomUserClaims(targetUid, {
      ...(user.customClaims || {}),
      admin: true,
    });
    console.log(`Granted admin claim to uid ${targetUid} (${user.email || "no email"}).`);
  })
  .catch((error) => {
    console.error("Failed to grant admin claim:", error);
    process.exit(1);
  });
