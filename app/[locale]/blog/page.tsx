import { getTranslations } from "next-intl/server";
import BlogIndexClient from "@/components/blog/BlogIndexClient";
import { buildLocaleAlternates } from "@/lib/seo";

export async function generateMetadata() {
  const t = await getTranslations("Blog");
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: { canonical: "/blog", languages: buildLocaleAlternates("/blog") },
  };
}

export default function BlogIndexPage() {
  return <BlogIndexClient />;
}
