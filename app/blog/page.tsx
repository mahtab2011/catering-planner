import type { Metadata } from "next";
import BlogIndexClient from "@/components/blog/BlogIndexClient";

export const metadata: Metadata = {
  title: "The London Food Hubs Blog",
  description:
    "Cuisine guides, restaurant stories and what to eat across London — from the London Food Hubs editorial team.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndexPage() {
  return <BlogIndexClient />;
}
