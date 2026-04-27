import { ingredientMaster, IngredientMasterItem } from "@/lib/ingredients";

// 🔁 Reuse master type
export type SupplierIngredient = IngredientMasterItem;

// 🚀 Use master directly (NO duplicate normalize)
export const supplierIngredients: SupplierIngredient[] = ingredientMaster;

// 📂 Categories (for filters / dropdowns)
export const supplierIngredientCategories = Array.from(
  new Set(supplierIngredients.map((item) => item.category))
).sort();

// 🔍 Search (fast + consistent across app)
export function searchSupplierIngredients(query: string) {
  const term = query.trim().toLowerCase();

  if (!term) return supplierIngredients;

  return supplierIngredients.filter((item) =>
    item.searchText.includes(term)
  );
}