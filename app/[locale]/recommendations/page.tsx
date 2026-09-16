import { getTranslations } from "next-intl/server";
import RecommendationsClient from "@/components/discovery/RecommendationsClient";
import { buildLocaleAlternates } from "@/lib/seo";

export async function generateMetadata() {
  const t = await getTranslations("Recommendations");
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: { canonical: "/recommendations", languages: buildLocaleAlternates("/recommendations") },
  };
}

export default function RecommendationsPage() {
  return <RecommendationsClient />;
}
