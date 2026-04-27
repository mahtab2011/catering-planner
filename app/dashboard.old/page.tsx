"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

type EventRow = {
  id: string;
  bossUid?: string;

  // main fields we need for summary
  date?: string; // yyyy-mm-dd
  guests?: number;

  totalRevenue?: number;
  totalCost?: number;

  // optional (we re-calc anyway)
  profit?: number;
};

function showMoney(n: any) {
  const num = Number(n ?? 0);
  if (!Number.isFinite(num)) return "0";
  return num.toLocaleString("en-GB");
}

export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [bossUid, setBossUid] = useState<string | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [error, setError] = useState<string>("");

  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return now.toISOString().slice(0, 7); // yyyy-mm
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        setError("");
        if (!user) {
          router.push("/login");
          return;
        }

        setBossUid(user.uid);

        const q = query(collection(db, "events"), where("bossUid", "==", user.uid));
        const snap = await getDocs(q);

        const rows: EventRow[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));

        setEvents(rows);
      } catch (e: any) {
        setError(e?.message || "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [router]);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => (e.date || "").startsWith(selectedMonth));
  }, [events, selectedMonth]);

  const summary = useMemo(() => {
    let totalRevenue = 0;
    let totalCost = 0;
    let totalGuests = 0;
    let lossCount = 0;

    for (const e of filteredEvents) {
      const revenue = Number(e.totalRevenue ?? 0);
      const cost = Number(e.totalCost ?? 0);
      const profit = revenue - cost;

      totalRevenue += revenue;
      totalCost += cost;
      totalGuests += Number(e.guests ?? 0);

      if (profit < 0) lossCount++;
    }

    const totalProfit = totalRevenue - totalCost;
    const profitPercent = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    const avgProfitPerEvent =
      filteredEvents.length > 0 ? totalProfit / filteredEvents.length : 0;

    return {
      totalEvents: filteredEvents.length,
      totalRevenue,
      totalCost,
      totalProfit,
      profitPercent,
      totalGuests,
      lossCount,
      avgProfitPerEvent,
    };
  }, [filteredEvents]);

  async function handleLogout() {
    await signOut(auth);
    router.push("/login");
  }

  return (
    <main style={{ padding: 24, maxWidth: 980, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ margin: 0 }}>📊 Monthly Dashboard</h1>
          <div style={{ marginTop: 6, opacity: 0.8, fontSize: 14 }}>
            Boss UID: {bossUid ? bossUid.slice(0, 8) + "…" : "—"}
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #111",
            background: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>

      <div style={{ marginTop: 14 }}>
        <Link href="/events">← Back to Events</Link>
      </div>

      {error ? (
        <div style={{ marginTop: 16, padding: 12, border: "1px solid #f99", borderRadius: 10 }}>
          ⚠️ {error}
        </div>
      ) : null}

      <section
        style={{
          marginTop: 18,
          padding: 16,
          border: "1px solid #ddd",
          borderRadius: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 700 }}>Select Month</div>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid #ccc",
            }}
          />

          <div style={{ marginLeft: "auto", opacity: 0.8 }}>
            Events in month: <b>{summary.totalEvents}</b>
          </div>
        </div>

        {loading ? (
          <div style={{ marginTop: 14 }}>Loading…</div>
        ) : (
          <div
            style={{
              marginTop: 16,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            <Card title="Total Revenue" value={showMoney(summary.totalRevenue)} />
            <Card title="Total Cost" value={showMoney(summary.totalCost)} />
            <Card title="Total Profit" value={showMoney(summary.totalProfit)} />
            <Card title="Profit %" value={`${summary.profitPercent.toFixed(1)}%`} />
            <Card title="Total Guests" value={showMoney(summary.totalGuests)} />
            <Card title="Avg Profit / Event" value={showMoney(summary.avgProfitPerEvent)} />
            <Card title="Loss Events" value={showMoney(summary.lossCount)} />
          </div>
        )}
      </section>

      <section style={{ marginTop: 18 }}>
        <h3 style={{ marginBottom: 8 }}>Events (This Month)</h3>
        {filteredEvents.length === 0 ? (
          <div style={{ opacity: 0.8 }}>No events found for {selectedMonth}.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {filteredEvents
              .slice()
              .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
              .map((e) => {
                const rev = Number(e.totalRevenue ?? 0);
                const cost = Number(e.totalCost ?? 0);
                const profit = rev - cost;
                const isLoss = profit < 0;

                return (
                  <div
                    key={e.id}
                    style={{
                      border: "1px solid #ddd",
                      borderRadius: 12,
                      padding: 12,
                      background: isLoss ? "rgba(255,0,0,0.06)" : "#fff",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800 }}>{e.date || "No date"}</div>
                      <div style={{ opacity: 0.8, fontSize: 14 }}>
                        Guests: {e.guests ?? "—"}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                      <Mini label="Rev" value={showMoney(rev)} />
                      <Mini label="Cost" value={showMoney(cost)} />
                      <Mini label="Profit" value={showMoney(profit)} />
                      <Link
                        href={`/events/${e.id}`}
                        style={{
                          alignSelf: "center",
                          padding: "8px 12px",
                          border: "1px solid #111",
                          borderRadius: 10,
                          textDecoration: "none",
                          fontWeight: 700,
                        }}
                      >
                        Open
                      </Link>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </section>
    </main>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 14,
        padding: 14,
        background: "#fff",
      }}
    >
      <div style={{ opacity: 0.8, fontSize: 13 }}>{title}</div>
      <div style={{ fontSize: 26, fontWeight: 900, marginTop: 6 }}>{value}</div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ minWidth: 90 }}>
      <div style={{ opacity: 0.75, fontSize: 12 }}>{label}</div>
      <div style={{ fontWeight: 900 }}>{value}</div>
    </div>
  );
}