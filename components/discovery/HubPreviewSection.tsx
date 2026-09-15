import Link from "next/link";
import { getAllHubs, getFeaturedHubs } from "@/lib/hubs";

export default function HubPreviewSection() {
  const featured = getFeaturedHubs();
  const all = getAllHubs();
  const hubs = (featured.length >= 4 ? featured : all).slice(0, 6);

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-neutral-900">Explore London's Food Hubs</h2>
        <Link href="/hubs" className="text-sm font-semibold text-amber-700 hover:underline">
          All Food Hubs →
        </Link>
      </div>
      <p className="mt-2 max-w-2xl text-sm text-neutral-600">
        A food hub is a London area with a strong concentration of restaurants and food
        businesses — from Brick Lane to Edgware Road to Plashet Road.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {hubs.map((hub) => (
          <Link
            key={hub.slug}
            href={`/hubs/${hub.slug}`}
            className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="relative h-40 w-full overflow-hidden bg-linear-to-br from-amber-100 via-orange-50 to-rose-100">
              {hub.heroImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={hub.heroImage} alt={hub.name} className="h-full w-full object-cover" />
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
    </section>
  );
}
