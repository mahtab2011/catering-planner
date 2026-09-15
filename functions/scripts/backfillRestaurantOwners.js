/**
 * ADMINISTRATIVE SCRIPT. Not run by this session, not run in CI, not
 * part of the deployed app. Do not run against production without
 * reading this whole header first. Never uses or embeds production
 * credentials — auth comes only from GOOGLE_APPLICATION_CREDENTIALS,
 * a service-account key file outside this repo.
 *
 * WHY THIS EXISTS
 * ----------------
 * Restaurant documents in this app can end up with no owner on file
 * (`ownerUid` missing or ""). Tracing every restaurant-creation path
 * in the codebase found THREE, not one:
 *
 *   A. app/restaurants/new — sets ownerUid directly from the signed-in
 *      creator. Always correct, never needs backfilling.
 *   B. The admin-approval conversion flows (app/admin/restaurant-signups,
 *      app/restaurants/admin/signups/[id]) — as of this repo's current
 *      state both correctly set ownerUid from the restaurant_signups
 *      document's id (which IS the applicant's real Firebase Auth uid —
 *      see app/signup/restaurant/page.tsx, which creates that document
 *      with `doc(db, "restaurant_signups", uid)`). Restaurants created
 *      by an OLDER version of that code before this was fixed may still
 *      have ownerUid "" — these are backfillable via signal A below.
 *   C. app/create-account (the generic self-service flow, via
 *      lib/auth.ts's registerUser()) — writes the restaurant document
 *      with `doc(db, "restaurants", uid)`, i.e. the document's OWN id
 *      is the owner's uid, but never sets an `ownerUid` field at all.
 *      These are backfillable via signal B below.
 *
 * SIGNALS USED, IN PRIORITY ORDER
 * --------------------------------
 * Signal A — sourceSignupId: if the restaurant has a `sourceSignupId`
 *   field, look up restaurant_signups/{sourceSignupId}. If that
 *   document exists, its own id equals the real applicant uid (see
 *   above) — propose that as ownerUid, but ONLY if no other restaurant
 *   references the same sourceSignupId (uniqueness) and, where the
 *   signup document itself records a `restaurantId`, it matches this
 *   restaurant's id (consistency).
 *
 * Signal B — self-id: if the restaurant document's own id resolves to
 *   a real Firebase Auth user (auth.getUser(doc.id) succeeds), propose
 *   that as ownerUid. Only used when signal A found nothing, or as a
 *   consistency check against signal A when both are present.
 *
 * If both signals resolve to DIFFERENT uids for the same restaurant,
 * or a proposed uid can't be verified as a real auth user, or a
 * sourceSignupId is shared by more than one restaurant, the record is
 * marked AMBIGUOUS and is never proposed for a write — per the
 * requirement not to guess.
 *
 * SAFETY PROPERTIES
 * ------------------
 *   - Defaults to a DRY RUN: prints the resolved Firebase project and
 *     the full proposed restaurantId -> ownerUid mapping (plus every
 *     skip/ambiguous reason), writes nothing, unless --apply is given.
 *   - Re-reads each restaurant immediately before writing in apply
 *     mode and refuses to write if ownerUid is no longer empty by
 *     then (belt-and-suspenders against a race with a concurrent
 *     claim/edit) — never overwrites an existing non-empty ownerUid.
 *   - Every write is a single-field update (`{ ownerUid }`), nothing
 *     else on the document is touched.
 *   - Produces a summary of changed/skipped/ambiguous counts, and
 *     (optionally) a full JSON report via --report-file=path, written
 *     in BOTH dry-run and apply mode so there's always a record of
 *     what was proposed.
 *
 * USAGE
 * -----
 *   Dry run (default, no writes):
 *     GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json \
 *       node functions/scripts/backfillRestaurantOwners.js
 *
 *   Apply (writes ownerUid only for non-ambiguous, verified matches):
 *     GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json \
 *       node functions/scripts/backfillRestaurantOwners.js --apply
 *
 *   Save a full report alongside either mode:
 *     ... node functions/scripts/backfillRestaurantOwners.js --report-file=backfill-report.json
 */

const fs = require("node:fs");
const { initializeApp, applicationDefault } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const reportFileArg = args.find((a) => a.startsWith("--report-file="));
const reportFile = reportFileArg ? reportFileArg.split("=").slice(1).join("=") : null;

function isEmptyOwnerUid(value) {
  return typeof value !== "string" || value.trim() === "";
}

async function resolveUid(auth, uid) {
  if (!uid) return null;
  try {
    const user = await auth.getUser(uid);
    return user.uid;
  } catch {
    return null;
  }
}

async function main() {
  const app = initializeApp({ credential: applicationDefault() });
  const auth = getAuth(app);
  const db = getFirestore(app);

  const projectId =
    app.options.projectId ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT ||
    "(unable to resolve — check GOOGLE_APPLICATION_CREDENTIALS)";

  console.log(`Firebase project: ${projectId}`);
  console.log(`Mode: ${apply ? "APPLY (will write ownerUid where safe)" : "DRY RUN (no writes)"}`);
  console.log("");

  const restaurantsSnap = await db.collection("restaurants").get();
  const candidates = restaurantsSnap.docs.filter((d) => isEmptyOwnerUid(d.data().ownerUid));

  console.log(
    `Found ${restaurantsSnap.size} restaurant document(s) total, ` +
      `${candidates.length} with missing/empty ownerUid.`
  );
  console.log("");

  // First pass: which sourceSignupId values are referenced by more
  // than one restaurant candidate — those are inherently ambiguous
  // and must not be used as a signal for any of them.
  const sourceSignupIdCounts = new Map();
  for (const d of candidates) {
    const sourceSignupId = d.data().sourceSignupId;
    if (typeof sourceSignupId === "string" && sourceSignupId) {
      sourceSignupIdCounts.set(sourceSignupId, (sourceSignupIdCounts.get(sourceSignupId) || 0) + 1);
    }
  }

  const results = [];

  for (const restaurantDoc of candidates) {
    const data = restaurantDoc.data();
    const restaurantId = restaurantDoc.id;
    const name = typeof data.name === "string" && data.name ? data.name : data.businessName || "(unnamed)";

    const entry = {
      restaurantId,
      name,
      currentOwnerUid: data.ownerUid ?? null,
      sourceSignupId: data.sourceSignupId ?? null,
      signalAUid: null,
      signalBUid: null,
      decision: null,
      reason: null,
      proposedOwnerUid: null,
    };

    // Signal A: sourceSignupId
    if (typeof data.sourceSignupId === "string" && data.sourceSignupId) {
      const sharedByMultiple = (sourceSignupIdCounts.get(data.sourceSignupId) || 0) > 1;
      if (sharedByMultiple) {
        entry.decision = "AMBIGUOUS";
        entry.reason = `sourceSignupId "${data.sourceSignupId}" is referenced by more than one restaurant with a missing owner.`;
      } else {
        const signupSnap = await db.collection("restaurant_signups").doc(data.sourceSignupId).get();
        if (signupSnap.exists) {
          const signupData = signupSnap.data();
          const signupUid = signupSnap.id; // doc id IS the applicant's uid, see header
          const consistentRestaurantId =
            !signupData.restaurantId || signupData.restaurantId === restaurantId;

          if (!consistentRestaurantId) {
            entry.decision = "AMBIGUOUS";
            entry.reason = `restaurant_signups/${data.sourceSignupId}.restaurantId ("${signupData.restaurantId}") does not match this restaurant's id ("${restaurantId}").`;
          } else {
            const verifiedUid = await resolveUid(auth, signupUid);
            if (verifiedUid) {
              entry.signalAUid = verifiedUid;
            } else {
              entry.reason = `sourceSignupId "${data.sourceSignupId}" does not correspond to a real Firebase Auth user (auth.getUser failed).`;
            }
          }
        } else {
          entry.reason = `sourceSignupId "${data.sourceSignupId}" does not point to an existing restaurant_signups document.`;
        }
      }
    }

    // Signal B: the restaurant document's own id as a uid (the
    // app/create-account self-service path). Skip the lookup entirely
    // if signal A already produced an AMBIGUOUS verdict above.
    if (entry.decision !== "AMBIGUOUS") {
      entry.signalBUid = await resolveUid(auth, restaurantId);
    }

    // Combine signals.
    if (entry.decision !== "AMBIGUOUS") {
      if (entry.signalAUid && entry.signalBUid && entry.signalAUid !== entry.signalBUid) {
        entry.decision = "AMBIGUOUS";
        entry.reason = `Signal A (sourceSignupId -> ${entry.signalAUid}) and signal B (document id -> ${entry.signalBUid}) disagree.`;
      } else if (entry.signalAUid) {
        entry.decision = "WOULD_ASSIGN";
        entry.proposedOwnerUid = entry.signalAUid;
        entry.reason = "sourceSignupId resolved to a verified, uniquely-referenced applicant uid.";
      } else if (entry.signalBUid) {
        entry.decision = "WOULD_ASSIGN";
        entry.proposedOwnerUid = entry.signalBUid;
        entry.reason = "Restaurant document id resolved to a verified Firebase Auth user (self-service creation path).";
      } else {
        entry.decision = "SKIPPED_NO_SIGNAL";
        entry.reason = entry.reason || "No sourceSignupId, and the document id is not a real Firebase Auth user.";
      }
    }

    results.push(entry);
  }

  const wouldAssign = results.filter((r) => r.decision === "WOULD_ASSIGN");
  const ambiguous = results.filter((r) => r.decision === "AMBIGUOUS");
  const noSignal = results.filter((r) => r.decision === "SKIPPED_NO_SIGNAL");

  console.log("--- Proposed mapping (restaurantId -> ownerUid) ---");
  for (const r of wouldAssign) {
    console.log(`  ${r.restaurantId} ("${r.name}") -> ${r.proposedOwnerUid}  [${r.reason}]`);
  }
  console.log("");
  console.log("--- Ambiguous (will NOT be written, needs manual review) ---");
  for (const r of ambiguous) {
    console.log(`  ${r.restaurantId} ("${r.name}"): ${r.reason}`);
  }
  console.log("");
  console.log("--- No trustworthy signal found (skipped) ---");
  for (const r of noSignal) {
    console.log(`  ${r.restaurantId} ("${r.name}"): ${r.reason}`);
  }
  console.log("");
  console.log("--- Summary ---");
  console.log(`  Candidates examined:      ${candidates.length}`);
  console.log(`  Would assign ownerUid:    ${wouldAssign.length}`);
  console.log(`  Ambiguous (manual review):${" ".repeat(0)} ${ambiguous.length}`);
  console.log(`  Skipped (no signal):      ${noSignal.length}`);

  if (reportFile) {
    fs.writeFileSync(
      reportFile,
      JSON.stringify(
        {
          projectId,
          mode: apply ? "apply" : "dry-run",
          generatedAt: new Date().toISOString(),
          totalRestaurants: restaurantsSnap.size,
          candidatesExamined: candidates.length,
          results,
        },
        null,
        2
      )
    );
    console.log(`\nFull report written to ${reportFile}`);
  }

  if (!apply) {
    console.log(
      "\nDry run only — no changes made. Review the mapping above (and the " +
        "ambiguous/no-signal lists) before re-running with --apply."
    );
    return;
  }

  console.log("\nApplying changes...");
  let written = 0;
  let skippedRace = 0;

  for (const r of wouldAssign) {
    // Re-read immediately before writing: refuse if the document no
    // longer has an empty ownerUid (someone else claimed it, or it
    // was edited, since the dry-run pass above ran).
    const freshSnap = await db.collection("restaurants").doc(r.restaurantId).get();
    if (!freshSnap.exists) {
      console.log(`  SKIP ${r.restaurantId}: document no longer exists.`);
      skippedRace += 1;
      continue;
    }
    if (!isEmptyOwnerUid(freshSnap.data().ownerUid)) {
      console.log(
        `  SKIP ${r.restaurantId}: ownerUid is no longer empty ` +
          `(now "${freshSnap.data().ownerUid}") — not overwriting.`
      );
      skippedRace += 1;
      continue;
    }

    await freshSnap.ref.update({ ownerUid: r.proposedOwnerUid });
    console.log(`  WROTE ${r.restaurantId} -> ownerUid = ${r.proposedOwnerUid}`);
    written += 1;
  }

  console.log(`\nDone. Wrote ${written} restaurant(s). Skipped ${skippedRace} due to a race/precondition failure.`);
}

main().catch((error) => {
  console.error("backfillRestaurantOwners failed:", error);
  process.exit(1);
});
