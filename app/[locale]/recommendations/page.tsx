import { getTranslations } from "next-intl/server";
import RecommendationsClient from "@/components/discovery/RecommendationsClient";

export async function generateMetadata() {
  const t = await getTranslations("Recommendations");
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: { canonical: "/recommendations" },
  };
}

export default function RecommendationsPage() {
  return <RecommendationsClient />;
}
