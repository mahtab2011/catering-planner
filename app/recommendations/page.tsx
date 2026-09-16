import { redirect } from "next/navigation";

/** Legacy URL compatibility — the real implementation now lives at
 *  app/[locale]/recommendations/page.tsx. See
 *  docs/MULTILINGUAL-ARCHITECTURE.md. */
export default function LegacyRecommendationsRedirect() {
  redirect("/en/recommendations");
}
