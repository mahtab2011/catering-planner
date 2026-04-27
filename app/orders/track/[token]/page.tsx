"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type OrderItem = {
  name: string;
  qty: number;
  kitchenStatus?: string;
};

type OrderDoc = {
  orderNumber?: number;
  customerName?: string;
  orderType?: string;
  paymentStatus?: string;
  timeSlot?: string;
  slotLabel?: string;
  items?: OrderItem[];
  status?: string;
};

export default function TrackOrderPage() {
  const params = useParams();
  const token = params?.token as string;

  const [order, setOrder] = useState<OrderDoc | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadOrder() {
    try {
      const ref = doc(db, "orders", token);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        setOrder(null);
        return;
      }

      setOrder(snap.data() as OrderDoc);
    } catch (err) {
      console.error(err);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) loadOrder();
  }, [token]);

  if (loading) {
    return (
      <div className="p-6 text-center text-neutral-600">
        Loading order...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6 text-center text-red-600">
        ❌ Order not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8faf7]">
      <div className="mx-auto max-w-2xl p-6">

        <h1 className="text-2xl font-bold text-neutral-900 mb-4">
          Order #{order.orderNumber}
        </h1>

        <div className="rounded-2xl border bg-white p-5 shadow">

          <div className="mb-3 text-sm text-neutral-600">
            Customer: {order.customerName}
          </div>

          <div className="mb-3 text-sm text-neutral-600">
            Type: {order.orderType}
          </div>

          <div className="mb-3 text-sm text-neutral-600">
            Time Slot: {order.slotLabel || order.timeSlot}
          </div>

          <div className="mb-4">
            <span className="text-sm font-semibold">Status:</span>{" "}
            <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700 text-sm">
              {order.status || "new"}
            </span>
          </div>

          <div className="mt-4">
            <h2 className="font-semibold mb-2">Items</h2>

            <div className="space-y-2">
              {order.items?.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between rounded-lg border px-3 py-2 text-sm"
                >
                  <div>
                    {item.name} × {item.qty}
                  </div>

                  <div className="text-xs text-neutral-500">
                    {item.kitchenStatus || "pending"}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}