# Restaurant Claim & Correction/Removal Workflow

Status: implemented — `firestore.rules`, the claim/request UI, and the
admin review queue all exist and are described accurately below. Not
deployed (see `docs/SECURITY-FOLLOWUP.md` for the general "nothing is
deployed yet" context that applies to this whole repository).

**Task F (restaurant claiming + owner onboarding audit) extended this
without replacing it** — the state machine, collections, and core
security model below all predate Task F and were reused as-is. Task F's
additions: claimant contact fields at submission time (a name and a
business email an admin can actually act on, not just a bare uid),
admin-facing display of that contact info, ownership-state-aware UI
copy (an approved owner sees a distinct "you manage this listing"
state; a non-owner viewer of an already-claimed restaurant sees a
neutral notice instead of empty space; a claimant whose prior claim was
rejected sees that context before resubmitting), and additional
security tests. These are marked "(Task F)" below where relevant.

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

### Claimant contact information (Task F)

Originally, submitting a claim wrote nothing an admin could actually use
to reach the claimant beyond a bare Firebase uid. Task F added a small
contact/evidence form, collected once, at submission time:

| Field | Required? | Purpose |
|---|---|---|
| `claimantName` | Yes | Who an admin is actually talking to |
| `claimantContactEmail` | Yes | How an admin reaches them — pre-filled from the signed-in user's login email as a convenience, but editable (a business email may differ) |
| `claimantRole` | No | e.g. "Manager", "Owner" — context, not verified |
| `claimantContactPhone` | No | An alternative contact method |
| `claimantNote` | No | Free text — anything that helps an admin sanity-check the claim |

This is **not identity-document verification** — see "What this task did
not do" below. It's the minimum an admin needs to make a real decision
instead of approving or rejecting a bare uid.

### What submitting a claim actually writes

`components/restaurants/RestaurantClaimPanel.tsx` writes exactly:

```js
updateDoc(doc(db, "restaurants", restaurantId), {
  claimantUid: currentUser.uid,
  ownerClaimStatus: "claim_pending",
  claimSubmittedAt: serverTimestamp(),
  claimantName: "...",
  claimantRole: "...",
  claimantContactEmail: "...",
  claimantContactPhone: "...",
  claimantNote: "...",
});
```

The state-machine decisions driving what the UI offers (can this viewer
claim it right now? are they the approved owner? was a prior claim of
theirs rejected?) live in a small pure module,
`lib/restaurantClaim.ts`'s `deriveClaimViewerState()` and
`isClaimFormComplete()` — extracted out of the component specifically so
they could be unit tested without a browser or Firebase (Task F; see
`tests/restaurant-claim/run-claim-state-tests.ts`). This module is a
UI-convenience mirror of the state machine, **not** the security
boundary — it decides what button to show, not what write will succeed.

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
&& request.resource.data.claimantName is string
&& request.resource.data.claimantName.size() > 0
&& request.resource.data.claimantContactEmail is string
&& request.resource.data.claimantContactEmail.size() > 0
&& (!('claimantRole' in request.resource.data) || request.resource.data.claimantRole is string)
&& (!('claimantContactPhone' in request.resource.data) || request.resource.data.claimantContactPhone is string)
&& (!('claimantNote' in request.resource.data) || request.resource.data.claimantNote is string)
&& unchanged('ownerUid')
&& request.resource.data.diff(resource.data).affectedKeys()
     .hasOnly([
       'claimantUid', 'ownerClaimStatus', 'claimSubmittedAt', 'updatedAt',
       'claimantName', 'claimantRole', 'claimantContactEmail',
       'claimantContactPhone', 'claimantNote'
     ])
```

Things this specifically prevents, each with a test in
`tests/firestore-rules/rules.test.js` (**unexecuted** — see
`docs/FIRESTORE-SECURITY-AUDIT.md`; Java is unavailable in this
environment, so these are reviewed-but-unrun, same as every other rules
test in this repository):

- **Setting `ownerUid` in the same write** — `unchanged('ownerUid')` blocks
  it outright, independent of anything else in the write.
- **Self-approval via a separate write** — a claimant with a pending claim
  cannot later send a second, standalone write setting `ownerUid`: the
  owner-update branch requires `ownerUid == auth.uid` (still empty), and
  the claim-submission branch requires the *starting* status to be
  `unclaimed`/`claim_rejected` (it's `claim_pending` by then), so neither
  branch matches (Task F).
- **A real, approved owner of a *different* restaurant approving someone
  else's claim** — being a genuine owner elsewhere grants no special
  capability here; only `isAdmin()` can set `ownerUid` (Task F).
- **Smuggling an edit alongside the claim** — `diff().affectedKeys().hasOnly([...])`
  means the write can *only* touch the claim-related fields listed above;
  adding `shortDescription` or any other field to the same update fails.
  This also covers a pending claimant trying to edit unrelated fields in a
  *separate* write later — the claim-submission branch's starting-state
  check blocks that the same way self-approval is blocked (Task F).
- **Impersonating another user's claim** — `claimantUid` must equal
  `request.auth.uid`; a user cannot submit a claim naming someone else as
  the claimant.
- **Reassigning `claimantUid` on an already-pending claim** — once status
  is `claim_pending`, no rule branch permits any further change to
  `claimantUid` at all (the claim-submission branch's starting-state gate
  excludes `claim_pending`, and the owner-update branch requires an
  `ownerUid` that doesn't exist yet) (Task F).
- **Missing required contact fields** — a claim submission without a
  non-empty `claimantName` and `claimantContactEmail` fails outright
  (Task F).
- **An unauthenticated (anonymous) claim submission** — every branch of
  the claim-submission rule requires `isSignedIn()` (Task F test added for
  this specific scenario; the requirement itself predates Task F).

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
`claim_rejected` is in the allowed starting-state list). Rejection never
touches `ownerUid` — it stays exactly as it was (empty, for a first-time
claim), so a rejected claimant has exactly the same (lack of) management
access as before they claimed anything; the same `ownerUid`-based owner
gate on the restaurant document's `update` rule is what keeps them out,
not anything specific to the rejection itself (Task F test:
`tests/firestore-rules/rules.test.js`'s "lets an admin reject a claim, and
rejection does not grant ownerUid access").

### Viewer-facing states on the restaurant detail page (Task F)

`RestaurantClaimPanel.tsx` shows one of five states, computed by
`deriveClaimViewerState()`:

1. **Signed-in viewer IS the approved owner** (`ownerUid == their uid`) —
   "You manage this listing" plus a link to the restaurant's edit page.
2. **Restaurant has a different approved owner** — a neutral "This listing
   is managed by its verified owner" notice. No claim action is offered;
   this deliberately does not encourage a normal ownership claim against
   an already-claimed listing (a correction/removal request is still
   available, same as for any restaurant).
3. **Unclaimed, no claim pending** — the claim form (name, business email
   required; role, phone, note optional).
4. **Unclaimed, a claim is already pending** (from anyone, including the
   current viewer) — "under review" message, no form.
5. **Unclaimed, the most recent claim was rejected** — the claim form is
   shown again (a fresh claim is allowed), preceded by a note that the
   previous attempt wasn't approved, so the claimant knows to add more
   detail rather than resubmitting the same information.

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

## Three separate concepts, easy to conflate (Task F)

This repository has three distinct "someone wants to change something
about a restaurant listing" flows. They are separate on purpose and must
stay separate:

| | Ownership claim | Correction/removal request | Content translation request |
|---|---|---|---|
| **What it changes** | Who controls the listing (`ownerUid`) | Nothing automatically — a human admin makes the edit by hand afterward | Nothing until `PUBLISHED` — even then, only `RestaurantDoc.contentTranslations`, never the original |
| **Where it lives** | Inline on `restaurants/{id}` (`ownerClaimStatus`, `claimantUid`, ...) | Separate collection, `restaurant_correction_requests` | Separate collection, `restaurant_translation_requests` |
| **Who can submit** | Any signed-in user, for a currently-unclaimed listing | Any signed-in user, about any listing | Only the restaurant's own approved owner (`ownerUid` cross-checked via `get()`) |
| **Outcome states** | `unclaimed → claim_pending → claimed` / `claim_rejected` | `pending → accepted` / `rejected` | `REQUESTED → QUOTED → PAYMENT_PENDING → IN_TRANSLATION → OWNER_REVIEW → PUBLISHED` / `CANCELLED` |
| **Documented in** | This file | This file | `docs/MULTILINGUAL-ARCHITECTURE.md` |

A claim decides *who* manages a listing. A correction/removal request
flags that *something about the listing's facts* is wrong. A translation
request is *only available to an already-approved owner* and concerns
*how their own content is presented in other languages* — see
`docs/MULTILINGUAL-ARCHITECTURE.md`'s translation policy for why
restaurant-supplied content is never auto-translated. None of the three
can be used to accomplish what another one is for — e.g. there is no way
to use a correction request to grant ownership, and no way to use a
translation request to change a restaurant's factual details.

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
- **(Task F)** Did not build identity-document verification, business
  registration checks, or any automated verification of a claimant's
  contact details — an admin reviews the submitted name/email/role/note
  and uses their own judgement, exactly as before Task F, just now with
  more to go on than a bare uid.
- **(Task F)** Did not build ownership transfer or revocation — there is
  no UI or rule allowing an admin to move an already-`claimed` restaurant
  to a different owner, or to reset a claimed restaurant back to
  unclaimed. The existing `isAdmin()` branch is technically capable of
  it (an admin can write any field), but no dedicated workflow, audit
  trail, or UI button exists for it, and none was requested. If this is
  ever needed, it deserves its own explicit design (audit logging,
  probably a confirmation step, notice to the outgoing owner) rather than
  an ad hoc admin Firestore write.
- **(Task F)** Did not verify the claim-related Firestore rules or their
  tests against the real emulator — Java remains unavailable in this
  environment; every claim in this document about what the rules
  "prevent" is a static reading of the rules language plus a
  reviewed-but-unexecuted test, not an observed result. See
  `docs/FIRESTORE-SECURITY-AUDIT.md`.
- **(Task F)** Did not change the claim state machine's shape (still
  `unclaimed → claim_pending → claimed`/`claim_rejected`) — only extended
  what data travels with a claim submission and how the UI presents each
  state. No new collection was introduced for claims; the existing
  inline-on-`restaurants` model was reused throughout.
