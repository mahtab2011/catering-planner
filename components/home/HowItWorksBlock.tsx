export default function HowItWorksBlock() {
  return (
    <section className="w-full bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-2">
            How SmartServeUK works
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            A simple digital journey for customers, restaurants, caterers, and service providers.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 transition hover:-translate-y-1 hover:shadow-md">
            <h3 className="text-xl font-bold">1. Create your account</h3>
            <p className="mt-3 text-gray-600">
              Customers download the app for free and log in securely to manage their own private profile.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 transition hover:-translate-y-1 hover:shadow-md">
            <h3 className="text-xl font-bold">2. Browse and request</h3>
            <p className="mt-3 text-gray-600">
              Users can explore food providers, catering options, offers, and service availability in one place.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 transition hover:-translate-y-1 hover:shadow-md">
            <h3 className="text-xl font-bold">3. Manage securely</h3>
            <p className="mt-3 text-gray-600">
              Bookings, communication, and confidential details stay protected inside each user’s account.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}