import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getAllHubs } from "@/lib/hubs";
import SiteHeader from "@/components/discovery/SiteHeader";
import SiteFooter from "@/components/discovery/SiteFooter";

export async function generateMetadata() {
  const t = await getTranslations("Hubs");
  return {
    title: `${t("title")} | London Food Hubs`,
    description: t("subtitle"),
    alternates: { canonical: "/hubs" },
  };
}

export default async function HubsIndexPage() {
  const t = await getTranslations("Hubs");
  const hubs = getAllHubs();

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
          <div className="inline-flex rounded-full bg-amber-100 px-4 py-1 text-sm font-semibold text-amber-900">
            {t("title")}
          </div>
          <h1 className="mt-4 text-3xl font-bold text-neutral-900 md:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-neutral-600">
            {t("subtitle")}
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
      <SiteFooter />
    </>
  );
}
