# London Food Hubs — Launch Checklist

Written for: whoever has Firebase project access and is taking this from "reviewed code" to "safely live." Follow this in order — the ordering itself is a safety property (e.g. functions must exist before the first admin can be bootstrapped; the first admin must exist before rules that trust the admin claim can go live without locking everyone out).

Every step that writes anything defaults to a dry run or asks for explicit confirmation, per the scripts' own design (see `functions/scripts/`). Nothing here should be run by an automated process unattended.

Related documents: `docs/FIRESTORE-COLLECTION-INVENTORY.md` (what every collection needs), `docs/ROLLBACK-PLAN.md` (if any step below needs undoing), `functions/README.md`, `tests/firestore-rules/README.md`.

---

## A. Back up current Firebase rules

Before changing anything, capture what's live today so there's something to roll back to.

```
firebase login
firebase use <project-id>
firebase firestore:rules > firestore.rules.before-launch
```

(Or: Firebase console → Firestore Database → Rules → copy the current contents somewhere safe. The console also keeps its own version history — Rules → History — which works as a backup even without this step, but don't rely on that alone.)

Do the same for indexes if you want a full picture, though indexes are additive and lower-risk:

```
firebase firestore:indexes > firestore.indexes.before-launch.json
```

**Checkpoint:** you have a local copy of the rules that are live right now, before this package touches anything.

## B. Verify the Firebase project

Confirm you're pointed at the correct project before any write-capable step. Every script in this package (`bootstrapFirstAdmin.js`, `backfillRestaurantOwners.js`) prints the resolved project id itself before doing anything — but verify independently too:

```
firebase projects:list
firebase use
```

**Checkpoint:** the project id shown matches the one you intend to launch London Food Hubs on.

## C. Decide the 7 remaining collections

Read `docs/FIRESTORE-COLLECTION-INVENTORY.md`'s "REQUIRES MANUAL POLICY DECISION" section. For each of `orders`/`counters`, `riders`, `rider_signups` (read scope), `suppliers`, `supplier_items`, `supplier_orders`, `catering_houses`, `ingredients`, `activity_logs` (read): decide the intended access model, make any needed application-code change first (several need one — see the inventory doc for which), then add the matching `match` block to `firestore.rules`.

This step has no exact command — it's a product/policy decision, not a mechanical one. **You can defer this step and proceed with a partial launch** (see note at the end of section I), but every collection left undecided stays fully inaccessible — including to admins — the instant the rules in step I deploy. Confirm that's acceptable for each one (e.g. if `orders` is left undecided, order-taking breaks entirely until it's resolved).

**Checkpoint:** either every collection has a decision + a rule, or you've deliberately chosen to defer specific ones and understand what breaks when rules deploy.

## D. Deploy Cloud Functions

```
cd functions
npm install
firebase deploy --only functions
```

This deploys `setAdminClaim` and `onReviewWrite` but changes no data and grants no one anything yet — safe to do before any rules change, since these functions don't affect Firestore access until called or triggered.

**Checkpoint:** `firebase functions:list` shows both `setAdminClaim` and `onReviewWrite` as deployed.

## E. Bootstrap the first admin

Dry run first (no writes):

```
GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json \
  node functions/scripts/bootstrapFirstAdmin.js <uid-or-email>
```

Confirm the printed project id and user are correct, then apply:

```
GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json \
  node functions/scripts/bootstrapFirstAdmin.js <uid-or-email> --apply
```

**Checkpoint:** the script's own output confirms `customClaims.admin === true` was granted; optionally verify in Firebase console → Authentication → that user → custom claims.

## F. Restaurant ownership — dry run

```
GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json \
  node functions/scripts/backfillRestaurantOwners.js --report-file=backfill-dry-run.json
```

Review the printed mapping, the ambiguous list, and the no-signal list. **Do not proceed to step G until you've read all three lists** — ambiguous entries need manual investigation (open the restaurant and the referenced signup in the console and decide by hand; the script will never guess for you), and no-signal entries have no available evidence of a rightful owner at all.

**Checkpoint:** you understand how many restaurants will be claimed, how many need manual attention, and how many will remain unclaimed (admin-only to edit) after this.

## G. Restaurant ownership — apply backfill

Only after reviewing F's output:

```
GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json \
  node functions/scripts/backfillRestaurantOwners.js --apply --report-file=backfill-applied.json
```

**Checkpoint:** the script's summary shows the expected write count; `backfill-applied.json` is your audit record of exactly what changed (keep it — it's the reference for step in `docs/ROLLBACK-PLAN.md` if something here needs manual correction later).

## H. Deploy indexes

```
firebase deploy --only firestore:indexes
```

Only one composite index exists (`articles`: status + relatedCuisineSlugs array-contains) — low-risk, additive, doesn't affect existing queries.

**Checkpoint:** Firebase console → Firestore Database → Indexes shows the new composite index as "Enabled" (not "Building" — wait for it to finish before relying on the query it supports).

## I. Deploy Firestore rules

Only after D, E, F/G are complete — deploying rules before an admin exists, or before restaurant owners are backfilled, means admin actions and restaurant self-edits fail immediately for real users.

```
firebase deploy --only firestore:rules
```

**Note on partial launch:** if you deliberately deferred some of step C's collections, the rules still deploy — those collections are simply inaccessible (default-denied) until you add their `match` block in a later, separate deploy. This is safe to do incrementally; it is not an all-or-nothing step.

**Checkpoint:** Firebase console → Firestore Database → Rules shows the newly deployed rules as active, with a timestamp matching this deploy.

## J. Verify with Rules Playground / emulator

This session could not run the emulator (no Java runtime) or the Rules Playground (no live project). Do this with real access:

```
# If you have Java available:
cd tests/firestore-rules
npm install
npx firebase emulators:exec --only firestore "npm test"
```

Or manually, in the Firebase console → Firestore Database → Rules → Rules Playground: replay a handful of the scenarios from `tests/firestore-rules/rules.test.js` by hand (anonymous read of an approved review vs. a pending one; a signed-in user trying to update someone else's restaurant; etc.) against the **live** rules you just deployed.

**Checkpoint:** either the automated test suite passes against the emulator, or you've manually confirmed the highest-risk scenarios (self-approval denial, ownerUid immutability, admin-only article management) in the Rules Playground against the live project.

## K. Application smoke tests

With rules live, exercise the real application (not just the rules in isolation):

- Sign in as a normal customer → submit a review → confirm it does NOT appear publicly until approved.
- Sign in as the bootstrapped admin → approve that review → confirm it now appears.
- Sign in as a restaurant owner → edit your own restaurant → confirm it saves.
- Attempt (as that same owner, via browser dev tools or a second account) to edit a *different* restaurant → confirm it's rejected.
- Load `/blog`, `/recommendations`, `/restaurants` signed out → confirm public content still renders.
- **Specifically check every SmartServeUK operational route you didn't explicitly decide on in step C** (kitchen display, order board, rider app, staff management, supplier/catering-house directories) — these are exactly the routes most likely to break silently if step C left them deferred. If something breaks here that wasn't expected, that's a rollback trigger (see `docs/ROLLBACK-PLAN.md`), not something to patch live under pressure.

**Checkpoint:** the golden paths above all behave as expected; anything operational that broke has been triaged (roll back rules, or accept the breakage as an intended consequence of a step-C decision).

## L. London Food Hubs domain — later, not now

`londonfoodhubs.com` has now been purchased (see `docs/HOSTINGER-DEPLOYMENT.md`), but actually pointing DNS at a live deployment is still explicitly out of scope for this checklist. The confirmed production host is Hostinger (a persistent Node.js deployment), not Vercel — see `docs/HOSTINGER-DEPLOYMENT.md` for the DNS sequence, SSL/HTTPS verification, and www-redirect policy this step will eventually follow. None of the Firebase work in this checklist assumes or requires a particular domain or host.

## M. Rollback procedure

See `docs/ROLLBACK-PLAN.md` for the full detail. Summary: Firestore rules can be restored from the step-A backup or the console's own rules history; Cloud Functions can be redeleted or redeployed from a previous commit; the Hostinger application deployment is rolled back manually (checkout a previous commit, rebuild, restart the Node process — see `docs/ROLLBACK-PLAN.md` section 4 and `docs/HOSTINGER-DEPLOYMENT.md`'s rollback procedure). Nothing here auto-reverts — every rollback action is a deliberate, manual command run by a human who has confirmed something is actually wrong.
