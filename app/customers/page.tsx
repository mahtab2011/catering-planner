"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { onAuthStateChanged } from "firebase/auth";
import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import { normalizeUkPhone } from "@/lib/phone";

type RiskLevel = "ok" | "warning" | "blocked";

type CustomerAny = {
  id: string;
  bossUid?: string;

  // old schema
  name?: string;
  email?: string;

  // new schema
  firstName?: string;
  surname?: string;
  riskLevel?: RiskLevel;
  rating?: number;
  tags?: string[];

  // common
  phone?: string;
  phoneNorm?: string;
  phoneE164?: string;
  phoneDigits?: string;

  createdAt?: any;
  notes?: string;
};

function digitsOnly(input: string) {
  return (input || "").replace(/\D/g, "");
}

function normText(input: string) {
  return (input || "").trim().toLowerCase();
}

function displayName(c: CustomerAny) {
  const fn = (c.firstName ?? "").trim();
  const sn = (c.surname ?? "").trim();
  const full = `${fn} ${sn}`.trim();

  if (full) return full;
  if ((c.name ?? "").trim()) return (c.name ?? "").trim();
  return "Unnamed";
}

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return { firstName: "", surname: "" };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], surname: parts[0] };
  }

  return {
    firstName: parts.slice(0, -1).join(" "),
    surname: parts[parts.length - 1],
  };
}

export default function CustomersPage() {
  const router = useRouter();

  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [customers, setCustomers] = useState<CustomerAny[]>([]);
  const [msg, setMsg] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | RiskLevel>("all");

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      setUid(user.uid);
      await loadCustomers(user.uid);
      setLoading(false);
    });

    return () => unsub();
  }, [router]);

  async function loadCustomers(bossUid: string) {
    try {
      setMsg("");

      const q = query(
        collection(db, "customers"),
        where("bossUid", "==", bossUid),
        orderBy("createdAt", "desc"),
        limit(200)
      );

      const snap = await getDocs(q);

      const rows: CustomerAny[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));

      setCustomers(rows);
    } catch (e: any) {
      console.error("loadCustomers error:", e);
      setMsg(`❌ Failed to load customers: ${e?.message || "unknown error"}`);
    }
  }

  async function addCustomer() {
    if (!uid) {
      router.replace("/login");
      return;
    }

    const cleanName = name.trim();
    if (!cleanName) {
      setMsg("❌ Customer name is required");
      return;
    }

    const rawPhone = phone.trim();
    if (!rawPhone) {
      setMsg("❌ Phone is required");
      return;
    }

    try {
      setMsg("⏳ Saving...");

      const normalizedPhone = normalizeUkPhone(rawPhone);
      const phoneDigits = digitsOnly(normalizedPhone || rawPhone);

      if (!phoneDigits) {
        setMsg("❌ Please enter a valid phone number");
        return;
      }

      const dupeQ = query(
        collection(db, "customers"),
        where("bossUid", "==", uid),
        where("phoneNorm", "==", normalizedPhone)
      );

      const dupeSnap = await getDocs(dupeQ);

      if (!dupeSnap.empty) {
        setMsg("❌ Customer already exists with this phone number");
        return;
      }

      const { firstName, surname } = splitFullName(cleanName);

      await addDoc(collection(db, "customers"), {
        bossUid: uid,

        // old schema compatibility
        name: cleanName,
        email: email.trim() || "",

        // new schema
        firstName,
        surname,
        riskLevel: "ok",
        rating: 0,
        tags: [],

        // phone fields
        phone: normalizedPhone,
        phoneNorm: normalizedPhone,
        phoneE164: normalizedPhone.startsWith("+44") ? normalizedPhone : "",
        phoneDigits,

        notes: notes.trim() || "",
        createdAt: serverTimestamp(),
      });

      setName("");
      setPhone("");
      setEmail("");
      setNotes("");
      setOpen(false);

      setMsg("✅ Customer added");
      await loadCustomers(uid);
    } catch (e: any) {
      console.error("addCustomer error:", e);
      setMsg(`❌ Failed to add customer: ${e?.message || "unknown error"}`);
    }
  }

  const filtered = useMemo(() => {
    const s = normText(search);
    const sDigits = digitsOnly(search);

    return customers
      .filter((c) => {
        if (filter === "all") return true;
        return (c.riskLevel ?? "ok") === filter;
      })
      .filter((c) => {
        if (!s) return true;

        const nm = normText(displayName(c));
        const tags = (c.tags ?? []).map(normText).join(" ");
        const phDigits =
          c.phoneDigits ?? c.phoneNorm ?? digitsOnly(c.phone ?? "");

        return (
          nm.includes(s) ||
          tags.includes(s) ||
          (sDigits ? phDigits.includes(sDigits) : false)
        );
      });
  }, [customers, search, filter]);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">👥 Customers</h1>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg bg-gray-900 px-4 py-2 text-white hover:opacity-90"
          >
            + Add Customer
          </button>

          <Link
            href="/dashboard"
            className="rounded-lg bg-gray-200 px-4 py-2 hover:bg-gray-300"
          >
            Dashboard
          </Link>

          <Link
            href="/events"
            className="rounded-lg bg-gray-200 px-4 py-2 hover:bg-gray-300"
          >
            Events
          </Link>
        </div>
      </div>

      <div className="space-y-3 rounded-xl bg-white p-4 shadow">
        <div className="grid gap-3 md:grid-cols-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name / phone / tags…"
            className="w-full rounded-lg border p-3 md:col-span-2"
          />

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-lg border px-3 py-2 ${
                filter === "all"
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "bg-white"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("ok")}
              className={`rounded-lg border px-3 py-2 ${
                filter === "ok"
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "bg-white"
              }`}
            >
              OK
            </button>
            <button
              onClick={() => setFilter("warning")}
              className={`rounded-lg border px-3 py-2 ${
                filter === "warning"
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "bg-white"
              }`}
            >
              Warning
            </button>
            <button
              onClick={() => setFilter("blocked")}
              className={`rounded-lg border px-3 py-2 ${
                filter === "blocked"
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "bg-white"
              }`}
            >
              Blocked
            </button>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          Showing <b>{filtered.length}</b> of <b>{customers.length}</b>
        </div>
      </div>

      {msg ? (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
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

      {open && (
        <div className="space-y-4 rounded-xl bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Add Customer</h2>
            <button
              onClick={() => setOpen(false)}
              className="rounded bg-gray-200 px-3 py-1 hover:bg-gray-300"
            >
              Close
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm text-gray-600">Name *</label>
              <input
                className="mt-1 w-full rounded-lg border p-3"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Phone *</label>
              <input
                className="mt-1 w-full rounded-lg border p-3"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+44… / 07…"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Email</label>
              <input
                className="mt-1 w-full rounded-lg border p-3"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@email.com"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Notes</label>
              <input
                className="mt-1 w-full rounded-lg border p-3"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any notes..."
              />
            </div>
          </div>

          <button
            onClick={addCustomer}
            className="rounded-lg bg-gray-900 px-5 py-3 text-white hover:opacity-90"
          >
            Save Customer
          </button>
        </div>
      )}

      <div className="rounded-xl bg-white shadow">
        <div className="border-b p-4 font-semibold">Customer List</div>

        {filtered.length === 0 ? (
          <div className="p-6 text-gray-600">No customers found.</div>
        ) : (
          <div className="divide-y">
            {filtered.map((c) => {
              const risk = (c.riskLevel ?? "ok") as RiskLevel;

              return (
                <Link
                  key={c.id}
                  href={`/customers/${c.id}`}
                  className="block p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold">{displayName(c)}</div>
                    <div className="text-xs text-gray-600">
                      {risk === "blocked"
                        ? "🚫 BLOCKED"
                        : risk === "warning"
                        ? "⚠️ WARNING"
                        : "OK"}
                      {typeof c.rating === "number" ? ` • ⭐ ${c.rating}/5` : ""}
                    </div>
                  </div>

                  <div className="text-sm text-gray-600">
                    {c.phone ? `📞 ${c.phone}` : ""}
                    {c.email ? ` • ✉️ ${c.email}` : ""}
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