export default function PlatformReadinessBlock() {
  return (
    <section className="w-full bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="rounded-3xl bg-sky-900 p-10 text-white shadow-lg">
          <p className="text-sm font-bold uppercase tracking-wide text-sky-200">
            Platform readiness
          </p>

          <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-2">
            Built to grow from local catering support to a wider digital service platform
          </h2>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-sky-100">
            SmartServeUK is being developed as a scalable platform that can support customers,
            restaurants, caterers, service providers, and future transport-linked services
            through one secure digital experience.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-white/10 p-6">
              <h3 className="text-lg font-bold">Scalable structure</h3>
              <p className="mt-3 text-sky-100">
                Built in reusable sections so new services and user journeys can be added over time.
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-6">
              <h3 className="text-lg font-bold">Multi-user platform</h3>
              <p className="mt-3 text-sky-100">
                Designed for customers, food businesses, catering teams, and service partners.
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-6">
              <h3 className="text-lg font-bold">Future-ready platform</h3>
              <p className="mt-3 text-sky-100">
                Designed to support digital inclusion, efficiency, trust, sustainability, and long-term business growth.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}