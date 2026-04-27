"use client";

import Link from "next/link";
import { supplierIngredients } from "@/lib/supplieringredients";
import { useEffect, useRef, useState } from "react";
import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type Supplier = {
  id: string;
  name: string;
  category: string;
  phone?: string;
  email?: string;
  address?: string;
  postcode?: string;
  openingHours?: string;
  availability?: string;
  serviceArea?: string;
};

type SupplierItem = {
  ingredientId?: string;
  ingredientName: string;
  category?: string;
  variant?: string;
  supplierName: string;
  qty: number;
  unit: string;
  unitPrice: number;
};

const supplierPhotos = [
  "/hubs/suppliers/1.jpg",
  "/hubs/suppliers/2.jpg",
  "/hubs/suppliers/3.jpg",
  "/hubs/suppliers/4.jpg",
  "/hubs/suppliers/5.jpg",
  "/hubs/suppliers/6.jpg",
  "/hubs/suppliers/7.jpg",
  "/hubs/suppliers/8.jpg",
];

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [postcode, setPostcode] = useState("");
  const [openingHours, setOpeningHours] = useState("");
  const [availability, setAvailability] = useState("");
  const [serviceArea, setServiceArea] = useState("");

  const [activeSupplier, setActiveSupplier] = useState("");
  const [supplierItems, setSupplierItems] = useState<SupplierItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const itemsEndRef = useRef<HTMLDivElement | null>(null);

  const supplierTotals = supplierItems.reduce((acc, item) => {
    const supplier = item.supplierName?.trim() || "Unknown Supplier";
    const lineTotal = Number(item.qty || 0) * Number(item.unitPrice || 0);
    acc[supplier] = (acc[supplier] || 0) + lineTotal;
    return acc;
  }, {} as Record<string, number>);

  const cheapestSupplier = Object.entries(supplierTotals).length
    ? Object.entries(supplierTotals).reduce((min, curr) =>
        curr[1] < min[1] ? curr : min
      )[0]
    : null;

  const grandTotal = Object.values(supplierTotals).reduce(
    (sum, val) => sum + Number(val || 0),
    0
  );

  function showSavedMessage(message: string) {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 2000);
  }

  async function persistSupplierItems(supplierName: string, items: SupplierItem[]) {
    if (!supplierName?.trim()) return;

    await setDoc(
      doc(db, "supplier_items", supplierName),
      {
        supplierName,
        items,
        updatedAt: new Date(),
      },
      { merge: true }
    );
  }

  async function reloadSuppliers() {
    const snap = await getDocs(collection(db, "suppliers"));
    const list: Supplier[] = snap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<Supplier, "id">),
    }));
    setSuppliers(list);
  }

  async function handleSaveSupplier() {
    try {
      setSaving(true);

      if (!name.trim()) {
        alert("Please enter supplier name");
        return;
      }

      await addDoc(collection(db, "suppliers"), {
        name: name.trim(),
        category: category.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        postcode: postcode.trim(),
        openingHours: openingHours.trim(),
        availability: availability.trim(),
        serviceArea: serviceArea.trim(),
        createdAt: new Date(),
      });

      setName("");
      setCategory("");
      setPhone("");
      setEmail("");
      setAddress("");
      setPostcode("");
      setOpeningHours("");
      setAvailability("");
      setServiceArea("");
      setShowForm(false);

      await reloadSuppliers();
      showSavedMessage("Supplier added successfully");
    } catch (err) {
      console.error("Error saving supplier", err);
      showSavedMessage("Error saving supplier");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateSupplier(supplier: Supplier) {
    try {
      await updateDoc(doc(db, "suppliers", supplier.id), {
        name: (supplier.name || "").trim(),
        category: (supplier.category || "").trim(),
        phone: (supplier.phone || "").trim(),
        email: (supplier.email || "").trim(),
        address: (supplier.address || "").trim(),
        postcode: (supplier.postcode || "").trim(),
        openingHours: (supplier.openingHours || "").trim(),
        availability: (supplier.availability || "").trim(),
        serviceArea: (supplier.serviceArea || "").trim(),
      });

      setEditingId(null);
      showSavedMessage("Supplier updated");
    } catch (err) {
      console.error("Error updating supplier", err);
      alert("Failed to update supplier");
    }
  }

  async function handleDeleteSupplier(id: string) {
    try {
      const ok = window.confirm("Delete this supplier?");
      if (!ok) return;

      await deleteDoc(doc(db, "suppliers", id));
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Error deleting supplier", err);
      alert("Failed to delete supplier");
    }
  }

  async function loadSupplierItemsBySupplierName(supplierName: string) {
    if (!supplierName?.trim()) {
      setSupplierItems([]);
      return;
    }

    try {
      const snap = await getDoc(doc(db, "supplier_items", supplierName));

      if (snap.exists()) {
        const data = snap.data() as { items?: SupplierItem[] };
        setSupplierItems(Array.isArray(data.items) ? data.items : []);
      } else {
        setSupplierItems([]);
      }
    } catch (err) {
      console.error("Error loading supplier items", err);
      setSupplierItems([]);
    }
  }

  async function addSupplierItemRow() {
    if (!activeSupplier) {
      alert("Please select a supplier first");
      return;
    }

    const next = [
      ...supplierItems,
      {
        ingredientName: "",
        supplierName: activeSupplier,
        qty: 0,
        unit: "",
        unitPrice: 0,
      },
    ];

    setSupplierItems(next);
    await persistSupplierItems(activeSupplier, next);
  }

  async function handleSaveItems() {
    if (!activeSupplier?.trim()) {
      alert("Please select a supplier first");
      return;
    }

    if (supplierItems.length === 0) {
      alert("No items to save");
      return;
    }

    await persistSupplierItems(activeSupplier, supplierItems);
    await loadSupplierItemsBySupplierName(activeSupplier);
    showSavedMessage("Items saved successfully");
  }

  async function autoSaveItems(nextItems: SupplierItem[]) {
    if (!activeSupplier?.trim()) return;
    await persistSupplierItems(activeSupplier, nextItems);
  }

  function handleSupplierItemChange(
    index: number,
    field: keyof SupplierItem,
    value: string | number
  ) {
    const next = [...supplierItems];
    next[index] = {
      ...next[index],
      [field]: value,
    };

    setSupplierItems(next);
    void autoSaveItems(next);
  }
function handleIngredientSelect(index: number, ingredientId: string) {
  const selected = supplierIngredients.find((item) => item.id === ingredientId);
  if (!selected) return;

  const next = [...supplierItems];

  next[index] = {
    ...next[index],
    ingredientId: selected.id,
    ingredientName: selected.name,
    category: selected.category,
    variant: selected.variant,
    unit: selected.unit,
  };

  setSupplierItems(next);
  void autoSaveItems(next);
}
  async function handleRemoveSupplierItem(index: number) {
    const next = supplierItems.filter((_, i) => i !== index);
    setSupplierItems(next);

    if (!activeSupplier?.trim()) return;
    await persistSupplierItems(activeSupplier, next);
  }

  useEffect(() => {
    async function loadSuppliers() {
      try {
        await reloadSuppliers();

        const saved = localStorage.getItem("activeSupplier");
        if (saved) {
          setActiveSupplier(saved);
          await loadSupplierItemsBySupplierName(saved);
        }
      } catch (err) {
        console.error("Error loading suppliers", err);
      } finally {
        setLoading(false);
      }
    }

    loadSuppliers();
  }, []);

  useEffect(() => {
    if (supplierItems.length > 0) {
      itemsEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [supplierItems.length]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-lg font-semibold">Loading suppliers…</div>
      </div>
    );
  }

  const filteredSuppliers = suppliers
    .filter(
      (s) =>
        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.postcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.serviceArea?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  return (
    <div className="mx-auto w-full max-w-5xl p-6 pt-20">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Suppliers</h1>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/suppliers"
            className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white"
          >
            🏪 Suppliers
          </Link>

          <Link
            href="/riders"
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
          >
            🛵 Riders
          </Link>
        </div>
      </div>

      <div className="mb-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <img
          src="/hubs/suppliers/hero.jpg"
          alt="Supplier network"
          className="h-56 w-full object-cover"
        />

        <div className="p-4">
          <h2 className="text-lg font-semibold text-neutral-900">
            Local Supplier Network
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            Cash & carry, wholesalers, meat suppliers, fresh produce, packaging,
            and catering supply partners.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {supplierPhotos.map((src, index) => (
              <img
                key={src}
                src={src}
                alt={`Supplier ${index + 1}`}
                className="h-32 w-full rounded-xl object-cover"
              />
            ))}
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="mb-4 rounded-lg bg-green-100 px-4 py-2 text-green-800">
          {successMessage}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-3">
        <button
          onClick={addSupplierItemRow}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          + Add Item
        </button>

        <button
          onClick={handleSaveItems}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
        >
          Save Items
        </button>

        <button
          type="button"
          className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          onClick={() => setShowForm((prev) => !prev)}
        >
          {showForm ? "Close Supplier Form" : "+ Add Supplier"}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 mt-2 grid gap-3 rounded-xl border border-neutral-200 bg-white p-4 md:grid-cols-2">
          <input className="rounded border px-3 py-2" placeholder="Supplier Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="rounded border px-3 py-2" placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
          <input className="rounded border px-3 py-2" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <input className="rounded border px-3 py-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="rounded border px-3 py-2" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
          <input className="rounded border px-3 py-2" placeholder="Postcode" value={postcode} onChange={(e) => setPostcode(e.target.value)} />
          <input className="rounded border px-3 py-2" placeholder="Opening Hours" value={openingHours} onChange={(e) => setOpeningHours(e.target.value)} />
          <input className="rounded border px-3 py-2" placeholder="Availability" value={availability} onChange={(e) => setAvailability(e.target.value)} />
          <input className="rounded border px-3 py-2 md:col-span-2" placeholder="Service Area" value={serviceArea} onChange={(e) => setServiceArea(e.target.value)} />

          <button
            className="rounded bg-green-600 px-4 py-2 text-white disabled:opacity-50 md:col-span-2"
            onClick={handleSaveSupplier}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Supplier"}
          </button>
        </div>
      )}

      <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-800">
        Active supplier: {activeSupplier || "None selected"}
      </div>

      <input
        className="mb-6 w-full rounded border px-3 py-2"
        placeholder="Search suppliers by name, category, postcode, or area"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="mb-2 mt-6 text-lg font-semibold text-neutral-800">
        Supplier Items / Products
      </div>

      <div className="mt-4 space-y-3">
        {supplierItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-6 text-sm text-neutral-500">
            No supplier items yet. Select a supplier and click + Add Item.
          </div>
        ) : (
          supplierItems.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-1 gap-3 rounded-xl border border-neutral-200 bg-white p-3 md:grid-cols-6"
            >
              <div>
  <input
    list={`supplier-ingredients-${index}`}
    type="text"
    placeholder="Search product / ingredient"
    value={item.ingredientName}
    onChange={(e) => {
      const value = e.target.value;
      const selected = supplierIngredients.find(
        (ingredient) =>
          `${ingredient.name} — ${ingredient.variant} — ${ingredient.category}` === value
      );

      if (selected) {
        handleIngredientSelect(index, selected.id);
      } else {
        handleSupplierItemChange(index, "ingredientName", value);
      }
    }}
    className="w-full rounded border px-3 py-2"
  />

  <datalist id={`supplier-ingredients-${index}`}>
    {supplierIngredients.map((ingredient) => (
      <option
        key={ingredient.id}
        value={`${ingredient.name} — ${ingredient.variant} — ${ingredient.category}`}
      />
    ))}
  </datalist>

  {item.category ? (
    <div className="mt-1 text-xs text-neutral-500">
      {item.category}
      {item.variant ? ` • ${item.variant}` : ""}
    </div>
  ) : null}
</div>
              <input type="text" value={item.supplierName} readOnly className="rounded border bg-neutral-50 px-3 py-2 text-neutral-600" />
              <input type="number" placeholder="Qty" value={item.qty} onChange={(e) => handleSupplierItemChange(index, "qty", Number(e.target.value))} className="rounded border px-3 py-2" />
              <input type="text" placeholder="Unit" value={item.unit} onChange={(e) => handleSupplierItemChange(index, "unit", e.target.value)} className="rounded border px-3 py-2" />
              <input type="number" placeholder="Unit price" value={item.unitPrice} onChange={(e) => handleSupplierItemChange(index, "unitPrice", Number(e.target.value))} className="rounded border px-3 py-2" />

              <div className="space-y-2">
                <div className="rounded border bg-neutral-50 px-3 py-2 text-sm font-semibold text-neutral-700">
                  £{(Number(item.qty || 0) * Number(item.unitPrice || 0)).toFixed(2)}
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveSupplierItem(index)}
                  className="w-full rounded bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700"
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
        <div ref={itemsEndRef} />
      </div>

      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-4">
        <div className="mb-3 text-sm font-semibold text-neutral-800">
          Supplier Totals
        </div>

        <div className="space-y-2">
          {Object.entries(supplierTotals).length === 0 ? (
            <div className="text-sm text-neutral-500">No supplier totals yet.</div>
          ) : (
            Object.entries(supplierTotals).map(([supplier, total]) => (
              <div
                key={supplier}
                className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                  supplier === cheapestSupplier
                    ? "border border-green-400 bg-green-100"
                    : "bg-neutral-50"
                }`}
              >
                <span className="text-sm text-neutral-700">{supplier}</span>
                <span className="text-sm font-semibold text-neutral-900">
                  £{Number(total || 0).toFixed(2)}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 flex items-center justify-between rounded-lg border border-neutral-300 bg-neutral-100 px-4 py-3">
          <span className="text-sm font-semibold text-neutral-800">Grand Total</span>
          <span className="text-lg font-bold text-neutral-900">£{grandTotal.toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-6">
        {filteredSuppliers.length === 0 ? (
          <div className="text-neutral-600">No supplier found.</div>
        ) : (
          <div className="space-y-3">
            {filteredSuppliers.map((s) => (
              <div
                key={s.id}
                className={`rounded-xl border p-4 ${
                  editingId === s.id ? "border-blue-400 bg-blue-50" : "border-neutral-200 bg-white"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{s.name}</div>
                    <div className="text-sm text-neutral-600">{s.category || "No category"}</div>
                    <div className="text-sm text-neutral-500">{s.phone || "No phone"}</div>
                    <div className="text-sm text-neutral-500">{s.address || "No address"}</div>
                    <div className="text-sm text-neutral-500">{s.postcode || "No postcode"}</div>
                    <div className="text-sm text-neutral-500">Opening: {s.openingHours || "Not set"}</div>
                    <div className="text-sm text-neutral-500">Availability: {s.availability || "Not set"}</div>
                    <div className="text-sm text-neutral-500">Area: {s.serviceArea || "Not set"}</div>
                  </div>

                  <button
                    className={`rounded px-3 py-1 text-xs text-white ${
                      activeSupplier === s.name ? "bg-green-600" : "bg-indigo-600"
                    }`}
                    onClick={() => {
                      setActiveSupplier(s.name);
                      localStorage.setItem("activeSupplier", s.name);
                      loadSupplierItemsBySupplierName(s.name);
                    }}
                  >
                    {activeSupplier === s.name ? "Selected" : "Select"}
                  </button>
                </div>

                {editingId === s.id && (
                  <div className="mt-3 grid gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3 md:grid-cols-2">
                    {(["name", "category", "phone", "email", "address", "postcode", "openingHours", "availability", "serviceArea"] as const).map((field) => (
                      <input
                        key={field}
                        className="w-full rounded border px-2 py-1 text-sm"
                        placeholder={field}
                        value={(s as any)[field] || ""}
                        onChange={(e) =>
                          setSuppliers((prev) =>
                            prev.map((item) =>
                              item.id === s.id ? { ...item, [field]: e.target.value } : item
                            )
                          )
                        }
                      />
                    ))}

                    <div className="flex justify-end gap-3 md:col-span-2">
                      <button className="text-sm text-neutral-600 hover:underline" onClick={() => setEditingId(null)}>
                        Cancel
                      </button>

                      <button className="text-sm text-green-600 hover:underline" onClick={() => handleUpdateSupplier(s)}>
                        Save
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-2 flex justify-end gap-3">
                  <button
                    className="text-sm text-blue-600 hover:underline disabled:text-neutral-400"
                    onClick={() => setEditingId(s.id)}
                    disabled={editingId !== null && editingId !== s.id}
                  >
                    Edit
                  </button>

                  <button
                    className="text-sm text-red-600 hover:underline"
                    onClick={() => handleDeleteSupplier(s.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}