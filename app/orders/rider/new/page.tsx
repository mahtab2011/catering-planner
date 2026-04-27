"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { canAccess, getCurrentAccount, isPending } from "@/lib/authGuard";

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
  return (value || "").trim();
}

function normalizeEmail(value?: string) {
  return cleanText(value).toLowerCase();
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

export default function NewRiderPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const [ownerUid, setOwnerUid] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");

  const [restaurantId, setRestaurantId] = useState("");
  const [restaurantName, setRestaurantName] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [riderEmail, setRiderEmail] = useState("");
  const [authUid, setAuthUid] = useState("");

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
        setLoading(false);
      } catch (error) {
        console.error("New rider access check failed:", error);
        setAllowed(false);
        setCheckingAccess(false);
        setLoading(false);
        router.replace("/login");
      }
    });

    return () => unsub();
  }, [router]);

  async function handleCreateRider(e: React.FormEvent) {
    e.preventDefault();

    if (!ownerUid) {
      setMsg("❌ Please log in first");
      return;
    }

    const riderName = cleanText(name);
    const riderPhone = cleanText(phone);
    const riderEmailClean = normalizeEmail(riderEmail);
    const authUidClean = cleanText(authUid);

    if (!riderName) {
      setMsg("❌ Rider name is required");
      return;
    }

    try {
      setSubmitting(true);
      setMsg("Saving rider...");

      await addDoc(collection(db, "riders"), {
        ownerUid,
        ownerName: ownerName || "",
        ownerEmail: ownerEmail || "",

        restaurantId: cleanText(restaurantId),
        restaurantName: cleanText(restaurantName),

        name: riderName,
        phone: riderPhone,
        email: riderEmailClean,
        authUid: authUidClean,

        currentStatus: "available",
        currentOrderId: "",
        outSince: null,
        returnedAt: null,
        lastPickedUpAt: null,
        lastDeliveredAt: null,

        deliveriesCompleted: 0,
        deliveriesToday: 0,
        deliveriesThisWeek: 0,
        deliveriesThisMonth: 0,

        correctionNote: "",
        lastDailyResetKey: getDailyKey(),
        lastWeeklyResetKey: getWeeklyKey(),
        lastMonthlyResetKey: getMonthlyKey(),

        liveLat: null,
        liveLng: null,
        liveAccuracy: null,
        liveHeading: null,
        liveSpeed: null,
        liveLocationUpdatedAt: null,
        isLocationSharing: false,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setMsg("✅ Rider created successfully");

      setTimeout(() => {
        router.push("/orders/riders");
      }, 900);
    } catch (err) {
      console.error(err);
      setMsg("❌ Failed to create rider");
    } finally {
      setSubmitting(false);
    }
  }

  if (checkingAccess) {
    return (
      <main className="min-h-screen bg-[#f8faf7] px-4 py-10">
        <div className="mx-auto max-w-3xl rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600 shadow-sm">
          Checking access...
        </div>
      </main>
    );
  }

  if (!allowed) {
    return (
      <main className="min-h-screen bg-[#f8faf7] px-4 py-10">
        <div className="mx-auto max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800 shadow-sm">
          You do not have access to create riders.
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <div className="p-6 text-center text-neutral-600">
        Loading rider form...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8faf7]">
      <div className="mx-auto max-w-3xl p-6">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              ➕ Add New Rider
            </h1>
            <p className="mt-1 text-sm text-neutral-600">
              Create a new rider for this restaurant owner account.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/orders/riders"
              className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Rider Control
            </Link>

            <Link
              href="/orders/delivery"
              className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Delivery Board
            </Link>
          </div>
        </div>

        {msg ? (
          <div className="mb-4 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-700">
            {msg}
          </div>
        ) : null}

        <div className="mb-4 rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-xs font-medium text-neutral-500">Signed in as</div>
          <div className="mt-1 text-sm font-semibold text-neutral-900">
            {ownerName || ownerEmail || ownerUid || "Unknown owner"}
          </div>
        </div>

        <form
          onSubmit={handleCreateRider}
          className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Rider Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter rider name"
                className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Rider Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter rider phone"
                className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Rider Email
              </label>
              <input
                type="email"
                value={riderEmail}
                onChange={(e) => setRiderEmail(e.target.value)}
                placeholder="Rider login email"
                className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none"
              />
              <p className="mt-1 text-xs text-neutral-500">
                Best for linking the rider account to the rider dashboard later.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Restaurant ID
              </label>
              <input
                type="text"
                value={restaurantId}
                onChange={(e) => setRestaurantId(e.target.value)}
                placeholder="Optional restaurant ID"
                className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Restaurant Name
              </label>
              <input
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                placeholder="Optional restaurant name"
                className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Rider Auth UID
              </label>
              <input
                type="text"
                value={authUid}
                onChange={(e) => setAuthUid(e.target.value)}
                placeholder="Optional exact auth UID for direct linking"
                className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none"
              />
              <p className="mt-1 text-xs text-neutral-500">
                Optional now. If added later, rider self page can match even more reliably.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
            For best rider self-login flow, save at least one of these:
            <div className="mt-2">
              <b>Rider Email</b> or <b>Rider Auth UID</b>.
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save Rider"}
            </button>

            <Link
              href="/orders/riders"
              className="rounded-xl border border-neutral-300 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}