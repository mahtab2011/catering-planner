/**
 * SAFE APPLY SCRIPT — the ONLY place in this codebase that creates a
 * real public `restaurants` document from an imported candidate. See
 * docs/RESTAURANT-IMPORT-PIPELINE.md and
 * docs/RESTAURANT-CLAIM-WORKFLOW.md.
 *
 * NOT RUN IN THIS SESSION. Not run in CI, not part of the deployed
 * app. Requires a Firebase service account key you provide yourself.
 *
 * Safety properties (same model as stageImportCandidates.js /
 * bootstrapFirstAdmin.js):
 *   - Defaults to a DRY RUN. Prints exactly what WOULD be created, but
 *     writes nothing unless you pass --apply.
 *   - Requires --env <production|staging>. Missing or any other value
 *     is a hard stop — REFUSES TO RUN AT ALL, not just to write.
 *   - Requires --project <firebase-project-id>, cross-checked against
 *     the project actually resolved from your credentials. Mismatch
 *     is a hard error.
 *   - --env production additionally requires --confirm-production
 *     alongside --apply.
 *   - Acts ONLY on an explicit, human-produced approved-batch file
 *     (--batch <path>, an ApprovedImportBatch — see
 *     lib/import/types.ts) listing exact candidate ids. It does NOT
 *     query `restaurant_import_candidates` for `status == 'APPROVED'`
 *     itself — that would let a candidate approved after the operator
 *     produced their batch file silently get included in a run they
 *     didn't actually review. Every id in the batch file is still
 *     re-checked against Firestore's live status (see next point) —
 *     the batch file is what to CONSIDER, not a bypass of verifying
 *     each one is still actually APPROVED.
 *   - For every candidate id: re-fetches it live and refuses to act on
 *     it unless its live `status` is still exactly `"APPROVED"` (an
 *     operator may have flipped it back to REJECTED/NEEDS_RESEARCH
 *     between producing the batch file and running this script) AND
 *     its `duplicateClassification` is not `"match"` (defense in
 *     depth — a "match" candidate should never have reached APPROVED
 *     in the first place, but this refuses to create a duplicate
 *     restaurant regardless of how that happened).
 *   - Never updates an existing `restaurants` document. This script
 *     only ever calls `.add()` (create) — never `.update()` on
 *     anything in the `restaurants` collection, so it structurally
 *     cannot overwrite an owner-claimed listing or any other existing
 *     restaurant's content, imported or not.
 *   - Every created restaurant starts `ownerUid: ""`,
 *     `ownerClaimStatus: "unclaimed"` — it is claimable through the
 *     existing claim workflow (docs/RESTAURANT-CLAIM-WORKFLOW.md) like
 *     any other unclaimed listing, never pre-assigned an owner.
 *   - Marks the staging candidate IMPORTED (with `importedRestaurantId`)
 *     in the same transaction as creating the restaurant, so a
 *     candidate can never be double-imported by re-running this script.
 *   - Never accepts or embeds a credential — auth comes only from
 *     GOOGLE_APPLICATION_CREDENTIALS.
 *
 * Usage:
 *   1. In the admin review UI, mark candidates APPROVED.
 *   2. Produce an approved-batch file by hand (or via a small export
 *      step outside this script) — a JSON file shaped like
 *      lib/import/types.ts's ApprovedImportBatch:
 *      { "batchId": "...", "approvedAt": "...", "approvedByUid": "...",
 *        "candidateIds": ["...", "..."] }
 *   3. Dry-run (no writes):
 *      GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json \
 *        node functions/scripts/applyApprovedImportBatch.js \
 *        --batch ./approved-batch.json --project <firebase-project-id> --env staging
 *   4. Apply for real (staging example):
 *      GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json \
 *        node functions/scripts/applyApprovedImportBatch.js \
 *        --batch ./approved-batch.json --project <firebase-project-id> --env staging --apply
 *   5. For production, also pass --confirm-production alongside --apply.
 *   6. After a real apply run, see docs/RESTAURANT-IMPORT-PIPELINE.md's
 *      "Post-import verification" section.
 */

const fs = require("fs");
const path = require("path");
const { initializeApp, applicationDefault } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const VALID_ENVS = new Set(["production", "staging"]);

function parseArgs(argv) {
  const args = { apply: false, confirmProduction: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--apply") {
      args.apply = true;
    } else if (arg === "--confirm-production") {
      args.confirmProduction = true;
    } else if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const value = argv[i + 1];
      args[key] = value;
      i += 1;
    }
  }
  return args;
}

function refuse(message) {
  console.error(`REFUSED: ${message}`);
  process.exit(1);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.env || !VALID_ENVS.has(args.env)) {
    refuse(
      `--env is required and must be exactly one of: ${[...VALID_ENVS].join(", ")}. ` +
        `Got: ${args.env === undefined ? "(missing)" : JSON.stringify(args.env)}.`
    );
  }
  if (!args.project) refuse("--project <firebase-project-id> is required.");
  if (!args.batch) refuse("--batch <path-to-approved-batch.json> is required.");
  if (args.env === "production" && args.apply && !args.confirmProduction) {
    refuse("Writing to production requires BOTH --apply AND --confirm-production.");
  }

  const batchPath = path.resolve(process.cwd(), args.batch);
  const batch = JSON.parse(fs.readFileSync(batchPath, "utf8"));

  if (!Array.isArray(batch.candidateIds) || batch.candidateIds.length === 0) {
    refuse("Approved-batch file has no candidateIds — nothing to do.");
  }

  const app = initializeApp({ credential: applicationDefault() });
  const resolvedProjectId =
    app.options.projectId || process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || null;

  console.log(`Requested project: ${args.project}`);
  console.log(`Resolved project (from credentials): ${resolvedProjectId || "(unable to resolve)"}`);
  console.log(`Target environment: ${args.env}`);
  console.log(`Mode: ${args.apply ? "APPLY (will write)" : "DRY RUN (no writes)"}`);
  console.log(`Approved batch: ${batch.batchId} (${batch.candidateIds.length} candidate id(s)), approved by ${batch.approvedByUid} at ${batch.approvedAt}\n`);

  if (resolvedProjectId && resolvedProjectId !== args.project) {
    refuse(
      `--project "${args.project}" does not match the project resolved from your credentials ` +
        `("${resolvedProjectId}"). Refusing to run.`
    );
  }

  const db = getFirestore(app);
  const candidatesCollection = db.collection("restaurant_import_candidates");
  const restaurantsCollection = db.collection("restaurants");

  let created = 0;
  let skipped = 0;

  for (const candidateId of batch.candidateIds) {
    const snap = await candidatesCollection.doc(candidateId).get();

    if (!snap.exists) {
      console.warn(`SKIP ${candidateId}: no such candidate document.`);
      skipped += 1;
      continue;
    }

    const candidate = snap.data();

    if (candidate.status !== "APPROVED") {
      console.warn(`SKIP ${candidateId}: live status is "${candidate.status}", not "APPROVED" — not re-checking a batch file's word for it.`);
      skipped += 1;
      continue;
    }

    if (candidate.duplicateClassification === "match") {
      console.warn(`SKIP ${candidateId}: duplicateClassification is "match" — refusing to create a duplicate restaurant regardless of approval status.`);
      skipped += 1;
      continue;
    }

    console.log(`${args.apply ? "CREATE" : "WOULD CREATE"}: ${candidateId} — ${candidate.name}`);

    if (!args.apply) {
      continue;
    }

    const now = new Date();
    const restaurantRef = restaurantsCollection.doc();

    await db.runTransaction(async (transaction) => {
      transaction.set(restaurantRef, {
        name: candidate.name,
        slug: "",
        ownerUid: "",
        citySlug: candidate.citySlug,
        addressLine1: candidate.addressLine1 || "",
        postcode: candidate.postcode || "",
        phone: candidate.phone || "",
        website: candidate.website || "",
        cuisineSlugs: candidate.cuisineSlugs || [],
        primaryCuisineSlug: (candidate.cuisineSlugs || [])[0] || "",
        dietaryAttributes: candidate.dietaryAttributes || [],
        sourceType: candidate.sourceType,
        sourceName: candidate.sourceName,
        sourceUrl: candidate.sourceUrl || "",
        sourceRetrievedAt: candidate.sourceRetrievedAt || now.toISOString(),
        lastVerifiedAt: now.toISOString(),
        dataConfidence: candidate.dataConfidence || "unverified",
        ownerClaimStatus: "unclaimed",
        status: "pending",
        isFeatured: false,
        isApproved: false,
        rating: 0,
        reviewCount: 0,
        hubIds: [],
        serviceTypes: [],
        countryCode: "UK",
        createdAt: now,
        updatedAt: now,
      });

      transaction.update(snap.ref, {
        status: "IMPORTED",
        importedRestaurantId: restaurantRef.id,
        importedAt: now,
        updatedAt: now,
      });
    });

    created += 1;
  }

  console.log(
    `\n${args.apply ? "Created" : "Would create"} ${created} restaurant(s); skipped ${skipped}. ` +
      (args.apply
        ? "Every created restaurant is unclaimed and status='pending' — an admin must still review/activate it, same as any other new listing."
        : "Re-run with --apply (and --confirm-production if targeting production) to actually write.")
  );
}

main().catch((error) => {
  console.error("applyApprovedImportBatch failed:", error);
  process.exit(1);
});
