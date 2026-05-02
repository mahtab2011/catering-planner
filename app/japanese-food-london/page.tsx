import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Japanese Food in London | Sushi, Ramen & Rice Dishes",
  description:
    "Discover Japanese food in London including sushi, ramen, curry rice, onigiri, mochi and traditional rice dishes.",
  alternates: {
    canonical: "/japanese-food-london",
  },
};

export default function JapaneseFoodPage() {
  const dishes = [
    "Sushi (Nigiri, Maki, Temaki)",
    "Chirashi Sushi",
    "Inari Sushi",
    "Curry Rice",
    "Onigiri",
    "Omurice",
    "Takikomi Gohan",
    "Ochazuke",
    "Mochi",
    "Fried Rice (Chahan)",
  ];

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-6">Japanese Food in London</h1>

      <p className="mb-6 text-gray-700">
        Japanese food in London includes sushi, rice dishes, light curries and traditional meals. 
        Known for simplicity and freshness, Japanese cuisine focuses on balance and quality ingredients.
      </p>

      <ul className="list-disc pl-6 space-y-2 text-gray-700">
        {dishes.map((d) => <li key={d}>{d}</li>)}
      </ul>
    </main>
  );
}