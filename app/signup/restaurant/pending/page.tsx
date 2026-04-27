"use client";

import Link from "next/link";

export default function RestaurantSignupPendingPage() {
  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-10">
      <div className="mx-auto max-w-3xl rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="inline-flex rounded-full bg-amber-100 px-4 py-1 text-sm font-semibold text-amber-900">
          Application Received
        </div>

        <h1 className="mt-4 text-3xl font-bold text-neutral-900">
          Your restaurant signup has been submitted
        </h1>

        <p className="mt-3 text-neutral-600">
          Thank you for applying to join SmartServeUK. Your account has been
          created and your restaurant application is now pending review.
        </p>

        <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          We have received your details successfully.
        </div>

        <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
          <div className="text-base font-semibold text-neutral-900">
            What happens next
          </div>

          <div className="mt-4 space-y-3 text-sm text-neutral-700">
            <p>1. SmartServeUK reviews your restaurant application.</p>
            <p>2. We may contact you by phone or email if needed.</p>
            <p>3. Restaurant-only verification and OTP steps may follow next.</p>
            <p>
              4. Once approved, your restaurant account can move toward listing
              and onboarding.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Please use the same email address for future login and onboarding
          steps.
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/restaurants"
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-neutral-300 px-4 py-3 text-base font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            Back to restaurants
          </Link>

          <Link
            href="/"
            className="inline-flex flex-1 items-center justify-center rounded-xl bg-black px-4 py-3 text-base font-semibold text-white transition hover:bg-neutral-800"
          >
            Go to homepage
          </Link>
        </div>
      </div>
    </main>
  );
}