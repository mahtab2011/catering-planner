# London Food Hubs — Final Launch Gate (Task Q)

Written for: whoever makes the actual go/no-go call and performs the
deployment. This is a **readiness inspection only** — nothing was
deployed, pushed, or changed in production Firebase/Hostinger/DNS while
producing it. It synthesizes evidence gathered directly in this session
(commands actually run, files actually read) plus the verified outcomes
of Tasks J–P, and answers one question: **is London Food Hubs ready for
controlled production deployment, and if so, in what exact order?**

**Checkpoint**: `main` branch, HEAD `bb56a90c4a4ed55421d83d5f5c310415b8aa037e`,
working tree clean, 59 commits ahead of `origin/main`, linear history (no
merges), remote unchanged (`github.com/mahtab2011/catering-planner`).

---

## 1. Executive summary

**Local code readiness: YES.** Every automated check available in this
repository passes: TypeScript, production build, all 71 application
tests, and 105/105 real Firestore emulator tests. Dependency exposure is
down to 1 documented, unreachable advisory. Legal content is complete
with real operator details. No secrets, no BlackCab/CikenTikka
contamination, no accidental unrelated changes across 59 commits.

**Production configuration readiness: YES, with one open item.** The
Firebase project is identified and already has `londonfoodhubs.com` on
its Authorized Domains list (owner-verified via Firebase Console
screenshot, Task Q's own historical context — not independently
re-verified by CLI in this task, since the CLI still cannot read this
setting and no login was performed). Firestore rules are locally
verified but **not yet deployed** to that project. Environment variables
are documented (names only) but their actual production values have not
been confirmed as configured anywhere outside this developer's
`.env.local`.

**Production deployment readiness: NOT YET.** Nothing has been deployed.
DNS, Hostinger hosting, and Firestore rules deployment are all still
pending, deliberately, per every prior task's non-negotiable scope.

**GO / NO-GO: GO ONLY AFTER NAMED P0 ITEMS** (Section 8). The blockers
remaining are deployment *actions* (deploy rules, deploy app, point DNS),
not unresolved *defects*. No code or content defect currently blocks
launch.

---

## 2. Evidence summary (this session, Task Q)

| Check | Command / method | Result |
|---|---|---|
| Repo checkpoint | `git rev-parse HEAD`, `git status --short`, `git remote -v` | HEAD matches expected; clean tree; remote unchanged |
| Commits ahead | `git rev-list --count origin/main..HEAD` | 59, linear (no merge commits) |
| Repository integrity | `git diff --stat origin/main..HEAD`, directory distribution, secret/BlackCab/CikenTikka grep | 164 files, 28,909 insertions / 6,889 deletions, all in expected directories (`app`, `lib`, `components`, `docs`, `tests`, `functions`, `messages`, `i18n`, config files); zero secrets, zero BlackCab/CikenTikka files touched |
| TypeScript | `npx tsc --noEmit` | Clean, 0 errors |
| Production build | `npm run build` | Succeeded first try, exit 0, 136 routes, **no `next/font` network failure this run** |
| Application tests | 10 suites, `node <file>` each | **71/71 passed** (see Section 3 breakdown) |
| Firestore emulator | `npx firebase-tools emulators:exec --only firestore "npm test"` | Emulator started genuinely; **105/105 passed**, 0 failed, 0 skipped |
| Dependency audit (prod) | `npm audit --omit=dev` | **1 high** (`xlsx`, no fix available) — unchanged from Task N |
| Dependency audit (all) | `npm audit` | **1 high** (same) — unchanged from Task N |
| Legal pages | grep for confirmed operator/contact/date strings + placeholder sweep | All three pages contain confirmed details; zero unresolved placeholders |
| Firebase config docs | grep for project ID / domain consistency | Internally consistent across `docs/HOSTINGER-DEPLOYMENT.md` and `docs/PRODUCTION-READINESS-AUDIT.md` |
| Hostinger docs | Read `docs/HOSTINGER-DEPLOYMENT.md` | Build/start/env/domain/www-policy all documented, no contradictions found |
| Environment variables | Read `.env.example` | 7 variables total, all client-safe, no server-only secrets exist in this app |
| SEO/domain | `lib/site.ts`, `app/sitemap.ts`, `app/robots.ts` | Canonical apex `londonfoodhubs.com`, hreflang wired, robots disallows private routes, sitemap references `SITE_URL` |
| Active city | `lib/cities.ts` | London is the only `isActive: true` city |
| Multilingual parity | Node script flattening all 4 `messages/*.json` | **308/308 leaf keys match exactly** across en/bn/ar/fr, 0 missing, 0 extra |
| RTL | `lib/locales.ts` | `isRTLLocale()` exists, used by `app/layout.tsx` |
| Content policy | grep for translation-function calls on restaurant/review content | None found — reconfirms no auto-translation of owner/review content |
| Routes | Directory listing + successful build | All named customer/owner/admin routes present and compiled |

---

## 3. Application test breakdown (71/71)

| Suite | Tests | Result |
|---|---|---|
| `tests/admin-operations/run-content-policy-tests.ts` | 4 | 4/4 |
| `tests/admin-operations/run-data-quality-tests.ts` | 12 | 12/12 |
| `tests/legal-pages/run-legal-content-tests.ts` | 9 | 9/9 |
| `tests/restaurant-claim/run-claim-state-tests.ts` | 8 | 8/8 |
| `tests/restaurant-claim/run-pii-boundary-tests.ts` | 5 | 5/5 |
| `tests/restaurant-discovery/run-content-policy-tests.ts` | 3 | 3/3 |
| `tests/restaurant-discovery/run-discovery-filter-tests.ts` | 11 | 11/11 |
| `tests/restaurant-import/run-fixture-tests.js` | 8 | 8/8 |
| `tests/restaurant-owner-workspace/run-content-policy-tests.ts` | 4 | 4/4 |
| `tests/restaurant-owner-workspace/run-ownership-tests.ts` | 7 | 7/7 |
| **Total** | **71** | **71/71** |

Plus **105/105** real Firestore emulator tests (`tests/firestore-rules/rules.test.js`), covering every SmartServeUK and London Food Hubs collection including all 21 dedicated `restaurant_claims` PII-boundary cases (Task K/L).

---

## 4. Existing SmartServeUK Food Hub photographs — preservation audit

Investigated per an explicit mid-task requirement. **Inspection only — no
image was copied, moved, deleted, renamed, downloaded, migrated, or
modified.**

**Where they currently reside**: local repository static files under
`public/hubs/{hub-slug}/*.jpg` (e.g. `public/hubs/barking-road/1.jpg`,
`public/hubs/boxpark/hero.jpg`). **205 files, ~65MB total**, all
individually `git`-tracked (confirmed via `git ls-files public/hubs`) —
not gitignored, not external, not Firebase-hosted. A repo-wide search for
`firebasestorage.googleapis.com` or `firebase/storage` usage in the hub
data/pages returned zero matches, and Task N/M's earlier audits already
independently confirmed Firebase Storage's client SDK is never imported
anywhere in this codebase.

**How SmartServeUK references them**: `lib/hubs.ts` — a plain static
TypeScript data file (hubs are not Firestore-backed) — stores each hub's
`heroImage` and `gallery` fields as root-relative paths, e.g.
`"/hubs/plashet-road/13.jpg"`, often generated programmatically
(`Array.from({ length: N }, (_, i) => \`/hubs/{slug}/${i + 1}.jpg\`)`).
These are rendered by the legacy `app/hubs/{slug}/page.tsx` pages.

**Does London Food Hubs already display/reuse them?** **Yes.**
`app/[locale]/hubs/[slug]/page.tsx` and `app/[locale]/hubs/page.tsx` (the
new, locale-aware LFH hub routes) import from the exact same
`lib/hubs.ts` module — confirmed by direct source inspection. There is no
separate LFH-specific image set or duplicated data file; both the legacy
SmartServeUK-era pages and the new London Food Hubs pages read the
identical hub records and identical image paths.

**Can the same assets safely serve both sites?** **Yes, with no changes
needed.** Task P/Q already established that `smartserveuk.com`,
`londonfoodhubs.com`, and `cikentikka.com` are served by **one single
Next.js process** via host-header routing (`proxy.ts`), not three
separate deployments. Because every hub image path is **root-relative**
(`/hubs/...`, never an absolute URL with a hardcoded domain), the exact
same static file is served identically no matter which of the three
domains the request arrives on. This is not a coincidence to preserve —
it is already how the architecture works today, before any London Food
Hubs-specific deployment step.

**Risk of broken image URLs after Hostinger deployment**: **Low**,
provided the Hostinger deployment ships the repository's `public/`
directory unmodified, exactly as `docs/HOSTINGER-DEPLOYMENT.md`'s
documented `npm install && npm run build` / `npm run start` process
already assumes (Next.js serves `public/` automatically under `next
start`; no separate asset-hosting step exists or is needed today). The
one practical thing worth confirming *at* deploy time (not before) is
that the chosen Hostinger plan/transfer method doesn't silently exclude
`public/` or impose a disk-size limit below the repository's actual size
— a plan/product-selection detail, not a code change.

**Is an image migration/copy required before launch?** **No.** The
existing single-deployment, root-relative-path architecture already
serves these images to every domain without any additional step,
migration, or Firebase Storage upload.

**Safest preservation strategy**: **Do nothing to the images.** Leave
`public/hubs/` exactly as it is, deploy the repository as a whole
(unmodified `public/`), and add one line to the launch-day smoke-test
matrix (Section 10) confirming a sample hub photo loads correctly on
both `smartserveuk.com` and `londonfoodhubs.com` post-deploy. Never
create a second, domain-specific copy of these files — that would
introduce a drift risk (two copies to keep in sync) for zero benefit,
given the shared-deployment architecture already covers this.

**SmartServeUK is not being retired, redirected, or deleted** by any of
this — the single-deployment architecture is exactly what keeps
`smartserveuk.com` fully intact and independently functional alongside
`londonfoodhubs.com`, both now and after this deployment.

---

## 5. Repository integrity detail

All 59 commits ahead of `origin/main` were inspected for suspicious
content: file-list distribution, secret-pattern search, and
BlackCab/CikenTikka search. All clean. Directory distribution (`app`
52, `lib` 25, `components` 24, `docs` 21, `tests` 16, `functions` 8,
`messages` 4, `i18n` 3, plus 10 individual config files) matches exactly
what 15 prior tasks (Tasks A–P plus earlier phases) are documented to
have built — no unexplained file category, no binary blob, no
`node_modules` commit, no `.env`/credential file ever committed.

---

## 6. Legal readiness (live content re-verified)

- **Privacy Policy** (`app/privacy-policy/page.tsx`): operator `MBN
  Continental (UK) Ltd`, address `85 Halley Road, London E7 8DS, United
  Kingdom` (explicitly labeled business/contact address, never
  "registered office"), contact `mahtab@mbncon.com`, effective date
  `22 September 2026`. Present.
- **Terms** (`app/terms/page.tsx`): operator, contact, effective date —
  same values. Present.
- **Cookie Policy** (`app/cookie-policy/page.tsx`): accurately describes
  only Firebase Authentication's local-storage sign-in persistence,
  explicitly denies analytics/performance/advertising cookies, explains
  why no consent banner exists, effective date present.
- **Placeholder sweep**: zero `TO CONFIRM BEFORE LAUNCH` / `[OPERATOR` /
  `[REGISTERED` / `[PRIVACY` / `[LEGAL` / `[EFFECTIVE` tokens remain in
  any of the three pages.

---

## 7. Firebase / Hostinger configuration readiness

- **Firebase project**: `catering-planner-7f5d7` (identified in Task P
  from `.env.local`, corroborated by `lib/site.ts` and by
  `lib/firebase.ts` being the single Firebase init point in the
  codebase).
- **Authorized Domains**: per this task's own verified historical
  context, the owner visually confirmed via Firebase Console screenshot
  (after Task P) that `londonfoodhubs.com` **already appears** in
  Authentication → Settings → Authorized Domains, alongside existing
  SmartServeUK domains. **This task did not independently re-verify this
  via CLI** (the CLI still cannot read this setting, and no login was
  performed, per this task's own non-negotiable rule against modifying
  or probing Firebase Auth). Treated as confirmed per the explicit
  instruction to do so.
- **www domain**: intentionally **not** added — `www.londonfoodhubs.com`
  is documented policy to redirect (301) to the apex only, never served
  independently, so it never executes a Firebase Auth call from that
  origin.
- **Firestore rules**: locally verified (105/105, Section 3), **not
  deployed** to `catering-planner-7f5d7`.
- **Hostinger**: documentation-complete (`docs/HOSTINGER-DEPLOYMENT.md`)
  — build/start commands, Node version requirement, environment
  variables, production domain, www-redirect policy, multi-domain
  host-header routing (`proxy.ts`) — but **no Hostinger account, server,
  or DNS has been configured**. This remains an infrastructure
  provisioning step outside this repository's control.

---

## 8. P0 / P1 / P2 reassessment

### P0 — MUST COMPLETE BEFORE DEPLOYMENT

| # | Item | Evidence | Risk if skipped | Recommended action |
|---|---|---|---|---|
| P0-1 | **Deploy Firestore rules to production** | Locally verified 105/105 (Section 3), never deployed (`docs/PRODUCTION-READINESS-AUDIT.md` J-01/J-02) | Production Firestore currently runs whatever rules (if any) were last actually deployed — likely stale/older or default-open rules, not the claimant-PII-protecting ones verified in this repo | Follow Section 11 (Firestore Deployment Plan) exactly, with explicit human authorization at the deploy step |
| P0-2 | **Provision Hostinger hosting + point DNS** | Nothing configured yet (`docs/HOSTINGER-DEPLOYMENT.md`'s own "nothing executed" status line) | App cannot be reached at `londonfoodhubs.com` at all until this exists | Follow Section 12 (Hostinger Deployment Plan) |
| P0-3 | **Configure the 6 production Firebase environment variables in the actual Hostinger environment** | Documented as names-only in `.env.example`; production values exist only in this developer's local `.env.local` today | App will crash or misconfigure at startup without these | Transfer values (not committed to git) into Hostinger's environment configuration as part of the deployment sequence |
| P0-4 | **Post-deploy Authorized Domain re-confirmation** | Owner visually confirmed pre-deployment; not independently re-verified by this task | Low probability of drift, but sign-in silently fails if the setting were ever reverted | One-minute manual check on launch day (Section 10) — not a new configuration task, a verification step |

No code or content defect qualifies as P0 — everything above is a
deployment *action*, not a fix.

### P1 — SHOULD COMPLETE SOON (not blocking first launch)

| # | Item | Evidence | Risk | Recommended action |
|---|---|---|---|---|
| P1-1 | `xlsx` dependency vulnerability (J-05) | Export-only usage, parsing path unreachable, no upstream fix (Task N, reconfirmed Section 2) | Low — vulnerable code path never executes | Monitor for an upstream fix or a bounded replacement task later |
| P1-2 | Multi-domain architecture not stated in one place (J-08) | `docs/PRODUCTION-READINESS-AUDIT.md` already flags this | Documentation clarity only — the routing itself works | Optional consolidation into a single "domains" doc section |
| P1-3 | 10 SmartServeUK collections have unresolved Firestore policy questions (`orders`, `riders`, `suppliers`, etc. — `docs/FIRESTORE-COLLECTION-INVENTORY.md`) | Documented since Task E; unaffected by this deployment since these collections are unrelated to London Food Hubs' own launch scope | Deploying the *current* `firestore.rules` as verified does not resolve or worsen these — they were already either open or already governed by existing rules; not a new risk introduced by this launch | Track separately, not a London Food Hubs launch blocker |
| P1-4 | No monitoring/error-tracking service (J-15, pre-existing) | Documented, not added by any task | Harder to detect production issues quickly post-launch | Add before or shortly after launch |
| P1-5 | Solicitor review of legal content | Explicitly not claimed by Task M/O | Legal content is honest and accurate to implementation but not professionally certified | Optional business decision, not an engineering blocker |

### P2 — POST-LAUNCH

| # | Item | Evidence | Recommended action |
|---|---|---|---|
| P2-1 | Password-reset emails link to `smartserveuk.com/login` even for LFH-primary users (J-09) | Functionally works, minor brand inconsistency | Consider domain-aware branding later |
| P2-2 | Dedicated `privacy@`/`legal@` addresses instead of shared `mahtab@mbncon.com` | Task O's own documented note | Optional future refinement |
| P2-3 | Deleting `EventClient.voice-stable.tsx` if confirmed stale (Task N's own note) | Not confirmed stale, not investigated further | Separate small cleanup task |
| P2-4 | Hub image directory size (~65MB) and potential CDN offload | Section 4 finding | Not urgent — works as-is; consider a CDN only if load/performance ever demands it |

---

## 9. GO / NO-GO decision

**GO ONLY AFTER NAMED P0 ITEMS.**

- **Local code readiness: GO.** All automated checks pass; no defect
  found.
- **Production configuration readiness: GO**, on the strength of the
  owner's visual Firebase Console confirmation and this task's
  documentation cross-checks — with the understanding that P0-3
  (environment variables in the actual hosting environment) and P0-4
  (post-deploy re-confirmation) are still pending actions, not doubts
  about current correctness.
- **Production deployment readiness: NOT YET.** P0-1 and P0-2 are
  concrete, unstarted infrastructure actions. Nothing about the
  *codebase* blocks them; they simply have not been done yet, and this
  task is not authorized to do them.

---

## 10. Exact future deployment sequence (NO EXECUTION)

Each step lists: responsible system, prerequisite, verification method,
rollback method.

1. **Backup/export checkpoint**
   - System: Git + Firebase.
   - Prerequisite: none.
   - Verification: `git log -1`, confirm current `firestore.rules` file
     hash matches what was emulator-tested; note the production
     project's currently-deployed rules (via Firebase Console → Firestore
     → Rules → history) before touching anything.
   - Rollback: N/A (this step *is* the backup).

2. **Push verified commits to `origin/main`**
   - System: Git/GitHub.
   - Prerequisite: explicit human authorization (never assumed).
   - Verification: `git log origin/main` shows the same HEAD as local.
   - Rollback: `git revert` the pushed commits, or reset the remote
     branch to the prior known-good SHA (`c04bb16` or earlier), with
     explicit authorization.

3. **Verify GitHub state**
   - System: GitHub.
   - Prerequisite: step 2 complete.
   - Verification: open the repository on GitHub, confirm branch/commit
     match, confirm no unexpected files (e.g. accidentally committed
     `.env`).
   - Rollback: none needed if verification passes; if it fails, treat as
     a step-2 failure.

4. **Configure production environment variables in Hostinger**
   - System: Hostinger control panel.
   - Prerequisite: Hostinger account/plan with persistent Node support
     provisioned (external prerequisite, not part of this repo).
   - Verification: Hostinger's own environment-variable UI shows all 6
     required `NEXT_PUBLIC_FIREBASE_*` keys set (values from the
     Firebase console, never invented) plus optionally
     `NEXT_PUBLIC_SITE_URL` left unset (defaults to
     `https://londonfoodhubs.com`).
   - Rollback: clear/replace the variables; no application state is
     affected since these are read at process start only.

5. **Hostinger build** (`npm install && npm run build`)
   - System: Hostinger Node environment.
   - Prerequisite: step 4 complete, repository checked out at the
     verified commit.
   - Verification: build log shows the same ~136 routes this session's
     local build produced, exit code 0.
   - Rollback: re-deploy the previous known-good build artifact/commit
     (see `docs/ROLLBACK-PLAN.md` section 4).

6. **Hostinger start** (`npm run start`, supervised)
   - System: Hostinger process manager.
   - Prerequisite: step 5 complete.
   - Verification: process running, responds on its configured port.
   - Rollback: stop the new process, restart the previous one from its
     preserved build directory (`docs/ROLLBACK-PLAN.md` section 4).

7. **Smoke test on the Hostinger-assigned URL/localhost before DNS
   cutover**
   - System: manual browser/curl test.
   - Prerequisite: step 6 complete.
   - Verification: homepage loads, no 500s, `robots.txt`/`sitemap.xml`
     resolve.
   - Rollback: stop the process (step 6's rollback) if this fails.

8. **Point DNS for `londonfoodhubs.com` at the Hostinger deployment**
   - System: DNS provider.
   - Prerequisite: step 7 passed.
   - Verification: `dig`/`nslookup londonfoodhubs.com` resolves to the
     new host; propagation may take time.
   - Rollback: revert the DNS record to its previous value (must be
     recorded *before* this step, per `docs/ROLLBACK-PLAN.md`'s general
     principle of recording prior state before changing it).

9. **Deploy Firestore rules** — see Section 11 for the full dedicated
   plan. Performed here, after the app is reachable but ideally before
   heavy public traffic, so rule behavior can be smoke-tested against a
   live-but-quiet environment.
   - Rollback: `docs/ROLLBACK-PLAN.md` section 1 (redeploy the previous
     rules file from git history).

10. **Verify Auth** (sign-in/sign-up on the live `londonfoodhubs.com`
    domain)
    - System: manual test, real (or disposable) test account.
    - Prerequisite: steps 8–9 complete, Authorized Domain already
      confirmed present (Section 7).
    - Verification: successful sign-in with no
      `auth/unauthorized-domain` error.
    - Rollback: none needed if this fails without side effects — it's a
      read-only check; if sign-in is broken, treat as a P0 blocker to
      fix before public announcement.

11. **Verify public browsing** (homepage, browse, search, cuisine, hubs,
    restaurant detail, reviews — see Section 13's Public block)
    - System: manual test.
    - Prerequisite: step 8.
    - Verification: per Section 13 checklist.
    - Rollback: none (read-only).

12. **Verify owner workflow** (claim submission, pending state, owner
    edit access)
    - System: manual test with a disposable/test-safe account, not a
      real customer's data.
    - Prerequisite: step 10.
    - Verification: per Section 13's Restaurant block.
    - Rollback: none for read/claim-submission tests; if a test claim
      record is created, an admin can reject/delete it afterward via the
      existing admin UI — no special rollback machinery needed.

13. **Verify admin workflow** (claims queue, approve/reject, corrections,
    translation queue, import review)
    - System: manual test, admin account.
    - Prerequisite: step 10.
    - Verification: per Section 13's Admin block.
    - Rollback: none (admin actions here are the same reversible actions
      already available in the running application).

14. **Verify multilingual** (all 4 locales, Arabic RTL)
    - System: manual test.
    - Prerequisite: step 8.
    - Verification: per Section 13's Public block language checks.
    - Rollback: none (read-only).

15. **Verify SEO** (canonical, sitemap, hreflang, robots)
    - System: manual test / curl.
    - Prerequisite: step 8.
    - Verification: per Section 13's SEO block.
    - Rollback: none (read-only).

16. **Enable public launch** (announce / remove any "coming soon" gate,
    if one exists — not found in this repository, so likely N/A)
    - System: business decision.
    - Prerequisite: all of the above pass.
    - Verification: N/A.
    - Rollback: N/A.

---

## 11. Firestore deployment plan (prepared, NOT executed)

**Before deployment:**
- Git checkpoint: confirm `firestore.rules` at HEAD is the exact file
  that was emulator-tested (105/105) in this session — `git log -1
  firestore.rules` and compare its blob hash to what Task L/this task
  actually ran against.
- Emulator evidence: this session's 105/105 result (Section 3) plus
  Task L's original 105/105 result — two independent genuine emulator
  runs, same file, same result.
- Production confirmation: verify (via Firebase Console, not CLI, since
  no CLI login exists) which project the deploy would target —
  `catering-planner-7f5d7` — and that this matches the identified
  production project (Section 7).
- Backup considerations: per `docs/ROLLBACK-PLAN.md` section 1, save the
  currently-live rules (Firebase Console → Firestore → Rules → "..." →
  view history, or copy the current text) to a file such as
  `firestore.rules.before-launch` *before* deploying, so a rollback has
  something concrete to redeploy.

**Deployment (exact command, NOT executed in this task):**
```
firebase deploy --only firestore:rules --project catering-planner-7f5d7
```
(Requires `firebase login` first, interactively, by whoever has
authorization — this task deliberately did not do this.)

**After deployment — smoke tests:**
- **Public read smoke test**: fetch a known `active`/`pending` restaurant
  document as an unauthenticated client; confirm it succeeds and
  contains no claimant PII field (matches
  `tests/restaurant-claim/run-pii-boundary-tests.ts`'s static guarantee,
  now checked against the live deployed rules).
- **Claimant privacy smoke test**: as an authenticated non-claimant,
  non-admin test user, attempt to read a `restaurant_claims/{id}`
  document; confirm denial.
- **Admin authorization smoke test**: as a non-admin authenticated user,
  attempt an admin-only write (e.g. approving a claim); confirm denial.
  As an admin, confirm the same action succeeds.
- **Owner edit smoke test**: as the actual approved owner of a test
  restaurant, confirm a profile edit succeeds; as a different
  authenticated user, confirm the same edit is denied.

**Rollback:**
- Redeploy the previous rules file captured in the "before deployment"
  step: `firebase deploy --only firestore:rules --project
  catering-planner-7f5d7` after checking out
  `firestore.rules.before-launch` as `firestore.rules` (or via git:
  `git show <previous-commit>:firestore.rules > firestore.rules` then
  deploy) — see `docs/ROLLBACK-PLAN.md` section 1 for the exact git-based
  procedure.

---

## 12. Hostinger deployment plan (prepared, NOT executed)

- **Node version**: `>=20.9.0` (pinned in `package.json`'s `engines`
  field) — use the newest available Node 20.x+ LTS on the chosen
  Hostinger product.
- **npm install method**: standard `npm install` against the committed
  `package-lock.json` (no `--force`, no manual lockfile edits — matches
  Task N's own established pattern).
- **Build**: `npm run build` (`next build`) — produces the standard
  `.next/` server output; **not** a static export, so `.next/` and
  `node_modules` both need to persist at runtime.
- **Start**: `npm run start` (`next start`), a persistent Node HTTP
  server, supervised by whatever process manager the chosen Hostinger
  product provides (restart-on-crash, restart-on-deploy).
- **Environment file**: the 6 required `NEXT_PUBLIC_FIREBASE_*`
  variables (values from the Firebase console, never invented or
  committed) configured as Hostinger environment variables, not a
  committed `.env` file. `NEXT_PUBLIC_SITE_URL` left unset in production.
- **Three-domain routing**: this is **one** Next.js process/deployment
  serving `smartserveuk.com`, `londonfoodhubs.com`, and `cikentikka.com`
  simultaneously via host-header checks in `proxy.ts` — Hostinger (or its
  DNS/reverse-proxy layer) needs all three domains pointed at the *same*
  running process, not three separate deployments.
- **londonfoodhubs.com apex**: canonical, no `www` served independently
  (Section 7); `www.londonfoodhubs.com` should 301-redirect to the apex
  at the DNS/CDN layer (or a host-based `proxy.ts` check, per
  `docs/HOSTINGER-DEPLOYMENT.md`'s own documented fallback) — not yet
  configured, since no DNS exists yet to redirect from.
- **SmartServeUK preservation**: nothing about this deployment changes
  SmartServeUK's own routes, data, or domain — it is the same process,
  same codebase, same Firestore project, already serving
  `smartserveuk.com` today in this architecture. Section 4's photo
  investigation confirms its existing hub photographs continue to work
  identically, unmodified.
- **CikenTikka preservation**: same reasoning — `proxy.ts`'s existing
  CikenTikka host-header check is untouched by this task and unaffected
  by adding `londonfoodhubs.com` DNS/hosting.

---

## 13. Smoke-test matrix (launch-day checklist, NOT executed)

### Public
- [ ] Homepage loads on `londonfoodhubs.com`
- [ ] Browse/restaurants listing loads
- [ ] Search returns results
- [ ] Filters (service type, dietary, cuisine) apply correctly
- [ ] Restaurant detail page loads, including menu
- [ ] Reviews display on a restaurant with approved reviews
- [ ] All four languages load without error: `/en`, `/bn`, `/ar`, `/fr`
- [ ] Arabic (`/ar`) renders right-to-left
- [ ] A sample hub photo (`/hubs/{slug}/hero.jpg` or similar) loads
      correctly on both `londonfoodhubs.com` and `smartserveuk.com`
      (Section 4)

### Authentication
- [ ] Sign-up succeeds on `londonfoodhubs.com`
- [ ] Login succeeds
- [ ] Logout succeeds
- [ ] Password-reset flow works if exercised (note: reset email links to
      `smartserveuk.com/login` today — expected, see P2-1)

### Restaurant
- [ ] Claim submission succeeds for an unclaimed test restaurant
- [ ] Claim shows `claim_pending` state correctly
- [ ] Approved owner has edit access; a different user does not
- [ ] Menu update saves correctly
- [ ] Opening-hours update saves correctly

### Admin
- [ ] Claims queue shows the test claim
- [ ] Approve action works
- [ ] Reject action works
- [ ] Restaurant overview loads
- [ ] Corrections queue loads
- [ ] Translation-request queue loads
- [ ] Import-candidate review loads

### Security
- [ ] Public restaurant document contains no claimant PII field (direct
      unauthenticated read)
- [ ] An unrelated authenticated user is denied reading a private
      `restaurant_claims` record
- [ ] A non-admin user is denied an admin-only action

### SEO
- [ ] Canonical tag on a sample page points at the non-`www` apex
- [ ] `sitemap.xml` resolves and lists locale-prefixed URLs
- [ ] hreflang alternates present on a sample page
- [ ] `robots.txt` disallows admin/dashboard/checkout/orders/staff paths

---

## 14. Rollback strategy

Full mechanics already documented in `docs/ROLLBACK-PLAN.md` — summarized
here per area, not duplicated:

- **Application deployment (Hostinger)**: keep the previous build
  artifact/commit available; stop the new process and restart the
  previous one (`docs/ROLLBACK-PLAN.md` section 4).
- **Firestore rules**: redeploy the previously-captured rules file from
  git history or the pre-deploy backup copy (`docs/ROLLBACK-PLAN.md`
  section 1).
- **Firestore indexes**: no single revert command exists — delete the
  specific problematic index via Firebase Console, or edit
  `firestore.indexes.json` and redeploy (`docs/ROLLBACK-PLAN.md`
  section 2).
- **Cloud Functions**: no one-command rollback — redeploy the previous
  source from the prior git commit, or delete the function if it should
  never have been deployed (`docs/ROLLBACK-PLAN.md` section 3).
- **GitHub release**: `git revert` the pushed commits, or reset the
  remote branch to a prior known-good SHA, with explicit human
  authorization — never force-pushed without that authorization.
- **Environment misconfiguration**: correct the specific Hostinger
  environment variable and restart the process; since these are read
  only at process start and hold no server-side secrets, this is
  low-risk and fully reversible.
- **What rolling back does NOT do**: per `docs/ROLLBACK-PLAN.md` section
  5 — rolling back code/rules does not retroactively undo any data
  written while the bad version was live; that requires separate,
  explicit data-level remediation if it ever comes up.

---

## 15. Launch authorization checklist

Before anyone actually executes Section 10:

- [ ] A human has explicitly authorized pushing to `origin/main`
- [ ] A human has explicitly authorized the Firestore rules deployment
      command in Section 11
- [ ] A human has explicitly authorized Hostinger account/DNS changes
- [ ] The 6 production Firebase environment variable values are in hand
      (from the Firebase console) and ready to enter into Hostinger —
      never committed to git
- [ ] The pre-deploy Firestore rules backup (Section 11) has been taken
- [ ] This document's P0 list (Section 8) is fully understood by whoever
      is deploying
- [ ] A rollback owner is identified who can execute Section 14 if needed

---

*This document does not authorize deployment. It is the evidence and the
plan. Deployment itself requires separate, explicit human authorization
at each numbered step in Sections 10–12.*
