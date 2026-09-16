/**
 * Unit tests for the pure admin-operations logic in
 * lib/adminDataQuality.ts and lib/adminRestaurantOverview.ts — see
 * docs/ADMIN-OPERATIONS.md.
 *
 * Dependency-free, actually executes in this environment. Exercises
 * the exact functions app/admin/restaurants/page.tsx and
 * app/admin/page.tsx call.
 *
 * Run: node tests/admin-operations/run-data-quality-tests.ts
 */

import assert from "node:assert/strict";
import { assessRestaurantDataQuality } from "../../lib/adminDataQuality.ts";
import { deriveOwnershipDisplayState, restaurantMatchesAdminSearch } from "../../lib/adminRestaurantOverview.ts";

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

console.log("Admin operations — pure-logic unit tests (no Firestore, no emulator)\n");

// ---- Data-quality flags (Phase 5) — factual, deterministic, no scoring ----

test("a fully complete restaurant has zero data-quality flags", () => {
  const flags = assessRestaurantDataQuality({
    name: "Test Restaurant",
    fullAddress: "1 Brick Lane, London",
    postcode: "E1 6QL",
    shortDescription: "A great place to eat.",
    cuisineSlugs: ["bangladeshi"],
    phone: "+44 20 7946 0000",
    openingHoursText: "Mon-Sun 12:00-22:00",
    coverImage: "https://example.com/photo.jpg",
    menuCategories: [{ category: "Mains", items: [{ name: "Biryani" }] }],
    hubName: "Brick Lane",
    ownerUid: "owner-1",
    dataConfidence: "verified",
  });
  assert.deepEqual(flags, []);
});

test("a bare-minimum restaurant with nothing filled in flags every applicable check", () => {
  const flags = assessRestaurantDataQuality({});
  assert.ok(flags.includes("missing_name"));
  assert.ok(flags.includes("missing_address"));
  assert.ok(flags.includes("missing_description"));
  assert.ok(flags.includes("missing_cuisine"));
  assert.ok(flags.includes("missing_contact"));
  assert.ok(flags.includes("missing_hours"));
  assert.ok(flags.includes("missing_image"));
  assert.ok(flags.includes("no_menu"));
  assert.ok(flags.includes("no_hub"));
  assert.ok(flags.includes("unclaimed"));
  // dataConfidence is undefined here, not "flagged"/"unverified", so
  // provenance_needs_review must NOT fire on absence alone.
  assert.ok(!flags.includes("provenance_needs_review"));
});

test("a menu with only empty categories (no items) still counts as no_menu", () => {
  const flags = assessRestaurantDataQuality({
    name: "X",
    menuCategories: [{ category: "Starters", items: [] }, { category: "Mains" }],
  });
  assert.ok(flags.includes("no_menu"));
});

test("either phone or email alone satisfies the contact-info check", () => {
  assert.ok(!assessRestaurantDataQuality({ phone: "+44..." }).includes("missing_contact"));
  assert.ok(!assessRestaurantDataQuality({ email: "a@b.com" }).includes("missing_contact"));
  assert.ok(assessRestaurantDataQuality({}).includes("missing_contact"));
});

test("dataConfidence 'flagged' or 'unverified' triggers provenance_needs_review; 'verified' does not", () => {
  assert.ok(assessRestaurantDataQuality({ dataConfidence: "flagged" }).includes("provenance_needs_review"));
  assert.ok(assessRestaurantDataQuality({ dataConfidence: "unverified" }).includes("provenance_needs_review"));
  assert.ok(!assessRestaurantDataQuality({ dataConfidence: "verified" }).includes("provenance_needs_review"));
});

test("a claimed restaurant (ownerUid set) never gets the unclaimed flag", () => {
  assert.ok(!assessRestaurantDataQuality({ ownerUid: "owner-1" }).includes("unclaimed"));
});

// ---- Ownership display state (Phase 11) — ownerUid remains authoritative ----

test("ownerUid set means 'claimed', regardless of a stale ownerClaimStatus", () => {
  assert.equal(deriveOwnershipDisplayState({ ownerUid: "owner-1", ownerClaimStatus: "claim_pending" }), "claimed");
  assert.equal(deriveOwnershipDisplayState({ ownerUid: "owner-1" }), "claimed");
});

test("no ownerUid, status claim_pending -> claim_pending", () => {
  assert.equal(deriveOwnershipDisplayState({ ownerUid: "", ownerClaimStatus: "claim_pending" }), "claim_pending");
});

test("no ownerUid, status claim_rejected -> claim_rejected", () => {
  assert.equal(deriveOwnershipDisplayState({ ownerUid: "", ownerClaimStatus: "claim_rejected" }), "claim_rejected");
});

test("no ownerUid, no claim status at all -> unclaimed", () => {
  assert.equal(deriveOwnershipDisplayState({}), "unclaimed");
  assert.equal(deriveOwnershipDisplayState({ ownerUid: "", ownerClaimStatus: "unclaimed" }), "unclaimed");
});

// ---- Admin search (Phase 4) — only meaningful lookup fields, never claimant PII ----

test("admin search matches on name, city, hub, cuisine, postcode", () => {
  const r = { name: "Brick Lane Kacchi House", citySlug: "london", hubName: "Brick Lane", cuisine: "Bangladeshi", postcode: "E1 6QL" };
  assert.ok(restaurantMatchesAdminSearch(r, "kacchi"));
  assert.ok(restaurantMatchesAdminSearch(r, "london"));
  assert.ok(restaurantMatchesAdminSearch(r, "brick"));
  assert.ok(restaurantMatchesAdminSearch(r, "bangladeshi"));
  assert.ok(restaurantMatchesAdminSearch(r, "E1 6QL"));
  assert.ok(!restaurantMatchesAdminSearch(r, "nonexistent"));
});

test("an empty search term matches everything", () => {
  assert.ok(restaurantMatchesAdminSearch({ name: "Anything" }, ""));
  assert.ok(restaurantMatchesAdminSearch({ name: "Anything" }, "   "));
});

console.log(`\n${passed}/${total} tests passed.`);
if (passed !== total) {
  console.log("\nSome tests FAILED.");
  process.exit(1);
}
console.log("\nAll admin-operations unit tests passed. No Firestore, no emulator, no credentials.");
