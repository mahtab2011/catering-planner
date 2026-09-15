# Security Follow-Up: London Food Hubs Discovery Features

Written for: whoever manages the Firebase project for catering-planner (site owner / a developer with Firebase console access).

## Why this document exists

This repository does not contain `firestore.rules` or `firebase.json` — Firestore security rules are managed outside this repo (Firebase console, or a separate infra repo not checked into this one). That means **nothing in this codebase can be used to verify what is actually enforced in production**, and nothing added in this pass changes that.

The new features added in this session — reviews, blog articles, editorial recommendations, and the admin pages that manage them — all rely on role/status checks that run **entirely in the browser** (`lib/authGuard.ts`, the new `hooks/useAdminGate.ts`, and client-side Firestore `where()` queries). That was already true of the rest of the app (restaurant/rider/staff signups, order management) before this session; it is not a regression, but it is now covering more sensitive write paths and needs to be closed before this becomes a public marketplace with real user-generated content.

**A client-side check can always be bypassed by someone calling the Firestore SDK directly with their own code.** The only real security boundary is Firestore rules (or a server/Cloud Function that mediates writes with the Admin SDK). Until rules matching the model below are deployed and verified, treat every "admin-only" page and every "pending until approved" status in this app as advisory, not secure.

## What needs rules, and what those rules should require

### `reviews` collection
- **Create**: only when `request.auth != null`, `request.resource.data.userId == request.auth.uid`, and `request.resource.data.status == "pending"` (a client must never be allowed to create a review with any other status).
- **Update**: the review's author may update `title`/`reviewText`/`rating` only while `status == "pending"` (no editing after moderation). Only an admin account may change `status`.
- **Delete**: author or admin only.
- **Read**: anyone may read documents where `status == "approved"`. A document with `status in ["pending", "rejected"]` should only be readable by its `userId` or an admin — otherwise anyone can read the moderation queue by guessing IDs.

### `articles` collection
- **Read**: anyone may read documents where `status == "published"`. Draft articles must not be readable by non-admins — right now `app/blog` and `app/blog/[slug]` only *query* for `status == "published"`, but a rule is what actually stops someone reading a draft directly by ID.
- **Create/Update/Delete**: admin only.

### `recommendations` collection
- **Read**: anyone may read documents where `isActive == true` (or all documents, for admins).
- **Create/Update/Delete**: admin only.

### `restaurants` collection (pre-existing, now more exposed)
- **Read**: public for documents with `status in ["active", "pending"]` (matches current app behaviour).
- **Update**: only the document's `ownerUid`, or an admin. This wasn't explicitly re-verified in this session, but the new review/recommendation features add more surfaces that assume a restaurant document can be trusted (name, cuisine, halal flag) — if restaurant ownership isn't locked down, none of the new "editorial trust" features (reviews, recommendations) mean anything.

### Admin role model
- `lib/authGuard.ts`'s `canAccess()` reads `role` from `users/{uid}` — a plain Firestore field. If that field itself isn't locked down (only writable by an existing admin, or a Cloud Function), any authenticated user could set their own `role: "admin"` and pass every client-side gate added in this session (`useAdminGate`, `/admin/blog`, `/admin/reviews`, `/admin/recommendations`).
  - Short-term fix (rules only): restrict writes to `users/{uid}.role` to admin accounts.
  - Better fix (recommended before this becomes a real production concern): move the admin flag to a [Firebase Auth custom claim](https://firebase.google.com/docs/auth/admin/custom-claims), set only via the Admin SDK (a Cloud Function or a trusted backend), and check `request.auth.token.admin == true` in rules. Custom claims can't be forged by the client the way a Firestore field can.

## What was intentionally *not* done in this pass

- No `firestore.rules` file was created or deployed. The task that produced this document explicitly said not to deploy rules that can't be verified from this repository, and there's no way to confirm what rules already exist in the live Firebase project without console access.
- No Cloud Functions were added to move moderation (`approve`/`reject`, `publish`) server-side. That's the more robust fix once rules exist — a callable function that checks the caller's custom claim and performs the status transition, rather than trusting a client-side `updateDoc` gated only by `canAccess()`.

## Recommended next step

1. Pull the actual `firestore.rules` from the Firebase console into this repo (or a dedicated infra repo) so they're version-controlled and reviewable — right now they're a black box even to this codebase's maintainers.
2. Compare them against the model above.
3. Add the missing rules for `reviews`, `articles`, and `recommendations` (new in this session).
4. Migrate the admin check to a custom claim before treating `/admin/*` as trustworthy.
