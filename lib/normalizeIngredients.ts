export type RawIngredient = {
  name: string;
  category: string;
  grade?: string;
  weight?: string;
  aliases?: string[];
};

export type SupplierIngredientOption = {
  id: string;
  name: string;
  category: string;
  variant: string;
  unit: string;
  aliases: string[];
  searchText: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function normalizeIngredients(
  ingredients: RawIngredient[]
): SupplierIngredientOption[] {
  return ingredients.map((item) => {
    const variant = item.grade ?? "Standard";
    const unit = item.weight ?? "Unit";
    const aliases = item.aliases ?? [];

    return {
      id: `${slugify(item.category)}-${slugify(item.name)}-${slugify(variant)}`,
      name: item.name,
      category: item.category,
      variant,
      unit,
      aliases,
      searchText: [item.name, item.category, variant, unit, ...aliases]
        .join(" ")
        .toLowerCase(),
    };
  });
}