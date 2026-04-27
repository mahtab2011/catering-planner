"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  collection,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { canAccess, getCurrentAccount, isPending } from "@/lib/authGuard";

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

type OrderItem = {
  name: string;
  qty: number;
  note?: string;
};

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
  deliveryStatus?: DeliveryStatus | string;
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
  email?: string;
  authUid?: string;

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

  // WORK SETTINGS
  riderWorkType?: string;
  linkedRestaurantName?: string;
  outsourcingCompanyName?: string;
  canServeOtherRestaurants?: boolean;
  postcode?: string;
  availability?: string;
  workingHours?: string;

  // 💰 RATE SETTINGS (ADD THIS BLOCK)
  rateType?: string;
  ratePerDelivery?: number;
  hourlyRate?: number;
  shiftRate?: number;
  privateRateNote?: string;
};

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

function normalizeEmail(value?: string) {
  return (value || "").trim().toLowerCase();
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

function labelize(value?: string) {
  if (!value) return "unknown";
  return value.replace(/_/g, " ");
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

function getFreshCount(
  rider: RiderDoc | undefined,
  type: "today" | "week" | "month" | "completed"
) {
  if (!rider) return 0;

  if (type === "completed") {
    return Number(rider.deliveriesCompleted || 0);
  }

  if (type === "today") {
    return rider.lastDailyResetKey === getDailyKey()
      ? Number(rider.deliveriesToday || 0)
      : 0;
  }

  if (type === "week") {
    return rider.lastWeeklyResetKey === getWeeklyKey()
      ? Number(rider.deliveriesThisWeek || 0)
      : 0;
  }

  return rider.lastMonthlyResetKey === getMonthlyKey()
    ? Number(rider.deliveriesThisMonth || 0)
    : 0;
}

function sortByName<T extends { name?: string }>(items: T[]) {
  return [...items].sort((a, b) =>
    (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" })
  );
}

export default function RiderPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [riders, setRiders] = useState<RiderDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [msg, setMsg] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  const [signedInUid, setSignedInUid] = useState("");
  const [signedInName, setSignedInName] = useState("");
  const [signedInEmail, setSignedInEmail] = useState("");

  const [selectedRiderId, setSelectedRiderId] = useState("");
  const [tracking, setTracking] = useState(false);
  const [locationError, setLocationError] = useState("");

  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setSignedInUid("");
        setSignedInName("");
        setSignedInEmail("");
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

        if (!canAccess(account, ["rider"])) {
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
          router.replace("/signup/rider/success");
          return;
        }

        setSignedInUid(user.uid || "");
        setSignedInName(user.displayName || "");
        setSignedInEmail(normalizeEmail(user.email || ""));
        setAllowed(true);
        setCheckingAccess(false);
      } catch (error) {
        console.error("Rider access check failed:", error);
        setAllowed(false);
        setCheckingAccess(false);
        setLoading(false);
        router.replace("/login");
      }
    });

    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("selectedRiderId");
    if (saved) {
      setSelectedRiderId(saved);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (selectedRiderId) {
      window.localStorage.setItem("selectedRiderId", selectedRiderId);
    }
  }, [selectedRiderId]);

  useEffect(() => {
    if (!allowed || !signedInUid) {
      setRiders([]);
      return;
    }

    setLoading(true);

    const riderMap = new Map<string, RiderDoc>();

    function pushRiders(next: RiderDoc[]) {
      next.forEach((item) => riderMap.set(item.id, item));
      const merged = sortByName(Array.from(riderMap.values()));
      setRiders(merged);
      setLoading(false);
    }

    const unsubscribers: Array<() => void> = [];

    const qByOwner = query(
      collection(db, "riders"),
      where("ownerUid", "==", signedInUid)
    );

    unsubscribers.push(
      onSnapshot(
        qByOwner,
        (snap) => {
          const data: RiderDoc[] = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<RiderDoc, "id">),
          }));
          pushRiders(data);
        },
        (err) => {
          console.error(err);
          setMsg("❌ Failed to load riders");
          setLoading(false);
        }
      )
    );

    const qByAuthUid = query(
      collection(db, "riders"),
      where("authUid", "==", signedInUid)
    );

    unsubscribers.push(
      onSnapshot(
        qByAuthUid,
        (snap) => {
          const data: RiderDoc[] = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<RiderDoc, "id">),
          }));
          pushRiders(data);
        },
        (err) => {
          console.error(err);
        }
      )
    );

    if (signedInEmail) {
      const qByEmail = query(
        collection(db, "riders"),
        where("email", "==", signedInEmail)
      );

      unsubscribers.push(
        onSnapshot(
          qByEmail,
          (snap) => {
            const data: RiderDoc[] = snap.docs.map((d) => ({
              id: d.id,
              ...(d.data() as Omit<RiderDoc, "id">),
            }));
            pushRiders(data);
          },
          (err) => {
            console.error(err);
          }
        )
      );
    }

    return () => {
      unsubscribers.forEach((fn) => fn());
    };
  }, [allowed, signedInUid, signedInEmail]);

  useEffect(() => {
    if (!selectedRiderId && riders.length > 0) {
      setSelectedRiderId(riders[0].id);
      return;
    }

    if (
      selectedRiderId &&
      riders.length > 0 &&
      !riders.some((r) => r.id === selectedRiderId)
    ) {
      setSelectedRiderId(riders[0].id);
    }
  }, [riders, selectedRiderId]);

  const currentRider =
    riders.find((r) => r.id === selectedRiderId) ||
    (riders[0]
      ? riders[0]
      : {
          id: "",
          name: "",
          currentStatus: "available",
          currentOrderId: "",
          deliveriesCompleted: 0,
          deliveriesToday: 0,
          deliveriesThisWeek: 0,
          deliveriesThisMonth: 0,
          lastDailyResetKey: getDailyKey(),
          lastWeeklyResetKey: getWeeklyKey(),
          lastMonthlyResetKey: getMonthlyKey(),
          isLocationSharing: false,
        });

  useEffect(() => {
    if (!allowed) {
      setOrders([]);
      return;
    }

    const orderMap = new Map<string, OrderDoc>();
    const unsubscribers: Array<() => void> = [];

    function pushOrders(next: OrderDoc[]) {
      next.forEach((item) => orderMap.set(item.id, item));
      const merged = Array.from(orderMap.values()).sort((a, b) => {
        const aTime =
          typeof a.createdAt?.toDate === "function"
            ? a.createdAt.toDate().getTime()
            : a.createdAt
              ? new Date(a.createdAt).getTime()
              : 0;

        const bTime =
          typeof b.createdAt?.toDate === "function"
            ? b.createdAt.toDate().getTime()
            : b.createdAt
              ? new Date(b.createdAt).getTime()
              : 0;

        return bTime - aTime;
      });

      setOrders(merged);
      setLoading(false);
    }

    if (signedInUid) {
      const qByOwner = query(
        collection(db, "orders"),
        where("ownerUid", "==", signedInUid),
        orderBy("createdAt", "desc")
      );

      unsubscribers.push(
        onSnapshot(
          qByOwner,
          (snap) => {
            const data: OrderDoc[] = snap.docs.map((d) => ({
              id: d.id,
              ...(d.data() as Omit<OrderDoc, "id">),
            }));
            pushOrders(data);
          },
          (err) => {
            console.error(err);
          }
        )
      );
    }

    if (currentRider?.id) {
      const qByRider = query(
        collection(db, "orders"),
        where("riderId", "==", currentRider.id),
        orderBy("createdAt", "desc")
      );

      unsubscribers.push(
        onSnapshot(
          qByRider,
          (snap) => {
            const data: OrderDoc[] = snap.docs.map((d) => ({
              id: d.id,
              ...(d.data() as Omit<OrderDoc, "id">),
            }));
            pushOrders(data);
          },
          (err) => {
            console.error(err);
          }
        )
      );
    }

    if (currentRider?.restaurantId) {
      const qByRestaurant = query(
        collection(db, "orders"),
        where("restaurantId", "==", currentRider.restaurantId),
        orderBy("createdAt", "desc")
      );

      unsubscribers.push(
        onSnapshot(
          qByRestaurant,
          (snap) => {
            const data: OrderDoc[] = snap.docs.map((d) => ({
              id: d.id,
              ...(d.data() as Omit<OrderDoc, "id">),
            }));
            pushOrders(data);
          },
          (err) => {
            console.error(err);
          }
        )
      );
    }

    if (unsubscribers.length === 0) {
      setOrders([]);
      setLoading(false);
      return;
    }

    return () => {
      unsubscribers.forEach((fn) => fn());
    };
  }, [allowed, signedInUid, currentRider?.id, currentRider?.restaurantId]);

  useEffect(() => {
    setTracking(Boolean(currentRider?.isLocationSharing));
  }, [currentRider?.id, currentRider?.isLocationSharing]);

  useEffect(() => {
    async function refreshResetKeys() {
      if (!currentRider?.id) return;

      const dailyKey = getDailyKey();
      const weeklyKey = getWeeklyKey();
      const monthlyKey = getMonthlyKey();

      const updates: Record<string, any> = {};

      if (currentRider.lastDailyResetKey !== dailyKey) {
        updates.deliveriesToday = 0;
        updates.lastDailyResetKey = dailyKey;
      }

      if (currentRider.lastWeeklyResetKey !== weeklyKey) {
        updates.deliveriesThisWeek = 0;
        updates.lastWeeklyResetKey = weeklyKey;
      }

      if (currentRider.lastMonthlyResetKey !== monthlyKey) {
        updates.deliveriesThisMonth = 0;
        updates.lastMonthlyResetKey = monthlyKey;
      }

      if (Object.keys(updates).length > 0) {
        updates.updatedAt = serverTimestamp();
        try {
          await updateDoc(doc(db, "riders", currentRider.id), updates);
        } catch (err) {
          console.error(err);
        }
      }
    }

    if (allowed) {
      refreshResetKeys();
    }
  }, [
    allowed,
    currentRider?.id,
    currentRider?.lastDailyResetKey,
    currentRider?.lastWeeklyResetKey,
    currentRider?.lastMonthlyResetKey,
  ]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && typeof navigator !== "undefined") {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

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

  async function startLiveTracking() {
    if (!currentRider?.id) {
      setMsg("❌ Please select a rider first");
      return;
    }

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationError("Location is not supported on this device");
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setLocationError("");
    setTracking(true);
    setMsg("Starting live tracking...");

    try {
      await updateDoc(doc(db, "riders", currentRider.id), {
        isLocationSharing: true,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error(err);
    }

    const riderId = currentRider.id;

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        try {
          await updateDoc(doc(db, "riders", riderId), {
            liveLat: position.coords.latitude,
            liveLng: position.coords.longitude,
            liveAccuracy: position.coords.accuracy ?? null,
            liveHeading: position.coords.heading ?? null,
            liveSpeed: position.coords.speed ?? null,
            liveLocationUpdatedAt: serverTimestamp(),
            isLocationSharing: true,
            updatedAt: serverTimestamp(),
          });

          setMsg("✅ Live tracking active");
        } catch (err) {
          console.error(err);
        }
      },
      async (error) => {
        console.error(error);
        setLocationError(error.message || "Failed to get location");
        setTracking(false);

        try {
          await updateDoc(doc(db, "riders", riderId), {
            isLocationSharing: false,
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          console.error(err);
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      }
    );

    watchIdRef.current = watchId;
  }

  async function stopLiveTracking() {
    if (watchIdRef.current !== null && typeof navigator !== "undefined") {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setTracking(false);

    if (!currentRider?.id) return;

    try {
      await updateDoc(doc(db, "riders", currentRider.id), {
        isLocationSharing: false,
        updatedAt: serverTimestamp(),
      });
      setMsg("✅ Live tracking stopped");
    } catch (err) {
      console.error(err);
    }
  }

  async function pickUpOrder(orderId: string) {
    if (!currentRider?.id) {
      setMsg("❌ Please select a rider first");
      return;
    }

    try {
      setUpdatingId(orderId);
      setMsg("Updating rider pickup...");

      await updateDoc(doc(db, "orders", orderId), {
        riderId: currentRider.id,
        riderName: currentRider.name || currentRider.id,
        status: "out_for_delivery",
        deliveryStatus: "picked_up",
        pickedUpAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "riders", currentRider.id), {
        currentStatus: "picked_up",
        currentOrderId: orderId,
        lastPickedUpAt: serverTimestamp(),
        outSince: serverTimestamp(),
        returnedAt: null,
        updatedAt: serverTimestamp(),
      });

      setMsg("✅ Rider picked up order");
    } catch (err) {
      console.error(err);
      setMsg("❌ Failed to update pickup");
    } finally {
      setUpdatingId("");
    }
  }

  async function markDelivered(orderId: string) {
    if (!currentRider?.id) {
      setMsg("❌ Please select a rider first");
      return;
    }

    try {
      setUpdatingId(orderId);
      setMsg("Updating delivered status...");

      const order = orders.find((o) => o.id === orderId);
      const rider = riders.find((r) => r.id === currentRider.id);
      const alreadyCounted = order?.countedInRiderStats === true;

      await ensureRiderCountersAreFresh(rider);

      await updateDoc(doc(db, "orders", orderId), {
        status: "delivered",
        deliveryStatus: "delivered",
        deliveredAt: serverTimestamp(),
        countedInRiderStats: true,
        updatedAt: serverTimestamp(),
      });

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

      await updateDoc(doc(db, "riders", currentRider.id), riderUpdate);

      setMsg(
        alreadyCounted
          ? "✅ Order marked delivered"
          : "✅ Order marked delivered and rider count updated"
      );
    } catch (err) {
      console.error(err);
      setMsg("❌ Failed to mark delivered");
    } finally {
      setUpdatingId("");
    }
  }

  async function markReturnedToShop() {
    if (!currentRider?.id) {
      setMsg("❌ Please select a rider first");
      return;
    }

    try {
      setUpdatingId("rider_return");
      setMsg("Updating rider return...");

      await stopLiveTracking();

      await updateDoc(doc(db, "riders", currentRider.id), {
        currentStatus: "available",
        currentOrderId: "",
        returnedAt: serverTimestamp(),
        outSince: null,
        updatedAt: serverTimestamp(),
      });

      setMsg("✅ Rider returned to shop and is available");
    } catch (err) {
      console.error(err);
      setMsg("❌ Failed to update rider return");
    } finally {
      setUpdatingId("");
    }
  }

  const myOrders = useMemo(
    () =>
      orders.filter((o) => {
        const isDelivery = cleanText(o.orderType) === "delivery";
        const notCancelled = cleanText(o.status) !== "cancelled";

        const matchesRider = cleanText(o.riderId) === cleanText(currentRider?.id);
        const matchesRestaurant =
          !!currentRider?.restaurantId &&
          cleanText(o.restaurantId) === cleanText(currentRider.restaurantId);

        return isDelivery && notCancelled && (matchesRider || matchesRestaurant);
      }),
    [orders, currentRider?.id, currentRider?.restaurantId]
  );

  const assignedOrders = useMemo(
    () =>
      myOrders.filter((o) => {
        const s = cleanText(o.status);
        const belongsToCurrentRider =
          cleanText(o.riderId) === cleanText(currentRider?.id);

        return (
          belongsToCurrentRider &&
          (s === "assigned" ||
            s === "ready_for_delivery" ||
            s === "ready_for_pickup")
        );
      }),
    [myOrders, currentRider?.id]
  );

  const outOrders = useMemo(
    () =>
      myOrders.filter((o) => {
        const s = cleanText(o.status);
        const belongsToCurrentRider =
          cleanText(o.riderId) === cleanText(currentRider?.id);

        return belongsToCurrentRider && (s === "out_for_delivery" || s === "picked_up");
      }),
    [myOrders, currentRider?.id]
  );

  const deliveredOrders = useMemo(
    () =>
      myOrders.filter(
        (o) =>
          cleanText(o.riderId) === cleanText(currentRider?.id) &&
          cleanText(o.status) === "delivered"
      ),
    [myOrders, currentRider?.id]
  );
const riderEarnings = useMemo(() => {
  const rider = currentRider as RiderDoc | undefined;

  if (!rider?.id) return 0;

  const completed = getFreshCount(rider, "completed");

  if (rider.rateType === "per_delivery") {
    return completed * Number(rider.ratePerDelivery || 0);
  }

  if (rider.rateType === "shift") {
    return Number(rider.shiftRate || 0);
  }

  return 0;
}, [currentRider]);

const riderTodayEarnings = useMemo(() => {
  const rider = currentRider as RiderDoc | undefined;

  if (!rider?.id) return 0;

  const today = getFreshCount(rider, "today");

  if (rider.rateType === "per_delivery") {
    return today * Number(rider.ratePerDelivery || 0);
  }

  return 0;
}, [currentRider]);
const riderWeekEarnings = useMemo(() => {
  const rider = currentRider as RiderDoc | undefined;

  if (!rider?.id) return 0;

  const week = getFreshCount(rider, "week");

  if (rider.rateType === "per_delivery") {
    return week * Number(rider.ratePerDelivery || 0);
  }

  return 0;
}, [currentRider]);
const riderMonthEarnings = useMemo(() => {
  const rider = currentRider as RiderDoc | undefined;

  if (!rider?.id) return 0;

  const month = getFreshCount(rider, "month");

  if (rider.rateType === "per_delivery") {
    return month * Number(rider.ratePerDelivery || 0);
  }

  return 0;
}, [currentRider]);
  const outMinutes = minutesSince(currentRider?.outSince);

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
          You do not have access to the rider dashboard.
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <div className="p-6 text-center text-neutral-600">
        Loading rider page...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8faf7]">
      <div className="mx-auto max-w-5xl p-6">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              🛵 Rider Dashboard
            </h1>
            <p className="mt-1 text-sm text-neutral-600">
              Assigned orders, pickup flow, live tracking, delivery progress,
              and return-to-shop tracking.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/orders/delivery"
              className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Delivery Board
            </Link>

            <Link
              href="/orders/riders"
              className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Rider Control
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

        {locationError ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {locationError}
          </div>
        ) : null}

        <div className="mb-4 rounded-xl border border-neutral-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <div className="mb-1 text-xs font-medium text-neutral-600">
                Signed in as
              </div>
              <div className="text-sm font-medium text-neutral-900">
                {signedInName || signedInEmail || signedInUid || "Unknown user"}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600">
                Select Rider
              </label>
              <select
                value={currentRider?.id || ""}
                onChange={(e) => setSelectedRiderId(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 outline-none"
              >
                <option value="">Select rider</option>
                {riders.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name || r.id}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {!currentRider?.id ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-4 text-sm text-neutral-500 shadow-sm">
            No rider found for this account yet. Please check rider setup or rider linking first.
          </div>
        ) : (
          <>
            <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="text-lg font-semibold text-neutral-900">
                    {currentRider.name || "Unnamed Rider"}
                  </div>

                  <div className="mt-1 text-sm text-neutral-600">
                    Rider ID: {currentRider.id}
                  </div>

                  {currentRider.phone ? (
                    <div className="mt-1 text-sm text-neutral-600">
                      Phone: {currentRider.phone}
                    </div>
                  ) : null}

                  {currentRider.restaurantName ? (
                    <div className="mt-1 text-sm text-neutral-600">
                      Restaurant: {currentRider.restaurantName}
                    </div>
                  ) : null}
{currentRider.riderWorkType ? (
  <div className="mt-1 text-sm text-neutral-600">
    Work Type: {labelize(currentRider.riderWorkType)}
  </div>
) : null}

{currentRider.linkedRestaurantName ? (
  <div className="mt-1 text-sm text-neutral-600">
    Linked Restaurant: {currentRider.linkedRestaurantName}
  </div>
) : null}

{currentRider.outsourcingCompanyName ? (
  <div className="mt-1 text-sm text-neutral-600">
    Rider Company: {currentRider.outsourcingCompanyName}
  </div>
) : null}

{currentRider.postcode ? (
  <div className="mt-1 text-sm text-neutral-600">
    Postcode: {currentRider.postcode}
  </div>
) : null}

{currentRider.availability ? (
  <div className="mt-1 text-sm text-neutral-600">
    Availability: {currentRider.availability}
  </div>
) : null}

{currentRider.workingHours ? (
  <div className="mt-1 text-sm text-neutral-600">
    Working Hours: {currentRider.workingHours}
  </div>
) : null}
                  {typeof currentRider.liveLat === "number" &&
                  typeof currentRider.liveLng === "number" ? (
                    <div className="mt-2 space-y-1 text-xs text-neutral-600">
                      <div>
                        Live Location: {currentRider.liveLat.toFixed(5)},{" "}
                        {currentRider.liveLng.toFixed(5)}
                      </div>

                      <div>
                        Accuracy:{" "}
                        {typeof currentRider.liveAccuracy === "number"
                          ? `${Math.round(currentRider.liveAccuracy)} m`
                          : "—"}
                      </div>

                      <div>
                        Last Location Update:{" "}
                        {formatDateTime(currentRider.liveLocationUpdatedAt)}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  <span
                    className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${getStatusBadgeClass(
                      currentRider.currentStatus
                    )}`}
                  >
                    {labelize(currentRider.currentStatus)}
                  </span>

                  {currentRider.isLocationSharing ? (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
                      Live tracking on
                    </span>
                  ) : (
                    <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm font-semibold text-neutral-700">
                      Live tracking off
                    </span>
                  )}

                  {outMinutes !== null &&
                  cleanText(currentRider.currentStatus) !== "available" ? (
                    <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-sm font-semibold text-sky-700">
                      Out for {outMinutes} min
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  Assigned: <b>{assignedOrders.length}</b>
                </div>
                <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800">
                  Out Now: <b>{outOrders.length}</b>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                  Delivered: <b>{deliveredOrders.length}</b>
                </div>
                <div className="rounded-xl border border-neutral-200 bg-white p-3 text-sm text-neutral-800">
                  Status: <b>{labelize(currentRider.currentStatus)}</b>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700">
                  Completed Total:{" "}
                  <b>{getFreshCount(currentRider, "completed")}</b>
                </div>
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700">
                  Today: <b>{getFreshCount(currentRider, "today")}</b>
                </div>
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700">
                  This Week: <b>{getFreshCount(currentRider, "week")}</b>
                </div>
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700">
                  This Month: <b>{getFreshCount(currentRider, "month")}</b>
                </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
  My Earnings:{" "}
  <b>£{riderEarnings.toFixed(2)}</b>
</div>
<div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800">
  Today £:{" "}
  <b>£{riderTodayEarnings.toFixed(2)}</b>
</div>
<div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-800">
  Week £:{" "}
  <b>£{riderWeekEarnings.toFixed(2)}</b>
</div>
<div className="rounded-xl border border-purple-200 bg-purple-50 p-3 text-sm text-purple-800">
  Month £:{" "}
  <b>£{riderMonthEarnings.toFixed(2)}</b>
</div>
<div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700">
  Rate Type:{" "}
  <b>
    {currentRider?.rateType === "per_delivery" && "Per Delivery"}
    {currentRider?.rateType === "shift" && "Per Shift"}
    {!currentRider?.rateType && "Not set"}
  </b>
</div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={startLiveTracking}
                  disabled={tracking || !currentRider?.id}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {tracking ? "Live Tracking On" : "Start Live Tracking"}
                </button>

                <button
                  type="button"
                  onClick={stopLiveTracking}
                  disabled={!tracking}
                  className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Stop Live Tracking
                </button>

                <button
                  type="button"
                  onClick={markReturnedToShop}
                  disabled={updatingId === "rider_return"}
                  className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {updatingId === "rider_return"
                    ? "Updating..."
                    : "Returned to Shop"}
                </button>
              </div>
            </div>

            <RiderSection
              title="Assigned / Ready for Pickup"
              orders={assignedOrders}
              emptyText="No assigned orders waiting for pickup"
              updatingId={updatingId}
              onPickUp={pickUpOrder}
              onDeliver={markDelivered}
            />

            <RiderSection
              title="Out for Delivery"
              orders={outOrders}
              emptyText="No active deliveries right now"
              updatingId={updatingId}
              onPickUp={pickUpOrder}
              onDeliver={markDelivered}
            />

            <RiderSection
              title="Delivered Orders"
              orders={deliveredOrders}
              emptyText="No delivered orders yet"
              updatingId={updatingId}
              onPickUp={pickUpOrder}
              onDeliver={markDelivered}
            />
          </>
        )}
      </div>
    </div>
  );
}

function RiderSection({
  title,
  orders,
  emptyText,
  updatingId,
  onPickUp,
  onDeliver,
}: {
  title: string;
  orders: OrderDoc[];
  emptyText: string;
  updatingId: string;
  onPickUp: (orderId: string) => void;
  onDeliver: (orderId: string) => void;
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

            const assignedMinutes = minutesSince(o.assignedAt);
            const pickedUpMinutes = minutesSince(o.pickedUpAt);
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
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClass(
                        o.status
                      )}`}
                    >
                      {labelize(o.status)}
                    </span>

                    {assignedMinutes !== null &&
                    (status === "ready_for_delivery" ||
                      status === "ready_for_pickup" ||
                      status === "assigned") ? (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        Waiting {assignedMinutes} min
                      </span>
                    ) : null}

                    {pickedUpMinutes !== null &&
                    (status === "out_for_delivery" || status === "picked_up") ? (
                      <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                        On route {pickedUpMinutes} min
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="mt-3 text-sm text-neutral-600">{itemSummary}</div>

                <div className="mt-4 flex flex-wrap gap-3">
                  {(status === "ready_for_delivery" ||
                    status === "ready_for_pickup" ||
                    status === "assigned") ? (
                    <button
                      type="button"
                      onClick={() => onPickUp(o.id)}
                      disabled={updatingId === o.id}
                      className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {updatingId === o.id ? "Updating..." : "Pick Up Order"}
                    </button>
                  ) : null}

                  {(status === "out_for_delivery" || status === "picked_up") ? (
                    <button
                      type="button"
                      onClick={() => onDeliver(o.id)}
                      disabled={updatingId === o.id}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {updatingId === o.id ? "Updating..." : "Mark Delivered"}
                    </button>
                  ) : null}

                  {status === "delivered" ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                      ✅ Completed
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