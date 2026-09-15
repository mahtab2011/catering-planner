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
 * a Firebase service account key, to grant the first admin directly
 * via the Admin SDK. After that, use the setAdminClaim callable (or
 * the Firebase console) for every admin added later.
 *
 * Safety properties:
 *   - Defaults to a DRY RUN. It looks up the target user and the
 *     resolved Firebase project and prints exactly what it WOULD do,
 *     but writes nothing unless you pass --apply.
 *   - Always prints which Firebase project it resolved to (from the
 *     service account key / GOOGLE_CLOUD_PROJECT) before doing
 *     anything else — so pointing this at the wrong project by
 *     accident is visible immediately, in both dry-run and apply mode.
 *   - Takes exactly ONE target (a uid or an email) and refuses to run
 *     if given more than one argument, so it can't be mistaken for a
 *     batch tool and accidentally grant admin to multiple users.
 *   - Never accepts or embeds a credential — auth comes only from
 *     GOOGLE_APPLICATION_CREDENTIALS, an environment variable pointing
 *     at a key file outside this repo.
 *
 * Usage:
 *   1. Firebase console → Project settings → Service accounts →
 *      Generate new private key. Save it somewhere outside this repo.
 *   2. Dry run first (no writes):
 *      GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json \
 *        node functions/scripts/bootstrapFirstAdmin.js <uid-or-email>
 *   3. Check the printed project id and user match what you expect.
 *   4. Apply for real:
 *      GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json \
 *        node functions/scripts/bootstrapFirstAdmin.js <uid-or-email> --apply
 *   5. Confirm in the Firebase console (Authentication → user →
 *      custom claims) that customClaims.admin === true.
 *   6. Delete the local copy of the service account key when done,
 *      or store it somewhere access-controlled if you'll need it
 *      again — never inside this repository.
 */

const { initializeApp, applicationDefault } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

const rawArgs = process.argv.slice(2);
const applyFlagIndex = rawArgs.indexOf("--apply");
const apply = applyFlagIndex !== -1;
const positionalArgs = rawArgs.filter((_, i) => i !== applyFlagIndex);

if (positionalArgs.length !== 1) {
  console.error(
    "Usage: node bootstrapFirstAdmin.js <uid-or-email> [--apply]\n" +
      "Exactly one target is required (uid or email) — this script deliberately\n" +
      "refuses to process more than one, so it can never be used to bulk-grant\n" +
      "admin. Omit --apply to dry-run (default); pass --apply to actually write."
  );
  process.exit(1);
}

const target = positionalArgs[0];
const isEmail = target.includes("@");

async function main() {
  const app = initializeApp({ credential: applicationDefault() });
  const auth = getAuth(app);

  const projectId =
    app.options.projectId ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT ||
    "(unable to resolve — check GOOGLE_APPLICATION_CREDENTIALS)";

  console.log(`Firebase project: ${projectId}`);
  console.log(`Mode: ${apply ? "APPLY (will write)" : "DRY RUN (no writes)"}`);
  console.log(`Target: ${target} (looking up by ${isEmail ? "email" : "uid"})`);

  const user = isEmail ? await auth.getUserByEmail(target) : await auth.getUser(target);

  console.log(`Found user: uid=${user.uid} email=${user.email || "(no email)"}`);
  console.log(`Current custom claims: ${JSON.stringify(user.customClaims || {})}`);

  if (user.customClaims?.admin === true) {
    console.log("This user already has admin: true. Nothing to do.");
    return;
  }

  if (!apply) {
    console.log(
      "\nDry run only — no changes made. Re-run with --apply on this exact " +
        `target (${target}) once you've confirmed the project and user above ` +
        "are correct."
    );
    return;
  }

  await auth.setCustomUserClaims(user.uid, {
    ...(user.customClaims || {}),
    admin: true,
  });

  console.log(`\nGranted admin claim to uid ${user.uid} (${user.email || "no email"}).`);
}

main().catch((error) => {
  console.error("bootstrapFirstAdmin failed:", error);
  process.exit(1);
});
