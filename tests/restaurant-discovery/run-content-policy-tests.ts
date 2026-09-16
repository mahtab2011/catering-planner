/**
 * Static regression guards for the customer discovery pages' content
 * policy — see docs/MULTILINGUAL-ARCHITECTURE.md and
 * docs/RESTAURANT-DISCOVERY.md. Mirrors
 * tests/restaurant-owner-workspace/run-content-policy-tests.ts (Task
 * G)'s approach: source-inspection checks, not behavioral tests, that
 * catch a future regression — e.g. someone accidentally feeding a
 * restaurant's own free-text tags into RestaurantCard's translated
 * `tags` prop instead of its untranslated `ownerTags` prop — as an
 * automated failure rather than only a code-review hope.
 *
 * Dependency-free, runs in this environment.
 * Run: node tests/restaurant-discovery/run-content-policy-tests.ts
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");

const RESTAURANT_CARD_CALL_SITES = [
  path.join(REPO_ROOT, "app", "[locale]", "restaurants", "page.tsx"),
  path.join(REPO_ROOT, "app", "[locale]", "hubs", "[slug]", "page.tsx"),
  path.join(REPO_ROOT, "components", "discovery", "FeaturedRestaurantsSection.tsx"),
  path.join(REPO_ROOT, "components", "cuisine", "CuisineDetailClient.tsx"),
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

console.log("Restaurant discovery content policy — static regression guards (no Firestore, no emulator)\n");

test("every RestaurantCard call site wires the restaurant's own free-text tags through ownerTags, never tags", () => {
  for (const filePath of RESTAURANT_CARD_CALL_SITES) {
    const source = readFileSync(filePath, "utf8");
    const relative = path.relative(REPO_ROOT, filePath);
    assert.ok(
      /ownerTags=\{[^}]*\.tags\s*\|\|\s*\[\]\}/.test(source),
      `Expected ${relative} to pass the restaurant's own tags field through the ownerTags prop`
    );
  }
});

test("the restaurants browse and search pages never call a translation function on owner-supplied text", () => {
  const files = [
    path.join(REPO_ROOT, "app", "[locale]", "restaurants", "page.tsx"),
    path.join(REPO_ROOT, "components", "discovery", "SearchClient.tsx"),
  ];
  for (const filePath of files) {
    const source = readFileSync(filePath, "utf8");
    const relative = path.relative(REPO_ROOT, filePath);
    // buildDietaryBadgeLabels returns pre-translated (English-only)
    // strings and must never be used on a locale-aware discovery
    // page — see lib/dietary.ts's own deprecation-style comment and
    // Task D's audit finding. getLocalizedRestaurantContent (the one
    // sanctioned translation *read*, gated behind an approved
    // translation) is fine and expected; a bare "translateTag(" or
    // "buildDietaryBadgeLabels" call on this page would not be.
    assert.ok(
      !source.includes("buildDietaryBadgeLabels"),
      `Expected ${relative} to never call buildDietaryBadgeLabels (pre-translated, English-only)`
    );
  }
});

test("the restaurants browse page filters restaurants to the active launch city using the shared helper, not a hardcoded string", () => {
  const source = readFileSync(path.join(REPO_ROOT, "app", "[locale]", "restaurants", "page.tsx"), "utf8");
  assert.ok(
    source.includes("belongsToActiveCity"),
    "Expected the restaurants page to filter via lib/cities.ts's belongsToActiveCity(), not a hardcoded 'london' check"
  );
});

console.log(`\n${passed}/${total} tests passed.`);
if (passed !== total) {
  console.log("\nSome tests FAILED.");
  process.exit(1);
}
console.log("\nAll discovery content-policy static guards passed. No Firestore, no emulator, no credentials.");
