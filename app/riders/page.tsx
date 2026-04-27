"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type Rider = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  vehicleType?: string;
  serviceArea?: string;
  postcode?: string;
  availability?: string;
  openingHours?: string;
  notes?: string;
};

const riderPhotos = [
  "/hubs/riders/1.jpg",
  "/hubs/riders/2.jpg",
  "/hubs/riders/3.jpg",
  "/hubs/riders/4.jpg",
  "/hubs/riders/5.jpg",
  "/hubs/riders/6.jpg",
];

export default function RidersPage() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [postcode, setPostcode] = useState("");
  const [availability, setAvailability] = useState("");
  const [openingHours, setOpeningHours] = useState("");
  const [notes, setNotes] = useState("");

  function showSavedMessage(message: string) {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 2000);
  }

  async function reloadRiders() {
    const snap = await getDocs(collection(db, "riders"));
    const list: Rider[] = snap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<Rider, "id">),
    }));
    setRiders(list);
  }

  async function handleSaveRider() {
    try {
      setSaving(true);

      if (!name.trim()) {
        alert("Please enter rider name");
        return;
      }

      await addDoc(collection(db, "riders"), {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        vehicleType: vehicleType.trim(),
        serviceArea: serviceArea.trim(),
        postcode: postcode.trim(),
        availability: availability.trim(),
        openingHours: openingHours.trim(),
        notes: notes.trim(),
        createdAt: new Date(),
      });

      setName("");
      setPhone("");
      setEmail("");
      setVehicleType("");
      setServiceArea("");
      setPostcode("");
      setAvailability("");
      setOpeningHours("");
      setNotes("");
      setShowForm(false);

      await reloadRiders();
      showSavedMessage("Rider added successfully");
    } catch (err) {
      console.error("Error saving rider", err);
      showSavedMessage("Error saving rider");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateRider(rider: Rider) {
    try {
      await updateDoc(doc(db, "riders", rider.id), {
        name: (rider.name || "").trim(),
        phone: (rider.phone || "").trim(),
        email: (rider.email || "").trim(),
        vehicleType: (rider.vehicleType || "").trim(),
        serviceArea: (rider.serviceArea || "").trim(),
        postcode: (rider.postcode || "").trim(),
        availability: (rider.availability || "").trim(),
        openingHours: (rider.openingHours || "").trim(),
        notes: (rider.notes || "").trim(),
      });

      setEditingId(null);
      showSavedMessage("Rider updated");
    } catch (err) {
      console.error("Error updating rider", err);
      alert("Failed to update rider");
    }
  }

  async function handleDeleteRider(id: string) {
    const ok = window.confirm("Delete this rider?");
    if (!ok) return;

    await deleteDoc(doc(db, "riders", id));
    setRiders((prev) => prev.filter((r) => r.id !== id));
  }

  useEffect(() => {
    async function load() {
      try {
        await reloadRiders();
      } catch (err) {
        console.error("Error loading riders", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const filteredRiders = riders
    .filter((r) => {
      const q = searchTerm.toLowerCase();

      return (
        r.name?.toLowerCase().includes(q) ||
        r.phone?.toLowerCase().includes(q) ||
        r.vehicleType?.toLowerCase().includes(q) ||
        r.serviceArea?.toLowerCase().includes(q) ||
        r.postcode?.toLowerCase().includes(q) ||
        r.availability?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-lg font-semibold">Loading riders…</div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl p-6 pt-20">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Riders / Delivery Network</h1>

        <div className="flex gap-2">
          <Link
            href="/suppliers"
            className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white"
          >
            🏪 Suppliers
          </Link>

          <Link
            href="/riders"
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
          >
            🛵 Riders
          </Link>
        </div>
      </div>

      <div className="mb-6 overflow-hidden rounded-2xl border bg-white shadow">
        <img
          src="/hubs/riders/hero.jpg"
          alt="Riders"
          className="h-64 w-full object-cover"
        />

        <div className="p-4">
          <h2 className="text-lg font-semibold">Local Delivery Riders</h2>
          <p className="text-sm text-gray-600">
            Fast, flexible, and local delivery riders supporting restaurants,
            suppliers, and catering orders.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
            {riderPhotos.map((src, i) => (
              <img
                key={src}
                src={src}
                alt={`Rider ${i + 1}`}
                className="h-40 w-full rounded-xl object-cover"
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
          type="button"
          onClick={() => setShowForm((prev) => !prev)}
          className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
        >
          {showForm ? "Close Rider Form" : "+ Add Rider"}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 grid gap-3 rounded-xl border border-neutral-200 bg-white p-4 md:grid-cols-2">
          <input className="rounded border px-3 py-2" placeholder="Rider Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="rounded border px-3 py-2" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <input className="rounded border px-3 py-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="rounded border px-3 py-2" placeholder="Vehicle Type e.g. Bike / Car / Scooter" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} />
          <input className="rounded border px-3 py-2" placeholder="Service Area" value={serviceArea} onChange={(e) => setServiceArea(e.target.value)} />
          <input className="rounded border px-3 py-2" placeholder="Postcode" value={postcode} onChange={(e) => setPostcode(e.target.value)} />
          <input className="rounded border px-3 py-2" placeholder="Availability e.g. Weekends / Evening / Full-time" value={availability} onChange={(e) => setAvailability(e.target.value)} />
          <input className="rounded border px-3 py-2" placeholder="Opening / Working Hours" value={openingHours} onChange={(e) => setOpeningHours(e.target.value)} />
          <textarea className="rounded border px-3 py-2 md:col-span-2" placeholder="Notes / Services" value={notes} onChange={(e) => setNotes(e.target.value)} />

          <button
            type="button"
            onClick={handleSaveRider}
            disabled={saving}
            className="rounded bg-orange-600 px-4 py-2 text-white disabled:opacity-50 md:col-span-2"
          >
            {saving ? "Saving..." : "Save Rider"}
          </button>
        </div>
      )}

      <input
        className="mb-6 w-full rounded border px-3 py-2"
        placeholder="Search riders by name, phone, vehicle, area, postcode, or availability"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="space-y-3">
        {filteredRiders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-6 text-sm text-neutral-500">
            No riders found yet.
          </div>
        ) : (
          filteredRiders.map((rider) => (
            <div
              key={rider.id}
              className={`rounded-xl border p-4 ${
                editingId === rider.id
                  ? "border-orange-400 bg-orange-50"
                  : "border-neutral-200 bg-white"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{rider.name}</div>
                  <div className="text-sm text-neutral-600">
                    Vehicle: {rider.vehicleType || "Not set"}
                  </div>
                  <div className="text-sm text-neutral-500">
                    Phone: {rider.phone || "No phone"}
                  </div>
                  <div className="text-sm text-neutral-500">
                    Email: {rider.email || "No email"}
                  </div>
                  <div className="text-sm text-neutral-500">
                    Area: {rider.serviceArea || "Not set"}
                  </div>
                  <div className="text-sm text-neutral-500">
                    Postcode: {rider.postcode || "Not set"}
                  </div>
                  <div className="text-sm text-neutral-500">
                    Availability: {rider.availability || "Not set"}
                  </div>
                  <div className="text-sm text-neutral-500">
                    Working Hours: {rider.openingHours || "Not set"}
                  </div>
                  {rider.notes && (
                    <div className="mt-2 text-sm text-neutral-600">
                      {rider.notes}
                    </div>
                  )}
                </div>
              </div>

              {editingId === rider.id && (
                <div className="mt-3 grid gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3 md:grid-cols-2">
                  {(
                    [
                      "name",
                      "phone",
                      "email",
                      "vehicleType",
                      "serviceArea",
                      "postcode",
                      "availability",
                      "openingHours",
                      "notes",
                    ] as const
                  ).map((field) => (
                    <input
                      key={field}
                      className="w-full rounded border px-2 py-1 text-sm"
                      placeholder={field}
                      value={(rider as any)[field] || ""}
                      onChange={(e) =>
                        setRiders((prev) =>
                          prev.map((item) =>
                            item.id === rider.id
                              ? { ...item, [field]: e.target.value }
                              : item
                          )
                        )
                      }
                    />
                  ))}

                  <div className="flex justify-end gap-3 md:col-span-2">
                    <button
                      className="text-sm text-neutral-600 hover:underline"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </button>

                    <button
                      className="text-sm text-green-600 hover:underline"
                      onClick={() => handleUpdateRider(rider)}
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-3 flex justify-end gap-3">
                <button
                  className="text-sm text-blue-600 hover:underline disabled:text-neutral-400"
                  onClick={() => setEditingId(rider.id)}
                  disabled={editingId !== null && editingId !== rider.id}
                >
                  Edit
                </button>

                <button
                  className="text-sm text-red-600 hover:underline"
                  onClick={() => handleDeleteRider(rider.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}