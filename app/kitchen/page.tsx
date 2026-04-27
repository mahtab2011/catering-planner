"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type OrderStatus =
  | "new"
  | "accepted"
  | "preparing"
  | "ready"
  | "ready_for_pickup"
  | "ready_for_delivery"
  | "served"
  | "out_for_delivery"
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
  phone?: string;
  address?: string;
  items?: OrderItem[];
  createdAt?: any;
  cancelReason?: string;
  cancelReasonNote?: string;
  cancelledAt?: any;
};

function getReadyStatusByOrderType(orderType?: OrderType): OrderStatus {
  if (orderType === "takeaway") return "ready_for_pickup";
  if (orderType === "delivery") return "ready_for_delivery";
  return "ready";
}

function getReadyButtonLabel(orderType?: OrderType) {
  if (orderType === "takeaway") return "Ready for Pickup";
  if (orderType === "delivery") return "Ready for Rider";
  return "Ready";
}

function getStatusBadgeClass(status?: OrderStatus) {
  switch (status) {
    case "new":
      return "bg-slate-100 text-slate-700";
    case "accepted":
      return "bg-blue-100 text-blue-700";
    case "preparing":
      return "bg-amber-100 text-amber-700";
    case "ready":
    case "ready_for_pickup":
    case "ready_for_delivery":
      return "bg-green-100 text-green-700";
    case "out_for_delivery":
      return "bg-purple-100 text-purple-700";
    case "served":
    case "delivered":
      return "bg-emerald-100 text-emerald-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-neutral-100 text-neutral-700";
  }
}

function formatStatusLabel(status?: OrderStatus) {
  if (!status) return "new";

  return status.replace(/_/g, " ");
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelNote, setCancelNote] = useState("");

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snap) => {
      const rows: OrderDoc[] = snap.docs.map((d) => {
        const data = d.data() as Omit<OrderDoc, "id">;

        return {
          id: d.id,
          ...data,
          status: data.status || "new",
          orderType: data.orderType || "inhouse",
          items: Array.isArray(data.items) ? data.items : [],
        };
      });

      setOrders(rows);
    });

    return () => unsub();
  }, []);

  async function markAccepted(id: string) {
    try {
      setBusyId(id);
      await updateDoc(doc(db, "orders", id), {
        status: "accepted",
        acceptedAt: serverTimestamp(),
      });
    } finally {
      setBusyId(null);
    }
  }

  async function markPreparing(id: string) {
    try {
      setBusyId(id);
      await updateDoc(doc(db, "orders", id), {
        status: "preparing",
        preparingAt: serverTimestamp(),
      });
    } finally {
      setBusyId(null);
    }
  }

  async function markReady(order: OrderDoc) {
    try {
      setBusyId(order.id);

      const nextStatus = getReadyStatusByOrderType(order.orderType);

      await updateDoc(doc(db, "orders", order.id), {
        status: nextStatus,
        readyAt: serverTimestamp(),
        kitchenCompletedAt: serverTimestamp(),
      });
    } finally {
      setBusyId(null);
    }
  }

  function openCancel(id: string) {
    setCancelId(id);
    setCancelReason("");
    setCancelNote("");
  }

  async function confirmCancel() {
    if (!cancelId) return;

    if (!cancelReason) {
      alert("Please select a reason");
      return;
    }

    try {
      setBusyId(cancelId);

      await updateDoc(doc(db, "orders", cancelId), {
        status: "cancelled",
        cancelReason,
        cancelReasonNote: cancelNote || "",
        cancelledAt: serverTimestamp(),
      });

      setCancelId(null);
      setCancelReason("");
      setCancelNote("");
    } finally {
      setBusyId(null);
    }
  }

  const kitchenOrders = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.status === "new" ||
          o.status === "accepted" ||
          o.status === "preparing"
      ),
    [orders]
  );

  const preparingCount = kitchenOrders.filter(
    (o) => o.status === "preparing"
  ).length;

  const newCount = kitchenOrders.filter((o) => o.status === "new").length;

  return (
    <div className="mx-auto w-full max-w-5xl p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Kitchen Board</h1>
          <p className="text-sm text-neutral-600">
            Active cooking orders only
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/orders/ready"
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700"
          >
            View Ready Orders
          </Link>

          <Link
            href="/orders/delivery"
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700"
          >
            Delivery Board
          </Link>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-neutral-500">Active orders</div>
          <div className="mt-1 text-2xl font-bold text-neutral-900">
            {kitchenOrders.length}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-neutral-500">New orders</div>
          <div className="mt-1 text-2xl font-bold text-neutral-900">
            {newCount}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-neutral-500">Preparing now</div>
          <div className="mt-1 text-2xl font-bold text-neutral-900">
            {preparingCount}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {kitchenOrders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-6 text-sm text-neutral-500">
            No active kitchen orders right now.
          </div>
        ) : (
          kitchenOrders.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold text-neutral-900">
                    #{order.orderNumber || order.id.slice(0, 6)}
                  </div>

                  <div className="mt-1 text-sm text-neutral-600">
                    {order.orderType === "inhouse" && (
                      <>
                        In-house · Table: {order.tableNumber || "—"}
                        {order.customerName ? ` · ${order.customerName}` : ""}
                      </>
                    )}

                    {order.orderType === "takeaway" && (
                      <>
                        Takeaway
                        {order.customerName ? ` · ${order.customerName}` : ""}
                        {order.phone ? ` · ${order.phone}` : ""}
                      </>
                    )}

                    {order.orderType === "delivery" && (
                      <>
                        Delivery
                        {order.customerName ? ` · ${order.customerName}` : ""}
                        {order.phone ? ` · ${order.phone}` : ""}
                      </>
                    )}
                  </div>

                  {order.orderType === "delivery" && order.address && (
                    <div className="mt-1 text-sm text-neutral-500">
                      Address: {order.address}
                    </div>
                  )}
                </div>

                <div
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${getStatusBadgeClass(
                    order.status
                  )}`}
                >
                  {formatStatusLabel(order.status)}
                </div>
              </div>

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

              <div className="mt-4 flex flex-wrap gap-2">
                {order.status === "new" && (
                  <button
                    onClick={() => markAccepted(order.id)}
                    disabled={busyId === order.id}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {busyId === order.id ? "Saving..." : "Accept"}
                  </button>
                )}

                {(order.status === "new" || order.status === "accepted") && (
                  <button
                    onClick={() => markPreparing(order.id)}
                    disabled={busyId === order.id}
                    className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {busyId === order.id ? "Saving..." : "Preparing"}
                  </button>
                )}

                {(order.status === "accepted" ||
                  order.status === "preparing") && (
                  <button
                    onClick={() => markReady(order)}
                    disabled={busyId === order.id}
                    className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {busyId === order.id
                      ? "Saving..."
                      : getReadyButtonLabel(order.orderType)}
                  </button>
                )}

                <button
                  onClick={() => openCancel(order.id)}
                  disabled={busyId === order.id}
                  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {busyId === order.id ? "Saving..." : "Cancel"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {cancelId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-neutral-900">
              Cancel Order
            </h2>

            <select
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="mt-4 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none"
            >
              <option value="">Select reason</option>
              <option value="customer_changed_mind">
                Customer changed mind
              </option>
              <option value="no_stock">No stock</option>
              <option value="payment_failed">Payment failed</option>
              <option value="duplicate_order">Duplicate order</option>
              <option value="wrong_entry">Wrong entry</option>
              <option value="will_order_later">Will order later</option>
              <option value="other">Other</option>
            </select>

            <textarea
              value={cancelNote}
              onChange={(e) => setCancelNote(e.target.value)}
              placeholder="Optional note"
              className="mt-3 min-h-27.5 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none"
            />

            <div className="mt-5 flex gap-2">
              <button
                onClick={confirmCancel}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Confirm Cancel
              </button>

              <button
                onClick={() => {
                  setCancelId(null);
                  setCancelReason("");
                  setCancelNote("");
                }}
                className="flex-1 rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}