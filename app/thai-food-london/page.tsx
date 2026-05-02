import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Thai Food in London | Pad Thai, Green Curry & Street Food",
  description:
    "Discover Thai food in London including pad thai, green curry, tom yum, pad kra pao, som tum and mango sticky rice.",
  alternates: {
    canonical: "/thai-food-london",
  },
};

export default function ThaiFoodPage() {
  const dishes = [
    "Pad Thai",
    "Pad Kra Pao",
    "Green Curry",
    "Tom Yum Goong",
    "Massaman Curry",
    "Som Tum",
    "Pad Kee Mao",
    "Mango Sticky Rice",
  ];

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-6">Thai Food in London</h1>

      <p className="mb-6 text-gray-700">
        Thai food is popular in London for its balance of sweet, sour, salty and spicy flavours. 
        From street food classics like pad thai to rich curries and fresh salads, Thai cuisine 
        offers a vibrant dining experience.
      </p>

      <ul className="list-disc pl-6 space-y-2 text-gray-700">
        {dishes.map((d) => <li key={d}>{d}</li>)}
      </ul>
    </main>
  );
}