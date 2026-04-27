"use client";

import Link from "next/link";

export default function CustomerSignupSuccessPage() {
  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-10">
      <div className="mx-auto max-w-3xl rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="inline-flex rounded-full bg-emerald-100 px-4 py-1 text-sm font-semibold text-emerald-900">
          Customer Account Created
        </div>

        <h1 className="mt-4 text-3xl font-bold text-neutral-900">
          Your customer account is ready
        </h1>

        <p className="mt-3 text-neutral-600">
          Your SmartServeUK customer account has been created successfully.
        </p>

        <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          You can now use your details for ordering, account access, and future
          SmartServeUK features.
        </div>

        <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <div className="text-sm font-semibold text-neutral-800">
            What you can do now
          </div>

          <ul className="mt-2 space-y-1 text-sm text-neutral-700">
            <li>• Browse restaurants and food hubs.</li>
            <li>• Place orders when ordering goes live.</li>
            <li>• Manage your account and preferences.</li>
          </ul>
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