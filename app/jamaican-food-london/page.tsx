import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jamaican Food in London | Jerk Chicken, Curry Goat & Caribbean Dishes",
  description:
    "Discover Jamaican food in London including jerk chicken, curry goat, oxtail stew, patties and Caribbean street food.",
};

export default function Page() {
  const dishes = [
    "Jerk Chicken",
    "Curry Goat",
    "Oxtail Stew",
    "Ackee and Saltfish",
    "Escovitch Fish",
    "Rice and Peas",
    "Jamaican Patties",
    "Fried Plantain",
    "Festival",
    "Callaloo",
  ];

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Jamaican Food in London</h1>

      <p className="mb-6 text-gray-700">
        Jamaican food is popular in London for its bold spices, smoky jerk flavours
        and rich Caribbean dishes. From street food to takeaway shops and catering,
        you can find authentic Jamaican cuisine across the city.
      </p>
   
      
      <ul className="list-disc pl-6 space-y-2">
        {dishes.map((d) => <li key={d}>{d}</li>)}
      </ul>
    </main>
  );
}