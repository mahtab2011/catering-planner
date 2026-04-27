"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import {
  calculateIngredients,
  makeIngredientId,
  type IngredientPriceMap,
} from "@/lib/cateringIngredients";
import { presetMenus } from "@/lib/presetMenus";
import { calculateDishQuantities } from "@/lib/cateringCalculator";
import { dishes } from "@/lib/dishes";
import { db } from "@/lib/firebase";

function formatDisplayQty(qty: number, unit: string) {
  if (unit === "g" && qty >= 1000) {
    return { qty: (qty / 1000).toFixed(2), unit: "kg" };
  }

  if (unit === "ml" && qty >= 1000) {
    return { qty: (qty / 1000).toFixed(2), unit: "litre" };
  }

  if (unit === "g" || unit === "ml") {
    return { qty: qty.toFixed(0), unit };
  }

  return { qty: qty.toFixed(2), unit };
}

function formatMoney(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00";
}

function getDishName(key: string) {
  for (const category of Object.values(dishes)) {
    const found = category.find((dish: any) => dish.key === key);
    if (found) return found.name;
  }

  return key;
}

function IngredientCalculatorPageContent() {
  const searchParams = useSearchParams();

  const defaultMenu = presetMenus.find((menu) => menu.key === "wedding_menu_1");

  const [guestCount, setGuestCount] = useState(10);
  const [sellingPrice, setSellingPrice] = useState(450);
  const [selectedMenuKey, setSelectedMenuKey] = useState(defaultMenu?.key || "");
  const [selectedDishes, setSelectedDishes] = useState<string[]>(
    defaultMenu?.items || []
  );

  const [ingredientPrices, setIngredientPrices] = useState<IngredientPriceMap>(
    {}
  );
  const [loadingPrices, setLoadingPrices] = useState(false);

  useEffect(() => {
    async function loadIngredientPrices() {
      try {
        setLoadingPrices(true);

        const snap = await getDocs(collection(db, "ingredients"));
        const priceMap: IngredientPriceMap = {};

        snap.docs.forEach((docSnap) => {
          const data = docSnap.data() as any;
          const name = String(data.nameEn || "").trim();

          if (!name) return;

          const id = makeIngredientId(name);

          priceMap[id] = {
            nameBn: data.nameBn || "",
            unit: data.unit || "",
            unitCost: Number(data.unitCost || data.costPerUnit || 0),
          };
        });

        setIngredientPrices(priceMap);
      } catch (error) {
        console.error("Failed to load ingredient prices:", error);
        setIngredientPrices({});
      } finally {
        setLoadingPrices(false);
      }
    }

    loadIngredientPrices();
  }, []);

  useEffect(() => {
    const guestsParam = Number(searchParams.get("guests") || 0);
    const priceParam = Number(searchParams.get("price") || 0);
    const menuParam = searchParams.get("menu");

    if (guestsParam > 0) setGuestCount(guestsParam);
    if (priceParam > 0) setSellingPrice(priceParam);

    if (menuParam) {
      const menu = presetMenus.find((item) => item.key === menuParam);

      if (menu) {
        setSelectedMenuKey(menu.key);
        setSelectedDishes(menu.items || []);
      }
    }
  }, [searchParams]);

  const safeGuestCount = guestCount > 0 ? guestCount : 0;

  function handleMenuChange(menuKey: string) {
    const menu = presetMenus.find((item) => item.key === menuKey);

    setSelectedMenuKey(menuKey);
    setSelectedDishes(menu?.items || []);
  }

  const dishQuantities = useMemo<Record<string, number>>(() => {
    return calculateDishQuantities(safeGuestCount, selectedDishes);
  }, [safeGuestCount, selectedDishes]);

  const ingredientsWithCost = useMemo(() => {
    const ingredients = calculateIngredients(
      selectedDishes,
      safeGuestCount,
      ingredientPrices
    );

    return ingredients.map((ingredient) => {
      const unitCost = Number(ingredient.unitCost || 0);
      const cost = Number(ingredient.qty || 0) * unitCost;

      return {
        ...ingredient,
        unitCost,
        cost,
      };
    });
  }, [selectedDishes, safeGuestCount, ingredientPrices]);

  const totalCost = useMemo(() => {
    return ingredientsWithCost.reduce((sum, ingredient) => {
      return sum + Number(ingredient.cost || 0);
    }, 0);
  }, [ingredientsWithCost]);

  const costPerGuest = safeGuestCount > 0 ? totalCost / safeGuestCount : 0;
  const profitPerGuest = sellingPrice - costPerGuest;
  const totalProfit = profitPerGuest * safeGuestCount;

  return (
    <div className="space-y-6 p-6 print:p-0">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-neutral-900">
          Ingredient Calculator
        </h1>
        <p className="text-sm text-neutral-600">
          Calculate ingredient quantity, total cost, per guest cost, and profit
          for your catering order.
        </p>
        {loadingPrices ? (
          <p className="text-sm font-medium text-amber-700">
            Loading saved ingredient prices...
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-neutral-500">Guests</div>
          <div className="mt-2 text-2xl font-bold text-neutral-900">
            {safeGuestCount}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-neutral-500">Ingredients</div>
          <div className="mt-2 text-2xl font-bold text-neutral-900">
            {ingredientsWithCost.length}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-neutral-500">Total Cost</div>
          <div className="mt-2 text-2xl font-bold text-neutral-900">
            ৳ {formatMoney(totalCost)}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-neutral-500">Cost Per Guest</div>
          <div className="mt-2 text-2xl font-bold text-neutral-900">
            ৳ {formatMoney(costPerGuest)}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm md:flex-row md:items-end">
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">
            Guests
          </label>
          <input
            type="number"
            min={0}
            value={guestCount}
            onChange={(e) => setGuestCount(Number(e.target.value || 0))}
            className="w-40 rounded-xl border border-neutral-300 p-2.5 outline-none focus:border-neutral-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">
            Selling Price Per Guest
          </label>
          <input
            type="number"
            min={0}
            value={sellingPrice}
            onChange={(e) => setSellingPrice(Number(e.target.value || 0))}
            className="w-48 rounded-xl border border-neutral-300 p-2.5 outline-none focus:border-neutral-500"
          />
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-neutral-900">
          Menu Selection
        </h2>

        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">
            Preset Menu
          </label>
          <select
            value={selectedMenuKey}
            onChange={(e) => handleMenuChange(e.target.value)}
            className="w-full max-w-md rounded-xl border border-neutral-300 p-2.5 outline-none focus:border-neutral-500"
          >
            {presetMenus.map((menu) => (
              <option key={menu.key} value={menu.key}>
                {menu.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <h3 className="text-base font-semibold text-neutral-900">
            Selected Dishes
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedDishes.map((dish) => (
              <span
                key={dish}
                className="rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-700"
              >
                {getDishName(dish)}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-base font-semibold text-neutral-900">
            Dish Requirements
          </h3>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Object.entries(dishQuantities).map(([dish, qty]) => (
              <div
                key={dish}
                className="rounded-xl border border-neutral-200 bg-neutral-50 p-3"
              >
                <div className="text-sm text-neutral-500">
                  {getDishName(dish)}
                </div>
                <div className="mt-1 text-lg font-semibold text-neutral-900">
                  {qty}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <table className="w-full min-w-225">
          <thead>
            <tr className="bg-neutral-100 text-sm text-neutral-700">
              <th className="p-3 text-left font-semibold">Ingredient</th>
              <th className="p-3 text-left font-semibold">বাংলা</th>
              <th className="p-3 text-right font-semibold">Quantity</th>
              <th className="p-3 text-left font-semibold">Display Unit</th>
              <th className="p-3 text-right font-semibold">Rate</th>
              <th className="p-3 text-right font-semibold">Cost</th>
            </tr>
          </thead>

          <tbody>
            {ingredientsWithCost.map((ingredient) => {
              const displayQty = formatDisplayQty(
                ingredient.qty,
                ingredient.unit
              );

              return (
                <tr key={ingredient.id} className="border-t border-neutral-200">
                  <td className="p-3 text-neutral-900">{ingredient.name}</td>
                  <td className="p-3 text-neutral-700">
                    {ingredient.bangla || "—"}
                  </td>
                  <td className="p-3 text-right text-neutral-900">
                    {displayQty.qty}
                  </td>
                  <td className="p-3 text-neutral-700">{displayQty.unit}</td>
                  <td className="p-3 text-right text-neutral-900">
                    {ingredient.unit === "pcs"
                      ? formatMoney(ingredient.unitCost)
                      : formatMoney(ingredient.unitCost * 1000)}
                  </td>
                  <td className="p-3 text-right font-medium text-neutral-900">
                    ৳ {formatMoney(ingredient.cost)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm print:shadow-none">
        <h2 className="text-xl font-semibold text-neutral-900">
          Purchase List
        </h2>

        <button
          onClick={() => window.print()}
          className="mt-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900 hover:border-neutral-400"
        >
          Print Purchase List
        </button>

        <p className="mt-1 text-sm text-neutral-600">
          Market-ready ingredient list for buying.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-175">
            <thead>
              <tr className="bg-neutral-100 text-sm text-neutral-700">
                <th className="p-3 text-left font-semibold">Ingredient</th>
                <th className="p-3 text-left font-semibold">বাংলা</th>
                <th className="p-3 text-right font-semibold">Quantity</th>
                <th className="p-3 text-left font-semibold">Unit</th>
              </tr>
            </thead>

            <tbody>
              {ingredientsWithCost.map((ingredient) => {
                const displayQty = formatDisplayQty(
                  ingredient.qty,
                  ingredient.unit
                );

                return (
                  <tr
                    key={`purchase-${ingredient.id}`}
                    className="border-t border-neutral-200"
                  >
                    <td className="p-3 text-neutral-900">{ingredient.name}</td>
                    <td className="p-3 text-neutral-700">
                      {ingredient.bangla || "—"}
                    </td>
                    <td className="p-3 text-right text-neutral-900">
                      {displayQty.qty}
                    </td>
                    <td className="p-3 text-neutral-700">{displayQty.unit}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 bg-gray-50 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">
            Cost Summary
          </h2>

          <div className="mt-4 flex justify-between text-base font-medium text-neutral-800">
            <span>Total Ingredient Cost</span>
            <span>৳ {formatMoney(totalCost)}</span>
          </div>

          <div className="mt-3 flex justify-between text-base font-medium text-neutral-800">
            <span>Cost Per Guest</span>
            <span>৳ {formatMoney(costPerGuest)}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-green-900">
            Profit Summary
          </h2>

          <div className="mt-4 flex justify-between text-base font-medium text-green-900">
            <span>Profit Per Guest</span>
            <span>৳ {formatMoney(profitPerGuest)}</span>
          </div>

          <div className="mt-3 flex justify-between text-base font-medium text-green-900">
            <span>Total Profit</span>
            <span>৳ {formatMoney(totalProfit)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}export default function IngredientCalculatorPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-neutral-600">
          Loading ingredient calculator...
        </div>
      }
    >
      <IngredientCalculatorPageContent />
    </Suspense>
  );
}