import { redirect } from "next/navigation";

/** Legacy URL compatibility — the real implementation now lives at
 *  app/[locale]/restaurants/[id]/page.tsx. See
 *  docs/MULTILINGUAL-ARCHITECTURE.md. The page-local 7-language
 *  selector (its own localStorage "lang" state, independent of the
 *  rest of the site) that used to live here has been retired in
 *  favor of the site-wide next-intl locale — see that doc's
 *  "Retired mechanisms" section. */
export default async function LegacyRestaurantDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/en/restaurants/${id}`);
}
