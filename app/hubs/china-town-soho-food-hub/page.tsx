"use client";

import Link from "next/link";

export default function HubPage() {
  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/"
            className="text-sm text-emerald-700 hover:underline"
          >
            ← Back to Home
          </Link>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
          Edgware Road Arabian Food Hub
        </h1>

        {/* Description */}
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
          A strong Middle Eastern and Arabian dining corridor with high tourist visibility,
          late-night demand, grills, desserts, and a vibrant food culture.
        </p>

        {/* Section placeholder */}
        <div className="mt-8 rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-500">
          Restaurants coming soon...
        </div>

      </div>
    </main>
  );
}