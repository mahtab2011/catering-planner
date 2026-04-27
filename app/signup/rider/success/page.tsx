"use client";

import Link from "next/link";

export default function RiderSignupSuccessPage() {
  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-10">
          
          {/* STATUS BADGE */}
          <div className="inline-flex rounded-full bg-amber-100 px-5 py-2 text-sm font-semibold text-amber-800">
            Application Received
          </div>

          {/* TITLE */}
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-neutral-950 sm:text-5xl">
            Your rider application is submitted
          </h1>

          {/* DESCRIPTION */}
          <p className="mt-4 max-w-3xl text-lg text-neutral-600">
            Thank you for applying to join SmartServeUK as a rider.
          </p>

          {/* INFO BOX */}
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5 text-base text-amber-900">
            Your details have been received and are currently under review.
            We will contact you after approval and activation.
          </div>

          {/* NEW: WHAT HAPPENS NEXT */}
          <div className="mt-8 rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
            <h2 className="text-lg font-semibold text-neutral-900">
              What happens next?
            </h2>

            <ul className="mt-3 space-y-2 text-sm text-neutral-700">
              <li>• Your rider profile will be reviewed by our team</li>
              <li>• You may be contacted for verification</li>
              <li>• Once approved, your rider account will be activated</li>
              <li>• You will be able to receive delivery opportunities</li>
            </ul>
          </div>

          {/* ACTION BUTTONS */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <Link
              href="/signup/rider"
              className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 bg-white px-4 py-4 text-base font-semibold text-neutral-800 transition hover:bg-neutral-100"
            >
              Back to signup
            </Link>

            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-2xl bg-black px-4 py-4 text-base font-semibold text-white transition hover:bg-neutral-800"
            >
              Go to homepage
            </Link>
          </div>

        </div>
      </div>
    </main>
  );
}