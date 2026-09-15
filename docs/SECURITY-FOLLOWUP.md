# Security Follow-Up: London Food Hubs Launch Readiness

Written for: whoever manages the Firebase project for catering-planner (site owner / a developer with Firebase console access).

**Status as of this update:** `firestore.rules`, `firestore.indexes.json`, `firebase.json`, and `functions/` (Cloud Functions) now exist in this repository, matching the model this document originally called for. **None of it has been deployed** — no `firebase login`/`firebase deploy` was run, since this session had no Firebase credentials or project access. This document now covers what's left to do manually before that changes.

## What's already been done (in code, not yet live)

- **`firestore.rules`** covers `reviews`, `articles`, `recommendations`, `restaurants`, `restaurant_signups`, `users` — see the file itself for the full rationale in comments. Admin authorization is a Firebase Auth custom claim (`request.auth.token.admin`) only, never the `users/{uid}.role` field.
- **`functions/index.js`** implements `setAdminClaim` (admin-only callable to grant the custom claim) and `onReviewWrite` (Cloud Function that maintains `restaurants/{id}.rating`/`.reviewCount` from approved reviews — the only trusted writer of those two fields).
- **Restaurant ownership bug fixed at the application level**: both admin flows that convert an approved `restaurant_signups` application into a live restaurant document now correctly set `ownerUid` to the applicant's real uid (previously one set it to `""`, the other omitted it entirely — see the commit that fixed this for the full trace). The edit page no longer lets any signed-in user claim an unowned listing by simply being the first to open its edit page.
- **Admin gating added** to four `/admin/*`-adjacent pages that previously had none at all (`/admin`, `/admin/restaurant-signups`, `/restaurants/admin/signups`, `/restaurants/admin/signups/[id]`) — still client-side/advisory, but a real improvement over rendering for anyone who navigated there.

**None of this is enforced yet.** Everything above except the ownership/admin-gating application code is inert until deployed. Client-side checks remain bypassable by anyone calling the Firestore SDK directly, exactly as before.

## Manual steps required before this is safe as a public marketplace

In order:

1. **Merge scope, don't just deploy.** `firestore.rules` as written only covers the six collections above. It has no catch-all, so deploying it as-is would default-deny every other collection the app uses (orders, staff, suppliers, customers, riders, catering_houses, blackcab_*, etc.) — see the SCOPE comment at the top of the file. Either audit those collections and extend the file, or merge these six `match` blocks into whatever rules currently govern the live project.
2. **`cd functions && npm install`**, then `firebase login` and `firebase deploy --only functions` — see `functions/README.md` for the full sequence.
3. **Bootstrap the first admin** via `functions/scripts/bootstrapFirstAdmin.js` (needs a downloaded service-account key, used once, then discarded/secured — never committed). This has to happen before step 4, because `setAdminClaim` requires an existing admin to call it and there won't be one yet.
4. **Backfill ownerUid on already-existing unclaimed restaurants.** Any restaurant created before this session's fix (or via the admin conversion flow before it was fixed) may have `ownerUid: ""`. Once `firestore.rules` is live, those listings become **admin-only to edit** — their real owners will be locked out until backfilled. For each restaurant with empty `ownerUid`: read its `sourceSignupId` field (set by both conversion flows), look up `restaurant_signups/{sourceSignupId}`, and set the restaurant's `ownerUid` to that signup document's `uid` field (which equals its own document id). This needs to run with the Admin SDK (bypasses rules) as a one-off script, not attempted from this session (no database access to know how many restaurants are affected or run it against real data).
5. **Deploy `firestore.rules` and `firestore.indexes.json`** (`firebase deploy --only firestore:rules,firestore:indexes`) — only after steps 2-4, so admin actions and existing owners aren't locked out the moment rules go live.
6. **Verify**, ideally with the Firestore Rules Playground in the console or a local emulator run (this session couldn't run either — `firebase-tools` installs fine here but the Firestore emulator needs a Java runtime that wasn't available in this sandbox): confirm a non-admin cannot approve their own review, cannot read another user's pending review, cannot write `restaurants/{id}.rating` directly, and that a real admin *can* still moderate reviews/articles/recommendations after their custom claim is set.

## Known gaps not addressed this session

- Collections outside the audited scope (orders, staff, suppliers, customers, riders, rider_signups, catering_houses, blackcab_*, sales_signups, promotions, etc.) were not re-audited — see the SCOPE note in `firestore.rules`.
- `restaurant_signups` create-time field validation is intentionally light (only `uid` and `status == "new"` are checked) — the full signup payload has many fields and wasn't exhaustively schema-validated in rules; a malformed-but-harmless signup document is possible, a privilege-escalating one is not.
- No automated rules tests exist (`@firebase/rules-unit-testing` needs the same Java-dependent emulator this sandbox didn't have). Recommend adding a rules test suite when someone has an environment that can run the emulator, covering at minimum: review create/approve/read-visibility, restaurant ownership immutability, and the admin-claim bootstrap path.
