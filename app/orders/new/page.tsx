"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  query,
  runTransaction,
  serverTimestamp,
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

type ExistingOrder = {
  id: string;
  customerName?: string;
  customerPhone?: string;
  customerPhoneNorm?: string;
  customerPostcode?: string;
  createdAt?: any;
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
  if (account.role === "rider") return "/orders/rider";
  if (account.role === "catering_house") return "/events";

  if (account.role === "blackcab_partner") {
    if (isPending(account)) return "/signup/blackcab/pending";
    return "/blackcab";
  }

  if (account.role === "staff") return "/admin";

  return "/";
}

function normPhone(input: string) {
  return (input || "").replace(/\D/g, "");
}

function to12HourLabel(value: string) {
  const [hh, mm] = value.split(":").map(Number);
  const ampm = hh >= 12 ? "PM" : "AM";
  const hour12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${hour12}:${String(mm).padStart(2, "0")} ${ampm}`;
}

function buildTimeSlots() {
  const slots: string[] = [];
  for (let hour = 11; hour <= 22; hour++) {
    slots.push(`${String(hour).padStart(2, "0")}:00`);
    slots.push(`${String(hour).padStart(2, "0")}:30`);
  }
  return slots;
}

const TIME_SLOTS = buildTimeSlots();

const MENU_OPTIONS = [
  "Chicken Biryani",
  "Kacchi Biryani",
  "Beef Tehari",
  "Chicken Roast",
  "Grilled Chicken",
  "Burger",
  "Pizza Slice",
  "Salad",
  "Borhani",
  "Firni",
];

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

function defaultNextSlot() {
  const now = new Date();
  let hour = now.getHours();
  let minute = now.getMinutes();

  if (minute === 0) {
    minute = 0;
  } else if (minute <= 30) {
    minute = 30;
  } else {
    hour += 1;
    minute = 0;
  }

  if (hour < 11) {
    return "11:00";
  }

  if (hour > 22 || (hour === 22 && minute > 30)) {
    return "22:30";
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export default function NewOrderPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [guestMode, setGuestMode] = useState(false);
  const [creatorRole, setCreatorRole] = useState<string>("guest");

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [lookupMsg, setLookupMsg] = useState("");
  const [lookingUpCustomer, setLookingUpCustomer] = useState(false);

  const [orderType, setOrderType] = useState<OrderType>("inhouse");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("paid");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerPostcode, setCustomerPostcode] = useState("");

  const todayDate = todayLocalYmd();
  const tomorrowDate = addDaysLocalYmd(todayDate, 1);
  const dayAfterDate = addDaysLocalYmd(todayDate, 2);

  const [orderDate, setOrderDate] = useState(todayDate);
  const [timeSlot, setTimeSlot] = useState(defaultNextSlot());

  const [items, setItems] = useState<OrderItem[]>([
    { name: "", qty: 1, note: "" },
  ]);

  const [totalAmount, setTotalAmount] = useState("");
  const [notes, setNotes] = useState("");

  const customerPhoneNorm = useMemo(
    () => normPhone(customerPhone),
    [customerPhone]
  );

  const isAdvanceOrder = useMemo(() => {
    return orderDate > todayLocalYmd();
  }, [orderDate]);

  const fullPaymentRequired = useMemo(() => {
    if (isAdvanceOrder) return true;
    if (orderType === "delivery") return true;
    return false;
  }, [isAdvanceOrder, orderType]);

  const selectedSlotLabel = useMemo(() => {
    return timeSlot ? to12HourLabel(timeSlot) : "";
  }, [timeSlot]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setAllowed(true);
        setGuestMode(true);
        setCreatorRole("guest");
        setCheckingAccess(false);
        return;
      }

      try {
        const account = await getCurrentAccount();

        if (!account) {
          setUser(currentUser);
          setAllowed(true);
          setGuestMode(false);
          setCreatorRole("customer");
          setCheckingAccess(false);
          return;
        }

        if (account.role === "restaurant" && isPending(account)) {
          setUser(currentUser);
          setAllowed(false);
          setGuestMode(false);
          setCheckingAccess(false);
          router.replace("/signup/restaurant/pending");
          return;
        }

        if (canAccess(account, ["restaurant", "staff"])) {
          setUser(currentUser);
          setAllowed(true);
          setGuestMode(false);
          setCreatorRole(account.role || "restaurant");
          setCheckingAccess(false);
          return;
        }

        if (account.role === "customer") {
          setUser(currentUser);
          setAllowed(true);
          setGuestMode(false);
          setCreatorRole("customer");
          setCheckingAccess(false);
          return;
        }

        setUser(currentUser);
        setAllowed(false);
        setGuestMode(false);
        setCheckingAccess(false);
        router.replace(getRedirectPath(account));
      } catch (error) {
        console.error("New order page access check failed:", error);
        setUser(currentUser);
        setAllowed(true);
        setGuestMode(false);
        setCreatorRole("customer");
        setCheckingAccess(false);
      }
    });

    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (fullPaymentRequired) {
      setPaymentStatus("paid");
    }
  }, [fullPaymentRequired]);

  async function lookupCustomerByPhone() {
    const phoneNorm = normPhone(customerPhone);

    if (!phoneNorm) {
      setLookupMsg("⚠️ Enter customer phone first");
      return;
    }

    try {
      setLookingUpCustomer(true);
      setLookupMsg("Looking up customer...");

      const q = query(
        collection(db, "orders"),
        where("customerPhoneNorm", "==", phoneNorm),
        limit(5)
      );

      const snap = await getDocs(q);

      if (snap.empty) {
        setLookupMsg("No previous customer found with this phone");
        return;
      }

      const matches: ExistingOrder[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ExistingOrder, "id">),
      }));

      const first = matches[0];

      if (first.customerName) setCustomerName(first.customerName);
      if (first.customerPostcode) setCustomerPostcode(first.customerPostcode);

      setLookupMsg(
        `✅ Previous customer found (${matches.length} match${
          matches.length > 1 ? "es" : ""
        })`
      );
    } catch (error) {
      console.error(error);
      setLookupMsg("❌ Customer lookup failed");
    } finally {
      setLookingUpCustomer(false);
    }
  }

  function updateItem(
    index: number,
    field: keyof OrderItem,
    value: string | number
  ) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]:
                field === "qty" ? Math.max(1, Number(value) || 1) : value,
            }
          : item
      )
    );
  }

  function addItemRow() {
    setItems((prev) => [...prev, { name: "", qty: 1, note: "" }]);
  }

  function removeItemRow(index: number) {
    setItems((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }

  function validateForm() {
    if (!customerName.trim()) return "Customer name is required";
    if (!customerPhoneNorm) return "Customer phone is required";
    if (!orderDate) return "Order date is required";
    if (!timeSlot) return "Time slot is required";

    const validItems = items.filter((it) => it.name.trim() && it.qty > 0);
    if (validItems.length === 0) return "Add at least one order item";

    if (fullPaymentRequired && paymentStatus !== "paid") {
      return "This order must be fully paid";
    }

    return "";
  }

  async function getNextOrderNumber() {
    const counterRef = doc(db, "counters", "orders");

    const nextNumber = await runTransaction(db, async (tx) => {
      const snap = await tx.get(counterRef);

      const current = snap.exists() ? Number(snap.data()?.lastNumber || 0) : 0;
      const next = current + 1;

      tx.set(counterRef, { lastNumber: next }, { merge: true });
      return next;
    });

    return nextNumber;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const errorMsg = validateForm();
    if (errorMsg) {
      setMsg(`⚠️ ${errorMsg}`);
      return;
    }

    try {
      setSubmitting(true);
      setMsg("Saving order...");

      const cleanItems = items
        .filter((it) => it.name.trim() && it.qty > 0)
        .map((it, idx) => ({
          lineId: `line-${Date.now()}-${idx}`,
          name: it.name.trim(),
          qty: Number(it.qty) || 1,
          note: (it.note || "").trim(),
          kitchenStatus: "pending",
          startedAt: null,
          readyAt: null,
        }));

      const orderNumber = await getNextOrderNumber();

      const isRestaurantOrStaff =
        creatorRole === "restaurant" || creatorRole === "staff";

      await addDoc(collection(db, "orders"), {
        ownerUid: isRestaurantOrStaff ? user?.uid || null : null,
        orderNumber,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerPhoneNorm,
        customerPostcode: customerPostcode.trim(),

        orderType,
        paymentStatus,

        orderDate,
        timeSlot,
        slotLabel: to12HourLabel(timeSlot),

        items: cleanItems,
        totalItems: cleanItems.reduce((sum, it) => sum + Number(it.qty || 0), 0),
        totalAmount: Number(totalAmount) || 0,

        fullPaymentRequired,
        notes: notes.trim(),

        status: "new",
        source: guestMode ? "guest" : creatorRole === "customer" ? "customer" : "manual",
        createdByUid: user?.uid || null,
        createdByRole: creatorRole,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setMsg(`✅ Order #${orderNumber} saved successfully`);

      setCustomerName("");
      setCustomerPhone("");
      setCustomerPostcode("");
      setOrderType("inhouse");
      setPaymentStatus("paid");
      setOrderDate(todayLocalYmd());
      setTimeSlot(defaultNextSlot());
      setItems([{ name: "", qty: 1, note: "" }]);
      setTotalAmount("");
      setNotes("");
      setLookupMsg("");
    } catch (error) {
      console.error(error);
      setMsg("❌ Failed to save order");
    } finally {
      setSubmitting(false);
    }
  }

  function renderDateShortcut(label: string, value: string, helper: string) {
    const active = orderDate === value;

    return (
      <button
        type="button"
        onClick={() => setOrderDate(value)}
        className={`rounded-2xl border px-4 py-3 text-left transition ${
          active
            ? "border-emerald-600 bg-emerald-600 text-white"
            : "border-neutral-200 bg-white text-neutral-900 hover:bg-emerald-50"
        }`}
      >
        <div className="text-sm font-semibold">{label}</div>
        <div
          className={`text-xs ${
            active ? "text-emerald-50" : "text-neutral-500"
          }`}
        >
          {helper}
        </div>
      </button>
    );
  }

  if (checkingAccess) {
    return (
      <main className="relative isolate min-h-screen bg-[#f8faf7] px-4 py-10">
        <div className="mx-auto w-full max-w-5xl rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600 shadow-sm">
          Checking access...
        </div>
      </main>
    );
  }

  if (!allowed) {
    return (
      <main className="relative isolate min-h-screen bg-[#f8faf7] px-4 py-10">
        <div className="mx-auto w-full max-w-5xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800 shadow-sm">
          You do not have access to create orders from this account.
        </div>
      </main>
    );
  }

  return (
    <div className="relative isolate min-h-screen bg-[#f8faf7]">
      <div className="relative mx-auto w-full max-w-5xl p-6">
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-neutral-900">New Order</h1>

            {guestMode ? (
              <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                Guest Order
              </span>
            ) : creatorRole === "customer" ? (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Customer Order
              </span>
            ) : (
              <span className="rounded-full border border-neutral-200 bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
                Staff / Restaurant Order
              </span>
            )}
          </div>

          <p className="mt-1 text-sm text-neutral-600">
            Create inhouse, takeaway, or delivery orders with date and time slot.
          </p>

          {(guestMode || creatorRole === "customer") && (
            <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">
              You can place your order without restaurant login. If you sign in
              or create a customer account later, you can stay connected for
              future offers and updates.
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-md">
            <h2 className="text-lg font-semibold text-neutral-900">
              Customer Details
            </h2>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                  Customer Phone
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Enter phone number"
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-500"
                  />
                  <button
                    type="button"
                    onClick={lookupCustomerByPhone}
                    disabled={lookingUpCustomer}
                    className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {lookingUpCustomer ? "Looking..." : "Find"}
                  </button>
                </div>

                {lookupMsg ? (
                  <div className="mt-2 text-sm text-neutral-600">{lookupMsg}</div>
                ) : null}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                  Postcode
                </label>
                <input
                  type="text"
                  value={customerPostcode}
                  onChange={(e) => setCustomerPostcode(e.target.value)}
                  placeholder="Optional postcode"
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-500"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-md">
            <h2 className="text-lg font-semibold text-neutral-900">
              Order Setup
            </h2>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
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

            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                  Order Type
                </label>
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value as OrderType)}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-500"
                >
                  <option value="inhouse">Inhouse</option>
                  <option value="takeaway">Takeaway</option>
                  <option value="delivery">Delivery</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                  Order Date
                </label>
                <input
                  type="date"
                  value={orderDate}
                  min={todayLocalYmd()}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                  Time Slot
                </label>
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-500"
                >
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {to12HourLabel(slot)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                  Payment Status
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) =>
                    setPaymentStatus(e.target.value as PaymentStatus)
                  }
                  disabled={fullPaymentRequired}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-500 disabled:cursor-not-allowed disabled:bg-neutral-100"
                >
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-3 text-sm text-sky-800">
                <span className="font-semibold">Selected Slot:</span>{" "}
                {formatDateLong(orderDate)} at {selectedSlotLabel}
              </div>

              <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-3 text-sm text-neutral-700">
                This time slot will appear in the kitchen planning board after the
                order is saved.
              </div>
            </div>

            <div className="mt-4">
              {fullPaymentRequired ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  ✅ Full payment required for this order
                  {isAdvanceOrder ? " (advance order)" : ""}
                  {orderType === "delivery" ? " (delivery)" : ""}
                </div>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Payment can be taken at counter / table
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-md">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-neutral-900">
                Order Items
              </h2>

              <button
                type="button"
                onClick={addItemRow}
                className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
              >
                + Add Item
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="grid gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-3 md:grid-cols-12"
                >
                  <div className="md:col-span-5">
                    <label className="mb-1 block text-xs font-medium text-neutral-600">
                      Item Name
                    </label>
                    <input
                      list={`menu-options-${index}`}
                      value={item.name}
                      onChange={(e) => updateItem(index, "name", e.target.value)}
                      placeholder="Enter menu item"
                      className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-500"
                    />
                    <datalist id={`menu-options-${index}`}>
                      {MENU_OPTIONS.map((option) => (
                        <option key={option} value={option} />
                      ))}
                    </datalist>
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-neutral-600">
                      Qty
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={item.qty}
                      onChange={(e) => updateItem(index, "qty", e.target.value)}
                      className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-500"
                    />
                  </div>

                  <div className="md:col-span-4">
                    <label className="mb-1 block text-xs font-medium text-neutral-600">
                      Note
                    </label>
                    <input
                      type="text"
                      value={item.note || ""}
                      onChange={(e) => updateItem(index, "note", e.target.value)}
                      placeholder="Optional note"
                      className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-500"
                    />
                  </div>

                  <div className="md:col-span-1 flex items-end">
                    <button
                      type="button"
                      onClick={() => removeItemRow(index)}
                      disabled={items.length === 1}
                      className="w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-md">
            <h2 className="text-lg font-semibold text-neutral-900">
              Billing & Notes
            </h2>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                  Total Amount
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                  Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional order notes"
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-500"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pb-6">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save Order"}
            </button>

            {guestMode && (
              <button
                type="button"
                onClick={() => router.push("/signup/customer")}
                className="rounded-xl border border-sky-300 bg-sky-50 px-5 py-2.5 text-sm font-semibold text-sky-800 hover:bg-sky-100"
              >
                Create Account for Future Offers
              </button>
            )}

            {msg ? (
              <div className="text-sm font-medium text-neutral-700">{msg}</div>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}