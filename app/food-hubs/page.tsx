import Link from "next/link";

export default function FoodHubsPage() {
  return (
    <main className="min-h-screen bg-orange-50 text-slate-950">
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-3xl border border-orange-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-orange-600">
            CikenTikka Food Hubs
          </p>

          <h1 className="mt-4 text-5xl font-black">
            London Food Hub Directory
          </h1>

          <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-700">
            Discover London's growing network of food hubs, restaurants,
            street-food traders, cafés and catering businesses.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/cikentikka"
              className="rounded-2xl bg-orange-600 px-6 py-3 font-bold text-white hover:bg-orange-700"
            >
              Back To CikenTikka
            </Link>

            <Link
              href="/signup/restaurant"
              className="rounded-2xl bg-green-600 px-6 py-3 font-bold text-white hover:bg-green-700"
            >
              Restaurant Signup
            </Link>
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">

          <Link
            href="/plashet-road-food-hub"
            className="rounded-3xl border border-orange-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
          >
            <p className="font-bold text-orange-600">
              ACTIVE FOOD HUB
            </p>

            <h2 className="mt-3 text-3xl font-black">
              Plashet Road Food Hub
            </h2>

            <p className="mt-4 leading-7 text-slate-700">
              Bangladeshi restaurants, tea stalls, pitha, biryani,
              sweets, cafés and local food businesses.
            </p>

            <div className="mt-6">
              <span className="font-bold text-orange-600">
                Explore Hub →
              </span>
            </div>
          </Link>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="font-bold text-slate-500">
              COMING SOON
            </p>

            <h2 className="mt-3 text-3xl font-black">
              Brick Lane Food Hub
            </h2>

            <p className="mt-4 leading-7 text-slate-700">
              Famous curry houses, cafés and food markets.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="font-bold text-slate-500">
              COMING SOON
            </p>

            <h2 className="mt-3 text-3xl font-black">
              Green Street Food Hub
            </h2>

            <p className="mt-4 leading-7 text-slate-700">
              South Asian food, restaurants and dessert specialists.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="font-bold text-slate-500">
              COMING SOON
            </p>

            <h2 className="mt-3 text-3xl font-black">
              Stratford Food Hub
            </h2>

            <p className="mt-4 leading-7 text-slate-700">
              Modern restaurants, food courts and delivery kitchens.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="font-bold text-slate-500">
              COMING SOON
            </p>

            <h2 className="mt-3 text-3xl font-black">
              Whitechapel Food Hub
            </h2>

            <p className="mt-4 leading-7 text-slate-700">
              Community food businesses and multicultural cuisine.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="font-bold text-slate-500">
              COMING SOON
            </p>

            <h2 className="mt-3 text-3xl font-black">
              Edgware Road Food Hub
            </h2>

            <p className="mt-4 leading-7 text-slate-700">
              Arabic, Middle Eastern and international food businesses.
            </p>
          </div>
        </div>

        <section className="mt-12 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-3xl font-black">
            Who Can Join?
          </h2>

          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <h3 className="font-black text-orange-600">
                Restaurants
              </h3>
              <p className="mt-2 text-slate-700">
                Showcase menus, photos and business information.
              </p>
            </div>

            <div>
              <h3 className="font-black text-green-600">
                Customers
              </h3>
              <p className="mt-2 text-slate-700">
                Discover local food businesses and special offers.
              </p>
            </div>

            <div>
              <h3 className="font-black text-emerald-600">
                Riders
              </h3>
              <p className="mt-2 text-slate-700">
                Join the local food support and delivery network.
              </p>
            </div>

            <div>
              <h3 className="font-black text-blue-600">
                Catering Businesses
              </h3>
              <p className="mt-2 text-slate-700">
                Promote catering services and event food solutions.
              </p>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}