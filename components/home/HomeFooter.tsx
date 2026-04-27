export default function HomeFooter() {
  return (
    <section className="bg-neutral-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 text-sm text-neutral-400 sm:px-6 lg:px-8">
        © {new Date().getFullYear()} SmartServeUK. Built for restaurants,
        caterers, stalls, vans, traders, and food delivery growth.
      </div>
    </section>
  );
}