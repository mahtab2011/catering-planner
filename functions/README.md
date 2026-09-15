# London Food Hubs — Cloud Functions

Not deployed. This directory has never had `npm install` or `firebase deploy` run against it in this session — no credentials or project access were available, and deploying wasn't in scope anyway. It exists so the admin-authorization and rating-aggregate architecture is correct and reviewable now, rather than being improvised insecurely later.

## What's here

- `index.js` — `setAdminClaim` (callable, admin-only, grants/revokes the `admin` custom claim on another user) and `onReviewWrite` (Firestore trigger that recomputes a restaurant's `rating`/`reviewCount` from its approved reviews).
- `scripts/bootstrapFirstAdmin.js` — one-time manual script to grant the very first admin, since `setAdminClaim` requires an existing admin to call it.

## Deploy sequence (run locally by whoever has Firebase project access — not this session)

1. `cd functions && npm install`
2. `firebase login` (interactive; needs real credentials)
3. `firebase use <project-id>` — point the CLI at the actual Firebase project (create a `.firebaserc` locally; not committed, since it's project-specific and this repo currently serves no single fixed Firebase project reference)
4. `firebase deploy --only functions`
5. Bootstrap the first admin (see `scripts/bootstrapFirstAdmin.js` for full instructions). Dry run first — it prints the resolved project and target user but writes nothing:
   `GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json node scripts/bootstrapFirstAdmin.js <uid-or-email>`
   Then, once you've confirmed the printed project and user are correct, apply for real:
   `GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json node scripts/bootstrapFirstAdmin.js <uid-or-email> --apply`
6. Only after step 5 succeeds: deploy `firestore.rules` (`firebase deploy --only firestore:rules`). Deploying the rules before an admin custom claim exists means nobody — not even the site owner — can perform any admin action until the bootstrap step runs, since the rules trust the custom claim exclusively (see `docs/SECURITY-FOLLOWUP.md` for why).
7. Every admin added after the first can be granted through the `setAdminClaim` callable from an authenticated admin session — no more manual scripts needed.

## Why a Firestore trigger for ratings, not a client write

`firestore.rules` explicitly forbids any client — including the restaurant's own owner — from writing `restaurants/{id}.rating` or `.reviewCount`. Those fields only mean something if they can't be self-reported. `onReviewWrite` is the only writer, using the Admin SDK, which is exempt from Firestore rules by design (that's what makes it trusted). Until this function is deployed, restaurant documents simply won't have `rating`/`reviewCount` populated — the UI is built to handle that (no rating shown, not a fake one) rather than assume the aggregate exists.
