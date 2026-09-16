# Restaurant Claim & Correction/Removal Workflow

Status: implemented — `firestore.rules`, the claim/request UI, and the
admin review queue all exist and are described accurately below. Not
deployed (see `docs/SECURITY-FOLLOWUP.md` for the general "nothing is
deployed yet" context that applies to this whole repository).

## The vulnerability this repeats the fix for

An earlier session fixed a real bug: restaurants with an empty `ownerUid`
("unclaimed") were editable by "whoever edits it first" — i.e., simply
opening the edit form and saving granted ownership. That was removed;
unclaimed restaurants became admin-only to edit (see `firestore.rules`'
`restaurants` match block and its comments).

This task adds a *legitimate* way for a real owner to claim an unclaimed
listing — and it was built with that earlier bug specifically in mind. The
core rule, repeated in code comments in three places
(`firestore.rules`, `RestaurantClaimPanel.tsx`,
`app/admin/restaurant-claims/page.tsx`) so it can't be quietly lost in a
future edit:

> **Submitting a claim is never itself an edit right, and can never be
> smuggled into one.**

## Two separate documents, one admin queue

1. **Ownership claims** — live directly on the `restaurants/{id}` document
   (`ownerClaimStatus`, `claimantUid`, `claimSubmittedAt`,
   `claimDecidedAt`, `claimDecidedBy` — see
   `docs/RESTAURANT-DATA-PROVENANCE.md`).
2. **Correction/removal requests** — a separate collection,
   `restaurant_correction_requests` (`RestaurantCorrectionRequestDoc` in
   `lib/types.ts`), because these are a moderation-queue item *about* a
   restaurant, not a change *to* it.

Both are reviewed from one page, `app/admin/restaurant-claims/page.tsx`.

## Ownership claims

### Who can claim what

Any signed-in user may submit a claim on a restaurant that is currently
`ownerUid == ""` **and** `ownerClaimStatus` is `unclaimed` or
`claim_rejected` (a restaurant with a claim already `claim_pending` cannot
receive a second, competing claim until the first is resolved).

### What submitting a claim actually writes

`components/restaurants/RestaurantClaimPanel.tsx` writes exactly:

```js
updateDoc(doc(db, "restaurants", restaurantId), {
  claimantUid: currentUser.uid,
  ownerClaimStatus: "claim_pending",
  claimSubmittedAt: serverTimestamp(),
});
```

### How `firestore.rules` enforces this independently of the UI

The security boundary is the rules file, not the component — a malicious
client could send any Firestore write it wants, so the rule has to be the
real guard. The relevant branch on `restaurants/{restaurantId}`'s `update`
rule:

```
isSignedIn()
&& resource.data.get('ownerUid', '') == ''
&& resource.data.get('ownerClaimStatus', 'unclaimed') in ['unclaimed', 'claim_rejected']
&& request.resource.data.claimantUid == request.auth.uid
&& request.resource.data.ownerClaimStatus == 'claim_pending'
&& unchanged('ownerUid')
&& request.resource.data.diff(resource.data).affectedKeys()
     .hasOnly(['claimantUid', 'ownerClaimStatus', 'claimSubmittedAt', 'updatedAt'])
```

Three things this specifically prevents, each with a test in
`tests/firestore-rules/rules.test.js`:

- **Setting `ownerUid` in the same write** — `unchanged('ownerUid')` blocks
  it outright, independent of anything else in the write.
- **Smuggling an edit alongside the claim** — `diff().affectedKeys().hasOnly([...])`
  means the write can *only* touch the four claim-related fields; adding
  `shortDescription` or any other field to the same update fails.
- **Impersonating another user's claim** — `claimantUid` must equal
  `request.auth.uid`; a user cannot submit a claim naming someone else as
  the claimant.

### How a claim is approved

**No new Cloud Function was added for this.** The existing `isAdmin()`
branch on the same `update` rule is already unrestricted (an admin, gated
by a Firebase Auth custom claim — never the client-writable
`users/{uid}.role` field — may already write any field including
`ownerUid`). `app/admin/restaurant-claims/page.tsx` is a normal
admin-gated page (`useAdminGate`, same pattern as
`app/admin/recommendations/page.tsx`) that, on "Approve", performs a direct
Firestore write as the authenticated admin:

```js
updateDoc(doc(db, "restaurants", claim.id), {
  ownerUid: claim.claimantUid,
  ownerClaimStatus: "claimed",
  claimDecidedAt: serverTimestamp(),
  claimDecidedBy: adminUid,
});
```

This is the **only** place in the application that ever sets `ownerUid`
from a `claimantUid`. No client-writable path exists from `claimantUid` to
`ownerUid` — the rule above makes that structurally impossible, not just
discouraged by the UI.

"Reject" sets `ownerClaimStatus: "claim_rejected"` (leaving `claimantUid` in
place as an audit trail — the rule permits a fresh claim afterward since
`claim_rejected` is in the allowed starting-state list).

## Correction & removal requests

For anyone — including someone who is not (and isn't trying to become) the
owner — who wants to flag that a listing is wrong or should be removed.

### What gets written

`RestaurantClaimPanel.tsx`'s "Suggest an update" / "Request removal"
buttons write a new document to `restaurant_correction_requests`:

```ts
type RestaurantCorrectionRequestDoc = {
  restaurantId: string;
  requestType: "correction" | "removal";
  submittedByUid: string;
  submittedByEmail?: string;
  fieldDescription?: string;      // correction: which field
  suggestedValueNote?: string;    // correction: what it should say
  reasonNote?: string;            // removal: why
  status: "pending" | "accepted" | "rejected";
  moderatedBy?: string;
  moderatedAt?: unknown;
  moderationNote?: string;
};
```

### Rules

- **Create**: requires sign-in (matches the existing `reviews` collection's
  pattern — not anonymous), `submittedByUid == request.auth.uid`, a
  non-empty `restaurantId`, `requestType` in the allowed set, `status ==
  'pending'`, and no pre-set moderation fields.
- **Read**: the submitter can read their own request; otherwise admin-only.
- **Update**: admin-only, and even then `restaurantId` /
  `submittedByUid` / `requestType` must stay unchanged — an admin can only
  move the moderation fields (`status`, `moderatedBy`, `moderatedAt`,
  `moderationNote`).
- **Delete**: admin-only.

### What accepting a request does — and does not — do

Accepting a correction or removal request **never automatically edits or
deletes the restaurant.** `app/admin/restaurant-claims/page.tsx`'s "Accept"
button only updates the request document's own `status`. An admin who
accepts a request is expected to then make the actual change themselves, by
hand, on the restaurant's own edit page. This is deliberate: a public
submission — even from a good-faith reporter — should never directly cause
a factual change to a listing without a human in the loop making that
specific edit and being accountable for it.

## Owner upgrade path (architecture only — no pricing invented)

Once a restaurant reaches `ownerClaimStatus: "claimed"` (whether via
self-signup or an approved claim), it already sits on the pre-existing
`isPremium` / `subscriptionPlan` / `offersEnabled` / `loyaltyEnabled` /
`adsEnabled` fields on `RestaurantDoc`, and the pre-existing `SubscriptionDoc`
type (`lib/types.ts`) already models `planCode`, `planName`, `status`
(`trial`/`active`/`expired`/`cancelled`), `trialStartAt`/`trialEndAt`,
`billingStartAt`, `amount`, `currency`. Both predate this task.

This task's contribution is only the connection, not new infrastructure: a
claimed restaurant is exactly the point at which "upgrade to premium" makes
sense to offer, since there's now a real, verified operator behind the
listing to offer it to. No new plan tiers, prices, or payment integration
were built or invented here — that would require actual product/pricing
decisions this task wasn't asked to make. The existing free/premium
distinction and `SubscriptionDoc` shape are sufficient scaffolding for
whoever builds the actual upgrade flow (a pricing page, a payment
provider integration, a Cloud Function to reconcile subscription status)
later.

## Tourism positioning (editorial prep only)

The public-listing notice (`lib/listingNotice.ts`) already includes the
guardrail this task asked for: it explicitly never claims any
government, council, or **tourism-board** affiliation, regardless of a
restaurant's `sourceType` or `dataConfidence`. No fake geolocation and no
tourism-specific UI (e.g. a "near tourist attractions" filter, a
multi-language tourist landing page) was built — those would need real
product scoping this task wasn't asked to do, beyond making sure the
notice copy doesn't accidentally imply an affiliation that doesn't exist.

## Why anonymous submission isn't supported

Both claims and correction/removal requests currently require sign-in.
Many review/reporting systems allow anonymous flagging; this implementation
doesn't, for the same reason the existing `reviews` collection requires
sign-in — it keeps a submitter identifiable to an admin reviewing the
queue, at the cost of requiring an account. If anonymous submission is
wanted later, the cleanest path is a Cloud Function proxy (so the function,
not the client, controls what gets written and can rate-limit/validate
server-side) rather than loosening the Firestore rule to allow anonymous
writes directly — that's a deliberate decision to record here rather than
silently leave undocumented.

## What this task did not do

- Did not build anonymous submission (see above).
- Did not build notifications (e.g. emailing the claimant when their claim
  is decided) — the UI shows a message only while the tab is open.
- Did not add rate-limiting on claim/request submission beyond what the
  rules structurally prevent (one pending claim per restaurant at a time).
