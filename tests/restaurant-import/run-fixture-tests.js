#!/usr/bin/env node
/**
 * Automated tests for the restaurant import dry-run pipeline, run
 * against LOCAL FIXTURES ONLY (tests/fixtures/restaurant-import/,
 * every row unmistakably named "TEST FIXTURE — ..."). Never connects
 * to Firestore, never uses credentials, never touches production.
 *
 * Deliberately dependency-free (no vitest/jest) — uses Node's
 * built-in `assert` and spawns the actual, real, shipped CLI script
 * (functions/scripts/importRestaurantsDryRun.js) as a subprocess and
 * asserts on its JSON output, so this exercises the real code path
 * rather than a reimplementation of it.
 *
 * Run: node tests/restaurant-import/run-fixture-tests.js
 */

const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const SCRIPT = path.join(REPO_ROOT, "functions", "scripts", "importRestaurantsDryRun.js");
const CANDIDATES = path.join(REPO_ROOT, "tests", "fixtures", "restaurant-import", "candidates.json");
const EXISTING = path.join(REPO_ROOT, "tests", "fixtures", "restaurant-import", "existing.json");

function runDryRun() {
  const outPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "lfh-import-test-")), "report.json");
  execFileSync(
    process.execPath,
    [SCRIPT, "--candidates", CANDIDATES, "--existing", EXISTING, "--out", outPath],
    { cwd: REPO_ROOT, stdio: "pipe" }
  );
  const report = JSON.parse(fs.readFileSync(outPath, "utf8"));
  fs.rmSync(path.dirname(outPath), { recursive: true, force: true });
  return report;
}

function rowById(report, batchRowId) {
  const row = report.rows.find((r) => r.batchRowId === batchRowId);
  assert.ok(row, `Expected a row with batchRowId "${batchRowId}"`);
  return row;
}

let passed = 0;
let total = 0;

function test(name, fn) {
  total += 1;
  try {
    fn();
    passed += 1;
    console.log(`  ok — ${name}`);
  } catch (err) {
    console.error(`  FAIL — ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

console.log("Restaurant import dry-run pipeline — fixture tests (no Firestore, no credentials)\n");

const report = runDryRun();

test("exact duplicate (same name/postcode/address/phone/website) is classified match and skipped", () => {
  const row = rowById(report, "fixture-1");
  assert.equal(row.duplicateCheck.classification, "match");
  assert.equal(row.recommendedAction, "skip");
});

test("name-variant duplicate (same postcode+address, different name) is still classified match", () => {
  const row = rowById(report, "fixture-2");
  assert.equal(row.duplicateCheck.classification, "match");
  assert.equal(row.recommendedAction, "skip");
});

test("valid, new, classified candidate with a properly-based dietary claim is recommended for creation", () => {
  const row = rowById(report, "fixture-3");
  assert.equal(row.validation.isValid, true);
  assert.equal(row.duplicateCheck.classification, "new");
  assert.equal(row.cuisineClassificationStatus, "classified");
  assert.deepEqual(row.acceptedDietaryAttributes.sort(), ["vegan", "vegetarian"]);
  assert.equal(row.recommendedAction, "would_create");
});

test("candidate missing a required field (postcode) fails validation and is skipped, even with no identifying signal for dedupe", () => {
  const row = rowById(report, "fixture-4");
  assert.equal(row.validation.isValid, false);
  assert.equal(row.recommendedAction, "skip");
});

test("candidate with no cuisineSlugs at all is 'unknown_requires_review', never guessed, and routed to human review", () => {
  const row = rowById(report, "fixture-5");
  assert.equal(row.cuisineClassificationStatus, "unknown_requires_review");
  assert.deepEqual(row.duplicateCheck.classification, "new");
  assert.equal(row.recommendedAction, "human_review");
});

test("dietary attribute with no declared basis is dropped (not assumed), candidate otherwise still proceeds", () => {
  const row = rowById(report, "fixture-6");
  assert.deepEqual(row.acceptedDietaryAttributes, []);
  assert.ok(row.dietaryErrors.some((e) => e.includes("no declared basis")));
  assert.equal(row.recommendedAction, "would_create");
});

test("dietary attribute claimed as 'platform_verified' at import time is rejected — an import pipeline cannot self-certify", () => {
  const row = rowById(report, "fixture-7");
  assert.deepEqual(row.acceptedDietaryAttributes, []);
  assert.ok(row.dietaryErrors.some((e) => e.includes("platform_verified")));
  assert.equal(row.recommendedAction, "would_create");
});

test("summary counts match the individual row outcomes", () => {
  const wouldCreate = report.rows.filter((r) => r.recommendedAction === "would_create").length;
  const skip = report.rows.filter((r) => r.recommendedAction === "skip").length;
  const humanReview = report.rows.filter((r) => r.recommendedAction === "human_review").length;
  assert.equal(report.summary.wouldCreate, wouldCreate);
  assert.equal(report.summary.skip, skip);
  assert.equal(report.summary.humanReview, humanReview);
  assert.equal(report.summary.total, report.rows.length);
});

console.log(`\n${passed}/${total} tests passed.`);
if (process.exitCode) {
  console.error("\nSome tests FAILED — see above.");
} else {
  console.log("All fixture tests passed. No Firestore connection, no credentials, no production data touched.");
}
