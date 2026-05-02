import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Best Biryani & Pulao in London | Hyderabadi, Kacchi, Kabuli & More",
  description:
    "Discover the best biryani and pulao in London including Hyderabadi dum biryani, Bangladeshi kacchi biryani, Afghan kabuli pulao and more.",
  alternates: {
    canonical: "/biryani-polao-london",
  },
  openGraph: {
    title: "Best Biryani & Pulao in London",
    description:
      "Explore top biryani and pulao dishes across London from Indian, Bangladeshi and Afghan cuisines.",
    url: "https://smartserveuk.com/biryani-polao-london",
    siteName: "SmartServeUK",
    type: "website",
  },
};

export default function BiryaniPolaoPage() {
  const dishes = [
    {
      name: "Hyderabadi Dum Biryani",
      desc: "A bold and aromatic classic, slow-cooked using the dum method where tender meat and fragrant rice are sealed together for deep flavour. Often served with cooling raita and spicy mirchi ka salan.",
    },
    {
      name: "Lucknowi (Awadhi) Biryani",
      desc: "A lighter and more refined biryani, delicately spiced with saffron, yoghurt and aromatic herbs, offering a rich yet balanced flavour.",
    },
    {
      name: "Bangladeshi Kacchi Biryani",
      desc: "A signature East London favourite featuring raw-marinated meat layered with rice and slow-cooked to perfection, delivering intense flavour and tenderness.",
    },
    {
      name: "Morog Polao",
      desc: "A fragrant and slightly sweet Bangladeshi pulao cooked with chicken, often served with shami kebab and borhani for a complete meal.",
    },
    {
      name: "Chicken Tikka / 65 Biryani",
      desc: "Modern fusion biryanis combining grilled chicken tikka or spicy chicken 65 with traditional biryani rice, popular in contemporary London menus.",
    },
    {
      name: "Kabuli Pulao",
      desc: "An Afghan-style rice dish topped with caramelised carrots, raisins and tender meat, offering a rich and slightly sweet flavour profile.",
    },
    {
      name: "Vegetable & Vegan Biryani",
      desc: "A lighter option made with seasonal vegetables, herbs and spices, often available as vegan-friendly alternatives across London.",
    },
  ];

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      
      <h1 className="text-3xl font-bold mb-6">
        Best Biryani & Pulao in London
      </h1>

      <p className="mb-6 text-gray-700">
        Biryani and pulao are among the most loved dishes in London, bringing together rich spices, fragrant rice and slow-cooked meats. 
        From traditional Indian and Bangladeshi biryanis to Afghan-style pulao, London offers a wide range of flavours for every food lover.
      </p>

      <p className="mb-6 text-gray-700">
        Whether you are searching for authentic Hyderabadi dum biryani, kacchi biryani in East London or a modern fusion version, 
        SmartServeUK helps you discover the best restaurants, street food vendors and catering services across the city.
      </p>

      <h2 className="text-2xl font-semibold mt-10 mb-4">
        Popular Biryani & Pulao Dishes
      </h2>

      <div className="space-y-6">
        {dishes.map((dish) => (
          <div key={dish.name}>
            <h3 className="text-xl font-semibold">{dish.name}</h3>
            <p className="text-gray-700">{dish.desc}</p>
          </div>
        ))}
      </div>

      <h2 className="text-2xl font-semibold mt-10 mb-4">
        Find Biryani & Pulao Near You
      </h2>

      <p className="mb-6 text-gray-700">
        Explore restaurants, takeaway shops and catering services offering biryani and pulao across London. 
        Compare options, discover new flavours and find trusted food vendors with SmartServeUK.
      </p>

      <div className="mt-10 p-6 bg-gray-100 rounded-xl">
        <h3 className="text-xl font-semibold mb-2">
          Explore More Food Options
        </h3>

        <div className="flex gap-4 flex-wrap">
          <a href="/indian-food-london" className="text-blue-600 underline">
            Indian Food London
          </a>
          <a href="/pakistani-food-london" className="text-blue-600 underline">
            Pakistani Food London
          </a>
          <a href="/bangladeshi-food-east-london" className="text-blue-600 underline">
            Bangladeshi Food East London
          </a>
        </div>
      </div>

    </main>
  );
}