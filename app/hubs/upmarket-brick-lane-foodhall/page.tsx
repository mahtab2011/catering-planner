"use client";

import Link from "next/link";
import { getHubBySlug } from "@/lib/hubs";

// Migrated to read from lib/hubs.ts, the single canonical hub data
// source. This also replaces a stale "photos coming tomorrow"
// placeholder — real photos exist in public/hubs/
// upmarket-brick-lane-foodhall/ (confirmed on disk) and are already
// referenced by the canonical hub data; they just weren't wired up
// here.
const hub = getHubBySlug("upmarket-brick-lane-foodhall");

const FEATURED_IMAGE = hub?.heroImage || "";
const GALLERY_IMAGES = (hub?.gallery || []).filter((src) => src !== FEATURED_IMAGE);

export default function UpmarketPage() {
  return (
    <main className="min-h-screen bg-sky-50/40">
      {/* HERO */}
      <section className="border-b border-sky-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="inline-flex rounded-full bg-sky-100 px-4 py-1 text-sm font-semibold text-sky-900">
            East London Food Hub
          </div>

          <h1 className="mt-4 text-4xl font-bold text-neutral-900 md:text-5xl">
            {hub?.name || "Upmarket Brick Lane"}
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-neutral-600">
            {hub?.description.en ||
              "A unique indoor food market in the heart of Brick Lane, bringing together independent food traders, global street food concepts, and a strong weekend destination crowd under one roof."}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {(hub?.cuisineTags || ["Global Street Food"]).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800"
              >
                {tag}
              </span>
            ))}
            <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
              Weekend Market
            </span>
            <span className="rounded-full bg-pink-100 px-3 py-1 text-sm font-medium text-pink-800">
              Independent Traders
            </span>
            <span className="rounded-full bg-sky-100 px-3 py-1 text-sm font-medium text-sky-800">
              Indoor Food Hall
            </span>
            <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-800">
              Youth & Tourists
            </span>
          </div>
        </div>
      </section>

      {/* FEATURED IMAGE */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-sm">
          {FEATURED_IMAGE ? (
            <img
              src={FEATURED_IMAGE}
              alt="Upmarket Brick Lane featured view"
              className="h-65 w-full object-cover md:h-105"
            />
          ) : (
            <div className="flex h-65 w-full items-center justify-center bg-white md:h-105">
              <div className="text-center text-neutral-400">
                <div className="text-lg font-semibold text-neutral-500">
                  Photos coming soon
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-sky-100 bg-white p-6">
            <h2 className="text-2xl font-bold text-neutral-900">
              Inside Upmarket
            </h2>
            <p className="mt-3 max-w-4xl text-neutral-600">
              Upmarket Brick Lane is known for its energetic indoor setup,
              diverse food options, and strong weekend traffic, making it
              one of the most dynamic micro food ecosystems in East London.
            </p>
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section className="mx-auto max-w-7xl px-4 py-4">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-neutral-900">
            Upmarket Photo Gallery
          </h2>
          <p className="mt-2 max-w-3xl text-neutral-600">
            Real on-location photos showing food stalls, customer flow, and
            trader identity inside Upmarket.
          </p>
        </div>

        {GALLERY_IMAGES.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {GALLERY_IMAGES.map((src, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <img
                  src={src}
                  alt={`Upmarket Brick Lane photo ${i + 1}`}
                  className="h-48 w-full object-cover transition duration-300 hover:scale-105"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-sky-200 bg-white p-10 text-center">
            <div className="text-lg font-semibold text-neutral-600">
              Gallery coming soon
            </div>
          </div>
        )}
      </section>

      {/* ABOUT */}
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="rounded-3xl border border-sky-100 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-neutral-900">
            About Upmarket
          </h2>

          <p className="mt-4 text-lg leading-8 text-neutral-600">
            {hub?.editorialIntro ||
              "Located within the Brick Lane area, Upmarket offers a curated indoor environment for independent food traders, combining global cuisines, experimental dishes, and a highly visual food experience."}
          </p>

          <p className="mt-4 text-lg leading-8 text-neutral-600">
            London Food Hubs brings structure to environments like Upmarket by
            helping traders showcase menus, pricing, and identity clearly,
            while allowing customers to discover and compare options easily.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-sky-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 text-center">
          <h2 className="text-3xl font-bold text-neutral-900">
            Are you a trader at Upmarket?
          </h2>

          <p className="mt-3 text-neutral-600">
            Join London Food Hubs to showcase your food, menu, and brand to more
            customers.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              href="/restaurants"
              className="rounded-xl bg-sky-600 px-6 py-3 font-semibold text-white hover:bg-sky-700"
            >
              Explore Food
            </Link>

            <Link
              href="/signup/restaurant"
              className="rounded-xl bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
            >
              Join as Trader
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
