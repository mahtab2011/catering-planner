import { getTranslations } from "next-intl/server";
import BlogIndexClient from "@/components/blog/BlogIndexClient";

export async function generateMetadata() {
  const t = await getTranslations("Blog");
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: { canonical: "/blog" },
  };
}

export default function BlogIndexPage() {
  return <BlogIndexClient />;
}
