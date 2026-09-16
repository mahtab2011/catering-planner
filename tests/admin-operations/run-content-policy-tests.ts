/**
 * Static regression guards for the admin operations workspace added
 * in Task I — see docs/ADMIN-OPERATIONS.md. Source-inspection checks,
 * not behavioral tests, that catch a future regression as an
 * automated failure rather than only a code-review hope: mirrors the
 * approach already used in
 * tests/restaurant-owner-workspace/run-content-policy-tests.ts (Task
 * G) and tests/restaurant-discovery/run-content-policy-tests.ts (Task
 * H).
 *
 * Dependency-free, runs in this environment.
 * Run: node tests/admin-operations/run-content-policy-tests.ts
 */

import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");

let passed = 0;
let total = 0;

/** Strips /* block *\/ and // line comments so a source-inspection
 *  check looks at actual code, not explanatory prose that legitimately
 *  names the very thing it says isn't used. Good enough for this
 *  codebase's comment style (no string literals containing "//" or
 *  "/*" near the terms this file checks for). */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

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

console.log("Admin operations content/security policy — static regression guards (no Firestore, no emulator)\n");

test("the translation-requests admin page never reads or writes a quoted amount/currency field in actual code", () => {
  const source = stripComments(
    readFileSync(path.join(REPO_ROOT, "app", "admin", "restaurant-translation-requests", "page.tsx"), "utf8")
  );
  // quotedAmount/quotedCurrency remain part of the data model (Task D)
  // but this task deliberately built no UI that reads or writes them
  // in code — the page's own (stripped-out) header comment explains
  // why. This test fails if a future edit adds a price/currency input
  // here.
  assert.ok(!source.includes("quotedAmount"), "quotedAmount must not appear in the translation-requests admin page's code");
  assert.ok(!source.includes("quotedCurrency"), "quotedCurrency must not appear in the translation-requests admin page's code");
  // No payment-adjacent vocabulary either.
  for (const forbidden of ["Stripe", "checkout", "paymentIntent", "charge("]) {
    assert.ok(!source.includes(forbidden), `Expected no "${forbidden}" reference in the translation-requests admin page`);
  }
});

test("marking a translation request PUBLISHED never writes to a restaurant's contentTranslations in actual code", () => {
  const source = stripComments(
    readFileSync(path.join(REPO_ROOT, "app", "admin", "restaurant-translation-requests", "page.tsx"), "utf8")
  );
  assert.ok(
    !source.includes("contentTranslations"),
    "The translation-requests admin page's code must never touch RestaurantDoc.contentTranslations — publishing a translation stays a separate, deliberate admin edit to the restaurant document itself"
  );
});

test("the new admin-only lib modules are never imported outside app/admin", () => {
  const forbiddenImportTargets = ["lib/adminDataQuality", "lib/adminRestaurantOverview"];
  const searchDirs = ["app", "components", "lib"].map((d) => path.join(REPO_ROOT, d));

  function walk(dir: string): string[] {
    let results: string[] = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === ".next") continue;
        results = results.concat(walk(full));
      } else if (/\.(ts|tsx)$/.test(entry.name)) {
        results.push(full);
      }
    }
    return results;
  }

  for (const dir of searchDirs) {
    for (const file of walk(dir)) {
      const relative = path.relative(REPO_ROOT, file).replace(/\\/g, "/");
      // The lib files themselves, and anything under app/admin, are
      // allowed to reference them.
      if (relative.startsWith("app/admin/")) continue;
      if (relative === "lib/adminDataQuality.ts" || relative === "lib/adminRestaurantOverview.ts") continue;
      const source = readFileSync(file, "utf8");
      for (const target of forbiddenImportTargets) {
        assert.ok(
          !source.includes(target),
          `Expected ${relative} to never import ${target} — admin-only data-quality/ownership-overview helpers must stay inside app/admin`
        );
      }
    }
  }
});

test("the admin restaurants overview page never renders claimant contact fields", () => {
  const source = readFileSync(path.join(REPO_ROOT, "app", "admin", "restaurants", "page.tsx"), "utf8");
  for (const forbidden of ["claimantContactEmail", "claimantContactPhone", "claimantNote", "claimantName"]) {
    assert.ok(
      !source.includes(forbidden),
      `Expected the general restaurant overview page to never render "${forbidden}" — claimant PII stays on the dedicated claims queue`
    );
  }
});

console.log(`\n${passed}/${total} tests passed.`);
if (passed !== total) {
  console.log("\nSome tests FAILED.");
  process.exit(1);
}
console.log("\nAll admin-operations content/security policy guards passed. No Firestore, no emulator, no credentials.");
