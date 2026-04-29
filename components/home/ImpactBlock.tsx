export default function ImpactBlock() {
  return (
    <section className="w-full bg-gray-50 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-2">
            Supporting smarter, more sustainable catering services
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            SmartServeUK helps reduce inefficiencies in how food services are
            discovered, booked, and delivered across cities.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold">Reduced congestion</h3>
            <p className="mt-3 text-gray-600">
              By improving coordination and digital access, unnecessary travel
              and last-minute arrangements can be reduced.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold">Efficient transport use</h3>
            <p className="mt-3 text-gray-600">
              Better planning and structured bookings can support more efficient
              use of transport services, including traditional services such as
              licensed Black Cabs.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold">Lower environmental impact</h3>
            <p className="mt-3 text-gray-600">
              Reducing unnecessary trips and improving coordination contributes
              to lowering emissions and supporting cleaner urban environments.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}