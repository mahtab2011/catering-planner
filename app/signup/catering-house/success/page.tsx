import Link from "next/link";

export default function CateringHouseSignupSuccessPage() {
  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="inline-flex rounded-full bg-purple-100 px-5 py-2 text-sm font-semibold text-purple-800">
            Catering Account Created
          </div>

          <h1 className="mt-6 text-4xl font-bold tracking-tight text-neutral-950 sm:text-5xl">
            Your catering business account is ready
          </h1>

          <p className="mt-4 max-w-3xl text-lg text-neutral-600">
            Your SmartServeUK catering house account has been created
            successfully.
          </p>

          <div className="mt-8 rounded-2xl border border-purple-200 bg-purple-50 px-6 py-5 text-base text-purple-900">
            You can now manage events, plan menus, coordinate suppliers, and
            run your catering operations inside SmartServeUK.
          </div>

          <div className="mt-8 rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
            <h2 className="text-lg font-semibold text-neutral-900">
              What you can do now
            </h2>

            <ul className="mt-3 space-y-2 text-sm text-neutral-700">
              <li>• Create and manage catering events.</li>
              <li>• Plan menus, costs, and supplier coordination.</li>
              <li>• Prepare your business for future SmartServeUK workflows.</li>
            </ul>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <Link
              href="/signup/catering-house"
              className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 bg-white px-4 py-4 text-base font-semibold text-neutral-800 transition hover:bg-neutral-100"
            >
              Back to signup
            </Link>

            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-2xl bg-black px-4 py-4 text-base font-semibold text-white transition hover:bg-neutral-800"
            >
              Go to homepage
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}