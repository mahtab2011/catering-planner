import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "American Food in London | Burgers, BBQ & Comfort Food",
  description:
    "Explore American food in London including burgers, BBQ ribs, fried chicken, mac and cheese and classic comfort dishes.",
};

export default function Page() {
  const dishes = [
    "Burgers",
    "BBQ Ribs",
    "Pulled Pork",
    "Fried Chicken",
    "Mac and Cheese",
    "Chilli Con Carne",
    "Philly Cheesesteak",
    "Pancakes",
    "Bagels",
  ];

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">American Food in London</h1>

      <p className="mb-6 text-gray-700">
        American food in London includes burgers, BBQ, fried chicken and comfort food.
        Many restaurants offer classic US-style meals and takeaway options.
      </p>

      <ul className="list-disc pl-6 space-y-2">
        {dishes.map((d) => <li key={d}>{d}</li>)}
      </ul>
    </main>
  );
}