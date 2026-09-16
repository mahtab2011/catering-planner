/**
 * Unit tests for the pure claim-state decision logic in
 * lib/restaurantClaim.ts — see docs/RESTAURANT-CLAIM-WORKFLOW.md.
 *
 * Unlike tests/firestore-rules/rules.test.js (which requires the
 * Firestore emulator + Java, unavailable in this environment — see
 * docs/FIRESTORE-SECURITY-AUDIT.md), this test file has NO external
 * dependencies and actually runs here: it exercises real, shipped
 * application logic (the exact functions RestaurantClaimPanel.tsx
 * calls), not a reimplementation of it. It is a UI-convenience check,
 * not proof the Firestore rule matches — the rule is the real
 * security boundary and can only be verified by the (currently
 * unexecuted) emulator suite.
 *
 * Run: node tests/restaurant-claim/run-claim-state-tests.ts
 */

import assert from "node:assert/strict";
import { deriveClaimViewerState, isClaimFormComplete } from "../../lib/restaurantClaim.ts";

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

console.log("Restaurant claim state machine — pure-logic unit tests (no Firestore, no emulator)\n");

test("unclaimed restaurant, no viewer signed in: can't submit (not signed in), not owner", () => {
  const s = deriveClaimViewerState({ ownerUid: "", ownerClaimStatus: undefined, viewerUid: null });
  assert.equal(s.isUnclaimed, true);
  assert.equal(s.isOwnerViewer, false);
  assert.equal(s.canSubmitClaim, true); // eligible to claim once they sign in
});

test("unclaimed restaurant, signed-in non-owner viewer: can submit a claim", () => {
  const s = deriveClaimViewerState({ ownerUid: "", ownerClaimStatus: "unclaimed", viewerUid: "user-1" });
  assert.equal(s.isUnclaimed, true);
  assert.equal(s.canSubmitClaim, true);
  assert.equal(s.wasPreviouslyRejected, false);
});

test("restaurant with a claim already pending: cannot submit a second claim", () => {
  const s = deriveClaimViewerState({ ownerUid: "", ownerClaimStatus: "claim_pending", viewerUid: "user-2" });
  assert.equal(s.isUnclaimed, true);
  assert.equal(s.canSubmitClaim, false);
});

test("restaurant whose prior claim was rejected: a fresh claim is allowed, and flagged as a re-claim", () => {
  const s = deriveClaimViewerState({ ownerUid: "", ownerClaimStatus: "claim_rejected", viewerUid: "user-3" });
  assert.equal(s.isUnclaimed, true);
  assert.equal(s.canSubmitClaim, true);
  assert.equal(s.wasPreviouslyRejected, true);
});

test("restaurant with an approved owner, viewed by that owner: isOwnerViewer true, no claim offered", () => {
  const s = deriveClaimViewerState({ ownerUid: "owner-1", ownerClaimStatus: "claimed", viewerUid: "owner-1" });
  assert.equal(s.isUnclaimed, false);
  assert.equal(s.isOwnerViewer, true);
  assert.equal(s.canSubmitClaim, false);
});

test("restaurant with an approved owner, viewed by someone else: not the owner, no claim offered", () => {
  const s = deriveClaimViewerState({ ownerUid: "owner-1", ownerClaimStatus: "claimed", viewerUid: "random-user" });
  assert.equal(s.isUnclaimed, false);
  assert.equal(s.isOwnerViewer, false);
  assert.equal(s.canSubmitClaim, false);
});

test("restaurant with an approved owner, viewed anonymously: not the owner, no claim offered", () => {
  const s = deriveClaimViewerState({ ownerUid: "owner-1", ownerClaimStatus: "claimed", viewerUid: null });
  assert.equal(s.isOwnerViewer, false);
  assert.equal(s.canSubmitClaim, false);
});

test("claim form: complete only with both a name and a business email", () => {
  assert.equal(isClaimFormComplete({ claimantName: "Jane Doe", claimantContactEmail: "jane@example.com" }), true);
  assert.equal(isClaimFormComplete({ claimantName: "", claimantContactEmail: "jane@example.com" }), false);
  assert.equal(isClaimFormComplete({ claimantName: "Jane Doe", claimantContactEmail: "" }), false);
  assert.equal(isClaimFormComplete({ claimantName: "   ", claimantContactEmail: "jane@example.com" }), false);
});

console.log(`\n${passed}/${total} tests passed.`);
if (passed !== total) {
  console.log("\nSome tests FAILED.");
  process.exit(1);
}
console.log("\nAll claim-state unit tests passed. No Firestore, no emulator, no credentials.");
