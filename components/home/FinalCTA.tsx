export default function FinalCTA() {
  return (
    <section className="w-full bg-sky-900 py-20 md:py-24">
      <div className="mx-auto max-w-4xl px-6 text-center text-white">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-2">
          Ready to start with SmartServeUK?
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-lg text-sky-100">
          Download the app for free, manage your catering needs securely, or connect with us as a restaurant, caterer, or service provider.
        </p>

        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">

  {/* Primary */}
  <button className="rounded-xl bg-white px-8 py-4 text-sm font-bold text-sky-900 shadow-lg transition hover:scale-105 hover:bg-gray-100">
    Download Free App
  </button>

  {/* Secondary */}
  <button className="rounded-xl border border-white/40 px-8 py-4 text-sm font-bold text-white transition hover:bg-white/10">
    Partner with us
  </button>

</div>
      </div>
    </section>
  );
}