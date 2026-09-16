import { redirect } from "next/navigation";

/** Legacy URL compatibility — the real implementation now lives at
 *  app/[locale]/search/page.tsx. See docs/MULTILINGUAL-ARCHITECTURE.md.
 *  Forwards the q/postcode query params so old bookmarked/shared
 *  search links (e.g. from HomeHero before locale routing existed)
 *  keep working exactly as before, not just landing on a blank
 *  search page. */
export default async function LegacySearchRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") query.set(key, value);
  }
  const suffix = query.toString();
  redirect(`/en/search${suffix ? `?${suffix}` : ""}`);
}
