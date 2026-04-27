import { findDishByKey } from "@/lib/dishes";

export type IngredientUnit = "kg" | "g" | "ml" | "litre" | "pcs";

export type IngredientPriceMap = Record<
  string,
  {
    unitCost?: number;
    nameBn?: string;
    unit?: IngredientUnit | string;
  }
>;

export type CalculatedIngredient = {
  id: string;
  name: string;
  bangla: string;
  unit: IngredientUnit;
  qty: number;
  unitCost: number;
};

export function makeIngredientId(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

export function calculateIngredients(
  selectedDishes: string[],
  guestCount: number,
  ingredientPrices: IngredientPriceMap = {}
): CalculatedIngredient[] {
  const safeGuestCount =
    Number.isFinite(guestCount) && guestCount > 0 ? guestCount : 0;

  if (!Array.isArray(selectedDishes) || selectedDishes.length === 0) return [];
  if (safeGuestCount <= 0) return [];

  const result: Record<string, CalculatedIngredient> = {};

  for (const dishKey of selectedDishes) {
    const dish = findDishByKey(dishKey);

    if (!dish || !Array.isArray(dish.ingredients)) continue;

    for (const ing of dish.ingredients) {
      const id = makeIngredientId(ing.name);
      const savedIngredient = ingredientPrices[id];

      const totalQty = Number(ing.qtyPerGuest || 0) * safeGuestCount;
      const unitCost =
        typeof savedIngredient?.unitCost === "number"
          ? savedIngredient.unitCost
          : Number(ing.costPerUnit || 0);

      if (!result[id]) {
        result[id] = {
          id,
          name: ing.name,
          bangla: savedIngredient?.nameBn || ing.name,
          unit: ing.unit,
          qty: totalQty,
          unitCost,
        };
      } else {
        result[id].qty += totalQty;

        if (savedIngredient?.nameBn) {
          result[id].bangla = savedIngredient.nameBn;
        }

        if (typeof savedIngredient?.unitCost === "number") {
          result[id].unitCost = savedIngredient.unitCost;
        }
      }
    }
  }

  return Object.values(result).sort((a, b) => a.name.localeCompare(b.name));
}