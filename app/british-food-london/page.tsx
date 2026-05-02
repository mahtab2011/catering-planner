import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "British Food in London | Fish & Chips, Roast & Classic Dishes",
  description:
    "Discover British food in London including fish and chips, Sunday roast, full English breakfast and traditional desserts.",
  alternates: {
    canonical: "/british-food-london",
  },
};

export default function BritishFoodPage() {
  const dishes = [
    "Fish and Chips",
    "Sunday Roast",
    "Full English Breakfast",
    "Shepherd’s Pie",
    "Bangers and Mash",
    "Chicken Tikka Masala",
    "Toad in the Hole",
    "Cornish Pasty",
    "Sausage Roll",
    "Scotch Egg",
    "Sticky Toffee Pudding",
    "Scones",
    "Eton Mess",
    "Trifle",
    "Crumpets",
    "Haggis",
    "Black Pudding",
    "Jellied Eels",
  ];

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-6">British Food in London</h1>

      <p className="mb-6 text-gray-700">
        British food includes classic dishes like fish and chips, Sunday roast and 
        full English breakfast, along with traditional desserts and regional specialties.
      </p>

      <ul className="list-disc pl-6 space-y-2 text-gray-700">
        {dishes.map((d) => <li key={d}>{d}</li>)}
      </ul>
    </main>
  );
}