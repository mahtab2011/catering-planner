import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Indian Food in London | Curries, Tandoori, Vegetarian & Takeaway",
  description:
    "Discover Indian food in London including vegetarian curries, paneer dishes, chicken tikka masala, butter chicken, lamb rogan josh, tandoori grills, naan and classic UK Indian restaurant favourites.",
  alternates: {
    canonical: "/indian-food-london",
  },
  openGraph: {
    title: "Indian Food in London | SmartServeUK",
    description:
      "Find Indian restaurants, takeaway shops, street food vendors and catering services across London.",
    url: "https://smartserveuk.com/indian-food-london",
    siteName: "SmartServeUK",
    type: "website",
  },
};

export default function IndianFoodLondonPage() {
  const categories = [
    {
      title: "Popular Vegetarian Indian Dishes",
      items: [
        "Paneer Butter Masala",
        "Palak Paneer",
        "Aloo Gobi",
        "Chana Masala",
        "Vegetable Korma",
        "Bhindi Masala",
        "Dal Makhani",
        "Tarka Dal",
      ],
    },
    {
      title: "Vegetarian Starters & Snacks",
      items: [
        "Samosas",
        "Onion Bhaji",
        "Paneer Tikka",
        "Hara Bhara Kabab",
        "Aloo Tikki",
      ],
    },
    {
      title: "Popular Non-Vegetarian Indian Dishes",
      items: [
        "Chicken Tikka Masala",
        "Butter Chicken",
        "Lamb Rogan Josh",
        "Chicken Jalfrezi",
        "Balti Chicken",
        "Balti Lamb",
        "Phaal Curry",
        "Mutton Keema",
      ],
    },
    {
      title: "Tandoor & Grill",
      items: [
        "Tandoori Chicken",
        "Chicken Tikka",
        "Seekh Kebab",
        "Lamb Chops",
        "Fish Pakora",
      ],
    },
    {
      title: "Breads & Sides",
      items: [
        "Plain Naan",
        "Garlic Naan",
        "Peshwari Naan",
        "Roti",
        "Paratha",
        "Papadums with Chutneys",
        "Bombay Aloo",
        "Saag Paneer",
      ],
    },
    {
      title: "South Indian Favourites",
      items: ["Masala Dosa", "Idli", "Vada"],
    },
  ];

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-6">Indian Food in London</h1>

      <p className="mb-6 text-gray-700">
        Indian food is one of the most popular cuisines in London, known for its
        rich curries, vegetarian dishes, tandoori grills, aromatic spices,
        freshly baked breads and takeaway favourites. From classic curry houses
        to modern Indian restaurants and catering services, London offers a wide
        range of Indian food experiences.
      </p>

      <p className="mb-6 text-gray-700">
        SmartServeUK helps users discover Indian restaurants, takeaway shops,
        street food vendors and catering services across London. Whether you are
        looking for a family meal, office lunch, event catering or late-night
        takeaway, explore trusted Indian food businesses here.
      </p>

      <h2 className="text-2xl font-semibold mt-10 mb-4">
        Popular Indian Food Categories
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        {categories.map((category) => (
          <section key={category.title} className="p-6 bg-gray-100 rounded-xl">
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
        Classic UK Indian Restaurant Favourites
      </h2>

      <p className="mb-6 text-gray-700">
        Many UK Indian restaurants serve familiar favourites such as onion bhaji,
        vegetable samosas, chicken tikka, chicken tikka masala, vegetable
        jalfrezi, saag paneer, Bombay aloo, garlic naan and Peshwari naan.
        These dishes are popular with customers looking for both traditional
        flavour and comforting takeaway options.
      </p>

      <h2 className="text-2xl font-semibold mt-10 mb-4">
        Biryani and Pulao Pages Coming Soon
      </h2>

      <p className="mb-6 text-gray-700">
        Biryani and pulao are important search topics, so SmartServeUK will cover
        them through dedicated pages such as Hyderabadi biryani in London,
        chicken biryani in London, lamb biryani in London and pulao in London.
      </p>

      <div className="mt-10 p-6 bg-gray-100 rounded-xl">
        <h3 className="text-xl font-semibold mb-2">Explore More</h3>

        <div className="flex gap-4 flex-wrap">
          <a href="/restaurants" className="text-blue-600 underline">
            Browse Restaurants
          </a>
          <a href="/suppliers" className="text-blue-600 underline">
            Browse Suppliers
          </a>
          <a href="/chicken-tikka-london" className="text-blue-600 underline">
            Chicken Tikka London
          </a>
          <a
            href="/bangladeshi-food-east-london"
            className="text-blue-600 underline"
          >
            Bangladeshi Food East London
          </a>
        </div>
      </div>
    </main>
  );
}