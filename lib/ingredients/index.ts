import { fishIngredients } from "./fish";
import { meatIngredients } from "./meat";
import { vegetableIngredients } from "./vegetable";
import { spiceIngredients } from "./spice";
import { oilIngredients } from "./oil";
import { waterIngredients } from "./water";
import { riceIngredients } from "./rice";
import { flourIngredients } from "./flour";
import { softDrinkIngredients } from "./softdrinks";

export type IngredientMasterItem = {
  id: string;
  name: string;
  category: string;
  variant?: string;
  unit: string;
  aliases?: string[];
  searchText: string;
};

// 🔧 Normalize ALL ingredient files into one standard format
function normalize(
  list: any[],
  category: string
): IngredientMasterItem[] {
  return list.map((item, index) => {
    const name = item.name || "";
    const variant = item.grade || "";
    const unit = item.weight || "";

    const aliases = Array.isArray(item.aliases) ? item.aliases : [];

    return {
      id: `${category}-${name}-${variant}-${index}`,
      name,
      category,
      variant,
      unit,
      aliases,
      searchText: `${name} ${variant} ${category} ${aliases.join(" ")}`.toLowerCase(),
    };
  });
}

// 🚀 FINAL MASTER LIST (use THIS everywhere in app)
export const ingredientMaster: IngredientMasterItem[] = [
  ...normalize(fishIngredients, "Fish"),
  ...normalize(meatIngredients, "Meat"),
  ...normalize(vegetableIngredients, "Vegetable"),
  ...normalize(spiceIngredients, "Spice"),
  ...normalize(oilIngredients, "Oil"),
  ...normalize(waterIngredients, "Water"),
  ...normalize(riceIngredients, "Rice"),
  ...normalize(flourIngredients, "Flour"),
  ...normalize(softDrinkIngredients, "Soft Drinks"),
];

// 🔍 Search helper (you will use this in UI later)
export function searchIngredients(query: string) {
  const term = query.trim().toLowerCase();
  if (!term) return ingredientMaster;

  return ingredientMaster.filter((item) =>
    item.searchText.includes(term)
  );
}

// 📂 Categories helper
export const ingredientCategories = Array.from(
  new Set(ingredientMaster.map((item) => item.category))
).sort();