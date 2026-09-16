import { redirect } from "next/navigation";

/** Legacy URL compatibility — the real implementation now lives at
 *  app/[locale]/cuisines/page.tsx. See docs/MULTILINGUAL-ARCHITECTURE.md. */
export default function LegacyCuisinesIndexRedirect() {
  redirect("/en/cuisines");
}
