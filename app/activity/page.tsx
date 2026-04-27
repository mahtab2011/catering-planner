"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

type LogItem = {
  id: string;
  supplier?: string;
  action?: string;
  message?: string;
  createdAt?: any;
};

function formatTime(value: any) {
  try {
    const date =
      typeof value?.toDate === "function"
        ? value.toDate()
        : value
        ? new Date(value)
        : null;

    if (!date || Number.isNaN(date.getTime())) return "-";

    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

function getActionStyles(action?: string) {
  switch ((action || "").toLowerCase()) {
    case "copy":
      return "border-blue-200 bg-blue-50 text-blue-800";
    case "excel":
      return "border-green-200 bg-green-50 text-green-800";
    case "pdf":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "whatsapp":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    default:
      return "border-slate-200 bg-slate-50 text-slate-800";
  }
}

function isWithinDateRange(createdAt: any, filter: string) {
  if (filter === "ALL") return true;

  const date =
    typeof createdAt?.toDate === "function"
      ? createdAt.toDate()
      : createdAt
      ? new Date(createdAt)
      : null;

  if (!date || Number.isNaN(date.getTime())) return false;

  const now = new Date();

  if (filter === "TODAY") {
    return date.toDateString() === now.toDateString();
  }

  if (filter === "LAST_7_DAYS") {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    return date >= sevenDaysAgo;
  }

  if (filter === "LAST_30_DAYS") {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    return date >= thirtyDaysAgo;
  }

  return true;
}
function cleanMessage(message?: string) {
  if (!message) return "-";

  let cleaned = message;

  // remove "Supplier: X"
  cleaned = cleaned.replace(/Supplier:\s*\w+\n?/gi, "");

  // remove extra empty lines
  cleaned = cleaned.replace(/\n{2,}/g, "\n\n");

  return cleaned.trim();
}
export default function ActivityPage() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [supplierFilter, setSupplierFilter] = useState("ALL");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");

  useEffect(() => {
    const q = query(collection(db, "activity_logs"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs
          .map((d) => ({
            id: d.id,
            ...(d.data() as any),
          }))
          .sort((a: any, b: any) => {
            const aTime =
              typeof a?.createdAt?.toDate === "function"
                ? a.createdAt.toDate().getTime()
                : 0;

            const bTime =
              typeof b?.createdAt?.toDate === "function"
                ? b.createdAt.toDate().getTime()
                : 0;

            return bTime - aTime;
          });

        console.log("ACTIVITY LOGS:", rows);
        setLogs(rows);
      },
      (error) => {
        console.error("Activity logs read failed:", error);
      }
    );

    return () => unsub();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const supplierMatch =
        supplierFilter === "ALL" || (log.supplier || "") === supplierFilter;

      const actionMatch =
        actionFilter === "ALL" || (log.action || "") === actionFilter;

      const dateMatch = isWithinDateRange(log.createdAt, dateFilter);

      return supplierMatch && actionMatch && dateMatch;
    });
  }, [logs, supplierFilter, actionFilter, dateFilter]);

  const summary = useMemo(() => {
    return {
      copy: logs.filter((log) => log.action === "copy").length,
      excel: logs.filter((log) => log.action === "excel").length,
      pdf: logs.filter((log) => log.action === "pdf").length,
      whatsapp: logs.filter((log) => log.action === "whatsapp").length,
    };
  }, [logs]);

  return (
    <div className="min-h-screen bg-sky-50 p-6">
      <h1 className="mb-4 text-2xl font-bold">📊 Activity Logs</h1>

      <div className="mb-4 flex flex-wrap gap-3">
        <select
          value={supplierFilter}
          onChange={(e) => setSupplierFilter(e.target.value)}
          className="rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm"
        >
          <option value="ALL">All Suppliers</option>
          <option value="X">X</option>
          <option value="Y">Y</option>
          <option value="Z">Z</option>
        </select>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm"
        >
          <option value="ALL">All Actions</option>
          <option value="copy">copy</option>
          <option value="excel">excel</option>
          <option value="pdf">pdf</option>
          <option value="whatsapp">whatsapp</option>
        </select>

        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm"
        >
          <option value="ALL">All Time</option>
          <option value="TODAY">Today</option>
          <option value="LAST_7_DAYS">Last 7 Days</option>
          <option value="LAST_30_DAYS">Last 30 Days</option>
        </select>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
          <div className="text-xs font-semibold text-blue-700">Copy</div>
          <div className="mt-1 text-2xl font-bold">
            <span className={summary.copy > 0 ? "text-blue-900" : "text-gray-400"}>
              {summary.copy}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-green-200 bg-green-50 p-3">
          <div className="text-xs font-semibold text-green-700">Excel</div>
          <div className="mt-1 text-2xl font-bold">
            <span className={summary.excel > 0 ? "text-green-900" : "text-gray-400"}>
              {summary.excel}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <div className="text-xs font-semibold text-amber-700">PDF</div>
          <div className="mt-1 text-2xl font-bold">
            <span className={summary.pdf > 0 ? "text-amber-900" : "text-gray-400"}>
              {summary.pdf}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <div className="text-xs font-semibold text-emerald-700">WhatsApp</div>
          <div className="mt-1 text-2xl font-bold">
            <span
              className={summary.whatsapp > 0 ? "text-emerald-900" : "text-gray-400"}
            >
              {summary.whatsapp}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-sky-200 bg-white p-3 text-sm">
        Showing: {filteredLogs.length} / {logs.length}
        {dateFilter !== "ALL" ? ` • ${dateFilter.replaceAll("_", " ")}` : ""}
      </div>

      {logs.length === 0 && (
        <div className="mb-4 text-sm text-gray-500">
          No activity yet. Start using the system.
        </div>
      )}

      {filteredLogs.length === 0 ? (
        <div className="rounded-xl border border-sky-200 bg-white p-4 text-sm text-gray-600">
          No logs found yet.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="rounded-xl border border-sky-200 bg-white p-4 shadow-sm"
            >
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2 font-semibold">
                  <span
                    className={`rounded-full border px-2 py-1 text-xs font-semibold ${getActionStyles(
                      log.action
                    )}`}
                  >
                    {(log.action || "-").toUpperCase()}
                  </span>

                  <span className="text-gray-700">
  Supplier: <span className="font-semibold">{log.supplier || "-"}</span>
</span>
                </div>

                <div className="text-gray-500">{formatTime(log.createdAt)}</div>
              </div>

              <div className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                {cleanMessage(log.message)}
              </div>

              <div className="mt-2 text-xs text-gray-400">ID: {log.id}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}