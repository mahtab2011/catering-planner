"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HomeHero() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [postcode, setPostcode] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set("q", searchTerm.trim());
    if (postcode.trim()) params.set("postcode", postcode.trim());
    router.push(`/search${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <section className="relative overflow-hidden border-b border-neutral-200 bg-linear-to-br from-amber-50 via-orange-50 to-rose-50">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="max-w-3xl">
          <div className="inline-flex rounded-full border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-800 shadow-sm">
            London&apos;s Food Discovery Platform
          </div>

          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
            Discover the World of Food Across London
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-700">
            Restaurants, home cooks, caterers and bakeries from every community — Bangladeshi,
            Indian, Pakistani, Turkish, Thai, Middle Eastern, African, Caribbean and beyond.
          </p>

          <form onSubmit={handleSearch} className="mt-8 rounded-2xl border border-neutral-200 bg-white p-3 shadow-lg sm:flex sm:items-center sm:gap-2 sm:p-2">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search restaurants, dishes or cuisines"
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-amber-500 sm:border-0 sm:flex-1"
            />
            <input
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              placeholder="Postcode or area"
              className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-amber-500 sm:mt-0 sm:w-48 sm:border-0"
            />
            <button
              type="submit"
              className="mt-2 w-full rounded-xl bg-amber-600 px-6 py-3 text-sm font-bold text-white hover:bg-amber-700 sm:mt-0 sm:w-auto"
            >
              Search
            </button>
          </form>
          <p className="mt-3 text-xs text-neutral-500">
            Postcode-based radius search is coming soon — for now this searches by area, hub and cuisine name.
          </p>
        </div>
      </div>
    </section>
  );
}
