import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import SearchClient from "@/components/discovery/SearchClient";

export async function generateMetadata() {
  const t = await getTranslations("Search");
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: { canonical: "/search" },
  };
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchClient />
    </Suspense>
  );
}
