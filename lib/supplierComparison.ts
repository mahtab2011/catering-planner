export type IngredientRequirement = {
  ingredientId?: string;
  name: string;
  qty: number;
  unit: string;
  variant?: string;
};

export type SupplierProductPrice = {
  supplierName: string;
  ingredientId?: string;
  ingredientName: string;
  category?: string;
  variant?: string;
  unit: string;
  unitPrice: number;
  available?: boolean;
};

export type BestSupplierResult = {
  ingredientId?: string;
  ingredientName: string;
  category?: string;
  variant?: string;
  requiredQty: number;
  unit: string;
  bestSupplierName: string;
  bestUnitPrice: number;
  totalCost: number;
  comparedSupplierCount: number;
};

export type SupplierComparisonResult = {
  bestMix: BestSupplierResult[];
  totalBestCost: number;
  missingIngredients: IngredientRequirement[];
};

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function productMatchesRequirement(
  product: SupplierProductPrice,
  requirement: IngredientRequirement
) {
  if (requirement.ingredientId && product.ingredientId) {
    return product.ingredientId === requirement.ingredientId;
  }

  const sameName =
    normalizeText(product.ingredientName) === normalizeText(requirement.name);

  const sameVariant =
    !requirement.variant ||
    !product.variant ||
    normalizeText(product.variant) === normalizeText(requirement.variant);

  return sameName && sameVariant;
}

export function calculateBestSupplierMix(
  requirements: IngredientRequirement[],
  supplierProducts: SupplierProductPrice[]
): SupplierComparisonResult {
  const bestMix: BestSupplierResult[] = [];
  const missingIngredients: IngredientRequirement[] = [];
  let totalBestCost = 0;

  for (const requirement of requirements) {
    const matchingProducts = supplierProducts.filter(
      (product) =>
        productMatchesRequirement(product, requirement) &&
        product.unitPrice > 0 &&
        product.available !== false
    );

    if (matchingProducts.length === 0) {
      missingIngredients.push(requirement);
      continue;
    }

    const bestProduct = matchingProducts.reduce((best, current) =>
      current.unitPrice < best.unitPrice ? current : best
    );

    const totalCost = Number(requirement.qty || 0) * Number(bestProduct.unitPrice || 0);

    bestMix.push({
      ingredientId: requirement.ingredientId,
      ingredientName: requirement.name,
      category: bestProduct.category,
      variant: requirement.variant ?? bestProduct.variant,
      requiredQty: requirement.qty,
      unit: requirement.unit || bestProduct.unit,
      bestSupplierName: bestProduct.supplierName,
      bestUnitPrice: bestProduct.unitPrice,
      totalCost,
      comparedSupplierCount: matchingProducts.length,
    });

    totalBestCost += totalCost;
  }

  return {
    bestMix,
    totalBestCost,
    missingIngredients,
  };
}