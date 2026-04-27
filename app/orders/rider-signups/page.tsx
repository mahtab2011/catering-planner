"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { canAccess, getCurrentAccount, isPending } from "@/lib/authGuard";

type RiderSignupDoc = {
  id: string;
  authUid?: string;
  role?: string;
  signupType?: string;
  fullName?: string;
  displayName?: string;
  name?: string;
  phone?: string;
  phoneDigits?: string;
  email?: string;
  vehicleType?: string;
  serviceZone?: string;
  notes?: string;
  status?: string;
  source?: string;
  reviewed?: boolean;
  onboardingStarted?: boolean;
  accountCreated?: boolean;
  riderProfileCreated?: boolean;
  activatedForOperations?: boolean;
  consentToContact?: boolean;
  assignedOwnerUid?: string;
  assignedOwnerName?: string;
  assignedOwnerEmail?: string;
  restaurantId?: string;
  restaurantName?: string;
  riderDocId?: string;
  reviewedAt?: any;
  reviewedByUid?: string;
  reviewedByName?: string;
  reviewedByEmail?: string;
  createdAt?: any;
  updatedAt?: any;
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
  return (value || "").trim();
}

function normalizeEmail(value?: string) {
  return cleanText(value).toLowerCase();
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

export default function RiderSignupsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [msg, setMsg] = useState("");
  const [savingId, setSavingId] = useState("");

  const [ownerUid, setOwnerUid] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");

  const [signups, setSignups] = useState<RiderSignupDoc[]>([]);
  const [statusFilter, setStatusFilter] = useState("pending_review");
  const [search, setSearch] = useState("");

  const [restaurantIds, setRestaurantIds] = useState<Record<string, string>>({});
  const [restaurantNames, setRestaurantNames] = useState<Record<string, string>>(
    {}
  );

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
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
        console.error("Rider signup access check failed:", error);
        setAllowed(false);
        setCheckingAccess(false);
        setLoading(false);
        router.replace("/login");
      }
    });

    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!allowed) {
      setSignups([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(
      collection(db, "rider_signups"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data: RiderSignupDoc[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<RiderSignupDoc, "id">),
        }));

        setSignups(data);

        setRestaurantIds((prev) => {
          const next = { ...prev };
          for (const item of data) {
            if (next[item.id] === undefined) {
              next[item.id] = cleanText(item.restaurantId);
            }
          }
          return next;
        });

        setRestaurantNames((prev) => {
          const next = { ...prev };
          for (const item of data) {
            if (next[item.id] === undefined) {
              next[item.id] = cleanText(item.restaurantName);
            }
          }
          return next;
        });

        setLoading(false);
      },
      (err) => {
        console.error(err);
        setMsg("❌ Failed to load rider signups");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [allowed]);

  const filteredSignups = useMemo(() => {
    const term = cleanText(search).toLowerCase();

    return signups.filter((item) => {
      const statusMatches =
        statusFilter === "all" ||
        cleanText(item.status).toLowerCase() === statusFilter.toLowerCase();

      const haystack = [
        item.fullName,
        item.displayName,
        item.name,
        item.phone,
        item.email,
        item.vehicleType,
        item.serviceZone,
      ]
        .map((v) => cleanText(v).toLowerCase())
        .join(" ");

      const searchMatches = !term || haystack.includes(term);

      return statusMatches && searchMatches;
    });
  }, [signups, statusFilter, search]);

  async function approveSignup(item: RiderSignupDoc) {
    try {
      setSavingId(item.id);
      setMsg("Approving rider signup...");

      const restaurantId = cleanText(restaurantIds[item.id]);
      const restaurantName = cleanText(restaurantNames[item.id]);
      const riderName = cleanText(item.fullName || item.displayName || item.name);
      const riderEmail = normalizeEmail(item.email);
      const riderPhone = cleanText(item.phone);

      if (!item.authUid) {
        setMsg("❌ This signup has no authUid");
        return;
      }

      if (!riderName) {
        setMsg("❌ Rider name is missing");
        return;
      }

      if (!riderEmail) {
        setMsg("❌ Rider email is missing");
        return;
      }

      const riderRef = doc(collection(db, "riders"));

      await setDoc(riderRef, {
        ownerUid,
        ownerName: ownerName || "",
        ownerEmail: ownerEmail || "",

        authUid: item.authUid || "",
        email: riderEmail,
        name: riderName,
        phone: riderPhone,

        restaurantId,
        restaurantName,

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

      await updateDoc(doc(db, "rider_signups", item.id), {
        status: "approved",
        reviewed: true,
        riderProfileCreated: true,
        activatedForOperations: true,
        assignedOwnerUid: ownerUid || "",
        assignedOwnerName: ownerName || "",
        assignedOwnerEmail: ownerEmail || "",
        restaurantId,
        restaurantName,
        riderDocId: riderRef.id,
        reviewedAt: serverTimestamp(),
        reviewedByUid: ownerUid || "",
        reviewedByName: ownerName || "",
        reviewedByEmail: ownerEmail || "",
        updatedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "users", item.authUid), {
        status: "approved",
        reviewed: true,
        riderProfileCreated: true,
        activatedForOperations: true,
        ownerUid: ownerUid || "",
        ownerName: ownerName || "",
        ownerEmail: ownerEmail || "",
        restaurantId,
        restaurantName,
        riderDocId: riderRef.id,
        updatedAt: serverTimestamp(),
      });

      setMsg("✅ Rider approved and rider profile created");
    } catch (err) {
      console.error(err);
      setMsg("❌ Failed to approve rider signup");
    } finally {
      setSavingId("");
    }
  }

  async function rejectSignup(item: RiderSignupDoc) {
    try {
      setSavingId(item.id);
      setMsg("Rejecting rider signup...");

      await updateDoc(doc(db, "rider_signups", item.id), {
        status: "rejected",
        reviewed: true,
        activatedForOperations: false,
        reviewedAt: serverTimestamp(),
        reviewedByUid: ownerUid || "",
        reviewedByName: ownerName || "",
        reviewedByEmail: ownerEmail || "",
        updatedAt: serverTimestamp(),
      });

      if (item.authUid) {
        await updateDoc(doc(db, "users", item.authUid), {
          status: "rejected",
          reviewed: true,
          activatedForOperations: false,
          updatedAt: serverTimestamp(),
        });
      }

      setMsg("✅ Rider signup rejected");
    } catch (err) {
      console.error(err);
      setMsg("❌ Failed to reject rider signup");
    } finally {
      setSavingId("");
    }
  }

  async function markReviewing(item: RiderSignupDoc) {
    try {
      setSavingId(item.id);
      setMsg("Updating rider signup...");

      await updateDoc(doc(db, "rider_signups", item.id), {
        status: "reviewing",
        reviewedByUid: ownerUid || "",
        reviewedByName: ownerName || "",
        reviewedByEmail: ownerEmail || "",
        updatedAt: serverTimestamp(),
      });

      if (item.authUid) {
        await updateDoc(doc(db, "users", item.authUid), {
          status: "reviewing",
          updatedAt: serverTimestamp(),
        });
      }

      setMsg("✅ Rider signup moved to reviewing");
    } catch (err) {
      console.error(err);
      setMsg("❌ Failed to update rider signup");
    } finally {
      setSavingId("");
    }
  }

  if (checkingAccess) {
    return (
      <main className="min-h-screen bg-[#f8faf7] px-4 py-10">
        <div className="mx-auto max-w-6xl rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600 shadow-sm">
          Checking access...
        </div>
      </main>
    );
  }

  if (!allowed) {
    return (
      <main className="min-h-screen bg-[#f8faf7] px-4 py-10">
        <div className="mx-auto max-w-6xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800 shadow-sm">
          You do not have access to rider signups.
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <div className="p-6 text-center text-neutral-600">
        Loading rider signups...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8faf7]">
      <div className="mx-auto max-w-6xl p-6">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              🛵 Rider Signup Review
            </h1>
            <p className="mt-1 text-sm text-neutral-600">
              Review rider applications and approve them into live rider profiles.
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
              href="/orders/rider/new"
              className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Add Rider Manually
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

        <div className="mb-6 grid gap-3 rounded-2xl border border-neutral-200 bg-white p-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">
              Search
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search rider name / phone / email"
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none"
            >
              <option value="all">All</option>
              <option value="pending_review">Pending review</option>
              <option value="reviewing">Reviewing</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
            Approve = create live rider doc in <b>riders</b> collection.
          </div>
        </div>

        {filteredSignups.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-4 text-sm text-neutral-500 shadow-sm">
            No rider signups found.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSignups.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-lg font-semibold text-neutral-900">
                      {item.fullName || item.displayName || item.name || "Unnamed rider"}
                    </div>

                    <div className="mt-1 text-sm text-neutral-600">
                      {item.email || "No email"}
                      {item.phone ? ` • ${item.phone}` : ""}
                    </div>

                    <div className="mt-1 text-sm text-neutral-500">
                      {item.vehicleType || "No vehicle"} • {item.serviceZone || "No zone"}
                    </div>

                    <div className="mt-1 text-xs text-neutral-500">
                      Applied: {formatDateTime(item.createdAt)}
                    </div>
                  </div>

                  <div className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm font-semibold text-neutral-700">
                    {cleanText(item.status) || "pending_review"}
                  </div>
                </div>

                {item.notes ? (
                  <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700">
                    {item.notes}
                  </div>
                ) : null}

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-neutral-600">
                      Restaurant ID
                    </label>
                    <input
                      type="text"
                      value={restaurantIds[item.id] || ""}
                      onChange={(e) =>
                        setRestaurantIds((prev) => ({
                          ...prev,
                          [item.id]: e.target.value,
                        }))
                      }
                      placeholder="Optional restaurant ID"
                      className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-neutral-600">
                      Restaurant Name
                    </label>
                    <input
                      type="text"
                      value={restaurantNames[item.id] || ""}
                      onChange={(e) =>
                        setRestaurantNames((prev) => ({
                          ...prev,
                          [item.id]: e.target.value,
                        }))
                      }
                      placeholder="Optional restaurant name"
                      className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none"
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => markReviewing(item)}
                    disabled={savingId === item.id}
                    className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingId === item.id ? "Saving..." : "Mark Reviewing"}
                  </button>

                  <button
                    type="button"
                    onClick={() => approveSignup(item)}
                    disabled={savingId === item.id}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingId === item.id ? "Saving..." : "Approve Rider"}
                  </button>

                  <button
                    type="button"
                    onClick={() => rejectSignup(item)}
                    disabled={savingId === item.id}
                    className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingId === item.id ? "Saving..." : "Reject"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}