"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { StaffRole } from "@/lib/staff";

type StaffOption = {
  id: string;
  name: string;
  role: StaffRole;
  hourlyRate: number;
};

const SAMPLE_STAFF: StaffOption[] = [
  { id: "1", name: "Rahim", role: "chef", hourlyRate: 12 },
  { id: "2", name: "Karim", role: "waiter", hourlyRate: 11 },
  { id: "3", name: "Rafi", role: "driver", hourlyRate: 11.5 },
  { id: "4", name: "Suma", role: "manager", hourlyRate: 14 },
];

function roleLabel(role: StaffRole) {
  switch (role) {
    case "chef":
      return "Chef";
    case "assistant_chef":
      return "Assistant Chef";
    case "waiter":
      return "Waiter";
    case "manager":
      return "Manager";
    case "cashier":
      return "Cashier";
    case "cleaner":
      return "Cleaner";
    case "driver":
      return "Driver";
    case "packer":
      return "Packer";
    default:
      return role;
  }
}

function calculateHours(startTime: string, endTime: string, breakMinutes: number) {
  if (!startTime || !endTime) return 0;

  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);

  if (
    Number.isNaN(startH) ||
    Number.isNaN(startM) ||
    Number.isNaN(endH) ||
    Number.isNaN(endM)
  ) {
    return 0;
  }

  const startTotal = startH * 60 + startM;
  const endTotal = endH * 60 + endM;
  const raw = endTotal - startTotal - Number(breakMinutes || 0);

  if (raw <= 0) return 0;
  return raw / 60;
}

export default function StaffShiftsPage() {
  const [staffId, setStaffId] = useState(SAMPLE_STAFF[0]?.id || "");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("18:00");
  const [breakMinutes, setBreakMinutes] = useState(30);
  const [notes, setNotes] = useState("");

  const selectedStaff = useMemo(
    () => SAMPLE_STAFF.find((s) => s.id === staffId),
    [staffId]
  );

  const totalHours = useMemo(
    () => calculateHours(startTime, endTime, breakMinutes),
    [startTime, endTime, breakMinutes]
  );

  const estimatedCost = useMemo(() => {
    const rate = Number(selectedStaff?.hourlyRate || 0);
    return totalHours * rate;
  }, [selectedStaff, totalHours]);

  return (
    <main className="min-h-screen bg-neutral-50 p-4 md:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Assign Shift</h1>
              <p className="mt-1 text-sm text-neutral-600">
                Assign staff to a working day and preview labour cost before saving.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/staff"
                className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
              >
                Back to Staff
              </Link>
              <Link
                href="/staff/today"
                className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
              >
                View Today
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm xl:col-span-2">
            <h2 className="text-lg font-bold text-neutral-900">Shift Details</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Select staff, assign timing, and keep the notes clean for operations.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                  Staff Member
                </label>
                <select
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-emerald-500"
                >
                  {SAMPLE_STAFF.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name} — {roleLabel(staff.role)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                  Start Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                  End Time
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                  Break Minutes
                </label>
                <input
                  type="number"
                  min={0}
                  value={breakMinutes}
                  onChange={(e) => setBreakMinutes(Number(e.target.value || 0))}
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                  Hourly Rate (£)
                </label>
                <input
                  value={Number(selectedStaff?.hourlyRate || 0).toFixed(2)}
                  readOnly
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-700"
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
                  placeholder="Example: Friday dinner rush, delivery peak, prep support"
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Save Shift
              </button>

              <button
                type="button"
                className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
              >
                Clear Form
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-neutral-900">Shift Preview</h2>

              <div className="mt-4 space-y-3 text-sm">
                <div className="rounded-xl bg-neutral-50 p-3">
                  <div className="text-neutral-500">Staff</div>
                  <div className="mt-1 font-semibold text-neutral-900">
                    {selectedStaff?.name || "-"}
                  </div>
                </div>

                <div className="rounded-xl bg-neutral-50 p-3">
                  <div className="text-neutral-500">Role</div>
                  <div className="mt-1 font-semibold text-neutral-900">
                    {selectedStaff ? roleLabel(selectedStaff.role) : "-"}
                  </div>
                </div>

                <div className="rounded-xl bg-neutral-50 p-3">
                  <div className="text-neutral-500">Total Hours</div>
                  <div className="mt-1 font-semibold text-neutral-900">
                    {totalHours.toFixed(2)}
                  </div>
                </div>

                <div className="rounded-xl bg-emerald-50 p-3">
                  <div className="text-emerald-700">Estimated Labour Cost</div>
                  <div className="mt-1 text-2xl font-bold text-emerald-900">
                    £{estimatedCost.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-amber-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-neutral-900">MVP Note</h2>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                For now this page is a clean UI shell with live calculation. Next step,
                we connect it to Firestore so every shift is saved into
                <span className="mx-1 rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs">
                  staff_shifts
                </span>
                and appears automatically in Today view and staff dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}