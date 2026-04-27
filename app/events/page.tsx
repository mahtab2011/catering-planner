"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import * as XLSX from "xlsx";

import { auth, db } from "@/lib/firebase";
import StatCard from "@/components/StatCard";
import { canAccess, getCurrentAccount, isPending } from "@/lib/authGuard";

type Status =
  | "draft"
  | "procured"
  | "cooking"
  | "packed"
  | "dispatched"
  | "served"
  | "closed";

type EventItem = {
  id: string;
  bossUid?: string;
  clientName?: string;
  eventType?: string;
  venue?: string;
  menuName?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  allDay?: boolean;
  guests?: number;
  status?: Status;
  totalRevenue?: number;
  totalCost?: number;
  profit?: number;
  advancePaid?: number;
  paidNow?: number;
  paidTotal?: number;
  balanceDue?: number;
  paymentStatus?: "unpaid" | "partial" | "paid";
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
};

type GuardAccount = {
  role: string | null;
  status: string | null;
};

const STATUS_LABEL_BN: Record<Status, string> = {
  draft: "খসড়া",
  procured: "মাল আনা হয়েছে",
  cooking: "রান্না চলছে",
  packed: "প্যাক করা হয়েছে",
  dispatched: "পাঠানো হয়েছে",
  served: "পরিবেশন সম্পন্ন",
  closed: "বন্ধ",
};

const STATUS_LABEL_EN: Record<Status, string> = {
  draft: "Draft",
  procured: "Procured",
  cooking: "Cooking",
  packed: "Packed",
  dispatched: "Dispatched",
  served: "Served",
  closed: "Closed",
};

const STATUS_OPTIONS: { value: "all" | Status; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "procured", label: "Procured" },
  { value: "cooking", label: "Cooking" },
  { value: "packed", label: "Packed" },
  { value: "dispatched", label: "Dispatched" },
  { value: "served", label: "Served" },
  { value: "closed", label: "Closed" },
];

function money(value?: number) {
  return `£${Number(value ?? 0).toFixed(2)}`;
}

function formatDateText(value?: string) {
  if (!value) return "No date";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusBadgeClass(status?: Status) {
  switch (status) {
    case "draft":
      return "bg-slate-100 text-slate-700 border-slate-200";
    case "procured":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "cooking":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "packed":
      return "bg-sky-100 text-sky-800 border-sky-200";
    case "dispatched":
      return "bg-violet-100 text-violet-800 border-violet-200";
    case "served":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "closed":
      return "bg-neutral-200 text-neutral-800 border-neutral-300";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function getRedirectPath(account: GuardAccount | null) {
  if (!account?.role) return "/create-account";

  if (account.role === "restaurant") {
    if (isPending(account)) return "/signup/restaurant/pending";
    return "/restaurants";
  }

  if (account.role === "supplier") return "/suppliers";
  if (account.role === "customer") return "/";
  if (account.role === "rider") return "/rider";

  if (account.role === "catering_house") {
    if (isPending(account)) return "/signup/catering-house/success";
    return "/events";
  }

  if (account.role === "blackcab_partner") {
    if (isPending(account)) return "/signup/blackcab/pending";
    return "/blackcab";
  }

  if (account.role === "staff") return "/admin";

  return "/";
}

export default function EventsPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setCheckingAuth(false);
        setLoading(false);
        router.replace("/login");
        return;
      }

      try {
        const account = await getCurrentAccount();

        if (!account) {
          setCheckingAuth(false);
          setLoading(false);
          router.replace("/create-account");
          return;
        }

        if (!canAccess(account, ["catering_house"])) {
          setCheckingAuth(false);
          setLoading(false);
          router.replace(getRedirectPath(account));
          return;
        }

        if (isPending(account)) {
          setCheckingAuth(false);
          setLoading(false);
          router.replace(getRedirectPath(account));
          return;
        }

        setCheckingAuth(false);
        await loadEvents(currentUser.uid);
      } catch (err) {
        console.error("Auth guard failed on events page:", err);
        setError("Could not verify your account access right now.");
        setCheckingAuth(false);
        setLoading(false);
      }
    });

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function loadEvents(uid: string) {
    try {
      setLoading(true);
      setError("");

      const ref = collection(db, "events");

      const q = query(
        ref,
        where("bossUid", "==", uid),
        orderBy("date", "desc")
      );

      const snap = await getDocs(q);

      const rows: EventItem[] = snap.docs.map((d) => {
        const data = d.data() as Omit<EventItem, "id">;
        return {
          ...data,
          id: d.id,
        };
      });

      setEvents(rows);
    } catch (err) {
      console.error("Failed to load events:", err);
      setError(
        "Could not load your events. If needed, create the Firestore index for bossUid + date."
      );
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!user?.uid) return;

    const ok = window.confirm(
      "Are you sure you want to delete this event? This action cannot be undone."
    );
    if (!ok) return;

    try {
      setDeletingId(id);
      await deleteDoc(doc(db, "events", id));
      setEvents((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete event.");
    } finally {
      setDeletingId(null);
    }
  }

  function handleExport() {
    const exportRows = filteredEvents.map((item, index) => ({
      SL: index + 1,
      Client: item.clientName ?? "",
      EventType: item.eventType ?? "",
      Venue: item.venue ?? "",
      Menu: item.menuName ?? "",
      Date: item.date ?? "",
      StartTime: item.startTime ?? "",
      EndTime: item.endTime ?? "",
      Guests: Number(item.guests ?? 0),
      Status: item.status ? STATUS_LABEL_EN[item.status] : "",
      Revenue: Number(item.totalRevenue ?? 0),
      Cost: Number(item.totalCost ?? 0),
      Profit: Number(item.profit ?? 0),
      AdvancePaid: Number(item.advancePaid ?? 0),
      PaidNow: Number(item.paidNow ?? 0),
      PaidTotal: Number(item.paidTotal ?? 0),
      BalanceDue: Number(item.balanceDue ?? 0),
      PaymentStatus: item.paymentStatus ?? "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Events");
    XLSX.writeFile(wb, "smartserveuk-events.xlsx");
  }

  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();

    return events.filter((item) => {
      const matchesStatus =
        statusFilter === "all" ? true : item.status === statusFilter;

      const haystack = [
        item.clientName,
        item.eventType,
        item.venue,
        item.menuName,
        item.date,
        item.status,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = q ? haystack.includes(q) : true;

      return matchesStatus && matchesSearch;
    });
  }, [events, search, statusFilter]);

  const stats = useMemo(() => {
    const totalEvents = filteredEvents.length;
    const totalRevenue = filteredEvents.reduce(
      (sum, item) => sum + Number(item.totalRevenue ?? 0),
      0
    );
    const totalCost = filteredEvents.reduce(
      (sum, item) => sum + Number(item.totalCost ?? 0),
      0
    );
    const totalProfit = filteredEvents.reduce(
      (sum, item) => sum + Number(item.profit ?? 0),
      0
    );
    const totalBalance = filteredEvents.reduce(
      (sum, item) => sum + Number(item.balanceDue ?? 0),
      0
    );

    return {
      totalEvents,
      totalRevenue,
      totalCost,
      totalProfit,
      totalBalance,
    };
  }, [filteredEvents]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
            Checking access...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800 shadow-sm">
            You must log in first.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-sky-100 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-wide text-sky-700">
              Catering Planner
            </div>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              Event Management
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              View, search, export, and manage only your own events securely.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/events/new"
              className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              + New Event
            </Link>

            <button
              onClick={handleExport}
              disabled={filteredEvents.length === 0}
              className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Export Excel
            </button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard title="Events" value={String(stats.totalEvents)} />
          <StatCard title="Revenue" value={money(stats.totalRevenue)} />
          <StatCard title="Cost" value={money(stats.totalCost)} />
          <StatCard title="Profit" value={money(stats.totalProfit)} />
          <StatCard title="Balance Due" value={money(stats.totalBalance)} />
        </div>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Search
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Client, venue, menu, date..."
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as "all" | Status)
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
            Loading your events...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <div className="text-lg font-bold text-slate-900">
              No events found
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Create your first event or adjust your filters.
            </p>
            <div className="mt-5">
              <Link
                href="/events/new"
                className="inline-flex rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
              >
                Create Event
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Event</th>
                    <th className="px-4 py-3">Venue</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Guests</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Revenue</th>
                    <th className="px-4 py-3">Profit</th>
                    <th className="px-4 py-3">Balance</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredEvents.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4 align-top">
                        <div className="font-semibold text-slate-900">
                          {item.clientName || "No client"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {item.menuName || "No menu"}
                        </div>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <div className="text-sm font-medium text-slate-800">
                          {item.eventType || "Event"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {item.allDay
                            ? "All day"
                            : [item.startTime, item.endTime]
                                .filter(Boolean)
                                .join(" - ") || "Time not set"}
                        </div>
                      </td>

                      <td className="px-4 py-4 align-top text-sm text-slate-700">
                        {item.venue || "-"}
                      </td>

                      <td className="px-4 py-4 align-top text-sm text-slate-700">
                        {formatDateText(item.date)}
                      </td>

                      <td className="px-4 py-4 align-top text-sm font-medium text-slate-700">
                        {Number(item.guests ?? 0)}
                      </td>

                      <td className="px-4 py-4 align-top">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusBadgeClass(
                            item.status
                          )}`}
                        >
                          {item.status ? STATUS_LABEL_BN[item.status] : "খসড়া"}
                        </span>
                      </td>

                      <td className="px-4 py-4 align-top text-sm font-semibold text-slate-800">
                        {money(item.totalRevenue)}
                      </td>

                      <td
                        className={`px-4 py-4 align-top text-sm font-semibold ${
                          Number(item.profit ?? 0) >= 0
                            ? "text-emerald-700"
                            : "text-red-700"
                        }`}
                      >
                        {money(item.profit)}
                      </td>

                      <td className="px-4 py-4 align-top text-sm font-semibold text-amber-700">
                        {money(item.balanceDue)}
                      </td>

                      <td className="px-4 py-4 align-top">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/events/${item.id}`}
                            className="inline-flex rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 transition hover:bg-sky-100"
                          >
                            Open
                          </Link>

                          <Link
                            href={`/events/${item.id}/edit`}
                            className="inline-flex rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 transition hover:bg-amber-100"
                          >
                            Edit
                          </Link>

                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={deletingId === item.id}
                            className="inline-flex rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingId === item.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-sky-100 bg-sky-50 p-4 text-xs text-sky-800">
          Security note: this page is now protected by login + role check, and
          it also loads only events where{" "}
          <span className="font-bold">bossUid === current logged-in user uid</span>.
          Keep the same restriction in Firestore Security Rules as well.
        </div>
      </div>
    </div>
  );
}