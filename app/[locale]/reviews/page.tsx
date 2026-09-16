import { getTranslations } from "next-intl/server";
import LatestReviewsSection from "@/components/discovery/LatestReviewsSection";
import { buildLocaleAlternates } from "@/lib/seo";
import SiteHeader from "@/components/discovery/SiteHeader";
import SiteFooter from "@/components/discovery/SiteFooter";

export async function generateMetadata() {
  const t = await getTranslations("Reviews");
  return {
    title: `${t("title")} | London Food Hubs`,
    description: t("subtitle"),
    alternates: { canonical: "/reviews", languages: buildLocaleAlternates("/reviews") },
  };
}

export default async function ReviewsIndexPage() {
  const t = await getTranslations("Reviews");

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

        <div className="mt-8">
          <LatestReviewsSection limit={30} heading={t("recentReviews")} />
        </div>
      </div>
      </main>
      <SiteFooter />
    </>
  );
}
