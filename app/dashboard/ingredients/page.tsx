"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { onAuthStateChanged } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

type Unit =
  | "kg"
  | "g"
  | "litre"
  | "ml"
  | "piece"
  | "packet"
  | "bunch"
  | "tray";

const UNIT_LABEL_EN: Record<Unit, string> = {
  kg: "kg",
  g: "g",
  litre: "litre",
  ml: "ml",
  piece: "piece",
  packet: "packet",
  bunch: "bunch",
  tray: "tray",
};

const UNIT_LABEL_BN: Record<Unit, string> = {
  kg: "কেজি",
  g: "গ্রাম",
  litre: "লিটার",
  ml: "মিলি",
  piece: "পিস",
  packet: "প্যাকেট",
  bunch: "গুচ্ছ",
  tray: "ট্রে",
};

type Ingredient = {
  id: string;
  bossUid: string;

  nameEn: string;
  nameBn: string;

  defaultUnit: Unit;
  unitCost: number;

  isActive: boolean;

  createdAt?: any;
  updatedAt?: any;
  createdByUid?: string;
  updatedByUid?: string;
};

function safeNum(n: any) {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

export default function IngredientsPage() {
  const router = useRouter();

  const [uid, setUid] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [items, setItems] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);

  // form
  const [nameEn, setNameEn] = useState("");
  const [nameBn, setNameBn] = useState("");
  const [defaultUnit, setDefaultUnit] = useState<Unit>("kg");
  const [unitCost, setUnitCost] = useState<string>("");
  const [supplierPrices, setSupplierPrices] = useState<Record<string, number>>(
    {}
  );

  // edit
  const [editingId, setEditingId] = useState<string | null>(null);

  // search
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return items;

    return items.filter((it) => {
      return (
        it.nameEn.toLowerCase().includes(s) ||
        it.nameBn.toLowerCase().includes(s) ||
        it.defaultUnit.toLowerCase().includes(s)
      );
    });
  }, [items, search]);

  function resetForm() {
    setNameEn("");
    setNameBn("");
    setDefaultUnit("kg");
    setUnitCost("");
    setEditingId(null);
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setLoadingAuth(false);

      if (!user) {
        router.push("/login");
        return;
      }

      setUid(user.uid);
    });

    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!uid) return;

    setLoading(true);

    const q = query(
      collection(db, "ingredients"),
      where("bossUid", "==", uid),
      orderBy("nameEn", "asc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows: Ingredient[] = snap.docs.map((d) => {
          const data = d.data() as any;

          return {
            id: d.id,
            bossUid: data.bossUid,
            nameEn: data.nameEn ?? "",
            nameBn: data.nameBn ?? "",
            defaultUnit: (data.defaultUnit ?? "kg") as Unit,
            unitCost: safeNum(data.unitCost),
            isActive: data.isActive !== false,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            createdByUid: data.createdByUid,
            updatedByUid: data.updatedByUid,
          };
        });

        setItems(rows);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [uid]);

  async function saveIngredient() {
    if (!uid) return;

    const en = nameEn.trim();
    const bn = nameBn.trim();
    const cost = safeNum(unitCost);

    if (!en && !bn) {
  alert("Please enter a name.");
  return;
}

    const finalEn = en || bn;
    const finalBn = bn || en;

    try {
      if (editingId) {
        await updateDoc(doc(db, "ingredients", editingId), {
          nameEn: finalEn,
          nameBn: finalBn,
          defaultUnit,
          unitCost: cost,
          updatedAt: serverTimestamp(),
          updatedByUid: uid,
        });
      } else {
        await addDoc(collection(db, "ingredients"), {
          bossUid: uid,
          nameEn: finalEn,
          nameBn: finalBn,
          defaultUnit,
          unitCost: cost,
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdByUid: uid,
          updatedByUid: uid,
        });
      }

      resetForm();
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "Failed to save ingredient.");
    }
  }

  function startEdit(it: Ingredient) {
    setEditingId(it.id);
    setNameEn(it.nameEn ?? "");
    setNameBn(it.nameBn ?? "");
    setDefaultUnit(it.defaultUnit ?? "kg");
    setUnitCost(String(it.unitCost ?? 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function removeIngredient(it: Ingredient) {
    const ok = confirm(`Delete ingredient?\n\n${it.nameEn} / ${it.nameBn}`);
    if (!ok) return;

    try {
      await deleteDoc(doc(db, "ingredients", it.id));
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "Failed to delete ingredient.");
    }
  }

  if (loadingAuth) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="rounded-2xl border bg-white p-6">Loading…</div>
      </div>
    );
  }

  const supplierTotals: Record<string, number> = {};

  filtered.forEach((item) => {
    const qty = 1;

    Object.entries(supplierPrices || {}).forEach(([key, value]) => {
      const price = Number(value || 0);
      const [ingredientKey, supplierName] = key.split("__");

      if (ingredientKey === item.id && price > 0) {
        if (!supplierTotals[supplierName]) {
          supplierTotals[supplierName] = 0;
        }

        supplierTotals[supplierName] += qty * price;
      }
    });
  });

  const cheapestSupplier = Object.entries(supplierTotals).sort(
    (a, b) => a[1] - b[1]
  )[0]?.[0];

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">🧂 Ingredients</h1>
          <p className="text-sm text-neutral-600">
            Master ingredient list (editable). Recipes will reference these.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Add / Edit Form */}
      <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {editingId ? "Edit Ingredient" : "Add Ingredient"}
          </h2>

          {editingId ? (
            <button
              onClick={resetForm}
              className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm"
            >
              Cancel edit
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Name (English)
            </label>
            <input
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="e.g., Onion"
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Name (বাংলা)
            </label>
            <input
              value={nameBn}
              onChange={(e) => setNameBn(e.target.value)}
              placeholder="যেমন: পেঁয়াজ"
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Default Unit</label>
            <select
              value={defaultUnit}
              onChange={(e) => setDefaultUnit(e.target.value as Unit)}
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm"
            >
              {(Object.keys(UNIT_LABEL_EN) as Unit[]).map((u) => (
                <option key={u} value={u}>
                  {UNIT_LABEL_EN[u]} / {UNIT_LABEL_BN[u]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Unit Cost (number)
            </label>
            <input
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              placeholder="e.g., 120"
              inputMode="decimal"
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm"
            />
            <p className="mt-1 text-xs text-neutral-500">
              Currency follows your market (UK=GBP, BD=BDT). We’ll display
              currency later.
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={saveIngredient}
            className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white"
          >
            {editingId ? "Save changes" : "Add ingredient"}
          </button>

          <button
            onClick={resetForm}
            className="rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Search + List */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold">Ingredient List</h3>
            <p className="text-sm text-neutral-600">
              Total: {items.length} • Showing: {filtered.length}
            </p>
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or unit…"
            className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm md:max-w-sm"
          />
        </div>

        {loading ? (
          <div className="rounded-xl border border-neutral-200 p-4 text-sm text-neutral-600">
            Loading ingredients…
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 p-4 text-sm text-neutral-600">
            No ingredients found.
          </div>
        ) : (
          <div className="divide-y divide-neutral-200">
            {Object.values(
  filtered.reduce<Record<string, Ingredient>>((acc, it) => {
    const key = (it.nameEn || it.nameBn || "").trim().toLowerCase();

    if (!key) return acc;
    if (!acc[key]) acc[key] = it;

    return acc;
  }, {})
).map((it) => (
              <div
                key={it.id}
                className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="font-medium">
                    {it.nameEn}{" "}
                    <span className="text-neutral-500">/ {it.nameBn}</span>
                  </div>

                  <div className="text-sm text-neutral-600">
                    Unit: {UNIT_LABEL_EN[it.defaultUnit]} (
                    {UNIT_LABEL_BN[it.defaultUnit]}) • Cost: {it.unitCost}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEdit(it)}
                    className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => removeIngredient(it)}
                    className="rounded-xl border border-red-300 bg-white px-4 py-2 text-sm text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Supplier Total Comparison */}
      <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="mb-2 text-lg font-semibold">
          Supplier Total Comparison
        </div>

        <p className="mb-3 text-sm text-neutral-600">
          This is a temporary summary block. Detailed supplier comparison will be
          moved to the supplier comparison page.
        </p>

        {Object.entries(supplierTotals).length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-200 p-4 text-sm text-neutral-500">
            No supplier data yet.
          </div>
        ) : (
          <div className="space-y-2">
            {Object.entries(supplierTotals).map(([name, total]) => (
              <div
                key={name}
                className={`flex justify-between rounded-xl px-3 py-2 ${
                  name === cheapestSupplier ? "bg-green-100 font-semibold" : "bg-neutral-50"
                }`}
              >
                <span>{name}</span>
                <span>£{total.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 text-xs text-neutral-500">
        Note: This page stores ingredients in <code>ingredients</code> collection
        filtered by your user ID (bossUid). Later, we can migrate to{" "}
        <code>restaurants/&lt;id&gt;/ingredients</code> when we add restaurant
        profiles.
      </div>
    </div>
  );
}