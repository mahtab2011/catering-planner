"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { detectPhoneOrName } from "@/lib/voice/intent";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { onAuthStateChanged } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAt,
  endAt,
  where,
  setDoc,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

type RiskLevel = "ok" | "warning" | "blocked";

type Customer = {
  id: string;
  bossUid: string;
  phone?: string;
  phoneNorm?: string;
  surname?: string;
  surnameNorm?: string;
  firstName?: string;
  firstNameNorm?: string;
  address?: string;
  notes?: string;
  riskLevel?: RiskLevel;
  rating?: number;
  tags?: string[];
  createdAt?: any;
};

function normPhone(input: string) {
  return (input || "").replace(/\D/g, "");
}

function cleanPhoneInput(input: string) {
  const raw = (input ?? "").trim();
  const hasPlus = raw.startsWith("+");
  const digits = raw.replace(/\D/g, "");
  return (hasPlus ? "+" : "") + digits;
}

function normText(input: string) {
  return (input || "").trim().toLowerCase();
}

function money(n: any) {
  const num = Number(n ?? 0);
  if (!Number.isFinite(num)) return "0";
  return num.toLocaleString("en-GB");
}

function fullNameOf(c: Customer) {
  const first = (c.firstName ?? "").trim();
  const surname = (c.surname ?? "").trim();

  if (first && surname && first.toLowerCase() === surname.toLowerCase()) {
    return first;
  }

  return `${first} ${surname}`.trim();
}

export default function EventForm() {
  const router = useRouter();

  const [cpUid, setCpUid] = useState<string | null>(null);

  // Event form fields
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isWholeDay, setIsWholeDay] = useState(false);
  const [guests, setGuests] = useState<string>("");
  const [clientPrice, setClientPrice] = useState<number>(0);

  // Customer selection
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Recent customers dropdown
  const [recentCustomers, setRecentCustomers] = useState<Customer[]>([]);
  const [recentPickId, setRecentPickId] = useState<string>("");

  // Search UI
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Customer[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchErr, setSearchErr] = useState<string | null>(null);

  // Safety checkbox for warning customers
  const [acceptRisk, setAcceptRisk] = useState(false);

  // Auto-create customer if not selected
  const [autoCreateCustomer, setAutoCreateCustomer] = useState(true);

  // Save
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // ---------------- VOICE (Find old customer) ----------------
  const findInputRef = useRef<HTMLInputElement | null>(null);
  const searchBtnRef = useRef<HTMLButtonElement | null>(null);
  const activeInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
    const proto = Object.getPrototypeOf(el);
    const desc = Object.getOwnPropertyDescriptor(proto, "value");
    desc?.set?.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  const recRef = useRef<any>(null);
  const recRunningRef = useRef(false);
  const voiceSearchTimerRef = useRef<any>(null);

  const [voiceLang, setVoiceLang] = useState<"bn-BD" | "en-GB">("bn-BD");
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as any;
    setSpeechSupported(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  useEffect(() => {
    const handler = (e: any) => {
      const el = e.target as HTMLElement | null;
      if (!el) return;

      const tag = el.tagName?.toLowerCase();
      if (tag !== "input" && tag !== "textarea") return;

      activeInputRef.current = el as HTMLInputElement | HTMLTextAreaElement;
    };

    document.addEventListener("focusin", handler, true);
    return () => document.removeEventListener("focusin", handler, true);
  }, []);

  function bnDigitsToEn(s: string) {
    const map: Record<string, string> = {
      "০": "0",
      "১": "1",
      "২": "2",
      "৩": "3",
      "৪": "4",
      "৫": "5",
      "৬": "6",
      "৭": "7",
      "৮": "8",
      "৯": "9",
    };
    return (s ?? "").replace(/[০-৯]/g, (d) => map[d] ?? d);
  }

  function bnWordsToDigits(input: string) {
    const map: Record<string, string> = {
      "শূন্য": "0",
      "শুন্য": "0",
      "এক": "1",
      "দুই": "2",
      "তিন": "3",
      "চার": "4",
      "পাঁচ": "5",
      "ছয়": "6",
      "ছয়": "6",
      "সাত": "7",
      "আট": "8",
      "নয়": "9",
      "নয়": "9",
    };

    return (input ?? "")
      .split(/\s+/)
      .map((w) => map[w] ?? w)
      .join(" ");
  }

  function cleanVoice(s: string) {
    const basic = bnDigitsToEn((s ?? "").replace(/\s+/g, " ").trim());
    return bnWordsToDigits(basic);
  }

  useEffect(() => {
    if (!speechSupported) return;

    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    const rec = new SR();

    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      recRunningRef.current = true;
      setListening(true);
    };

    rec.onend = () => {
      recRunningRef.current = false;
      setListening(false);

      clearTimeout(voiceSearchTimerRef.current);
      voiceSearchTimerRef.current = setTimeout(() => {
        searchBtnRef.current?.click();
      }, 350);
    };

    rec.onerror = () => {
      recRunningRef.current = false;
      setListening(false);
    };

    rec.onresult = (event: any) => {
      const spoken = event?.results?.[0]?.[0]?.transcript ?? "";
      const cleaned = cleanVoice(spoken);
      console.log("spoken:", spoken, "cleaned:", cleaned, "digits:", normPhone(cleaned));

      findInputRef.current?.focus?.();

      const intent = detectPhoneOrName(cleaned);

      if (intent.kind === "phone") {
        const digits = normPhone(cleaned);
        setSearch(digits);
      } else {
        setSearch(cleaned);
      }

      clearTimeout(voiceSearchTimerRef.current);
      voiceSearchTimerRef.current = setTimeout(() => {
        searchBtnRef.current?.click();
      }, 600);
    };

    recRef.current = rec;

    return () => {
      try {
        rec.stop?.();
      } catch {}
    };
  }, [speechSupported]);

  function startVoiceSearch() {
    const rec = recRef.current;
    if (!rec) return;

    if (recRunningRef.current) {
      try {
        rec.stop();
      } catch {}
      return;
    }

    try {
      findInputRef.current?.focus?.();
      rec.lang = voiceLang;
      rec.start();
    } catch (e) {
      recRunningRef.current = false;
      setListening(false);
      console.warn("Voice start failed:", e);
    }
  }
  // ---------------- END VOICE ----------------

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      const uid = user?.uid ?? null;
      setCpUid(uid);
      if (!uid) {
        router.replace("/login");
        return;
      }
      await loadRecentCustomers(uid);
    });
    return () => unsub();
  }, [router]);

  async function loadRecentCustomers(uid: string) {
    try {
      const qRef = query(
        collection(db, "customers"),
        where("bossUid", "==", uid),
        orderBy("createdAt", "desc"),
        limit(20)
      );
      const snap = await getDocs(qRef);
      const rows: Customer[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setRecentCustomers(rows);
    } catch (e: any) {
      console.error("loadRecentCustomers error:", e);
    }
  }

  const riskLevel: RiskLevel = (selectedCustomer?.riskLevel ?? "ok") as RiskLevel;
  const isBlocked = riskLevel === "blocked";
  const needsAccept = riskLevel === "warning";

  async function runSearch() {
    try {
      setSearchErr(null);
      setSearching(true);

      if (!cpUid) return;

      const raw = (search ?? "").trim();
      if (!raw) {
        setResults([]);
        return;
      }

      const intent = detectPhoneOrName(raw);
      const phoneGuess =
        intent.kind === "phone" ? normPhone(intent.digits) : normPhone(raw);
      const isPhoneSearch = intent.kind === "phone" || phoneGuess.length >= 6;

      let rows: Customer[] = [];

      if (isPhoneSearch) {
        const qRef = query(
          collection(db, "customers"),
          where("bossUid", "==", cpUid),
          where("phoneNorm", "==", phoneGuess),
          limit(10)
        );

        const snap = await getDocs(qRef as any);
        rows = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));
      } else {
        const s = normText(raw);

        const firstNameRef = query(
          collection(db, "customers"),
          where("bossUid", "==", cpUid),
          orderBy("firstNameNorm"),
          startAt(s),
          endAt(s + "\uf8ff"),
          limit(10)
        );

        const firstSnap = await getDocs(firstNameRef as any);

        rows = firstSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));

        if (rows.length === 0) {
          const surnameRef = query(
            collection(db, "customers"),
            where("bossUid", "==", cpUid),
            orderBy("surnameNorm"),
            startAt(s),
            endAt(s + "\uf8ff"),
            limit(10)
          );

          const surnameSnap = await getDocs(surnameRef as any);

          rows = surnameSnap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as any),
          }));
        }
      }

      setResults(rows);
      if (rows.length === 1) {
        pickCustomer(rows[0]);
      }
    } catch (e: any) {
      setSearchErr(e?.message ?? "Search failed");
    } finally {
      setSearching(false);
    }
  }

  function pickCustomer(c: Customer) {
    if (!c?.id || c.id === "new") return;

    setSelectedCustomer(c);
    setCustomerId(c.id);
    setAcceptRisk(false);
    setRecentPickId(c.id);

    setFirstName((c.firstName ?? "").trim());
    setSurname((c.surname ?? "").trim());
    setPhone(cleanPhoneInput(c.phone ?? ""));
  }

  async function pickCustomerById(id: string) {
    if (!cpUid || !id || id === "new") return;

    try {
      const found = recentCustomers.find((c) => c.id === id);
      if (found) {
        pickCustomer(found);
        return;
      }

      const ref = doc(db, "customers", id);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;

      const c = { id: snap.id, ...(snap.data() as any) } as Customer;
      if (c.bossUid !== cpUid) return;

      pickCustomer(c);
    } catch (e) {
      console.error(e);
    }
  }

  function clearCustomer() {
    setSelectedCustomer(null);
    setCustomerId(null);
    setAcceptRisk(false);
    setRecentPickId("");
    setFirstName("");
    setSurname("");
    setPhone("");
  }

  const canCreate =
    !!cpUid &&
    `${firstName.trim()} ${surname.trim()}`.trim().length >= 2 &&
    !saving &&
    !isBlocked &&
    (!needsAccept || acceptRisk);

  async function maybeCreateCustomer(): Promise<string | null> {
    if (!cpUid) return null;

    if (customerId) return customerId;
    if (!autoCreateCustomer) return null;

    const firstNameClean = firstName.trim();
    const surnameClean = surname.trim();
    const phoneClean = cleanPhoneInput(phone);

    if (`${firstNameClean} ${surnameClean}`.trim().length < 2) return null;

    if (phoneClean) {
      const existingQuery = query(
        collection(db, "customers"),
        where("bossUid", "==", cpUid),
        where("phoneNorm", "==", normPhone(phoneClean)),
        limit(1)
      );

      const snap = await getDocs(existingQuery);

      if (!snap.empty) {
        const existing = snap.docs[0];
        return existing.id;
      }
    }

    const newId = crypto.randomUUID();
    const customerRef = doc(db, "customers", newId);

    await setDoc(customerRef, {
      bossUid: cpUid,
      phone: phoneClean || "",
      phoneNorm: normPhone(phoneClean),
      firstName: firstNameClean || "",
      firstNameNorm: normText(firstNameClean),
      surname: surnameClean || "",
      surnameNorm: normText(surnameClean),
      notes: "",
      riskLevel: "ok",
      rating: 0,
      tags: [],
      createdAt: serverTimestamp(),
    });

    const createdCustomer: Customer = {
      id: newId,
      bossUid: cpUid,
      phone: phoneClean || "",
      phoneNorm: normPhone(phoneClean),
      firstName: firstNameClean,
      firstNameNorm: normText(firstNameClean),
      surname: surnameClean,
      surnameNorm: normText(surnameClean),
      riskLevel: "ok",
      rating: 0,
      tags: [],
    };

    setSelectedCustomer(createdCustomer);
    setCustomerId(newId);

    return newId;
  }

  async function createEvent() {
    try {
      setErr(null);
      setSaving(true);

      if (!cpUid) {
        setErr("Not logged in.");
        return;
      }

      const firstNameClean = firstName.trim();
      const surnameClean = surname.trim();
      const nameClean = `${firstNameClean} ${surnameClean}`.trim();

      if (nameClean.length < 2) {
        setErr("Please enter a valid client name.");
        return;
      }

      if (!date) {
        setErr("Please select an event date.");
        return;
      }

      if (!isWholeDay) {
        if (!startTime || !endTime) {
          setErr("Please set both Start time and End time (or tick Whole Day).");
          return;
        }
        if (endTime <= startTime) {
          setErr("End time must be later than Start time.");
          return;
        }
      }

      const linkedCustomerId = await maybeCreateCustomer();

      const payload: any = {
        bossUid: cpUid,
        clientName: nameClean,
        date: date || "",
        startTime: isWholeDay ? "00:00" : startTime || "",
        endTime: isWholeDay ? "23:59" : endTime || "",
        isWholeDay,
        allDay: isWholeDay,

        guests: Number(guests ?? 0),
        clientPrice: Number(clientPrice ?? 0),

        status: "draft",
        totalRevenue: Number(clientPrice ?? 0),
        totalCost: 0,
        profit: Number(clientPrice ?? 0),

        createdAt: serverTimestamp(),

        customerPhoneSnapshot: cleanPhoneInput(phone) || "",
        customerNameSnapshot: nameClean,
        customerFirstNameSnapshot: firstNameClean,
        customerSurnameSnapshot: surnameClean,
        customerRiskSnapshot: (selectedCustomer?.riskLevel ?? "ok") as RiskLevel,
      };

      if (linkedCustomerId) payload.customerId = linkedCustomerId;

      const ref = await addDoc(collection(db, "events"), payload);
      router.push(`/events/${ref.id}`);
    } catch (e: any) {
      console.error("createEvent error:", e);
      setErr(e?.message ?? "Failed to create event");
    } finally {
      setSaving(false);
    }
  }

  const riskBanner = useMemo(() => {
    if (!selectedCustomer) return null;

    if (riskLevel === "blocked") {
      return (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          ⚠️ This customer is <b>BLOCKED</b>. New orders should not be accepted.
        </div>
      );
    }

    if (riskLevel === "warning") {
      return (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          ⚠️ This customer is <b>WARNING</b>. Please confirm before accepting order.
          <div className="mt-2 flex items-center gap-2">
            <input
              id="acceptRisk"
              type="checkbox"
              checked={acceptRisk}
              onChange={(e) => setAcceptRisk(e.target.checked)}
            />
            <label htmlFor="acceptRisk" className="text-sm">
              I accept the risk and will proceed
            </label>
          </div>
        </div>
      );
    }

    return null;
  }, [selectedCustomer, riskLevel, acceptRisk]);

  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold">New Event</h2>

        <Link href="/events" className="text-sm font-semibold text-neutral-700 hover:text-black">
          ← Back to Events
        </Link>
      </div>

      {/* Quick pick */}
      <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-semibold text-neutral-900">Quick pick (recent customers)</div>

          <label className="flex items-center gap-2 text-xs text-neutral-700">
            <input
              type="checkbox"
              checked={autoCreateCustomer}
              onChange={(e) => setAutoCreateCustomer(e.target.checked)}
            />
            Auto-create customer if new
          </label>
        </div>

        <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
          <select
            value={recentPickId}
            onChange={(e) => {
              const v = e.target.value;
              setRecentPickId(v);
              if (v) pickCustomerById(v);
            }}
            className="md:col-span-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
          >
            <option value="">— Select a customer —</option>
            {recentCustomers.map((c) => {
              const name = fullNameOf(c) || c.surname || "Unnamed";
              return (
                <option key={c.id} value={c.id}>
                  {name} {c.phone ? `(${c.phone})` : ""}
                </option>
              );
            })}
          </select>

          <button
            onClick={clearCustomer}
            className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 hover:border-neutral-300"
          >
            Clear selection
          </button>
        </div>
      </div>

      {/* Customer Search */}
      <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-4">
        <div className="text-sm font-semibold text-neutral-900">Find old customer</div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            ref={findInputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={(e) => (activeInputRef.current = e.currentTarget)}
            placeholder="Phone or surname..."
            className="min-w-55 flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
          />

          <select
            value={voiceLang}
            onChange={(e) => setVoiceLang(e.target.value as "bn-BD" | "en-GB")}
            className="rounded-lg border border-neutral-200 bg-white px-2 py-2 text-sm outline-none focus:border-neutral-400"
            title="Voice language"
          >
            <option value="bn-BD">🇧🇩 বাংলা</option>
            <option value="en-GB">🇬🇧 English</option>
          </select>

          <button
            type="button"
            onClick={startVoiceSearch}
            disabled={!speechSupported}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50"
            title={!speechSupported ? "Voice not supported" : listening ? "Stop voice" : "Speak now"}
          >
            {listening ? "🎙️..." : "🎤"}
          </button>

          <button
            ref={searchBtnRef}
            type="button"
            onClick={runSearch}
            disabled={searching || !search.trim()}
            className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {searching ? "Searching…" : "Search"}
          </button>
        </div>

        {searchErr && <div className="mt-2 text-sm text-red-700">{searchErr}</div>}

        {results.length > 0 && (
          <div className="mt-3 grid gap-2">
            {results.map((c) => {
              const name = fullNameOf(c) || "Unnamed";
              const tags = (c.tags ?? []).slice(0, 3).join(", ");
              const risk = (c.riskLevel ?? "ok") as RiskLevel;

              return (
                <button
                  key={c.id}
                  onClick={() => pickCustomer(c)}
                  className="w-full rounded-xl border border-neutral-200 bg-white p-3 text-left hover:border-neutral-300"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-semibold text-neutral-900">{name}</div>
                    <div className="text-xs text-neutral-600">
                      {risk === "blocked" ? "🚫 BLOCKED" : risk === "warning" ? "⚠️ WARNING" : "OK"}
                      {typeof c.rating === "number" ? ` • ⭐ ${c.rating}/5` : ""}
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-neutral-600">
                    Phone: <b className="text-neutral-900">{c.phone ?? "—"}</b>
                    {tags ? ` • Tags: ${tags}` : ""}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {selectedCustomer && (
          <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm">
                Selected:{" "}
                <b className="text-neutral-900">{fullNameOf(selectedCustomer) || "Unnamed"}</b>
              </div>

              <button
                type="button"
                onClick={clearCustomer}
                className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm font-semibold hover:border-neutral-300"
              >
                Clear
              </button>
            </div>

            {riskBanner}

            <div className="mt-2 text-xs text-neutral-600">
              <Link
                href={customerId && customerId !== "new" ? `/customers/${customerId}` : "/customers/find"}
                className="font-semibold text-neutral-800 hover:text-black"
              >
                View customer history →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Event Details */}
      <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-4">
        <div className="text-sm font-semibold text-neutral-900">Event details</div>

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-neutral-700">First name</label>
            <input
              value={firstName}
              onFocus={(e) => (activeInputRef.current = e.currentTarget)}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name…"
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-700">Surname</label>
            <input
              value={surname}
              onFocus={(e) => (activeInputRef.current = e.currentTarget)}
              onChange={(e) => setSurname(e.target.value)}
              placeholder="Surname…"
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-700">Phone</label>
            <input
              value={phone}
              onFocus={(e) => (activeInputRef.current = e.currentTarget)}
              onChange={(e) => setPhone(cleanPhoneInput(e.target.value))}
              placeholder="+44..."
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-700">Date</label>
            <input
              type="date"
              value={date}
              onFocus={(e) => (activeInputRef.current = e.currentTarget)}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-700">Guests</label>
            <input
              type="number"
              value={guests === "0" ? "" : guests}
              onFocus={(e) => (activeInputRef.current = e.currentTarget)}
              onChange={(e) => setGuests(e.target.value)}
              placeholder="e.g. 150 guests"
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
            />
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isWholeDay}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIsWholeDay(checked);
                  if (checked) {
                    setStartTime("00:00");
                    setEndTime("23:59");
                  }
                }}
              />
              Whole Day Event
            </label>
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-700">Start time</label>
            <input
              type="time"
              value={startTime}
              onFocus={(e) => (activeInputRef.current = e.currentTarget)}
              onChange={(e) => setStartTime(e.target.value)}
              disabled={isWholeDay}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-700">End time</label>
            <input
              type="time"
              value={endTime}
              onFocus={(e) => (activeInputRef.current = e.currentTarget)}
              onChange={(e) => setEndTime(e.target.value)}
              disabled={isWholeDay}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 disabled:opacity-60"
            />
          </div>

          <div className="md:col-span-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setIsWholeDay(false);
                setStartTime("10:00");
                setEndTime("18:00");
              }}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold hover:border-neutral-300"
            >
              10AM–6PM
            </button>

            <button
              type="button"
              onClick={() => {
                setIsWholeDay(false);
                setStartTime("17:00");
                setEndTime("23:00");
              }}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold hover:border-neutral-300"
            >
              Evening 5PM–11PM
            </button>

            <button
              type="button"
              onClick={() => {
                setIsWholeDay(true);
                setStartTime("00:00");
                setEndTime("23:59");
              }}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold hover:border-neutral-300"
            >
              Whole Day
            </button>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-neutral-700">Client price</label>
            <input
              type="number"
              value={clientPrice}
              onFocus={(e) => (activeInputRef.current = e.currentTarget)}
              onChange={(e) => setClientPrice(Number(e.target.value || 0))}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
            />
            <div className="mt-1 text-xs text-neutral-600">
              Preview: <b className="text-neutral-900">{money(clientPrice)}</b>
            </div>
          </div>
        </div>

        {err && <div className="mt-3 text-sm text-red-700">{err}</div>}

        {saveMsg && <div className="mt-3 text-sm text-green-600">{saveMsg}</div>}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={createEvent}
            disabled={!canCreate || saving}
            className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "⏳ Creating…" : isBlocked ? "🚫 Blocked customer" : "Create Event"}
          </button>

          <Link
            href="/customers/find"
            className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 hover:border-neutral-300"
          >
            Manage Customers
          </Link>
        </div>
      </div>
    </div>
  );
}