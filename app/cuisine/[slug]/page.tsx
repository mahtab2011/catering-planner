import { redirect } from "next/navigation";

/** Legacy URL compatibility — the real implementation now lives at
 *  app/[locale]/cuisine/[slug]/page.tsx. See
 *  docs/MULTILINGUAL-ARCHITECTURE.md. */
export default async function LegacyCuisineDetailRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/en/cuisine/${slug}`);
}
