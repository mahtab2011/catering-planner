export type WaterIngredient = {
  name: string;
  category: "Water";
  grade: string;
  weight: string;
  aliases?: string[];
};

export const waterIngredients: WaterIngredient[] = [
  {
    name: "Mineral Water",
    category: "Water",
    grade: "500 ml",
    weight: "Litre",
    aliases: ["Mineral Water", "Drinking Water"],
  },
  {
    name: "Mineral Water",
    category: "Water",
    grade: "1 litre",
    weight: "Litre",
    aliases: ["Mineral Water", "Drinking Water"],
  },
  {
    name: "Mineral Water",
    category: "Water",
    grade: "1.5 litre",
    weight: "Litre",
    aliases: ["Mineral Water", "Drinking Water"],
  },
  {
    name: "Mineral Water",
    category: "Water",
    grade: "2 litre",
    weight: "Litre",
    aliases: ["Mineral Water", "Drinking Water"],
  },
  {
    name: "Mineral Water",
    category: "Water",
    grade: "5 litre",
    weight: "Litre",
    aliases: ["Mineral Water", "Drinking Water"],
  },
  {
    name: "Mineral Water",
    category: "Water",
    grade: "20 litre",
    weight: "Litre",
    aliases: ["Mineral Water", "Drinking Water", "Jar Water"],
  },

  {
    name: "Sparkling Water",
    category: "Water",
    grade: "330 ml",
    weight: "Litre",
    aliases: ["Sparkling Water", "Soda Water"],
  },
  {
    name: "Sparkling Water",
    category: "Water",
    grade: "500 ml",
    weight: "Litre",
    aliases: ["Sparkling Water", "Soda Water"],
  },
  {
    name: "Sparkling Water",
    category: "Water",
    grade: "1 litre",
    weight: "Litre",
    aliases: ["Sparkling Water", "Soda Water"],
  },

  {
    name: "Rose Water",
    category: "Water",
    grade: "250 ml",
    weight: "Litre",
    aliases: ["Rose Water", "Golap Jol"],
  },
  {
    name: "Rose Water",
    category: "Water",
    grade: "500 ml",
    weight: "Litre",
    aliases: ["Rose Water", "Golap Jol"],
  },

  {
    name: "Kewra Water",
    category: "Water",
    grade: "250 ml",
    weight: "Litre",
    aliases: ["Kewra Water", "Keora Water"],
  },
  {
    name: "Kewra Water",
    category: "Water",
    grade: "500 ml",
    weight: "Litre",
    aliases: ["Kewra Water", "Keora Water"],
  },
];