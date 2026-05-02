import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "African Food in London | Jollof Rice, Suya & Traditional Dishes",
  description:
    "Discover African food in London including jollof rice, fufu, suya, waakye, bobotie, bunny chow and tagine.",
  alternates: {
    canonical: "/african-food-london",
  },
};

export default function AfricanFoodPage() {
  const dishes = [
    "Jollof Rice",
    "Fufu & Egusi Soup",
    "Suya",
    "Waakye",
    "Moi Moi",
    "Akara",
    "Plantain (Dodo/Boli)",
    "Bobotie",
    "Boerewors",
    "Bunny Chow",
    "Chakalaka",
    "Mandazi",
    "Ugali",
    "Chapati",
    "Tagine",
    "Koshary",
    "Couscous",
  ];

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-6">African Food in London</h1>

      <p className="mb-6 text-gray-700">
        African food in London includes dishes from West, East, North and South Africa, 
        offering bold flavours, spices and traditional cooking styles.
      </p>


      <ul className="list-disc pl-6 space-y-2 text-gray-700">
        {dishes.map((d) => <li key={d}>{d}</li>)}
      </ul>
    </main>
  );
}