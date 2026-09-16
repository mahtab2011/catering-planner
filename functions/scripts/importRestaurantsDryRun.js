#!/usr/bin/env node
/**
 * Restaurant import — DRY RUN ONLY. Standalone CLI, no Firebase
 * Admin SDK, no network calls, no credentials. See
 * docs/RESTAURANT-IMPORT-PIPELINE.md for the full design.
 *
 * This script NEVER connects to Firestore (production or otherwise)
 * and NEVER writes anywhere except the report file you point it at
 * with --out. It reads two local JSON files you supply:
 *
 *   --candidates <path>   Array of ImportCandidate rows (see
 *                         lib/import/types.ts for the shape) — the
 *                         restaurants you're considering importing.
 *   --existing <path>     Array of ExistingRestaurantForDedupe rows
 *                         (id, name, postcode?, addressLine1?,
 *                         phone?, website?) — a MANUALLY-PRODUCED
 *                         local export of restaurants already in the
 *                         directory, used only to check for
 *                         duplicates. This is never fetched live by
 *                         this script; producing it (e.g. via the
 *                         Firebase console's export, or an admin
 *                         manually copying the restaurants list) is a
 *                         separate, human step outside this script.
 *
 * Usage:
 *   node functions/scripts/importRestaurantsDryRun.js \
 *     --candidates ./my-candidates.json \
 *     --existing ./my-existing-export.json \
 *     [--out ./import-dry-run-report.json]
 *
 * Output: a JSON report (printed to stdout, and written to --out if
 * given) listing, for every candidate: validation errors (if any),
 * duplicate-detection classification and which signals matched, and
 * a recommendedAction (would_create / skip / human_review). Nothing
 * is ever imported, created, or written to any database by this
 * script — "would_create" is a recommendation for a human to act on
 * in a SEPARATE, deliberate step that does not exist yet (see the
 * pipeline doc's "What this pipeline does NOT do yet" section).
 *
 * This is a standalone port of the logic in lib/import/*.ts (which is
 * the canonical, type-checked implementation used by the app and its
 * test suite) — written this way so it runs with zero build step and
 * zero dependencies beyond Node itself, and so its behavior is fully
 * readable in one file without trusting a bundler. If the rules in
 * lib/import/duplicateDetection.ts or validateCandidate.ts change,
 * this file must be updated to match — see
 * docs/RESTAURANT-IMPORT-PIPELINE.md for the "keep these in sync"
 * note.
 */

const fs = require("fs");
const path = require("path");

const VALID_SOURCE_TYPES = new Set([
  "restaurant_submitted",
  "owner_claimed",
  "open_data",
  "licensed_provider",
  "official_public_source",
  "editorial_research",
]);

const UK_POSTCODE_PATTERN = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

// Kept intentionally small and hardcoded rather than importing
// lib/cities.ts / lib/cuisines.ts (which would require a TypeScript
// build step this standalone script deliberately has none of). If
// either registry changes, update these lists to match — see the
// "keep in sync" note above.
const KNOWN_CITY_SLUGS = new Set(["london"]);
const KNOWN_CUISINE_SLUGS_HINT =
  "Check lib/cuisines.ts for the current list — this script does not duplicate it. cuisineSlugs are not validated against the full registry here, only checked for presence.";

function normalizeName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/\b(the|ltd|limited|restaurant|takeaway|cafe|café)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizePostcode(postcode) {
  return String(postcode || "").toUpperCase().replace(/\s+/g, "");
}

function normalizeAddress(address) {
  return String(address || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function normalizePhone(phone) {
  return String(phone || "").replace(/[^\d+]/g, "");
}

function domainOf(url) {
  if (!url) return null;
  try {
    const withProtocol = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    return new URL(withProtocol).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

function validateCandidate(candidate) {
  const errors = [];
  const name = String(candidate.name || "").trim();
  if (!name) errors.push({ field: "name", message: "Name is required." });

  const citySlug = String(candidate.citySlug || "").trim();
  if (!citySlug) {
    errors.push({ field: "citySlug", message: "citySlug is required." });
  } else if (!KNOWN_CITY_SLUGS.has(citySlug)) {
    errors.push({
      field: "citySlug",
      message: `citySlug "${citySlug}" is not a known active city (see lib/cities.ts).`,
    });
  }

  const addressLine1 = String(candidate.addressLine1 || "").trim();
  if (!addressLine1) errors.push({ field: "addressLine1", message: "addressLine1 is required." });

  const postcode = String(candidate.postcode || "").trim();
  if (!postcode) {
    errors.push({ field: "postcode", message: "postcode is required." });
  } else if (!UK_POSTCODE_PATTERN.test(postcode)) {
    errors.push({ field: "postcode", message: `"${postcode}" doesn't look like a UK postcode.` });
  }

  const cuisineSlugs = candidate.cuisineSlugs || [];
  if (!Array.isArray(cuisineSlugs) || cuisineSlugs.length === 0) {
    errors.push({
      field: "cuisineSlugs",
      message: `At least one cuisineSlugs entry is required. ${KNOWN_CUISINE_SLUGS_HINT}`,
    });
  }

  if (!candidate.sourceType) {
    errors.push({ field: "sourceType", message: "sourceType is required." });
  } else if (!VALID_SOURCE_TYPES.has(candidate.sourceType)) {
    errors.push({ field: "sourceType", message: `"${candidate.sourceType}" is not a recognised sourceType.` });
  }

  if (!candidate.sourceName || !String(candidate.sourceName).trim()) {
    errors.push({ field: "sourceName", message: "sourceName is required." });
  }

  const sourceTypesWithoutUrl = new Set(["restaurant_submitted", "owner_claimed", "editorial_research"]);
  if (
    candidate.sourceType &&
    !sourceTypesWithoutUrl.has(candidate.sourceType) &&
    (!candidate.sourceUrl || !String(candidate.sourceUrl).trim())
  ) {
    errors.push({ field: "sourceUrl", message: `sourceUrl is required when sourceType is "${candidate.sourceType}".` });
  }

  return { batchRowId: candidate.batchRowId, isValid: errors.length === 0, errors };
}

function classifyDuplicate(candidate, existing) {
  const name = String(candidate.name || "").trim();
  const postcode = String(candidate.postcode || "").trim();
  const phone = String(candidate.phone || "").trim();
  const website = String(candidate.website || "").trim();
  const address = String(candidate.addressLine1 || "").trim();

  const hasIdentifyingSignal = Boolean(postcode || phone || website);
  if (!name || !hasIdentifyingSignal) {
    return { batchRowId: candidate.batchRowId, classification: "requires_review", signals: [] };
  }

  const normalizedCandidateName = normalizeName(name);
  const normalizedCandidatePostcode = postcode ? normalizePostcode(postcode) : null;
  const normalizedCandidateAddress = address ? normalizeAddress(address) : null;
  const normalizedCandidatePhone = phone ? normalizePhone(phone) : null;
  const candidateDomain = website ? domainOf(website) : null;

  const signals = [];

  for (const record of existing) {
    const nameMatches =
      normalizedCandidateName.length > 0 && normalizedCandidateName === normalizeName(record.name);

    const recordPostcodeNorm = record.postcode ? normalizePostcode(record.postcode) : null;
    const postcodeMatches =
      normalizedCandidatePostcode !== null &&
      recordPostcodeNorm !== null &&
      normalizedCandidatePostcode === recordPostcodeNorm;

    const recordAddressNorm = record.addressLine1 ? normalizeAddress(record.addressLine1) : null;
    const addressMatches =
      normalizedCandidateAddress !== null &&
      recordAddressNorm !== null &&
      normalizedCandidateAddress === recordAddressNorm;

    const recordPhoneNorm = record.phone ? normalizePhone(record.phone) : null;
    const phoneMatches =
      normalizedCandidatePhone !== null &&
      recordPhoneNorm !== null &&
      normalizedCandidatePhone.length >= 8 &&
      normalizedCandidatePhone === recordPhoneNorm;

    const recordDomain = record.website ? domainOf(record.website) : null;
    const websiteDomainMatches = candidateDomain !== null && recordDomain !== null && candidateDomain === recordDomain;

    if (nameMatches) signals.push({ signal: "normalized_name", matchedExistingId: record.id });
    if (postcodeMatches) signals.push({ signal: "postcode", matchedExistingId: record.id });
    if (addressMatches) signals.push({ signal: "address", matchedExistingId: record.id });
    if (phoneMatches) signals.push({ signal: "phone", matchedExistingId: record.id });
    if (websiteDomainMatches) signals.push({ signal: "website_domain", matchedExistingId: record.id });
  }

  return { batchRowId: candidate.batchRowId, classification: classifyFromSignals(signals), signals };
}

function classifyFromSignals(signals) {
  if (signals.length === 0) return "new";

  const byExistingId = new Map();
  for (const s of signals) {
    if (!byExistingId.has(s.matchedExistingId)) byExistingId.set(s.matchedExistingId, new Set());
    byExistingId.get(s.matchedExistingId).add(s.signal);
  }

  for (const signalSet of byExistingId.values()) {
    if (signalSet.has("phone") || signalSet.has("website_domain")) return "match";
    if (signalSet.has("normalized_name") && (signalSet.has("postcode") || signalSet.has("address"))) return "match";
  }

  return "possible_match";
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      const value = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : true;
      args[key] = value;
      if (value !== true) i += 1;
    }
  }
  return args;
}

function readJsonArray(filePath, label) {
  if (!filePath) {
    throw new Error(`Missing required --${label} <path> argument.`);
  }
  const resolved = path.resolve(process.cwd(), filePath);
  const raw = fs.readFileSync(resolved, "utf8");
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) {
    throw new Error(`${label} file must contain a JSON array. Got: ${typeof data}`);
  }
  return data;
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  let candidates, existing;
  try {
    candidates = readJsonArray(args.candidates, "candidates");
    existing = args.existing ? readJsonArray(args.existing, "existing") : [];
  } catch (err) {
    console.error(`Failed to read input files: ${err.message}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `Dry run only. This will NOT write anything anywhere. Checking ${candidates.length} candidate(s) against ${existing.length} existing record(s)...\n`
  );

  const rows = candidates.map((candidate) => {
    const validation = validateCandidate(candidate);
    const duplicateCheck = classifyDuplicate(candidate, existing);

    let recommendedAction;
    if (!validation.isValid) {
      recommendedAction = "skip";
    } else if (duplicateCheck.classification === "match") {
      recommendedAction = "skip";
    } else if (duplicateCheck.classification === "possible_match" || duplicateCheck.classification === "requires_review") {
      recommendedAction = "human_review";
    } else {
      recommendedAction = "would_create";
    }

    return {
      batchRowId: candidate.batchRowId,
      candidateName: candidate.name || "(no name)",
      validation,
      duplicateCheck,
      recommendedAction,
    };
  });

  const summary = {
    total: rows.length,
    wouldCreate: rows.filter((r) => r.recommendedAction === "would_create").length,
    skip: rows.filter((r) => r.recommendedAction === "skip").length,
    humanReview: rows.filter((r) => r.recommendedAction === "human_review").length,
  };

  console.log("Summary:", summary);
  console.log(
    "\n'would_create' is a RECOMMENDATION only — nothing has been created. Actually importing a row requires a separate, deliberate write step that does not exist in this repository yet (see docs/RESTAURANT-IMPORT-PIPELINE.md).\n"
  );

  const report = { generatedAt: new Date().toISOString(), summary, rows };

  if (args.out) {
    const outPath = path.resolve(process.cwd(), args.out);
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");
    console.log(`Full report written to ${outPath}`);
  } else {
    console.log(JSON.stringify(report, null, 2));
  }
}

main();
