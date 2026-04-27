"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type RiderCorrectionLog = {
  id: string;
  riderId?: string;
  riderName?: string;
  previousCompleted?: number;
  adjustment?: number;
  newCompleted?: number;
  previousToday?: number;
  newToday?: number;
  previousWeek?: number;
  newWeek?: number;
  previousMonth?: number;
  newMonth?: number;
  note?: string;
  correctedAt?: any;
  correctedByUid?: string;
  correctedByName?: string;
  correctedByEmail?: string;
};

function formatDateTime(value: any) {
  try {
    const date =
      typeof value?.toDate === "function"
        ? value.toDate()
        : value
        ? new Date(value)
        : null;

    if (!date || Number.isNaN(date.getTime())) return "—";

    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function signedNumber(value?: number) {
  const num = Number(value || 0);
  if (num > 0) return `+${num}`;
  return `${num}`;
}

export default function RiderCorrectionLogsPage() {
  const [logs, setLogs] = useState<RiderCorrectionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  // NEW STATES
  const [filter, setFilter] = useState<"all" | "positive" | "negative">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const q = query(
      collection(db, "riderCorrectionLogs"),
      orderBy("correctedAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data: RiderCorrectionLog[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<RiderCorrectionLog, "id">),
        }));

        setLogs(data);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setMsg("❌ Failed to load correction logs");
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // FILTER + SEARCH LOGIC
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const adj = Number(log.adjustment || 0);

      if (filter === "positive" && adj <= 0) return false;
      if (filter === "negative" && adj >= 0) return false;

      const name = (log.riderName || "").toLowerCase();
      if (search && !name.includes(search.toLowerCase())) return false;

      return true;
    });
  }, [logs, filter, search]);

  const summary = useMemo(() => {
    return {
      totalLogs: logs.length,
      positiveAdjustments: logs.filter((l) => Number(l.adjustment || 0) > 0).length,
      negativeAdjustments: logs.filter((l) => Number(l.adjustment || 0) < 0).length,
      zeroAdjustments: logs.filter((l) => Number(l.adjustment || 0) === 0).length,
    };
  }, [logs]);

  if (loading) {
    return (
      <div className="p-6 text-center text-neutral-600">
        Loading rider correction logs...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8faf7]">
      <div className="mx-auto max-w-6xl p-6">

        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              📜 Rider Correction Logs
            </h1>
            <p className="mt-1 text-sm text-neutral-600">
              Full audit trail — who changed what, when, and why.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a href="/orders" className="btn">Delivery Board</a>
            <a href="/orders/rider" className="btn">Rider View</a>
            <a href="/orders/riders" className="btn">Rider Control</a>
          </div>
        </div>

        {/* SEARCH + FILTER */}
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

          <input
            type="text"
            placeholder="Search rider..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-64 rounded-xl border border-neutral-300 px-3 py-2 text-sm"
          />

          <div className="flex gap-2">
            <button onClick={() => setFilter("all")} className="btn">
              All
            </button>
            <button onClick={() => setFilter("positive")} className="btn">
              + Positive
            </button>
            <button onClick={() => setFilter("negative")} className="btn">
              - Negative
            </button>
          </div>
        </div>

        {/* SUMMARY */}
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="card">Total: <b>{summary.totalLogs}</b></div>
          <div className="card text-emerald-700">+ {summary.positiveAdjustments}</div>
          <div className="card text-red-700">- {summary.negativeAdjustments}</div>
          <div className="card">0 {summary.zeroAdjustments}</div>
        </div>

        {/* LOG LIST */}
        {filteredLogs.length === 0 ? (
          <div className="card">No logs found</div>
        ) : (
          <div className="space-y-4">
            {filteredLogs.map((log) => {
              const adjustment = Number(log.adjustment || 0);

              const correctedBy =
                log.correctedByName ||
                log.correctedByEmail ||
                log.correctedByUid ||
                "Unknown";

              return (
                <div key={log.id} className="card">

                  <div className="flex justify-between">
                    <div>
                      <div className="font-semibold">
                        {log.riderName}
                      </div>

                      <div className="text-sm text-neutral-500">
                        By: {correctedBy}
                      </div>
                    </div>

                    <div className="text-sm">
                      {signedNumber(adjustment)} • {formatDateTime(log.correctedAt)}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>{log.previousCompleted} → {log.newCompleted}</div>
                    <div>{log.previousToday} → {log.newToday}</div>
                    <div>{log.previousWeek} → {log.newWeek}</div>
                    <div>{log.previousMonth} → {log.newMonth}</div>
                  </div>

                  <div className="mt-3 text-sm text-amber-800">
                    {log.note || "No note"}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}