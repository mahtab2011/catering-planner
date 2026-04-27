"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type OrderType = "inhouse" | "takeaway" | "delivery";
type PaymentStatus = "paid" | "unpaid";
type KitchenStatus = "pending" | "in_progress" | "ready" | "served";
type DayRelation = "past" | "today" | "future";
type PlanningPriority = "urgent" | "high" | "normal" | "low";

type OrderItem = {
  lineId?: string;
  name: string;
  qty: number;
  note?: string;
  kitchenStatus?: KitchenStatus;
  startedAt?: string | null;
  readyAt?: string | null;
};

type OrderDoc = {
  id: string;
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

type KitchenTask = {
  id: string;
  orderId: string;
  lineId: string;
  orderNumber: number | string;
  customerName: string;
  orderType: OrderType;
  paymentStatus: PaymentStatus;
  itemName: string;
  qty: number;
  note: string;
  orderTimeSlot: string;
  slotLabel: string;
  prepMinutes: number;
  startAtMinute: number;
  dueAtMinute: number;
  startAtLabel: string;
  dueAtLabel: string;
  urgency: "late" | "now" | "upcoming" | "later";
  planningPriority: PlanningPriority;
  kitchenStatus: KitchenStatus;
  countdownLabel: string;
  countdownTone: "late" | "warning" | "normal" | "future";
  minutesToDue: number;
  minutesToStart: number;
};

type TimeSlotGroup = {
  slotKey: string;
  slotLabel: string;
  orderCount: number;
  taskCount: number;
  totalQty: number;
  pendingCount: number;
  inProgressCount: number;
  readyCount: number;
  servedCount: number;
  items: { name: string; qty: number }[];
  tasks: KitchenTask[];
};

const PREP_MINUTES: Record<string, number> = {
  "Kacchi Biryani": 25,
  "Chicken Biryani": 20,
  "Beef Tehari": 20,
  "Chicken Roast": 15,
  "Grilled Chicken": 18,
  Burger: 10,
  "Pizza Slice": 8,
  Salad: 5,
  Borhani: 5,
  Firni: 5,
};

function todayLocalYmd() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDaysLocalYmd(baseYmd: string, days: number) {
  const [y, m, d] = baseYmd.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);

  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function formatDateLong(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getDayRelation(selectedDate: string): DayRelation {
  const today = todayLocalYmd();
  if (selectedDate === today) return "today";
  return selectedDate < today ? "past" : "future";
}

function to12HourLabel(value: string) {
  const [hh, mm] = value.split(":").map(Number);
  const ampm = hh >= 12 ? "PM" : "AM";
  const hour12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${hour12}:${String(mm).padStart(2, "0")} ${ampm}`;
}

function timeSlotToMinute(value?: string) {
  if (!value || !value.includes(":")) return 0;
  const [hh, mm] = value.split(":").map(Number);
  return hh * 60 + mm;
}

function minuteToLabel(totalMinutes: number) {
  const safe = Math.max(0, totalMinutes);
  const hh = Math.floor(safe / 60);
  const mm = safe % 60;
  return to12HourLabel(
    `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`
  );
}

function getPrepMinutes(itemName: string) {
  const exact = PREP_MINUTES[itemName];
  if (exact) return exact;

  const lower = itemName.toLowerCase();

  if (lower.includes("kacchi")) return 25;
  if (lower.includes("biryani")) return 20;
  if (lower.includes("tehari")) return 20;
  if (lower.includes("roast")) return 15;
  if (lower.includes("grill")) return 18;
  if (lower.includes("burger")) return 10;
  if (lower.includes("pizza")) return 8;
  if (lower.includes("salad")) return 5;
  if (lower.includes("borhani")) return 5;
  if (lower.includes("firni")) return 5;

  return 10;
}

function getUrgency(
  startAtMinute: number,
  nowMinute: number,
  dayRelation: DayRelation
): KitchenTask["urgency"] {
  if (dayRelation === "past") return "late";
  if (dayRelation === "future") return "later";

  if (startAtMinute < nowMinute) return "late";
  if (startAtMinute <= nowMinute + 5) return "now";
  if (startAtMinute <= nowMinute + 30) return "upcoming";
  return "later";
}

function getPlanningPriority(prepMinutes: number): PlanningPriority {
  if (prepMinutes >= 20) return "urgent";
  if (prepMinutes >= 15) return "high";
  if (prepMinutes >= 10) return "normal";
  return "low";
}

function getCountdownInfo(
  dueAtMinute: number,
  startAtMinute: number,
  nowMinute: number,
  dayRelation: DayRelation
) {
  if (dayRelation === "future") {
    return {
      countdownLabel: "Future order",
      countdownTone: "future" as const,
      minutesToDue: dueAtMinute - nowMinute,
      minutesToStart: startAtMinute - nowMinute,
    };
  }

  if (dayRelation === "past") {
    return {
      countdownLabel: "Past date",
      countdownTone: "late" as const,
      minutesToDue: dueAtMinute - nowMinute,
      minutesToStart: startAtMinute - nowMinute,
    };
  }

  const minutesToDue = dueAtMinute - nowMinute;
  const minutesToStart = startAtMinute - nowMinute;

  if (minutesToDue < 0) {
    return {
      countdownLabel: `${Math.abs(minutesToDue)} min late`,
      countdownTone: "late" as const,
      minutesToDue,
      minutesToStart,
    };
  }

  if (minutesToDue <= 10) {
    return {
      countdownLabel: `${minutesToDue} min left`,
      countdownTone: "warning" as const,
      minutesToDue,
      minutesToStart,
    };
  }

  if (minutesToStart > 0) {
    return {
      countdownLabel: `Start in ${minutesToStart} min`,
      countdownTone: "future" as const,
      minutesToDue,
      minutesToStart,
    };
  }

  return {
    countdownLabel: `${minutesToDue} min left`,
    countdownTone: "normal" as const,
    minutesToDue,
    minutesToStart,
  };
}

function urgencyContainerClass(urgency: KitchenTask["urgency"]) {
  if (urgency === "late") return "border-red-300 bg-red-50";
  if (urgency === "now") return "border-amber-300 bg-amber-50";
  if (urgency === "upcoming") return "border-sky-300 bg-sky-50";
  return "border-neutral-200 bg-white";
}

function urgencyLeftBorderClass(urgency: KitchenTask["urgency"]) {
  if (urgency === "late") return "border-l-red-500";
  if (urgency === "now") return "border-l-amber-500";
  if (urgency === "upcoming") return "border-l-sky-500";
  return "border-l-neutral-300";
}

function urgencyBadgeClass(urgency: KitchenTask["urgency"]) {
  if (urgency === "late") return "border-red-200 bg-red-100 text-red-700";
  if (urgency === "now") return "border-amber-200 bg-amber-100 text-amber-700";
  if (urgency === "upcoming") {
    return "border-sky-200 bg-sky-100 text-sky-700";
  }
  return "border-neutral-200 bg-neutral-100 text-neutral-700";
}

function priorityBadgeClass(priority: PlanningPriority) {
  if (priority === "urgent") {
    return "border-red-200 bg-red-100 text-red-700";
  }
  if (priority === "high") {
    return "border-amber-200 bg-amber-100 text-amber-700";
  }
  if (priority === "normal") {
    return "border-sky-200 bg-sky-100 text-sky-700";
  }
  return "border-emerald-200 bg-emerald-100 text-emerald-700";
}

function countdownBadgeClass(tone: KitchenTask["countdownTone"]) {
  if (tone === "late") return "border-red-200 bg-red-100 text-red-700";
  if (tone === "warning") {
    return "border-amber-200 bg-amber-100 text-amber-700";
  }
  if (tone === "future") return "border-sky-200 bg-sky-100 text-sky-700";
  return "border-emerald-200 bg-emerald-100 text-emerald-700";
}

function typeBadgeClass(orderType?: OrderType) {
  if (orderType === "delivery") {
    return "border-sky-200 bg-sky-100 text-sky-700";
  }
  if (orderType === "takeaway") {
    return "border-amber-200 bg-amber-100 text-amber-700";
  }
  return "border-emerald-200 bg-emerald-100 text-emerald-700";
}

function paymentBadgeClass(paymentStatus?: PaymentStatus) {
  if (paymentStatus === "paid") {
    return "border-emerald-200 bg-emerald-100 text-emerald-700";
  }
  return "border-red-200 bg-red-100 text-red-700";
}

function kitchenStatusBadgeClass(status: KitchenStatus) {
  if (status === "served") {
    return "border-sky-200 bg-sky-100 text-sky-700";
  }
  if (status === "ready") {
    return "border-emerald-200 bg-emerald-100 text-emerald-700";
  }
  if (status === "in_progress") {
    return "border-amber-200 bg-amber-100 text-amber-700";
  }
  return "border-neutral-200 bg-neutral-100 text-neutral-700";
}

function kitchenStatusLabel(status: KitchenStatus) {
  if (status === "served") return "SERVED";
  if (status === "in_progress") return "IN PROGRESS";
  if (status === "ready") return "READY";
  return "PENDING";
}

function urgencyRank(urgency: KitchenTask["urgency"]) {
  if (urgency === "late") return 1;
  if (urgency === "now") return 2;
  if (urgency === "upcoming") return 3;
  return 4;
}

function priorityRank(priority: PlanningPriority) {
  if (priority === "urgent") return 1;
  if (priority === "high") return 2;
  if (priority === "normal") return 3;
  return 4;
}

export default function KitchenPage() {
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayLocalYmd());
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [nowTick, setNowTick] = useState(Date.now());
  const [updatingTaskId, setUpdatingTaskId] = useState("");
  const previousLateIdsRef = useRef<string[]>([]);

  const todayDate = todayLocalYmd();
  const tomorrowDate = addDaysLocalYmd(todayDate, 1);
  const dayAfterDate = addDaysLocalYmd(todayDate, 2);
  const dayRelation = getDayRelation(selectedDate);

  async function loadOrders(dateStr: string) {
    try {
      setLoading(true);
      setMsg("Loading kitchen tasks...");

      const q = query(
        collection(db, "orders"),
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
    } catch (error: any) {
      console.error("Kitchen load error:", error);
      setMsg(`❌ ${error?.message || "Failed to load kitchen tasks"}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    const refreshTimer = setInterval(() => {
      loadOrders(selectedDate);
    }, 30000);

    return () => clearInterval(refreshTimer);
  }, [selectedDate]);

  useEffect(() => {
    const tickTimer = setInterval(() => {
      setNowTick(Date.now());
    }, 15000);

    return () => clearInterval(tickTimer);
  }, []);

  const nowInfo = useMemo(() => {
    const now = new Date(nowTick);
    const nowMinute = now.getHours() * 60 + now.getMinutes();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");

    return {
      nowMinute,
      nowLabel: to12HourLabel(`${hh}:${mm}`),
    };
  }, [nowTick]);

  const tasks = useMemo<KitchenTask[]>(() => {
    const result: KitchenTask[] = [];

    for (const order of orders) {
      const dueAtMinute = timeSlotToMinute(order.timeSlot);
      const slotLabel =
        order.slotLabel || to12HourLabel(order.timeSlot || "00:00");

      for (const item of order.items || []) {
        const itemName = (item.name || "").trim();
        const qty = Number(item.qty || 0);

        if (!itemName || qty <= 0) continue;

        const prepMinutes = getPrepMinutes(itemName);
        const startAtMinute = dueAtMinute - prepMinutes;
        const urgency = getUrgency(
          startAtMinute,
          nowInfo.nowMinute,
          dayRelation
        );
        const planningPriority = getPlanningPriority(prepMinutes);
        const countdown = getCountdownInfo(
          dueAtMinute,
          startAtMinute,
          nowInfo.nowMinute,
          dayRelation
        );

        result.push({
          id: `${order.id}-${item.lineId || itemName}`,
          orderId: order.id,
          lineId: item.lineId || `${order.id}-${itemName}`,
          orderNumber: order.orderNumber || "—",
          customerName: order.customerName || "Unknown Customer",
          orderType: order.orderType || "inhouse",
          paymentStatus: order.paymentStatus || "unpaid",
          itemName,
          qty,
          note: item.note || "",
          orderTimeSlot: order.timeSlot || "00:00",
          slotLabel,
          prepMinutes,
          startAtMinute,
          dueAtMinute,
          startAtLabel: minuteToLabel(startAtMinute),
          dueAtLabel: minuteToLabel(dueAtMinute),
          urgency,
          planningPriority,
          kitchenStatus: item.kitchenStatus || "pending",
          countdownLabel: countdown.countdownLabel,
          countdownTone: countdown.countdownTone,
          minutesToDue: countdown.minutesToDue,
          minutesToStart: countdown.minutesToStart,
        });
      }
    }

    return result.sort((a, b) => {
      if (a.kitchenStatus !== b.kitchenStatus) {
        const statusMap: Record<KitchenStatus, number> = {
          pending: 1,
          in_progress: 2,
          ready: 3,
          served: 4,
        };
        return statusMap[a.kitchenStatus] - statusMap[b.kitchenStatus];
      }

      if (urgencyRank(a.urgency) !== urgencyRank(b.urgency)) {
        return urgencyRank(a.urgency) - urgencyRank(b.urgency);
      }

      if (
        priorityRank(a.planningPriority) !== priorityRank(b.planningPriority)
      ) {
        return (
          priorityRank(a.planningPriority) - priorityRank(b.planningPriority)
        );
      }

      if (a.startAtMinute !== b.startAtMinute) {
        return a.startAtMinute - b.startAtMinute;
      }

      if (a.dueAtMinute !== b.dueAtMinute) {
        return a.dueAtMinute - b.dueAtMinute;
      }

      return a.itemName.localeCompare(b.itemName);
    });
  }, [orders, nowInfo.nowMinute, dayRelation]);

  useEffect(() => {
    if (selectedDate !== todayDate) return;

    const currentLatePendingIds = tasks
      .filter((t) => t.kitchenStatus === "pending" && t.urgency === "late")
      .map((t) => t.id);

    const previous = previousLateIdsRef.current;
    const newLateOnes = currentLatePendingIds.filter(
      (id) => !previous.includes(id)
    );

    if (newLateOnes.length > 0) {
      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as typeof window & { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;

        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          const oscillator = ctx.createOscillator();
          const gain = ctx.createGain();

          oscillator.type = "sine";
          oscillator.frequency.value = 880;
          gain.gain.value = 0.03;

          oscillator.connect(gain);
          gain.connect(ctx.destination);

          oscillator.start();
          oscillator.stop(ctx.currentTime + 0.15);
        }
      } catch (e) {
        console.warn("Audio alert skipped", e);
      }
    }

    previousLateIdsRef.current = currentLatePendingIds;
  }, [tasks, selectedDate, todayDate]);

  async function updateKitchenItemStatus(
    task: KitchenTask,
    nextStatus: KitchenStatus
  ) {
    try {
      setUpdatingTaskId(task.id);
      setMsg("Updating kitchen task...");

      const orderRef = doc(db, "orders", task.orderId);
      const targetOrder = orders.find((o) => o.id === task.orderId);

      if (!targetOrder) {
        setMsg("❌ Order not found");
        return;
      }

      const nowIso = new Date().toISOString();

      const nextItems: OrderItem[] = (targetOrder.items || []).map((item) => {
        const itemLineId = item.lineId || `${task.orderId}-${item.name}`;
        if (itemLineId !== task.lineId) return item;

        return {
          ...item,
          kitchenStatus: nextStatus,
          startedAt:
            nextStatus === "in_progress" ? nowIso : item.startedAt || null,
          readyAt: nextStatus === "ready" ? nowIso : item.readyAt || null,
        };
      });

      const allReadyOrServed = nextItems.every(
        (item) =>
          (item.kitchenStatus || "pending") === "ready" ||
          (item.kitchenStatus || "pending") === "served"
      );

      const allServed = nextItems.every(
        (item) => (item.kitchenStatus || "pending") === "served"
      );

      let nextOrderStatus = targetOrder.status || "new";

      if (targetOrder.orderType === "delivery") {
        if (allReadyOrServed) {
          nextOrderStatus = "ready_for_pickup";
        } else if (nextStatus === "in_progress") {
          nextOrderStatus = "preparing";
        } else {
          nextOrderStatus = targetOrder.status || "new";
        }
      } else if (targetOrder.orderType === "takeaway") {
        if (allServed) {
          nextOrderStatus = "served";
        } else if (allReadyOrServed) {
          nextOrderStatus = "ready_for_pickup";
        } else if (nextStatus === "in_progress") {
          nextOrderStatus = "preparing";
        } else {
          nextOrderStatus = targetOrder.status || "new";
        }
      } else {
        if (allServed) {
          nextOrderStatus = "served";
        } else if (allReadyOrServed) {
          nextOrderStatus = "ready";
        } else if (nextStatus === "in_progress") {
          nextOrderStatus = "preparing";
        } else {
          nextOrderStatus = targetOrder.status || "new";
        }
      }

      await updateDoc(orderRef, {
        items: nextItems,
        status: nextOrderStatus,
        updatedAt: serverTimestamp(),
      });

      setOrders((prev) =>
        prev.map((order) =>
          order.id === task.orderId
            ? { ...order, items: nextItems, status: nextOrderStatus }
            : order
        )
      );

      setMsg(`✅ ${task.itemName} marked as ${kitchenStatusLabel(nextStatus)}`);
    } catch (error: any) {
      console.error("Kitchen status update error:", error);
      setMsg(`❌ ${error?.message || "Failed to update kitchen task"}`);
    } finally {
      setUpdatingTaskId("");
    }
  }

  const pendingTasks = tasks.filter((t) => t.kitchenStatus === "pending");
  const progressTasks = tasks.filter((t) => t.kitchenStatus === "in_progress");
  const readyTasks = tasks.filter((t) => t.kitchenStatus === "ready");
  const servedTasks = tasks.filter((t) => t.kitchenStatus === "served");

  const lateTasks = pendingTasks.filter((t) => t.urgency === "late");
  const nowTasks = pendingTasks.filter((t) => t.urgency === "now");
  const upcomingTasks = pendingTasks.filter((t) => t.urgency === "upcoming");
  const laterTasks = pendingTasks.filter((t) => t.urgency === "later");

  const topItems = useMemo(() => {
    const map = new Map<string, number>();

    for (const t of tasks) {
      map.set(t.itemName, Number(map.get(t.itemName) || 0) + t.qty);
    }

    return Array.from(map.entries())
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty || a.name.localeCompare(b.name))
      .slice(0, 8);
  }, [tasks]);

  const slotGroups = useMemo<TimeSlotGroup[]>(() => {
    const groups = new Map<string, KitchenTask[]>();

    for (const task of tasks) {
      const key = task.orderTimeSlot || "00:00";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(task);
    }

    return Array.from(groups.entries())
      .sort((a, b) => timeSlotToMinute(a[0]) - timeSlotToMinute(b[0]))
      .map(([slotKey, slotTasks]) => {
        const uniqueOrders = new Set(slotTasks.map((t) => t.orderId));
        const itemMap = new Map<string, number>();

        for (const t of slotTasks) {
          itemMap.set(t.itemName, Number(itemMap.get(t.itemName) || 0) + t.qty);
        }

        const items = Array.from(itemMap.entries())
          .map(([name, qty]) => ({ name, qty }))
          .sort((a, b) => b.qty - a.qty || a.name.localeCompare(b.name));

        return {
          slotKey,
          slotLabel: slotTasks[0]?.slotLabel || to12HourLabel(slotKey),
          orderCount: uniqueOrders.size,
          taskCount: slotTasks.length,
          totalQty: slotTasks.reduce((sum, t) => sum + t.qty, 0),
          pendingCount: slotTasks.filter((t) => t.kitchenStatus === "pending")
            .length,
          inProgressCount: slotTasks.filter(
            (t) => t.kitchenStatus === "in_progress"
          ).length,
          readyCount: slotTasks.filter((t) => t.kitchenStatus === "ready")
            .length,
          servedCount: slotTasks.filter((t) => t.kitchenStatus === "served")
            .length,
          items,
          tasks: slotTasks,
        };
      });
  }, [tasks]);

  function renderTaskCard(task: KitchenTask) {
    return (
      <div
        key={task.id}
        className={`rounded-2xl border border-l-4 p-4 shadow-sm ${urgencyContainerClass(
          task.urgency
        )} ${urgencyLeftBorderClass(task.urgency)}`}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-lg font-semibold text-neutral-900">
              {task.itemName} × {task.qty}
            </div>
            <div className="mt-1 text-sm text-neutral-700">
              Order #{task.orderNumber} · {task.customerName}
            </div>
            <div className="mt-1 text-sm text-neutral-500">
              Due {task.dueAtLabel} · Start {task.startAtLabel} · Prep{" "}
              {task.prepMinutes} min
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${urgencyBadgeClass(
                task.urgency
              )}`}
            >
              {task.urgency.toUpperCase()}
            </span>

            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${priorityBadgeClass(
                task.planningPriority
              )}`}
            >
              {task.planningPriority.toUpperCase()}
            </span>

            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${typeBadgeClass(
                task.orderType
              )}`}
            >
              {task.orderType.toUpperCase()}
            </span>

            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${paymentBadgeClass(
                task.paymentStatus
              )}`}
            >
              {task.paymentStatus.toUpperCase()}
            </span>

            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${kitchenStatusBadgeClass(
                task.kitchenStatus
              )}`}
            >
              {kitchenStatusLabel(task.kitchenStatus)}
            </span>
          </div>
        </div>

        <div className="mt-3">
          <span
            className={`inline-flex rounded-full border px-3 py-1.5 text-sm font-semibold ${countdownBadgeClass(
              task.countdownTone
            )}`}
          >
            ⏳ {task.countdownLabel}
          </span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <div className="rounded-xl bg-white px-3 py-2">
            <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Cooking Start
            </div>
            <div className="mt-1 text-sm font-semibold text-neutral-900">
              {task.startAtLabel}
            </div>
          </div>

          <div className="rounded-xl bg-white px-3 py-2">
            <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Serve / Ready By
            </div>
            <div className="mt-1 text-sm font-semibold text-neutral-900">
              {task.dueAtLabel}
            </div>
          </div>

          <div className="rounded-xl bg-white px-3 py-2">
            <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Time Slot
            </div>
            <div className="mt-1 text-sm font-semibold text-neutral-900">
              {task.slotLabel}
            </div>
          </div>

          <div className="rounded-xl bg-white px-3 py-2">
            <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Kitchen Priority
            </div>
            <div className="mt-1 text-sm font-semibold text-neutral-900">
              {task.planningPriority.toUpperCase()}
            </div>
          </div>
        </div>

        {task.note ? (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-100 px-3 py-2 text-sm text-amber-800">
            <span className="font-semibold">Item Note:</span> {task.note}
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-3">
          {task.kitchenStatus === "pending" ? (
            <button
              type="button"
              onClick={() => updateKitchenItemStatus(task, "in_progress")}
              disabled={updatingTaskId === task.id}
              className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {updatingTaskId === task.id ? "Updating..." : "Start Cooking"}
            </button>
          ) : null}

          {task.kitchenStatus === "in_progress" ? (
            <button
              type="button"
              onClick={() => updateKitchenItemStatus(task, "ready")}
              disabled={updatingTaskId === task.id}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {updatingTaskId === task.id ? "Updating..." : "Mark Ready"}
            </button>
          ) : null}

          {task.kitchenStatus === "ready" ? (
            <button
              type="button"
              onClick={() => updateKitchenItemStatus(task, "served")}
              disabled={updatingTaskId === task.id}
              className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {updatingTaskId === task.id
                ? "Updating..."
                : "Mark Served / Delivered"}
            </button>
          ) : null}

          {task.kitchenStatus === "served" ? (
            <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700">
              ✅ Served / Delivered
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  function renderDateShortcut(
    label: string,
    dateValue: string,
    helper: string
  ) {
    const active = selectedDate === dateValue;

    return (
      <button
        type="button"
        onClick={() => setSelectedDate(dateValue)}
        className={`rounded-2xl border px-4 py-3 text-left transition ${
          active
            ? "border-neutral-900 bg-neutral-900 text-white"
            : "border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50"
        }`}
      >
        <div className="text-sm font-semibold">{label}</div>
        <div
          className={`text-xs ${active ? "text-neutral-200" : "text-neutral-500"}`}
        >
          {helper}
        </div>
      </button>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            Kitchen Workflow
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Run kitchen operations with timing and live status updates.
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
            onClick={() => loadOrders(selectedDate)}
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Refresh
          </button>

          <Link
            href="/orders"
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Order Board
          </Link>

          <Link
            href="/orders/new"
            className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            + New Order
          </Link>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {renderDateShortcut("Today", todayDate, formatDateLong(todayDate))}
        {renderDateShortcut(
          "Tomorrow",
          tomorrowDate,
          formatDateLong(tomorrowDate)
        )}
        {renderDateShortcut(
          "Day After Tomorrow",
          dayAfterDate,
          formatDateLong(dayAfterDate)
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        <div className="rounded-xl bg-neutral-100 px-3 py-2 text-neutral-700">
          <span className="font-semibold text-neutral-900">Current Time:</span>{" "}
          {nowInfo.nowLabel}
        </div>

        <div className="rounded-xl bg-neutral-100 px-3 py-2 text-neutral-700">
          <span className="font-semibold text-neutral-900">Viewing:</span>{" "}
          {formatDateLong(selectedDate)}
        </div>

        <div className="text-sm font-medium text-neutral-700">{msg}</div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-red-600">
            Late
          </div>
          <div className="mt-2 text-3xl font-bold text-red-700">
            {lateTasks.length}
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-amber-700">
            Start Now
          </div>
          <div className="mt-2 text-3xl font-bold text-amber-700">
            {nowTasks.length}
          </div>
        </div>

        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-sky-700">
            Upcoming
          </div>
          <div className="mt-2 text-3xl font-bold text-sky-700">
            {upcomingTasks.length}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Later
          </div>
          <div className="mt-2 text-3xl font-bold text-neutral-900">
            {laterTasks.length}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            In Progress
          </div>
          <div className="mt-2 text-3xl font-bold text-neutral-900">
            {progressTasks.length}
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-emerald-700">
            Ready
          </div>
          <div className="mt-2 text-3xl font-bold text-emerald-700">
            {readyTasks.length}
          </div>
        </div>

        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-sky-700">
            Served
          </div>
          <div className="mt-2 text-3xl font-bold text-sky-700">
            {servedTasks.length}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Total Tasks
          </div>
          <div className="mt-2 text-3xl font-bold text-neutral-900">
            {tasks.length}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-lg font-semibold text-neutral-900">
              Time Slot Planning Board
            </div>
            <div className="text-sm text-neutral-500">
              View kitchen load by order time so cooks know what is coming next.
            </div>
          </div>

          <div className="text-sm text-neutral-600">
            {slotGroups.length} slot{slotGroups.length === 1 ? "" : "s"} found
          </div>
        </div>

        {slotGroups.length === 0 ? (
          <div className="mt-4 text-sm text-neutral-500">
            No time slots found for this date.
          </div>
        ) : (
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            {slotGroups.map((group) => (
              <div
                key={group.slotKey}
                className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-lg font-semibold text-neutral-900">
                      {group.slotLabel}
                    </div>
                    <div className="mt-1 text-sm text-neutral-600">
                      {group.orderCount} order{group.orderCount === 1 ? "" : "s"} ·{" "}
                      {group.taskCount} task{group.taskCount === 1 ? "" : "s"} ·{" "}
                      {group.totalQty} total qty
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-700">
                      Pending {group.pendingCount}
                    </span>
                    <span className="rounded-full border border-amber-200 bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                      In Progress {group.inProgressCount}
                    </span>
                    <span className="rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      Ready {group.readyCount}
                    </span>
                    <span className="rounded-full border border-sky-200 bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700">
                      Served {group.servedCount}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                    Item Summary
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {group.items.slice(0, 8).map((it) => (
                      <div
                        key={`${group.slotKey}-${it.name}`}
                        className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700"
                      >
                        <span className="font-semibold text-neutral-900">
                          {it.name}
                        </span>{" "}
                        × {it.qty}
                      </div>
                    ))}
                    {group.items.length === 0 ? (
                      <div className="text-sm text-neutral-500">
                        No items found
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="text-lg font-semibold text-neutral-900">
          Top Items for Selected Day
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {topItems.length === 0 ? (
            <div className="text-sm text-neutral-500">No items found</div>
          ) : (
            topItems.map((it) => (
              <div
                key={it.name}
                className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700"
              >
                <span className="font-semibold text-neutral-900">
                  {it.name}
                </span>{" "}
                × {it.qty}
              </div>
            ))
          )}
        </div>
      </div>

      {loading ? (
        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600 shadow-sm">
          Loading kitchen workflow...
        </div>
      ) : tasks.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600 shadow-sm">
          No kitchen tasks found for this date.
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          <section>
            <div className="mb-3 text-xl font-bold text-red-700">Late</div>
            {lateTasks.length === 0 ? (
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-500 shadow-sm">
                No late tasks
              </div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {lateTasks.map(renderTaskCard)}
              </div>
            )}
          </section>

          <section>
            <div className="mb-3 text-xl font-bold text-amber-700">
              Start Now
            </div>
            {nowTasks.length === 0 ? (
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-500 shadow-sm">
                Nothing to start right now
              </div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {nowTasks.map(renderTaskCard)}
              </div>
            )}
          </section>

          <section>
            <div className="mb-3 text-xl font-bold text-sky-700">
              Upcoming
            </div>
            {upcomingTasks.length === 0 ? (
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-500 shadow-sm">
                No upcoming tasks
              </div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {upcomingTasks.map(renderTaskCard)}
              </div>
            )}
          </section>

          <section>
            <div className="mb-3 text-xl font-bold text-neutral-900">Later</div>
            {laterTasks.length === 0 ? (
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-500 shadow-sm">
                No later tasks
              </div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {laterTasks.map(renderTaskCard)}
              </div>
            )}
          </section>

          <section>
            <div className="mb-3 text-xl font-bold text-neutral-900">
              In Progress
            </div>
            {progressTasks.length === 0 ? (
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-500 shadow-sm">
                No items in progress
              </div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {progressTasks.map(renderTaskCard)}
              </div>
            )}
          </section>

          <section>
            <div className="mb-3 text-xl font-bold text-emerald-700">
              Ready
            </div>
            {readyTasks.length === 0 ? (
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-500 shadow-sm">
                No ready items yet
              </div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {readyTasks.map(renderTaskCard)}
              </div>
            )}
          </section>

          <section>
            <div className="mb-3 text-xl font-bold text-sky-700">Served</div>
            {servedTasks.length === 0 ? (
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-500 shadow-sm">
                No served items yet
              </div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {servedTasks.map(renderTaskCard)}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}