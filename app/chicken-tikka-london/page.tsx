import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Best Chicken Tikka in London | SmartServeUK",
  description:
    "Discover the best chicken tikka in London. Find top restaurants, street food vendors, and catering services offering authentic chicken tikka near you.",
  alternates: {
    canonical: "/chicken-tikka-london",
  },
  openGraph: {
    title: "Best Chicken Tikka in London",
    description:
      "Explore the best places for chicken tikka across London. Browse restaurants and vendors on SmartServeUK.",
    url: "https://smartserveuk.com/chicken-tikka-london",
    siteName: "SmartServeUK",
    type: "website",
  },
};

export default function ChickenTikkaPage() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      
      <h1 className="text-3xl font-bold mb-6">
        Best Chicken Tikka in London
      </h1>

      <p className="mb-6 text-gray-700">
        Chicken tikka is one of the most popular dishes in London, loved for its smoky flavour and rich spices. 
        Whether you’re looking for street food, restaurant dining, or catering services, London offers a wide range of options.
      </p>

      <h2 className="text-2xl font-semibold mt-10 mb-4">
        Where to Find Chicken Tikka in London
      </h2>

      <p className="mb-6 text-gray-700">
        You can find chicken tikka across East London, West London, and Central London. Many restaurants, food stalls, 
        and catering services specialise in authentic Indian and Bangladeshi flavours.
      </p>

      <h2 className="text-2xl font-semibold mt-10 mb-4">
        Explore Vendors on SmartServeUK
      </h2>

      <p className="mb-6 text-gray-700">
        SmartServeUK helps you discover trusted food vendors and restaurants offering chicken tikka. 
        Browse suppliers, compare options, and find the best match for your event or meal.
      </p>

      <div className="mt-10 p-6 bg-gray-100 rounded-xl">
        <h3 className="text-xl font-semibold mb-2">
          Looking for more food options?
        </h3>
        <p className="mb-4 text-gray-700">
          Explore restaurants and suppliers across London.
        </p>

        <div className="flex gap-4">
          <a href="/restaurants" className="text-blue-600 underline">
            Browse Restaurants
          </a>
          <a href="/suppliers" className="text-blue-600 underline">
            Browse Suppliers
          </a>
        </div>
      </div>

    </main>
  );
}