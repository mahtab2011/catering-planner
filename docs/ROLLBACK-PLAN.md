# Rollback Plan

Written for: whoever performs the London Food Hubs launch steps in `docs/LONDON-FOOD-HUBS-LAUNCH-CHECKLIST.md`, in case any step needs to be undone.

**No automated rollback exists, and none should be built.** Every procedure below is a manual, deliberate command run by a human who has just confirmed something is wrong — the same posture as the rest of this launch package (dry-run first, explicit apply, no destructive automation). Nothing in this repository, this session, or any Cloud Function auto-reverts anything.

## 1. Roll back Firestore rules

**Prerequisite:** you captured the previous live rules before deploying new ones — see Launch Checklist step A. If you didn't, the Firebase console's Rules tab keeps a version history (Firestore → Rules → History) that you can restore from directly in the console without needing a local backup file at all.

```
# If you have the previous rules saved locally as firestore.rules.before-launch:
cp firestore.rules.before-launch firestore.rules
firebase deploy --only firestore:rules
```

Or, without touching this repo: open the Firebase console → Firestore Database → Rules → History, select the previous version, and click "Restore". This is the fastest rollback path and doesn't require CLI access.

**Effect of rolling back:** the new London Food Hubs collections (`reviews`, `articles`, `recommendations`) and the tightened `restaurants`/`restaurant_signups`/`users` rules revert to whatever they were before. If the previous rules were fully open (`allow read, write: if true` or similar, common for a project that never had rules configured), rolling back means those collections become unrestricted again — acceptable as an emergency measure, but treat it as "buy time to fix forward," not a resting state, since it re-opens exactly the gaps this whole package closed.

## 2. Roll back Firestore indexes

Indexes are additive — removing `firestore.indexes.json`'s one composite index (`articles`: status + relatedCuisineSlugs array-contains) does not delete existing data, only stops that specific query pattern from being efficient. To remove it:

```
# Delete the specific index via the Firebase console (Firestore Database →
# Indexes → find the composite index → delete), or:
firebase firestore:indexes
# (lists current indexes; there is no single "revert to previous
# firestore.indexes.json" command — index changes are managed by
# editing the file and redeploying, or deleting individual indexes in
# the console)
```

There is no data-loss risk in leaving the index in place even if you roll back the rules — an unused index just costs a small amount of storage/write overhead, not correctness. Removing it is optional cleanup, not a required rollback step.

## 3. Roll back Cloud Functions

```
# List current + previous versions of a function:
firebase functions:list

# Firebase Functions doesn't have a one-command "rollback" the way
# some platforms do. To revert:
#   a) Redeploy the previous source (check out the previous git commit
#      for functions/, then deploy):
git log --oneline -- functions/
git checkout <previous-commit-hash> -- functions/
firebase deploy --only functions
git checkout HEAD -- functions/   # restore the working tree afterward

#   b) Or delete the function entirely if it should not have been
#      deployed at all:
firebase functions:delete setAdminClaim
firebase functions:delete onReviewWrite
```

**Effect of deleting `onReviewWrite`:** `restaurants/{id}.rating`/`.reviewCount` simply stop updating going forward — existing values remain on documents (not deleted), just stale. No data loss, no user-facing error; the UI already handles a missing/zero aggregate gracefully (see `functions/README.md`).

**Effect of deleting `setAdminClaim`:** no new admins can be granted via the callable until it's redeployed; existing custom claims already granted are untouched (they live on the Firebase Auth user record, not in the function). Use the Firebase console (Authentication → user → manage custom claims) or `functions/scripts/bootstrapFirstAdmin.js` as a fallback in the meantime.

## 4. Roll back the application deployment (Vercel)

This repository deploys to Vercel, independently of Firebase. Nothing in this launch package touches Vercel configuration, and rolling back the app is entirely Vercel's existing mechanism:

```
# Via the Vercel dashboard: Deployments → find the previous production
# deployment → "..." menu → "Promote to Production". No CLI needed.

# Or via CLI, if you have it configured:
vercel rollback [deployment-url-or-id]
```

This instantly points the production domain back at the previous build — it does not touch Firestore data or rules, so pair it with step 1 above if the application code and the rules need to go back together (e.g. if new code assumes fields/rules that no longer exist after a rules rollback).

## 5. What rolling back does NOT do

- **Does not undo `backfillRestaurantOwners.js --apply` writes.** Those set `ownerUid` on specific restaurant documents; rolling back rules/functions/app code doesn't touch that data. If a backfill run wrote something wrong, fix it with a targeted, reviewed Admin SDK write to the specific document(s) — check the JSON report the script produced (`--report-file`) to know exactly what it changed.
- **Does not undo `bootstrapFirstAdmin.js --apply` or a `setAdminClaim` call.** Revoke a wrongly-granted admin claim via the Firebase console (Authentication → user → custom claims) or another admin calling `setAdminClaim({uid, admin: false})`.
- **Does not restore deleted documents.** Nothing in this launch package deletes restaurant/review/article/recommendation documents. If something else does, that's a Firestore backup/restore situation (Firebase's scheduled backups or a manual export), out of scope for this plan.

## When to actually roll back vs. fix forward

Roll back immediately if: the deployed rules are blocking legitimate existing SmartServeUK traffic (orders, staff, riders, etc.) — that's a "preserve existing operational functionality" violation and should be reverted first, investigated second. For anything narrower (one collection's rule is slightly wrong, one function has a bug), prefer fixing forward with a small, reviewed redeploy over a full rollback, since the checklist's ordering (functions → bootstrap → backfill → rules) was chosen specifically to avoid needing this document in the first place.
