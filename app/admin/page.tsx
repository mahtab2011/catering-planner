"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type SalesSignupStatus = "new" | "reviewing" | "approved" | "rejected";

type SalesSignup = {
  id: string;
  fullName?: string;
  phone?: string;
  email?: string;
  area?: string;
  address?: string;
  notes?: string;
  status?: SalesSignupStatus;
  reviewed?: boolean;
  reviewedAt?: any;
  reviewedBy?: string;
  createdAt?: any;
  updatedAt?: any;
};

type OrderStatus =
  | "new"
  | "accepted"
  | "preparing"
  | "ready"
  | "served"
  | "delivered"
  | "cancelled";

type PaymentStatus = "unpaid" | "partial" | "paid";

type OrderDoc = {
  id: string;
  orderNumber?: number | string;
  customerName?: string;
  orderType?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  grandTotal?: number;
  subtotal?: number;
  discount?: number;
  cancelReason?: string;
  createdAt?: any;
};

function tsToMs(value: any) {
  if (value?.seconds != null) return value.seconds * 1000;
  if (value instanceof Date) return value.getTime();
  return 0;
}

function isTodayTs(value: any) {
  const ms = tsToMs(value);
  if (!ms) return false;

  const d = new Date(ms);
  const now = new Date();

  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function money(n: number) {
  return Number(n || 0).toFixed(2);
}

export default function AdminPage() {
  const [sales, setSales] = useState<SalesSignup[]>([]);
  const [orders, setOrders] = useState<OrderDoc[]>([]);

  useEffect(() => {
    const salesQ = query(
      collection(db, "sales_signups"),
      orderBy("createdAt", "desc")
    );

    const unsubSales = onSnapshot(salesQ, (snap) => {
      const rows: SalesSignup[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<SalesSignup, "id">),
      }));
      setSales(rows);
    });

    const ordersQ = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc")
    );

    const unsubOrders = onSnapshot(ordersQ, (snap) => {
      const rows: OrderDoc[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<OrderDoc, "id">),
      }));
      setOrders(rows);
    });

    return () => {
      unsubSales();
      unsubOrders();
    };
  }, []);

  const newLeads = useMemo(
    () => sales.filter((s) => (s.status || "new") === "new"),
    [sales]
  );

  const todayOrders = useMemo(
    () => orders.filter((o) => isTodayTs(o.createdAt)),
    [orders]
  );

  const totalOrdersToday = todayOrders.length;

  const totalRevenueToday = useMemo(
    () =>
      todayOrders.reduce((sum, o) => {
        if (o.status === "cancelled") return sum;
        return sum + Number(o.grandTotal || 0);
      }, 0),
    [todayOrders]
  );

  const cancelledToday = useMemo(
    () => todayOrders.filter((o) => o.status === "cancelled").length,
    [todayOrders]
  );

  const readyNow = useMemo(
    () => orders.filter((o) => o.status === "ready").length,
    [orders]
  );

  const completedToday = useMemo(
    () =>
      todayOrders.filter(
        (o) => o.status === "served" || o.status === "delivered"
      ).length,
    [todayOrders]
  );

  const unpaidToday = useMemo(
    () => todayOrders.filter((o) => o.paymentStatus === "unpaid").length,
    [todayOrders]
  );

  const partialToday = useMemo(
    () => todayOrders.filter((o) => o.paymentStatus === "partial").length,
    [todayOrders]
  );

  const paidToday = useMemo(
    () => todayOrders.filter((o) => o.paymentStatus === "paid").length,
    [todayOrders]
  );

  const recentOrders = useMemo(() => orders.slice(0, 8), [orders]);

  return (
    <div className="mx-auto w-full max-w-6xl p-6">
      <h1 className="mb-2 text-2xl font-bold text-neutral-900">
        Admin Dashboard
      </h1>
      <p className="mb-6 text-sm text-neutral-600">
        Daily summary for restaurant operations, orders, and sales onboarding
      </p>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Link
          href="/admin/restaurant-signups"
          className="rounded-xl border border-neutral-200 bg-white p-4 hover:shadow"
        >
          <div className="font-semibold text-neutral-900">
            Restaurant Signups
          </div>
          <div className="text-sm text-neutral-500">
            Review and approve restaurants
          </div>
        </Link>

        <Link
          href="/orders/search"
          className="rounded-xl border border-neutral-200 bg-white p-4 hover:shadow"
        >
          <div className="font-semibold text-neutral-900">Order Search</div>
          <div className="text-sm text-neutral-500">
            Find any order quickly
          </div>
        </Link>

        <Link
          href="/sales-signup"
          className="rounded-xl border border-neutral-200 bg-white p-4 hover:shadow"
        >
          <div className="font-semibold text-neutral-900">
            Add Sales Person
          </div>
          <div className="text-sm text-neutral-500">
            Register new field agents
          </div>
        </Link>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-5">
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <div className="text-sm font-medium text-blue-700">
            Orders Today
          </div>
          <div className="mt-1 text-2xl font-bold text-blue-900">
            {totalOrdersToday}
          </div>
        </div>

        <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
          <div className="text-sm font-medium text-green-700">
            Revenue Today
          </div>
          <div className="mt-1 text-2xl font-bold text-green-900">
            £{money(totalRevenueToday)}
          </div>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="text-sm font-medium text-red-700">
            Cancelled Today
          </div>
          <div className="mt-1 text-2xl font-bold text-red-900">
            {cancelledToday}
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-sm font-medium text-amber-700">Ready Now</div>
          <div className="mt-1 text-2xl font-bold text-amber-900">
            {readyNow}
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="text-sm font-medium text-emerald-700">
            Completed Today
          </div>
          <div className="mt-1 text-2xl font-bold text-emerald-900">
            {completedToday}
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="text-sm font-medium text-neutral-600">Unpaid</div>
          <div className="mt-1 text-2xl font-bold text-neutral-900">
            {unpaidToday}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="text-sm font-medium text-neutral-600">Partial</div>
          <div className="mt-1 text-2xl font-bold text-neutral-900">
            {partialToday}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="text-sm font-medium text-neutral-600">Paid</div>
          <div className="mt-1 text-2xl font-bold text-neutral-900">
            {paidToday}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="text-sm font-medium text-neutral-600">
            New Sales Leads
          </div>
          <div className="mt-1 text-2xl font-bold text-neutral-900">
            {newLeads.length}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold text-neutral-900">
            Latest Orders
          </h2>

          {recentOrders.length === 0 ? (
            <div className="text-sm text-neutral-500">No orders found</div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((o) => (
                <div
                  key={o.id}
                  className="rounded-xl border border-neutral-200 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-neutral-900">
                        #{o.orderNumber || o.id.slice(0, 6)}
                      </div>
                      <div className="mt-1 text-sm text-neutral-600">
                        {o.customerName || "Unknown customer"}
                        {o.orderType ? ` · ${o.orderType}` : ""}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-semibold text-neutral-900">
                        £{money(Number(o.grandTotal || 0))}
                      </div>
                      <div className="mt-1 text-xs text-neutral-500 uppercase">
                        {o.status || "unknown"}
                      </div>
                    </div>
                  </div>

                  {o.cancelReason ? (
                    <div className="mt-2 text-xs text-red-600">
                      Cancel reason: {o.cancelReason}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold text-neutral-900">
            New Sales Leads
          </h2>

          {newLeads.length === 0 ? (
            <div className="text-sm text-neutral-500">No new sales leads</div>
          ) : (
            <div className="space-y-3">
              {newLeads.slice(0, 8).map((s) => (
                <div
                  key={s.id}
                  className="rounded-xl border border-neutral-200 p-3"
                >
                  <div className="font-medium text-neutral-900">
                    {s.fullName || "No name"}
                  </div>
                  <div className="mt-1 text-sm text-neutral-600">
                    {s.phone || "—"}
                    {s.area ? ` · ${s.area}` : ""}
                  </div>
                  {s.email ? (
                    <div className="mt-1 text-sm text-neutral-600">
                      {s.email}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}