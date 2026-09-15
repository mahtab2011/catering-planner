import type { Metadata } from "next";
import LatestReviewsSection from "@/components/discovery/LatestReviewsSection";
import SiteHeader from "@/components/discovery/SiteHeader";
import SiteFooter from "@/components/discovery/SiteFooter";

export const metadata: Metadata = {
  title: "Restaurant Reviews | London Food Hubs",
  description: "Real customer reviews of restaurants across London, moderated before publishing.",
  alternates: { canonical: "/reviews" },
};

export default function ReviewsIndexPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
          <div className="inline-flex rounded-full bg-amber-100 px-4 py-1 text-sm font-semibold text-amber-900">
            Reviews
          </div>
          <h1 className="mt-4 text-3xl font-bold text-neutral-900 md:text-4xl">
            What Customers Are Saying
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-neutral-600">
            Real reviews from London Food Hubs customers, checked by our team before they go
            live.
          </p>
        </div>

        <div className="mt-8">
          <LatestReviewsSection limit={30} heading="Recent Reviews" />
        </div>
      </div>
      </main>
      <SiteFooter />
    </>
  );
}
