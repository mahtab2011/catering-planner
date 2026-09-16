import { redirect } from "next/navigation";

/** Legacy URL compatibility — the real implementation now lives at
 *  app/[locale]/reviews/page.tsx. See docs/MULTILINGUAL-ARCHITECTURE.md. */
export default function LegacyReviewsIndexRedirect() {
  redirect("/en/reviews");
}
