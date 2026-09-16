import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getAllCuisines, getCuisineDisplayName, getFeaturedCuisines } from "@/lib/cuisines";

export default function CuisinePreviewSection() {
  const t = useTranslations("Home");
  const locale = useLocale();
  const featured = getFeaturedCuisines().filter((c) => c.kind === "cuisine");
  const all = getAllCuisines().filter((c) => c.kind === "cuisine");
  const cuisines = (featured.length >= 6 ? featured : all).slice(0, 12);

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-neutral-900">{t("exploreByCuisine")}</h2>
        <Link href="/cuisines" className="text-sm font-semibold text-amber-700 hover:underline">
          {t("allCuisines")} →
        </Link>
      </div>
      <p className="mt-2 max-w-2xl text-sm text-neutral-600">
        {t("exploreByCuisineSubtitle")}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {cuisines.map((cuisine) => (
          <Link
            key={cuisine.slug}
            href={`/cuisine/${cuisine.slug}`}
            className="rounded-2xl border border-neutral-200 bg-white p-4 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="text-sm font-semibold text-neutral-900">{getCuisineDisplayName(cuisine, locale)}</div>
            <div className="mt-1 text-xs text-neutral-500">{cuisine.region}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
