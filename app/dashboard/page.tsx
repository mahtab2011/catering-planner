"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MonthlyTrendChart from "../../components/MonthlyTrendChart";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";

import * as XLSX from "xlsx";

import RevenueCostProfitBars from "../../components/RevenueCostProfitBars";
import StatCard from "../../components/StatCard";
import { auth, db } from "../../lib/firebase";

/* =======================
   Types
======================= */
type EventRow = {
  id: string;
  bossUid?: string;

  clientName?: string;
  date?: string; // "YYYY-MM-DD" or "YYYY-MM"

  guests?: number;

  totalRevenue?: number;
  totalCost?: number;

  // legacy fields if any
  clientPrice?: number;
};

function showMoney(n: any) {
  const num = Number(n ?? 0);
  if (!Number.isFinite(num)) return "0";
  return num.toLocaleString("en-GB");
}

/* =======================
   Helpers
======================= */
function ym(date?: string) {
  // Expect "YYYY-MM-DD" or "YYYY-MM"
  if (!date) return "";
  return String(date).slice(0, 7);
}

function last12MonthsKeys() {
  const out: string[] = [];
  const now = new Date();
  now.setDate(1);
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now);
    d.setMonth(now.getMonth() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    out.push(`${y}-${m}`);
  }
  return out;
}

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [listening, setListening] = useState(false);

  // Hide zero-profit / empty events toggle
  const [showAllEvents, setShowAllEvents] = useState(false);
    const [searchText, setSearchText] = useState("");

  /* =======================
     Auth + Load events
  ======================= */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u ?? null);

      if (!u) {
        setEvents([]);
        setLoading(false);
        router.push("/login");
        return;
      }

      try {
        setLoading(true);

        // Your events collection name is assumed "events"
        // If yours is different, change it here.
        const q = query(
          collection(db, "events"),
          where("bossUid", "==", u.uid),
          // orderBy is optional; if your Firestore doesn't have index, remove orderBy
          orderBy("date", "desc")
        );

        const snap = await getDocs(q);

        const rows: EventRow[] = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            bossUid: data.bossUid,
            clientName: data.clientName ?? data.eventName ?? "",
            date: data.date ?? data.eventDate ?? "",
            guests: Number(data.guests ?? 0),

            totalRevenue: Number(data.totalRevenue ?? 0),
            totalCost: Number(data.totalCost ?? 0),

            clientPrice: Number(data.clientPrice ?? 0),
          };
        });

        setEvents(rows);
      } catch (e) {
        console.error(e);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [router]);
  function startVoiceSearch(lang: "bn-BD" | "en-GB") {
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("Voice is not supported in this browser. Please use Chrome.");
    return;
  }

  const rec = new SpeechRecognition();
  rec.lang = lang;
  rec.interimResults = false;
  rec.maxAlternatives = 1;

  rec.onstart = () => setListening(true);
  rec.onend = () => setListening(false);

  rec.onresult = (e: any) => {
    const text = e.results?.[0]?.[0]?.transcript ?? "";
    setSearchText(text);
  };

  rec.start();
}

  /* =======================
     Derived: totals
  ======================= */
  const totals = useMemo(() => {
    const revenue = events.reduce((s, e) => s + Number(e.totalRevenue ?? 0), 0);
    const cost = events.reduce((s, e) => s + Number(e.totalCost ?? 0), 0);
    const profit = revenue - cost;

    const guests = events.reduce((s, e) => s + Number(e.guests ?? 0), 0);

    const profitPct =
      revenue > 0 ? Math.round((profit / revenue) * 1000) / 10 : 0;

    const profitPerGuest =
      guests > 0 ? Math.round((profit / guests) * 100) / 100 : 0;

    return { revenue, cost, profit, guests, profitPct, profitPerGuest };
  }, [events]);

  /* =======================
     Monthly rows (Last 12 Months)
  ======================= */
  const monthlyRows12 = useMemo(() => {
    const keys = last12MonthsKeys();
    return keys.map((k) => {
      const filtered = events.filter((e) => ym(e.date) === k);

      const revenue = filtered.reduce(
        (s, e) => s + Number(e.totalRevenue ?? 0),
        0
      );
      const cost = filtered.reduce(
        (s, e) => s + Number(e.totalCost ?? 0),
        0
      );
      const profit = revenue - cost;

      return {
        Month: k,
        Events: filtered.length,
        Revenue: revenue,
        Cost: cost,
        Profit: profit,
      };
    });
  }, [events]);

  /* =======================
     Events list (cleaned)
  ======================= */
  const viewEvents = useMemo(() => {
  const sorted = [...events].sort((a, b) =>
    String(b.date ?? "").localeCompare(String(a.date ?? ""))
  );

  let filtered = sorted;

  if (!showAllEvents) {
    filtered = filtered.filter((e) => {
      const rev = Number(e.totalRevenue ?? 0);
      const cost = Number(e.totalCost ?? 0);
      return rev !== 0 || cost !== 0;
    });
  }

  if (searchText.trim() !== "") {
    const s = searchText.toLowerCase();
    filtered = filtered.filter((e) =>
      (e.clientName ?? "").toLowerCase().includes(s)
    );
  }

  return filtered;
}, [events, showAllEvents, searchText]);
  /* =======================
     Export Excel
  ======================= */
  function exportExcel() {
    try {
      setExporting(true);

      const stamp = new Date().toISOString().slice(0, 10);
      const fileName = `dashboard_export_${stamp}.xlsx`;

      const wb = XLSX.utils.book_new();

      // Sheet 1: Events
      const viewEventsForSheet = viewEvents.map((e) => {
        const revenue = Number(e.totalRevenue ?? 0);
        const cost = Number(e.totalCost ?? 0);
        const profit = revenue - cost;
        return {
          Date: e.date ?? "",
          Client: e.clientName ?? "",
          Guests: Number(e.guests ?? 0),
          Revenue: revenue,
          Cost: cost,
          Profit: profit,
        };
      });

      const wsEvents = XLSX.utils.json_to_sheet(viewEventsForSheet);
      XLSX.utils.book_append_sheet(wb, wsEvents, "Events");

      // Sheet 2: Last 12 Months
      const wsMonthly = XLSX.utils.json_to_sheet(monthlyRows12);
      XLSX.utils.book_append_sheet(wb, wsMonthly, "Last 12 Months");

      // Write workbook to array buffer
      const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });

      // Download via Blob (no file-saver needed)
      const blob = new Blob([out], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Export failed. Check console for details.");
    } finally {
      setExporting(false);
    }
  }

  async function logout() {
    await signOut(auth);
    router.push("/login");
  }

  /* =======================
     UI
  ======================= */
  if (loading) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          Loading dashboard…
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">📊 Monthly Dashboard</h1>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportExcel}
            disabled={exporting}
            className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm hover:bg-neutral-50 disabled:opacity-50"
          >
            ⬇️ {exporting ? "Exporting…" : "Export Excel"}
          </button>

          <button
            onClick={logout}
            className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm hover:bg-neutral-50"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <StatCard title="Revenue" value={showMoney(totals.revenue)} />
        <StatCard title="Cost" value={showMoney(totals.cost)} />
        <StatCard
          title="Profit"
          value={showMoney(totals.profit)}
          footer={
            <div className="text-sm text-neutral-700">
              <div>Profit %: {totals.profitPct}%</div>
              <div>Profit / Guest: {totals.profitPerGuest}</div>
            </div>
          }
        />
      </div>

      {/* Chart */}
      <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="mb-3 flex items-center gap-2 font-semibold">
          <span>📈</span>
          <span>Revenue vs Cost vs Profit</span>
        </div>

        <RevenueCostProfitBars
          revenue={totals.revenue}
          cost={totals.cost}
          profit={totals.profit}
        />
        <div className="mt-2 text-sm text-neutral-600">
          Scale max: {showMoney(Math.max(totals.revenue, totals.cost, Math.abs(totals.profit)))}
        </div>
      </div>

      {/* Last 12 Months */}
      <div className="mt-6">
        <div className="mb-2 flex items-center gap-2 font-semibold">
          <span>📅</span>
          <span>Last 12 Months</span>
        </div>
        <MonthlyTrendChart data={monthlyRows12} />
        <div className="mb-3 flex flex-wrap items-center gap-2">
  <input
    value={searchText}
    onChange={(e) => setSearchText(e.target.value)}
    placeholder="Search by client name… (e.g., Shakila / শাকিলা)"
    className="w-full max-w-md rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm outline-none focus:border-neutral-400"
  />

  <button
    type="button"
    onClick={() => startVoiceSearch("bn-BD")}
    className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm hover:bg-neutral-50"
  >
    {listening ? "🎤 শুনছি..." : "🎤 বাংলা"}
  </button>

  <button
    type="button"
    onClick={() => startVoiceSearch("en-GB")}
    className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm hover:bg-neutral-50"
  >
    {listening ? "🎤 Listening..." : "🎤 English"}
  </button>

  {searchText.trim() && (
    <button
      type="button"
      onClick={() => setSearchText("")}
      className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm hover:bg-neutral-50"
    >
      Clear
    </button>
  )}
</div>

        <div className="space-y-2">
          {monthlyRows12.map((r) => (
            
            <div
              key={r.Month}
              className="rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="font-medium">{r.Month}</div>

                <div className="flex flex-wrap gap-4 text-neutral-700">
                  <span>
                    Events: <b>{r.Events}</b>
                  </span>
                  <span>
                    Revenue: <b>{showMoney(r.Revenue)}</b>
                  </span>
                  <span>
                    Cost: <b>{showMoney(r.Cost)}</b>
                  </span>
                  <span>
                    Profit:{" "}
                    <b
                      className={
                        r.Profit > 0
                          ? "text-green-600"
                          : r.Profit < 0
                          ? "text-red-600"
                          : "text-neutral-700"
                      }
                    >
                      {showMoney(r.Profit)}
                    </b>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Events */}
      <div className="mt-10">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Events</h2>

          <button
            onClick={() => setShowAllEvents((s) => !s)}
            className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm hover:bg-neutral-50"
          >
            {showAllEvents ? "Hide zero-profit events" : "Show all events"}
          </button>
        </div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
  <input
    value={searchText}
    onChange={(e) => setSearchText(e.target.value)}
    placeholder="Search by client name… (e.g., Shakila / শাকিলা)"
    className="w-full max-w-md rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm outline-none focus:border-neutral-400"
  />
<button
  type="button"
  onClick={() => startVoiceSearch("bn-BD")}
  className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm hover:bg-neutral-50"
>
  🎤 বাংলা
</button>

<button
  type="button"
  onClick={() => startVoiceSearch("en-GB")}
  className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm hover:bg-neutral-50"
>
  🎤 English
</button>
  <button
    type="button"
    onClick={() => startVoiceSearch("bn-BD")}
    className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm hover:bg-neutral-50"
  >
    {listening ? "🎤 শুনছি..." : "🎤 বাংলা"}
  </button>

  <button
    type="button"
    onClick={() => startVoiceSearch("en-GB")}
    className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm hover:bg-neutral-50"
  >
    {listening ? "🎤 Listening..." : "🎤 English"}
  </button>

  {searchText.trim() && (
    <button
      type="button"
      onClick={() => setSearchText("")}
      className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm hover:bg-neutral-50"
    >
      Clear
    </button>
  )}
</div>

        <div className="space-y-2">
          {viewEvents.map((e) => {
            const profit =
              Number(e.totalRevenue ?? 0) - Number(e.totalCost ?? 0);

            return (
              <div
                key={e.id}
                className="rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="font-medium">
                    {e.date ?? "No date"}{" "}
                    {e.clientName ? `• ${e.clientName}` : ""}
                  </div>

                  <span
                    className={
                      profit > 0
                        ? "text-green-600 font-semibold"
                        : profit < 0
                        ? "text-red-600 font-semibold"
                        : "text-neutral-700"
                    }
                  >
                    Profit: {showMoney(profit)}
                  </span>
                </div>
              </div>
            );
          })}

          {viewEvents.length === 0 && (
            <div className="rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-600">
              No events to show.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}