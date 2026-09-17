import Link from "next/link";

const EFFECTIVE_DATE = "22 September 2026";
const PRIVACY_CONTACT_EMAIL = "mahtab@mbncon.com";

export default function CookiePolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-2">Cookie Policy</h1>
      <p className="text-sm text-neutral-500 mb-6">
        Effective date: {EFFECTIVE_DATE}
      </p>

      <p className="mb-4">
        This page describes the actual browser storage this website uses
        today. It intentionally does not describe cookies, analytics, or
        tracking that are not currently implemented.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        What we actually use
      </h2>
      <p className="mb-4">
        This website uses Firebase Authentication to let you sign in and
        stay signed in. To do this, it stores a small amount of information
        in your browser&apos;s local storage (and, as a fallback, session
        storage) — this is strictly necessary for account features to work
        and cannot be switched off without also switching off sign-in.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        What we do not use
      </h2>
      <p className="mb-4">
        This website does not currently use analytics cookies, performance
        cookies, advertising cookies, or any third-party tracking or
        profiling scripts (for example, Google Analytics or a Meta/Facebook
        pixel). Earlier wording on this page previously referred to
        analytics/performance cookies and a cookie-consent banner — that
        wording did not match what is actually implemented and has now been
        corrected.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        Why there is no cookie-consent banner
      </h2>
      <p className="mb-4">
        UK cookie-law guidance generally does not require a consent banner
        for storage that is strictly necessary for a service you have asked
        for — such as staying signed in. Because we do not currently use any
        non-essential cookies or tracking, we have not added a
        cookie-consent banner. If that changes in the future — for example,
        if we add analytics — we will update this page and add an
        appropriate consent mechanism before doing so, not after.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Contact</h2>
      <p>
        If you have any questions about this Cookie Policy, please contact
        us at{" "}
        <a className="underline" href={`mailto:${PRIVACY_CONTACT_EMAIL}`}>
          {PRIVACY_CONTACT_EMAIL}
        </a>
        . See also our{" "}
        <Link className="underline" href="/privacy-policy">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
