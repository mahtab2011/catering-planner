# Security Follow-Up: London Food Hubs Launch Readiness

Written for: whoever manages the Firebase project for catering-planner (site owner / a developer with Firebase console access).

**Status as of this update:** superseded as the single source of truth by three more specific documents produced in the Firebase Launch Safety Package pass — read those first, this file is now a pointer plus a running list of what's still genuinely unresolved:

- **`docs/FIRESTORE-COLLECTION-INVENTORY.md`** — the complete, file-by-file audit of all 28 Firestore collections this app uses (not just the original 6), what each one's authorization pattern actually is in code, and exactly which collections still need a human policy decision before rules can cover them.
- **`firestore.rules`** itself — now covers 21 of 28 collections (the original 6 plus 15 more with a clear, consistent app-code pattern), with an explicit `REQUIRES MANUAL POLICY DECISION` section naming the remaining 7 and why.
- **`docs/LONDON-FOOD-HUBS-LAUNCH-CHECKLIST.md`** — the exact ordered steps to take this from "reviewed code" to "safely live," including where in that order each of the items below belongs.
- **`docs/ROLLBACK-PLAN.md`** — how to undo any of it if something goes wrong after deploying.

**Still none of it is deployed.** No `firebase login`/`firebase deploy` has been run in any session that produced this code — no credentials or project access were ever available.

## What's already been done (in code, not yet live)

- `firestore.rules` covers `reviews`, `articles`, `recommendations`, `restaurants`, `restaurant_signups`, `users`, `staff`, `customers`, `events`, `sales_signups`, `blackcab_early_access`, `blackcab_bookings`, `blackcab_journey_ratings`, `blackcab_concerns`, `blackcab_signups`, `catering_house_signups`, `customer_signups`, `supplier_signups`, `blackcabs`, `blackcab_drivers`, and `riderCorrectionLogs` (create only).
- `functions/index.js` implements `setAdminClaim` (admin-only callable) and `onReviewWrite` (trusted rating aggregate) — both reviewed for authorization, idempotency, race conditions and malformed-input handling; several real defects found and fixed (transaction-wrapped the rating recompute, required an explicit boolean for admin grants, blocked self-revocation, handled a not-found target uid cleanly).
- `functions/scripts/bootstrapFirstAdmin.js` rewritten to dry-run by default, print the resolved Firebase project before doing anything, and require an explicit `--apply` flag.
- `functions/scripts/backfillRestaurantOwners.js` — new dry-run-first script proposing `ownerUid` for restaurants left unclaimed, using two independently-verified signals (see the script's own header) and refusing ambiguous matches.
- `tests/firestore-rules/` — a Firebase Rules unit test suite, never executed (no Java runtime in this environment), but written and reviewed against the actual rules content.
- Restaurant ownership bug fixed at the application level (both admin signup-conversion flows now set `ownerUid` correctly); admin gating added to four previously-ungated admin pages.

**None of this is enforced yet.** Client-side checks remain bypassable by anyone calling the Firestore SDK directly, exactly as before, until the rules are actually deployed.

## Manual steps required before this is safe as a public marketplace

See `docs/LONDON-FOOD-HUBS-LAUNCH-CHECKLIST.md` for the full ordered sequence with exact commands. In brief: capture current rules → verify project → decide the 7 remaining collections → deploy functions → bootstrap first admin → dry-run then apply the ownership backfill → deploy indexes → deploy rules → verify → smoke test.

## Known gaps not addressed this session

- **7 collections still require a manual policy decision** before they can have any rule at all: `orders`/`counters`, `riders`, `rider_signups` (read scope), `suppliers`, `supplier_items`, `supplier_orders`, `catering_houses`, `ingredients`, `activity_logs` (read). See `docs/FIRESTORE-COLLECTION-INVENTORY.md` for exactly what's undecidable about each and why guessing would be unsafe either direction.
- **`app/create-account` bypasses every approval-staging flow** for 7 roles (restaurant, supplier, customer, rider, catering_house, blackcab, staff), writing directly to the live collection with no admin review. This is an application-code design question (documented in the inventory), not something this pass changed.
- `restaurant_signups` create-time field validation is intentionally light (only `uid` and `status == "new"` are checked) — a malformed-but-harmless signup document is possible, a privilege-escalating one is not.
- Rules tests exist but have never actually run — see `tests/firestore-rules/README.md` for how to run them for real once Java/the emulator is available.
