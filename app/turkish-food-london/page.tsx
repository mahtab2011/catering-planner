import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Turkish Food in London | Kebabs, Doner, Shish & Mixed Grill",
  description:
    "Discover Turkish food in London including lamb shish, chicken shish, doner kebab, kofta, Adana kebab, Iskender kebab, pide, cacik, ezme and more.",
  alternates: {
    canonical: "/turkish-food-london",
  },
};

export default function TurkishFoodLondonPage() {
  const dishes = [
    "Lamb Shish",
    "Chicken Shish",
    "Doner Kebab",
    "Lamb Kofta",
    "Adana Kebab",
    "Mixed Grill",
    "Chicken Wings",
    "Iskender Kebab",
    "Beyti Kebab",
    "Patlıcan Kebab",
    "Çöp Şiş",
    "Pide / Lavaş",
    "Cacık",
    "Ezme Salad",
    "Bulgur Pilav",
    "Sumac Onions",
    "Halloumi Grill",
    "Falafel",
  ];

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-6">
        Turkish Food in London
      </h1>

      <p className="mb-6 text-gray-700">
        Turkish food is one of London’s most loved cuisines, known for grilled
        kebabs, charcoal flavours, fresh salads, warm flatbreads and generous
        mixed grill platters.
      </p>

      <h2 className="text-2xl font-semibold mt-10 mb-4">
        Popular Turkish Dishes
      </h2>

      <ul className="list-disc pl-6 text-gray-700 space-y-2">
        {dishes.map((dish) => (
          <li key={dish}>{dish}</li>
        ))}
      </ul>

      <h2 className="text-2xl font-semibold mt-10 mb-4">
        Find Turkish Restaurants and Vendors
      </h2>

      <p className="mb-6 text-gray-700">
        SmartServeUK helps users discover Turkish restaurants, kebab houses,
        takeaway shops, street food vendors and catering services across London.
      </p>

      <div className="mt-10 p-6 bg-gray-100 rounded-xl">
        <h3 className="text-xl font-semibold mb-2">Explore More</h3>
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