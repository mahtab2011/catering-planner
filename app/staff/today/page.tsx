"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { StaffRole } from "@/lib/staff";

type TodayShiftRow = {
  id: string;
  staffName: string;
  role: StaffRole;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  hourlyRate: number;
};

const TODAY_SAMPLE_SHIFTS: TodayShiftRow[] = [
  {
    id: "1",
    staffName: "Rahim",
    role: "chef",
    startTime: "10:00",
    endTime: "18:00",
    breakMinutes: 30,
    hourlyRate: 12,
  },
  {
    id: "2",
    staffName: "Karim",
    role: "waiter",
    startTime: "12:00",
    endTime: "20:00",
    breakMinutes: 30,
    hourlyRate: 11,
  },
  {
    id: "3",
    staffName: "Rafi",
    role: "driver",
    startTime: "13:00",
    endTime: "21:00",
    breakMinutes: 30,
    hourlyRate: 11.5,
  },
  {
    id: "4",
    staffName: "Suma",
    role: "manager",
    startTime: "11:00",
    endTime: "19:00",
    breakMinutes: 30,
    hourlyRate: 14,
  },
];

function calculateHours(startTime: string, endTime: string, breakMinutes: number) {
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
  const totalMinutes = endTotal - startTotal - Number(breakMinutes || 0);

  if (totalMinutes <= 0) return 0;
  return totalMinutes / 60;
}

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

export default function StaffTodayPage() {
  const kitchenTeam = useMemo(
    () =>
      TODAY_SAMPLE_SHIFTS.filter((row) =>
        ["chef", "assistant_chef", "packer", "cleaner"].includes(row.role)
      ),
    []
  );

  const serviceTeam = useMemo(
    () =>
      TODAY_SAMPLE_SHIFTS.filter((row) =>
        ["waiter", "manager", "cashier"].includes(row.role)
      ),
    []
  );

  const deliveryTeam = useMemo(
    () => TODAY_SAMPLE_SHIFTS.filter((row) => row.role === "driver"),
    []
  );

  const totalHours = useMemo(() => {
    return TODAY_SAMPLE_SHIFTS.reduce((sum, row) => {
      return sum + calculateHours(row.startTime, row.endTime, row.breakMinutes);
    }, 0);
  }, []);

  const totalCost = useMemo(() => {
    return TODAY_SAMPLE_SHIFTS.reduce((sum, row) => {
      const hours = calculateHours(row.startTime, row.endTime, row.breakMinutes);
      return sum + hours * Number(row.hourlyRate || 0);
    }, 0);
  }, []);

  const renderGroup = (title: string, rows: TodayShiftRow[], accent: string) => {
    return (
      <div className="rounded-3xl border bg-white p-5 shadow-sm">
        <div className={`text-sm font-semibold ${accent}`}>{title}</div>

        <div className="mt-4 space-y-3">
          {rows.length === 0 ? (
            <div className="rounded-xl bg-neutral-50 p-3 text-sm text-neutral-500">
              No staff assigned
            </div>
          ) : (
            rows.map((row) => {
              const hours = calculateHours(row.startTime, row.endTime, row.breakMinutes);
              const cost = hours * Number(row.hourlyRate || 0);

              return (
                <div
                  key={row.id}
                  className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="font-semibold text-neutral-900">{row.staffName}</div>
                      <div className="mt-1 text-xs text-neutral-500">
                        {roleLabel(row.role)}
                      </div>
                    </div>

                    <div className="text-sm text-neutral-600">
                      {row.startTime} - {row.endTime}
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 text-xs text-neutral-600 md:grid-cols-3">
                    <div className="rounded-lg bg-white px-3 py-2">
                      Hours: <span className="font-semibold text-neutral-900">{hours.toFixed(2)}</span>
                    </div>
                    <div className="rounded-lg bg-white px-3 py-2">
                      Rate: <span className="font-semibold text-neutral-900">£{row.hourlyRate.toFixed(2)}</span>
                    </div>
                    <div className="rounded-lg bg-white px-3 py-2">
                      Cost: <span className="font-semibold text-neutral-900">£{cost.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-neutral-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-amber-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Today’s Staff Plan</h1>
              <p className="mt-1 text-sm text-neutral-600">
                View today’s kitchen, service, and delivery teams with working cost.
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
                href="/staff/shifts"
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Add Shift
              </Link>
            </div>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="text-sm text-neutral-500">Working Today</div>
            <div className="mt-2 text-2xl font-bold text-neutral-900">
              {TODAY_SAMPLE_SHIFTS.length}
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="text-sm text-neutral-500">Kitchen + Service + Delivery</div>
            <div className="mt-2 text-2xl font-bold text-neutral-900">
              {kitchenTeam.length + serviceTeam.length + deliveryTeam.length}
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="text-sm text-neutral-500">Total Hours Today</div>
            <div className="mt-2 text-2xl font-bold text-neutral-900">
              {totalHours.toFixed(2)}
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="text-sm text-neutral-500">Total Labour Cost</div>
            <div className="mt-2 text-2xl font-bold text-neutral-900">
              £{totalCost.toFixed(2)}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          {renderGroup("Kitchen Team", kitchenTeam, "text-indigo-700")}
          {renderGroup("Service Team", serviceTeam, "text-emerald-700")}
          {renderGroup("Delivery Team", deliveryTeam, "text-amber-700")}
        </section>
      </div>
    </main>
  );
}