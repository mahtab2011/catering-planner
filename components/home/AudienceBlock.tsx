export default function AudienceBlock() {
  return (
    <section className="w-full bg-white py-24">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-2">
          Built for the entire catering ecosystem
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
          SmartServeUK connects customers, restaurants, caterers, and service providers
          in one unified digital platform.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
            <h3 className="text-lg font-bold">Customers</h3>
            <p className="mt-3 text-gray-600">
              Discover, request, and manage catering services easily.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
            <h3 className="text-lg font-bold">Restaurants</h3>
            <p className="mt-3 text-gray-600">
              Reach more customers and manage orders efficiently.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
            <h3 className="text-lg font-bold">Caterers</h3>
            <p className="mt-3 text-gray-600">
              Showcase services and handle bookings in one place.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
            <h3 className="text-lg font-bold">Service Providers</h3>
            <p className="mt-3 text-gray-600">
              Connect with catering businesses and expand opportunities.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}