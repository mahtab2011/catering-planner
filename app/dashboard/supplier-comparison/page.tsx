"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateBestSupplierMix } from "@/lib/supplierComparison";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type SupplierIngredient = {
  name: string;
  qty: number;
  unit: string;
};

export default function SupplierComparisonPage() {
  const [supplierNames, setSupplierNames] = useState([
    "Supplier 1",
    "Supplier 2",
    "Supplier 3",
    "Supplier 4",
    "Supplier 5",
  ]);

  const [ingredients, setIngredients] = useState<SupplierIngredient[]>([]);
  const [loadingIngredients, setLoadingIngredients] = useState(true);

  const [prices, setPrices] = useState<Record<string, number[]>>({});
  const [stock, setStock] = useState<Record<string, number>>({});

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setIngredients([]);
        setLoadingIngredients(false);
        return;
      }

      setLoadingIngredients(true);

      const q = query(
        collection(db, "ingredients"),
        where("bossUid", "==", user.uid)
      );

      const unsubSnap = onSnapshot(
        q,
        (snap) => {
          const rawData: SupplierIngredient[] = snap.docs
  .map((docSnap) => {
    const d = docSnap.data() as any;

    return {
      name: (d.nameEn || d.nameBn || "Unnamed Ingredient").trim(),
      qty: Number(d.qty || 0),
      unit: d.defaultUnit || "kg",
    };
  })
  .filter((x) => x.name);

const seen = new Set<string>();

const data: SupplierIngredient[] = rawData
  .filter((item) => {
    const key = `${item.name.toLowerCase()}__${item.unit.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  })
  .sort((a, b) => a.name.localeCompare(b.name));

          setIngredients(data);

          setPrices((prev) => {
            const updated = { ...prev };

            data.forEach((ing) => {
              if (!updated[ing.name]) {
                updated[ing.name] = [0, 0, 0, 0, 0];
              }
            });

            Object.keys(updated).forEach((key) => {
              if (!data.some((ing) => ing.name === key)) {
                delete updated[key];
              }
            });

            return updated;
          });

          setStock((prev) => {
            const updated = { ...prev };

            data.forEach((ing) => {
              if (updated[ing.name] === undefined) {
                updated[ing.name] = 0;
              }
            });

            Object.keys(updated).forEach((key) => {
              if (!data.some((ing) => ing.name === key)) {
                delete updated[key];
              }
            });

            return updated;
          });

          setLoadingIngredients(false);
        },
        (error) => {
          console.error("Failed to load ingredients:", error);
          setIngredients([]);
          setLoadingIngredients(false);
        }
      );

      return unsubSnap;
    });

    return () => unsubAuth();
  }, []);

  const handlePriceChange = (
    ingredient: string,
    supplierIndex: number,
    value: number
  ) => {
    setPrices((prev) => {
      const updated: Record<string, number[]> = { ...prev };
      const currentPrices = [...(updated[ingredient] || [0, 0, 0, 0, 0])];
      currentPrices[supplierIndex] = value;
      updated[ingredient] = currentPrices;
      return updated;
    });
  };

  const getMinPriceForIngredient = (ingredientName: string) => {
    const rowPrices = prices[ingredientName] || [];
    const validPrices = rowPrices.filter((p) => Number(p) > 0);
    return validPrices.length > 0 ? Math.min(...validPrices) : 0;
  };

  const result = useMemo(() => {
    return calculateBestSupplierMix(ingredients, {
      supplierNames,
      prices,
    });
  }, [ingredients, supplierNames, prices]);

  const purchasePlan = useMemo(() => {
    return ingredients.map((ing) => {
      const currentPrices = prices[ing.name] || [];
      const validPrices = currentPrices
        .map((price, index) => ({ price: Number(price || 0), index }))
        .filter((x) => x.price > 0);

      const bestOption =
        validPrices.length > 0
          ? validPrices.reduce((best, current) =>
              current.price < best.price ? current : best
            )
          : null;

      const stockQty = Number(stock[ing.name] || 0);
      const buyQty = Math.max(Number(ing.qty || 0) - stockQty, 0);

      return {
        ingredient: ing.name,
        requiredQty: Number(ing.qty || 0),
        unit: ing.unit,
        stockQty,
        buyQty,
        bestSupplierIndex: bestOption?.index ?? -1,
        bestSupplierName:
          bestOption && bestOption.index >= 0
            ? supplierNames[bestOption.index]
            : "N/A",
        bestPrice: bestOption?.price ?? 0,
        buyCost: bestOption ? buyQty * bestOption.price : 0,
      };
    });
  }, [ingredients, prices, stock, supplierNames]);

  const supplierTotals = useMemo(() => {
    return supplierNames.map((_, supplierIndex) => {
      let total = 0;

      ingredients.forEach((ing) => {
        const price = prices[ing.name]?.[supplierIndex] || 0;
        total += Number(price) * Number(ing.qty || 0);
      });

      return total;
    });
  }, [supplierNames, ingredients, prices]);

  const minTotal =
    supplierTotals.length > 0 ? Math.min(...supplierTotals) : 0;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Supplier Comparison</h1>

      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-semibold">Supplier Names</h2>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          {supplierNames.map((name, index) => (
            <input
              key={index}
              value={name}
              onChange={(e) => {
                const updated = [...supplierNames];
                updated[index] = e.target.value;
                setSupplierNames(updated);
              }}
              className="rounded-lg border border-neutral-300 p-2 text-sm"
            />
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-semibold">Ingredient Price Comparison</h2>

        {loadingIngredients ? (
          <div className="text-sm text-neutral-600">Loading ingredients…</div>
        ) : ingredients.length === 0 ? (
          <div className="text-sm text-neutral-600">
            No ingredients found. Please add ingredients first in the Ingredients
            page.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-neutral-200 text-sm">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Ingredient</th>
                    <th className="px-3 py-2 text-left">Qty</th>
                    {supplierNames.map((name, i) => (
                      <th key={i} className="px-3 py-2 text-right">
                        {name}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {ingredients.map((ing, index) => {
                    const minPrice = getMinPriceForIngredient(ing.name);

                    return (
                      <tr key={ing.name + "_" + index} className="border-t">
                        <td className="px-3 py-2 font-medium">{ing.name}</td>

                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={ing.qty === 0 ? "" : ing.qty}
                              onChange={(e) => {
                                const value = Number(e.target.value || 0);
                                setIngredients((prev) =>
                                  prev.map((item, itemIndex) =>
                                    itemIndex === index
                                      ? { ...item, qty: value }
                                      : item
                                  )
                                );
                              }}
                              className="w-20 rounded border border-neutral-300 p-1 text-right"
                            />
                            <span>{ing.unit}</span>
                          </div>
                        </td>

                        {supplierNames.map((_, i) => {
                          const price = prices[ing.name]?.[i] ?? 0;
                          const isCheapest =
                            price > 0 && minPrice > 0 && price === minPrice;

                          return (
                            <td
                              key={i}
                              className={`px-3 py-2 text-right ${
                                isCheapest ? "bg-green-100 font-semibold" : ""
                              }`}
                            >
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={price === 0 ? "" : price}
                                onChange={(e) =>
                                  handlePriceChange(
                                    ing.name,
                                    i,
                                    Number(e.target.value || 0)
                                  )
                                }
                                className="w-24 rounded border border-neutral-300 p-1 text-right"
                              />
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="mt-3 text-xs text-neutral-500">
              Lowest non-zero supplier price for each ingredient is highlighted
              in green.
            </p>
          </>
        )}
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-semibold">Stock + Auto Purchase List</h2>

        {loadingIngredients ? (
          <div className="text-sm text-neutral-600">Loading purchase plan…</div>
        ) : ingredients.length === 0 ? (
          <div className="text-sm text-neutral-600">
            No ingredients available for stock planning.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-neutral-200 text-sm">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-3 py-2 text-left">Ingredient</th>
                  <th className="px-3 py-2 text-right">Required</th>
                  <th className="px-3 py-2 text-right">Stock</th>
                  <th className="px-3 py-2 text-right">Buy</th>
                  <th className="px-3 py-2 text-left">Best Supplier</th>
                  <th className="px-3 py-2 text-right">Best Price</th>
                  <th className="px-3 py-2 text-right">Buy Cost</th>
                </tr>
              </thead>

              <tbody>
                {purchasePlan.map((item, index) => (
                  <tr
                    key={item.ingredient + "_" + index}
                    className="border-t"
                  >
                    <td className="px-3 py-2 font-medium">{item.ingredient}</td>
                    <td className="px-3 py-2 text-right">
                      {item.requiredQty} {item.unit}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.stockQty === 0 ? "" : item.stockQty}
                        onChange={(e) =>
                          setStock((prev) => ({
                            ...prev,
                            [item.ingredient]: Number(e.target.value || 0),
                          }))
                        }
                        className="w-24 rounded border border-neutral-300 p-1 text-right"
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-semibold">
                      {item.buyQty.toFixed(2)} {item.unit}
                    </td>
                    <td className="px-3 py-2">{item.bestSupplierName}</td>
                    <td className="px-3 py-2 text-right">
                      {item.bestPrice > 0
                        ? `£${item.bestPrice.toFixed(2)}`
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {item.buyCost > 0 ? `£${item.buyCost.toFixed(2)}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-semibold">Total Cost Per Supplier</h2>

        <div className="space-y-2">
          {supplierNames.map((name, i) => {
            const total = supplierTotals[i] || 0;
            const isBest = total > 0 && total === minTotal;

            return (
              <div
                key={i}
                className={`flex justify-between rounded px-3 py-2 ${
                  isBest ? "bg-green-100 font-semibold" : "bg-neutral-50"
                }`}
              >
                <span>{name}</span>
                <span>£{total.toFixed(2)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-green-200 bg-green-50 p-4 shadow-sm">
        <h2 className="mb-2 font-semibold">Best Purchase Combination</h2>

        {result.bestMix.length === 0 ? (
          <div className="text-sm text-neutral-600">
            Enter supplier prices to see the best purchase mix.
          </div>
        ) : (
          <ul className="space-y-1 text-sm">
            {result.bestMix.map((item, index) => (
              <li key={item.ingredient + "_" + index}>
                {item.ingredient} →{" "}
                {supplierNames[item.bestSupplierIndex] ?? "Unknown Supplier"} (
                £{Number(item.bestPrice).toFixed(2)}) → Cost: £
                {item.cost.toFixed(2)}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 font-semibold">
          Total Best Cost: £{result.totalBestCost.toFixed(2)}
        </div>
      </div>
    </div>
  );
}