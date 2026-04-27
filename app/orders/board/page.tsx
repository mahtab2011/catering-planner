"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { canAccess, getCurrentAccount, isPending } from "@/lib/authGuard";

type OrderType = "inhouse" | "takeaway" | "delivery";
type PaymentStatus = "paid" | "unpaid";

type OrderItem = {
  name: string;
  qty: number;
  note?: string;
};

type OrderDoc = {
  id: string;
  ownerUid?: string;
  orderNumber?: number;
  customerName?: string;
  customerPhone?: string;
  customerPostcode?: string;
  orderType?: OrderType;
  paymentStatus?: PaymentStatus;
  orderDate?: string;
  timeSlot?: string;
  slotLabel?: string;
  items?: OrderItem[];
  totalItems?: number;
  totalAmount?: number;
  fullPaymentRequired?: boolean;
  notes?: string;
  status?: string;
  source?: string;
  createdAt?: any;
  updatedAt?: any;
};

type SlotGroup = {
  timeSlot: string;
  slotLabel: string;
  orderCount: number;
  totalItems: number;
  totalAmount: number;
  itemSummary: { name: string; qty: number }[];
  orders: OrderDoc[];
};

type GuardAccount = {
  role: string | null;
  status: string | null;
};

function todayLocalYmd() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function to12HourLabel(value: string) {
  const [hh, mm] = value.split(":").map(Number);
  const ampm = hh >= 12 ? "PM" : "AM";
  const hour12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${hour12}:${String(mm).padStart(2, "0")} ${ampm}`;
}

function typeBadgeClass(orderType?: OrderType) {
  if (orderType === "delivery") {
    return "bg-sky-100 text-sky-700 border-sky-200";
  }
  if (orderType === "takeaway") {
    return "bg-amber-100 text-amber-700 border-amber-200";
  }
  return "bg-emerald-100 text-emerald-700 border-emerald-200";
}

function paymentBadgeClass(paymentStatus?: PaymentStatus) {
  if (paymentStatus === "paid") {
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  }
  return "bg-red-100 text-red-700 border-red-200";
}

function getRedirectPath(account: GuardAccount | null) {
  if (!account?.role) return "/create-account";

  if (account.role === "restaurant") {
    if (isPending(account)) return "/signup/restaurant/pending";
    return "/restaurants";
  }

  if (account.role === "supplier") return "/suppliers";
  if (account.role === "customer") return "/";
  if (account.role === "rider") return "/orders/rider";
  if (account.role === "catering_house") return "/events";

  if (account.role === "blackcab_partner") {
    if (isPending(account)) return "/signup/blackcab/pending";
    return "/blackcab";
  }

  if (account.role === "staff") return "/admin";

  return "/";
}

export default function OrdersBoardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [allowed, setAllowed] = useState(false);

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayLocalYmd());
  const [orders, setOrders] = useState<OrderDoc[]>([]);

  async function loadOrders(dateStr: string, uid: string) {
    try {
      setLoading(true);
      setMsg("Loading orders...");

      const q = query(
        collection(db, "orders"),
        where("ownerUid", "==", uid),
        where("orderDate", "==", dateStr),
        orderBy("timeSlot"),
        orderBy("createdAt")
      );

      const snap = await getDocs(q);

      const rows: OrderDoc[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<OrderDoc, "id">),
      }));

      setOrders(rows);
      setMsg(`✅ ${rows.length} order${rows.length === 1 ? "" : "s"} loaded`);
    } catch (error) {
      console.error(error);
      setMsg(
        "❌ Failed to load orders. If needed, create the Firestore index for ownerUid + orderDate + timeSlot + createdAt."
      );
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setAllowed(false);
        setCheckingAccess(false);
        setLoading(false);
        router.replace("/login");
        return;
      }

      try {
        const account = await getCurrentAccount();

        if (!account) {
          setUser(null);
          setAllowed(false);
          setCheckingAccess(false);
          setLoading(false);
          router.replace("/create-account");
          return;
        }

        if (!canAccess(account, ["restaurant", "staff"])) {
          setUser(currentUser);
          setAllowed(false);
          setCheckingAccess(false);
          setLoading(false);
          router.replace(getRedirectPath(account));
          return;
        }

        if (account.role === "restaurant" && isPending(account)) {
          setUser(currentUser);
          setAllowed(false);
          setCheckingAccess(false);
          setLoading(false);
          router.replace("/signup/restaurant/pending");
          return;
        }

        setUser(currentUser);
        setAllowed(true);
        setCheckingAccess(false);
        await loadOrders(selectedDate, currentUser.uid);
      } catch (error) {
        console.error("Orders board access check failed:", error);
        setAllowed(false);
        setCheckingAccess(false);
        setLoading(false);
        setMsg("❌ Could not verify access");
      }
    });

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    if (!allowed || !user?.uid) return;
    loadOrders(selectedDate, user.uid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, allowed, user?.uid]);

  useEffect(() => {
    if (!allowed || !user?.uid) return;

    const timer = setInterval(() => {
      loadOrders(selectedDate, user.uid);
    }, 30000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, allowed, user?.uid]);

  const groupedSlots = useMemo<SlotGroup[]>(() => {
    const map = new Map<string, SlotGroup>();

    for (const order of orders) {
      const timeSlot = order.timeSlot || "00:00";
      const slotLabel = order.slotLabel || to12HourLabel(timeSlot);

      if (!map.has(timeSlot)) {
        map.set(timeSlot, {
          timeSlot,
          slotLabel,
          orderCount: 0,
          totalItems: 0,
          totalAmount: 0,
          itemSummary: [],
          orders: [],
        });
      }

      const group = map.get(timeSlot)!;
      group.orderCount += 1;
      group.totalItems += Number(order.totalItems || 0);
      group.totalAmount += Number(order.totalAmount || 0);
      group.orders.push(order);

      const itemMap = new Map(group.itemSummary.map((it) => [it.name, it.qty]));

      for (const item of order.items || []) {
        const itemName = (item.name || "").trim();
        const qty = Number(item.qty || 0);

        if (!itemName || qty <= 0) continue;
        itemMap.set(itemName, Number(itemMap.get(itemName) || 0) + qty);
      }

      group.itemSummary = Array.from(itemMap.entries())
        .map(([name, qty]) => ({ name, qty }))
        .sort((a, b) => b.qty - a.qty || a.name.localeCompare(b.name));
    }

    return Array.from(map.values()).sort((a, b) =>
      a.timeSlot.localeCompare(b.timeSlot)
    );
  }, [orders]);

  const totals = useMemo(() => {
    const totalOrders = orders.length;
    const totalItems = orders.reduce(
      (sum, order) => sum + Number(order.totalItems || 0),
      0
    );
    const totalAmount = orders.reduce(
      (sum, order) => sum + Number(order.totalAmount || 0),
      0
    );
    const paidCount = orders.filter((o) => o.paymentStatus === "paid").length;
    const unpaidCount = orders.filter((o) => o.paymentStatus === "unpaid").length;

    return { totalOrders, totalItems, totalAmount, paidCount, unpaidCount };
  }, [orders]);

  if (checkingAccess) {
    return (
      <main className="mx-auto w-full max-w-7xl p-6">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600 shadow-sm">
          Checking access...
        </div>
      </main>
    );
  }

  if (!allowed) {
    return (
      <main className="mx-auto w-full max-w-7xl p-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800 shadow-sm">
          You do not have access to the order board.
        </div>
      </main>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            Live Order Board
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Orders grouped by time slot for kitchen and cashier view.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            />
          </div>

          <button
            type="button"
            onClick={() => user?.uid && loadOrders(selectedDate, user.uid)}
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Refresh
          </button>

          <Link
            href="/orders/new"
            className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            + New Order
          </Link>
        </div>
      </div>

      <div className="mt-4 text-sm font-medium text-neutral-700">{msg}</div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Total Orders
          </div>
          <div className="mt-2 text-3xl font-bold text-neutral-900">
            {totals.totalOrders}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Total Items
          </div>
          <div className="mt-2 text-3xl font-bold text-neutral-900">
            {totals.totalItems}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Total Amount
          </div>
          <div className="mt-2 text-3xl font-bold text-neutral-900">
            £{totals.totalAmount.toFixed(2)}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Paid
          </div>
          <div className="mt-2 text-3xl font-bold text-emerald-700">
            {totals.paidCount}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Unpaid
          </div>
          <div className="mt-2 text-3xl font-bold text-red-600">
            {totals.unpaidCount}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600 shadow-sm">
          Loading board...
        </div>
      ) : groupedSlots.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600 shadow-sm">
          No orders found for this date.
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {groupedSlots.map((slot) => (
            <div
              key={slot.timeSlot}
              className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-3 border-b border-neutral-200 pb-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-2xl font-bold text-neutral-900">
                    {slot.slotLabel}
                  </div>
                  <div className="mt-1 text-sm text-neutral-600">
                    {slot.orderCount} order{slot.orderCount === 1 ? "" : "s"} ·{" "}
                    {slot.totalItems} item{slot.totalItems === 1 ? "" : "s"} · £
                    {slot.totalAmount.toFixed(2)}
                  </div>
                </div>

                <div className="rounded-xl bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
                  <span className="font-semibold text-neutral-900">
                    Key Items:
                  </span>{" "}
                  {slot.itemSummary.length > 0
                    ? slot.itemSummary
                        .slice(0, 6)
                        .map((it) => `${it.name} x ${it.qty}`)
                        .join(", ")
                    : "No items"}
                </div>
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-2">
                {slot.orders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="text-lg font-semibold text-neutral-900">
                          Order #{order.orderNumber || "—"}
                        </div>
                        <div className="mt-1 text-sm text-neutral-700">
                          {order.customerName || "Unknown Customer"}
                        </div>
                        <div className="mt-1 text-sm text-neutral-500">
                          {order.customerPhone || "No phone"}
                          {order.customerPostcode
                            ? ` · ${order.customerPostcode}`
                            : ""}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${typeBadgeClass(
                            order.orderType
                          )}`}
                        >
                          {(order.orderType || "inhouse").toUpperCase()}
                        </span>

                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${paymentBadgeClass(
                            order.paymentStatus
                          )}`}
                        >
                          {(order.paymentStatus || "unpaid").toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Items
                      </div>

                      <div className="space-y-2">
                        {(order.items || []).map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-start justify-between gap-3 rounded-xl bg-white px-3 py-2"
                          >
                            <div>
                              <div className="text-sm font-medium text-neutral-900">
                                {item.name}
                              </div>
                              {item.note ? (
                                <div className="text-xs text-neutral-500">
                                  Note: {item.note}
                                </div>
                              ) : null}
                            </div>

                            <div className="text-sm font-semibold text-neutral-700">
                              x {item.qty}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-neutral-200 pt-3 text-sm text-neutral-700">
                      <div>
                        <span className="font-semibold text-neutral-900">
                          Total Items:
                        </span>{" "}
                        {order.totalItems || 0}
                      </div>
                      <div>
                        <span className="font-semibold text-neutral-900">
                          Amount:
                        </span>{" "}
                        £{Number(order.totalAmount || 0).toFixed(2)}
                      </div>
                      <div>
                        <span className="font-semibold text-neutral-900">
                          Status:
                        </span>{" "}
                        {order.status || "new"}
                      </div>
                    </div>

                    {order.notes ? (
                      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                        <span className="font-semibold">Order Note:</span>{" "}
                        {order.notes}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-sky-100 bg-sky-50 p-4 text-xs text-sky-800">
        Security note: this page is protected by login + role check, and it now
        loads only orders where{" "}
        <span className="font-bold">
          ownerUid === current logged-in user uid
        </span>{" "}
        and the selected order date match.
      </div>
    </div>
  );
}