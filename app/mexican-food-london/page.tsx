import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mexican Food in London | Tacos, Burritos & Street Food",
  description:
    "Discover Mexican food in London including tacos, burritos, quesadillas, nachos and authentic street food.",
};

export default function Page() {
  const dishes = [
    "Tacos",
    "Burritos",
    "Quesadillas",
    "Fajitas",
    "Nachos",
    "Enchiladas",
    "Guacamole",
    "Tamales",
    "Churros",
  ];

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Mexican Food in London</h1>

      <p className="mb-6 text-gray-700">
        Mexican food is popular for its bold flavours, spices and street food culture.
        From tacos to burritos, London has many Mexican food options.
      </p>

      <ul className="list-disc pl-6 space-y-2">
        {dishes.map((d) => <li key={d}>{d}</li>)}
      </ul>
    </main>
  );
}