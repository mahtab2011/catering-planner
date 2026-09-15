import type { Metadata } from "next";
import Link from "next/link";
import { getAllCuisines } from "@/lib/cuisines";
import SiteHeader from "@/components/discovery/SiteHeader";
import SiteFooter from "@/components/discovery/SiteFooter";

export const metadata: Metadata = {
  title: "Cuisines Across London | London Food Hubs",
  description:
    "Explore London's food by cuisine — Bangladeshi, Indian, Pakistani, Lebanese, Turkish, Thai, Japanese and more, all in one place.",
  alternates: { canonical: "/cuisines" },
};

const REGION_ORDER = [
  "South Asian",
  "Middle Eastern",
  "East Asian",
  "Southeast Asian",
  "African",
  "Caribbean",
  "European",
  "Americas",
] as const;

export default function CuisinesIndexPage() {
  const cuisines = getAllCuisines().filter((c) => c.kind === "cuisine");

  const byRegion = REGION_ORDER.map((region) => ({
    region,
    cuisines: cuisines.filter((c) => c.region === region),
  })).filter((group) => group.cuisines.length > 0);

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
          <div className="inline-flex rounded-full bg-amber-100 px-4 py-1 text-sm font-semibold text-amber-900">
            Cuisines
          </div>
          <h1 className="mt-4 text-3xl font-bold text-neutral-900 md:text-4xl">
            Explore Food From Every Community in London
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-neutral-600">
            London Food Hubs celebrates cuisines and communities from across the city — this
            list grows as more cuisines are added, it is never limited to one region.
          </p>
        </div>

        <div className="mt-8 space-y-10">
          {byRegion.map((group) => (
            <section key={group.region}>
              <h2 className="mb-4 text-xl font-bold text-neutral-900">{group.region}</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {group.cuisines.map((cuisine) => (
                  <Link
                    key={cuisine.slug}
                    href={`/cuisine/${cuisine.slug}`}
                    className="rounded-2xl border border-neutral-200 bg-white p-5 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="text-base font-semibold text-neutral-900">{cuisine.name}</div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
      </main>
      <SiteFooter />
    </>
  );
}
