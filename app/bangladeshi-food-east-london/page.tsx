import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Bangladeshi Food in East London | Brick Lane, Green Street & East Ham",
  description:
    "Discover authentic Bangladeshi food in East London including bhorta, kacchi biryani, shorshe ilish, beef shatkora, pitha, street food and traditional sweets.",
  alternates: {
    canonical: "/bangladeshi-food-east-london",
  },
  openGraph: {
    title: "Bangladeshi Food in East London",
    description:
      "Explore Bangladeshi cuisine across Brick Lane, Green Street and East Ham.",
    url: "https://smartserveuk.com/bangladeshi-food-east-london",
    siteName: "SmartServeUK",
    type: "website",
  },
};

export default function BangladeshiFoodPage() {
  const categories = [
    {
      title: "Traditional Bangladeshi Dishes",
      items: [
        "Bhorta (Aloo, Begun, Shutki)",
        "Beef Shatkora",
        "Shorshe Ilish",
        "Kacchi Biryani",
        "Bhuna Khichuri",
        "Fish Curries (Rui, Katla, Boal)",
        "Kala Bhuna",
        "Beef Bhuna",
        "Chicken Roast",
        "Gorur Kolija Bhuna",
        "Kosha Mangsho",
        "Beef Kofta Curry",
      ],
    },
    {
      title: "Street Food & Snacks",
      items: [
        "Chotpoti",
        "Fuchka",
        "Mughlai Paratha",
        "Naga Spicy Dishes",
      ],
    },
    {
      title: "Rice & Comfort Food",
      items: [
        "Tehari",
        "Khichuri",
        "Chaler Roti",
      ],
    },
    {
      title: "Pitha (Traditional Cakes)",
      items: [
        "Bhapa Pitha",
        "Chitoi Pitha",
        "Patishapta",
        "Puli Pitha",
        "Poa Pitha",
        "Nokshi Pitha",
      ],
    },
    {
      title: "Desserts & Sweets",
      items: [
        "Roshomalai",
        "Roshogolla",
        "Chom Chom",
        "Sandesh",
        "Mishti Doi",
        "Kala Jamun",
        "Khir Kodom",
        "Rajbhog",
      ],
    },
    {
      title: "Drinks",
      items: [
        "Motka Cha",
        "Karak Cha",
      ],
    },
  ];

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-6">
        Bangladeshi Food in East London
      </h1>

      <p className="mb-6 text-gray-700">
        East London is home to one of the largest Bangladeshi communities in the UK. 
        Areas like Brick Lane, Green Street, East Ham and High Street North offer 
        authentic Bangladeshi cuisine ranging from traditional home-style cooking 
        to vibrant street food.
      </p>

      <p className="mb-6 text-gray-700">
        Bangladeshi food is known for its rich spices, mustard oil flavours, slow-cooked 
        meats, fresh fish curries and unique sweets. Whether you are looking for a quick 
        snack like fuchka or a full meal like kacchi biryani, East London has it all.
      </p>

      <h2 className="text-2xl font-semibold mt-10 mb-4">
        Popular Bangladeshi Food Categories
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
        Best Areas for Bangladeshi Food
      </h2>

      <ul className="list-disc pl-6 text-gray-700 space-y-2">
        <li>Brick Lane</li>
        <li>Green Street (Plashet Road)</li>
        <li>East Ham</li>
        <li>High Street North</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-10 mb-4">
        Discover Bangladeshi Restaurants & Caterers
      </h2>

      <p className="mb-6 text-gray-700">
        SmartServeUK helps you discover Bangladeshi restaurants, street food vendors 
        and catering services across London. Whether you are planning an event or 
        looking for authentic flavours, explore trusted vendors here.
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
          <a href="/indian-food-london" className="text-blue-600 underline">
            Indian Food London
          </a>
        </div>
      </div>
    </main>
  );
}