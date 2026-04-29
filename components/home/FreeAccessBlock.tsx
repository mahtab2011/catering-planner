export default function FreeAccessBlock() {
  return (
    <section className="w-full bg-gray-50 py-24">
      <div className="mx-auto max-w-6xl rounded-2xl bg-white px-6 py-10 text-center shadow-lg">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-2">
          Download the app for free and start working securely
        </h2>

        <p className="mx-auto mb-6 mt-4 max-w-2xl text-lg text-gray-600">
          SmartServeUK is free for customers to download. Once logged in,
          each customer can manage bookings, preferences, and communication
          from their own private account.
        </p>

        <p className="mx-auto mb-8 max-w-xl text-gray-500">
          Your confidential data is protected and only visible to you.
        </p>

        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <button className="rounded-xl bg-sky-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-105 hover:bg-sky-700">
            Download Free App
          </button>

          <button className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-bold text-gray-800 transition hover:bg-gray-50">
            Log in securely
          </button>
        </div>

        <p className="mt-6 text-sm text-gray-400">
          Private by design. Secure by default.
        </p>
      </div>
    </section>
  );
}