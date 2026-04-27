"use client";

import Link from "next/link";

const FEATURED_IMAGE = "/hubs/high-street-north/IMG-20260420-WA0049.jpg";

const GALLERY_IMAGES = [
  "/hubs/high-street-north/IMG-20260420-WA0050.jpg",
  "/hubs/high-street-north/IMG-20260420-WA0051.jpg",
  "/hubs/high-street-north/IMG-20260420-WA0052.jpg",
  "/hubs/high-street-north/IMG-20260420-WA0053.jpg",
  "/hubs/high-street-north/IMG-20260420-WA0054.jpg",
  "/hubs/high-street-north/IMG-20260420-WA0055.jpg",
  "/hubs/high-street-north/IMG-20260420-WA0056.jpg",
  "/hubs/high-street-north/IMG-20260420-WA0057.jpg",
];

export default function HighStreetNorthPage() {
  return (
    <main className="min-h-screen bg-sky-50/40">
      {/* HERO */}
      <section className="border-b border-sky-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="inline-flex rounded-full bg-sky-100 px-4 py-1 text-sm font-semibold text-sky-900">
            East Ham Town Centre
          </div>

          <h1 className="mt-4 text-4xl font-bold text-neutral-900 md:text-5xl">
            High Street North Food Hub
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-neutral-600">
            A lively and developing East London food hub with strong South Asian
            restaurant presence, takeaway demand, family-friendly local energy,
            and growing appeal for shoppers, food lovers, and visitors.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
              Bangladeshi
            </span>
            <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
              Pakistani
            </span>
            <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
              Indian
            </span>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
              Grill & Curry
            </span>
            <span className="rounded-full bg-pink-100 px-3 py-1 text-sm font-medium text-pink-800">
              Sweets & Snacks
            </span>
            <span className="rounded-full bg-sky-100 px-3 py-1 text-sm font-medium text-sky-800">
              Family Dining
            </span>
          </div>
        </div>
      </section>

      {/* FEATURED IMAGE */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-sm">
          <div className="flex h-65 w-full items-center justify-center bg-white md:h-105">
            <img
              src={FEATURED_IMAGE}
              alt="High Street North featured archway"
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <div className="border-t border-sky-100 bg-white p-6">
            <h2 className="text-2xl font-bold text-neutral-900">
              A Real View of High Street North
            </h2>
            <p className="mt-3 max-w-4xl text-neutral-600">
              The East Ham archway gives this hub a strong local identity and
              marks High Street North as a practical, busy, and recognisable food
              area with strong everyday restaurant activity and community
              movement.
            </p>
          </div>
        </div>
      </section>

      {/* IMAGE GALLERY */}
      <section className="mx-auto max-w-7xl px-4 py-4">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-neutral-900">
            High Street North Photo Gallery
          </h2>
          <p className="mt-2 max-w-3xl text-neutral-600">
            Real on-location photos from High Street North and East Ham Town
            Centre showing restaurant fronts, local atmosphere, takeaway
            presence, community energy, and the practical dining environment of
            this growing East London food hub.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {GALLERY_IMAGES.map((src, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex h-48 w-full items-center justify-center bg-white">
                <img
                  src={src}
                  alt={`High Street North gallery photo ${i + 1}`}
                  className="max-h-full max-w-full object-contain transition duration-300 hover:scale-105"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Additional photos and short video content can be added later to expand
          this hub into a richer preview section.
        </div>
      </section>

      {/* ABOUT HUB */}
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="rounded-3xl border border-sky-100 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-neutral-900">
            About High Street North
          </h2>

          <p className="mt-4 text-lg leading-8 text-neutral-600">
            High Street North in East Ham Town Centre is a practical and
            high-potential food hub with strong community presence and visible
            restaurant activity. The area reflects the kind of local dining
            environment where independent restaurants, takeaway businesses,
            grills, curry houses, sweet shops, and family-focused operators can
            benefit from stronger online discovery and organised digital
            presentation.
          </p>

          <p className="mt-4 text-lg leading-8 text-neutral-600">
            SmartServeUK can help restaurants here present menus, photos, videos,
            offers, and local identity in one place, making it easier for
            customers to discover trusted food options while helping restaurant
            owners improve visibility without needing a full standalone website.
          </p>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="text-xl font-bold text-neutral-900">
              🍽 Everyday Food Demand
            </div>
            <p className="mt-3 text-sm leading-7 text-neutral-600">
              A strong local food environment with practical daily demand for
              curries, grills, snacks, sweets, takeaway meals, and family dining.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="text-xl font-bold text-neutral-900">
              🏪 Independent Restaurant Presence
            </div>
            <p className="mt-3 text-sm leading-7 text-neutral-600">
              A visible cluster of independent operators with strong community
              connections and real opportunity for better digital discovery.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="text-xl font-bold text-neutral-900">
              🚀 Growing Local Hub
            </div>
            <p className="mt-3 text-sm leading-7 text-neutral-600">
              A lively East Ham Town Centre zone with growing appeal for shoppers,
              local families, and visitors looking for authentic food choices.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-sky-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 text-center">
          <h2 className="text-3xl font-bold text-neutral-900">
            Own a restaurant on High Street North?
          </h2>

          <p className="mt-3 text-neutral-600">
            Join SmartServeUK and showcase your menu, photos, videos, and offers
            to reach more customers in East Ham Town Centre and beyond.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              href="/restaurants"
              className="rounded-xl bg-sky-600 px-6 py-3 font-semibold text-white transition hover:bg-sky-700"
            >
              Explore Restaurants
            </Link>

            <Link
              href="/signup/restaurant"
              className="rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
            >
              Join as Restaurant
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}