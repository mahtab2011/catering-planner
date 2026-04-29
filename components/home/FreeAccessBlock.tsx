export default function FreeAccessBlock() {
  return (
    <section className="w-full py-16 bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 text-center bg-white rounded-2xl shadow-lg p-10">

        <h2 className="text-3xl font-bold mb-4">
          Download the app for free and start working securely
        </h2>

        <p className="text-lg text-gray-600 mb-6">
          SmartServeUK is free for customers to download. Once logged in,
          each customer can manage bookings, preferences, and communication
          from their own private account.
        </p>

        <p className="text-gray-500 mb-8">
          Your confidential data is protected and only visible to you.
        </p>

        <div className="flex justify-center gap-4">
          <button className="bg-black text-white px-6 py-3 rounded-xl">
            Download Free App
          </button>

          <button className="border px-6 py-3 rounded-xl">
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