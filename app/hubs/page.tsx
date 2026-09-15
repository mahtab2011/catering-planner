import type { Metadata } from "next";
import Link from "next/link";
import { getAllHubs } from "@/lib/hubs";

export const metadata: Metadata = {
  title: "London Food Hubs Directory | Explore Every Area",
  description:
    "Browse London's food hubs by area — Brick Lane, Plashet Road, Edgware Road, Stratford and more.",
  alternates: { canonical: "/hubs" },
};

export default function HubsIndexPage() {
  const hubs = getAllHubs();

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
          <div className="inline-flex rounded-full bg-amber-100 px-4 py-1 text-sm font-semibold text-amber-900">
            Food Hubs
          </div>
          <h1 className="mt-4 text-3xl font-bold text-neutral-900 md:text-4xl">
            London's Food Hubs
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-neutral-600">
            A food hub is a London area with a strong concentration of restaurants and food
            businesses. Explore restaurants, cuisines and dishes area by area.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {hubs.map((hub) => (
            <Link
              key={hub.slug}
              href={`/hubs/${hub.slug}`}
              className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="relative h-40 w-full overflow-hidden bg-linear-to-br from-amber-100 via-orange-50 to-rose-100">
                {hub.heroImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={hub.heroImage}
                    alt={hub.name}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div className="p-5">
                <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  {hub.areaLabel}
                </div>
                <div className="mt-1 text-lg font-bold text-neutral-900">{hub.name}</div>
                {hub.description.en ? (
                  <p className="mt-2 line-clamp-2 text-sm text-neutral-600">{hub.description.en}</p>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
