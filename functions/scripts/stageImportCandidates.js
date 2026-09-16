/**
 * SAFE STAGE SCRIPT — writes restaurant import candidates into the
 * `restaurant_import_candidates` Firestore collection for human
 * review. Does NOT create anything in the public `restaurants`
 * collection — that only ever happens via
 * applyApprovedImportBatch.js, and only for candidates a human has
 * separately marked APPROVED. See
 * docs/RESTAURANT-IMPORT-PIPELINE.md.
 *
 * NOT RUN IN THIS SESSION. Not run in CI, not part of the deployed
 * app. Requires a Firebase service account key you provide yourself —
 * this repository has never had one and does not need one for
 * anything in this task.
 *
 * Safety properties (same model as bootstrapFirstAdmin.js /
 * backfillRestaurantOwners.js):
 *   - Defaults to a DRY RUN. Prints exactly what WOULD be staged, but
 *     writes nothing unless you pass --apply.
 *   - Requires --env <production|staging>, exactly one of those two
 *     values. If it's missing or anything else, the script REFUSES TO
 *     RUN AT ALL (not just refuses to write) — an unclear target
 *     environment is treated as a hard stop, not a warning.
 *   - Requires --project <firebase-project-id>, and cross-checks it
 *     against the project actually resolved from your credentials
 *     (GOOGLE_APPLICATION_CREDENTIALS). A mismatch is a hard error —
 *     this catches "I meant to point this at staging but my
 *     credentials are for production" before anything is written.
 *   - --env production additionally requires --confirm-production
 *     alongside --apply — --apply alone is not enough to write to
 *     production. This is the "additional explicit flag/confirmation"
 *     production requires beyond the standard --apply.
 *   - Reads candidates from a local dry-run report (the output of
 *     functions/scripts/importRestaurantsDryRun.js) — only rows with
 *     recommendedAction "would_create" or "human_review" are staged
 *     ("skip" rows, including exact duplicates and failed validation,
 *     are never staged at all).
 *   - Every staged candidate starts status "PENDING_REVIEW" — this
 *     script never sets APPROVED itself; that's a human decision made
 *     afterwards in the admin review UI.
 *   - Never accepts or embeds a credential — auth comes only from
 *     GOOGLE_APPLICATION_CREDENTIALS.
 *
 * Usage:
 *   1. Produce a dry-run report first:
 *      node functions/scripts/importRestaurantsDryRun.js \
 *        --candidates ./my-candidates.json --existing ./my-existing-export.json \
 *        --out ./dry-run-report.json
 *   2. Review the report by hand.
 *   3. Dry-run the staging step (no writes):
 *      GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json \
 *        node functions/scripts/stageImportCandidates.js \
 *        --report ./dry-run-report.json --project <firebase-project-id> \
 *        --env staging --batch-id 2026-01-first-pilot
 *   4. Apply for real (staging environment example):
 *      GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json \
 *        node functions/scripts/stageImportCandidates.js \
 *        --report ./dry-run-report.json --project <firebase-project-id> \
 *        --env staging --batch-id 2026-01-first-pilot --apply
 *   5. For production, --apply alone is refused — also pass
 *      --confirm-production.
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
        `Got: ${args.env === undefined ? "(missing)" : JSON.stringify(args.env)}. ` +
        "An unclear target environment is a hard stop, not a warning — see this script's own header."
    );
  }

  if (!args.project) {
    refuse("--project <firebase-project-id> is required.");
  }

  if (!args.report) {
    refuse("--report <path-to-dry-run-report.json> is required.");
  }

  if (!args["batch-id"]) {
    refuse("--batch-id <identifier> is required — groups these candidates for later review/rollback understanding.");
  }

  if (args.env === "production" && args.apply && !args.confirmProduction) {
    refuse(
      "Writing to the production environment requires BOTH --apply AND --confirm-production. " +
        "This is deliberate — --apply alone is not enough for production."
    );
  }

  const reportPath = path.resolve(process.cwd(), args.report);
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));

  const candidateRowsById = new Map();
  // The dry-run report doesn't carry the full original candidate
  // object (only validation/classification results keyed by
  // batchRowId) — the operator must also point at the original
  // --candidates file so this script can pull the actual field
  // values to stage.
  if (!args.candidates) {
    refuse("--candidates <path-to-original-candidates.json> is required (the file the dry-run report was generated from).");
  }
  const candidatesPath = path.resolve(process.cwd(), args.candidates);
  const originalCandidates = JSON.parse(fs.readFileSync(candidatesPath, "utf8"));
  for (const c of originalCandidates) candidateRowsById.set(c.batchRowId, c);

  const toStage = report.rows.filter(
    (row) => row.recommendedAction === "would_create" || row.recommendedAction === "human_review"
  );

  const app = initializeApp({ credential: applicationDefault() });
  const resolvedProjectId =
    app.options.projectId || process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || null;

  console.log(`Requested project: ${args.project}`);
  console.log(`Resolved project (from credentials): ${resolvedProjectId || "(unable to resolve)"}`);
  console.log(`Target environment: ${args.env}`);
  console.log(`Mode: ${args.apply ? "APPLY (will write)" : "DRY RUN (no writes)"}`);
  console.log(`Batch id: ${args["batch-id"]}`);
  console.log(`Candidates eligible to stage: ${toStage.length} of ${report.rows.length} report rows`);
  console.log(
    `(${report.rows.length - toStage.length} row(s) with recommendedAction "skip" are never staged.)\n`
  );

  if (resolvedProjectId && resolvedProjectId !== args.project) {
    refuse(
      `--project "${args.project}" does not match the project resolved from your credentials ` +
        `("${resolvedProjectId}"). Refusing to run — this is exactly the "wrong project" mistake ` +
        "this check exists to catch."
    );
  }

  if (!args.apply) {
    console.log("Dry run only — no changes made. Rows that would be staged:");
    for (const row of toStage) {
      console.log(`  ${row.batchRowId} — ${row.candidateName} (${row.recommendedAction})`);
    }
    console.log("\nRe-run with --apply (and --confirm-production if targeting production) to actually write.");
    return;
  }

  const db = getFirestore(app);
  const collection = db.collection("restaurant_import_candidates");
  const now = new Date();
  let written = 0;

  for (const row of toStage) {
    const candidate = candidateRowsById.get(row.batchRowId);
    if (!candidate) {
      console.warn(`Skipping ${row.batchRowId}: not found in --candidates file.`);
      continue;
    }

    await collection.add({
      batchId: args["batch-id"],
      status: "PENDING_REVIEW",
      name: candidate.name,
      citySlug: candidate.citySlug,
      addressLine1: candidate.addressLine1,
      postcode: candidate.postcode,
      phone: candidate.phone || null,
      website: candidate.website || null,
      cuisineSlugs: row.cuisineClassificationStatus === "classified" ? candidate.cuisineSlugs || [] : [],
      cuisineClassificationStatus: row.cuisineClassificationStatus,
      dietaryAttributes: row.acceptedDietaryAttributes,
      dietaryDeclarationBasis: candidate.dietaryDeclarationBasis || null,
      sourceType: candidate.sourceType,
      sourceName: candidate.sourceName,
      sourceUrl: candidate.sourceUrl || null,
      sourceRetrievedAt: candidate.sourceRetrievedAt || now.toISOString(),
      lastVerifiedAt: now.toISOString(),
      dataConfidence: "unverified",
      duplicateClassification: row.duplicateCheck.classification,
      duplicateSignals: row.duplicateCheck.signals,
      createdAt: now,
      updatedAt: now,
    });
    written += 1;
  }

  console.log(`\nStaged ${written} candidate(s) into restaurant_import_candidates (project: ${args.project}, env: ${args.env}).`);
  console.log("All start as PENDING_REVIEW — a human reviewer must approve/reject/etc. in the admin UI.");
}

main().catch((error) => {
  console.error("stageImportCandidates failed:", error);
  process.exit(1);
});
