"use client";

import { useEffect, useState } from "react";
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
  orderNumber?: string;
  status: OrderStatus;
  orderType: OrderType;
  customerName?: string;
  tableNumber?: string;
  phone?: string;
  address?: string;
  items?: OrderItem[];
  readyAt?: any;
};

export default function ReadyOrdersPage() {
  const [orders, setOrders] = useState<OrderDoc[]>([]);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("readyAt", "desc"));

    const unsub = onSnapshot(q, (snap) => {
      const rows: OrderDoc[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<OrderDoc, "id">),
      }));

      setOrders(rows.filter((o) => o.status === "ready"));
    });

    return () => unsub();
  }, []);

  async function markServed(id: string) {
    await updateDoc(doc(db, "orders", id), {
      status: "served",
      servedAt: serverTimestamp(),
    });
  }

  async function markDelivered(id: string) {
    await updateDoc(doc(db, "orders", id), {
      status: "delivered",
      deliveredAt: serverTimestamp(),
    });
  }

  return (
    <div className="mx-auto w-full max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Ready Orders</h1>
          <p className="text-sm text-neutral-600">
            Orders ready for service, collection, or dispatch
          </p>
        </div>

        <Link
          href="/orders"
          className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700"
        >
          Back
        </Link>
      </div>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-6 text-sm text-neutral-500">
            No ready orders right now.
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold text-neutral-900">
                    #{order.orderNumber || order.id.slice(0, 6)}
                  </div>

                  <div className="mt-1 text-sm text-neutral-600">
                    {order.orderType === "inhouse" && (
                      <>
                        Table: {order.tableNumber || "—"}
                        {order.customerName ? ` · ${order.customerName}` : ""}
                      </>
                    )}

                    {order.orderType === "takeaway" && (
                      <>
                        Takeaway
                        {order.customerName ? ` · ${order.customerName}` : ""}
                      </>
                    )}

                    {order.orderType === "delivery" && (
                      <>
                        Delivery
                        {order.customerName ? ` · ${order.customerName}` : ""}
                      </>
                    )}
                  </div>
                </div>

                <div className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                  READY
                </div>
              </div>

              <div className="mt-4 space-y-1 text-sm text-neutral-700">
                {(order.items || []).map((item, idx) => (
                  <div key={idx}>
                    {item.name} × {item.qty}
                    {item.note ? ` — ${item.note}` : ""}
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {order.orderType === "inhouse" && (
                  <button
                    onClick={() => markServed(order.id)}
                    className="rounded-xl bg-green-700 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Served
                  </button>
                )}

                {order.orderType === "takeaway" && (
                  <button
                    onClick={() => markServed(order.id)}
                    className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Collected
                  </button>
                )}

                {order.orderType === "delivery" && (
                  <button
                    onClick={() => markDelivered(order.id)}
                    className="rounded-xl bg-purple-700 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Delivered
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}