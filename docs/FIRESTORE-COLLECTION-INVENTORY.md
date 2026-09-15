# Firestore Collection Inventory

Written for: whoever decides the Firestore rules merge and the launch order. Every finding below was verified by reading the actual application code (this session's own review of `reviews`/`articles`/`recommendations`/`restaurants`/`restaurant_signups`/`users`, plus a dedicated file-by-file audit of every other collection) — nothing here is inferred or guessed. Where the code doesn't show a clear authorization pattern, that is stated explicitly rather than assumed.

**28 collections found**, covering both London Food Hubs (6, already in `firestore.rules`) and every SmartServeUK operational collection.

## How to read this table

- **Rules status**: `COVERED` (already in `firestore.rules`), `CONFIDENT` (a clear, consistent pattern exists in app code — a proposed rule is included in `firestore.rules`'s new "Confidently coverable" section), or `REQUIRES MANUAL POLICY DECISION` (app code shows no enforcement, or inconsistent/contradictory enforcement, for at least one access point — no rule is proposed, collection stays default-denied, and the specific decision needed is stated).
- "No check found in code" means exactly that — not "presumably fine," not "probably meant to be open." It means anonymous or any-authenticated-user access currently works against this collection through this page, in this codebase, today, regardless of what Firestore rules ultimately allow.

---

## Already covered (Task 1/2 from the previous session)

| Collection | Public read? | Rules status |
|---|---|---|
| `reviews` | Approved only | COVERED |
| `articles` | Published only | COVERED |
| `recommendations` | Active only | COVERED |
| `restaurants` | Active/pending only | COVERED |
| `restaurant_signups` | No (own + admin) | COVERED |
| `users` | No (own + admin) | COVERED |

---

## CONFIDENT — clear pattern found, rule proposed

### `staff`
- **Routes:** `app/staff/page.tsx`, `app/staff/new/page.tsx`, `app/staff/[id]/edit/page.tsx`
- **Pattern:** every access point is scoped to `ownerUid` (list query filters on it, create sets it, edit does a client-side `ownerUid` comparison after fetch). No page reads/writes the full collection unfiltered.
- **Gap:** no `canAccess()` role check anywhere — only "is signed in." Since every access point is still ownerUid-scoped, this is a data-isolation non-issue; it's a "should literally any authenticated role be able to manage staff" question, not a "can user A see user B's staff" question.
- **Proposed rule:** owner (`ownerUid == auth.uid`) or admin may read/write; no public access.

### `customers`
- **Routes:** `app/customers/page.tsx`, `app/customers/[id]/page.tsx`, `app/customers/find/page.tsx`, `app/events/new/EventForm.tsx`
- **Pattern:** every access point scoped to `bossUid`, consistently.
- **Proposed rule:** owner (`bossUid == auth.uid`) or admin may read/write; no public access.

### `events`
- **Routes:** `app/events/page.tsx`, `app/events/[id]/page.tsx` + `EventClient.tsx`, `app/events/new/EventForm.tsx`, `app/dashboard/page.tsx`, `app/dashboard.old/page.tsx`, `app/customers/[id]/page.tsx`
- **Pattern:** every access point queries or checks `bossUid`. `app/dashboard.old` and `app/dashboard` skip the `canAccess(["catering_house"])` role check but still filter by `bossUid`, so data isolation holds regardless — the gap is "should a customer-role account see this UI," a feature-appropriateness question, not a data-leak one. (`app/dashboard.old` also looks like unused legacy code, still present.)
- **Proposed rule:** owner (`bossUid == auth.uid`) or admin may read/write; no public access.

### `sales_signups`
- **Routes:** `app/sales-signup/page.tsx` (public create), `app/admin/page.tsx` (admin read, already gated with `useAdminGate()`)
- **Proposed rule:** public create (matches the intentional public lead-form design); read/update/delete admin-only.

### `blackcab_early_access`, `blackcab_bookings`, `blackcab_journey_ratings`, `blackcab_concerns`
- **Routes:** `app/blackcab/BlackCabContent.tsx` (public create, by design — no gate anywhere on that page), `app/admin/blackcab-leads/page.tsx` (reads `blackcab_early_access`)
- **Important gap found, NOT fixed here:** `app/admin/blackcab-leads/page.tsx` has **no authorization check in its code at all** — unlike every sibling admin page (`/admin/reviews`, `/admin/blog`, `/admin/recommendations`, `/admin/restaurant-signups`), it never calls `useAdminGate()`. This looks like a straightforward omission (the route is literally named `/admin/...` and handles customer PII), not an intentional design choice — but per this session's standing instruction not to alter BlackCab application code, **the missing gate was not added**. Recommend the site owner explicitly authorize that specific fix.
- **Proposed rule** (data-layer only, doesn't require touching any BlackCab file): public create on all four; read/update/delete admin-only. This closes the PII-read exposure at the data layer even without the app-code fix, and costs nothing to apply regardless of whether the app-code gate is ever added.

### `blackcab_signups`, `catering_house_signups`, `customer_signups`, `supplier_signups`
- **Routes:** their respective `app/signup/*/page.tsx` (public create-as-self, matching the `restaurant_signups` pattern already in `firestore.rules`). **No admin review UI reads any of these four** — confirmed via repo-wide search. They may be incomplete features (a review page was never built) or intentionally write-only records; either way, the create pattern itself is clear.
- **Proposed rule:** same shape as the existing `restaurant_signups` rule — create as self only, read self + admin, update/delete admin-only.

### `blackcabs`, `blackcab_drivers`
- **Routes:** only touched via `lib/auth.ts`'s `registerUser()`/`changePassword()` (both scoped to the caller's own uid) and `app/login/page.tsx`'s legacy role lookup (own uid only). No page anywhere lists, browses, or manages another user's document in these two collections.
- **Proposed rule:** self (`uid` equals the document id) or admin may read/write.

### `riderCorrectionLogs` (write side only — see REQUIRES DECISION for read)
- **Routes:** written from `app/orders/riders/page.tsx`, gated by `canAccess(["restaurant","staff"])`, always including an `ownerUid` field.
- **Proposed rule (create only):** signed-in restaurant/staff-role write requiring `request.resource.data.ownerUid == request.auth.uid` — matches the one consistent thing observable about this collection. Read is a separate, unresolved question (see below).

---

## REQUIRES MANUAL POLICY DECISION

For every collection below, staying at Firestore's default-deny (i.e., not adding a rule) is the safe default until the question is answered — that is the current state and this document does not change it.

### `orders` + `counters`
**Why undecidable from code alone:** genuinely mixed signals. Guest (unauthenticated) checkout is clearly intentional (`app/orders/new/page.tsx` explicitly branches for `creatorRole === "guest"`), and the order-tracking page (`app/orders/track/[token]/page.tsx`) is clearly meant to let anyone with the link read that one order by id (no auth code, uses the order id itself as the "token"). But `app/kitchen/page.tsx`, `app/orders/ready/page.tsx`, `app/orders/kitchen/page.tsx`, and `app/orders/search/page.tsx` all read or write the **entire, unfiltered** `orders` collection with **no authorization check of any kind** — no login requirement, no role check, nothing. `app/orders/delivery/page.tsx` requires login but no role. `counters/orders` is written by the same unauthenticated-guest-eligible checkout flow.
**Decision needed:** should kitchen/ready/search/delivery require staff/restaurant authentication (matching the ownerUid-scoping pattern used in `app/orders/board`, `app/orders/page.tsx`, `app/orders/rider*`)? If yes, those four pages need query/auth-code changes made *before* any tightened rule is deployed, or they break immediately. If the current wide-open behavior is intentional (e.g., these are meant to be shared kitchen-display screens on unauthenticated devices), that needs to be an explicit, documented decision, not a default.
**What's safe to deploy now regardless:** nothing — a rule permissive enough to keep the unscoped pages working would also make `orders` fully public; a rule that matches the scoped pages would break the unscoped ones. This has to be resolved in application code and rules together.

### `riders`
**Why undecidable:** `app/riders/page.tsx` does full unfiltered collection read **and** create/update/delete, with zero authorization code — directly contradicting the `ownerUid`-scoped pattern used consistently by `app/orders/delivery`, `app/orders/riders`, `app/orders/rider`, `app/orders/rider/new`. Also notable: `app/signup/rider/page.tsx` writes a **live** `riders/{uid}` document directly (status `pending_review`), not just the staging `rider_signups` collection — so the "signup requires approval" intent is itself undermined by the signup code.
**Decision needed:** is `app/riders/page.tsx` supposed to be an internal ownerUid-scoped tool (like the other rider pages) or a public directory? If internal, it needs an ownerUid filter added to its queries before any rule change. Separately: should rider self-signup stop writing the live collection directly, so approval is real?

### `rider_signups`
**Why undecidable:** create-by-self is clear and safe. But the review page (`app/orders/rider-signups/page.tsx`) reads the **entire** collection with `canAccess(["restaurant","staff"])` and **no per-restaurant filter** — meaning any restaurant/staff account today can see and approve/reject every rider application platform-wide, not just applications relevant to them.
**Decision needed:** is cross-restaurant visibility of rider applications intentional (e.g., riders are a shared platform resource, not restaurant-specific), or should this be scoped? Create-as-self is safe to formalize either way; the review-read scope is the open question.

### `suppliers`, `supplier_items`, `catering_houses`, `ingredients`
**Why undecidable:** `app/suppliers/page.tsx`, `app/cateringhouses/page.tsx`, and `app/ingredients/page.tsx` (plus `app/dashboard/ingredient-calculator/page.tsx` for ingredients) each do full unfiltered collection read **and** create/update/delete with **zero authorization code** — no login, no role, nothing. This is a different situation from `restaurants` (which has a real, if imperfect, ownership model) — these three/four collections never got one. `ingredients` specifically is additionally ambiguous at the data-model level: `app/dashboard/ingredients/page.tsx` treats it as a per-user (`bossUid`-scoped) collection, while the two wide-open pages treat it as a shared/global list — it's not clear from code whether these are two different logical uses colliding in one collection, or a shared master catalog that a per-user page happens to also filter.
**Decision needed:** for each of these four, is the intended model (a) a shared/global public-readable list, (b) an internal-staff-only tool that simply never got an auth check, or (c) — for `ingredients` specifically — two genuinely different concepts that should be split into two collections? None of these can be inferred from the code as written.

### `supplier_orders`
**Why undecidable:** written from an already-gated component, but the write itself (`{eventId, supplier, rows, total, message, sentVia, createdAt}`) **has no owner/bossUid field at all** — there is no data-model hook a rule could use to scope access even if a decision were made, without an application-code change to add one first.
**Decision needed:** add an owner field to this write before any rule beyond "must be signed in" can meaningfully scope it.

### `activity_logs`
**Why undecidable:** writes are `bossUid`-scoped (from `EventClient`'s event-logging calls). But `app/activity/page.tsx` reads the **entire** collection with **no filter and no authorization check at all** — every business's activity log, exposed to anyone.
**Decision needed:** should `app/activity/page.tsx` be scoped to the signed-in user's own `bossUid` (matching the write side), or admin-only? Write-side scoping (`bossUid == auth.uid`) is safe to formalize regardless of that answer; read is not.

---

## Cross-cutting finding: `app/create-account` bypasses every approval flow

`app/create-account/page.tsx` (a single, generic, unauthenticated-accessible form) offers seven roles — **restaurant, supplier, customer, rider, catering_house, blackcab, staff** — and calls `lib/auth.ts`'s `registerUser()`, which writes an immediately-`active` document **directly into the live collection** (`restaurants/{uid}`, `suppliers/{uid}`, etc.), with `status: "active"` and `isActive: true`, no admin review step, for every one of those roles.

This directly contradicts the dedicated approval-staging pattern (`restaurant_signups` → admin review → live `restaurants` doc) that this session's earlier work was built around and secured. A restaurant, supplier, rider, or catering-house account can bypass that entire flow simply by using `/create-account` instead of `/signup/restaurant` etc.

**Consequence for rules design:** `registerUser()`'s written document has **no `ownerUid` field** (it relies on the document's own id equaling the uid instead) — which means once the existing `restaurants` create rule (from the previous session, requiring `ownerUid == request.auth.uid`) is live, **a restaurant created through `/create-account` will fail to write and the account-creation call will roll back** (see `registerUser()`'s own catch block, which deletes the just-created Auth user on any write failure). This is arguably a correct outcome given the approval flow was meant to be mandatory for restaurants — but it is a behavior change worth confirming deliberately, not discovering after deployment.

**Decision needed:** either (a) remove the restaurant/supplier/rider/catering_house/blackcab/blackcab_driver options from `create-account`'s role picker, forcing the dedicated approval-gated signup pages for those roles, or (b) decide the bypass is acceptable and update `registerUser()` to set `ownerUid` consistently so the data model stays coherent. Neither change was made in this task — it's an application-code decision outside this task's Firestore/launch-safety scope, but it directly affects what "correct" rules behavior looks like for six collections, so it had to be surfaced here rather than silently worked around.

Also notable, same root cause: `app/signup/rider/page.tsx` and `app/signup/supplier/page.tsx` **each independently** write their own live collection document in addition to their staging collection — meaning riders and suppliers already had this problem via their own dedicated signup pages, not only via `create-account`.
