import type { Metadata } from "next";
import RecommendationsClient from "@/components/discovery/RecommendationsClient";

export const metadata: Metadata = {
  title: "London Food Hubs Recommends",
  description:
    "Editorial picks from London Food Hubs — dishes of the week, hidden gems, family favourites and more, hand-selected, not customer ratings.",
  alternates: { canonical: "/recommendations" },
};

export default function RecommendationsPage() {
  return <RecommendationsClient />;
}
