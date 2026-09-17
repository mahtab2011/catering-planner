# Hostinger Deployment

Status: this document describes how to deploy this application to a
Hostinger-hosted persistent Node.js environment. **Nothing in this document
has been executed.** No Hostinger account/server has been configured, no DNS
has been changed, and no credentials appear anywhere below — only variable
*names*, never values. See the London Restaurant Data Foundation + Hostinger
Production Readiness task's final report for what was and wasn't done.

## Why Hostinger, not Vercel

**Confirmed decision:** London Food Hubs deploys to Hostinger, not Vercel.
Firebase (Authentication, Firestore, Functions) stays exactly where it is —
this only changes where the Next.js *application* itself runs.

An inspection of the actual codebase found **no real Vercel runtime
coupling** — no `@vercel/*` package, no `vercel.json`, no Vercel-specific
API usage (Edge Config, Vercel KV, Vercel Blob, Vercel Analytics, Vercel's
Image Optimization API, etc.). The only "Vercel" references anywhere in this
repository were: a `.gitignore` entry for a local `.vercel` directory
(harmless, standard `create-next-app` scaffold boilerplate), a stock
"Deploy on Vercel" section in `README.md` (unedited `create-next-app`
boilerplate), and prose in `docs/ROLLBACK-PLAN.md` /
`docs/LONDON-FOOD-HUBS-LAUNCH-CHECKLIST.md` describing a Vercel rollback
mechanism that has never actually been exercised (no Vercel project for this
app has ever existed) — both now corrected to describe the Hostinger
rollback procedure instead (see "Rollback procedure" below and
`docs/ROLLBACK-PLAN.md` section 4).

In short: this move is not "removing Vercel dependencies" (there were
essentially none), it's confirming a standard Next.js server deployment
target and centralizing the one thing that genuinely needed to change — the
production domain (see "Production origin" below).

## Prerequisites

- A Hostinger plan that supports a **persistent Node.js process** (this app
  uses `next start`, Next.js's standard server mode — it is not a static
  export and does not use `output: "export"` or `output: "standalone"`, so
  it needs an actual running Node process, not pure static file hosting).
- Git access to this repository from the Hostinger environment (or a CI
  step that builds and ships the built output — the exact mechanism depends
  on which Hostinger product/plan is used, which has not been chosen or
  configured as part of this task).
- The 6 Firebase `NEXT_PUBLIC_*` environment variable values (see
  "Environment variables" below) — available from the Firebase console,
  never generated or invented by this deployment process.

## Node version

`package.json` now pins:

```json
"engines": { "node": ">=20.9.0" }
```

No version was pinned before this task — this is a new addition, since
Next.js 16 requires a modern Node runtime and there was previously nothing
in the repository signaling which version a host should provision. Use the
newest Node 20.x (or later) LTS release Hostinger's Node hosting product
offers.

## Build command

```
npm install
npm run build
```

`npm run build` runs `next build` (unchanged — this was already
Hostinger-compatible before this task; nothing about the build process
itself was Vercel-specific). This produces Next.js's standard `.next/`
server output — **not** a static export, so the `.next/` directory and
`node_modules` both need to be present at runtime, not just uploaded as
static assets.

## Start command

```
npm run start
```

Runs `next start` (unchanged), which starts a persistent Node HTTP server
(default port 3000, override with the `PORT` environment variable if
Hostinger's Node hosting product requires a specific port — this wasn't
configured as part of this task since it depends on the specific Hostinger
product chosen). This process needs to be supervised (restarted on crash,
restarted on deploy) by whatever process manager Hostinger's Node hosting
product provides — which one that is depends on the specific plan/product
and was not selected as part of this task.

The existing `dev` script
(`powershell ... $env:NEXT_DISABLE_TURBOPACK='1'; next dev`) is a
Windows-specific local-development convenience and is **not** used for
deployment — only `build` and `start` matter for Hostinger.

## Environment variables Hostinger will need

**Names only — see `.env.example` for the authoritative list. No values are
given here or anywhere in this repository.**

Required (Firebase client config — all safe to expose to the browser,
these identify the Firebase project rather than authenticate as anything):

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

Optional:

- `NEXT_PUBLIC_SITE_URL` — see "Production origin" below. Leave unset in
  production; the app defaults to `https://londonfoodhubs.com` when
  `NODE_ENV=production` and no override is given. Set it explicitly only
  for a non-production deployment (e.g. a future staging environment on a
  different origin), so that environment's canonical/hreflang/sitemap URLs
  correctly reflect its own domain instead of production's.

No server-only secrets exist in this application today — `lib/firebase.ts`
only ever reads the 6 `NEXT_PUBLIC_*` variables above, and the frontend
never calls a Firebase Cloud Function via `httpsCallable` (see "Firebase
Functions" below), so there is no server-side Firebase Admin credential or
API secret for this Next.js app to hold. (The separate `functions/`
directory has its own credential model, entirely independent of this
Next.js deployment — see `functions/README.md`.)

## Production origin

`lib/site.ts` is the single source of truth for London Food Hubs' own
production URL — see `docs/MULTILINGUAL-ARCHITECTURE.md`'s SEO section for
how this is wired into every canonical tag, hreflang alternate, sitemap
entry, and OpenGraph/Twitter URL. Resolution order: `NEXT_PUBLIC_SITE_URL`
if set, else `http://localhost:3000` in development, else
`https://londonfoodhubs.com` in production. **No code change is needed to
deploy to production** — just don't set `NEXT_PUBLIC_SITE_URL`, and the
default takes over.

This is scoped specifically to the London Food Hubs consumer subtree
(`app/[locale]/...`). SmartServeUK's own operational pages keep their own,
separately-hardcoded `smartserveuk.com` default metadata
(`app/layout.tsx`) — a different, legitimate domain for a different part of
this same codebase, deliberately not touched by this centralization.

## www policy

**Canonical: `https://londonfoodhubs.com`** (no `www`). Every
canonical/hreflang/sitemap/OpenGraph URL this application emits already
uses the non-`www` form (`lib/site.ts`'s `PRODUCTION_SITE_URL`). This
document does not configure DNS or a web-server-level redirect — that's
explicitly out of scope for this task — but records the intended policy so
whoever does configure DNS knows what to set up:

> `https://www.londonfoodhubs.com` should redirect (301) to
> `https://londonfoodhubs.com`, not the other way around, and not serve
> both as independently indexable origins.

This is typically configured either at the DNS/CDN layer (a redirect rule
on the `www` subdomain) or, if Hostinger's setup makes that impractical, a
narrow check in `proxy.ts` — but that would need to be host-based
(`request.headers.get("host")`), the same pattern already used for the
CikenTikka domain check, and was **not added** as part of this task since
no DNS exists yet to redirect from.

## Firebase authorized domains (do before production auth testing)

**STATUS UPDATE (Task P):** the production Firebase project has now been
positively identified as `catering-planner-7f5d7` (from
`NEXT_PUBLIC_FIREBASE_PROJECT_ID`/`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` in
this machine's `.env.local`, corroborated by `lib/site.ts`'s
`PRODUCTION_SITE_URL` and the fact that `lib/firebase.ts` is the single,
only Firebase initialization point in this entire codebase — every
sign-in, signup, restaurant-claim, and owner-workspace flow uses this same
project). Per the "www policy" section above, **only the apex
`londonfoodhubs.com` is intended to serve the application** —
`www.londonfoodhubs.com` is meant to be a pure 301 redirect to the apex,
never an independently-served origin, so it does not need to be a Firebase
Authorized Domain unless that policy changes.

**The actual authorized-domains change was NOT made in Task P** — blocked
before Phase 4/6, not skipped: the local Firebase CLI (`firebase-tools`)
has no authenticated account (`firebase login:list` → "No authorized
accounts") and, independent of login state, **`firebase-tools` has no
command at all for managing Authorized Domains** (confirmed via
`firebase auth --help` — only `auth:export`/`auth:import` for user data
exist). This setting is only configurable through the Firebase Console UI
or the underlying Identity Platform Admin API with its own separate
credentials — neither of which this task is set up to use safely without
interactive user action, per its own explicit instructions not to log in
with anyone else's credentials or reach for an undocumented/private API
workaround.

**Exact steps for whoever has console access to this project:**

1. Go to
   `https://console.firebase.google.com/project/catering-planner-7f5d7/authentication/settings`
   (Authentication → Settings → Authorized domains).
2. Confirm the existing authorized domains list (should already include
   `localhost` and `catering-planner-7f5d7.firebaseapp.com`/
   `.web.app` by Firebase default, plus whatever SmartServeUK domain(s)
   were added previously — do not remove any of these).
3. Click "Add domain", enter exactly `londonfoodhubs.com`, and save.
4. Do **not** add `www.londonfoodhubs.com` unless the www-redirect policy
   above is deliberately changed to serve `www` standalone.
5. Re-open the same settings page afterward and confirm the full domain
   list still contains everything it did before, plus `londonfoodhubs.com`.

## Firebase Functions

London Food Hubs continues to use Firebase Functions (`functions/index.js`
— `setAdminClaim`, an `onCall` callable, and `onReviewWrite`, a Firestore
trigger). Moving the frontend host to Hostinger does not change this at
all: an inspection confirmed the frontend never calls a Cloud Function via
`httpsCallable` anywhere in `app/`, `components/`, or `lib/` today (the only
`httpsCallable` reference in the whole repository is inside a code comment
in `functions/index.js` showing example usage, not a live call site) — so
there is no Vercel-only or Hostinger-only assumption in how the frontend
talks to Functions, because the frontend currently doesn't talk to them at
all. `onReviewWrite` is purely Firestore-write-triggered and runs
independent of wherever the Next.js app is hosted. **Functions were not
deployed, redeployed, or modified as part of this task.**

## Image handling

No `next/image` usage exists anywhere in this codebase (13 raw `<img>` tags
across 10 files, confirmed by repository-wide search) and `next.config.ts`
has no `images` block. This means there is no dependency on Vercel's Image
Optimization API to replace or reconfigure for Hostinger — images are
served exactly as-is, unoptimized, regardless of host. This was true before
this task and remains unchanged; adopting `next/image` (with Hostinger-
compatible image optimization, e.g. a custom loader) would be a separate,
future performance improvement, not something this deployment move
requires.

## Rendering mode

No page or route in this codebase sets `output: "export"`,
`output: "standalone"`, `export const dynamic`, or `export const
revalidate` (confirmed by repository-wide search) — the app runs on
Next.js's default server rendering with no static export and no ISR
revalidation configured. This is exactly what `next start` on a persistent
Hostinger Node process is designed to serve; no rendering-mode change was
needed or made for this task.

## Middleware / proxy.ts

`proxy.ts` (this project's Next.js middleware file — Next 16 uses this
filename/export-name convention; verified working via a real
`npm run build` + `npm start` + curl smoke pass, not just assumed) runs
next-intl's locale middleware for `/` and the 4 active locale prefixes, and
a host-header check for the CikenTikka domain. Both mechanisms run inside
Next.js's own middleware layer, which `next start` executes identically
regardless of host — there is nothing Vercel-Edge-specific about it (no
`export const config = { runtime: "edge" }` opt-in beyond Next's own
default, no Vercel Edge Config/KV usage). No change was needed for
Hostinger portability.

## robots.txt / sitemap.xml

`app/robots.ts` (new — didn't exist before this task) and `app/sitemap.ts`
(existing, now reading from `lib/site.ts`) both resolve via Next.js's
built-in metadata route convention (`/robots.txt`, `/sitemap.xml`), which
`next start` serves the same way on any host. Verified via a real build:
`robots.txt` correctly disallows admin/dashboard/checkout/orders/staff/
kitchen/account-style private paths and references
`https://londonfoodhubs.com/sitemap.xml`; `sitemap.xml` emits one entry per
active locale for every consumer route plus the one SmartServeUK
operational entry (`/suppliers`) on its own domain.

## Locale routing

Confirmed working end-to-end via the real production build: `/` redirects
to `/en`, all 4 active locales (`en`/`bn`/`ar`/`fr`) serve correctly, every
legacy pre-migration URL redirects to its `/en/...` equivalent. None of this
depends on Vercel — it's standard Next.js middleware + App Router dynamic
segments, unaffected by the Hostinger move.

## Build verification (already run this task)

```
npx tsc --noEmit        # clean
npm run build            # clean, 140 routes generated including every
                          # app/[locale]/... page and /robots.txt, /sitemap.xml
npm start                 # started successfully; smoke-tested via curl
                          # (see the task's final report for the full list
                          # of routes checked)
```

## Health / smoke checks (for whoever performs the actual Hostinger deploy)

Once a real deployment exists, at minimum re-run:

- `GET /` → 307 to `/en`
- `GET /en`, `/bn`, `/ar`, `/fr` → 200, correct `<html lang>`/`dir`
- `GET /robots.txt` → 200, correct `Sitemap:` line pointing at the live domain
- `GET /sitemap.xml` → 200, `<loc>` entries on the live domain
- A representative SmartServeUK operational route (e.g. `/login`) → 200,
  unaffected metadata
- `/cikentikka` and `/blackcab` → 200, unaffected
- Firebase sign-in on the live domain (only works once the domain is added
  to Firebase Auth's authorized domains — see above)

## Rollback procedure

See `docs/ROLLBACK-PLAN.md` section 4 (updated by this task to describe the
Hostinger procedure instead of the never-actually-used Vercel one): checkout
a previous known-good commit, `npm install && npm run build`, restart the
supervised Node process. Tagging each real production deploy with a git tag
(not done as part of this task — there's no deployment yet to tag) makes
this fast under pressure.

## What this task explicitly did NOT do

- Did not create, configure, or connect to any Hostinger account, server,
  or hosting product.
- Did not change DNS in any way.
- Did not connect `londonfoodhubs.com` to anything.
- Did not modify live Firebase configuration (including authorized
  domains).
- Did not deploy the application, Firebase Functions, or Firestore rules.
- Did not push any commit.
