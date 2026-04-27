"use client";

import Link from "next/link";

const FEATURED_IMAGE = "/hubs/brick-lane/5.jpg";

const GALLERY_IMAGES = [
  "/hubs/brick-lane/1.jpg",
  "/hubs/brick-lane/2.jpg",
  "/hubs/brick-lane/3.jpg",
  "/hubs/brick-lane/4.jpg",
  "/hubs/brick-lane/6.jpg",
  "/hubs/brick-lane/7.jpg",
  "/hubs/brick-lane/8.jpg",
];

export default function BrickLanePage() {
  return (
    <main className="min-h-screen bg-sky-50/40">
      {/* HERO */}
      <section className="border-b border-sky-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="inline-flex rounded-full bg-sky-100 px-4 py-1 text-sm font-semibold text-sky-900">
            East London Food Hub
          </div>

          <h1 className="mt-4 text-4xl font-bold text-neutral-900 md:text-5xl">
            Brick Lane Food Hub
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-neutral-600">
            One of London’s most iconic and vibrant food destinations, with a
            powerful South Asian food identity, strong street presence, tourists,
            local families, and daily discovery across restaurants, grills,
            curries, snacks, and food halls.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
              Bangladeshi
            </span>
            <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
              Indian
            </span>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
              Curry & Grill
            </span>
            <span className="rounded-full bg-pink-100 px-3 py-1 text-sm font-medium text-pink-800">
              Sweets & Snacks
            </span>
            <span className="rounded-full bg-sky-100 px-3 py-1 text-sm font-medium text-sky-800">
              Tourists & Families
            </span>
            <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-800">
              Street Food Culture
            </span>
          </div>
        </div>
      </section>

      {/* FEATURED IMAGE */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-sm">
          <img
            src={FEATURED_IMAGE}
            alt="Brick Lane featured view"
            className="h-56 w-full object-cover md:h-80"
          />

          <div className="border-t border-sky-100 bg-white p-6">
            <h2 className="text-2xl font-bold text-neutral-900">
              A Real View of Brick Lane
            </h2>
            <p className="mt-3 max-w-4xl text-neutral-600">
              Brick Lane is one of East London’s most recognised food areas,
              combining strong restaurant identity, daily footfall, cultural
              visibility, and destination value for both local customers and
              visitors.
            </p>
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section className="mx-auto max-w-7xl px-4 py-4">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-neutral-900">
            Brick Lane Photo Gallery
          </h2>
          <p className="mt-2 max-w-3xl text-neutral-600">
            Real on-location photos from Brick Lane showing restaurant fronts,
            food atmosphere, street presence, and the wider visual identity of
            this important East London food hub.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {GALLERY_IMAGES.map((src, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <img
                src={src}
                alt={`Brick Lane photo ${i + 1}`}
                className="h-48 w-full object-cover transition duration-300 hover:scale-105"
              />
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="rounded-3xl border border-sky-100 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-neutral-900">
            About Brick Lane
          </h2>

          <p className="mt-4 text-lg leading-8 text-neutral-600">
            Brick Lane is one of London’s most established food hubs, famous for
            its Bangladeshi and South Asian restaurant presence, strong visual
            identity, and long-standing appeal for locals and destination
            visitors.
          </p>

          <p className="mt-4 text-lg leading-8 text-neutral-600">
            SmartServeUK helps bring restaurants in areas like Brick Lane into a
            clearer digital structure, making it easier for customers to discover
            authentic food and for restaurant owners to present menus, photos,
            offers, and identity more professionally.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-sky-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 text-center">
          <h2 className="text-3xl font-bold text-neutral-900">
            Own a restaurant on Brick Lane?
          </h2>

          <p className="mt-3 text-neutral-600">
            Join SmartServeUK and showcase your menu, photos, and offers to reach
            more customers.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              href="/restaurants"
              className="rounded-xl bg-sky-600 px-6 py-3 font-semibold text-white hover:bg-sky-700"
            >
              Explore Restaurants
            </Link>

            <Link
              href="/signup/restaurant"
              className="rounded-xl bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
            >
              Join as Restaurant
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}