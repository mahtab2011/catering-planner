"use client";

import Link from "next/link";

const paymentOptions = [
  {
    title: "PayPal",
    icon: "💳",
    description:
      "Pay securely through PayPal where available. SmartServeUK does not store card details.",
  },
  {
    title: "Cash on Delivery",
    icon: "💷",
    description:
      "Pay cash when your order is delivered, if the restaurant offers this option.",
  },
  {
    title: "Card Terminal in Person",
    icon: "🏧",
    description:
      "Pay by card terminal at collection or delivery, where available from the restaurant.",
  },
];

export default function OrderPage() {
  return (
    <main className="min-h-screen bg-sky-50/40 px-4 py-10">
      <div className="mx-auto max-w-5xl rounded-3xl border border-sky-100 bg-white p-8 shadow-sm">
        <div className="inline-flex rounded-full bg-sky-100 px-4 py-1 text-sm font-semibold text-sky-900">
          SmartServeUK
        </div>

        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-neutral-900">
          Order Food
        </h1>

        <p className="mt-4 max-w-3xl text-lg text-neutral-600">
          Browse restaurants across London food hubs, explore menus, and place
          your food orders through SmartServeUK.
        </p>

        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <h2 className="text-xl font-bold text-emerald-950">
            Safe Payment Options
          </h2>
          <p className="mt-2 text-sm leading-6 text-emerald-900">
            For customer security, SmartServeUK does not store card details.
            Customers may pay by PayPal, cash on delivery, or card terminal in
            person where available.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/restaurants"
            className="inline-flex rounded-xl bg-sky-600 px-6 py-3 text-sm font-bold text-white hover:bg-sky-700"
          >
            Browse Restaurants
          </Link>

          <Link
            href="/"
            className="inline-flex rounded-xl border border-sky-200 bg-white px-6 py-3 text-sm font-bold text-sky-700 hover:bg-sky-50"
          >
            Back to Home
          </Link>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-sky-100 bg-sky-50 p-5">
            <div className="text-3xl">🗺️</div>
            <div className="mt-3 text-lg font-bold text-neutral-900">
              Browse by Hub
            </div>
            <p className="mt-2 text-sm text-neutral-600">
              Find restaurants by area and food hub.
            </p>
          </div>

          <div className="rounded-2xl border border-sky-100 bg-white p-5">
            <div className="text-3xl">🍽️</div>
            <div className="mt-3 text-lg font-bold text-neutral-900">
              Explore Menus
            </div>
            <p className="mt-2 text-sm text-neutral-600">
              View dishes, specialities, and food styles.
            </p>
          </div>

          <div className="rounded-2xl border border-sky-100 bg-white p-5">
            <div className="text-3xl">🛒</div>
            <div className="mt-3 text-lg font-bold text-neutral-900">
              Order Easily
            </div>
            <p className="mt-2 text-sm text-neutral-600">
              Place your order with a simple and clear flow.
            </p>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-2xl font-bold text-neutral-900">
            Available Payment Methods
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {paymentOptions.map((option) => (
              <div
                key={option.title}
                className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
              >
                <div className="text-3xl">{option.icon}</div>
                <div className="mt-3 text-lg font-bold text-neutral-900">
                  {option.title}
                </div>
                <p className="mt-2 text-sm leading-6 text-neutral-600">
                  {option.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}