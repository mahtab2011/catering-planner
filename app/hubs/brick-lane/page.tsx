import { redirect } from "next/navigation";

/** Legacy static hub page — superseded by app/[locale]/hubs/[slug]/page.tsx,
 *  which already serves this same hub via lib/hubs.ts. See
 *  docs/MULTILINGUAL-ARCHITECTURE.md. */
export default function LegacyBrickLaneRedirect() {
  redirect("/en/hubs/brick-lane");
}
