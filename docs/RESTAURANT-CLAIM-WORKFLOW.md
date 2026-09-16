# Restaurant Claim & Correction/Removal Workflow

Status: implemented — `firestore.rules`, the claim/request UI, and the
admin review queue all exist and are described accurately below. Not
deployed (see `docs/SECURITY-FOLLOWUP.md` for the general "nothing is
deployed yet" context that applies to this whole repository).

**Task F (restaurant claiming + owner onboarding audit) extended this
without replacing it** — the state machine and core security model below
predate Task F and were reused as-is. Task F's additions: claimant
contact fields at submission time (a name and a business email an admin
can actually act on, not just a bare uid), admin-facing display of that
contact info, ownership-state-aware UI copy (an approved owner sees a
distinct "you manage this listing" state; a non-owner viewer of an
already-claimed restaurant sees a neutral notice instead of empty space;
a claimant whose prior claim was rejected sees that context before
resubmitting), and additional security tests. These are marked "(Task F)"
below where relevant.

**Task K (production-readiness fix) moved claimant identity/contact data
off the public `restaurants/{id}` document into a new, private
`restaurant_claims` collection** — a real privacy defect Task J's audit
found: that data was previously stored inline on the restaurant document,
which is publicly readable for any active/pending restaurant (Firestore
has no field-level rules — the whole document or nothing), so it was
retrievable by any unauthenticated Firestore client despite never being
rendered by any UI. **The claim state machine, `ownerUid`-as-sole-
authority principle, and every other architectural decision below are
unchanged** — this was a data-location fix, not a redesign. See
`docs/PRODUCTION-READINESS-AUDIT.md`'s "J-01" for the original finding.
Marked "(Task K)" below where relevant.

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

## Two collections, one public status field, one admin queue (Task K)

1. **Ownership claims — split across a public field and a private
   collection:**
   - `restaurants/{id}.ownerClaimStatus` — the restaurant's overall,
     public claim-workflow phase (`unclaimed` / `claim_pending` /
     `claimed` / `claim_rejected`). This is the only claim-related field
     that remains on the public document — see "Public workflow state vs.
     private claimant data" below.
   - `restaurant_claims/{claimId}` — the private record of one individual
     claim (`RestaurantClaimDoc` in `lib/types.ts`): `restaurantId`,
     `claimantUid`, `claimantName`, `claimantContactEmail`,
     `claimantRole`, `claimantContactPhone`, `claimantNote`, its own
     `status` (`pending` / `approved` / `rejected`), and the decision
     audit trail (`submittedAt`, `decidedAt`, `decidedBy`). Never publicly
     readable — only the claimant themselves or an admin.
2. **Correction/removal requests** — a separate collection,
   `restaurant_correction_requests` (`RestaurantCorrectionRequestDoc` in
   `lib/types.ts`), because these are a moderation-queue item *about* a
   restaurant, not a change *to* it. Unchanged by Task K.

Both claim and correction/removal review happen from one page,
`app/admin/restaurant-claims/page.tsx`.

## Public workflow state vs. private claimant data (Task K)

This is the central distinction Task K's fix depends on, and the one to
preserve in any future change to this workflow:

| | Lives where | Contains | Who can read it |
|---|---|---|---|
| **Public workflow state** | `restaurants/{id}.ownerClaimStatus` | One of 4 enum values — nothing about *who* claimed it or *why* | Anyone (same audience as the rest of the restaurant document) |
| **Private claimant data** | `restaurant_claims/{claimId}` | The claimant's name, business email, phone, role, note, and the admin decision audit trail | Only the claimant themselves, or an admin |

A restaurant document showing `ownerClaimStatus: "claim_pending"` tells a
customer "a claim is under review" without telling them, or anyone else
with a Firestore client, *who* submitted it or *how to reach them*. That
second half of the information only ever lives in the private collection.
`firestore.rules` also structurally guarantees (via
`restaurantDocHasNoClaimantPii()`) that none of the 9 retired
claimant-PII field names can ever be written back onto the restaurant
document by any path — owner profile edits, restaurant creation, or
otherwise — not merely "the current UI doesn't send them."

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

### What submitting a claim actually writes (Task K: two documents, one batch)

`components/restaurants/RestaurantClaimPanel.tsx` writes both documents
in a single Firestore `WriteBatch` — atomic (both succeed or neither
does):

```js
const batch = writeBatch(db);
batch.update(doc(db, "restaurants", restaurantId), {
  ownerClaimStatus: "claim_pending",
  updatedAt: submittedAt,
});
batch.set(doc(collection(db, "restaurant_claims")), {
  restaurantId,
  claimantUid: currentUser.uid,
  claimantName: "...",
  claimantRole: "...",
  claimantContactEmail: "...",
  claimantContactPhone: "...",
  claimantNote: "...",
  status: "pending",
  submittedAt,
});
await batch.commit();
```

The restaurant document's own write is now the smallest it can be — one
field (`ownerClaimStatus`) plus `updatedAt`. Before Task K it also carried
every claimant field directly; see "The vulnerability Task K fixed" below.

The state-machine decisions driving what the UI offers (can this viewer
claim it right now? are they the approved owner? was a prior claim of
theirs rejected?) live in a small pure module,
`lib/restaurantClaim.ts`'s `deriveClaimViewerState()` and
`isClaimFormComplete()` — extracted out of the component specifically so
they could be unit tested without a browser or Firebase (Task F; see
`tests/restaurant-claim/run-claim-state-tests.ts`). This module is a
UI-convenience mirror of the state machine, **not** the security
boundary — it decides what button to show, not what write will succeed,
and it was **not changed by Task K**: it only ever read `ownerUid`/
`ownerClaimStatus`, both of which remain public exactly as before.

### The vulnerability Task K fixed

Before Task K, the claim-submission rule branch wrote every claimant field
directly onto `restaurants/{id}`, and — because that document is publicly
readable for any `active`/`pending` restaurant, and Firestore has no
field-level rules — those fields were retrievable by any unauthenticated
client via a direct `getDoc()`/`getDocs()` call, **even though no page in
this application ever rendered them.** Worse, the fields were never
cleared: rejecting a claim explicitly kept `claimantUid` "in place as an
audit trail," and approving one never cleared the earlier claimant
fields either. Any restaurant that had ever had a claim attempt —
approved, rejected, or simply pending — carried that claimant's real name,
business email, and phone number in its public document, permanently.
See `docs/PRODUCTION-READINESS-AUDIT.md`'s "J-01" for the full original
writeup, and `tests/restaurant-claim/run-pii-boundary-tests.ts` for the
regression guard that now fails automatically if this ever reappears.

### How `firestore.rules` enforces this independently of the UI

The security boundary is the rules file, not the component — a malicious
client could send any Firestore write it wants, so the rule has to be the
real guard. Two rule blocks now cooperate, each independently validated
(neither trusts the client to have sent a consistent batch):

**`restaurants/{restaurantId}`'s claim-submission branch** (status only):

```
isSignedIn()
&& resource.data.get('ownerUid', '') == ''
&& resource.data.get('ownerClaimStatus', 'unclaimed') in ['unclaimed', 'claim_rejected']
&& request.resource.data.ownerClaimStatus == 'claim_pending'
&& unchanged('ownerUid')
&& request.resource.data.diff(resource.data).affectedKeys().hasOnly(['ownerClaimStatus', 'updatedAt'])
```

**`restaurant_claims/{claimId}`'s create rule** (the private record):

```
isSignedIn()
&& request.resource.data.claimantUid == request.auth.uid
&& request.resource.data.status == 'pending'
&& request.resource.data.restaurantId is string
&& request.resource.data.restaurantId.size() > 0
&& request.resource.data.claimantName is string
&& request.resource.data.claimantName.size() > 0
&& request.resource.data.claimantContactEmail is string
&& request.resource.data.claimantContactEmail.size() > 0
&& (!('claimantRole' in request.resource.data) || request.resource.data.claimantRole is string)
&& (!('claimantContactPhone' in request.resource.data) || request.resource.data.claimantContactPhone is string)
&& (!('claimantNote' in request.resource.data) || request.resource.data.claimantNote is string)
&& !('decidedAt' in request.resource.data)
&& !('decidedBy' in request.resource.data)
&& get(/databases/$(database)/documents/restaurants/$(request.resource.data.restaurantId)).data.get('ownerUid', '') == ''
&& get(/databases/$(database)/documents/restaurants/$(request.resource.data.restaurantId)).data.get('ownerClaimStatus', 'unclaimed') in ['unclaimed', 'claim_rejected']
```

Things this specifically prevents, each with a test in
`tests/firestore-rules/rules.test.js` (**emulator-verified as of Task L** —
run 2026-09-16 against a local Firestore emulator, 105/105 tests passed
including every case listed below; see `docs/FIRESTORE-SECURITY-AUDIT.md`
and the "Task L" status note below for the full run detail — still not
deployed to any production Firebase project):

- **Setting `ownerUid` in the same write** — `unchanged('ownerUid')` blocks
  it outright, independent of anything else in the write.
- **Self-approval via a separate write** — a claimant with a pending claim
  cannot later send a second, standalone write setting `ownerUid`: the
  owner-update branch requires `ownerUid == auth.uid` (still empty), and
  the claim-submission branch requires the *starting* status to be
  `unclaimed`/`claim_rejected` (it's `claim_pending` by then), so neither
  branch matches (Task F). Separately, the claimant has **no update path
  at all** to their own claim record — `restaurant_claims`' `update` rule
  is admin-only (Task K).
- **A real, approved owner of a *different* restaurant approving someone
  else's claim** — being a genuine owner elsewhere grants no special
  capability here; only `isAdmin()` can set `ownerUid` (Task F).
- **Smuggling an edit alongside the claim** — the restaurant-side write's
  `diff().affectedKeys().hasOnly([...])` means it can *only* touch
  `ownerClaimStatus`/`updatedAt`; adding `shortDescription` or any other
  field fails. This also covers a pending claimant trying to edit
  unrelated fields in a *separate* write later — the claim-submission
  branch's starting-state check blocks that the same way self-approval is
  blocked (Task F).
- **Impersonating another user's claim** — the claim record's
  `claimantUid` must equal `request.auth.uid`; a user cannot submit a
  claim naming someone else as the claimant.
- **Reassigning `claimantUid`/`restaurantId` on an existing claim
  record** — the claimant has no update path at all (Task K); even an
  admin's update is pinned (`unchanged('restaurantId')` and
  `unchanged('claimantUid')`).
- **Missing required contact fields** — a claim record without a
  non-empty `claimantName` and `claimantContactEmail` fails outright.
- **An unauthenticated (anonymous) claim submission** — both rule
  branches require `isSignedIn()`.
- **Competing/duplicate claims** — a claim record's create rule
  cross-checks the target restaurant's *current* `ownerUid`/
  `ownerClaimStatus` via `get()`, the same starting-state requirement the
  sibling restaurant-document write enforces — a second claim record
  cannot be created while one is already `pending`, or once the
  restaurant has an owner (Task K).
- **A real restaurant owner reading someone else's claim record for their
  own restaurant, merely by being the owner** — `restaurant_claims`' read
  rule scopes strictly to `resource.data.claimantUid == request.auth.uid`
  (or admin); ownership of the restaurant the claim concerns grants no
  special access (Task K).
- **Claimant PII reappearing on the restaurant document via any other
  write path** (a normal owner profile edit, or restaurant creation) —
  `restaurantDocHasNoClaimantPii()` structurally blocks all 9 retired
  field names on both the `create` and owner-`update` branches, not just
  the (removed) claim-submission field list (Task K).

### How a claim is approved (Task K: a batch, same trust model)

**No new Cloud Function was added for this.** The existing `isAdmin()`
branches on both the `restaurants` update rule and the
`restaurant_claims` update rule are already unrestricted for admins (an
admin, gated by a Firebase Auth custom claim — never the client-writable
`users/{uid}.role` field — may already write any field either allows).
`app/admin/restaurant-claims/page.tsx` is a normal admin-gated page
(`useAdminGate`, same pattern as `app/admin/recommendations/page.tsx`)
that, on "Approve", performs both writes in one batch as the authenticated
admin:

```js
const batch = writeBatch(db);
batch.update(doc(db, "restaurants", claim.restaurantId), {
  ownerUid: claim.claimantUid,
  ownerClaimStatus: "claimed",
});
batch.update(doc(db, "restaurant_claims", claim.id), {
  status: "approved",
  decidedAt: serverTimestamp(),
  decidedBy: adminUid,
});
await batch.commit();
```

This is the **only** place in the application that ever sets `ownerUid`
from a claim's `claimantUid`. No client-writable path exists from
`claimantUid` to `ownerUid` — the rules above make that structurally
impossible, not just discouraged by the UI.

"Reject" batches `restaurants/{id}.ownerClaimStatus: "claim_rejected"`
with `restaurant_claims/{claimId}.status: "rejected"` (plus `decidedAt`/
`decidedBy` on the claim record only — that audit trail no longer touches
the restaurant document at all). The claim record itself is never
deleted, and its `claimantUid` stays in place as an audit trail readable
only by that claimant and admins — the rule permits a fresh claim
afterward since `claim_rejected` is in the allowed starting-state list.
Rejection never touches `ownerUid` — it stays exactly as it was (empty,
for a first-time claim), so a rejected claimant has exactly the same
(lack of) management access as before they claimed anything; the same
`ownerUid`-based owner gate on the restaurant document's `update` rule is
what keeps them out, not anything specific to the rejection itself (test:
`tests/firestore-rules/rules.test.js`'s "lets an admin reject a claim, and
rejection does not grant ownerUid access (restaurant-doc side)").

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
| **Where it lives** | Public status on `restaurants/{id}.ownerClaimStatus` + a private record in `restaurant_claims/{claimId}` (Task K) | Separate collection, `restaurant_correction_requests` | Separate collection, `restaurant_translation_requests` |
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

## Multi-document consistency (Task K)

Submission, approval, and rejection each touch two documents
(`restaurants/{id}` and `restaurant_claims/{claimId}`). All three use a
Firestore `WriteBatch`, not two independent `updateDoc`/`setDoc` calls —
batches are atomic (all writes succeed or none do), so there is no
window where one document reflects a claim decision and the other
doesn't. This was a deliberate choice, not an assumption: two sequential,
unbatched client writes would not have this guarantee (a network failure
between them could leave the restaurant `claim_pending` forever with no
claim record, or vice versa).

**What batching does not guarantee**: nothing forces the client to
*always* send both halves together. A signed-in user could, in principle,
call `updateDoc()` on the restaurant document alone (setting
`ownerClaimStatus: "claim_pending"`) without ever creating a matching
`restaurant_claims` record — each half's rule is validated independently
and neither can see "what else is in this batch." The practical effect of
doing that: the restaurant would show "claim under review" with no real
claim behind it for an admin to review or reject, blocking further claims
until an admin manually resets it — an availability/annoyance issue, not
a privilege-escalation or data-exposure one (no ownership is ever
granted, and no one's PII is exposed). This residual gap was considered
and accepted rather than solved with a more complex `getAfter()`-based
cross-document rule, to keep this fix bounded — see
docs/PRODUCTION-READINESS-AUDIT.md for the reasoning.

## Legacy data / migration (Task K)

**No production Firestore data was ever accessed, modified, or migrated
as part of this fix.** This fix only changes what NEW claim submissions
write going forward. If any restaurant document in a real deployment
already carries the old inline claimant fields (from before this fix, in
an environment where these rules and this UI were ever actually live),
those fields would still be present on that document and still publicly
retrievable — this fix does not retroactively clean up existing data.

Cleaning that up would need a script that:

- Reads every `restaurants/{id}` document that has any of the 9 retired
  claimant-PII field names present.
- For each one, if `claimantUid`/`claimantName`/`claimantContactEmail`
  data represents a real, meaningful claim record (i.e. `ownerClaimStatus`
  is `claim_pending`, `claimed`, or `claim_rejected` and a claimant uid is
  present), writes an equivalent `restaurant_claims` document preserving
  that history, then removes the old fields from the restaurant document.
- Otherwise, simply removes the old fields.

**No such script exists yet — this is a documented requirement, not
implemented this task**, since London Food Hubs has no production data
(nothing has ever been imported — see `docs/RESTAURANT-IMPORT-PIPELINE.md`)
and this codebase has never been deployed, so there is no live restaurant
document anywhere that could actually carry the old fields today. If a
migration script is written later, it must (matching every other
production-adjacent script in this repository): default to dry-run,
require an explicit `--apply` flag to write anything, require an explicit
`--project` matching the intended Firebase project, and never run
automatically as part of `npm install`/`build`/`start`/any deploy step.

## What this task did not do

- Did not build anonymous submission (see above).
- Did not build notifications (e.g. emailing the claimant when their claim
  is decided) — the UI shows a message only while the tab is open.
- Did not add rate-limiting on claim/request submission beyond what the
  rules structurally prevent (one pending claim per restaurant at a time).
- **(Task K)** Did not access, modify, or migrate any production Firebase
  data — see "Legacy data / migration" above.
- **(Task K)** Did not deploy the updated `firestore.rules` — still local,
  still unapproved for deployment (unchanged status from Task E).
- **(Task K, superseded by Task L)** Task K itself did not verify the
  new/updated rules against a real Firestore emulator (Java was
  unavailable at the time). **Task L has since done this**: a local JDK
  was installed for this purpose only, and the complete suite —
  including the `restaurant_claims` describe block — ran against a real
  local Firestore emulator on 2026-09-16, 105/105 passed. Every claim in
  this document about what the rules "prevent" is now an observed,
  emulator-confirmed result, not a static reading. **This is still local
  verification, not production deployment** — `firestore.rules` has not
  been deployed to any real Firebase project. See
  `docs/PRODUCTION-READINESS-AUDIT.md`'s "J-01"/"J-02" and
  `docs/FIRESTORE-SECURITY-AUDIT.md` for the exact command and result.
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
  **(Superseded by Task K, above:** a new collection,
  `restaurant_claims`, *was* introduced later, specifically to hold
  claimant PII outside the public document. The state machine's shape
  itself — `unclaimed → claim_pending → claimed`/`claim_rejected` on
  `ownerClaimStatus` — is still exactly what Task F describes here; only
  *where the claimant's own data lives* changed.)
