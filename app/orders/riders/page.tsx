"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { canAccess, getCurrentAccount, isPending } from "@/lib/authGuard";

type RiderDoc = {
  id: string;
  ownerUid?: string;
  restaurantId?: string;
  restaurantName?: string;
  name?: string;
  phone?: string;
  currentStatus?: string;
  currentOrderId?: string;
  outSince?: any;
  returnedAt?: any;
  updatedAt?: any;
  lastPickedUpAt?: any;
  lastDeliveredAt?: any;
  deliveriesCompleted?: number;
  deliveriesToday?: number;
  deliveriesThisWeek?: number;
  deliveriesThisMonth?: number;
  correctionNote?: string;
  lastDailyResetKey?: string;
  lastWeeklyResetKey?: string;
  lastMonthlyResetKey?: string;
  liveLat?: number;
  liveLng?: number;
  liveAccuracy?: number;
  liveHeading?: number;
  liveSpeed?: number;
  liveLocationUpdatedAt?: any;
  isLocationSharing?: boolean;
    email?: string;

  riderWorkType?: "freelancer" | "restaurant_captive" | "outsourcing_company";
  linkedRestaurantName?: string;
  outsourcingCompanyName?: string;
  canServeOtherRestaurants?: boolean;

  postcode?: string;
  availability?: string;
  workingHours?: string;

  rateType?: "per_delivery" | "hourly" | "fixed_shift";
  ratePerDelivery?: number;
  hourlyRate?: number;
  shiftRate?: number;
  privateRateNote?: string;
};

type SortMode =
  | "name_asc"
  | "name_desc"
  | "completed_desc"
  | "today_desc"
  | "out_longest";

type GuardAccount = {
  role: string | null;
  status: string | null;
};

function getRedirectPath(account: GuardAccount | null) {
  if (!account?.role) return "/create-account";

  if (account.role === "restaurant") {
    if (isPending(account)) return "/signup/restaurant/pending";
    return "/restaurants";
  }

  if (account.role === "supplier") return "/suppliers";
  if (account.role === "customer") return "/";
  if (account.role === "catering_house") return "/events";

  if (account.role === "blackcab_partner") {
    if (isPending(account)) return "/signup/blackcab/pending";
    return "/blackcab";
  }

  if (account.role === "staff") return "/admin";
  if (account.role === "rider") return "/orders/rider";

  return "/";
}

function cleanText(value?: string) {
  return (value || "").trim().toLowerCase();
}

function labelize(value?: string) {
  if (!value) return "unknown";
  return value.replace(/_/g, " ");
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

function minutesSince(ts: any) {
  try {
    const dt =
      typeof ts?.toDate === "function"
        ? ts.toDate()
        : ts
          ? new Date(ts)
          : null;

    if (!dt || Number.isNaN(dt.getTime())) return null;

    const diff = Date.now() - dt.getTime();
    return Math.max(0, Math.floor(diff / 60000));
  } catch {
    return null;
  }
}

function getStatusBadgeClass(status?: string) {
  switch (cleanText(status)) {
    case "waiting_at_restaurant":
    case "available":
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
    case "delivered":
      return "border-neutral-200 bg-neutral-100 text-neutral-700";
    default:
      return "border-neutral-200 bg-neutral-50 text-neutral-700";
  }
}

function getOutBadgeClass(minutes: number | null) {
  if (minutes === null) return "";
  if (minutes >= 60) {
    return "border-red-200 bg-red-50 text-red-700";
  }
  if (minutes >= 45) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-sky-200 bg-sky-50 text-sky-700";
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

function getFreshCounters(rider: RiderDoc) {
  const dailyKey = getDailyKey();
  const weeklyKey = getWeeklyKey();
  const monthlyKey = getMonthlyKey();

  return {
    completed: Number(rider.deliveriesCompleted || 0),
    today:
      rider.lastDailyResetKey === dailyKey
        ? Number(rider.deliveriesToday || 0)
        : 0,
    week:
      rider.lastWeeklyResetKey === weeklyKey
        ? Number(rider.deliveriesThisWeek || 0)
        : 0,
    month:
      rider.lastMonthlyResetKey === monthlyKey
        ? Number(rider.deliveriesThisMonth || 0)
        : 0,
  };
}

function calculateEstimatedPay(rider: RiderDoc) {
  const fresh = getFreshCounters(rider);

  if (rider.rateType === "hourly") {
    return Number(rider.hourlyRate || 0);
  }

  if (rider.rateType === "fixed_shift") {
    return Number(rider.shiftRate || 0);
  }
if (rider.rateType === "per_delivery") {
  return fresh.completed * Number(rider.ratePerDelivery || 0);
}
  return fresh.completed * Number(rider.ratePerDelivery || 0);
}
function calculatePeriodPay(
  rider: RiderDoc,
  period: "today" | "week" | "month"
) {
  const fresh = getFreshCounters(rider);
  const deliveries = fresh[period];

  if (rider.rateType === "per_delivery") {
    return deliveries * Number(rider.ratePerDelivery || 0);
  }

  if (rider.rateType === "hourly") {
    return Number(rider.hourlyRate || 0);
  }

  if (rider.rateType === "fixed_shift") {
    return Number(rider.shiftRate || 0);
  }

  return 0;
}
export default function RidersOwnerPage() {
  const router = useRouter();

  const [riders, setRiders] = useState<RiderDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [payrollPeriod, setPayrollPeriod] = useState<"today" | "week" | "month">("month");
  const totalPayroll = useMemo(() => {
  return riders.reduce((sum, r) => {
    return sum + calculatePeriodPay(r, payrollPeriod);
  }, 0);
}, [riders, payrollPeriod]);
  function exportPayrollCSV() {
  const rows = riders.map((r: RiderDoc) => {
    const fresh = getFreshCounters(r);

    const rate = Number(r.ratePerDelivery || 0);
    const earnings = fresh.month * rate;

    return {
      name: r.name || "",
      completed: fresh.completed,
      today: fresh.today,
      week: fresh.week,
      month: fresh.month,
      ratePerDelivery: rate,
      earnings: earnings,
    };
  });
  }
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [msg, setMsg] = useState("");
  const [savingId, setSavingId] = useState("");

  const [adjustments, setAdjustments] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
const [rateDrafts, setRateDrafts] = useState<
  Record<
    string,
    {
      riderWorkType: string;
      linkedRestaurantName: string;
      outsourcingCompanyName: string;
      canServeOtherRestaurants: boolean;
      postcode: string;
      availability: string;
      workingHours: string;
      rateType: string;
      ratePerDelivery: string;
      hourlyRate: string;
      shiftRate: string;
      privateRateNote: string;
    }
  >
>({});
  const [ownerUid, setOwnerUid] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("name_asc");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setOwnerUid("");
        setOwnerName("");
        setOwnerEmail("");
        setAllowed(false);
        setCheckingAccess(false);
        setLoading(false);
        router.replace("/login");
        return;
      }

      try {
        const account = await getCurrentAccount();

        if (!account) {
          setAllowed(false);
          setCheckingAccess(false);
          setLoading(false);
          router.replace("/create-account");
          return;
        }

        if (!canAccess(account, ["restaurant", "staff"])) {
          setAllowed(false);
          setCheckingAccess(false);
          setLoading(false);
          router.replace(getRedirectPath(account));
          return;
        }

        if (isPending(account)) {
          setAllowed(false);
          setCheckingAccess(false);
          setLoading(false);
          router.replace(getRedirectPath(account));
          return;
        }

        setOwnerUid(user.uid || "");
        setOwnerName(user.displayName || "");
        setOwnerEmail(user.email || "");
        setAllowed(true);
        setCheckingAccess(false);
      } catch (error) {
        console.error("Rider owner access check failed:", error);
        setAllowed(false);
        setCheckingAccess(false);
        setLoading(false);
        router.replace("/login");
      }
    });

    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!allowed || !ownerUid) {
      setRiders([]);
      setLoading(false);
      return;
    }

    setLoading(true);

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
        setRateDrafts((prev) => {
  const next = { ...prev };

  for (const rider of data) {
    if (!next[rider.id]) {
      next[rider.id] = {
        riderWorkType: rider.riderWorkType || "",
        linkedRestaurantName: rider.linkedRestaurantName || "",
        outsourcingCompanyName: rider.outsourcingCompanyName || "",
        canServeOtherRestaurants: rider.canServeOtherRestaurants || false,
        postcode: rider.postcode || "",
        availability: rider.availability || "",
        workingHours: rider.workingHours || "",
        rateType: rider.rateType || "",
        ratePerDelivery: String(rider.ratePerDelivery || ""),
hourlyRate: String(rider.hourlyRate || ""),
shiftRate: String(rider.shiftRate || ""),
        privateRateNote: rider.privateRateNote || "",
      };
    }
  }

  return next;
});

        setAdjustments((prev) => {
          const next = { ...prev };
          for (const rider of data) {
            if (next[rider.id] === undefined) next[rider.id] = "";
          }
          return next;
        });

        setNotes((prev) => {
          const next = { ...prev };
          for (const rider of data) {
            if (next[rider.id] === undefined) {
              next[rider.id] = rider.correctionNote || "";
            }
          }
          return next;
        });
setRateDrafts((prev) => {
  const next = { ...prev };

  for (const rider of data) {
    if (!next[rider.id]) {
      next[rider.id] = {
        riderWorkType: rider.riderWorkType || "freelancer",
        linkedRestaurantName:
          rider.linkedRestaurantName || rider.restaurantName || "",
        outsourcingCompanyName: rider.outsourcingCompanyName || "",
        canServeOtherRestaurants: rider.canServeOtherRestaurants ?? true,
        postcode: rider.postcode || "",
        availability: rider.availability || "",
        workingHours: rider.workingHours || "",
        rateType: rider.rateType || "per_delivery",
        ratePerDelivery: String(rider.ratePerDelivery || ""),
        hourlyRate: String(rider.hourlyRate || ""),
        shiftRate: String(rider.shiftRate || ""),
        privateRateNote: rider.privateRateNote || "",
      };
    }
  }

  return next;
});
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setMsg("❌ Failed to load riders");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [allowed, ownerUid]);

  useEffect(() => {
    async function refreshAllResetKeys() {
      if (!riders.length) return;

      const dailyKey = getDailyKey();
      const weeklyKey = getWeeklyKey();
      const monthlyKey = getMonthlyKey();

      for (const rider of riders) {
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
          try {
            await updateDoc(doc(db, "riders", rider.id), updates);
          } catch (err) {
            console.error(err);
          }
        }
      }
    }

    if (allowed) {
      refreshAllResetKeys();
    }
  }, [allowed, riders]);

  async function ensureRiderCountersAreFresh(rider: RiderDoc) {
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

  async function syncLinkedOrderStatus(
    orderId: string,
    status: string,
    deliveryStatus?: string
  ) {
    if (!orderId) return;

    try {
      const updates: Record<string, any> = {
        status,
        updatedAt: serverTimestamp(),
      };

      if (deliveryStatus) {
        updates.deliveryStatus = deliveryStatus;
      }

      if (status === "picked_up") {
        updates.pickedUpAt = serverTimestamp();
      }

      if (status === "delivered") {
        updates.deliveredAt = serverTimestamp();
      }

      await updateDoc(doc(db, "orders", orderId), updates);
    } catch (err) {
      console.error("Order status sync skipped:", err);
    }
  }

  async function setRiderLifecycleStatus(
    rider: RiderDoc,
    action:
      | "waiting_at_restaurant"
      | "assigned"
      | "picked_up"
      | "delivered"
      | "returned"
  ) {
    try {
      setSavingId(rider.id);

      if (action === "waiting_at_restaurant") {
        setMsg("Updating rider to waiting at restaurant...");

        await updateDoc(doc(db, "riders", rider.id), {
          currentStatus: "waiting_at_restaurant",
          updatedAt: serverTimestamp(),
        });

        setMsg(`✅ ${rider.name || rider.id} marked waiting at restaurant`);
        return;
      }

      if (action === "assigned") {
        setMsg("Assigning rider...");

        await updateDoc(doc(db, "riders", rider.id), {
          currentStatus: "assigned",
          updatedAt: serverTimestamp(),
        });

        if (rider.currentOrderId) {
          await syncLinkedOrderStatus(
            rider.currentOrderId,
            "ready_for_delivery",
            "assigned"
          );
        }

        setMsg(`✅ ${rider.name || rider.id} marked assigned`);
        return;
      }

      if (action === "picked_up") {
        setMsg("Marking rider as picked up...");

        await updateDoc(doc(db, "riders", rider.id), {
          currentStatus: "picked_up",
          outSince: serverTimestamp(),
          lastPickedUpAt: serverTimestamp(),
          returnedAt: null,
          updatedAt: serverTimestamp(),
        });

        if (rider.currentOrderId) {
          await syncLinkedOrderStatus(
            rider.currentOrderId,
            "out_for_delivery",
            "picked_up"
          );
        }

        setMsg(`✅ ${rider.name || rider.id} marked picked up`);
        return;
      }

      if (action === "delivered") {
        setMsg("Marking delivery completed...");

        await ensureRiderCountersAreFresh(rider);

        const fresh = getFreshCounters(rider);
        const alreadyDelivered =
          cleanText(rider.currentStatus) === "awaiting_return" ||
          cleanText(rider.currentStatus) === "delivered";

        await updateDoc(doc(db, "riders", rider.id), {
          currentStatus: "awaiting_return",
          deliveriesCompleted: alreadyDelivered
            ? fresh.completed
            : fresh.completed + 1,
          deliveriesToday: alreadyDelivered ? fresh.today : fresh.today + 1,
          deliveriesThisWeek: alreadyDelivered ? fresh.week : fresh.week + 1,
          deliveriesThisMonth: alreadyDelivered ? fresh.month : fresh.month + 1,
          lastDailyResetKey: getDailyKey(),
          lastWeeklyResetKey: getWeeklyKey(),
          lastMonthlyResetKey: getMonthlyKey(),
          lastDeliveredAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        if (rider.currentOrderId) {
          await syncLinkedOrderStatus(
            rider.currentOrderId,
            "delivered",
            "delivered"
          );
        }

        setMsg(
          alreadyDelivered
            ? `✅ ${rider.name || rider.id} remains awaiting return`
            : `✅ ${rider.name || rider.id} marked delivered and awaiting return`
        );
        return;
      }

      if (action === "returned") {
        setMsg("Marking rider returned...");

        await updateDoc(doc(db, "riders", rider.id), {
          currentStatus: "available",
          currentOrderId: "",
          outSince: null,
          returnedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        setMsg(`✅ ${rider.name || rider.id} marked returned and available`);
      }
    } catch (err) {
      console.error(err);
      setMsg("❌ Failed to update rider lifecycle");
    } finally {
      setSavingId("");
    }
  }
async function saveRiderPrivateSettings(rider: RiderDoc) {
  try {
    setSavingId(rider.id);
    setMsg("Saving rider private settings...");

    const draft = rateDrafts[rider.id] || {
  riderWorkType: "",
  linkedRestaurantName: "",
  outsourcingCompanyName: "",
  canServeOtherRestaurants: false,
  postcode: "",
  availability: "",
  workingHours: "",
  rateType: "",
  ratePerDelivery: "",
  hourlyRate: "",
  shiftRate: "",
  privateRateNote: "",
};

    if (!draft) {
      setMsg("❌ No rider settings found");
      return;
    }

    await updateDoc(doc(db, "riders", rider.id), {
      riderWorkType: draft.riderWorkType,
      linkedRestaurantName: draft.linkedRestaurantName.trim(),
      outsourcingCompanyName: draft.outsourcingCompanyName.trim(),
      canServeOtherRestaurants: draft.canServeOtherRestaurants,
      postcode: draft.postcode.trim(),
      availability: draft.availability.trim(),
      workingHours: draft.workingHours.trim(),
rateType: draft.rateType || "",
ratePerDelivery: draft.ratePerDelivery || "",
hourlyRate: draft.hourlyRate || "",
shiftRate: draft.shiftRate || "",
privateRateNote: draft.privateRateNote || "",
      

      updatedAt: serverTimestamp(),
    });

    setMsg(`✅ Private rider settings saved for ${rider.name || rider.id}`);
  } catch (err) {
    console.error(err);
    setMsg("❌ Failed to save rider private settings");
  } finally {
    setSavingId("");
  }
}
  async function saveCorrection(rider: RiderDoc) {
    try {
      setSavingId(rider.id);
      setMsg("Saving correction...");

      await ensureRiderCountersAreFresh(rider);

      const rawAdjustment = (adjustments[rider.id] || "").trim();
      const adjustment = Number(rawAdjustment);

      if (!rawAdjustment || Number.isNaN(adjustment)) {
        setMsg("❌ Enter a valid adjustment like 1 or -1");
        return;
      }

      const fresh = getFreshCounters(rider);

      const previousCompleted = fresh.completed;
      const previousToday = fresh.today;
      const previousWeek = fresh.week;
      const previousMonth = fresh.month;

      const newCompleted = Math.max(0, previousCompleted + adjustment);
      const newToday = Math.max(0, previousToday + adjustment);
      const newWeek = Math.max(0, previousWeek + adjustment);
      const newMonth = Math.max(0, previousMonth + adjustment);

      const note = (notes[rider.id] || "").trim();
      const correctedByName = ownerName || ownerEmail || ownerUid || "";

      await updateDoc(doc(db, "riders", rider.id), {
        deliveriesCompleted: newCompleted,
        deliveriesToday: newToday,
        deliveriesThisWeek: newWeek,
        deliveriesThisMonth: newMonth,
        correctionNote: note,
        lastDailyResetKey: getDailyKey(),
        lastWeeklyResetKey: getWeeklyKey(),
        lastMonthlyResetKey: getMonthlyKey(),
        updatedAt: serverTimestamp(),
      });

      await addDoc(collection(db, "riderCorrectionLogs"), {
        ownerUid: ownerUid || "",
        restaurantId: rider.restaurantId || "",
        restaurantName: rider.restaurantName || "",
        riderId: rider.id,
        riderName: rider.name || rider.id,
        previousCompleted,
        adjustment,
        newCompleted,
        previousToday,
        newToday,
        previousWeek,
        newWeek,
        previousMonth,
        newMonth,
        note,
        correctedAt: serverTimestamp(),
        correctedByUid: ownerUid || "",
        correctedByName,
        correctedByEmail: ownerEmail || "",
      });

      setAdjustments((prev) => ({
        ...prev,
        [rider.id]: "",
      }));

      setMsg(`✅ ${rider.name || rider.id} corrected and logged`);
    } catch (err) {
      console.error(err);
      setMsg("❌ Failed to save correction");
    } finally {
      setSavingId("");
    }
  }

  async function resetRider(rider: RiderDoc) {
    try {
      setSavingId(rider.id);
      setMsg("Resetting rider status...");

      await updateDoc(doc(db, "riders", rider.id), {
        currentStatus: "available",
        currentOrderId: "",
        outSince: null,
        returnedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setMsg(`✅ ${rider.name || rider.id} reset to available`);
    } catch (err) {
      console.error(err);
      setMsg("❌ Failed to reset rider");
    } finally {
      setSavingId("");
    }
  }

  function setQuickAdjustment(riderId: string, value: number) {
    setAdjustments((prev) => ({
      ...prev,
      [riderId]: String(value),
    }));
  }

  const filteredRiders = useMemo(() => {
    const term = cleanText(search);

    let list = riders.filter((rider) => {
      const riderStatus = cleanText(rider.currentStatus);
      const name = cleanText(rider.name);
      const phone = cleanText(rider.phone);
      const currentOrderId = cleanText(rider.currentOrderId);

      const matchesSearch =
        !term ||
        name.includes(term) ||
        phone.includes(term) ||
        currentOrderId.includes(term);

      const matchesStatus =
        statusFilter === "all" || riderStatus === cleanText(statusFilter);

      return matchesSearch && matchesStatus;
    });

    list = [...list].sort((a, b) => {
      if (sortMode === "name_asc") {
        return (a.name || a.id).localeCompare(b.name || b.id);
      }

      if (sortMode === "name_desc") {
        return (b.name || b.id).localeCompare(a.name || a.id);
      }

      if (sortMode === "completed_desc") {
        return (
          Number(b.deliveriesCompleted || 0) - Number(a.deliveriesCompleted || 0)
        );
      }

      if (sortMode === "today_desc") {
        const aFresh = getFreshCounters(a).today;
        const bFresh = getFreshCounters(b).today;
        return bFresh - aFresh;
      }

      if (sortMode === "out_longest") {
        const aMin = minutesSince(a.outSince) ?? -1;
        const bMin = minutesSince(b.outSince) ?? -1;
        return bMin - aMin;
      }

      return 0;
    });

    return list;
  }, [riders, search, statusFilter, sortMode]);

  const summary = useMemo(() => {
    return {
      totalRiders: riders.length,
      available: riders.filter((r) => cleanText(r.currentStatus) === "available")
        .length,
      assigned: riders.filter((r) => {
        const s = cleanText(r.currentStatus);
        return (
          s === "assigned" ||
          s === "ready_for_delivery" ||
          s === "ready_for_pickup"
        );
      }).length,
      outNow: riders.filter((r) => {
        const s = cleanText(r.currentStatus);
        return s === "out_for_delivery" || s === "on_delivery" || s === "picked_up";
      }).length,
      awaitingReturn: riders.filter(
        (r) => cleanText(r.currentStatus) === "awaiting_return"
      ).length,
      totalCompleted: riders.reduce(
        (sum, r) => sum + Number(r.deliveriesCompleted || 0),
        0
      ),
      totalToday: riders.reduce((sum, r) => sum + getFreshCounters(r).today, 0),
      totalWeek: riders.reduce((sum, r) => sum + getFreshCounters(r).week, 0),
      totalMonth: riders.reduce((sum, r) => sum + getFreshCounters(r).month, 0),
      stuckLong: riders.filter((r) => {
        const m = minutesSince(r.outSince);
        return m !== null && m >= 60 && cleanText(r.currentStatus) !== "available";
      }).length,
      trackingOn: riders.filter((r) => r.isLocationSharing === true).length,
    };
  }, [riders]);

  if (checkingAccess) {
    return (
      <main className="min-h-screen bg-[#f8faf7] px-4 py-10">
        <div className="mx-auto max-w-5xl rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600 shadow-sm">
          Checking access...
        </div>
      </main>
    );
  }

  if (!allowed) {
    return (
      <main className="min-h-screen bg-[#f8faf7] px-4 py-10">
        <div className="mx-auto max-w-5xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800 shadow-sm">
          You do not have access to rider performance control.
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <div className="p-6 text-center text-neutral-600">
        Loading rider performance...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8faf7]">
      <div className="mx-auto max-w-7xl p-6">
        <div className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
  <div className="text-sm text-blue-700">Total Monthly Payroll</div>
  <div className="mt-1 text-2xl font-bold text-blue-900">
    £{totalPayroll.toFixed(2)}
  </div>
</div>
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              🛵 Rider Performance Control
            </h1>
            <p className="mt-1 text-sm text-neutral-600">
              Owner view for rider performance, corrections, live tracking, rider lifecycle, and stuck-status control.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
  type="button"
  onClick={exportPayrollCSV}
  className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
>
  Export Payroll CSV
</button>
            <Link
              href="/orders/rider/new"
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Add Rider
            </Link>

            <Link
              href="/orders/rider-signups"
              className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Rider Signups
            </Link>

            <Link
              href="/orders/delivery"
              className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Delivery Board
            </Link>

            <Link
              href="/orders/rider"
              className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Rider View
            </Link>

            <Link
              href="/orders/rider-corrections"
              className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Correction Logs
            </Link>

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

        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-9">
          <div className="rounded-xl border border-neutral-200 bg-white p-3 text-sm text-neutral-800">
            Riders: <b>{summary.totalRiders}</b>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            Available: <b>{summary.available}</b>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Assigned: <b>{summary.assigned}</b>
          </div>

          <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800">
            Out Now: <b>{summary.outNow}</b>
          </div>

          <div className="rounded-xl border border-violet-200 bg-violet-50 p-3 text-sm text-violet-800">
            Awaiting Return: <b>{summary.awaitingReturn}</b>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-3 text-sm text-neutral-800">
            Today Done: <b>{summary.totalToday}</b>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-3 text-sm text-neutral-800">
            Week Done: <b>{summary.totalWeek}</b>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            Tracking On: <b>{summary.trackingOn}</b>
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            Stuck 60+ min: <b>{summary.stuckLong}</b>
          </div>
        </div>

        <div className="mb-6 grid gap-3 rounded-2xl border border-neutral-200 bg-white p-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">
              Search rider / phone / order
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search rider..."
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">
              Status filter
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none"
            >
              <option value="all">All</option>
              <option value="available">Available</option>
              <option value="assigned">Assigned</option>
              <option value="ready_for_delivery">Ready for delivery</option>
              <option value="ready_for_pickup">Ready for pickup</option>
              <option value="out_for_delivery">Out for delivery</option>
              <option value="on_delivery">On delivery</option>
              <option value="picked_up">Picked up</option>
              <option value="awaiting_return">Awaiting return</option>
              <option value="delivered">Delivered</option>
              <option value="waiting_at_restaurant">Waiting at restaurant</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">
              Sort by
            </label>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none"
            >
              <option value="name_asc">Name A → Z</option>
              <option value="name_desc">Name Z → A</option>
              <option value="completed_desc">Highest completed</option>
              <option value="today_desc">Highest today</option>
              <option value="out_longest">Out longest</option>
            </select>
          </div>
        </div>

        {filteredRiders.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-4 text-sm text-neutral-500 shadow-sm">
            No riders found for this restaurant owner
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredRiders.map((rider) => {
              const outMinutes = minutesSince(rider.outSince);
              const fresh = getFreshCounters(rider);
              const riderStatus = cleanText(rider.currentStatus);
              const isNotAvailable = riderStatus !== "available";
              const isStuck45 =
                outMinutes !== null && outMinutes >= 45 && isNotAvailable;
              const isStuck60 =
                outMinutes !== null && outMinutes >= 60 && isNotAvailable;

              return (
                <div
                  key={rider.id}
                  className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="text-lg font-semibold text-neutral-900">
                        {rider.name || rider.id}
                      </div>

                      {rider.phone ? (
                        <div className="mt-1 text-sm text-neutral-600">
                          {rider.phone}
                        </div>
                      ) : null}

                      <div className="mt-2 flex flex-wrap gap-2">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClass(
                            rider.currentStatus
                          )}`}
                        >
                          {labelize(rider.currentStatus)}
                        </span>

                        {rider.isLocationSharing ? (
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            Live tracking on
                          </span>
                        ) : (
                          <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-semibold text-neutral-700">
                            Live tracking off
                          </span>
                        )}

                        {outMinutes !== null && isNotAvailable ? (
                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getOutBadgeClass(
                              outMinutes
                            )}`}
                          >
                            Out {outMinutes} min
                          </span>
                        ) : null}

                        {isStuck45 ? (
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                            Check rider
                          </span>
                        ) : null}

                        {isStuck60 ? (
                          <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                            Possibly stuck
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="text-right text-xs text-neutral-500">
                      <div>Last delivered</div>
                      <div className="mt-1 font-medium text-neutral-700">
                        {formatDateTime(rider.lastDeliveredAt)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                      <div className="text-xs text-neutral-500">Completed</div>
                      <div className="mt-1 text-lg font-bold text-neutral-900">
                        {fresh.completed}
                      </div>
                    </div>

                    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                      <div className="text-xs text-neutral-500">Today</div>
                      <div className="mt-1 text-lg font-bold text-neutral-900">
                        {fresh.today}
                      </div>
                    </div>

                    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                      <div className="text-xs text-neutral-500">This Week</div>
                      <div className="mt-1 text-lg font-bold text-neutral-900">
                        {fresh.week}
                      </div>
                    </div>

                    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                      <div className="text-xs text-neutral-500">This Month</div>
                      <div className="mt-1 text-lg font-bold text-neutral-900">
                        {fresh.month}
                      </div>
                    </div>
                    
                  </div>
<div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
  <div className="text-xs text-emerald-700">Estimated {payrollPeriod} Pay</div>
  <div className="mt-1 text-lg font-bold text-emerald-900">
    £{calculatePeriodPay(rider, payrollPeriod).toFixed(2)}
  </div>
</div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                      <div className="text-xs text-neutral-500">Current Order</div>
                      <div className="mt-1 text-sm font-medium text-neutral-800">
                        {rider.currentOrderId || "None"}
                      </div>
                    </div>

                    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                      <div className="text-xs text-neutral-500">Returned At</div>
                      <div className="mt-1 text-sm font-medium text-neutral-800">
                        {formatDateTime(rider.returnedAt)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                      <div className="text-xs text-neutral-500">Last Picked Up</div>
                      <div className="mt-1 text-sm font-medium text-neutral-800">
                        {formatDateTime(rider.lastPickedUpAt)}
                      </div>
                    </div>

                    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                      <div className="text-xs text-neutral-500">Last Updated</div>
                      <div className="mt-1 text-sm font-medium text-neutral-800">
                        {formatDateTime(rider.updatedAt)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                      <div className="text-xs text-neutral-500">Live Coordinates</div>
                      <div className="mt-1 text-sm font-medium text-neutral-800">
                        {typeof rider.liveLat === "number" &&
                        typeof rider.liveLng === "number"
                          ? `${rider.liveLat.toFixed(5)}, ${rider.liveLng.toFixed(5)}`
                          : "Not available"}
                      </div>
                    </div>

                    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                      <div className="text-xs text-neutral-500">Last Location Update</div>
                      <div className="mt-1 text-sm font-medium text-neutral-800">
                        {formatDateTime(rider.liveLocationUpdatedAt)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                      <div className="text-xs text-neutral-500">Accuracy</div>
                      <div className="mt-1 text-sm font-medium text-neutral-800">
                        {typeof rider.liveAccuracy === "number"
                          ? `${Math.round(rider.liveAccuracy)} m`
                          : "—"}
                      </div>
                    </div>

                    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                      <div className="text-xs text-neutral-500">Heading</div>
                      <div className="mt-1 text-sm font-medium text-neutral-800">
                        {typeof rider.liveHeading === "number"
                          ? `${Math.round(rider.liveHeading)}°`
                          : "—"}
                      </div>
                    </div>

                    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                      <div className="text-xs text-neutral-500">Speed</div>
                      <div className="mt-1 text-sm font-medium text-neutral-800">
                        {typeof rider.liveSpeed === "number"
                          ? `${rider.liveSpeed.toFixed(1)} m/s`
                          : "—"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-4">
                    <div className="text-sm font-semibold text-sky-900">
                      Rider Lifecycle Control
                    </div>

                    <div className="mt-3 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setRiderLifecycleStatus(rider, "waiting_at_restaurant")
                        }
                        disabled={savingId === rider.id}
                        className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Waiting at Restaurant
                      </button>

                      <button
                        type="button"
                        onClick={() => setRiderLifecycleStatus(rider, "assigned")}
                        disabled={savingId === rider.id}
                        className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Assign / Ready
                      </button>

                      <button
                        type="button"
                        onClick={() => setRiderLifecycleStatus(rider, "picked_up")}
                        disabled={savingId === rider.id}
                        className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Mark Picked Up
                      </button>

                      <button
                        type="button"
                        onClick={() => setRiderLifecycleStatus(rider, "delivered")}
                        disabled={savingId === rider.id}
                        className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Mark Delivered
                      </button>

                      <button
                        type="button"
                        onClick={() => setRiderLifecycleStatus(rider, "returned")}
                        disabled={savingId === rider.id}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Mark Returned
                      </button>
                    </div>
                  </div>
<div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
  <div className="flex flex-wrap items-center justify-between gap-2">
    <div>
      <div className="text-sm font-semibold text-red-900">
        Private Rider Rate & Work Setup
      </div>
      <div className="mt-1 text-xs text-red-700">
        Restaurant boss / authorised staff only. Riders should not see this.
      </div>
    </div>

    <div className="rounded-full bg-white px-3 py-1 text-sm font-bold text-red-800">
      Est. Pay: £{calculatePeriodPay(rider, payrollPeriod).toFixed(2)}
    </div>
  </div>

  <div className="mt-3 grid gap-3 md:grid-cols-2">
    <select
      value={rateDrafts[rider.id]?.riderWorkType || "freelancer"}
      onChange={(e) =>
        setRateDrafts((prev) => ({
          ...prev,
          [rider.id]: { ...prev[rider.id], riderWorkType: e.target.value },
        }))
      }
      className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none"
    >
      <option value="freelancer">Freelancer</option>
      <option value="restaurant_captive">Captive / Restaurant Linked</option>
      <option value="outsourcing_company">Outsourcing Company Rider</option>
    </select>

    <select
      value={rateDrafts[rider.id]?.rateType || "per_delivery"}
      onChange={(e) =>
        setRateDrafts((prev) => ({
          ...prev,
          [rider.id]: { ...prev[rider.id], rateType: e.target.value },
        }))
      }
      className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none"
    >
      <option value="per_delivery">Per Delivery</option>
      <option value="hourly">Hourly</option>
      <option value="fixed_shift">Fixed Shift</option>
    </select>

    <input
      value={rateDrafts[rider.id]?.linkedRestaurantName || ""}
      onChange={(e) =>
        setRateDrafts((prev) => ({
          ...prev,
          [rider.id]: { ...prev[rider.id], linkedRestaurantName: e.target.value },
        }))
      }
      placeholder="Linked restaurant name"
      className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none"
    />

    <input
      value={rateDrafts[rider.id]?.outsourcingCompanyName || ""}
      onChange={(e) =>
        setRateDrafts((prev) => ({
          ...prev,
          [rider.id]: { ...prev[rider.id], outsourcingCompanyName: e.target.value },
        }))
      }
      placeholder="Outsourcing company name"
      className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none"
    />

    <input
      value={rateDrafts[rider.id]?.postcode || ""}
      onChange={(e) =>
        setRateDrafts((prev) => ({
          ...prev,
          [rider.id]: { ...prev[rider.id], postcode: e.target.value },
        }))
      }
      placeholder="Postcode"
      className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none"
    />

    <input
      value={rateDrafts[rider.id]?.availability || ""}
      onChange={(e) =>
        setRateDrafts((prev) => ({
          ...prev,
          [rider.id]: { ...prev[rider.id], availability: e.target.value },
        }))
      }
      placeholder="Availability e.g. Mon-Sun"
      className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none"
    />

    <input
      value={rateDrafts[rider.id]?.workingHours || ""}
      onChange={(e) =>
        setRateDrafts((prev) => ({
          ...prev,
          [rider.id]: { ...prev[rider.id], workingHours: e.target.value },
        }))
      }
      placeholder="Working hours e.g. 5pm-11pm"
      className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none"
    />

    <input
      type="number"
      value={rateDrafts[rider.id]?.ratePerDelivery || ""}
      onChange={(e) =>
        setRateDrafts((prev) => ({
          ...prev,
          [rider.id]: { ...prev[rider.id], ratePerDelivery: e.target.value },
        }))
      }
      placeholder="£ per delivery"
      className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none"
    />

    <input
      type="number"
      value={rateDrafts[rider.id]?.hourlyRate || ""}
      onChange={(e) =>
        setRateDrafts((prev) => ({
          ...prev,
          [rider.id]: { ...prev[rider.id], hourlyRate: e.target.value },
        }))
      }
      placeholder="£ hourly rate"
      className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none"
    />

    <input
      type="number"
      value={rateDrafts[rider.id]?.shiftRate || ""}
      onChange={(e) =>
        setRateDrafts((prev) => ({
          ...prev,
          [rider.id]: { ...prev[rider.id], shiftRate: e.target.value },
        }))
      }
      placeholder="£ fixed shift rate"
      className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none"
    />
  </div>

  <label className="mt-3 flex items-center gap-2 text-sm text-neutral-700">
    <input
      type="checkbox"
      checked={rateDrafts[rider.id]?.canServeOtherRestaurants ?? true}
      onChange={(e) =>
        setRateDrafts((prev) => ({
          ...prev,
          [rider.id]: {
            ...prev[rider.id],
            canServeOtherRestaurants: e.target.checked,
          },
        }))
      }
    />
    Can serve other restaurants
  </label>

  <textarea
    value={rateDrafts[rider.id]?.privateRateNote || ""}
    onChange={(e) =>
      setRateDrafts((prev) => ({
        ...prev,
        [rider.id]: { ...prev[rider.id], privateRateNote: e.target.value },
      }))
    }
    placeholder="Private rate note"
    rows={3}
    className="mt-3 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none"
  />
<div className="mt-3 grid gap-3 md:grid-cols-2">

  {/* Rate Type */}
  <div>
    <label className="text-xs text-neutral-600">Rate Type</label>
    <select
      value={rateDrafts[rider.id]?.rateType || ""}
      onChange={(e) =>
        setRateDrafts((prev) => ({
          ...prev,
          [rider.id]: {
            ...prev[rider.id],
            rateType: e.target.value,
          },
        }))
      }
      className="w-full border rounded px-3 py-2 text-sm"
    >
      <option value="">Select</option>
      <option value="per_delivery">Per Delivery</option>
      <option value="hourly">Hourly</option>
      <option value="shift">Shift</option>
    </select>
  </div>

  {/* Per Delivery */}
  <div>
    <label className="text-xs text-neutral-600">£ Per Delivery</label>
    <input
      type="number"
      value={rateDrafts[rider.id]?.ratePerDelivery || ""}
      onChange={(e) =>
        setRateDrafts((prev) => ({
          ...prev,
          [rider.id]: {
            ...prev[rider.id],
            ratePerDelivery: e.target.value,
          },
        }))
      }
      className="w-full border rounded px-3 py-2 text-sm"
    />
  </div>

  {/* Hourly */}
  <div>
    <label className="text-xs text-neutral-600">£ Hourly</label>
    <input
      type="number"
      value={rateDrafts[rider.id]?.hourlyRate || ""}
      onChange={(e) =>
        setRateDrafts((prev) => ({
          ...prev,
          [rider.id]: {
            ...prev[rider.id],
            hourlyRate: e.target.value,
          },
        }))
      }
      className="w-full border rounded px-3 py-2 text-sm"
    />
  </div>

  {/* Shift */}
  <div>
    <label className="text-xs text-neutral-600">£ Per Shift</label>
    <input
      type="number"
      value={rateDrafts[rider.id]?.shiftRate || ""}
      onChange={(e) =>
        setRateDrafts((prev) => ({
          ...prev,
          [rider.id]: {
            ...prev[rider.id],
            shiftRate: e.target.value,
          },
        }))
      }
      className="w-full border rounded px-3 py-2 text-sm"
    />
  </div>

  {/* Private Note */}
  <div className="md:col-span-2">
    <label className="text-xs text-neutral-600">Private Rate Note</label>
    <textarea
      value={rateDrafts[rider.id]?.privateRateNote || ""}
      onChange={(e) =>
        setRateDrafts((prev) => ({
          ...prev,
          [rider.id]: {
            ...prev[rider.id],
            privateRateNote: e.target.value,
          },
        }))
      }
      className="w-full border rounded px-3 py-2 text-sm"
      rows={2}
    />
  </div>

</div>
  <button
    type="button"
    onClick={() => saveRiderPrivateSettings(rider)}
    disabled={savingId === rider.id}
    className="mt-3 rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {savingId === rider.id ? "Saving..." : "Save Private Rider Settings"}
  </button>
</div>
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <div className="text-sm font-semibold text-amber-900">
                      Owner Correction Control
                    </div>

                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-neutral-600">
                          Adjustment (+ / -)
                        </label>
                        <input
                          type="number"
                          value={adjustments[rider.id] || ""}
                          onChange={(e) =>
                            setAdjustments((prev) => ({
                              ...prev,
                              [rider.id]: e.target.value,
                            }))
                          }
                          placeholder="e.g. 1 or -1"
                          className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none"
                        />

                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => setQuickAdjustment(rider.id, 1)}
                            className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                          >
                            +1
                          </button>

                          <button
                            type="button"
                            onClick={() => setQuickAdjustment(rider.id, -1)}
                            className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                          >
                            -1
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-medium text-neutral-600">
                          Correction Note
                        </label>
                        <input
                          type="text"
                          value={notes[rider.id] || ""}
                          onChange={(e) =>
                            setNotes((prev) => ({
                              ...prev,
                              [rider.id]: e.target.value,
                            }))
                          }
                          placeholder="Why adjusted?"
                          className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none"
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => saveCorrection(rider)}
                        disabled={savingId === rider.id}
                        className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {savingId === rider.id ? "Saving..." : "Save Correction"}
                      </button>

                      <button
                        type="button"
                        onClick={() => resetRider(rider)}
                        disabled={savingId === rider.id}
                        className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Reset to Available
                      </button>
                    </div>
                  </div>

                  {rider.correctionNote ? (
                    <div className="mt-3 text-xs text-neutral-500">
                      Last note:{" "}
                      <span className="font-medium text-neutral-700">
                        {rider.correctionNote}
                      </span>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}