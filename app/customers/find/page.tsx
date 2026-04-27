"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type Customer = {
  id: string;
  bossUid?: string;
  phone?: string;
  firstName?: string;
  surname?: string;
  rating?: number;
  blacklisted?: boolean;
  notes?: string;
  surnameLower?: string;
  firstNameLower?: string;
};

function normPhone(s: string) {
  return s.replace(/\s+/g, "").replace(/[()-]/g, "");
}

export default function FindCustomerPage() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);

  const [phone, setPhone] = useState("");
  const [surname, setSurname] = useState("");
  const [firstName, setFirstName] = useState("");

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Customer[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      const x = u?.uid ?? null;
      setUid(x);
      if (!x) router.replace("/login");
    });
    return unsub;
  }, [router]);

  async function doSearch() {
    try {
      setErr(null);
      setLoading(true);
      setRows([]);

      if (!uid) return;

      const customersRef = collection(db, "customers");

      const p = normPhone(phone.trim());
      const s = surname.trim().toLowerCase();
      const f = firstName.trim().toLowerCase();

      // Phone exact match (best)
      if (p.length >= 6) {
        const q1 = query(
          customersRef,
          where("bossUid", "==", uid),
          where("phone", "==", p),
          limit(20)
        );
        const snap = await getDocs(q1);
        const out = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        setRows(out);
        return;
      }

      // Surname prefix search (needs surnameLower field in customers)
      if (s.length >= 2) {
        const end = s + "\uf8ff";
        const q2 = query(
          customersRef,
          where("bossUid", "==", uid),
          where("surnameLower", ">=", s),
          where("surnameLower", "<=", end),
          orderBy("surnameLower", "asc"),
          limit(50)
        );
        const snap = await getDocs(q2);
        let out = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Customer[];

        // Optional first-name filter in memory
        if (f.length >= 1) {
          out = out.filter((c) => (c.firstNameLower ?? "").startsWith(f));
        }

        setRows(out);
        return;
      }

      setErr("Type phone OR surname (min 2 letters).");
    } catch (e: any) {
      setErr(e?.message ?? "Search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-semibold">Find old customer</h2>
        <Link
          href="/events"
          className="text-sm font-semibold text-neutral-700 hover:underline"
        >
          ← Back to Events
        </Link>
      </div>

      <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label className="text-xs font-semibold text-neutral-700">Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g., +447..."
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-700">Surname</label>
            <input
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              placeholder="e.g., Abedin"
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-700">
              First name (optional)
            </label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g., Rafeya"
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={doSearch}
            disabled={loading}
            className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Searching…" : "Search"}
          </button>

          <div className="text-xs text-neutral-600">
            Tip: Enter <b>phone</b> for exact match, or <b>surname</b> for list.
          </div>
        </div>

        {err && <div className="mt-3 text-sm text-red-700">{err}</div>}
      </div>

      <div className="mt-4 grid gap-3">
        {rows.map((c) => (
          <Link
            key={c.id}
            href={`/customers/${c.id}`}
            className="rounded-2xl border border-neutral-200 bg-white p-4 hover:border-neutral-300"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="text-base font-semibold text-neutral-900">
                  {(c.firstName ?? "").trim()} {(c.surname ?? "").trim()}
                </div>
                <div className="mt-1 text-xs text-neutral-600">
                  Phone: <b className="text-neutral-900">{c.phone ?? "—"}</b>
                </div>
              </div>

              <div className="text-right text-xs">
                <div className="font-semibold text-neutral-700">
                  Rating: {Number(c.rating ?? 0)}/5
                </div>
                {c.blacklisted && (
                  <div className="mt-1 rounded-full bg-red-100 px-2 py-1 font-semibold text-red-800">
                    🚫 Blacklisted
                  </div>
                )}
              </div>
            </div>

            {c.notes && (
              <div className="mt-2 text-xs text-neutral-500">Notes: {c.notes}</div>
            )}
          </Link>
        ))}

        {!loading && rows.length === 0 && (
          <div className="text-sm text-neutral-600">
            No customers yet (or no match).
          </div>
        )}
      </div>
    </div>
  );
}