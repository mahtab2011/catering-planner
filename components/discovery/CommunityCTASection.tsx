import Link from "next/link";

export default function CommunityCTASection() {
  return (
    <section className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center sm:p-10">
      <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
        Join London&apos;s Food Community
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-neutral-700">
        Create a free account to write reviews, save your favourite places, and share your own
        food discoveries with London Food Hubs.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/create-account"
          className="rounded-xl bg-amber-600 px-6 py-3 text-sm font-bold text-white hover:bg-amber-700"
        >
          Create Free Account
        </Link>
        <Link
          href="/restaurants"
          className="rounded-xl border border-amber-300 bg-white px-6 py-3 text-sm font-semibold text-amber-800 hover:bg-amber-100"
        >
          Start Exploring
        </Link>
      </div>
    </section>
  );
}
