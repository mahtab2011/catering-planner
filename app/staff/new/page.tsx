"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { StaffRole, StaffStatus } from "@/lib/staff";

const ROLE_OPTIONS: { value: StaffRole; label: string }[] = [
  { value: "chef", label: "Chef" },
  { value: "assistant_chef", label: "Assistant Chef" },
  { value: "waiter", label: "Waiter" },
  { value: "manager", label: "Manager" },
  { value: "cashier", label: "Cashier" },
  { value: "cleaner", label: "Cleaner" },
  { value: "driver", label: "Driver" },
  { value: "packer", label: "Packer" },
];

export default function NewStaffPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole>("chef");
  const [hourlyRate, setHourlyRate] = useState("");
  const [status, setStatus] = useState<StaffStatus>("active");
  const [notes, setNotes] = useState("");
  const [restaurantId, setRestaurantId] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSaveStaff(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (saving) return;

    try {
      if (!auth.currentUser) {
        alert("Please sign in first.");
        return;
      }

      const cleanName = name.trim();
      const cleanPhone = phone.trim();
      const cleanEmail = email.trim();
      const cleanRestaurantId = restaurantId.trim();
      const cleanRestaurantName = restaurantName.trim();
      const cleanNotes = notes.trim();

      if (!cleanName || saving) {
        alert("Please enter staff name.");
        return;
      }

      const rate = Number(hourlyRate);

      if (!hourlyRate.trim() || Number.isNaN(rate) || rate <= 0) {
        alert("Please enter a valid hourly rate.");
        return;
      }

      setSaving(true);

      await addDoc(collection(db, "staff"), {
        ownerUid: auth.currentUser.uid,
        ownerEmail: auth.currentUser.email || "",
        restaurantId: cleanRestaurantId,
        restaurantName: cleanRestaurantName,
        name: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
        role,
        hourlyRate: rate,
        status,
        notes: cleanNotes,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
// reset form (optional)
setName("");
setPhone("");
setEmail("");
setHourlyRate("");
setNotes("");
setRestaurantId("");
setRestaurantName("");
setRole("chef");
setStatus("active");
      router.push("/staff?created=1");
    } catch (error) {
      console.error("Error saving staff:", error);
      alert("Failed to save staff member.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 p-4 md:p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-3xl border border-indigo-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Add Staff Member</h1>
              <p className="mt-1 text-sm text-neutral-600">
                Create a staff profile for scheduling and labour cost tracking.
              </p>
            </div>

            <Link
              href="/staff"
              className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
            >
              Back to Staff
            </Link>
          </div>
        </div>

        <form
          onSubmit={handleSaveStaff}
          className="rounded-3xl border border-indigo-200 bg-white p-6 shadow-sm"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-indigo-500"
                placeholder="Rahim"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Phone
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-indigo-500"
                placeholder="07123456789"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-indigo-500"
                placeholder="staff@example.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as StaffRole)}
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-indigo-500"
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Hourly Rate (£)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-indigo-500"
                placeholder="12"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StaffStatus)}
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-indigo-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Restaurant ID
              </label>
              <input
                value={restaurantId}
                onChange={(e) => setRestaurantId(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-indigo-500"
                placeholder="Optional for now"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Restaurant Name
              </label>
              <input
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-indigo-500"
                placeholder="Optional for now"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Notes
              </label>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-indigo-500"
                placeholder="Main biryani chef, evening shift, weekend support"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Staff"}
            </button>

            <Link
              href="/staff"
              className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}