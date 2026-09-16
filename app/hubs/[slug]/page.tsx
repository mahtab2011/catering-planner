import { redirect } from "next/navigation";

/**
 * Legacy URL compatibility redirect. The real implementation now lives
 * at app/[locale]/hubs/[slug]/page.tsx — see
 * docs/MULTILINGUAL-ARCHITECTURE.md. Redirecting to the English
 * ("/en") edition preserves every pre-existing /hubs/{slug} link and
 * bookmark rather than 404ing them once locale routing is active.
 */
export default async function LegacyHubDetailRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/en/hubs/${slug}`);
}
