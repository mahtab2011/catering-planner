"use client";

import Link from "next/link";

export default function BlackCabSignupPendingPage() {
  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-10">
      <div className="mx-auto max-w-3xl rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="inline-flex rounded-full bg-neutral-900 px-4 py-1 text-sm font-semibold text-white">
          Partner Application Received
        </div>

        <h1 className="mt-4 text-3xl font-bold text-neutral-900">
          Your black cab partner application is pending review
        </h1>

        <p className="mt-3 text-neutral-600">
          Your partner account has been created successfully and your application
          has been submitted for review.
        </p>

        <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          SmartServeUK will review your transport partner details before activation.
        </div>

        <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
          <div className="text-base font-semibold text-neutral-900">
            What happens next
          </div>

          <div className="mt-4 space-y-3 text-sm text-neutral-700">
            <p>1. Your partner profile will be reviewed.</p>
            <p>2. We may contact you for onboarding and verification.</p>
            <p>3. Transport features will be enabled once approved.</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
          You will be notified when SmartServeUK transport services go live and
          your account is ready to operate.
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-neutral-300 px-4 py-3 text-base font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            Back to signup
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