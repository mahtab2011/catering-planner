import { recipeRules, type RecipeRule } from "./recipeRules";

export function calculateDishQuantities(
  guests: number,
  selectedDishes: string[]
): Record<string, number> {
  const safeGuests = Number.isFinite(guests) && guests > 0 ? guests : 0;
  const results: Record<string, number> = {};

  if (safeGuests <= 0 || !Array.isArray(selectedDishes)) {
    return results;
  }

  for (const dishKey of selectedDishes) {
    const rule = recipeRules[dishKey] as RecipeRule | undefined;

    if (!rule) continue;

    if (
      rule.type === "piece" ||
      rule.type === "cup" ||
      rule.type === "ml" ||
      rule.type === "gram"
    ) {
      results[dishKey] = safeGuests * rule.perGuest;
      continue;
    }

    if (rule.type === "ratio") {
      results[dishKey] = Math.ceil(safeGuests / rule.perPeople) * rule.quantity;
    }
  }

  return results;
}