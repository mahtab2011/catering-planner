"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type Ingredient = {
  id?: string;
  nameEn: string;
  nameBn?: string;
  category?: string;
  unit?: string;
  unitCost?: number; // ✅ IMPORTANT
};

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [nameEn, setNameEn] = useState("");
  const [nameBn, setNameBn] = useState("");
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("");
  const [unitCost, setUnitCost] = useState<number>(0); // ✅ NEW
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const ingredientsRef = collection(db, "ingredients");

  async function loadIngredients() {
    try {
      setLoading(true);

      const snapshot = await getDocs(ingredientsRef);
      const list: Ingredient[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Ingredient),
      }));

      list.sort((a, b) => (a.nameEn || "").localeCompare(b.nameEn || ""));
      setIngredients(list);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadIngredients();
  }, []);

  async function addIngredient() {
    if (!nameEn.trim()) return;

    try {
      setSaving(true);

      await addDoc(ingredientsRef, {
        nameEn: nameEn.trim(),
        nameBn: nameBn.trim(),
        category: category.trim(),
        unit: unit.trim(),
        unitCost: Number(unitCost || 0), // ✅ SAVE PRICE
      });

      setNameEn("");
      setNameBn("");
      setCategory("");
      setUnit("");
      setUnitCost(0);

      await loadIngredients();
    } finally {
      setSaving(false);
    }
  }

  async function removeIngredient(id?: string) {
    if (!id) return;

    await deleteDoc(doc(db, "ingredients", id));
    await loadIngredients();
  }

  const filteredIngredients = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return ingredients;

    return ingredients.filter((ing) => {
      return (
        (ing.nameEn || "").toLowerCase().includes(q) ||
        (ing.nameBn || "").toLowerCase().includes(q) ||
        (ing.category || "").toLowerCase().includes(q) ||
        (ing.unit || "").toLowerCase().includes(q)
      );
    });
  }, [ingredients, search]);

  return (
    <div className="mx-auto w-full max-w-6xl p-4 md:p-6">
      <div className="grid gap-6">

        {/* Header */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">
                Ingredient Master
              </h1>
              <p className="text-sm text-neutral-600">
                Manage ingredient names, categories, units & prices.
              </p>
            </div>

            <button
              onClick={loadIngredients}
              className="rounded-xl border px-4 py-2 text-sm hover:bg-neutral-50"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Add Form */}
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Add Ingredient</h2>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <input
              placeholder="English name"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              className="rounded-xl border px-3 py-2"
            />

            <input
              placeholder="Bangla name"
              value={nameBn}
              onChange={(e) => setNameBn(e.target.value)}
              className="rounded-xl border px-3 py-2"
            />

            <input
              placeholder="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-xl border px-3 py-2"
            />

            <input
              placeholder="Unit (kg/g/litre/pcs)"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="rounded-xl border px-3 py-2"
            />

            {/* ✅ PRICE INPUT */}
            <input
              type="number"
              placeholder="Unit Cost"
              value={unitCost}
              onChange={(e) => setUnitCost(Number(e.target.value))}
              className="rounded-xl border px-3 py-2"
            />

            <button
              onClick={addIngredient}
              disabled={saving || !nameEn.trim()}
              className="rounded-xl bg-black px-4 py-2 text-white"
            >
              {saving ? "Adding..." : "Add"}
            </button>
          </div>
        </div>

        {/* List */}
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-semibold">
              Ingredients ({filteredIngredients.length})
            </h2>

            <input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl border px-3 py-2"
            />
          </div>

          <div className="space-y-3">
            {filteredIngredients.map((ing) => (
              <div key={ing.id} className="border p-3 rounded-xl">
                <div className="font-semibold">{ing.nameEn}</div>
                <div className="text-sm text-neutral-500">{ing.nameBn}</div>

                <div className="text-sm mt-1">
                  {ing.category} • {ing.unit}
                </div>

                {/* ✅ SHOW PRICE */}
                <div className="text-sm text-neutral-700 mt-1">
                  Cost: ৳ {Number(ing.unitCost || 0).toFixed(2)}
                </div>

                <button
                  onClick={() => removeIngredient(ing.id)}
                  className="mt-2 text-red-600 text-sm"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}