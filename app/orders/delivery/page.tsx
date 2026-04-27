"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  increment,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type OrderItem = {
  name: string;
  qty: number;
  note?: string;
};

type DeliveryStatus =
  | "waiting"
  | "assigned"
  | "ready_for_pickup"
  | "picked_up"
  | "delivered";

type OrderStatus =
  | "new"
  | "accepted"
  | "preparing"
  | "ready"
  | "ready_for_pickup"
  | "ready_for_delivery"
  | "served"
  | "out_for_delivery"
  | "picked_up"
  | "delivered"
  | "cancelled";

type OrderDoc = {
  id: string;
  ownerUid?: string;
  restaurantId?: string;
  restaurantName?: string;
  orderNumber?: number | string;
  customerName?: string;
  customerPhone?: string;
  customerPostcode?: string;
  address?: string;
  orderType?: string;
  paymentStatus?: string;
  slotLabel?: string;
  timeSlot?: string;
  items?: OrderItem[];
  status?: OrderStatus | string;
  deliveryStatus?: DeliveryStatus;
  riderId?: string;
  riderName?: string;
  assignedAt?: any;
  pickedUpAt?: any;
  deliveredAt?: any;
  countedInRiderStats?: boolean;
  createdAt?: any;
  updatedAt?: any;
};

type RiderDoc = {
  id: string;
  ownerUid?: string;
  restaurantId?: string;
  restaurantName?: string;
  name?: string;
  phone?: string;
  currentStatus?: string;
  currentOrderId?: string;
  deliveriesCompleted?: number;
  deliveriesToday?: number;
  deliveriesThisWeek?: number;
  deliveriesThisMonth?: number;
  lastDailyResetKey?: string;
  lastWeeklyResetKey?: string;
  lastMonthlyResetKey?: string;
  lastAssignedAt?: any;
  lastPickedUpAt?: any;
  lastDeliveredAt?: any;
  outSince?: any;
  returnedAt?: any;
  updatedAt?: any;
  liveLat?: number;
  liveLng?: number;
  liveAccuracy?: number;
  liveHeading?: number;
  liveSpeed?: number;
  liveLocationUpdatedAt?: any;
  isLocationSharing?: boolean;
};

function cleanText(value?: string) {
  return (value || "").trim().toLowerCase();
}

function getStatusPillClass(status?: string) {
  switch (cleanText(status)) {
    case "ready_for_pickup":
    case "ready_for_delivery":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "assigned":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "out_for_delivery":
    case "picked_up":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "delivered":
      return "border-neutral-200 bg-neutral-100 text-neutral-700";
    case "new":
    case "accepted":
    case "preparing":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-neutral-200 bg-neutral-50 text-neutral-700";
  }
}

function getRiderStatusPillClass(status?: string) {
  switch (cleanText(status)) {
    case "available":
    case "waiting_at_restaurant":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "assigned":
    case "ready_for_delivery":
    case "ready_for_pickup":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "out_for_delivery":
    case "picked_up":
    case "on_delivery":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "awaiting_return":
      return "border-violet-200 bg-violet-50 text-violet-700";
    default:
      return "border-neutral-200 bg-neutral-50 text-neutral-700";
  }
}

function formatStatusLabel(status?: string) {
  if (!status) return "waiting";
  return status.replace(/_/g, " ");
}

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

function getRiderPriority(status?: string) {
  switch (cleanText(status)) {
    case "available":
      return 1;
    case "waiting_at_restaurant":
      return 2;
    case "assigned":
      return 3;
    case "ready_for_delivery":
    case "ready_for_pickup":
      return 4;
    case "out_for_delivery":
    case "picked_up":
    case "on_delivery":
      return 8;
    case "awaiting_return":
      return 9;
    default:
      return 99;
  }
}

function riderCanBeAssigned(rider?: RiderDoc) {
  const status = cleanText(rider?.currentStatus);
  return (
    status === "available" ||
    status === "waiting_at_restaurant" ||
    status === "assigned" ||
    status === "ready_for_delivery" ||
    status === "ready_for_pickup"
  );
}

function getAssignableRidersForOrder(order: OrderDoc, allRiders: RiderDoc[]) {
  const currentOrderId = order.id;

  return [...allRiders]
    .filter((rider) => {
      const status = cleanText(rider.currentStatus);

      if (rider.id === order.riderId) return true;

      if (
        status === "out_for_delivery" ||
        status === "picked_up" ||
        status === "on_delivery" ||
        status === "awaiting_return"
      ) {
        return false;
      }

      if (rider.currentOrderId && rider.currentOrderId !== currentOrderId) {
        return false;
      }

      return riderCanBeAssigned(rider);
    })
    .sort((a, b) => {
      const priorityDiff =
        getRiderPriority(a.currentStatus) - getRiderPriority(b.currentStatus);

      if (priorityDiff !== 0) return priorityDiff;

      return (a.name || a.id).localeCompare(b.name || b.id);
    });
}

function getDailyKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getMonthlyKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function getWeeklyKey() {
  const now = new Date();
  const date = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  );
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export default function DeliveryPage() {
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [riders, setRiders] = useState<RiderDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  const [ownerUid, setOwnerUid] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setOwnerUid(user?.uid || "");
      setOwnerName(user?.displayName || "");
      setOwnerEmail(user?.email || "");
      setLoading(false);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!ownerUid) {
      setOrders([]);
      return;
    }

    setLoading(true);

    const q = query(
      collection(db, "orders"),
      where("ownerUid", "==", ownerUid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data: OrderDoc[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<OrderDoc, "id">),
        }));

        const deliveryOrders = data
          .filter((o) => cleanText(o.orderType) === "delivery")
          .filter((o) => cleanText(o.status) !== "cancelled");

        setOrders(deliveryOrders);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setMsg("❌ Failed to load delivery orders");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [ownerUid]);

  useEffect(() => {
    if (!ownerUid) {
      setRiders([]);
      return;
    }

    const q = query(
      collection(db, "riders"),
      where("ownerUid", "==", ownerUid),
      orderBy("name")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data: RiderDoc[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<RiderDoc, "id">),
        }));
        setRiders(data);
      },
      (err) => {
        console.error(err);
        setMsg("❌ Failed to load riders");
      }
    );

    return () => unsub();
  }, [ownerUid]);

  async function ensureRiderCountersAreFresh(rider?: RiderDoc) {
    if (!rider?.id) return;

    const dailyKey = getDailyKey();
    const weeklyKey = getWeeklyKey();
    const monthlyKey = getMonthlyKey();

    const updates: Record<string, any> = {};

    if (rider.lastDailyResetKey !== dailyKey) {
      updates.deliveriesToday = 0;
      updates.lastDailyResetKey = dailyKey;
    }

    if (rider.lastWeeklyResetKey !== weeklyKey) {
      updates.deliveriesThisWeek = 0;
      updates.lastWeeklyResetKey = weeklyKey;
    }

    if (rider.lastMonthlyResetKey !== monthlyKey) {
      updates.deliveriesThisMonth = 0;
      updates.lastMonthlyResetKey = monthlyKey;
    }

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = serverTimestamp();
      await updateDoc(doc(db, "riders", rider.id), updates);
    }
  }

  async function assignRider(
    order: OrderDoc,
    riderId: string,
    riderName: string
  ) {
    try {
      setUpdatingId(order.id);
      setMsg("Assigning rider...");

      const currentStatus = cleanText(order.status);
      const orderIsReady =
        currentStatus === "ready_for_pickup" ||
        currentStatus === "ready_for_delivery";

      await updateDoc(doc(db, "orders", order.id), {
        ownerUid: order.ownerUid || ownerUid || "",
        restaurantId: order.restaurantId || "",
        restaurantName: order.restaurantName || "",
        riderId,
        riderName,
        deliveryStatus: orderIsReady ? "ready_for_pickup" : "assigned",
        assignedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "riders", riderId), {
        ownerUid: ownerUid || "",
        restaurantId: order.restaurantId || "",
        restaurantName: order.restaurantName || "",
        currentStatus: orderIsReady ? "ready_for_pickup" : "assigned",
        currentOrderId: order.id,
        lastAssignedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setMsg(`✅ ${riderName} assigned`);
    } catch (err) {
      console.error(err);
      setMsg("❌ Failed to assign rider");
    } finally {
      setUpdatingId("");
    }
  }

  async function markPickedUp(orderId: string, riderId?: string) {
    try {
      setUpdatingId(orderId);
      setMsg("Updating delivery status...");

      await updateDoc(doc(db, "orders", orderId), {
        status: "out_for_delivery",
        deliveryStatus: "picked_up",
        pickedUpAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      if (riderId) {
        await updateDoc(doc(db, "riders", riderId), {
          currentStatus: "picked_up",
          currentOrderId: orderId,
          lastPickedUpAt: serverTimestamp(),
          outSince: serverTimestamp(),
          returnedAt: null,
          updatedAt: serverTimestamp(),
        });
      }

      setMsg("✅ Order marked as picked up");
    } catch (err) {
      console.error(err);
      setMsg("❌ Failed to update delivery status");
    } finally {
      setUpdatingId("");
    }
  }

  async function markDelivered(orderId: string, riderId?: string) {
    try {
      setUpdatingId(orderId);
      setMsg("Updating delivery status...");

      const order = orders.find((o) => o.id === orderId);
      const alreadyCounted = order?.countedInRiderStats === true;

      await updateDoc(doc(db, "orders", orderId), {
        status: "delivered",
        deliveryStatus: "delivered",
        deliveredAt: serverTimestamp(),
        countedInRiderStats: true,
        updatedAt: serverTimestamp(),
      });

      if (riderId) {
        const rider = riders.find((r) => r.id === riderId);
        await ensureRiderCountersAreFresh(rider);

        const riderUpdate: Record<string, any> = {
          currentStatus: "awaiting_return",
          currentOrderId: "",
          lastDeliveredAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        if (!alreadyCounted) {
          riderUpdate.deliveriesCompleted = increment(1);
          riderUpdate.deliveriesToday = increment(1);
          riderUpdate.deliveriesThisWeek = increment(1);
          riderUpdate.deliveriesThisMonth = increment(1);
          riderUpdate.lastDailyResetKey = getDailyKey();
          riderUpdate.lastWeeklyResetKey = getWeeklyKey();
          riderUpdate.lastMonthlyResetKey = getMonthlyKey();
        }

        await updateDoc(doc(db, "riders", riderId), riderUpdate);
      }

      setMsg("✅ Order marked as delivered");
    } catch (err) {
      console.error(err);
      setMsg("❌ Failed to update delivery status");
    } finally {
      setUpdatingId("");
    }
  }

  const waiting = useMemo(
    () =>
      orders.filter((o) => {
        const status = cleanText(o.status);
        return (
          status === "new" ||
          status === "accepted" ||
          status === "preparing" ||
          !status
        );
      }),
    [orders]
  );

  const ready = useMemo(
    () =>
      orders.filter((o) => {
        const status = cleanText(o.status);
        return status === "ready_for_pickup" || status === "ready_for_delivery";
      }),
    [orders]
  );

  const outForDelivery = useMemo(
    () =>
      orders.filter((o) => {
        const status = cleanText(o.status);
        return status === "out_for_delivery" || status === "picked_up";
      }),
    [orders]
  );

  const delivered = useMemo(
    () => orders.filter((o) => cleanText(o.status) === "delivered"),
    [orders]
  );

  const assignableRiders = useMemo(
    () =>
      [...riders]
        .filter((r) => riderCanBeAssigned(r))
        .sort((a, b) => {
          const priorityDiff =
            getRiderPriority(a.currentStatus) -
            getRiderPriority(b.currentStatus);

          if (priorityDiff !== 0) return priorityDiff;

          return (a.name || a.id).localeCompare(b.name || b.id);
        }),
    [riders]
  );

  if (loading) {
    return (
      <div className="p-6 text-center text-neutral-600">
        Loading delivery board...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8faf7]">
      <div className="mx-auto max-w-5xl p-6">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              🚚 Delivery Board
            </h1>
            <p className="mt-1 text-sm text-neutral-600">
              Owner-specific delivery view for orders, rider assignment, and delivery progress.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href="/orders/rider"
              className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Rider View
            </a>

            <a
              href="/orders/riders"
              className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Rider Control
            </a>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Refresh
            </button>
          </div>
        </div>

        {msg ? (
          <div className="mb-4 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-700">
            {msg}
          </div>
        ) : null}

        <div className="mb-4 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700">
          Signed in as:{" "}
          <span className="font-semibold text-neutral-900">
            {ownerName || ownerEmail || ownerUid || "Unknown owner"}
          </span>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Waiting: <b>{waiting.length}</b>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            Ready for Rider: <b>{ready.length}</b>
          </div>

          <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800">
            Out for Delivery: <b>{outForDelivery.length}</b>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-3 text-sm text-neutral-800">
            Delivered: <b>{delivered.length}</b>
          </div>

          <div className="rounded-xl border border-violet-200 bg-violet-50 p-3 text-sm text-violet-800">
            Assignable Riders: <b>{assignableRiders.length}</b>
          </div>
        </div>

        <Section
          title="Waiting for Kitchen"
          orders={waiting}
          allRiders={riders}
          emptyText="No waiting delivery orders"
          updatingId={updatingId}
          onAssignRider={assignRider}
          onPickUp={markPickedUp}
          onDeliver={markDelivered}
        />

        <Section
          title="Ready for Rider"
          orders={ready}
          allRiders={riders}
          emptyText="No delivery orders ready for rider"
          updatingId={updatingId}
          onAssignRider={assignRider}
          onPickUp={markPickedUp}
          onDeliver={markDelivered}
        />

        <Section
          title="Out for Delivery"
          orders={outForDelivery}
          allRiders={riders}
          emptyText="No orders currently out for delivery"
          updatingId={updatingId}
          onAssignRider={assignRider}
          onPickUp={markPickedUp}
          onDeliver={markDelivered}
        />

        <Section
          title="Delivered"
          orders={delivered}
          allRiders={riders}
          emptyText="No delivered orders yet"
          updatingId={updatingId}
          onAssignRider={assignRider}
          onPickUp={markPickedUp}
          onDeliver={markDelivered}
        />
      </div>
    </div>
  );
}

function Section({
  title,
  orders,
  allRiders,
  emptyText,
  updatingId,
  onAssignRider,
  onPickUp,
  onDeliver,
}: {
  title: string;
  orders: OrderDoc[];
  allRiders: RiderDoc[];
  emptyText: string;
  updatingId: string;
  onAssignRider: (order: OrderDoc, riderId: string, riderName: string) => void;
  onPickUp: (orderId: string, riderId?: string) => void;
  onDeliver: (orderId: string, riderId?: string) => void;
}) {
  return (
    <div className="mb-8">
      <h2 className="mb-3 text-lg font-semibold text-neutral-900">{title}</h2>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-4 text-sm text-neutral-500 shadow-sm">
          {emptyText}
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const itemSummary =
              o.items?.map((i) => `${i.name} × ${i.qty}`).join(", ") ||
              "No items";

            const currentRider = o.riderId
              ? allRiders.find((r) => r.id === o.riderId)
              : null;

            const ridersForThisOrder = getAssignableRidersForOrder(o, allRiders);
            const status = cleanText(o.status);

            return (
              <div
                key={o.id}
                className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-base font-semibold text-neutral-900">
                      Order #{o.orderNumber || o.id.slice(0, 6)}
                    </div>

                    <div className="mt-1 text-sm text-neutral-700">
                      {o.customerName || "Unknown Customer"}
                      {o.customerPhone ? ` • ${o.customerPhone}` : ""}
                      {o.customerPostcode ? ` • ${o.customerPostcode}` : ""}
                    </div>

                    <div className="mt-1 text-sm text-neutral-500">
                      {o.slotLabel || o.timeSlot || "No time slot"}
                    </div>

                    {o.address ? (
                      <div className="mt-1 text-sm text-neutral-500">
                        {o.address}
                      </div>
                    ) : null}

                    {o.riderName ? (
                      <div className="mt-2 space-y-1">
                        <div className="text-sm font-medium text-sky-700">
                          Rider: {o.riderName}
                        </div>

                        {currentRider ? (
                          <>
                            <div className="flex flex-wrap gap-2">
                              <span
                                className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getRiderStatusPillClass(
                                  currentRider.currentStatus
                                )}`}
                              >
                                {formatStatusLabel(currentRider.currentStatus)}
                              </span>

                              {currentRider.isLocationSharing ? (
                                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                  Live tracking on
                                </span>
                              ) : (
                                <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-semibold text-neutral-700">
                                  Live tracking off
                                </span>
                              )}
                            </div>

                            <div className="text-xs text-neutral-500">
                              Completed deliveries:{" "}
                              <span className="font-semibold text-neutral-700">
                                {currentRider.deliveriesCompleted || 0}
                              </span>
                            </div>

                            {typeof currentRider.liveLat === "number" &&
                            typeof currentRider.liveLng === "number" ? (
                              <div className="text-xs text-neutral-500">
                                Live: {currentRider.liveLat.toFixed(5)},{" "}
                                {currentRider.liveLng.toFixed(5)}
                              </div>
                            ) : null}

                            <div className="text-xs text-neutral-500">
                              Last location update:{" "}
                              <span className="font-medium text-neutral-700">
                                {formatDateTime(
                                  currentRider.liveLocationUpdatedAt
                                )}
                              </span>
                            </div>
                          </>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-semibold text-neutral-700">
                      {o.paymentStatus || "unknown"}
                    </span>

                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${getStatusPillClass(
                        o.status
                      )}`}
                    >
                      {formatStatusLabel(o.status)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 text-sm text-neutral-600">
                  {itemSummary}
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  {(status === "new" ||
                    status === "accepted" ||
                    status === "preparing" ||
                    status === "ready_for_delivery" ||
                    status === "ready_for_pickup") ? (
                    <select
                      value=""
                      onChange={(e) => {
                        const riderId = e.target.value;
                        if (!riderId) return;

                        const riderName =
                          allRiders.find((r) => r.id === riderId)?.name ||
                          riderId;

                        onAssignRider(o, riderId, riderName);
                      }}
                      disabled={updatingId === o.id}
                      className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">
                        {o.riderId ? "Reassign Rider" : "Assign Rider"}
                      </option>
                      {ridersForThisOrder.map((r) => (
                        <option key={r.id} value={r.id}>
                          {(r.name || r.id) +
                            " — " +
                            formatStatusLabel(r.currentStatus)}
                        </option>
                      ))}
                    </select>
                  ) : null}

                  {(status === "ready_for_delivery" ||
                    status === "ready_for_pickup") ? (
                    <button
                      type="button"
                      onClick={() => onPickUp(o.id, o.riderId)}
                      disabled={updatingId === o.id || !o.riderId}
                      className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {updatingId === o.id ? "Updating..." : "Pick Up"}
                    </button>
                  ) : null}

                  {(status === "out_for_delivery" || status === "picked_up") ? (
                    <button
                      type="button"
                      onClick={() => onDeliver(o.id, o.riderId)}
                      disabled={updatingId === o.id}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {updatingId === o.id ? "Updating..." : "Mark Delivered"}
                    </button>
                  ) : null}

                  {status === "delivered" ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                      ✅ Delivered
                    </div>
                  ) : null}

                  {(status === "new" ||
                    status === "accepted" ||
                    status === "preparing" ||
                    !status) ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700">
                      Waiting for kitchen
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}