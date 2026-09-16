/**
 * Static regression guards for the legal-content readiness work done in
 * Task M — see docs/LEGAL-READINESS.md and
 * docs/PRODUCTION-READINESS-AUDIT.md's "J-03". These are source-inspection
 * checks, not behavioral tests: they read the actual shipped source of the
 * legal pages and the site footer and assert a handful of specific
 * regressions can never silently reappear:
 *
 *   - the old placeholder legal text ("will be updated here") never comes
 *     back;
 *   - the footer's legal links still point at real pages that exist;
 *   - the Cookie Policy never re-claims analytics/performance cookies or a
 *     cookie-consent banner that don't exist;
 *   - the Terms page never describes checkout/payment/delivery/commission
 *     features that aren't implemented;
 *   - the Privacy Policy still describes claimant information as private
 *     (never on the public restaurant document).
 *
 * Dependency-free, runs in this environment.
 * Run: node tests/legal-pages/run-legal-content-tests.ts
 */

import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");

let passed = 0;
let total = 0;

function test(name: string, fn: () => void) {
  total += 1;
  try {
    fn();
    passed += 1;
    console.log(`  ok — ${name}`);
  } catch (err) {
    console.log(`  FAIL — ${name}`);
    console.log(`    ${err instanceof Error ? err.message : String(err)}`);
  }
}

function read(relativePath: string): string {
  return readFileSync(path.join(REPO_ROOT, relativePath), "utf8");
}

/** Collapses whitespace (including line-wraps inside JSX prose) to a
 *  single space, so a multi-word phrase check doesn't break just
 *  because the source happens to wrap mid-sentence. */
function normalize(source: string): string {
  return source.replace(/\s+/g, " ");
}

console.log("Legal pages — static regression guards (no Firestore, no emulator)\n");

const privacySource = read("app/privacy-policy/page.tsx");
const termsSource = read("app/terms/page.tsx");
const cookieSource = read("app/cookie-policy/page.tsx");
const footerSource = read("components/discovery/SiteFooter.tsx");

test("the old placeholder Privacy/Terms text has not been reintroduced", () => {
  for (const source of [privacySource, termsSource]) {
    assert.ok(
      !/will be updated here/i.test(source),
      "Expected no leftover placeholder 'will be updated here' wording"
    );
  }
  assert.ok(
    !/lorem ipsum/i.test(privacySource + termsSource + cookieSource),
    "Expected no lorem-ipsum placeholder text on any legal page"
  );
});

test("essential missing business-identity facts are marked with explicit bracketed placeholders, never invented", () => {
  for (const source of [privacySource, termsSource, cookieSource]) {
    // Any bracketed placeholder token must say it needs confirming —
    // this guards against someone "resolving" a placeholder by just
    // deleting the brackets around a guess.
    const bracketed = source.match(/\[[A-Z0-9 /]+\]/g) ?? [];
    for (const token of bracketed) {
      assert.ok(
        /TO CONFIRM BEFORE LAUNCH/.test(token),
        `Expected bracketed placeholder ${token} to say "TO CONFIRM BEFORE LAUNCH"`
      );
    }
  }
  // And the reverse: no invented-looking company registration/VAT/ICO
  // detail has snuck in anywhere on these pages.
  for (const source of [privacySource, termsSource, cookieSource]) {
    assert.ok(
      !/Company (No|Number)\.?\s*\d|Companies House|ICO registration|VAT (No|Number)\.?\s*\d/i.test(source),
      "Expected no invented company registration/VAT/ICO detail on legal pages"
    );
  }
});

test("the footer's legal links point at pages that actually exist", () => {
  for (const href of ["/privacy-policy", "/terms", "/cookie-policy"]) {
    assert.ok(
      footerSource.includes(`href: "${href}"`),
      `Expected SiteFooter's legalLinks to include href: "${href}"`
    );
  }
  for (const pagePath of [
    "app/privacy-policy/page.tsx",
    "app/terms/page.tsx",
    "app/cookie-policy/page.tsx",
  ]) {
    assert.ok(existsSync(path.join(REPO_ROOT, pagePath)), `Expected ${pagePath} to exist`);
  }
});

test("the Cookie Policy no longer claims analytics/performance cookies or a cookie-consent banner", () => {
  const normalized = normalize(cookieSource);
  // The old page affirmatively *offered* these as things the site does
  // ("Analytics cookies to understand usage" as a bullet, "via our
  // cookie banner") — the new page only ever mentions these words while
  // explicitly denying them, so check the old affirmative phrasing is
  // gone rather than banning the words outright.
  assert.ok(
    !/analytics cookies to understand usage/i.test(normalized),
    "Expected the old 'Analytics cookies to understand usage' bullet to be gone"
  );
  assert.ok(
    !/performance cookies to improve experience/i.test(normalized),
    "Expected the old 'Performance cookies to improve experience' bullet to be gone"
  );
  assert.ok(
    !/accept or reject non-essential cookies via our cookie banner/i.test(normalized),
    "Expected the Cookie Policy to no longer describe a cookie-consent banner that doesn't exist"
  );
  assert.ok(
    !/does not (currently )?use any (cookies|browser storage)/i.test(normalized),
    "Expected the Cookie Policy to correctly acknowledge Firebase Auth's essential browser storage, not claim none exists"
  );
  assert.ok(
    /Firebase Authentication/.test(normalized) && /local storage/i.test(normalized),
    "Expected the Cookie Policy to accurately describe Firebase Auth's local-storage usage"
  );
});

test("the Terms page never describes checkout/payment/delivery/commission features that aren't implemented", () => {
  const normalized = normalize(termsSource);
  const forbidden = [
    /add to (cart|basket)/i,
    /checkout/i,
    /card details/i,
    /delivery fee/i,
    /commission rate/i,
    /booking guarantee/i,
    /process(es|ing)? your payment/i,
  ];
  for (const pattern of forbidden) {
    assert.ok(
      !pattern.test(normalized),
      `Expected the Terms page to never match ${pattern} (unimplemented transactional feature)`
    );
  }
  assert.ok(
    /does not currently process online food orders, payments, bookings, or deliveries/i.test(normalized),
    "Expected the Terms page to explicitly disclaim order/payment/booking/delivery processing"
  );
});

test("the Privacy Policy describes claimant information as private, never as part of the public listing", () => {
  const normalized = normalize(privacySource);
  assert.ok(
    /never (be )?included in the public restaurant listing/i.test(normalized),
    "Expected the Privacy Policy to state claimant information is never part of the public restaurant listing"
  );
  assert.ok(
    /only accessible to you.*and to platform administrators/i.test(normalized),
    "Expected the Privacy Policy to state claim records are only accessible to the claimant and administrators"
  );
});

test("the Privacy Policy correctly states no analytics/advertising tracking is used", () => {
  const normalized = normalize(privacySource);
  assert.ok(
    /do not currently run any analytics, advertising, or third-party tracking/i.test(normalized),
    "Expected the Privacy Policy to state no analytics/advertising tracking is currently run"
  );
});

test("the Privacy Policy honestly discloses English-only legal text despite four supported site languages", () => {
  const normalized = normalize(privacySource);
  assert.ok(
    /published in English only/i.test(normalized),
    "Expected the Privacy Policy to disclose it is English-only"
  );
  assert.ok(
    /Bengali/i.test(normalized) && /Arabic/i.test(normalized) && /French/i.test(normalized),
    "Expected the Privacy Policy to name the site's other three supported languages"
  );
});

console.log(`\n${passed}/${total} tests passed.`);
if (passed !== total) {
  console.log("\nSome tests FAILED.");
  process.exit(1);
}
console.log("\nAll legal-page static guards passed. No Firestore, no emulator, no credentials.");
