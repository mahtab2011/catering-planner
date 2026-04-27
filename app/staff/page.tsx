"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

type Staff = {
  id: string;
  name: string;
  role: string;
  hourlyRate: number;
  status: string;
  phone?: string;
};

export default function StaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStaff() {
      try {
        if (!auth.currentUser) {
          setLoading(false);
          return;
        }

        const q = query(
          collection(db, "staff"),
          where("ownerUid", "==", auth.currentUser.uid),
          orderBy("createdAt", "desc")
        );

        const snap = await getDocs(q);

        const data: Staff[] = snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Staff, "id">),
        }));

        setStaffList(data);
      } catch (error) {
        console.error("Error loading staff:", error);
      } finally {
        setLoading(false);
      }
    }

    loadStaff();
  }, []);

  async function handleDeleteStaff(id: string, name: string) {
    const ok = window.confirm(`Delete staff member "${name}"?`);

    if (!ok) return;

    try {
      await deleteDoc(doc(db, "staff", id));
      setStaffList((prev) => prev.filter((item) => item.id !== id));
      alert("Staff member deleted successfully.");
    } catch (error) {
      console.error("Error deleting staff:", error);
      alert("Failed to delete staff member.");
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 p-4 md:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between rounded-3xl border border-indigo-200 bg-white p-6 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Staff</h1>
            <p className="text-sm text-neutral-600">
              Manage your team and labour cost
            </p>
          </div>

          <Link
            href="/staff/new"
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            + Add Staff
          </Link>
        </div>

        <div className="rounded-3xl border border-indigo-200 bg-white p-6 shadow-sm">
          {loading ? (
            <p className="text-sm text-neutral-600">Loading staff...</p>
          ) : staffList.length === 0 ? (
            <div className="py-10 text-center">
              <p className="mb-3 text-neutral-600">No staff added yet</p>
              <Link
                href="/staff/new"
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Add your first staff
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {staffList.map((staff) => (
                <div
                  key={staff.id}
                  className="rounded-xl border border-neutral-200 p-4 transition hover:shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-neutral-900">
                      {staff.name}
                    </h2>

                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        staff.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {staff.status}
                    </span>
                  </div>

                  <p className="mt-1 text-sm capitalize text-neutral-600">
                    {staff.role.replace("_", " ")}
                  </p>

                  <p className="mt-2 text-sm font-medium">
                    £{staff.hourlyRate}/hour
                  </p>

                  {staff.phone && (
                    <p className="mt-1 text-xs text-neutral-500">
                      {staff.phone}
                    </p>
                  )}

                  <div className="mt-4 flex gap-2">
                    <Link
                      href={`/staff/${staff.id}/edit`}
                      className="rounded-lg border px-3 py-1 text-xs hover:bg-neutral-100"
                    >
                      Edit
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleDeleteStaff(staff.id, staff.name)}
                      className="rounded-lg border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
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
    </main>
  );
}