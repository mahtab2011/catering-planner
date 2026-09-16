import { redirect } from "next/navigation";

/** Legacy URL compatibility — the real implementation now lives at
 *  app/[locale]/hubs/page.tsx. See docs/MULTILINGUAL-ARCHITECTURE.md. */
export default function LegacyHubsIndexRedirect() {
  redirect("/en/hubs");
}
