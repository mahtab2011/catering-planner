import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brazilian Food in London | BBQ, Feijoada & Street Food",
  description:
    "Discover Brazilian food in London including churrasco BBQ, feijoada, coxinha, pão de queijo and desserts.",
};

export default function Page() {
  const dishes = [
    "Feijoada",
    "Churrasco",
    "Pão de Queijo",
    "Coxinha",
    "Pastel",
    "Moqueca",
    "Açaí Bowl",
    "Farofa",
    "Brigadeiro",
  ];

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Brazilian Food in London</h1>

      <p className="mb-6 text-gray-700">
        Brazilian food includes BBQ meats, stews and street snacks. London has
        growing Brazilian restaurants and catering services.
      </p>

      <ul className="list-disc pl-6 space-y-2">
        {dishes.map((d) => <li key={d}>{d}</li>)}
      </ul>
    </main>
  );
}