"use client";

import Link from "next/link";
import { getHubBySlug } from "@/lib/hubs";

const hub = getHubBySlug("china-town-soho-food-hub");

export default function ChinaTownSohoFoodHubPage() {
  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        <div className="mb-6">
          <Link href="/" className="text-sm text-emerald-700 hover:underline">
            ← Back to Home
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
          {hub?.name || "China Town (Soho) Food Hub"}
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
          {hub?.description.en ||
            "A globally recognised central London food destination known for East Asian restaurants and dessert shops."}
        </p>

        {hub?.cuisineTags && hub.cuisineTags.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {hub.cuisineTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-8 rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-500">
          Restaurant listings for this hub are coming soon.{" "}
          <Link href="/signup/restaurant" className="font-semibold text-emerald-700 underline">
            Own a business here? List it free
          </Link>
          .
        </div>
      </div>
    </main>
  );
}
