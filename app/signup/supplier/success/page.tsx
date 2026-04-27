"use client";

import Link from "next/link";

export default function SupplierSignupSuccessPage() {
  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="inline-flex rounded-full bg-sky-100 px-5 py-2 text-sm font-semibold text-sky-800">
            Supplier Account Created
          </div>

          <h1 className="mt-6 text-4xl font-bold tracking-tight text-neutral-950 sm:text-5xl">
            Your supplier account is ready
          </h1>

          <p className="mt-4 max-w-3xl text-lg text-neutral-600">
            Your SmartServeUK supplier account has been created successfully.
          </p>

          <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 px-6 py-5 text-base text-green-900">
            ✔ Your supplier profile has been created and saved.

            <div className="mt-3 text-sm">
              Your business details, products, and promotion settings are now
              part of the SmartServeUK supplier network.
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
            <h2 className="text-lg font-semibold text-neutral-900">
              What you can do now
            </h2>

            <ul className="mt-3 space-y-2 text-sm text-neutral-700">
              <li>• View your supplier listing</li>
              <li>• Add or update products, photos, and pricing</li>
              <li>• Promote offers and discounts to attract restaurants</li>
              <li>• Connect with restaurants and catering businesses</li>
            </ul>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <Link
              href="/suppliers"
              className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-4 text-base font-semibold text-white transition hover:bg-blue-700"
            >
              View Supplier Listing
            </Link>

            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 bg-white px-4 py-4 text-base font-semibold text-neutral-800 transition hover:bg-neutral-100"
            >
              Go to Homepage
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}