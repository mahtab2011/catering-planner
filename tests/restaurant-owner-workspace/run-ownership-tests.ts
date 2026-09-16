/**
 * Unit tests for the pure restaurant-management access logic in
 * lib/restaurantOwnership.ts — see docs/RESTAURANT-OWNER-WORKSPACE.md.
 *
 * Dependency-free, actually executes in this environment (unlike
 * tests/firestore-rules/rules.test.js, which needs Java + the
 * Firestore emulator — see docs/FIRESTORE-SECURITY-AUDIT.md). Exercises
 * the exact function app/restaurants/[id]/edit/page.tsx calls, not a
 * reimplementation of it. A UI-convenience check, not proof the
 * Firestore rule matches — the rule is the real security boundary.
 *
 * Run: node tests/restaurant-owner-workspace/run-ownership-tests.ts
 */

import assert from "node:assert/strict";
import { deriveManagementAccess } from "../../lib/restaurantOwnership.ts";

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

console.log("Restaurant management access gate — pure-logic unit tests (no Firestore, no emulator)\n");

test("approved owner can manage their own restaurant", () => {
  const r = deriveManagementAccess({ isAdmin: false, restaurantOwnerUid: "owner-1", viewerUid: "owner-1", status: "active" });
  assert.equal(r.canManage, true);
  assert.equal(r.reason, "owner");
});

test("unclaimed restaurant (no ownerUid): signed-in non-admin cannot manage, regardless of any claim in progress", () => {
  // Claim status is deliberately not even a parameter — ownership is
  // the only input that matters, matching Task F's finding that
  // ownerClaimStatus/claimantUid are workflow state, not authorization.
  const r = deriveManagementAccess({ isAdmin: false, restaurantOwnerUid: "", viewerUid: "claimant-1", status: "pending" });
  assert.equal(r.canManage, false);
  assert.equal(r.reason, "unclaimed");
});

test("owner of restaurant A cannot manage restaurant B", () => {
  const r = deriveManagementAccess({ isAdmin: false, restaurantOwnerUid: "owner-b", viewerUid: "owner-a", status: "active" });
  assert.equal(r.canManage, false);
  assert.equal(r.reason, "not_owner");
});

test("unrelated authenticated user cannot manage a claimed restaurant", () => {
  const r = deriveManagementAccess({ isAdmin: false, restaurantOwnerUid: "owner-1", viewerUid: "random-user", status: "active" });
  assert.equal(r.canManage, false);
  assert.equal(r.reason, "not_owner");
});

test("no signed-in viewer at all: never manageable via the owner path", () => {
  const r = deriveManagementAccess({ isAdmin: false, restaurantOwnerUid: "owner-1", viewerUid: undefined, status: "active" });
  assert.equal(r.canManage, false);
  assert.equal(r.reason, "not_owner");
});

test("owner is blocked by an admin: owner loses management access until unblocked", () => {
  const r = deriveManagementAccess({ isAdmin: false, restaurantOwnerUid: "owner-1", viewerUid: "owner-1", status: "blocked" });
  assert.equal(r.canManage, false);
  assert.equal(r.reason, "owner_but_blocked");
});

test("admin can manage any restaurant, including a blocked one, regardless of owner", () => {
  const r1 = deriveManagementAccess({ isAdmin: true, restaurantOwnerUid: "owner-1", viewerUid: "admin-1", status: "blocked" });
  assert.equal(r1.canManage, true);
  assert.equal(r1.reason, "admin");

  const r2 = deriveManagementAccess({ isAdmin: true, restaurantOwnerUid: "", viewerUid: "admin-1", status: "draft" });
  assert.equal(r2.canManage, true);
  assert.equal(r2.reason, "admin");
});

console.log(`\n${passed}/${total} tests passed.`);
if (passed !== total) {
  console.log("\nSome tests FAILED.");
  process.exit(1);
}
console.log("\nAll ownership-access unit tests passed. No Firestore, no emulator, no credentials.");
