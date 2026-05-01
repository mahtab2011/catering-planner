import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pakistani Food in London | Karahi, Nihari, Biryani & Kebabs",
  description:
    "Discover Pakistani food in London including chicken karahi, lamb karahi, nihari, haleem, seekh kebab, chapli kebab, sajji, biryani, pulao, naan, samosa chaat and more.",
  alternates: {
    canonical: "/pakistani-food-london",
  },
  openGraph: {
    title: "Pakistani Food in London | SmartServeUK",
    description:
      "Find Pakistani restaurants, street food vendors and catering services across London.",
    url: "https://smartserveuk.com/pakistani-food-london",
    siteName: "SmartServeUK",
    type: "website",
  },
};

export default function PakistaniFoodLondonPage() {
  const categories = [
    {
      title: "Classic Curries & Stews",
      items: [
        "Chicken Karahi",
        "Lamb Karahi",
        "Nihari",
        "Haleem",
        "Chicken Korma",
        "Aloo Keema",
        "Paya",
      ],
    },
    {
      title: "BBQ & Grilled Items",
      items: [
        "Seekh Kebab",
        "Chapli Kebab",
        "Chicken Tikka",
        "Malai Boti",
        "Balochi Sajji",
      ],
    },
    {
      title: "Rice Dishes",
      items: ["Sindhi Biryani", "Mutton Pulao", "Chicken Pulao"],
    },
    {
      title: "Breads",
      items: ["Roghni Naan", "Paratha", "Qeema Naan"],
    },
    {
      title: "Street Food & Snacks",
      items: ["Gol Gappay", "Samosa Chaat", "Pakora", "Bun Kebab"],
    },
    {
      title: "Desserts & Drinks",
      items: [
        "Gajar ka Halwa",
        "Kheer",
        "Firni",
        "Gulab Jamun",
        "Falooda",
        "Doodh Patti",
        "Chai",
      ],
    },
  ];

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-6">Pakistani Food in London</h1>

      <p className="mb-6 text-gray-700">
        Pakistani food is loved across London for its rich curries, slow-cooked
        stews, grilled kebabs, fragrant rice dishes, fresh naan breads and
        colourful street food. From karahi and nihari to biryani, chapli kebab
        and falooda, Pakistani cuisine offers bold flavour and comfort.
      </p>

      <h2 className="text-2xl font-semibold mt-10 mb-4">
        Popular Pakistani Dishes
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        {categories.map((category) => (
          <section
            key={category.title}
            className="p-6 bg-gray-100 rounded-xl"
          >
            <h3 className="text-xl font-semibold mb-3">{category.title}</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              {category.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <h2 className="text-2xl font-semibold mt-10 mb-4">
        Find Pakistani Restaurants and Caterers
      </h2>

      <p className="mb-6 text-gray-700">
        SmartServeUK helps users discover Pakistani restaurants, takeaway shops,
        street food vendors and catering services across London. Whether you are
        looking for a family meal, event catering or a quick takeaway, explore
        trusted food businesses on SmartServeUK.
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