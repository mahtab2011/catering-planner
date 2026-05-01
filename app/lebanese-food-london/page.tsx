import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lebanese Food in London | Shawarma, Kibbeh, Kafta & Seafood",
  description:
    "Discover Lebanese food in London including shawarma, kibbeh, kafta kebabs, shish taouk, sayadieh, samke harra, hummus, tabbouleh and fattoush.",
  alternates: {
    canonical: "/lebanese-food-london",
  },
  openGraph: {
    title: "Lebanese Food in London | SmartServeUK",
    description:
      "Find Lebanese restaurants, takeaway shops, street food vendors and catering services across London.",
    url: "https://smartserveuk.com/lebanese-food-london",
    siteName: "SmartServeUK",
    type: "website",
  },
};

export default function LebaneseFoodLondonPage() {
  const categories = [
    {
      title: "Fish & Seafood Dishes",
      items: [
        "Sayadieh / Saiadia",
        "Samke Harra",
        "Grilled Sea Bass",
        "Grilled Sea Bream",
        "Sautéed Prawns",
        "Sautéed Squid",
        "Baked Fish en Papillote",
      ],
    },
    {
      title: "Common Seafood Ingredients",
      items: [
        "Cod",
        "Sea Bass",
        "Sea Bream",
        "Snapper",
        "Flounder",
        "Tilapia",
        "Salmon",
        "Tahini",
        "Garlic",
        "Lemon Juice",
        "Coriander",
        "Pine Nuts",
      ],
    },
    {
      title: "Meat Dishes",
      items: [
        "Kibbeh",
        "Kibbeh Nayyeh",
        "Kafta Kebabs",
        "Shish Taouk",
        "Shawarma",
        "Sfeeha",
        "Lamb Chops",
        "Shish Barak",
        "Bazella",
        "Warak Enab",
      ],
    },
    {
      title: "Accompaniments",
      items: ["Hummus", "Tabbouleh", "Fattoush", "Toum"],
    },
  ];

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-6">Lebanese Food in London</h1>

      <p className="mb-6 text-gray-700">
        Lebanese food is popular in London for its fresh herbs, grilled meats,
        seafood dishes, mezze plates, garlic sauces, tahini flavours and
        colourful salads. From shawarma and kafta to sayadieh and hummus,
        Lebanese cuisine offers both everyday takeaway favourites and elegant
        catering options.
      </p>

      <p className="mb-6 text-gray-700">
        SmartServeUK helps users discover Lebanese restaurants, takeaway shops,
        food vendors and catering services across London.
      </p>

      <h2 className="text-2xl font-semibold mt-10 mb-4">
        Popular Lebanese Food Categories
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
        Find Lebanese Restaurants and Caterers
      </h2>

      <p className="mb-6 text-gray-700">
        Whether you are searching for shawarma, grilled meats, seafood, mezze or
        catering for an event, SmartServeUK connects users with food businesses
        across London.
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
          <a href="/turkish-food-london" className="text-blue-600 underline">
            Turkish Food London
          </a>
        </div>
      </div>
    </main>
  );
}