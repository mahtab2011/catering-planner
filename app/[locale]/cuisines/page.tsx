import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCuisineDisplayName, getCuisinesByRegion } from "@/lib/cuisines";
import SiteHeader from "@/components/discovery/SiteHeader";
import SiteFooter from "@/components/discovery/SiteFooter";

export async function generateMetadata() {
  const t = await getTranslations("Cuisines");
  return {
    title: `${t("title")} | London Food Hubs`,
    description: t("subtitle"),
    alternates: { canonical: "/cuisines" },
  };
}

export default async function CuisinesIndexPage() {
  const t = await getTranslations("Cuisines");
  const locale = await getLocale();
  const byRegion = getCuisinesByRegion();

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
                    <div className="text-base font-semibold text-neutral-900">
                      {getCuisineDisplayName(cuisine, locale)}
                    </div>
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
