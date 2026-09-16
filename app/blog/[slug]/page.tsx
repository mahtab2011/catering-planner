import { redirect } from "next/navigation";

/** Legacy URL compatibility — the real implementation now lives at
 *  app/[locale]/blog/[slug]/page.tsx. See
 *  docs/MULTILINGUAL-ARCHITECTURE.md. */
export default async function LegacyBlogArticleRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/en/blog/${slug}`);
}
