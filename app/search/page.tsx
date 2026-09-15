import type { Metadata } from "next";
import { Suspense } from "react";
import SearchClient from "@/components/discovery/SearchClient";

export const metadata: Metadata = {
  title: "Search | London Food Hubs",
  description: "Search restaurants, dishes, cuisines and food hubs across London.",
  alternates: { canonical: "/search" },
};

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchClient />
    </Suspense>
  );
}
