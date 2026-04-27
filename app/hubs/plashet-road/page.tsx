"use client";

import Link from "next/link";

const FEATURED_IMAGE = "/hubs/plashet-road/IMG-20260420-WA0037.jpg";

const GALLERY_IMAGES = [
  "/hubs/plashet-road/IMG-20260420-WA0038.jpg",
  "/hubs/plashet-road/IMG-20260420-WA0039.jpg",
  "/hubs/plashet-road/IMG-20260420-WA0040.jpg",
  "/hubs/plashet-road/IMG-20260420-WA0041.jpg",
  "/hubs/plashet-road/IMG-20260420-WA0042.jpg",
  "/hubs/plashet-road/IMG-20260420-WA0043.jpg",
  "/hubs/plashet-road/IMG-20260420-WA0044.jpg",
  "/hubs/plashet-road/IMG-20260420-WA0045.jpg",
  "/hubs/plashet-road/IMG-20260420-WA0046.jpg",
  "/hubs/plashet-road/IMG-20260420-WA0047.jpg",
];

export default function PlashetRoadPage() {
  return (
    <main className="min-h-screen bg-sky-50/40">
      {/* HERO */}
      <section className="border-b border-sky-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="inline-flex rounded-full bg-sky-100 px-4 py-1 text-sm font-semibold text-sky-900">
            East London Food Hub
          </div>

          <h1 className="mt-4 text-4xl font-bold text-neutral-900 md:text-5xl">
            Plashet Road Food Hub
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-neutral-600">
            A newly developing bustling food hub for food lovers, tourists, and
            families — offering authentic South Asian flavours in a cozy and
            homely environment.
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
              Biryani & Grill
            </span>
            <span className="rounded-full bg-pink-100 px-3 py-1 text-sm font-medium text-pink-800">
              Sweets & Snacks
            </span>
          </div>
        </div>
      </section>

      {/* FEATURED IMAGE */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-sm">
          <img
            src={FEATURED_IMAGE}
            alt="Plashet Road featured view"
            className="h-65 w-full object-cover md:h-105"
          />
          <div className="border-t border-sky-100 bg-white p-6">
            <h2 className="text-2xl font-bold text-neutral-900">
              A Real View of Plashet Road
            </h2>
            <p className="mt-3 max-w-4xl text-neutral-600">
              This hub reflects real East London energy — busy restaurant fronts,
              visible customer footfall, community dining, and a practical,
              authentic food environment that suits everyday meals, family visits,
              and discovery by local food lovers and visitors.
            </p>
          </div>
        </div>
      </section>

      {/* IMAGE GALLERY */}
      <section className="mx-auto max-w-7xl px-4 py-4">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-neutral-900">
            Plashet Road Photo Gallery
          </h2>
          <p className="mt-2 max-w-3xl text-neutral-600">
            Real on-location photos from Plashet Road showing restaurant fronts,
            local dining atmosphere, footfall, and the growing community feel of
            this East London food hub.
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
                  alt={`Plashet Road gallery photo ${i + 1}`}
                  className="max-h-full max-w-full object-contain transition duration-300 hover:scale-105"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Video content is also available for this hub and can be added later as
          a featured preview section.
        </div>
      </section>

      {/* ABOUT HUB */}
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="rounded-3xl border border-sky-100 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-neutral-900">
            About Plashet Road
          </h2>

          <p className="mt-4 text-lg leading-8 text-neutral-600">
            Plashet Road is one of East London’s growing neighbourhood food
            areas, home to a dense cluster of Bangladeshi, Pakistani, and Indian
            restaurants. From traditional biryani houses to grills, curries,
            snacks, and sweets, this hub reflects authentic community-driven
            dining.
          </p>

          <p className="mt-4 text-lg leading-8 text-neutral-600">
            Many restaurants here are well-loved locally but have limited online
            presence. SmartServeUK brings them together in one place — helping
            customers discover real food, and helping restaurant owners showcase
            their menus, photos, and offers professionally.
          </p>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="text-xl font-bold text-neutral-900">
              🍽 Authentic Food
            </div>
            <p className="mt-3 text-sm leading-7 text-neutral-600">
              Traditional South Asian meals including biryani, curries, grills,
              sweets, snacks, and everyday favourites.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="text-xl font-bold text-neutral-900">
              🏪 Local Favourites
            </div>
            <p className="mt-3 text-sm leading-7 text-neutral-600">
              Trusted neighbourhood restaurants with strong community
              connections, repeat visitors, and real local energy.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="text-xl font-bold text-neutral-900">
              🚀 Growing Hub
            </div>
            <p className="mt-3 text-sm leading-7 text-neutral-600">
              A newly developing bustling area with increasing interest from food
              lovers, tourists, and families looking for authentic dining in a
              cozy and homely environment.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-sky-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 text-center">
          <h2 className="text-3xl font-bold text-neutral-900">
            Own a restaurant on Plashet Road?
          </h2>

          <p className="mt-3 text-neutral-600">
            Join SmartServeUK and showcase your menu, photos, videos, and offers
            to reach more customers.
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