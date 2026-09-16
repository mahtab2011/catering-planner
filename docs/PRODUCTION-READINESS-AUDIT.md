# Production Readiness & Launch-Gate Audit — Task J

Written for: whoever decides when London Food Hubs is safe to launch on
`londonfoodhubs.com` via Hostinger. This is a repository-level audit —
nothing was deployed, pushed, or connected to any production system while
producing it. It answers one question: **what exactly prevents this
application from being safely launched today**, classified so a real
decision can be made rather than guessed at.

**Read this alongside the documents it builds on rather than instead of
them**: `docs/HOSTINGER-DEPLOYMENT.md` (deployment mechanics),
`docs/FIRESTORE-SECURITY-AUDIT.md` (Task E's rules audit),
`docs/RESTAURANT-CLAIM-WORKFLOW.md`, `docs/RESTAURANT-OWNER-WORKSPACE.md`,
`docs/RESTAURANT-DISCOVERY.md`, `docs/ADMIN-OPERATIONS.md` (Tasks F–I).
This document does not repeat their full detail — it audits their
conclusions against the current codebase and adds what they didn't cover.

## Checkpoint

Starting HEAD `23ed8bb5e8383be2b2cb6d707b179e261c7eafe5`, branch `main`,
working tree clean, 52 commits ahead of `origin/main` (none pushed by this
task). See the final report for the ending HEAD.

---

## STATUS UPDATE (Task K) — read this before the rest of this document

**J-01's architecture has been fixed. J-01's rules are NOT yet verified.
These are two different claims — do not conflate them.**

Task K (a follow-up task after this audit) moved claimant PII off the
public `restaurants/{id}` document into a new, private `restaurant_claims`
collection, with `firestore.rules` updated to enforce the new boundary and
to structurally block the 9 retired field names from ever reappearing on
the restaurant document via any write path. Full detail:
`docs/RESTAURANT-CLAIM-WORKFLOW.md`. What changed concretely:

- **PII architecture**: fixed. The data no longer lives where it can be
  publicly read. Confirmed by a repository-wide search, a new static test
  suite (`tests/restaurant-claim/run-pii-boundary-tests.ts`, executed,
  5/5 passing), and updated Firestore rules tests (written, reviewed).
- **Firestore rules verification**: **still not done.** Java remains
  unavailable in this environment; the updated rules — including the new
  `restaurant_claims` collection and the `restaurantDocHasNoClaimantPii()`
  guard — have **never executed against a real Firestore rules engine**.
  J-02's finding (rules unverified) is unchanged and now also covers the
  new collection.
- **J-01's severity in the table below is left as originally recorded**
  (P0) rather than silently downgraded — the architecture fix is real and
  significant, but "not yet verified against the actual rules engine" is
  reason enough to keep this a launch blocker until that verification
  happens, consistent with J-02's own standing concern. See
  `docs/RESTAURANT-CLAIM-WORKFLOW.md`'s "What this task did not do" for
  the precise, current status.

## The one finding that matters most: claimant PII is publicly retrievable

**Before anything else in this document: a restaurant's claimant contact
details — full name, business email, phone number, free-text verification
note — are retrievable by any unauthenticated Firestore client for any
restaurant that has ever had an ownership claim submitted, including a
**rejected** one, even though no page in this application ever renders
them.**

This is real, not theoretical. Trace it directly:

1. `firestore.rules`' `restaurants/{restaurantId}` read rule:
   `allow read: if resource.data.status in ['active', 'pending'] ||
   isAdmin() || ...` — any `active`/`pending` restaurant's **entire
   document** is readable by anyone, signed in or not. Firestore has no
   field-level rules; a document is either fully readable or not.
2. `claimantUid`, `claimantName`, `claimantRole`, `claimantContactEmail`,
   `claimantContactPhone`, `claimantNote`, `claimDecidedBy`,
   `claimSubmittedAt`, `claimDecidedAt` all live **inline on the
   `restaurants/{id}` document itself** (Task F's design — see
   `docs/RESTAURANT-CLAIM-WORKFLOW.md`), not in a separate,
   protected collection.
3. **None of these fields are ever cleared.** Rejecting a claim sets
   `ownerClaimStatus: 'claim_rejected'` and explicitly *keeps*
   `claimantUid` "in place as an audit trail" (the doc's own words).
   Approving a claim sets `ownerUid`/`ownerClaimStatus`/`claimDecidedAt`/
   `claimDecidedBy` but does not clear `claimantName`/
   `claimantContactEmail`/`claimantContactPhone`/`claimantNote` either.
   A restaurant with even one past claim attempt — pending, approved, or
   rejected — keeps that claimant's contact details on the document
   permanently, and the restaurant is very likely to be `active`/`pending`
   (publicly readable) at the same time, since claiming and public
   visibility are independent facts.
4. No UI renders these fields publicly (confirmed by direct code
   inspection of the restaurant detail page, cards, and discovery
   components, and reconfirmed by Task I's static test that the general
   admin overview doesn't render them either) — but **UI non-rendering is
   not a security boundary.** Anyone with browser devtools, or a five-line
   script using this app's own public Firebase client config (which is
   *meant* to be public — it identifies the project, not a secret), can
   call `getDoc()` on any restaurant and read these fields directly.

**Why this is P0, not P1**: this is not a hypothetical edge case — it's
the direct, designed consequence of where Task F chose to store claim
data, and it affects every restaurant that has ever been claimed
(successfully or not), which for a functioning marketplace is expected to
be most active listings over time. It exposes real personal data (name,
email, phone) collected for one narrow purpose (admin verification of a
claim) to the entire public internet, permanently, with no way for the
person to know or consent. This is a genuine data-protection problem for
a UK-facing consumer product, not a cosmetic or theoretical one.

**Why the existing rules test suite would not catch this**: the 83
existing Firestore rules tests (unexecuted — see "Firestore launch gate"
below) validate *authorization* ("can user X write field Y") — none of
them assert that a *publicly readable* document's *contents* exclude
sensitive fields, because that's a different class of check. Even once
Java is available and every existing test passes, this specific issue
would remain unless a new test (and a fix) is added for it.

**What fixing this would require** (documented, not implemented — this
does not meet Phase 25's "tiny/bounded, no schema migration" bar): either
(a) move claimant contact fields off the `restaurants` document into a
separate collection readable only by the claimant and admins (mirroring
the pattern already used for `restaurant_correction_requests` and
`restaurant_translation_requests`), or (b) clear/redact the fields once a
claim is decided, or (c) restrict what the public read rule returns —
Firestore's actual mechanism for that is a schema split, not a rule
tweak, since rules can't do field-level filtering. Any of these is a real
design decision affecting the claim workflow's data model and would need
its own scoped task, careful migration thinking for any already-submitted
claims, and — like every other rules change in this project — a verified
run against the (currently unavailable) emulator before deployment.

---

## Launch-gate matrix

| ID | Area | Finding | Severity | Why it matters | Required action | Can fix locally? | Verification required |
|---|---|---|---|---|---|---|---|
| J-01 | Data privacy / Firestore | Claimant PII (name/email/phone/note) permanently retrievable on any publicly-readable restaurant document, including after claim rejection. **Architecture fixed (Task K)** — data moved to a private `restaurant_claims` collection; rules updated. **Emulator verification still outstanding.** | **P0** (kept — see "Status update" above) | Real personal data exposed to the public internet indefinitely; see full writeup above | ~~Redesign claim-data storage~~ done (Task K) — remaining: emulator-verified tests | Done (architecture); emulator run still needs Java | Emulator rules tests + manual query verification — **not yet run** |
| J-02 | Firestore rules deployment | `firestore.rules` (622 lines, 83 test cases) has never executed against a real rules engine (Java unavailable); two rule changes (Task F, Task G) have accumulated since Task E's audit and are also unverified | **P0** for *deploying rules* specifically (not for reading this repo) — see "Firestore launch gate" below for the application-vs-rules-deployment distinction | Deploying unverified security rules to production risks either silently blocking legitimate operations or silently allowing something unintended | Install Java (or use any environment with it) and run the full suite; fix any failures; re-run after J-01's fix | No — requires Java, out of this task's scope | `cd tests/firestore-rules && npm install && npx firebase-tools emulators:exec --only firestore "npm test"` |
| J-03 | Legal/compliance content | `/privacy-policy` and `/terms` are literal placeholders ("SmartServeUK privacy policy will be updated here.") linked from every London Food Hubs page's footer | **P0** | A live consumer marketplace collecting accounts, reviews, claims, and business contact data with no real privacy policy or terms is a genuine compliance gap, not a cosmetic one | Legal/business decision + real content — outside this task's authority to write | No — business/legal content decision | Human legal review |
| J-04 | Firebase Auth | `londonfoodhubs.com` (and `www.londonfoodhubs.com`) are not yet on Firebase Auth's "Authorized domains" allowlist (external Firebase console setting, confirmed not repo-managed) | **P0** for auth-dependent features on the new domain | Sign-in/sign-up/claim/owner-workspace will fail on the new domain until this is added — Firebase Auth rejects unauthorized origins regardless of correct client config | Add the domain in Firebase console once DNS is live | No — external Firebase console action | Manual sign-in test on the live domain post-deploy |
| J-05 | Dependencies | `xlsx` (direct dependency): prototype pollution + ReDoS, **no upstream fix available** | P1 | Current usage is export-only (`json_to_sheet`/`writeFile`, confirmed by code search — never parses untrusted uploaded files), which meaningfully reduces real exploitability, but the vulnerable code ships regardless | Accept documented risk, or evaluate replacing `xlsx` for export-only use, as a deliberate decision | Not without a dependency change (out of scope here) | N/A — risk-acceptance decision |
| J-06 | Dependencies | `websocket-driver` (critical) and `protobufjs` (critical/moderate) vulnerabilities — both transitive via the `firebase` package (Realtime Database's websocket client, Firestore's gRPC proto loader); fixes available via plain `npm audit fix` | P1 | This app never uses Realtime Database, so `websocket-driver`'s vulnerable code path is very likely unreachable in practice; still worth clearing since a fix exists with no breaking change | Run `npm audit fix` (non-`--force`) in a dedicated, tested change — not done in this audit per "no dependency changes" scope | Yes, narrowly | `npm run build` + full regression after |
| J-07 | Dependencies | `sharp` (high) — transitive via `next` itself; fix requires `--force` and bumps Next past the pinned `16.1.6` | P2 | This app never uses `next/image` (confirmed, zero usage repo-wide), so `sharp`'s vulnerable image-processing path is not invoked by anything this app does | Defer; revisit if/when `next/image` is ever adopted, or as part of a deliberate, tested Next.js upgrade | No — version bump, needs its own testing pass | Full regression after any Next.js upgrade |
| J-08 | Multi-domain architecture | This one Next.js deployment intentionally serves `smartserveuk.com`, `londonfoodhubs.com`, and `cikentikka.com` (host-header routing in `proxy.ts`/`app/robots.ts`'s own comments confirm this is deliberate) — not previously stated this plainly in one place | P1 (documentation clarity, not a defect) | Whoever configures Hostinger/DNS needs to know this is one app process behind multiple domains, or they may assume separate deployments are needed | Document explicitly (done — see "Domain / SEO" below); confirm Hostinger's setup can route multiple domains to the same Node process | No — infrastructure decision | Manual DNS/host config review at deploy time |
| J-09 | Branding consistency | Password-reset emails link to `smartserveuk.com/login` even for restaurant owners who primarily interact via `londonfoodhubs.com` | P2 | Functionally works (the shared deployment serves `/login` on any of its domains identically) but is a minor brand-inconsistency, not a broken flow | Consider a domain-aware reset link if/when Food Hubs gets its own dedicated auth branding | Yes, small — but the "should Food Hubs have its own login branding" question is a product decision, not obvious | Manual email content review |
| J-10 | Translation publication | No admin UI exists to write an approved translation into `restaurants/{id}.contentTranslations` — only the request/status workflow exists (Task I) | P1 | Marking a translation request `PUBLISHED` does not, and by design should not, make translated content appear — but there is genuinely no way to make it appear at all short of a manual Firestore console edit | Build a scoped translation-publish admin UI in a future task, or accept manual console editing as the interim process | Not tiny — a real editor UI, out of Phase 25's bar | Manual verification once built |
| J-11 | Media | Restaurant images are URL-only; no Firebase Storage upload system exists | **P2, not P0/P1** | A restaurant owner can already add images by pasting an already-hosted URL — functional, if less convenient than upload. This does not block core discovery/claim/menu/review functionality | Build Storage upload as a deliberate future task with its own rules/validation | No — new subsystem | N/A |
| J-12 | Hub data model | `hubName` (legacy), `hubId`, and `hubIds` coexist with documented, unresolved ambiguity (Tasks G/H) | P2 | Discovery and admin overview consistently use `hubName` today and work correctly; the ambiguity is about future data-model cleanup, not current function | Resolve in a dedicated data-model task when convenient | No — schema/policy decision | N/A |
| J-13 | SmartServeUK Firestore policy | 10 collections (`orders`, `riders`, `suppliers`, etc.) remain `REQUIRES MANUAL POLICY DECISION` per Task E, unchanged since | P1 (pre-existing, not new) | These collections are default-denied by the current rules (safe) but some already-live SmartServeUK pages access them with no auth check at all in application code — deploying rules as-is would break those pages | Resolve per `docs/FIRESTORE-COLLECTION-INVENTORY.md` before rules deployment; unrelated to London Food Hubs launch specifically | No — business policy decisions per collection | Manual review + app-code fixes where needed |
| J-14 | Observability | No `error.tsx`/`global-error.tsx`/`not-found.tsx` route files anywhere; Next.js's built-in generic fallbacks are used instead | P2 | Functional but unbranded/unlocalized for a genuinely broken route or unhandled render error | Add branded, translated error/not-found pages | Yes, bounded — but adding real UI is beyond a "tiny fix" | Manual test of a broken route |
| J-15 | Observability | No third-party error/log monitoring service integrated anywhere (confirmed: no Sentry, no LogRocket, etc.) | P2 | Acceptable for a first launch; errors currently only surface via `console.error`, invisible once live unless someone checks host logs | Add a monitoring service in a deliberate future task | No — new integration, out of scope | N/A |
| J-16 | Dev tooling | Root `package.json` has no `"test"` script; the 6 executable test suites (43 test files across 8 suites... see "Tests" below) must be run individually by path | P2 | Pure convenience; every suite already runs correctly when invoked directly | Add a `"test"` script that runs all suites in sequence | Yes, trivial | Run the new script once added |
| J-17 | `.gitignore` | No explicit pattern for `*serviceAccount*`/`credentials*.json`/`firebase-adminsdk*.json` — currently harmless (no such file exists, tracked or untracked) but not defensively excluded | P2 | If a Firebase Admin SDK service-account key is ever added locally (e.g. for a future server-side script), it wouldn't be auto-ignored unless it happens to match `.env*`/`*.pem` | Add explicit patterns defensively | Yes, trivial | `git status` after adding a dummy matching filename locally |
| J-18 | `README.md` | Entirely unedited `create-next-app` boilerplate, including a "Deploy on Vercel" section, despite the app deploying to Hostinger | P2 | Cosmetic/misleading to a new contributor, not a runtime risk (confirmed zero functional Vercel coupling) | Rewrite for this project and Hostinger | Yes, bounded | None — documentation only |
| J-19 | Sitemap | Individual restaurant detail pages (`/restaurants/{id}`) are not included in `app/sitemap.ts` — only static pages, cuisines, hubs, and articles are | P2 | Restaurant pages remain fully crawlable via internal links (browse page → cards → detail); sitemap inclusion is a discovery-speed optimization, not a requirement | Consider adding a bounded number of restaurant URLs to the sitemap in a future SEO pass | Yes, bounded | Sitemap output spot-check |

---

## A. Launch blockers (P0)

1. **J-01** — Claimant PII publicly retrievable via direct Firestore reads. The single most important finding in this audit. **Architecture fixed as of Task K** (see "Status update" above) — remains listed as a blocker only pending emulator verification of the fix, same as J-02.
2. **J-02** — Firestore rules have never executed against a real rules engine, and two rule changes have accumulated since the last audit. Deploying them without running the suite (and without fixing J-01 first) is not safe.
3. **J-03** — Privacy policy and terms are placeholder text, linked from every consumer page.
4. **J-04** — `londonfoodhubs.com` is not yet authorized in Firebase Auth, so sign-in-dependent features (claim, review, owner workspace, admin) will not work on the live domain until this external step is done.

None of these are things this audit could or should have fixed itself — J-01/J-02 need a scoped engineering task with rules-engine verification, J-03 needs real legal content, J-04 is an external Firebase console action requiring a live domain to point at.

## B. Pre-launch checklist

Concrete actions required before launch, roughly in dependency order:

1. Resolve **J-01** (claimant PII) — design and implement a fix, with tests.
2. Get Java (or any machine with it) and run the full Firestore rules suite (**J-02**) — fix any failures, including verifying J-01's fix actually works as intended.
3. Write and publish real privacy policy and terms content (**J-03**) — a business/legal task.
4. Decide whether a cookie-consent banner is needed (see "Cookies / tracking" below — currently no tracking exists, so the honest answer today is "not technically required by what's implemented," but this should be revisited the moment any analytics is added).
5. Confirm the actual Hostinger product/plan supports a persistent Node.js process (this repo cannot verify Hostinger account configuration — see `docs/HOSTINGER-DEPLOYMENT.md`'s own "Prerequisites").
6. Have the 6 `NEXT_PUBLIC_FIREBASE_*` values (and optionally `NEXT_PUBLIC_SITE_URL`) ready to configure as Hostinger environment variables — see "Environment variables" below for the exact list (names only).
7. Resolve the 10 SmartServeUK collection policy questions (**J-13**) if any operational SmartServeUK feature affected by them needs to keep working immediately at launch — check `docs/FIRESTORE-COLLECTION-INVENTORY.md`.
8. Decide the `xlsx`/dependency risk posture (**J-05**–**J-07**) — at minimum, a documented decision, not silence.

## C. Deployment-day checklist (do NOT execute — for whoever performs the actual deploy, with authorization)

1. `npm install && npm run build` on the Hostinger environment.
2. Configure the 6 required + 1 optional environment variables (see matrix below) in Hostinger's environment configuration.
3. Start the app via `npm run start`, supervised by whatever process manager the chosen Hostinger product provides.
4. Point DNS for `londonfoodhubs.com` at the Hostinger deployment.
5. Add `londonfoodhubs.com` (and `www.londonfoodhubs.com` if used) to Firebase Auth's Authorized Domains list, in the Firebase console.
6. Configure a `www` → apex 301 redirect at the DNS/CDN layer (canonical is the non-`www` form — see `lib/site.ts`).
7. Run the health/smoke checks already listed in `docs/HOSTINGER-DEPLOYMENT.md`'s "Health / smoke checks" section.
8. **Only after J-01 and J-02 are independently resolved and verified**: deploy `firestore.rules` (`firebase deploy --only firestore:rules`, with the correct `--project` explicitly specified — no `.firebaserc` exists, so this cannot be run by accident against the wrong project).
9. Tag the deployed commit in git for fast rollback reference (`docs/ROLLBACK-PLAN.md` section 4 describes the procedure).

## D. Post-launch checklist (P1/P2)

- Resolve J-05/J-06/J-07 dependency vulnerabilities per the decisions made pre-launch.
- Build the translation-publication admin UI (J-10) once the request workflow sees real use.
- Consider Firebase Storage-based media upload (J-11) as a deliberate future task.
- Resolve the hub data-model ambiguity (J-12) when convenient.
- Add branded error/not-found pages (J-14).
- Add a monitoring/error-tracking service (J-15).
- Wire up a root `"test"` script (J-16).
- Harden `.gitignore` for credential-file patterns (J-17).
- Rewrite `README.md` for this project (J-18).
- Consider adding restaurant URLs to the sitemap (J-19).
- Revisit the SmartServeUK collection policy backlog (J-13) on its own timeline.

## E. Verified safe areas (audited, no action needed)

- **Vercel coupling**: none. Every "Vercel" reference is documentation/boilerplate (`README.md`) or explanatory prose confirming its *absence* (`docs/HOSTINGER-DEPLOYMENT.md`). No `vercel.json`, no `@vercel/*` package, no `VERCEL_*` env var usage anywhere.
- **Rendering mode**: standard Next.js server mode (`next start`), not static export — confirmed no `output: "export"`/`"standalone"` anywhere. Requires a genuine persistent Node process, which `docs/HOSTINGER-DEPLOYMENT.md` already states as a prerequisite.
- **Secrets in the repository**: none found. `git grep` for API-key/private-key/Stripe-key patterns across all tracked files returned zero matches; no service-account/credential files exist, tracked or untracked.
- **Server-side secrets in the Next.js app**: none exist — `lib/firebase.ts` only reads the 6 public, safe-to-expose `NEXT_PUBLIC_FIREBASE_*` variables; no `httpsCallable` call site exists anywhere in `app/`/`components`/`lib`, so the frontend never needs a Functions credential.
- **`localhost`/`127.0.0.1` references**: only in `next.config.ts`'s dev-only `allowedDevOrigins` (no production effect) and `README.md`'s dev instructions.
- **Analytics/tracking**: none wired in anywhere — no Google Analytics, Meta Pixel, or any third-party tracker.
- **London-only discovery scope**: verified — see "London-only launch" below.
- **Message-catalog parity**: 308/308 keys, byte-identical across en/bn/ar/fr.
- **Image alt text**: every `<img>` in customer-facing code (10 files) has a real `alt` attribute.
- **Admin authorization pattern**: every admin action, across every admin page including the two added in Task I, uses the same two-layer pattern (`useAdminGate()` UX-only + `isAdmin()` custom-claim rules enforcement) — confirmed no admin action relies on the UI gate alone.
- **Restaurant-supplied content translation policy**: reconfirmed repo-wide — no auto-translation of restaurant names/descriptions/menu text/owner tags anywhere; reviews always shown in original language; the one sanctioned translation path (`getLocalizedRestaurantContent`) is read-only and gated behind an approved `contentTranslations` entry.
- **Import safety**: stage/review/apply remain fully separated; client `create` on `restaurant_import_candidates` is `allow create: if false` for everyone including admins; only an offline, manually-run script with explicit `--project`/`--confirm-production` flags can ever promote a candidate into a real restaurant document; no build/startup/deploy script touches this pipeline.

---

## Phase-by-phase detail

### Build / runtime architecture (Phase 2)

Confirmed directly from `package.json`, `next.config.ts`, `proxy.ts`, and a real `npm run build`:

- **Node**: `engines.node: ">=20.9.0"` pinned. Verified running under Node v24 in this environment without issue.
- **Framework**: Next.js 16.1.6, React 19.2.3 — standard App Router.
- **Not a static export.** No `output` key in `next.config.ts` at all — default server mode.
- **Requires SSR/dynamic routing**: yes — every consumer page lives under `app/[locale]/...` (a dynamic route segment), `next.config.ts` defines `redirects()` (server-evaluated, incompatible with pure static export), and `proxy.ts` (Next 16's middleware file) runs on every request matching its matcher.
- **Requires a running Node server**: yes, confirmed — `npm run build && npm run start` was re-run in this audit and completed successfully (140 routes generated, both new `/admin/restaurants` and `/admin/restaurant-translation-requests` routes present, zero build errors).
- **Firebase Functions dependency for customer/admin workflows**: none at the frontend level. `functions/index.js` (`setAdminClaim`, `onReviewWrite`) exists and is used for setting admin custom claims and maintaining the trusted review-rating aggregate, but the Next.js frontend never calls a Function directly (`httpsCallable` appears nowhere in live code, only in a comment). Functions continuing to run (wherever they're already deployed) is required for the *admin-claim-granting* and *rating-aggregate* mechanisms to keep working, but this is independent of where the Next.js app itself is hosted.

**Conclusion**: this is a normal, unremarkable Next.js Node.js deployment. Nothing about the build/runtime architecture is Hostinger-incompatible, provided the chosen Hostinger product supports a persistent Node process (an infrastructure question this repo cannot answer).

### Hostinger deployment audit (Phase 3)

`docs/HOSTINGER-DEPLOYMENT.md` (from Task C) was re-read in full and re-verified against the current codebase — every specific claim in it (Node version, build/start commands, env vars, no Vercel coupling, no `next/image`, rendering mode, `proxy.ts` behavior, robots/sitemap) still matches the current repository exactly. No corrections were required to that document (see Phase 27 below — it was read, not edited).

**One thing worth stating more explicitly than the existing doc does** (added to this audit, not to that doc, since it's not a correction — see J-08): this is **one Next.js deployment intentionally serving multiple domains** — `smartserveuk.com`, `londonfoodhubs.com`, and `cikentikka.com` — via host-header logic in `proxy.ts` and acknowledged directly in `app/robots.ts`'s own comment ("SmartServeUK operational routes, London Food Hubs consumer routes, CikenTikka, BlackCab all share one Next.js deployment"). Whoever configures Hostinger needs to route all of these domains to the same running process, not assume separate deployments.

Stale/legitimate/risk classification of repo-wide domain references:

- `README.md`'s Vercel section — **stale**, harmless (J-18).
- `proxy.ts`'s `cikentikka.com` check — **legitimate**, intentional multi-domain routing.
- `lib/auth.ts`'s hardcoded `smartserveuk.com/login` password-reset link — **legitimate but worth a brand-consistency note** (J-09).
- The ~7 dead legacy cuisine page files (`app/pakistani-food-london/page.tsx` etc.) still containing `smartserveuk.com` Open Graph URLs — **legitimate/inert**: every one of these paths is intercepted by `next.config.ts`'s `redirects()` before the page file is ever reached (confirmed by reading the redirect list against the page files found), so this is genuinely dead code, not a live risk, exactly as `next.config.ts`'s own comment states.
- Various form-field `placeholder="...@example.com"`-style strings across signup forms — **legitimate**, cosmetic input hints, not functional URLs.
- `lib/restaurantMenuSampleData.ts`'s `https://example.com` — **legitimate**, sample/seed data, not live.

### Environment variables (Phase 4)

| Variable | Used by | Client/Server | Required/Optional | Production requirement | Risk if missing |
|---|---|---|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `lib/firebase.ts` | Client (bundled, intentionally public) | Required | Must be set in Hostinger env | App fails to initialize Firebase at runtime (non-null-asserted, no build-time check — see below) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `lib/firebase.ts` | Client | Required | Must be set | Same |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `lib/firebase.ts` | Client | Required | Must be set | Same |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `lib/firebase.ts` | Client | Required | Must be set | Same |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `lib/firebase.ts` | Client | Required | Must be set | Same |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `lib/firebase.ts` | Client | Required | Must be set | Same |
| `NEXT_PUBLIC_SITE_URL` | `lib/site.ts` | Client + Server (used in metadata generation) | Optional | Leave unset in production — defaults to `https://londonfoodhubs.com` | If accidentally set to the wrong value, every canonical/hreflang/sitemap/OpenGraph URL would be wrong |

No secrets referenced through `NEXT_PUBLIC_*` — all 6 Firebase values are, by Firebase's own design, safe to expose client-side (they identify the project, they don't authenticate as anything; the actual security boundary is Firestore rules, not these values). No server-only credential exists anywhere in this Next.js app to accidentally bundle client-side.

**One real finding**: `lib/firebase.ts` reads each variable with a TypeScript non-null assertion (`process.env.NEXT_PUBLIC_FIREBASE_API_KEY!`) and no runtime fallback or startup validation. If any of the 6 required variables is missing from the Hostinger environment, there is no build-time failure and no clear startup error — the app will build and start, then fail confusingly (a Firebase SDK "invalid configuration" style error) the first time anything tries to use Auth or Firestore, which for this app is nearly every page. This is a **process risk, not a code defect requiring a fix in this audit** — the mitigation is procedural (verify all 6 values are set before first deploy, per the pre-launch checklist above), not a code change.

### Secret / repository hygiene (Phase 5)

- `git grep` across all tracked files for `AIza`/`sk_live`/`sk_test`/`private_key`/`BEGIN PRIVATE KEY`/`BEGIN RSA PRIVATE KEY`: **zero matches**, independently re-verified in this session (not just taken from a subagent's report).
- No `*.pem`, `*serviceAccount*`, `*service-account*`, `*credentials*.json`, `*.key`, or `firebase-adminsdk*.json` files exist anywhere in the repository, tracked or untracked.
- `.gitignore` covers `.env*` (blanket) and `*.pem` explicitly; does **not** have explicit patterns for service-account/credential-JSON filenames (J-17) — currently harmless since no such file exists, but worth adding defensively before anyone ever introduces a server-side Admin SDK script that needs a local key file.
- No Git history rewrite was performed or needed.

### Firebase client configuration (Phase 6)

`lib/firebase.ts` (unchanged since Task C, re-verified): initializes one Firebase app instance, guards against Next.js hot-reload double-initialization (`getApps().length ? getApp() : initializeApp(...)`), and configures Auth persistence (`indexedDBLocalPersistence` → `browserLocalPersistence` → `browserSessionPersistence` fallback chain) only in the browser, falling back to `getAuth(app)` server-side. **No emulator-connection code exists anywhere** (`connectAuthEmulator`/`connectFirestoreEmulator` are never called) — meaning there is no dev/prod project-confusion risk from code; whichever project the environment's `NEXT_PUBLIC_FIREBASE_*` values point to is exactly what any environment (local dev included) will talk to. This was not tested against a live project as part of this audit (no connection was made, no document was read or written).

### Firestore security launch gate (Phase 7)

**Two distinct questions, not one:**

1. **Can the application (the Next.js frontend) launch on Hostinger?** Yes — the frontend's *use* of Firestore (client SDK reads/writes gated by whatever rules are *currently live* in the actual Firebase project) is independent of whether the *local, unreviewed* `firestore.rules` file in this repo has been deployed. The app will run and talk to Firestore using whatever rules already govern that project today.
2. **Can the current local `firestore.rules` be deployed?** **No — not yet, and not only because of Java.** Even setting aside the emulator question, J-01 (claimant PII exposure) is a defect *in the rules as currently written* that should be fixed before this file is ever deployed, since deploying it would make that exposure live for real users.

**Status**: 622 lines, 83 test cases (`tests/firestore-rules/rules.test.js`), **zero of which have ever executed against a real Firestore rules engine**, because Java is unavailable in this environment (confirmed again this session: `java -version` → "command not found"; **Java was not installed, per this task's explicit instruction**). Two commits since Task E's own audit (`6d3bfd8` — Task F's claim-submission field additions; `a59b058` — Task G's owner-update field-protection fix) have modified this file, meaning even a re-read of Task E's conclusions is now stale relative to the current file content, though its *overall* verdict ("not approved for deployment, unexecuted") remains equally true of the current version.

**Classification**: **P0 for the act of deploying rules specifically** — not for the application launching. The distinction matters: a Hostinger launch of the Next.js app does not, by itself, require deploying this file. It only becomes a live concern the moment someone runs `firebase deploy --only firestore:rules`.

**Exact command(s) to run once Java is available** (do not install Java as part of resolving this — that's for whoever picks this up next, with their own environment):

```
cd tests/firestore-rules
npm install
npx firebase-tools emulators:exec --only firestore "npm test"
```

(See `tests/firestore-rules/README.md` for the full explanation, including the earlier-discovered gotcha that `npx firebase` — without `-tools` — resolves the wrong package.)

### Firebase Auth / admin security (Phase 8)

Every admin page audited (`/admin`, `/admin/restaurants`, `/admin/restaurant-claims`, `/admin/restaurant-translation-requests`, `/admin/restaurant-import-candidates`, `/admin/restaurant-signups`, `/admin/blog`, `/admin/recommendations`, `/admin/reviews`, `/admin/blackcab-leads`) uses the identical two-layer pattern:

1. `useAdminGate()` (`hooks/useAdminGate.ts`) — reads `users/{uid}.role` via `lib/authGuard.ts`. **This field is client-writable** (any signed-in user could, in principle, write `role: "admin"` to their own `users/{uid}` document) — this hook is explicitly documented in its own source as "a UX guard, not a security boundary."
2. `isAdmin()` in `firestore.rules` — `request.auth.token.admin == true`, a Firebase Auth **custom claim**, settable only via `functions/index.js`'s `setAdminClaim` callable (itself admin-gated) or a trusted Admin SDK script — never by any client Firestore write.

**Direct answer to Phase 8's central question**: no admin action found in this audit relies on the client-side gate alone. Every write this audit traced back to its enabling rule (claim approve/reject, correction/removal moderation, import candidate status changes, translation request status changes, restaurant signup approval/profile creation) is independently enforced by an `isAdmin()` rules branch. The client gate controls what an admin *sees*; the rules control what a write actually *does*. This was true before Task J and remains true — no change was made or needed here.

### Public Firestore data exposure (Phase 9)

See "The one finding that matters most" above for the full writeup (J-01). Summary of the A/B distinction the task specifically asked for:

- **Rendered by the UI (A)**: restaurant name, description, cuisine, dietary badges, service flags, opening hours, phone/email (intentionally public business contact info), menu, reviews, and — on the public listing notice only — `sourceType`/`sourceName`/`ownerClaimStatus`.
- **Retrievable but never rendered (B)**: `ownerUid` (low sensitivity — an opaque Auth UID, not directly identifying on its own), `claimantUid`/`claimantName`/`claimantRole`/`claimantContactEmail`/`claimantContactPhone`/`claimantNote`/`claimDecidedBy`/`claimSubmittedAt`/`claimDecidedAt` (**high sensitivity — real PII, this is J-01**), `sourceUrl`/`sourceRetrievedAt`/`dataConfidence` (moderate sensitivity — internal trust/provenance metadata, not personal data, but not intended for public consumption either).

No database redesign was attempted as part of this audit, per the task's explicit instruction — this is a finding, not a fix.

### Privacy / data protection (Phase 10)

This is a technical audit, not legal advice. What the application actually collects/stores today, traced through existing workflows:

- **User accounts** (`users` collection): uid, role, whatever profile fields a signup form collects.
- **Restaurant claims**: claimant name, business email, phone (optional), free-text note (optional) — see J-01 for the exposure concern.
- **Reviews**: display name, rating, review text, title.
- **Corrections/removals**: submitter uid/email, free-text description.
- **Restaurant contacts**: business phone/email (intentionally public, owner-supplied).
- **Translation requests**: requesting owner's uid, target locales, admin notes.
- **Admin workflow data**: moderator uid, timestamps, review notes (not publicly exposed — these collections have no public read rule at all, unlike `restaurants`).

**Missing customer-facing documents** (see J-03): privacy policy and terms are placeholders; no data-deletion/contact process is documented anywhere in the app (no "how to request your data be deleted" page or email address found in the customer-facing UI). A cookie policy page exists with real generic content, but see "Cookies / tracking" below for why its current wording ("analytics cookies," "performance cookies," "cookie banner") doesn't match actual implemented behavior.

### Cookies / tracking (Phase 11)

**Confirmed: no analytics, advertising trackers, or third-party tracking scripts exist anywhere in this codebase** — no Google Analytics, Meta Pixel, Hotjar, Mixpanel, Segment, or any similar library, verified by repository-wide search (re-verified independently in this session, not solely from a subagent report). Firebase Auth's own persistence (`indexedDBLocalPersistence`/`browserLocalPersistence`) uses browser storage for session continuity — this is strictly-necessary functional storage (keeping a user logged in), not tracking in the cookie-consent-law sense.

**Practical, non-legal conclusion**: based purely on what's actually implemented today, this application does not appear to require a cookie-consent banner, since no non-essential cookies/tracking are in use. **This is a technical observation, not legal advice** — the existing `/cookie-policy` page's content (mentioning "analytics cookies," "performance cookies," a "cookie banner") describes tracking that isn't actually implemented, which is itself worth fixing for accuracy (either implement what it describes, or correct the page to describe reality) — flagged as part of J-03's broader legal-content gap rather than a separate item.

### Domain / canonical / SEO (Phase 12)

- **Canonical domain**: `https://londonfoodhubs.com` (no `www`), centralized in `lib/site.ts`'s `PRODUCTION_SITE_URL`, correctly wired into `metadataBase` (`app/[locale]/layout.tsx`), `app/sitemap.ts`, and `app/robots.ts`.
- **hreflang**: generated per-page for all 4 active locales plus `x-default` → English, in `app/sitemap.ts`'s `localizedEntries()` helper.
- **Sitemap**: includes static consumer pages, every cuisine page, every hub page, and every published article — in all 4 locales each — plus one SmartServeUK operational entry on its own domain. Does **not** include individual restaurant detail pages (J-19, P2 — discovery-speed optimization, not a crawlability requirement, since internal links already make every restaurant reachable).
- **robots.txt**: correctly disallows admin/dashboard/checkout/orders/staff/kitchen/owner-edit-style private paths; allows everything else; references the correct sitemap URL via `lib/site.ts`.
- **www vs apex**: apex (no `www`) is the stated canonical; an actual DNS/CDN-level redirect is explicitly not configured (correctly out of a repo-only audit's scope) — recorded as a pre-launch action.
- **No old-domain leakage found** in London Food Hubs' own consumer metadata — `smartserveuk.com` references are confirmed confined to SmartServeUK's own operational pages and dead legacy redirect-shadowed pages (see Phase 3 above), never to the `app/[locale]` consumer tree.

### London-only launch (Phase 13)

Re-verified directly (not just cited from Task H): the 5 places that query the `restaurants` collection for customer discovery (browse page, `/search`, homepage featured section, cuisine pages, hub pages) all filter through `lib/cities.ts`'s `belongsToActiveCity()`, which defaults to `DEFAULT_CITY_SLUG = "london"`. `lib/cities.ts`'s `CITIES` registry contains exactly one entry (`london`), with an explicit comment against adding placeholder future cities "just in case." Multi-city architecture (the `City` type, `citySlug` field, `getActiveCities()`) remains in place and untouched, as required — it's simply unused beyond London today.

### Multilingual readiness (Phase 14)

- Locale-prefixed routing (`/en`, `/bn`, `/ar`, `/fr`) confirmed working via the real production build (140 routes, all 4 locale variants of every consumer page generated).
- Message-catalog parity: **308/308 keys, byte-identical key sets** across all 4 locale files, re-verified in this session.
- Arabic RTL: handled globally via `<html dir>` in the root `app/layout.tsx`, driven by `isRTLLocale(locale)` — confirmed in Task H's audit that components not separately declaring `dir` still correctly inherit it via the browser's bidi cascade.
- No obviously hard-coded customer-facing English strings were found outside the translation architecture during this pass, beyond the already-known, already-documented exception: admin/operational pages (`/admin/*`, `/restaurants/[id]/edit`, `/staff/*`, etc.) are deliberately English-only, consistent with every prior task's documented precedent — not a gap, a stated design choice.

### Restaurant content translation policy (Phase 15)

Reconfirmed, no violations found: restaurant-supplied content (name, description, menu text, owner tags) is never auto-translated anywhere in the codebase (confirmed by the static content-policy tests added in Tasks G/H/I, all passing); customer reviews are always shown in their original language; the one sanctioned translation-read path (`getLocalizedRestaurantContent`) falls back to canonical original text per-field and is gated behind an actually-`PUBLISHED` `contentTranslations` entry (which, per J-10, nothing can currently create through any UI); platform vocabulary (cuisine, dietary, service labels) is translated via `next-intl`'s message catalogs, never mixed with owner free text (`RestaurantCard`'s `tags`/`ownerTags` prop separation, audited and tested in Task D/H).

### Import launch safety (Phase 16)

Re-verified: `restaurant_import_candidates`' Firestore rule is `allow create: if false` unconditionally (including for admins) — the *only* way a candidate document can ever be created is `functions/scripts/stageImportCandidates.js`, run manually via the Admin SDK, outside this Next.js application entirely. No build script, startup script, or deployment step in this repository invokes any import-related script. Promoting an `APPROVED` candidate into a real `restaurants/{id}` document requires a *second*, separately manual script (`applyApprovedImportBatch.js`) with explicit `--project`/`--env`/`--confirm-production` flags. **Neither script was run as part of this audit.** No connection to production Firebase was made. Duplicate-detection and provenance safeguards (cuisine-never-guessed, dietary-declaration-basis tracking) remain in place, unchanged, and covered by the existing 8/8-passing fixture test suite (re-run in this audit).

### Admin operations readiness (Phase 17)

All five operational areas Task I built/confirmed are reachable from `/admin`'s navigation grid: restaurant overview (`/admin/restaurants`), claims (`/admin/restaurant-claims`), corrections/removals (same page as claims, by design), translation requests (`/admin/restaurant-translation-requests`), and import review (`/admin/restaurant-import-candidates`). No launch-critical admin workflow gap was found beyond J-10 (translation publication has no UI — a known, documented, pre-existing gap, not newly discovered). Sensitive information (claimant contact details) is correctly confined to the dedicated claims queue at the UI level, and — independent of UI — protected at the rules level for every collection *except* the restaurants document itself, which is J-01's core problem.

### Owner operations readiness (Phase 18)

Claim → admin approval → owner workspace → public listing update was traced end to end and confirmed functional (this is a re-verification of Tasks F/G's own findings, not new work): ownership is authorized solely by `ownerUid` matching the signed-in user (or admin); profile fields, menu (`menuCategories`), opening hours (`openingHoursText`), service options, and cuisine/dietary selections are all owner-editable through the existing edit page, gated by the same rule. **Media/image handling remains URL-only, and this is classified P2, not P0/P1** — an owner can already set a cover image by pasting a URL to an already-hosted image; this is less convenient than a file-upload widget but not broken, and does not block any core marketplace function (discovery, claiming, menu browsing, reviews all work without it).

### Customer experience readiness (Phase 19)

Homepage, browse, search, filters, cards, detail pages, menu, reviews, claim/correction actions, empty/loading/error states were all re-inspected (building on Task H's own thorough audit) — no broken route or dead action was found in this pass. Every data-fetching component wraps its Firestore calls in try/catch with a translated fallback UI state (loading/empty/error), confirmed across all 5 discovery components and the reviews component. No new defect was found beyond what Tasks H/I already documented as deliberately deferred (J-11 media, J-19 sitemap).

### Accessibility baseline (Phase 20)

Practical static review, not a formal WCAG audit:

- **Images**: every `<img>` in customer-facing code (10 files) has a real `alt` attribute (re-verified directly, not just inferred) — no violations found.
- **ARIA**: the language selector uses proper `role="listbox"`/`role="option"`/`aria-selected`/`aria-label`; the mobile menu toggle has `aria-label`.
- **Semantic headings**: every audited page uses a single `<h1>` per view with `<h2>`/`<h3>` for sections, consistent with prior tasks' own conventions.
- **RTL**: handled globally (see "Multilingual readiness" above); Tailwind logical properties (`text-end` etc.) used in prior tasks' work rather than hardcoded `text-right`/`text-left` where audited.
- **Not independently re-verified in this pass** (would require rendering/browser testing, out of this audit's static-analysis scope): keyboard focus order, color contrast ratios, screen-reader announcement of dynamic content changes (e.g. filter result counts). No obvious code-level red flag was found for any of these, but this audit cannot certify them without live browser testing.

### Performance / build size (Phase 21)

`npm run build` completed cleanly, zero errors, zero warnings, 140 routes generated (confirmed in this session, including both new admin routes from Task I). No unusually large route/bundle was flagged by the build output. No speculative optimization was performed, per this task's scope.

### Error handling / observability (Phase 22)

- No `error.tsx`/`global-error.tsx`/`not-found.tsx` exists anywhere (J-14) — Next.js's built-in generic fallbacks apply. Individual pages (e.g. the restaurant detail page) do implement their own custom "not found" UI for their specific case, which is a page-level pattern, not a route-level one.
- Every audited data-fetching component logs failures via `console.error` and shows a generic, translated user-facing message — never a raw Firebase error string rendered to a customer or owner (re-confirmed across discovery, claim, owner-workspace, and admin components).
- **No production logging exposes sensitive information** in what's rendered to the UI — `console.error` calls only ever log the error object itself (visible in server/browser logs, not to end users) and a static description.
- No third-party monitoring/error-tracking service exists (J-15) — not added, per this task's scope.

### Dependency / package health (Phase 23)

See the launch-gate matrix (J-05–J-07) for the three vulnerable dependency chains found (`xlsx` direct, `websocket-driver`/`protobufjs` transitive via `firebase`, `sharp` transitive via `next`). `npm audit --omit=dev`: **10 vulnerabilities (2 moderate, 5 high, 3 critical)**. Full `npm audit` (including devDependencies): **19 vulnerabilities (1 low, 4 moderate, 11 high, 3 critical)** — the devDependency-only additions are in `postcss` (build-tooling, never shipped to the browser). **No dependency was changed, upgraded, or removed as part of this audit**, per its explicit scope (report, don't fix).

### Test coverage / validation (Phase 24)

**Executed in this session:**

```
npx tsc --noEmit
npm run build
node tests/admin-operations/run-data-quality-tests.ts
node tests/admin-operations/run-content-policy-tests.ts
node tests/restaurant-discovery/run-discovery-filter-tests.ts
node tests/restaurant-discovery/run-content-policy-tests.ts
node tests/restaurant-owner-workspace/run-ownership-tests.ts
node tests/restaurant-owner-workspace/run-content-policy-tests.ts
node tests/restaurant-claim/run-claim-state-tests.ts
node tests/restaurant-import/run-fixture-tests.js
npm run lint
java -version   (confirmed absent — not installed, per instruction)
```

**Results**: `tsc` clean; `npm run build` clean (140 routes); all 8 executable test suites passed, **57/57 individual test cases**; `npm run lint` reports 681 pre-existing problems (539 errors, 142 warnings), unchanged from the count observed across Tasks G/H/I — confirmed pre-existing, not newly introduced (spot-checked several against `git blame`-equivalent reasoning: these are in files this task's predecessors never touched); message parity 308/308 across en/bn/ar/fr.

**Firestore emulator suite: did NOT run.** Java is confirmed absent in this environment; it was **not installed**, per this task's explicit instruction. This audit does not and cannot claim the rules suite passed.

---

## Safe small fixes made this task

**None.** Every finding surfaced in this audit either requires a business/policy decision, a schema or rules change needing emulator verification, external infrastructure/console configuration, or a dependency change — none met Phase 25's bar of "tiny, unambiguous, no policy guess, no migration, no broad refactor." This document is a pure audit; no repository code was changed.

---

## Hostinger runbook (Phase 27)

`docs/HOSTINGER-DEPLOYMENT.md` was re-read in full against the current
codebase. **No repository-level correction was required** — every
specific technical claim in it (Node version, build/start commands, env
var list, no Vercel coupling, no `next/image` dependency, rendering mode,
`proxy.ts` behavior, robots/sitemap generation, the PREPARATION-vs-
DEPLOYMENT distinction, the explicit "what this task did not do" section)
was independently re-verified in this audit and found to still match the
current repository exactly. It already clearly separates preparation from
actual deployment and does not imply any deployment has occurred. It was
therefore left unmodified by this task.

The one addition worth making explicit for whoever deploys — recorded
here rather than as an edit to that document, since it's a *finding* of
this audit, not a *correction* of something wrong in it — is J-08's
multi-domain point: confirm the chosen Hostinger product can route
`smartserveuk.com`, `londonfoodhubs.com`, and `cikentikka.com` to the
same Node process, since that's what this codebase's `proxy.ts` already
assumes.
