import { redirect } from "next/navigation";

/** Legacy URL compatibility — the real implementation now lives at
 *  app/[locale]/restaurants/page.tsx. See
 *  docs/MULTILINGUAL-ARCHITECTURE.md. Forwards q/hub/cuisine filter
 *  params so old bookmarked/shared filtered links keep working. */
export default async function LegacyRestaurantsIndexRedirect({
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
  redirect(`/en/restaurants${suffix ? `?${suffix}` : ""}`);
}
