import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import SearchClient from "@/components/discovery/SearchClient";
import { buildLocaleAlternates } from "@/lib/seo";

export async function generateMetadata() {
  const t = await getTranslations("Search");
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: { canonical: "/search", languages: buildLocaleAlternates("/search") },
  };
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchClient />
    </Suspense>
  );
}
