# Legal / Privacy / Terms Readiness — Task M

Written for: whoever decides when London Food Hubs' legal-information
surfaces are ready to launch on `londonfoodhubs.com`. This is a
repository-level, practical documentation task, **not a claim of formal
legal advice or regulatory certification.** Nothing in this document or in
the pages it describes should be read as a solicitor-reviewed legal
opinion — none of it has been reviewed by a solicitor.

**Read this alongside** `docs/PRODUCTION-READINESS-AUDIT.md` (the overall
launch-gate audit — see its "STATUS UPDATE (Task M)" section for how this
task changes J-03's status), `docs/RESTAURANT-CLAIM-WORKFLOW.md` (claimant
PII architecture), and `docs/FIRESTORE-SECURITY-AUDIT.md` /
`docs/PRODUCTION-READINESS-AUDIT.md`'s J-01/J-02 (the underlying data
protections this policy describes).

## What this task did

Replaced the placeholder `/privacy-policy` and `/terms` pages (previously
one sentence each: "SmartServeUK privacy/terms ... will be updated here.")
with substantive content, and corrected `/cookie-policy` (previously real
generic content describing tracking that doesn't exist — analytics
cookies, performance cookies, a cookie-consent banner). All three pages
were written by first auditing the application's actual, implemented data
practices — not by drafting generic legal boilerplate and hoping it fit.

## Phase 1 — actual personal-data categories identified

Traced directly from `lib/types.ts`, `firestore.rules`, and the actual
forms/components that write to each collection:

| Category | Where it lives | What it actually contains |
|---|---|---|
| A. Public restaurant/business information | `restaurants/{id}` (public fields) | Name, description, menu, cuisine, address, phone/email/website, opening hours, images — business information, not personal to an individual |
| B. Authenticated-user information | `users/{uid}` | Full name, email, optional phone, account role (`customer`/`restaurant`/`caterer`/`supplier`/`household`/`admin`) |
| C. Claimant private information | `restaurant_claims/{claimId}` | Claimant name, business contact email, optional role/phone/note — **never on the public restaurant document**, readable only by the claimant and admins (Task K/L) |
| D. Administrative/workflow information | `moderatedBy`/`moderatedAt`/`moderationNote` on reviews and correction requests; `decidedBy`/`decidedAt` on claims | Internal audit trail of who actioned what — never publicly readable |
| E. Customer-generated content | `reviews/{id}` | Display name, star rating, review text, tied to the reviewer's account |
| F. Technical information | Firebase Auth session persistence (`indexedDBLocalPersistence`/`browserLocalPersistence`/`browserSessionPersistence`) | Browser-local sign-in state only — no analytics, no fingerprinting, no third-party tracking |

Also covered: `restaurant_correction_requests` (submitter uid, optional
email, free-text correction/removal detail),
`restaurant_translation_requests` (requester uid, restaurant id, status —
no pricing/payment fields are ever populated by anything in this
codebase), and `restaurant_signups` (business name, owner name, phone,
email, cuisines, free-text notes — the restaurant onboarding-application
form, a SmartServeUK-era flow still in active use).

**Not claimed**: nothing about order processing, payment data, or delivery
data, because none of that is implemented anywhere in this codebase.

## Phase 2 — third-party services (re-confirmed)

- **Firebase Authentication** (`lib/firebase.ts`) — account sign-in,
  browser-local session persistence.
- **Cloud Firestore** (`lib/firebase.ts`) — the application database.
- **Firebase Storage** — configured in `firebaseConfig` but **not actually
  used anywhere** (`firebase/storage` is never imported); all image/media
  fields on `RestaurantDoc` are plain owner-entered URLs, not uploads.
- **Firebase Functions** — used server-side for a small number of
  Admin-SDK-only scripts (e.g. `onReviewWrite`, import-staging scripts);
  not directly relevant to what a visitor's browser does.
- **Hostinger** — hosting provider (per `docs/HOSTINGER-DEPLOYMENT.md`);
  not deployed or touched by this task.
- **Google Maps** — one static, unauthenticated `<iframe>` embed of
  `google.com/maps` on a single legacy SmartServeUK hub page
  (`app/plashet-road-food-hub/page.tsx`); no API key, no JS SDK, no
  location tracking of the visitor.
- **Google Fonts** (`next/font/google`, Geist/Geist Mono) — fetched at
  **build time only** (see Task L's and this task's own build notes below)
  and self-hosted from the app's own origin at runtime; this is not a
  runtime third-party request from a visitor's browser and has no cookie
  implications.
- **Analytics/advertising/tracking**: **re-confirmed zero** — no Google
  Analytics, Meta/Facebook Pixel, Hotjar, Mixpanel, Segment, or any similar
  library anywhere in `package.json` or the source tree. Matches Task J's
  and Task L's independent findings.
- **Email/notification service**: none. No `sendgrid`/`mailgun`/`nodemailer`/
  SMTP integration exists — matches
  `docs/RESTAURANT-CLAIM-WORKFLOW.md`'s existing note that claim-decision
  notifications are UI-only, not emailed.

## Phase 3/7 — existing legal surfaces, before and after

| Page | Before | After |
|---|---|---|
| `/privacy-policy` | One sentence: "SmartServeUK privacy policy will be updated here." | Full policy: operator identity (placeholder), what's collected (by category, matching the table above), why, third-party providers, retention (no invented periods), security, user rights/contact, children, changes, language notice |
| `/terms` | One sentence: "SmartServeUK terms and conditions will be updated here." | Full terms describing the actual product (restaurant discovery/directory — explicitly **not** an ordering/payment/delivery platform), accounts, listings, claims, owner responsibilities, reviews, corrections, translations (no pricing), acceptable use, third-party links, IP, suspension, disclaimers, conservative liability language, England & Wales governing law, changes, contact |
| `/cookie-policy` | Real content, but described "analytics cookies," "performance cookies," and a "cookie banner" that don't exist | Corrected to describe only Firebase Auth's actual local-storage sign-in persistence; explicitly states no analytics/advertising/tracking cookies exist; explains why no consent banner has been added, and commits to adding one if that ever changes |

None of SmartServeUK's other pages were changed. The footer
(`components/discovery/SiteFooter.tsx`) already linked all three pages
correctly — no navigation changes were needed.

## Phase 8 — claimant privacy, as described to users

The Privacy Policy explains, at a user-appropriate level (no Firestore
implementation detail), that claim information is private: only the
claimant and platform administrators can see it, and it is never part of
the public restaurant listing. It does not promise absolute security — it
says access is restricted, and separately notes that no method of storing
or transmitting information is completely secure.

## Phase 9/10/11 — restaurant data, reviews, translations

- **Restaurant data**: the Privacy Policy and Terms both explain that
  listing information may come from the owner, public sources, or an
  approved correction/import workflow, without claiming any particular
  source is complete or guaranteed accurate.
- **Reviews**: described accurately — own genuine content, moderation
  step (pending/approved/rejected), no invented moderation capability
  beyond what the `status`/`moderatedBy`/`moderationNote` fields actually
  support.
- **Translations**: platform UI may be shown in the visitor's chosen
  language; a restaurant's own supplied content is not auto-translated
  unless the owner has requested and approved a translation; reviews stay
  in their original language. No pricing/payment language used anywhere,
  consistent with `RestaurantTranslationRequestDoc`'s own comment that no
  payment processing exists in this codebase.

## Phase 13 — language/localization status (honest, not invented)

The rest of the site (`app/[locale]/...`) supports English, Bengali,
Arabic, and French via `next-intl` and `messages/{en,bn,ar,fr}.json`. The
three legal pages live **outside** `app/[locale]` and are **not**
localized through that architecture — they are plain English-only React
components, exactly as the placeholder versions were before this task.

**This task did not machine-translate the new legal text into the other
three languages.** Doing so for legally significant text without human
legal review would risk creating an authoritative-sounding but unreviewed
translation — worse than clearly stating English is authoritative. Each
new page includes an explicit, honest notice: this policy is published in
English only, English is the authoritative version, and translated
versions are not yet available.

The footer's own link *labels* ("Privacy Policy" / "Terms" / "Cookie
Policy") were already fully translated in all four `messages/*.json`
files before this task and needed no changes — only the destination
pages' body content is English-only.

## Phase 14 — footer / navigation

No changes needed. `components/discovery/SiteFooter.tsx` already links
`/privacy-policy`, `/terms`, and `/cookie-policy` from every major London
Food Hubs consumer surface (home, restaurants, hubs, cuisines, reviews,
blog, recommendations, search) via a shared `SiteFooter` component. Link
targets were verified to still resolve to real, existing page files.

## Phase 15 — consent / acknowledgement wording

Inspected `RestaurantClaimPanel.tsx` (claim submission and
correction/removal requests) and the review-submission flow: **no
existing consent or acknowledgement wording exists on any of these
forms.** Per this task's explicit instruction not to add unnecessary
consent checkboxes or treat consent as a universal legal basis, none was
added. The restaurant-signup form (`app/signup/restaurant/page.tsx`)
already writes a `consentToContact` field — that field's own logic was
not touched.

## Phase 16 — placeholder gate (full, unhidden)

A repository-wide search confirmed:

- No `lorem ipsum` anywhere.
- No leftover "will be updated here" placeholder text.
- No stale tracking claims ("analytics cookies," "performance cookies,"
  "cookie banner") outside of the new pages' own explicit *denial* of
  them.
- No invented company registration number, VAT number, ICO registration
  number, or Companies House reference anywhere.

**Every remaining essential placeholder, listed in full — these are P0
and require your confirmation before launch:**

| Placeholder | Appears on | What's needed |
|---|---|---|
| `[OPERATOR LEGAL NAME TO CONFIRM BEFORE LAUNCH]` | `/privacy-policy`, `/terms` | The real legal entity operating this service |
| `[REGISTERED BUSINESS ADDRESS TO CONFIRM BEFORE LAUNCH]` | `/privacy-policy` | The real registered/business address |
| `[PRIVACY CONTACT EMAIL TO CONFIRM BEFORE LAUNCH]` | `/privacy-policy`, `/cookie-policy` | A real, monitored inbox for privacy requests |
| `[LEGAL CONTACT EMAIL TO CONFIRM BEFORE LAUNCH]` | `/terms` | A real, monitored inbox for terms/legal queries |
| `[EFFECTIVE DATE TO CONFIRM BEFORE LAUNCH]` | all three pages | The actual date these terms take effect (should be set at, not before, real launch) |

These are not cosmetic — they are the business/legal facts this task was
explicitly instructed never to invent. **J-03 remains P0 until these are
filled in with confirmed real values.**

## Tests added

`tests/legal-pages/run-legal-content-tests.ts` (new, 8/8 passing,
dependency-free — no Firestore, no emulator). Guards:

1. Old placeholder Privacy/Terms text never reintroduced.
2. Essential missing business-identity facts stay explicit
   `[... TO CONFIRM BEFORE LAUNCH]` placeholders, never silently replaced
   with an invented-looking value.
3. The footer's legal links still resolve to real page files.
4. The Cookie Policy never re-claims analytics/performance cookies or a
   cookie-consent banner that don't exist, and still accurately describes
   Firebase Auth's local-storage usage.
5. The Terms page never describes checkout/payment/delivery/commission
   features that aren't implemented, and keeps its explicit disclaimer.
6. The Privacy Policy keeps describing claimant information as private.
7. The Privacy Policy keeps stating no analytics/advertising tracking is
   used.
8. The Privacy Policy keeps its honest English-only disclosure.

## Remaining launch blockers (legal surface)

1. **Confirm the 5 placeholders above** with real, verified values — a
   business/legal decision, not an engineering one. This document and the
   pages themselves make every remaining gap visible rather than hiding
   it behind confident-sounding placeholder prose.
2. Consider (separately, not part of this task) having the final,
   fact-complete text reviewed by a solicitor before relying on it for
   real regulatory purposes — nothing produced by this task should be
   described as solicitor-reviewed.
3. J-01/J-02 (Firestore rules) and J-04 (Firebase Authorized Domains)
   remain open per `docs/PRODUCTION-READINESS-AUDIT.md` — unaffected by
   this task.
