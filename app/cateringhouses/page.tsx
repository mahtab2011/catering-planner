"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type CateringHouse = {
  id: string;
  name: string;
  managerName: string;
  phone: string;
  area: string;
  address: string;
  kitchenType: string;
  halalStatus: string;
  capacityPerDay: number;
  notes: string;
  status: "active" | "inactive";
};

export default function CateringHousesPage() {
  const [houses, setHouses] = useState<CateringHouse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [managerName, setManagerName] = useState("");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [kitchenType, setKitchenType] = useState("");
  const [halalStatus, setHalalStatus] = useState("");
  const [capacityPerDay, setCapacityPerDay] = useState<number | "">("");
  const [notes, setNotes] = useState("");

  const filteredHouses = useMemo(() => {
    return houses.filter(
      (house) =>
        house.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        house.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
        house.kitchenType.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [houses, searchTerm]);

  async function handleSaveCateringHouse() {
  try {
    if (!name.trim()) {
      alert("Please enter catering house name");
      return;
    }

    const docRef = await addDoc(collection(db, "catering_houses"), {
  name: name.trim(),
  managerName: managerName.trim(),
  phone: phone.trim(),
  area: area.trim(),
  address: address.trim(),
  kitchenType,
  halalStatus,
  capacityPerDay: Number(capacityPerDay || 0),
  notes: notes.trim(),
  status: "active",
  createdAt: new Date(),
});

setHouses((prev) => [
  ...prev,
  {
    id: docRef.id,
    name: name.trim(),
    managerName: managerName.trim(),
    phone: phone.trim(),
    area: area.trim(),
    address: address.trim(),
    kitchenType,
    halalStatus,
    capacityPerDay: Number(capacityPerDay || 0),
    notes: notes.trim(),
    status: "active",
  },
]);

    // clear form
    setName("");
    setManagerName("");
    setPhone("");
    setArea("");
    setAddress("");
    setKitchenType("");
    setHalalStatus("");
    setCapacityPerDay("");
    setNotes("");

    alert("Catering House saved");
  } catch (err) {
    console.error("Error saving catering house", err);
    alert("Failed to save catering house");
  }
}
useEffect(() => {
  async function loadCateringHouses() {
    try {
      const snap = await getDocs(collection(db, "catering_houses"));
      const list: CateringHouse[] = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<CateringHouse, "id">),
      }));
      setHouses(list);
    } catch (err) {
      console.error("Error loading catering houses", err);
    }
  }

  loadCateringHouses();
}, []);
async function handleDeleteCateringHouse(id: string) {
  try {
    const ok = window.confirm("Delete this catering house?");
    if (!ok) return;

    await deleteDoc(doc(db, "catering_houses", id));

    setHouses((prev) => prev.filter((house) => house.id !== id));
  } catch (err) {
    console.error("Error deleting catering house", err);
    alert("Failed to delete catering house");
  }
}
async function handleUpdateCateringHouse(house: CateringHouse) {
  try {
    await updateDoc(doc(db, "catering_houses", house.id), {
      name: house.name.trim(),
      managerName: house.managerName.trim(),
      phone: house.phone.trim(),
      area: house.area.trim(),
      address: house.address.trim(),
      kitchenType: house.kitchenType,
      halalStatus: house.halalStatus,
      capacityPerDay: Number(house.capacityPerDay || 0),
      notes: house.notes.trim(),
      status: house.status,
    });

    setEditingId(null);
    alert("Catering House updated");
  } catch (err) {
    console.error("Error updating catering house", err);
    alert("Failed to update catering house");
  }
}
  return (
    <div className="mx-auto w-full max-w-6xl p-6 pt-20">
      <h1 className="mb-4 text-2xl font-bold">Catering Houses</h1>

      <div className="mb-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setShowForm((prev) => !prev)}
          className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          {showForm ? "Close Catering House Form" : "+ Add Catering House"}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl border border-neutral-200 bg-white p-4 space-y-3">
          <div className="text-lg font-semibold">
            Catering House Details{" "}
            <span className="text-sm font-normal text-neutral-500">
              (to be filled by Owner, Manager, or Admin)
            </span>
          </div>

          <input
            className="w-full rounded border px-3 py-2"
            placeholder="Catering House Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            className="w-full rounded border px-3 py-2"
            placeholder="Manager Name"
            value={managerName}
            onChange={(e) => setManagerName(e.target.value)}
          />

          <input
            className="w-full rounded border px-3 py-2"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <input
            className="w-full rounded border px-3 py-2"
            placeholder="Area"
            value={area}
            onChange={(e) => setArea(e.target.value)}
          />

          <input
            className="w-full rounded border px-3 py-2"
            placeholder="Full Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <select
            className="w-full rounded border px-3 py-2"
            value={kitchenType}
            onChange={(e) => setKitchenType(e.target.value)}
          >
            <option value="">Select Kitchen Type</option>
            <option value="central-kitchen">Central Kitchen</option>
            <option value="restaurant-kitchen">Restaurant Kitchen</option>
            <option value="home-kitchen">Home Kitchen</option>
            <option value="production-unit">Production Unit</option>
            <option value="cloud-kitchen">Cloud Kitchen</option>
          </select>

          <select
            className="w-full rounded border px-3 py-2"
            value={halalStatus}
            onChange={(e) => setHalalStatus(e.target.value)}
          >
            <option value="">Select Halal Status</option>
            <option value="halal">Halal</option>
            <option value="hmc">HMC Certified</option>
            <option value="mixed">Mixed / Other</option>
          </select>

          <input
            type="number"
            className="w-full rounded border px-3 py-2"
            placeholder="Capacity Per Day"
            value={capacityPerDay}
            onChange={(e) =>
              setCapacityPerDay(e.target.value ? Number(e.target.value) : "")
            }
          />

          <textarea
            className="w-full rounded border px-3 py-2"
            placeholder="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />

          <button
  type="button"
  className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
  onClick={handleSaveCateringHouse}
>
  Save Catering House
</button>
        </div>
      )}

      <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-800">
        Manage catering production locations, kitchen capacity, and operational
        readiness from one place.
      </div>

      <input
        className="mb-6 w-full rounded border px-3 py-2"
        placeholder="Search by catering house name, area, or kitchen type"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="space-y-3">
        {filteredHouses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-6 text-sm text-neutral-500">
            No catering houses yet. Click{" "}
            <span className="font-semibold">+ Add Catering House</span> to get
            started.
          </div>
        ) : (
          filteredHouses.map((house) => (
            <div
              key={house.id}
              className="rounded-xl border border-neutral-200 bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold">{house.name}</div>
                  <div className="text-sm text-neutral-600">
                    {house.area || "No area"}
                  </div>
                  <div className="text-sm text-neutral-500">
                    {house.phone || "No phone"}
                  </div>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    house.status === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-neutral-200 text-neutral-700"
                  }`}
                >
                  {house.status}
                </span>
              </div>

              {editingId === house.id ? (
  <div className="mt-3 space-y-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
    <input
      className="w-full rounded border px-2 py-1 text-sm"
      value={house.name}
      onChange={(e) =>
        setHouses((prev) =>
          prev.map((item) =>
            item.id === house.id ? { ...item, name: e.target.value } : item
          )
        )
      }
    />

    <input
      className="w-full rounded border px-2 py-1 text-sm"
      value={house.managerName}
      onChange={(e) =>
        setHouses((prev) =>
          prev.map((item) =>
            item.id === house.id
              ? { ...item, managerName: e.target.value }
              : item
          )
        )
      }
    />

    <input
      className="w-full rounded border px-2 py-1 text-sm"
      value={house.phone}
      onChange={(e) =>
        setHouses((prev) =>
          prev.map((item) =>
            item.id === house.id ? { ...item, phone: e.target.value } : item
          )
        )
      }
    />

    <input
      className="w-full rounded border px-2 py-1 text-sm"
      value={house.area}
      onChange={(e) =>
        setHouses((prev) =>
          prev.map((item) =>
            item.id === house.id ? { ...item, area: e.target.value } : item
          )
        )
      }
    />

    <input
      className="w-full rounded border px-2 py-1 text-sm"
      value={house.address}
      onChange={(e) =>
        setHouses((prev) =>
          prev.map((item) =>
            item.id === house.id ? { ...item, address: e.target.value } : item
          )
        )
      }
    />

    <input
      className="w-full rounded border px-2 py-1 text-sm"
      value={house.kitchenType}
      onChange={(e) =>
        setHouses((prev) =>
          prev.map((item) =>
            item.id === house.id
              ? { ...item, kitchenType: e.target.value }
              : item
          )
        )
      }
    />

    <input
      className="w-full rounded border px-2 py-1 text-sm"
      value={house.halalStatus}
      onChange={(e) =>
        setHouses((prev) =>
          prev.map((item) =>
            item.id === house.id
              ? { ...item, halalStatus: e.target.value }
              : item
          )
        )
      }
    />

    <input
      type="number"
      className="w-full rounded border px-2 py-1 text-sm"
      value={house.capacityPerDay}
      onChange={(e) =>
        setHouses((prev) =>
          prev.map((item) =>
            item.id === house.id
              ? { ...item, capacityPerDay: Number(e.target.value || 0) }
              : item
          )
        )
      }
    />

    <textarea
      className="w-full rounded border px-2 py-1 text-sm"
      value={house.notes}
      onChange={(e) =>
        setHouses((prev) =>
          prev.map((item) =>
            item.id === house.id ? { ...item, notes: e.target.value } : item
          )
        )
      }
      rows={3}
    />
  </div>
) : (
  <div className="mt-3 grid gap-2 text-sm text-neutral-700 md:grid-cols-2">
    <div>
      <span className="font-semibold">Manager:</span>{" "}
      {house.managerName || "—"}
    </div>
    <div>
      <span className="font-semibold">Kitchen Type:</span>{" "}
      {house.kitchenType || "—"}
    </div>
    <div>
      <span className="font-semibold">Halal Status:</span>{" "}
      {house.halalStatus || "—"}
    </div>
    <div>
      <span className="font-semibold">Capacity/Day:</span>{" "}
      {house.capacityPerDay || 0}
    </div>
    <div className="md:col-span-2">
      <span className="font-semibold">Address:</span>{" "}
      {house.address || "—"}
    </div>
    <div className="md:col-span-2">
      <span className="font-semibold">Notes:</span>{" "}
      {house.notes || "—"}
    </div>
  </div>
)}

              <div className="mt-3 flex justify-end gap-3">
  {editingId === house.id ? (
    <>
      <button
        className="text-sm text-neutral-600 hover:underline"
        onClick={() => setEditingId(null)}
      >
        Cancel
      </button>

      <button
        className="text-sm text-green-600 hover:underline"
        onClick={() => handleUpdateCateringHouse(house)}
      >
        Save
      </button>
    </>
  ) : (
    <>
      <button
        className="text-sm text-blue-600 hover:underline"
        onClick={() => setEditingId(house.id)}
      >
        Edit
      </button>

      <button
        className="text-sm text-red-600 hover:underline"
        onClick={() => handleDeleteCateringHouse(house.id)}
      >
        Delete
      </button>
    </>
  )}
</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}