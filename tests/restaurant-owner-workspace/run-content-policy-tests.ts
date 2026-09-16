/**
 * Static regression guards for the owner workspace's content policy —
 * see docs/MULTILINGUAL-ARCHITECTURE.md and
 * docs/RESTAURANT-OWNER-WORKSPACE.md.
 *
 * These are source-inspection checks, not behavioral tests: they read
 * app/restaurants/[id]/edit/page.tsx's actual text and assert it never
 * imports/calls anything that would auto-translate owner-supplied
 * content (name, description, tags, menu item names), and that the
 * platform-vocabulary pickers (cuisine, dietary) source their options
 * from the canonical lists rather than a local, driftable copy. The
 * point is to catch a future regression — e.g. someone "helpfully"
 * running a restaurant's shortDescription through a translation
 * dictionary before saving — as an automated failure, not just a code
 * review hope.
 *
 * Dependency-free, runs in this environment.
 * Run: node tests/restaurant-owner-workspace/run-content-policy-tests.ts
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { DIETARY_ATTRIBUTES } from "../../lib/dietary.ts";
import { getCuisinesByRegion } from "../../lib/cuisines.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const EDIT_PAGE = path.join(REPO_ROOT, "app", "restaurants", "[id]", "edit", "page.tsx");

const editPageSource = readFileSync(EDIT_PAGE, "utf8");

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

console.log("Owner workspace content policy — static regression guards (no Firestore, no emulator)\n");

test("the edit page never imports any restaurant-content translation function", () => {
  // getLocalizedRestaurantContent is the ONLY sanctioned way translated
  // content is ever shown (read paths only) — it must never appear on
  // the write/save path. useTranslations would imply this page runs
  // through next-intl's message catalog, which restaurant-supplied
  // free text must never be, unlike platform-owned UI copy.
  for (const forbidden of ["getLocalizedRestaurantContent", "useTranslations", "buildDietaryBadgeLabels"]) {
    assert.ok(
      !editPageSource.includes(forbidden),
      `Expected the edit page to never reference "${forbidden}"`
    );
  }
});

test("the save payload assigns owner text fields directly from form state (identity, not transformed)", () => {
  // A light structural check: the save call sends shortDescription/
  // longDescription/tags straight from their own same-named state
  // variables (via .trim()), not through any named helper that could
  // be swapping in translated text.
  assert.match(editPageSource, /shortDescription:\s*shortDescription\.trim\(\)/);
  assert.match(editPageSource, /longDescription:\s*longDescription\.trim\(\)/);
  assert.match(editPageSource, /\btags\b,/); // `tags,` shorthand — the cleaned array, not a translated copy
});

test("the cuisine picker sources its options from the canonical taxonomy, not a local list", () => {
  assert.ok(
    editPageSource.includes("getCuisinesByRegion"),
    "Expected the edit page to source cuisine options from lib/cuisines.ts's getCuisinesByRegion()"
  );
  // Sanity-check the canonical function itself returns something to
  // pick from — if this returned an empty list, the "no local list"
  // guarantee above would be vacuous.
  const groups = getCuisinesByRegion();
  assert.ok(groups.length > 0, "Expected at least one cuisine region");
  assert.ok(groups[0].cuisines.length > 0, "Expected at least one cuisine in the first region");
});

test("the dietary picker sources its options from the canonical DIETARY_ATTRIBUTES list", () => {
  assert.ok(
    editPageSource.includes("DIETARY_ATTRIBUTES"),
    "Expected the edit page to source dietary options from lib/dietary.ts's DIETARY_ATTRIBUTES"
  );
  assert.ok(DIETARY_ATTRIBUTES.length > 0, "Expected at least one canonical dietary attribute");
});

console.log(`\n${passed}/${total} tests passed.`);
if (passed !== total) {
  console.log("\nSome tests FAILED.");
  process.exit(1);
}
console.log("\nAll content-policy static guards passed. No Firestore, no emulator, no credentials.");
