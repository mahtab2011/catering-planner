/**
 * Unit tests for the pure customer-discovery filter predicates in
 * lib/cities.ts and lib/restaurantDiscoveryFilters.ts — see
 * docs/RESTAURANT-DISCOVERY.md.
 *
 * Dependency-free, actually executes in this environment (unlike
 * tests/firestore-rules/rules.test.js, which needs Java + the
 * Firestore emulator). Exercises the exact functions
 * app/[locale]/restaurants/page.tsx and the other discovery
 * components call, not a reimplementation of them.
 *
 * Run: node tests/restaurant-discovery/run-discovery-filter-tests.ts
 */

import assert from "node:assert/strict";
import { belongsToActiveCity, DEFAULT_CITY_SLUG } from "../../lib/cities.ts";
import { restaurantHasDietaryAttribute, restaurantOffersService } from "../../lib/restaurantDiscoveryFilters.ts";

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

console.log("Restaurant discovery filters — pure-logic unit tests (no Firestore, no emulator)\n");

// ---- London-only scope (Phase 3) ----

test("a restaurant explicitly tagged citySlug 'london' belongs to the active city", () => {
  assert.equal(belongsToActiveCity("london"), true);
});

test("a restaurant with NO citySlug (predates the field) still counts as belonging — not silently hidden", () => {
  assert.equal(belongsToActiveCity(undefined), true);
  assert.equal(belongsToActiveCity(""), true);
});

test("a restaurant explicitly tagged a DIFFERENT city does not belong to the active (London) scope", () => {
  assert.equal(belongsToActiveCity("paris"), false);
});

test("DEFAULT_CITY_SLUG is 'london' (the only active launch city)", () => {
  assert.equal(DEFAULT_CITY_SLUG, "london");
});

// ---- Service filters (Phase 8) — only real data-model fields, nothing invented ----

test("'All' service filter matches every restaurant regardless of its service flags", () => {
  assert.equal(restaurantOffersService({}, "All"), true);
  assert.equal(restaurantOffersService({ delivery: false }, "All"), true);
});

test("each service filter reads exactly its own boolean field, not a sibling one", () => {
  const deliveryOnly = { dineIn: false, takeaway: false, delivery: true, collectionEnabled: false };
  assert.equal(restaurantOffersService(deliveryOnly, "delivery"), true);
  assert.equal(restaurantOffersService(deliveryOnly, "dineIn"), false);
  assert.equal(restaurantOffersService(deliveryOnly, "takeaway"), false);
  assert.equal(restaurantOffersService(deliveryOnly, "collection"), false);
});

test("a restaurant with no service flags set matches no specific service filter", () => {
  assert.equal(restaurantOffersService({}, "dineIn"), false);
  assert.equal(restaurantOffersService({}, "takeaway"), false);
  assert.equal(restaurantOffersService({}, "delivery"), false);
  assert.equal(restaurantOffersService({}, "collection"), false);
});

// ---- Dietary filters (Phase 6) — never inferred from free text ----

test("dietary attribute matches only the structured dietaryAttributes array, never free text", () => {
  assert.equal(
    restaurantHasDietaryAttribute({ dietaryAttributes: ["vegetarian"] }, "vegetarian"),
    true
  );
  assert.equal(
    restaurantHasDietaryAttribute({ dietaryAttributes: ["vegan"] }, "vegetarian"),
    false
  );
});

test("the legacy dietaryCertifications array is also honored (additive, not a replacement)", () => {
  assert.equal(
    restaurantHasDietaryAttribute({ dietaryCertifications: ["kosher"] }, "kosher"),
    true
  );
});

test("the legacy isHalal boolean counts specifically for the 'halal' attribute only", () => {
  assert.equal(restaurantHasDietaryAttribute({ isHalal: true }, "halal"), true);
  assert.equal(restaurantHasDietaryAttribute({ isHalal: true }, "vegetarian"), false);
});

test("a restaurant with no structured dietary data at all matches no dietary filter", () => {
  assert.equal(restaurantHasDietaryAttribute({}, "vegetarian"), false);
  assert.equal(restaurantHasDietaryAttribute({}, "halal"), false);
});

console.log(`\n${passed}/${total} tests passed.`);
if (passed !== total) {
  console.log("\nSome tests FAILED.");
  process.exit(1);
}
console.log("\nAll discovery-filter unit tests passed. No Firestore, no emulator, no credentials.");
