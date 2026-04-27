"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type OrderStatus =
  | "new"
  | "accepted"
  | "preparing"
  | "ready"
  | "served"
  | "delivered"
  | "cancelled";

type OrderType = "inhouse" | "takeaway" | "delivery";

type OrderItem = {
  name: string;
  qty: number;
  note?: string;
};

type OrderDoc = {
  id: string;
  orderNumber?: number | string;
  status?: OrderStatus;
  orderType?: OrderType;
  customerName?: string;
  tableNumber?: string;
  customerPhone?: string;
  customerPhoneNorm?: string;
  customerPostcode?: string;
  items?: OrderItem[];
  cancelReason?: string;
  cancelReasonNote?: string;
  isRepeatCustomer?: boolean;
  customerOrderCount?: number;
  createdAt?: any;
};

function normPhone(input: string) {
  return (input || "").replace(/\D/g, "");
}

function prettyReason(reason?: string) {
  switch (reason) {
    case "customer_changed_mind":
      return "Customer changed mind";
    case "no_stock":
      return "No stock";
    case "payment_failed":
      return "Payment failed";
    case "duplicate_order":
      return "Duplicate order";
    case "wrong_entry":
      return "Wrong entry";
    case "will_order_later":
      return "Will order later";
    case "other":
      return "Other";
    default:
      return "";
  }
}

function formatOrderLabel(order: OrderDoc) {
  return `#${order.orderNumber || order.id.slice(0, 6)}`;
}

function getStatusBadgeClass(status?: OrderStatus) {
  switch (status) {
    case "new":
      return "bg-yellow-100 text-yellow-800";
    case "accepted":
      return "bg-blue-100 text-blue-800";
    case "preparing":
      return "bg-amber-100 text-amber-800";
    case "ready":
      return "bg-green-100 text-green-800";
    case "served":
      return "bg-emerald-100 text-emerald-800";
    case "delivered":
      return "bg-cyan-100 text-cyan-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-neutral-100 text-neutral-700";
  }
}

type CustomerSummary = {
  name: string;
  phone: string;
  postcode: string;
  count: number;
};

export default function SearchOrdersPage() {
  const [orderNumberInput, setOrderNumberInput] = useState("");
  const [mobileInput, setMobileInput] = useState("");
  const [results, setResults] = useState<OrderDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [customerSummary, setCustomerSummary] = useState<CustomerSummary | null>(
    null
  );

  async function searchByOrderNumber() {
    const raw = orderNumberInput.trim().replace("#", "");
    const parsed = Number(raw);

    if (!raw || Number.isNaN(parsed)) {
      setMsg("Enter a valid order number");
      setResults([]);
      setCustomerSummary(null);
      return;
    }

    try {
      setLoading(true);
      setMsg("Searching...");
      setCustomerSummary(null);

      const q = query(
        collection(db, "orders"),
        where("orderNumber", "==", parsed),
        limit(20)
      );

      const snap = await getDocs(q);

      const rows: OrderDoc[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<OrderDoc, "id">),
      }));

      setResults(rows);
      setMsg(rows.length ? `${rows.length} order found` : "No order found");
    } catch (err) {
      console.error("searchByOrderNumber failed:", err);
      setMsg("Failed to search by order number");
      setResults([]);
      setCustomerSummary(null);
    } finally {
      setLoading(false);
    }
  }

  async function searchByMobile(phoneRaw?: string) {
    const phoneNorm = normPhone(phoneRaw ?? mobileInput);

    if (!phoneNorm) {
      setMsg("Enter a valid mobile number");
      setResults([]);
      setCustomerSummary(null);
      return;
    }

    try {
      setLoading(true);
      setMsg("Searching...");

      const q = query(
        collection(db, "orders"),
        where("customerPhoneNorm", "==", phoneNorm),
        orderBy("createdAt", "desc"),
        limit(20)
      );

      const snap = await getDocs(q);

      const rows: OrderDoc[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<OrderDoc, "id">),
      }));

      setResults(rows);
      setMsg(rows.length ? `${rows.length} order(s) found` : "No orders found");

      if (rows.length > 0) {
        const top = rows[0];
        setCustomerSummary({
          name: top.customerName || "Unknown customer",
          phone: top.customerPhone || phoneNorm,
          postcode: top.customerPostcode || "",
          count: rows.length,
        });
      } else {
        setCustomerSummary(null);
      }
    } catch (err) {
      console.error("searchByMobile failed:", err);

      try {
        const fallbackQ = query(
          collection(db, "orders"),
          where("customerPhoneNorm", "==", phoneNorm),
          limit(20)
        );

        const fallbackSnap = await getDocs(fallbackQ);

        let rows: OrderDoc[] = fallbackSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<OrderDoc, "id">),
        }));

        rows = rows.sort((a, b) => {
          const aMs =
            a.createdAt?.seconds != null ? a.createdAt.seconds * 1000 : 0;
          const bMs =
            b.createdAt?.seconds != null ? b.createdAt.seconds * 1000 : 0;
          return bMs - aMs;
        });

        setResults(rows);
        setMsg(
          rows.length ? `${rows.length} order(s) found` : "No orders found"
        );

        if (rows.length > 0) {
          const top = rows[0];
          setCustomerSummary({
            name: top.customerName || "Unknown customer",
            phone: top.customerPhone || phoneNorm,
            postcode: top.customerPostcode || "",
            count: rows.length,
          });
        } else {
          setCustomerSummary(null);
        }
      } catch (fallbackErr) {
        console.error("searchByMobile fallback failed:", fallbackErr);
        setMsg("Failed to search by mobile number");
        setResults([]);
        setCustomerSummary(null);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const phoneNorm = normPhone(mobileInput);

    if (phoneNorm.length < 6) return;

    const timer = setTimeout(() => {
      searchByMobile(phoneNorm);
    }, 400);

    return () => clearTimeout(timer);
  }, [mobileInput]);

  function clearAll() {
    setOrderNumberInput("");
    setMobileInput("");
    setResults([]);
    setMsg("");
    setCustomerSummary(null);
  }

  const totalItemsAcrossResults = useMemo(() => {
    return results.reduce((sum, order) => {
      return (
        sum +
        (order.items || []).reduce((inner, item) => inner + (item.qty || 0), 0)
      );
    }, 0);
  }, [results]);

  return (
    <div className="mx-auto w-full max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Search Orders</h1>
          <p className="text-sm text-neutral-600">
            Retrieve orders by order number or mobile number
          </p>
        </div>

        <Link
          href="/kitchen"
          className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700"
        >
          Back to Kitchen
        </Link>
      </div>

      <div className="grid gap-4 rounded-2xl border border-neutral-200 bg-white p-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Search by Order Number
          </label>
          <input
            value={orderNumberInput}
            onChange={(e) => setOrderNumberInput(e.target.value)}
            placeholder="Example: 12 or #12"
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none"
          />

          <button
            onClick={searchByOrderNumber}
            disabled={loading}
            className="mt-3 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search Order Number"}
          </button>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Search by Mobile Number
          </label>
          <input
            value={mobileInput}
            onChange={(e) => setMobileInput(e.target.value)}
            placeholder="Example: 07123456789"
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none"
          />

          <button
            onClick={() => searchByMobile()}
            disabled={loading}
            className="mt-3 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search Mobile Number"}
          </button>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={clearAll}
          className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700"
        >
          Clear
        </button>

        <Link
          href="/orders/new"
          className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700"
        >
          New Order
        </Link>
      </div>

      {msg ? (
        <div className="mt-4 text-sm font-medium text-neutral-700">{msg}</div>
      ) : null}

      {customerSummary && (
        <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
          <div className="font-semibold">Customer Summary</div>
          <div className="mt-2">👤 {customerSummary.name}</div>
          <div>📞 {customerSummary.phone}</div>
          <div>📦 Orders found: {customerSummary.count}</div>
          <div>⭐ Repeat customer: {customerSummary.count > 1 ? "Yes" : "No"}</div>
          <div>📍 Postcode: {customerSummary.postcode || "—"}</div>
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-700">
          <div className="font-semibold text-neutral-900">Search Summary</div>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
            <div>Total orders: {results.length}</div>
            <div>
              Total items across results: {totalItemsAcrossResults}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {results.map((order) => (
          <div
            key={order.id}
            className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-neutral-900">
                  {formatOrderLabel(order)}
                </div>

                <div className="mt-1 text-sm text-neutral-600">
                  {order.customerName || "Unknown customer"}
                  {order.customerPhone ? ` · ${order.customerPhone}` : ""}
                </div>
              </div>

              <div
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${getStatusBadgeClass(
                  order.status
                )}`}
              >
                {order.status || "unknown"}
              </div>
            </div>

            <div className="mt-3 grid gap-2 text-sm text-neutral-700 md:grid-cols-2">
              <div>
                <span className="font-medium">Order Type:</span>{" "}
                {order.orderType || "—"}
              </div>

              <div>
                <span className="font-medium">Table:</span>{" "}
                {order.tableNumber || "—"}
              </div>

              <div>
                <span className="font-medium">Repeat Customer:</span>{" "}
                {order.isRepeatCustomer ? "Yes" : "No"}
              </div>

              <div>
                <span className="font-medium">Order Count:</span>{" "}
                {order.customerOrderCount || "—"}
              </div>

              <div>
                <span className="font-medium">Postcode:</span>{" "}
                {order.customerPostcode || "—"}
              </div>

              <div>
                <span className="font-medium">Cancel Reason:</span>{" "}
                {prettyReason(order.cancelReason) || "—"}
              </div>
            </div>

            {order.cancelReasonNote ? (
              <div className="mt-3 text-sm text-neutral-700">
                <span className="font-medium">Cancel Note:</span>{" "}
                {order.cancelReasonNote}
              </div>
            ) : null}

            <div className="mt-4 space-y-1 text-sm text-neutral-700">
              {(order.items || []).length === 0 ? (
                <div className="text-neutral-400">No items found</div>
              ) : (
                (order.items || []).map((item, idx) => (
                  <div key={idx}>
                    {item.name} × {item.qty}
                    {item.note ? ` — ${item.note}` : ""}
                  </div>
                ))
              )}
            </div>
          </div>
        ))}

        {!loading && results.length === 0 && msg && (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-6 text-sm text-neutral-500">
            No matching orders to show.
          </div>
        )}
      </div>
    </div>
  );
}