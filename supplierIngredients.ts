import { fishIngredients } from "@/lib/ingredients/fish";
import { flourIngredients } from "@/lib/ingredients/flour";
import { meatIngredients } from "@/lib/ingredients/meat";
import { oilIngredients } from "@/lib/ingredients/oil";
import { riceIngredients } from "@/lib/ingredients/rice";
import { softDrinkIngredients } from "@/lib/ingredients/softdrinks";
import { spiceIngredients } from "@/lib/ingredients/spice";
import { vegetableIngredients } from "@/lib/ingredients/vegetable";
import { waterIngredients } from "@/lib/ingredients/water";
import { normalizeIngredients } from "@/lib/normalizeIngredients";

export const supplierIngredients = normalizeIngredients([
  ...fishIngredients,
  ...flourIngredients,
  ...meatIngredients,
  ...oilIngredients,
  ...riceIngredients,
  ...softDrinkIngredients,
  ...spiceIngredients,
  ...vegetableIngredients,
  ...waterIngredients,
]);

export const supplierIngredientCategories = Array.from(
  new Set(supplierIngredients.map((item) => item.category))
).sort();

export function searchSupplierIngredients(query: string) {
  const term = query.trim().toLowerCase();

  if (!term) return supplierIngredients;

  return supplierIngredients.filter((item) =>
    item.searchText.includes(term)
  );
}