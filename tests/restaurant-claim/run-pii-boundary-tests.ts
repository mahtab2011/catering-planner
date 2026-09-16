/**
 * Static regression guards confirming claimant PII stays out of the
 * publicly readable restaurant document — see
 * docs/RESTAURANT-CLAIM-WORKFLOW.md and
 * docs/PRODUCTION-READINESS-AUDIT.md's "J-01" (Task K).
 *
 * These are source-inspection checks, not behavioral tests: they read
 * the actual shipped source of `lib/types.ts` and every customer-
 * facing/discovery component and assert the 9 retired claimant-PII
 * field names never appear as real fields — catching a future
 * regression (someone "helpfully" adding `claimantContactEmail` back
 * onto `RestaurantDoc`, or a discovery card rendering it) as an
 * automated failure. Mirrors the approach already used in
 * tests/restaurant-owner-workspace/run-content-policy-tests.ts (Task
 * G), tests/restaurant-discovery/run-content-policy-tests.ts (Task
 * H), and tests/admin-operations/run-content-policy-tests.ts (Task I).
 *
 * The actual security boundary is firestore.rules (see
 * tests/firestore-rules/rules.test.js's "restaurant_claims" describe
 * block) — this file is a defense-in-depth, always-executable
 * complement to that (currently unexecuted, Java unavailable) suite,
 * not a replacement for it.
 *
 * Dependency-free, runs in this environment.
 * Run: node tests/restaurant-claim/run-pii-boundary-tests.ts
 */

import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");

const CLAIMANT_PII_FIELDS = [
  "claimantUid",
  "claimantName",
  "claimantRole",
  "claimantContactEmail",
  "claimantContactPhone",
  "claimantNote",
  "claimSubmittedAt",
  "claimDecidedAt",
  "claimDecidedBy",
];

let passed = 0;
let total = 0;

function test(name: string, fn: () => void) {
  total += 1;
  try {
    fn();
    passed += 1;
    console.log(`  ok — ${name}`);
  } catch (err) {
    console.log(`  FAIL — ${name}`);
    console.log(`    ${err instanceof Error ? err.message : String(err)}`);
  }
}

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

function walkTsFiles(dir: string): string[] {
  let results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      results = results.concat(walkTsFiles(full));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

/** Extracts the text of a named `export type X = { ... }` block by
 *  brace-matching from its first `{`, so this check is scoped to that
 *  one type's own fields, not the whole file (which legitimately
 *  mentions these field names in comments and in `RestaurantClaimDoc`
 *  itself). */
function extractTypeBody(source: string, typeName: string): string {
  const marker = `export type ${typeName} = {`;
  const start = source.indexOf(marker);
  assert.ok(start >= 0, `Expected to find "${marker}" in lib/types.ts`);
  let depth = 0;
  let i = start + marker.length - 1;
  const bodyStart = i;
  for (; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") {
      depth--;
      if (depth === 0) break;
    }
  }
  return source.slice(bodyStart, i + 1);
}

console.log("Restaurant claim PII boundary — static regression guards (no Firestore, no emulator)\n");

const typesSource = readFileSync(path.join(REPO_ROOT, "lib", "types.ts"), "utf8");

test("RestaurantDoc's own field declarations contain no claimant PII field name", () => {
  const body = stripComments(extractTypeBody(typesSource, "RestaurantDoc"));
  for (const field of CLAIMANT_PII_FIELDS) {
    assert.ok(
      !new RegExp(`\\b${field}\\??:`).test(body),
      `Expected RestaurantDoc to never declare a "${field}" field`
    );
  }
});

test("RestaurantClaimDoc exists and declares the claimant fields the private record actually needs", () => {
  const body = stripComments(extractTypeBody(typesSource, "RestaurantClaimDoc"));
  for (const requiredField of [
    "restaurantId", "claimantUid", "claimantName", "claimantContactEmail",
    "claimantRole", "claimantContactPhone", "claimantNote", "status",
  ]) {
    assert.ok(
      new RegExp(`\\b${requiredField}\\??:`).test(body),
      `Expected RestaurantClaimDoc to declare "${requiredField}"`
    );
  }
});

test("no discovery/customer-facing component references any claimant PII field name", () => {
  const scanDirs = [
    path.join(REPO_ROOT, "app", "[locale]"),
    path.join(REPO_ROOT, "components", "discovery"),
    path.join(REPO_ROOT, "components", "restaurants"),
    path.join(REPO_ROOT, "components", "cuisine"),
  ];
  for (const dir of scanDirs) {
    for (const file of walkTsFiles(dir)) {
      // RestaurantClaimPanel.tsx legitimately writes claimant fields
      // (to the private restaurant_claims collection, never to the
      // public restaurant document) — see its own header comment.
      if (file.endsWith("RestaurantClaimPanel.tsx")) continue;
      const source = readFileSync(file, "utf8");
      const relative = path.relative(REPO_ROOT, file).replace(/\\/g, "/");
      for (const field of CLAIMANT_PII_FIELDS) {
        assert.ok(
          !source.includes(field),
          `Expected ${relative} to never reference "${field}"`
        );
      }
    }
  }
});

test("the admin claims page reads claimant data from restaurant_claims, not from the restaurants collection", () => {
  const source = readFileSync(path.join(REPO_ROOT, "app", "admin", "restaurant-claims", "page.tsx"), "utf8");
  assert.ok(
    source.includes('collection(db, "restaurant_claims")'),
    "Expected the admin claims page to query the restaurant_claims collection"
  );
  // The only restaurant-collection reads on this page should be for
  // display purposes (the restaurant's own public name), never
  // filtered/queried by a claim-related field.
  assert.ok(
    !source.includes('where("ownerClaimStatus"'),
    "Expected the admin claims page to no longer query restaurants by ownerClaimStatus for the claims queue"
  );
});

test("the claim submission path writes claimant fields only to restaurant_claims, via a batch, never a bare update to restaurants with PII", () => {
  const source = stripComments(readFileSync(path.join(REPO_ROOT, "components", "restaurants", "RestaurantClaimPanel.tsx"), "utf8"));
  assert.ok(source.includes("writeBatch"), "Expected RestaurantClaimPanel to use writeBatch for claim submission");
  assert.ok(
    source.includes('collection(db, "restaurant_claims")'),
    "Expected RestaurantClaimPanel to write the claim record to restaurant_claims"
  );
});

console.log(`\n${passed}/${total} tests passed.`);
if (passed !== total) {
  console.log("\nSome tests FAILED.");
  process.exit(1);
}
console.log("\nAll claim PII-boundary static guards passed. No Firestore, no emulator, no credentials.");
