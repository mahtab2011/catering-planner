import Link from "next/link";

export default function BlackCabSignupSuccessPage() {
  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="inline-flex rounded-full bg-yellow-100 px-5 py-2 text-sm font-semibold text-yellow-800">
            Application Received
          </div>

          <h1 className="mt-6 text-4xl font-bold tracking-tight text-neutral-950 sm:text-5xl">
            Your black cab partner request has been submitted
          </h1>

          <p className="mt-4 max-w-3xl text-lg text-neutral-600">
            Thank you for applying to join SmartServeUK as a black cab partner.
          </p>

          <div className="mt-8 rounded-2xl border border-yellow-200 bg-yellow-50 px-6 py-5 text-base text-yellow-900">
            Your application is currently under review. We will contact you once
            transport booking features go live and your account is approved.
          </div>

          <div className="mt-8 rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
            <h2 className="text-lg font-semibold text-neutral-900">
              What happens next?
            </h2>

            <ul className="mt-3 space-y-2 text-sm text-neutral-700">
              <li>• Our team will review your partner application.</li>
              <li>
                • Approved partners may be contacted for onboarding and future
                service activation.
              </li>
              <li>
                • You may hear from us when airport transfer and business travel
                features go live.
              </li>
            </ul>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <Link
              href="/signup/blackcab"
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