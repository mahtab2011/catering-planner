"use client";

import Link from "next/link";

const ROLE_CARDS = [
  {
    title: "Restaurant",
    href: "/signup/restaurant",
    badge: "OTP + Review",
    description:
      "For restaurant owners who want to join SmartServeUK, get listed, and start onboarding.",
    points: [
      "Restaurant application",
      "Restaurant-only OTP flow",
      "Pending review and onboarding",
    ],
  },
  {
    title: "Supplier",
    href: "/signup/supplier",
    badge: "Business Signup",
    description:
      "For food, meat, fish, grocery, packaging, and event suppliers who want to serve restaurants and catering houses.",
    points: [
      "Supplier business profile",
      "Product and service onboarding",
      "Future supplier dashboard access",
    ],
  },
  {
    title: "Customer",
    href: "/signup/customer",
    badge: "Quick Access",
    description:
      "For customers who want faster ordering, account access, saved details, and future order tracking.",
    points: [
      "Fast personal signup",
      "Order-related account access",
      "Future order history",
    ],
  },
  {
    title: "Rider",
    href: "/signup/rider",
    badge: "Approval Flow",
    description:
      "For delivery riders who want to work with SmartServeUK delivery operations.",
    points: [
      "Rider application flow",
      "Approval before activation",
      "Future rider dashboard access",
    ],
  },
  {
    title: "Catering House",
    href: "/signup/catering-house",
    badge: "Planner Access",
    description:
      "For catering businesses that want to use SmartServeUK Catering Planner, suppliers, events, and workflow tools.",
    points: [
      "Business signup",
      "Event planning tools",
      "Supplier and operations access",
    ],
  },
  {
    title: "Black Cab Partner",
    href: "/signup/blackcab",
    badge: "Partner Interest",
    description:
      "For licensed black cab drivers or transport partners interested in future SmartServeUK transport integration.",
    points: [
      "Partner interest form",
      "Future transport onboarding",
      "Controlled access approach",
    ],
  },
];

export default function SignupRoleSelectionPage() {
  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
          <div className="inline-flex rounded-full bg-sky-100 px-4 py-1 text-sm font-semibold text-sky-900">
            SmartServeUK Signup
          </div>

          <h1 className="mt-4 text-3xl font-bold text-neutral-900 sm:text-4xl">
            Choose how you want to join SmartServeUK
          </h1>

          <p className="mt-3 max-w-3xl text-neutral-600">
            Select your role to continue with the correct signup flow. Each
            account type has its own onboarding path, protection level, and
            future dashboard access.
          </p>

          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Restaurant accounts follow a stricter onboarding path, including
            review steps and restaurant-only OTP planning.
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {ROLE_CARDS.map((role) => (
              <div
                key={role.title}
                className="flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-xl font-bold text-neutral-900">
                    {role.title}
                  </h2>

                  <div className="shrink-0 rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
                    {role.badge}
                  </div>
                </div>

                <p className="mt-3 text-sm leading-6 text-neutral-600">
                  {role.description}
                </p>

                <div className="mt-4 space-y-2 text-sm text-neutral-700">
                  {role.points.map((point) => (
                    <div key={point} className="flex items-start gap-2">
                      <span className="mt-0.5 text-green-600">✓</span>
                      <span>{point}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-2">
                  <Link
                    href={role.href}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
                  >
                    Continue as {role.title}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
            Choose the role that best matches how you will use SmartServeUK.
            This helps keep account setup, onboarding, and future dashboard
            access organised from the beginning.
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl border border-neutral-300 px-5 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              Back to homepage
            </Link>

            <Link
              href="/restaurants"
              className="inline-flex items-center justify-center rounded-xl border border-neutral-300 px-5 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              Browse restaurants
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}