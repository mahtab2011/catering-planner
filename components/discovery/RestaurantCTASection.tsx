import Link from "next/link";

export default function RestaurantCTASection() {
  return (
    <section className="rounded-3xl bg-neutral-900 p-8 text-white sm:p-10">
      <div className="max-w-2xl">
        <div className="inline-flex rounded-full bg-white/10 px-4 py-1 text-sm font-semibold">
          For Businesses
        </div>
        <h2 className="mt-4 text-2xl font-bold sm:text-3xl">
          Own or manage a food business?
        </h2>
        <p className="mt-3 text-neutral-300">
          List your restaurant, takeaway, home kitchen, bakery or catering business on London
          Food Hubs for free. Add your menu, photos and opening hours — customers can discover
          you by cuisine, area and dish.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/signup/restaurant"
            className="rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-neutral-900 hover:bg-amber-400"
          >
            List Your Business Free
          </Link>
          <Link
            href="/restaurant-onboarding-guide"
            className="rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20"
          >
            How It Works
          </Link>
        </div>
      </div>
    </section>
  );
}
