export default function TrustDataBlock() {
  return (
    <section className="w-full bg-sky-50 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="rounded-3xl bg-white p-10 shadow-lg">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-sm font-bold uppercase tracking-wide text-sky-600">
              Privacy & Trust
            </p>

            <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-2">
              Your information stays private and protected
            </h2>

            <p className="mt-5 text-lg leading-8 text-gray-600">
              SmartServeUK is designed so each customer can only access their
              own account, bookings, preferences, and confidential information.
              Private customer data is not visible to other users, restaurants,
              or outside parties.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
              <h3 className="text-lg font-bold">Private accounts</h3>
              <p className="mt-3 text-gray-600">
                Each customer works from their own secure login area.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
              <h3 className="text-lg font-bold">Protected data</h3>
              <p className="mt-3 text-gray-600">
                Confidential information stays linked to the correct user only.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
              <h3 className="text-lg font-bold">Clear access control</h3>
              <p className="mt-3 text-gray-600">
                Users only see the information relevant to their own account.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}