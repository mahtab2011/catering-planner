"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
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

function safeText(value?: string) {
  return (value || "").trim();
}

function normalizeEmail(value?: string) {
  return safeText(value).toLowerCase();
}

function normalizePhone(value?: string) {
  return safeText(value).replace(/\s+/g, " ");
}

function isValidEmail(email: string) {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone: string) {
  if (!phone) return true;
  const digits = phone.replace(/[^\d]/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

export default function EditStaffPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params?.id || "");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole>("chef");
  const [hourlyRate, setHourlyRate] = useState("");
  const [status, setStatus] = useState<StaffStatus>("active");
  const [notes, setNotes] = useState("");
  const [restaurantId, setRestaurantId] = useState("");
  const [restaurantName, setRestaurantName] = useState("");

  useEffect(() => {
    async function loadStaff() {
      try {
        if (!id) {
          alert("Invalid staff ID.");
          router.push("/staff");
          return;
        }

        const snap = await getDoc(doc(db, "staff", id));

        if (!snap.exists()) {
          alert("Staff member not found.");
          router.push("/staff");
          return;
        }

        const data = snap.data() as any;

        if (auth.currentUser && data?.ownerUid && data.ownerUid !== auth.currentUser.uid) {
          alert("You do not have permission to edit this staff member.");
          router.push("/staff");
          return;
        }

        setName(data?.name || "");
        setPhone(data?.phone || "");
        setEmail(data?.email || "");
        setRole((data?.role as StaffRole) || "chef");
        setHourlyRate(
          data?.hourlyRate !== undefined && data?.hourlyRate !== null
            ? String(data.hourlyRate)
            : ""
        );
        setStatus((data?.status as StaffStatus) || "active");
        setNotes(data?.notes || "");
        setRestaurantId(data?.restaurantId || "");
        setRestaurantName(data?.restaurantName || "");
      } catch (error) {
        console.error("Error loading staff:", error);
        alert("Failed to load staff member.");
      } finally {
        setLoading(false);
      }
    }

    loadStaff();
  }, [id, router]);

  async function handleUpdateStaff(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (saving) return;

    try {
      if (!auth.currentUser) {
        alert("Please sign in first.");
        return;
      }

      if (!id) {
        alert("Invalid staff ID.");
        return;
      }

      const cleanName = safeText(name);
      const cleanPhone = normalizePhone(phone);
      const cleanEmail = normalizeEmail(email);
      const cleanRestaurantId = safeText(restaurantId);
      const cleanRestaurantName = safeText(restaurantName);
      const cleanNotes = safeText(notes);

      if (!cleanName) {
        alert("Please enter staff name.");
        return;
      }

      if (!isValidPhone(cleanPhone)) {
        alert("Please enter a valid phone number.");
        return;
      }

      if (!isValidEmail(cleanEmail)) {
        alert("Please enter a valid email address.");
        return;
      }

      const rate = Number(hourlyRate);

      if (!hourlyRate.trim() || Number.isNaN(rate) || rate <= 0) {
        alert("Please enter a valid hourly rate.");
        return;
      }

      setSaving(true);

      await updateDoc(doc(db, "staff", id), {
        restaurantId: cleanRestaurantId,
        restaurantName: cleanRestaurantName,
        name: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
        role,
        hourlyRate: rate,
        status,
        notes: cleanNotes,
        updatedAt: serverTimestamp(),
      });

      alert("Staff member updated successfully.");
      router.push("/staff");
    } catch (error) {
      console.error("Error updating staff:", error);
      alert("Failed to update staff member.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-50 p-4 md:p-6">
        <div className="mx-auto max-w-3xl rounded-3xl border border-indigo-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-neutral-600">Loading staff member...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 p-4 md:p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-3xl border border-indigo-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Edit Staff Member</h1>
              <p className="mt-1 text-sm text-neutral-600">
                Update staff profile, role, and hourly rate.
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
          onSubmit={handleUpdateStaff}
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
              {saving ? "Updating..." : "Update Staff"}
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