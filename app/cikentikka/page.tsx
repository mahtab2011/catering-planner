import Link from "next/link";

export default function CikenTikkaPage() {
  return (
    <main className="min-h-screen bg-orange-50 text-slate-950">
      <section className="mx-auto max-w-7xl px-6 py-8">
        <nav className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-orange-200 bg-white px-6 py-4 shadow-sm">
          <Link href="/cikentikka" className="text-3xl font-black text-orange-600">
            CikenTikka
          </Link>

          <div className="flex flex-wrap gap-3 text-sm font-bold">
            <Link href="/" className="rounded-full border px-4 py-2 hover:bg-orange-50">
              SmartServeUK
            </Link>
            <Link href="/food-hubs" className="rounded-full border px-4 py-2 hover:bg-orange-50">
              Food Hubs
            </Link>
            <Link href="/signup/restaurant" className="rounded-full border px-4 py-2 hover:bg-orange-50">
              Restaurants
            </Link>
            <Link href="/signup/rider" className="rounded-full border px-4 py-2 hover:bg-orange-50">
              Riders
            </Link>
            <Link href="/restaurant-onboarding-guide" className="rounded-full border px-4 py-2 hover:bg-orange-50">
              Guides
            </Link>
          </div>
        </nav>

        <div className="rounded-3xl border border-orange-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-orange-600">
            Powered by SmartServeUK
          </p>

          <h1 className="mt-4 text-5xl font-black md:text-7xl">
            CikenTikka
          </h1>

          <p className="mt-5 max-w-4xl text-xl leading-8 text-slate-700">
            A simple gateway to SmartServeUK for customers, restaurants,
suppliers, riders, catering businesses and community food hubs.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
  href="/"
  className="rounded-2xl bg-orange-600 px-6 py-3 font-bold text-white transition hover:bg-orange-700"
>
  Enter SmartServeUK
</Link>
<Link
  href="/orders"
  className="rounded-2xl bg-red-600 px-6 py-3 font-bold text-white transition hover:bg-red-700"
>
  Order Food
</Link>

<Link
  href="/signup/supplier"
  className="rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700"
>
  Supplier Signup
</Link>

<Link
  href="/login"
  className="rounded-2xl bg-slate-900 px-6 py-3 font-bold text-white transition hover:bg-slate-800"
>
  Staff Login
</Link>

            <Link
              href="/signup/restaurant"
              className="rounded-2xl bg-green-600 px-6 py-3 font-bold text-white transition hover:bg-green-700"
            >
              Restaurant Signup
            </Link>

            <Link
              href="/signup/rider"
              className="rounded-2xl bg-emerald-600 px-6 py-3 font-bold text-white transition hover:bg-emerald-700"
            >
              Rider Signup
            </Link>

            <Link
              href="/restaurant-onboarding-guide"
              className="rounded-2xl border border-orange-300 px-6 py-3 font-bold text-orange-700 transition hover:bg-orange-100"
            >
              Onboarding Guides
            </Link>
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <section className="rounded-3xl border border-orange-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-orange-600">
              London Food Hubs
            </h2>

            <p className="mt-4 leading-7 text-slate-700">
              Start with Plashet Road, Brick Lane, Green Street, Stratford and
              other vibrant London food areas.
            </p>
          </section>

          <section className="rounded-3xl border border-green-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-green-600">
              Restaurants & Street Food
            </h2>

            <p className="mt-4 leading-7 text-slate-700">
              Help customers discover local restaurants, cafés, dessert shops,
              food stalls and street food sellers.
            </p>
          </section>

          <section className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-emerald-600">
              Riders & Local Support
            </h2>

            <p className="mt-4 leading-7 text-slate-700">
              Build a local food support network for restaurants, customers,
              riders and community food businesses.
            </p>
          </section>
        </div>

        <section className="mt-10">
          <h2 className="text-3xl font-black">Featured Food Hubs</h2>

          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <Link
              href="/plashet-road-food-hub"
              className="rounded-3xl border border-orange-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <p className="text-sm font-bold uppercase text-orange-600">
                Active Hub
              </p>
              <h3 className="mt-3 text-2xl font-black">
                Plashet Road Food Hub
              </h3>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                Bangladeshi food, tea, pitha, biryani, fuchka, cafés and
                family-run restaurants.
              </p>
            </Link>

            {["Brick Lane", "Green Street", "Stratford"].map((hub) => (
              <section
                key={hub}
                className="rounded-3xl border border-slate-200 bg-white p-6 opacity-80 shadow-sm"
              >
                <p className="text-sm font-bold uppercase text-slate-500">
                  Coming Soon
                </p>
                <h3 className="mt-3 text-2xl font-black">
                  {hub} Food Hub
                </h3>
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  Local restaurant discovery and food hub visibility will be
                  added gradually.
                </p>
              </section>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-3xl font-black">
            CikenTikka by SmartServeUK
          </h2>

          <p className="mt-4 max-w-4xl leading-8 text-slate-700">
            CikenTikka is the public-facing food discovery brand powered by
            SmartServeUK. SmartServeUK provides the operational platform,
            onboarding structure, restaurant systems and future delivery support.
          </p>
        </section>
      </section>
    </main>
  );
}