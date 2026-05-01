import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Bangladeshi Food in East London | Green Street, Brick Lane & East Ham",
  description:
    "Discover authentic Bangladeshi food in East London including chotpoti, fuchka, kacchi biryani, tehari, duck curry and more in Green Street, Brick Lane and East Ham.",
  alternates: {
    canonical: "/bangladeshi-food-east-london",
  },
  openGraph: {
    title:
      "Bangladeshi Food in East London | Best Spots in London",
    description:
      "Explore Bangladeshi street food and traditional dishes across Green Street, Brick Lane and East Ham.",
    url: "https://smartserveuk.com/bangladeshi-food-east-london",
    siteName: "SmartServeUK",
    type: "website",
  },
};

export default function BangladeshiFoodPage() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      
      <h1 className="text-3xl font-bold mb-6">
        Bangladeshi Food in East London
      </h1>

      <p className="mb-6 text-gray-700">
        East London is famous for its vibrant Bangladeshi food culture. 
        Areas like Green Street, Brick Lane, East Ham and High Street North 
        offer some of the best traditional and street food experiences in London.
      </p>

      <h2 className="text-2xl font-semibold mt-10 mb-4">
        Popular Bangladeshi Dishes in London
      </h2>

      <ul className="list-disc pl-6 text-gray-700 space-y-2">
        <li>Chotpoti & Fuchka (street snacks)</li>
        <li>Tehari (spiced rice dish)</li>
        <li>Bangladeshi Pitha (traditional desserts)</li>
        <li>Haser Mangso (Duck Curry)</li>
        <li>Chaler Roti (rice flatbread)</li>
        <li>Khichuri (comfort rice dish)</li>
        <li>Kacchi Biryani (signature dish)</li>
        <li>Motka Cha / Karak Cha (tea)</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-10 mb-4">
        Best Areas for Bangladeshi Food
      </h2>

      <p className="text-gray-700 mb-4">
        You can find authentic Bangladeshi food in:
      </p>

      <ul className="list-disc pl-6 text-gray-700 space-y-2">
        <li>Green Street (Plashet Road)</li>
        <li>Brick Lane</li>
        <li>East Ham</li>
        <li>High Street North</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-10 mb-4">
        Discover Vendors on SmartServeUK
      </h2>

      <p className="mb-6 text-gray-700">
        SmartServeUK helps you find Bangladeshi restaurants, street food vendors 
        and catering services across London. Whether you are planning an event or 
        just looking for authentic flavours, explore trusted vendors here.
      </p>

      <div className="mt-10 p-6 bg-gray-100 rounded-xl">
        <h3 className="text-xl font-semibold mb-2">
          Explore More
        </h3>

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