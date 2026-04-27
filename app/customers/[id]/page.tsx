"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { normalizeUkPhone } from "@/lib/phone";

type RiskLevel = "ok" | "warning" | "blocked";

type Customer = {
  bossUid?: string;

  name?: string;
  email?: string;

  firstName?: string;
  surname?: string;
  firstNameNorm?: string;
  surnameNorm?: string;

  riskLevel?: RiskLevel;
  rating?: number;
  tags?: string[];

  blacklisted?: boolean; // legacy support
  notes?: string;

  phone?: string;
  phoneNorm?: string;
  phoneE164?: string;
  phoneDigits?: string;
};

type EventRow = {
  id: string;
  customerId?: string;
  clientName?: string;
  date?: string;
  guests?: number;
  status?: string;
  clientPrice?: number;
  totalCost?: number;
};

function money(n: any) {
  const num = Number(n ?? 0);
  if (!Number.isFinite(num)) return "0";
  return num.toLocaleString("en-GB");
}

function isoMinusYears(years: number) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function digitsOnly(input: string) {
  return (input || "").replace(/\D/g, "");
}

function displayCustomerName(c: Customer | null) {
  if (!c) return "Unnamed";

  const fn = (c.firstName ?? "").trim();
  const sn = (c.surname ?? "").trim();
  const full = `${fn} ${sn}`.trim();

  if (full) return full;
  if ((c.name ?? "").trim()) return (c.name ?? "").trim();
  return "Unnamed";
}

export default function CustomerProfilePage() {
  const router = useRouter();
  const params = useParams();
  const customerId = String((params as any)?.id ?? "");

  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<EventRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const [rating, setRating] = useState<number>(0);
  const [riskLevel, setRiskLevel] = useState<RiskLevel>("ok");
  const [notes, setNotes] = useState("");
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [phone, setPhone] = useState("");

  const tenYearsAgo = useMemo(() => isoMinusYears(10), []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      const x = u?.uid ?? null;
      setUid(x);
      if (!x) router.replace("/login");
    });
    return unsub;
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setErr(null);
        setMsg("");
        setLoading(true);

        if (!uid || !customerId) return;

        if (customerId === "new") {
          router.replace("/customers");
          return;
        }

        const cref = doc(db, "customers", customerId);
        const csnap = await getDoc(cref);

        if (!csnap.exists()) {
          setErr("Customer not found");
          return;
        }

        const c = csnap.data() as Customer;

        if (c?.bossUid && c.bossUid !== uid) {
          setErr("No access to this customer");
          return;
        }

        const derivedRisk: RiskLevel =
          c.riskLevel ?? (c.blacklisted ? "blocked" : "ok");

        if (!cancelled) {
          setCustomer(c);
          setRating(Number(c.rating ?? 0));
          setRiskLevel(derivedRisk);
          setNotes(c.notes ?? "");
          setFirstName(c.firstName ?? "");
          setSurname(c.surname ?? "");
          setPhone(c.phone ?? "");
        }

        const eventsRef = collection(db, "events");
        const q1 = query(
          eventsRef,
          where("bossUid", "==", uid),
          where("customerId", "==", customerId),
          where("date", ">=", tenYearsAgo),
          orderBy("date", "desc"),
          limit(100)
        );

        const esnap = await getDocs(q1);
        const rows = esnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        })) as EventRow[];

        if (!cancelled) setOrders(rows);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? "Failed to load customer");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [uid, customerId, tenYearsAgo, router]);

  async function saveCustomer() {
    try {
      if (!uid || !customerId) return;

      const cleanFirst = firstName.trim();
      const cleanSurname = surname.trim();
      const normalizedPhone = normalizeUkPhone(phone.trim());
      const phoneDigits = digitsOnly(normalizedPhone || phone);

      if (!cleanFirst) {
        setMsg("❌ First name is required");
        return;
      }

      if (!cleanSurname) {
        setMsg("❌ Surname is required");
        return;
      }

      if (!normalizedPhone) {
        setMsg("❌ Please enter a valid phone number");
        return;
      }

      setMsg("⏳ Saving...");

      await updateDoc(doc(db, "customers", customerId), {
        firstName: cleanFirst,
        surname: cleanSurname,
        name: `${cleanFirst} ${cleanSurname}`.trim(),

        firstNameNorm: cleanFirst.toLowerCase().trim(),
        surnameNorm: cleanSurname.toLowerCase().trim(),

        phone: normalizedPhone,
        phoneNorm: normalizedPhone,
        phoneE164: normalizedPhone.startsWith("+44") ? normalizedPhone : "",
        phoneDigits,

        rating: Math.max(0, Math.min(5, Number(rating ?? 0))),
        riskLevel,
        blacklisted: riskLevel === "blocked", // legacy compatibility
        notes: notes ?? "",
      });

      setCustomer((prev) =>
        prev
          ? {
              ...prev,
              firstName: cleanFirst,
              surname: cleanSurname,
              name: `${cleanFirst} ${cleanSurname}`.trim(),
              phone: normalizedPhone,
              phoneNorm: normalizedPhone,
              phoneE164: normalizedPhone.startsWith("+44")
                ? normalizedPhone
                : "",
              phoneDigits,
              rating: Math.max(0, Math.min(5, Number(rating ?? 0))),
              riskLevel,
              blacklisted: riskLevel === "blocked",
              notes: notes ?? "",
            }
          : prev
      );

      setMsg("✅ Saved");
    } catch (e: any) {
      console.error(e);
      setMsg(`❌ ${e?.message ?? "Save failed"}`);
    }
  }

  if (loading) {
    return <div className="p-6 text-sm text-neutral-600">Loading…</div>;
  }

  if (err) {
    return (
      <div className="p-6">
        <div className="text-sm text-red-700">{err}</div>
        <Link
          className="mt-3 inline-block text-sm font-semibold hover:underline"
          href="/customers"
        >
          ← Back
        </Link>
      </div>
    );
  }

  if (!customer) return null;

  const customerName = displayCustomerName(customer);

  return (
    <div className="mx-auto w-full max-w-5xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/customers"
          className="text-sm font-semibold text-neutral-700 hover:underline"
        >
          ← Back to Customers
        </Link>

        <Link
          href="/events"
          className="text-sm font-semibold text-neutral-700 hover:underline"
        >
          Events Dashboard
        </Link>
      </div>

      {msg ? (
        <div
          className={`mt-4 rounded-lg px-4 py-3 text-sm ${
            msg.includes("✅")
              ? "bg-green-50 text-green-700"
              : msg.includes("⏳")
              ? "bg-yellow-50 text-yellow-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {msg}
        </div>
      ) : null}

      <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs text-neutral-500">Customer</div>
            <div className="mt-1 text-2xl font-semibold text-neutral-900">
              {customerName}
            </div>
            <div className="mt-1 text-sm text-neutral-600">
              Phone: <b className="text-neutral-900">{customer.phone ?? "—"}</b>
            </div>
          </div>

          {riskLevel === "blocked" ? (
            <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-800">
              🚫 Blocked
            </span>
          ) : riskLevel === "warning" ? (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
              ⚠️ Warning
            </span>
          ) : (
            <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
              OK
            </span>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label className="text-xs font-semibold text-neutral-700">
              First name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-700">
              Surname
            </label>
            <input
              type="text"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-700">
              Phone
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-700">
              Rating (0–5)
            </label>
            <input
              type="number"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              min={0}
              max={5}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-700">
              Risk level
            </label>
            <select
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value as RiskLevel)}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            >
              <option value="ok">ok</option>
              <option value="warning">warning</option>
              <option value="blocked">blocked</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="text-xs font-semibold text-neutral-700">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              placeholder="Reason, warnings, preferences..."
            />
          </div>
        </div>

        <button
          onClick={saveCustomer}
          className="mt-3 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white"
        >
          Save customer
        </button>
      </div>

      <div className="mt-5 rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="text-sm font-semibold text-neutral-900">
          Orders (last 10 years) — since {tenYearsAgo}
        </div>

        {orders.length === 0 ? (
          <div className="mt-3 text-sm text-neutral-600">No orders found.</div>
        ) : (
          <div className="mt-3 grid gap-3">
            {orders.map((e) => {
              const revenue = Number(e.clientPrice ?? 0);
              const cost = Number(e.totalCost ?? 0);
              const profit = revenue - cost;
              const isLoss = profit < 0;

              return (
                <Link
                  key={e.id}
                  href={`/events/${e.id}`}
                  className={`rounded-xl border p-4 hover:border-neutral-300 ${
                    isLoss
                      ? "border-red-200 bg-red-50"
                      : "border-neutral-200 bg-white"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="text-base font-semibold text-neutral-900">
                        {e.clientName ?? "Event"}
                      </div>
                      <div className="mt-1 text-xs text-neutral-600">
                        Date: <b className="text-neutral-900">{e.date ?? "—"}</b>{" "}
                        • Guests:{" "}
                        <b className="text-neutral-900">
                          {Number(e.guests ?? 0) || "—"}
                        </b>{" "}
                        • Status:{" "}
                        <b className="text-neutral-900">
                          {e.status ?? "draft"}
                        </b>
                      </div>
                    </div>

                    <div className="text-right text-xs text-neutral-600">
                      <div>
                        Revenue:{" "}
                        <b className="text-neutral-900">{money(revenue)}</b>
                      </div>
                      <div>
                        Cost: <b className="text-neutral-900">{money(cost)}</b>
                      </div>
                      <div>
                        Profit:{" "}
                        <b className={isLoss ? "text-red-700" : "text-green-700"}>
                          {money(profit)}
                        </b>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}