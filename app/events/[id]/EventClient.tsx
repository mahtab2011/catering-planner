"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useVoiceEngine } from "@/hooks/useVoiceEngine";
import {
  collection,
  deleteDoc,
  
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  addDoc,
  setDoc,
  where,
} from "firebase/firestore";
import {
  dishes,
  calculateMenuCost
} from "@/lib/dishes";
import { presetMenus } from "@/lib/presetMenus";
import { CarFront } from "lucide-react";
import { isStockManagedIngredient } from "@/lib/ingredientMaster";
import { ingredientMaster } from "@/lib/ingredients";
import { calculateIngredients } from "@/lib/cateringIngredients";
import * as XLSX from "xlsx";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";

/* =======================
   Types
======================= */
type Supplier = {
  id: string;
  name: string;
  category?: string;
  phone?: string;
  email?: string;
};

type CostItem = {
  name?: string;
  amount?: number;

  // ingredient-based fields
  ingredientId?: string;
  unit?: string;
  qty?: number;
  unitCost?: number;
};

type Ingredient = {
  id: string;
  bossUid?: string;
  nameEn?: string;
  nameBn?: string;
  unit?: string;
  unitCost?: number;
};

type RevenueItem = { name: string; amount: number };

type Status =
  | "draft"
  | "procured"
  | "cooking"
  | "packed"
  | "dispatched"
  | "served"
  | "closed";

type SupplierPriceMap = Record<string, number[]>;

type PaymentStatus = "unpaid" | "partial" | "paid";

type SupplierLogisticsEntry = {
  minimumOrderQty?: string | number;
  minimumOrderUnit?: string;
  transport?: string;
  transportCost?: string | number;
};

type SupplierLogisticsMap = Record<string, SupplierLogisticsEntry>;

type IngredientSupplierRow = {
  ingredientName: string;
  supplierName: string;
  qty: number;
  price: number;
  unit: string;
};

type StaffAssignment = {
  staffId: string;
  name: string;
  role: string;
  hourlyRate: number;
  hours: number;
  totalCost: number;
};

type EventData = {
  bossUid?: string;
  status?: Status;
  lockedAt?: any;

  clientName?: string;
  eventType?: string;
  venue?: string;
  menuName?: string;
  date?: string;
  guests?: number;

  cateringHouseId?: string;
  cateringHouseName?: string;
  cateringHouseArea?: string;

  allDay?: boolean;
  startTime?: string;
  endTime?: string;

  clientPrice?: number;
  revenueItems?: RevenueItem[];
  costItems?: CostItem[];
  totalRevenue?: number;
  totalCost?: number;
  profit?: number;

  advancePaid?: number;
  paidNow?: number;
  paidTotal?: number;
  balanceDue?: number;
  paymentStatus?: PaymentStatus;

  supplierNames?: string[];
  supplierPrices?: SupplierPriceMap;
  supplierLogistics?: SupplierLogisticsMap;

  ingredientSupplierRows?: IngredientSupplierRow[];
  staffAssignments?: StaffAssignment[];
};
type AllowedRole = "restaurants" | "catering_houses" | "staff";

async function getUserRole(uid: string): Promise<AllowedRole | null> {
  const collections: AllowedRole[] = [
    "restaurants",
    "catering_houses",
    "staff",
  ];

  for (const col of collections) {
    const snap = await getDoc(doc(db, col, uid));
    if (snap.exists()) return col;
  }

  return null;
}

function getUnauthorizedRedirect(role: string | null) {
  switch (role) {
    case "restaurants":
      return "/restaurants";
    case "catering_houses":
      return "/events";
    case "staff":
      return "/admin";
    default:
      return "/";
  }
}
type CateringHouseOption = {
  id: string;
  name: string;
  area?: string;
};

type PendingAction =
  | null
  | { type: "closeEvent" }
  | { type: "addRevenue"; amount: number };

type VoiceField = "guests" | "clientPrice" | "advancePaid" | "paidNow";

type FocusField =
  | "revenueAmount"
  | "costAmount"
  | "advancePaid"
  | "paidNow"
  | null;

const supplierCategories = [
  "Beef",
  "Mutton",
  "Chicken",
  "Fish",
  "Rice",
  "Grocery",
  "Spices",
  "Vegetables",
  "Oil/Ghee",
  "Frozen",
] as const;

type SupplierCategory = (typeof supplierCategories)[number];

type SupplierMasterItem = {
  id: string;
  name: string;
  categories: SupplierCategory[];
  phone?: string;
  address?: string;
  notes?: string;
};

/* =======================
   Constants
======================= */
const STATUS_ORDER: Status[] = [
  "draft",
  "procured",
  "cooking",
  "packed",
  "dispatched",
  "served",
  "closed",
];

const STATUS_LABEL: Record<Status, string> = {
  draft: "Draft",
  procured: "Procured",
  cooking: "Cooking",
  packed: "Packed",
  dispatched: "Dispatched",
  served: "Served",
  closed: "Closed",
};

const DEFAULT_SUPPLIER_NAMES = [
  "Supplier A",
  "Supplier B",
  "Supplier C",
  "Supplier D",
  "Supplier E",
];

const DEFAULT_SUPPLIER_LOGISTICS_ENTRY: SupplierLogisticsEntry = {
  minimumOrderQty: "",
  minimumOrderUnit: "kg",
  transport: "Ex-premises",
  transportCost: "",
};

/* =======================
   Helpers
======================= */
function showMoney(n: any) {
  const num = Number(n ?? 0);
  if (!Number.isFinite(num)) return "0";
  return num.toLocaleString("en-GB", { maximumFractionDigits: 2 });
}

function getCheapestSupplier(
  prices: number[],
  suppliers: string[] = []
): { index: number; name: string; price: number } {
  if (!prices || prices.length === 0) {
    return { index: -1, name: "No supplier", price: 0 };
  }

  let minPrice = Infinity;
  let minIndex = -1;

  prices.forEach((price, i) => {
    const p = Number(price);
    if (p > 0 && p < minPrice) {
      minPrice = p;
      minIndex = i;
    }
  });

  if (minIndex === -1) {
    return { index: -1, name: "No supplier", price: 0 };
  }

  return {
    index: minIndex,
    name: suppliers[minIndex] || `Supplier ${minIndex + 1}`,
    price: minPrice,
  };
}

function getCheapestSupplierForRow(
  supplierNames: string[],
  supplierPrices: Record<string, Array<number | undefined>>,
  itemName: string
) {
  const prices = supplierPrices[itemName] || [];

  let min = Infinity;
  let index = -1;

  prices.forEach((p, i) => {
    const val = Number(p ?? 0);
    if (val > 0 && val < min) {
      min = val;
      index = i;
    }
  });

  if (index === -1) return null;

  return {
    index,
    name: supplierNames[index] || "",
    price: min,
  };
}
function getIngredientKey(item: any) {
  return (
    item.ingredientId ||
    item.nameEn ||
    item.nameBn ||
    item.name ||
    "unknown"
  );
}

function getIngredientLabel(item: any) {
  return item.name || item.nameEn || item.nameBn || item.label || "Unnamed Item";
}

function parseNum(val: any) {
  const n = parseFloat(val);
  return Number.isFinite(n) ? n : 0;
}

function buildDefaultSupplierLogistics(names: string[] = []): SupplierLogisticsMap {
  return names.reduce<SupplierLogisticsMap>((acc, supplier, i) => {
    const key = supplier?.trim() || `Supplier ${i + 1}`;
    acc[key] = { ...DEFAULT_SUPPLIER_LOGISTICS_ENTRY };
    return acc;
  }, {});
}

function normalizeSupplierLogistics(
  value: any,
  supplierNames: string[] = []
): SupplierLogisticsMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return buildDefaultSupplierLogistics(supplierNames);
  }

  return Object.entries(value).reduce<SupplierLogisticsMap>((acc, [key, raw]) => {
    const entry = (raw ?? {}) as SupplierLogisticsEntry;

    acc[key] = {
      minimumOrderQty: entry.minimumOrderQty ?? "",
      minimumOrderUnit: entry.minimumOrderUnit ?? "kg",
      transport: entry.transport ?? "Ex-premises",
      transportCost: entry.transportCost ?? "",
    };

    return acc;
  }, {});
}

async function loadIngredientsForBoss(uid: string) {
  const q = query(
    collection(db, "ingredients"),
    where("bossUid", "==", uid),
    orderBy("nameEn", "asc")
  );

  const snap = await getDocs(q);
  const rows: Ingredient[] = snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as any),
  }));

  return rows;
}

function normalizeDigits(input: string) {
  const bnToEn: Record<string, string> = {
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

  return input.replace(/[০-৯]/g, (d) => bnToEn[d] ?? d);
}

function extractAmount(cmd: string) {
  let normalized = normalizeDigits(String(cmd || "").toLowerCase());

  normalized = normalized.replace(/,/g, "");

  const m = normalized.match(/\d+(\.\d+)?/);
  if (!m) return null;

  const amt = Number(m[0]);
  return Number.isFinite(amt) ? amt : null;
}

function containsAny(text: string, words: string[]) {
  return words.some((w) => text.includes(w));
}

function detectField(textRaw: string): VoiceField | null {
  const t = (textRaw || "").toLowerCase();

  if (t.includes("guest") || t.includes("guests")) return "guests";
  if (t.includes("client price") || t.includes("price")) return "clientPrice";
  if (t.includes("advance") || t.includes("deposit")) return "advancePaid";
  if (t.includes("paid now") || t.includes("pay now") || t.includes("today")) {
    return "paidNow";
  }

  if (t.includes("গেস্ট") || t.includes("অতিথি")) return "guests";
  if (t.includes("ক্লায়েন্ট") || t.includes("প্রাইস") || t.includes("দাম")) {
    return "clientPrice";
  }
  if (t.includes("অগ্রিম") || t.includes("এডভান্স")) return "advancePaid";
  if (
    t.includes("আজকে") ||
    t.includes("আজ") ||
    t.includes("পেলাম") ||
    t.includes("পেমেন্ট") ||
    t.includes("পেইড")
  ) {
    return "paidNow";
  }

  return null;
}

function isEventClosed(status: any) {
  return String(status || "").toLowerCase() === "closed";
}

function isValidISODate(d?: string) {
  if (!d) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
  const dt = new Date(d + "T00:00:00");
  return !Number.isNaN(dt.getTime());
}

function isComplete(ev: EventData) {
  const cnOk = !!(ev.clientName && ev.clientName.trim().length >= 2);
  const dateOk = isValidISODate(ev.date);
  const guestsOk = Number(ev.guests ?? 0) > 0;
  return cnOk && dateOk && guestsOk;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function to24h(hour12: number, ampm: "AM" | "PM") {
  let h = hour12 % 12;
  if (ampm === "PM") h += 12;
  return h;
}

function from24h(time?: string) {
  const t = (time ?? "").trim();
  if (!/^\d{2}:\d{2}$/.test(t)) {
    return { hour12: 10, minute: "00", ampm: "AM" as const };
  }
  const [hh, mm] = t.split(":");
  const h24 = Number(hh);
  const ampm = h24 >= 12 ? ("PM" as const) : ("AM" as const);
  const hour12 = ((h24 + 11) % 12) + 1;
  return { hour12, minute: mm, ampm };
}

function buildTime(hour12: number, minute: string, ampm: "AM" | "PM") {
  const h24 = to24h(hour12, ampm);
  return `${pad2(h24)}:${minute}`;
}

function calcPayment(price: any, advance: any, extraPaidNow: any) {
  const p = Number(price ?? 0);
  const a = Number(advance ?? 0);
  const x = Number(extraPaidNow ?? 0);

  const paidTotal = Math.max(0, a + x);
  const balanceDue = Math.max(0, p - paidTotal);

  const paymentStatus: PaymentStatus =
    p <= 0
      ? "unpaid"
      : paidTotal <= 0
      ? "unpaid"
      : balanceDue <= 0
      ? "paid"
      : "partial";

  return { paidTotal, balanceDue, paymentStatus };
}

function normalizeBanglaDigits(text: string) {
  return (text || "")
    .replace(/০/g, "0")
    .replace(/১/g, "1")
    .replace(/২/g, "2")
    .replace(/৩/g, "3")
    .replace(/৪/g, "4")
    .replace(/৫/g, "5")
    .replace(/৬/g, "6")
    .replace(/৭/g, "7")
    .replace(/৮/g, "8")
    .replace(/৯/g, "9");
}

function normalizeSpeechText(text: string) {
  return normalizeBanglaDigits((text || "").toLowerCase())
    .replace(/[.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function bnWordToValue(word: string): number {
  const map: Record<string, number> = {
    শূন্য: 0,
    জিরো: 0,

    এক: 1,
    একা: 1,
    ওয়ান: 1,
    ওয়ান: 1,

    দুই: 2,
    দু: 2,
    টু: 2,

    তিন: 3,
    থ্রি: 3,

    চার: 4,
    ফোর: 4,

    পাঁচ: 5,
    ফাইভ: 5,

    ছয়: 6,
    ছয়: 6,
    সিক্স: 6,

    সাত: 7,
    সেভেন: 7,

    আট: 8,
    এইট: 8,

    নয়: 9,
    নয়: 9,
    নাইন: 9,

    দশ: 10,
    এগারো: 11,
    বারো: 12,
    তেরো: 13,
    চৌদ্দ: 14,
    পনেরো: 15,
    ষোল: 16,
    সতেরো: 17,
    আঠারো: 18,
    উনিশ: 19,

    বিশ: 20,
    ত্রিশ: 30,
    চল্লিশ: 40,
    পঞ্চাশ: 50,
    ষাট: 60,
    সত্তর: 70,
    আশি: 80,
    নব্বই: 90,

    একশ: 100,
    একশো: 100,
    শত: 100,
    শো: 100,

    হাজার: 1000,
    হাজারো: 1000,

    লাখ: 100000,
  };

  return map[word] ?? -1;
}

function parseBanglaWordsToNumber(text: string): number | null {
  const src = normalizeSpeechText(text);
  if (!src) return null;

  const tokens = src.split(" ").filter(Boolean);
  if (!tokens.length) return null;

  for (const t of tokens) {
    if (t === "দুইহাজার" || t === "দুহাজার") return 2000;
    if (t === "তিনহাজার") return 3000;
    if (t === "চারহাজার") return 4000;
    if (t === "পাঁচহাজার") return 5000;
  }

  let total = 0;
  let current = 0;
  let matched = false;

  for (const raw of tokens) {
    const word = raw.trim();
    if (!word) continue;

    if (/^\d+$/.test(word)) {
      current += Number(word);
      matched = true;
      continue;
    }

    if (word === "দুইশ" || word === "দুইশো") {
      current += 200;
      matched = true;
      continue;
    }
    if (word === "তিনশ" || word === "তিনশো") {
      current += 300;
      matched = true;
      continue;
    }
    if (word === "চারশ" || word === "চারশো") {
      current += 400;
      matched = true;
      continue;
    }
    if (word === "পাঁচশ" || word === "পাঁচশো") {
      current += 500;
      matched = true;
      continue;
    }
    if (
      word === "ছয়শ" ||
      word === "ছয়শ" ||
      word === "ছয়শো" ||
      word === "ছয়শো"
    ) {
      current += 600;
      matched = true;
      continue;
    }
    if (word === "সাতশ" || word === "সাতশো") {
      current += 700;
      matched = true;
      continue;
    }
    if (word === "আটশ" || word === "আটশো") {
      current += 800;
      matched = true;
      continue;
    }
    if (
      word === "নয়শ" ||
      word === "নয়শ" ||
      word === "নয়শো" ||
      word === "নয়শো"
    ) {
      current += 900;
      matched = true;
      continue;
    }

    const val = bnWordToValue(word);
    if (val < 0) continue;

    matched = true;

    if (val === 100) {
      current = current === 0 ? 100 : current * 100;
    } else if (val === 1000) {
      if (current === 0) {
        total += 1000;
      } else {
        total += current * 1000;
      }
      current = 0;
    } else if (val === 100000) {
      current = current === 0 ? 100000 : current * 100000;
      total += current;
      current = 0;
    } else {
      current += val;
    }
  }

  const result = total + current;
  return matched && result > 0 ? result : null;
}

function extractAmountFromSpeech(text: string): number | null {
  const src = normalizeSpeechText(text);

  const digitMatch = src.match(/\d+/);
  if (digitMatch) {
    const n = Number(digitMatch[0]);
    if (!Number.isNaN(n) && n > 0) return n;
  }

  if (src.includes("দুই হাজার")) return 2000;
  if (src.includes("দু হাজার")) return 2000;
  if (src.includes("২ হাজার")) return 2000;
  if (src.includes("তিন হাজার")) return 3000;
  if (src.includes("চার হাজার")) return 4000;
  if (src.includes("পাঁচ হাজার")) return 5000;

  return parseBanglaWordsToNumber(src);
}

function getIngredientCategory(name: string): SupplierCategory | null {
  const ingredientCategoryMap: Record<string, SupplierCategory> = {
    Beef: "Beef",
    Mutton: "Mutton",
    Chicken: "Chicken",
    Fish: "Fish",

    Rice: "Rice",
    "Basmati Rice": "Rice",
    "Chinigura Rice": "Rice",
    Polao: "Rice",

    Onion: "Grocery",
    "Onion (Whole)": "Grocery",
    "Onion Paste": "Frozen",

    Garlic: "Grocery",
    "Garlic (Whole)": "Grocery",
    "Garlic Paste": "Frozen",

    Ginger: "Grocery",
    "Ginger (Whole)": "Grocery",
    "Ginger Paste": "Frozen",

    Potato: "Vegetables",
    Tomato: "Vegetables",
    Carrot: "Vegetables",
    Cucumber: "Vegetables",
    "Green Chilli": "Vegetables",

    "Red Chilli Powder": "Spices",
    Turmeric: "Spices",
    "Turmeric Powder": "Spices",
    Coriander: "Spices",
    "Coriander Powder": "Spices",
    Cumin: "Spices",
    "Cumin Powder": "Spices",
    "Black Pepper": "Spices",
    Cinnamon: "Spices",
    Cardamom: "Spices",
    Bayleaf: "Spices",

    Oil: "Oil/Ghee",
    "Soybean Oil": "Oil/Ghee",
    Ghee: "Oil/Ghee",
    Dalda: "Oil/Ghee",

    "Frozen Peas": "Frozen",
  };

  return ingredientCategoryMap[name] || null;
}

function safeParseJSON<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
function getMergedIngredients(costItems: any[]) {
  const ingredientRows = costItems.filter((it) => it.ingredientId);

  return Object.values(
    ingredientRows.reduce((acc: Record<string, any>, it: any) => {
      const unit = it.unit ?? "kg";
      const key = `${it.ingredientId}__${unit}`;
      const qty = Number(it.qty ?? it.amount ?? 0) || 0;

      const parts = (it.name ?? "").split(" - ");
      const ingredientName = parts[0] ?? it.name;
      const specFromName = parts[1] ?? "";

      if (!acc[key]) {
        acc[key] = {
          name: ingredientName,
          ingredientId: it.ingredientId,
          unit,
          qty,
          spec: it.spec ?? it.grade ?? specFromName ?? "—",
          brand: it.brand ?? "—",
          packaging: it.packaging ?? "—",
        };
      } else {
        acc[key].qty += qty;
      }

      return acc;
    }, {})
  );
}
/* =======================
   Component
======================= */
export default function EventClient() {
  const params = useParams();
  const router = useRouter();

  const id = useMemo(() => {
    const raw = (params as any)?.id;

    if (Array.isArray(raw)) return raw[0] || "";
    return typeof raw === "string" ? raw : "";
  }, [params]);
useEffect(() => {
  let cancelled = false;

  const unsub = onAuthStateChanged(auth, async (user) => {
    if (cancelled) return;

    if (!user) {
      setAuthorized(false);
      setAuthReady(true);
      router.replace("/login");
      return;
    }

    const role = await getUserRole(user.uid);

    if (cancelled) return;

    setUserRole(role);

    if (!role) {
      setAuthorized(false);
      setAuthReady(true);
      router.replace("/");
      return;
    }

    try {
      const eventRef = doc(db, "events", String(id));
      const eventSnap = await getDoc(eventRef);

      if (cancelled) return;

      if (!eventSnap.exists()) {
        setAuthorized(false);
        setAuthReady(true);
        return;
      }

      const eventData = eventSnap.data() as any;
      const bossUid = eventData?.bossUid ?? "";

      const canOpen = role === "staff" || bossUid === user.uid;

      setAuthorized(canOpen);
      setAuthReady(true);

      if (!canOpen) {
        router.replace(getUnauthorizedRedirect(role));
      }
    } catch (err) {
      console.error("Event detail auth check failed:", err);
      setAuthorized(false);
      setAuthReady(true);
    }
  });

  return () => {
    cancelled = true;
    unsub();
  };
}, [id, router]);
  /* =======================
     Core state
  ======================= */
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [authReady, setAuthReady] = useState(false);
const [authorized, setAuthorized] = useState(false);
const [userRole, setUserRole] = useState<AllowedRole | null>(null);
  const lastRowRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [eventData, setEventData] = useState<EventData | null>(null);
  const [cateringHouses, setCateringHouses] = useState<CateringHouseOption[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
const [suppliers, setSuppliers] = useState<Supplier[]>([]);
const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [supplierMaster, setSupplierMaster] = useState<SupplierMasterItem[]>([
    {
      id: "sup-1",
      name: "Rahman Beef Traders",
      categories: ["Beef", "Mutton"],
    },
    {
      id: "sup-2",
      name: "Karim Grocery Store",
      categories: ["Grocery", "Rice", "Spices", "Oil/Ghee"],
    },
    {
      id: "sup-3",
      name: "Fresh Chicken Center",
      categories: ["Chicken", "Frozen"],
    },
  ]);
  const loadEventSuppliers = async () => {
  try {
    setLoadingSuppliers(true);

    const snap = await getDocs(collection(db, "suppliers"));
    const rows: Supplier[] = snap.docs.map((d) => {
      const data = d.data() as any;
      return {
        id: d.id,
        name: data.name || "",
        category: data.category || "",
        phone: data.phone || "",
        email: data.email || "",
      };
  
    });

    setSuppliers(rows);
  } catch (error) {
    console.error("Failed to load suppliers:", error);
  } finally {
    setLoadingSuppliers(false);
  }
};
  useEffect(() => {
  loadEventSuppliers();
}, []);
const [availableStaff, setAvailableStaff] = useState<any[]>([]);

const [staffAssignments, setStaffAssignments] = useState<
  {
    staffId: string;
    name: string;
    role: string;
    hourlyRate: number;
    hours: number;
    totalCost: number;
  }[]
>([]);

  function getSuppliersForIngredient(name: string) {
    const category = getIngredientCategory(name);
    if (!category) return [];

    return supplierMaster.filter((supplier) =>
      supplier.categories.includes(category)
    );
  }

  function getSuggestedSupplierNames(name: string): string[] {
    return getSuppliersForIngredient(name).map((supplier) => supplier.name);
  }

  function getPrimarySuggestedSupplier(name: string): string {
    const matches = getSuppliersForIngredient(name);
    return matches.length > 0 ? matches[0].name : "No supplier";
  }

  const [cpUid, setCpUid] = useState<string | null>(null);

  const [clientPrice, setClientPrice] = useState<string>("");
const [targetMargin, setTargetMargin] = useState("30");
  const [revenueItems, setRevenueItems] = useState<RevenueItem[]>([]);
  const [revenueName, setRevenueName] = useState("");
  const [revenueAmount, setRevenueAmount] = useState("");

  const [supplierLogistics, setSupplierLogistics] = useState<SupplierLogisticsMap>({});
const [assignedStaffRows, setAssignedStaffRows] = useState<any[]>([]);
const [labourCost, setLabourCost] = useState(0);
  const [ingredientSupplierRows, setIngredientSupplierRows] = useState<
    {
      ingredientName: string;
      supplierName: string;
      qty: string;
      price: string;
      unit: string;
    }[]
  >([
    {
      ingredientName: "",
      supplierName: "",
      qty: "",
      price: "",
      unit: "kg",
    },
  ]);

  const [costItems, setCostItems] = useState<CostItem[]>([]);
  const [itemSupplierPrices, setItemSupplierPrices] = useState<{
    [itemName: string]: {
      supplier: string;
      price: number;
    }[];
  }>({});

  const [costName, setCostName] = useState("");
  const [costAmount, setCostAmount] = useState("");

  const [lastSavedCostItems, setLastSavedCostItems] = useState<CostItem[]>([]);
  const [lastSavedRevenueItems, setLastSavedRevenueItems] = useState<
    RevenueItem[]
  >([]);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [undoMsg, setUndoMsg] = useState<string | null>(null);

  const [lastDeletedCost, setLastDeletedCost] = useState<{
    item: CostItem;
    index: number;
  } | null>(null);

  const [lastDeletedRevenue, setLastDeletedRevenue] = useState<{
    item: RevenueItem;
    index: number;
  } | null>(null);

  const [advancePaid, setAdvancePaid] = useState<number>(0);
  const [priceApplied, setPriceApplied] = useState(false);
  const [paidNow, setPaidNow] = useState<number>(0);

  const [saveState, setSaveState] = useState<
    "idle" | "dirty" | "saving" | "saved" | "error"
  >("idle");

  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const pendingTimerRef = useRef<any>(null);
  const [selectedDishes, setSelectedDishes] = useState<string[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>("");

  const [supplierNames, setSupplierNames] = useState<string[]>(() => {
    if (typeof window === "undefined") return DEFAULT_SUPPLIER_NAMES;
    const saved = safeParseJSON<string[]>(
      localStorage.getItem("supplierNames"),
      DEFAULT_SUPPLIER_NAMES
    );
    return [...saved, ...DEFAULT_SUPPLIER_NAMES].slice(0, 5);
  });
  function addSupplierField() {
  setSupplierNames((prev) => [...prev, ""]);
}
const [allSuppliers, setAllSuppliers] = useState<{ id: string; name: string }[]>([]);
const [supplierPhones, setSupplierPhones] = useState<string[]>(() => {
  if (typeof window === "undefined") return ["", "", "", "", ""];
  const saved = JSON.parse(localStorage.getItem("supplierPhones") || "[]");
  return [...saved, "", "", "", "", ""].slice(0, 5);
});
  const [ingredientCategoryFilter, setIngredientCategoryFilter] =
    useState("All");
  const [selectedIngredient, setSelectedIngredient] = useState<any>(null);
  const [selectedIngredientQty, setSelectedIngredientQty] = useState("");
  const [selectedIngredientUnit, setSelectedIngredientUnit] = useState("kg");
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [eventIngredients, setEventIngredients] = useState<any[]>([]);

  const [supplierPrices, setSupplierPrices] = useState<
    Record<string, (number | undefined)[]>
  >(() => {
    if (typeof window === "undefined") return {};
    return safeParseJSON<Record<string, (number | undefined)[]>>(
      localStorage.getItem("supplierPrices"),
      {}
    );
  });

  const totalMenuCost = useMemo(() => {
    return calculateMenuCost(selectedDishes, Number(eventData?.guests || 0));
  }, [selectedDishes, eventData?.guests]);

  const menuPresets: Record<string, string[]> = {
    wedding: ["kacchi_biryani", "chicken_roast", "borhani"],
    budget: ["beef_tehari"],
    corporate: ["plain_polao", "chicken_roast", "borhani"],
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (supplierPrices && Object.keys(supplierPrices).length > 0) {
      localStorage.setItem("supplierPrices", JSON.stringify(supplierPrices));
    }
  }, [supplierPrices]);

  useEffect(() => {
  if (typeof window === "undefined") return;

  localStorage.setItem("supplierPhones", JSON.stringify(supplierPhones));
}, [supplierPhones]);
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "supplierLogistics",
        JSON.stringify(supplierLogistics)
      );
    }
  }, [supplierLogistics]);
useEffect(() => {
  const next = supplierNames.reduce<SupplierLogisticsMap>((acc, supplier, i) => {
    const key = supplier?.trim() || `Supplier ${i + 1}`;

    acc[key] = supplierLogistics[key] || {
      minimumOrderQty: "",
      minimumOrderUnit: "kg",
      transport: "Ex-premises",
      transportCost: "",
    };

    return acc;
  }, {});

  const same =
    JSON.stringify(next) === JSON.stringify(supplierLogistics);

  if (!same) {
    setSupplierLogistics(next);
  }
}, [supplierNames, supplierLogistics]);
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("supplierNames", JSON.stringify(supplierNames));
    }
  }, [supplierNames]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("costItems", JSON.stringify(costItems));
    }
  }, [costItems]);

  const ingredientOptions = ingredientMaster.map((item, index) => ({
    label: `${item.name}${
      "grade" in item && item.grade ? ` - ${item.grade}` : ""
    }`,
    value: `${item.name}__${
      "grade" in item && item.grade ? item.grade : "base"
    }__${index}`,
    category: item.category,
  }));

  const ingredientCategories = [
    "All",
    "Fish",
    "Meat",
    "Vegetable",
    "Spice",
    "Oil",
    "Water",
    "Rice",
    "Flour",
    "SoftDrinks",
  ] as const;

  const filteredIngredientOptions = ingredientOptions.filter((item) => {
    const matchesCategory =
      ingredientCategoryFilter === "All" ||
      item.category === ingredientCategoryFilter;

    const q = ingredientSearch.trim().toLowerCase();
    const matchesSearch = !q || item.label.toLowerCase().includes(q);

    return matchesCategory && matchesSearch;
  });

  const updateSupplierName = (index: number, value: string) => {
  setSupplierNames((prev) => {
    const next = [...prev];
    const oldName = (next[index] || "").trim();
    const newName = value.trim();

    next[index] = value;
    return next;
  });

  setSupplierLogistics((prev) => {
    const next = { ...prev };

    const oldKey = (supplierNames[index] || "").trim();
    const newKey = value.trim();

    if (oldKey && oldKey !== newKey && next[oldKey] && !next[newKey]) {
      next[newKey] = next[oldKey];
      delete next[oldKey];
    }

    if (newKey && !next[newKey]) {
      next[newKey] = {
        minimumOrderQty: "",
        minimumOrderUnit: "",
        transport: "Ex-premises",
        transportCost: "",
      };
    }

    return next;
  });

setSaveState("dirty"); 
};
function updateSupplierLogistics(
  supplierName: string,
  field: string,
  value: string
) {
  const key = supplierName?.trim();
  if (!key) return;

  setSupplierLogistics((prev) => ({
    ...prev,
    [key]: {
      minimumOrderQty: prev[key]?.minimumOrderQty || "",
      minimumOrderUnit: prev[key]?.minimumOrderUnit || "",
      transport: prev[key]?.transport || "Ex-premises",
      transportCost: prev[key]?.transportCost || "",
      [field]: value,
    },
  }));

  setSaveState("dirty");
}
function handleAddStaffToEvent(staff: any) {
  if (!staff?.id) return;

  const exists = staffAssignments.some((row) => row.staffId === staff.id);
  if (exists) return;

  setStaffAssignments((prev) => [
    ...prev,
    {
      staffId: staff.id,
      name: staff.name || "",
      role: staff.role || "",
      hourlyRate: Number(staff.hourlyRate || 0),
      hours: 0,
      totalCost: 0,
    },
  ]);
}

function handleUpdateStaffHours(staffId: string, value: string) {
  const hours = Number(value || 0);

  setStaffAssignments((prev) =>
    prev.map((row) => {
      if (row.staffId !== staffId) return row;

      const hourlyRate = Number(row.hourlyRate || 0);
      const safeHours = Number.isNaN(hours) ? 0 : hours;

      return {
        ...row,
        hours: safeHours,
        totalCost: safeHours * hourlyRate,
      };
    })
  );
}

function handleRemoveStaffFromEvent(staffId: string) {
  setStaffAssignments((prev) => prev.filter((row) => row.staffId !== staffId));
}
  /* ===============================
     INGREDIENT SUPPLIER ROW LOGIC
  ================================ */

  function updateIngredientSupplierRow(
  index: number,
  field: "ingredientName" | "supplierName" | "qty" | "price" | "unit",
  value: string
) {
  setIngredientSupplierRows((prev) => {
    const next = prev.map((row, i) =>
      i === index ? { ...row, [field]: value } : row
    );

    const current = next[index];
    const isLastRow = index === next.length - 1;

    const rowFilled =
      !!current &&
      current.ingredientName.trim().length > 0 &&
      current.qty.trim().length > 0;

    if (field === "ingredientName" && current) {
      const cheapest = getCheapestSupplierForRow(
        supplierNames,
        supplierPrices,
        value
      );

      if (cheapest?.name) {
        next[index] = {
          ...next[index],
          supplierName: cheapest.name,
          price: String(cheapest.price),
        };
      }
    }

    if (isLastRow && rowFilled) {
      next.push({
        ingredientName: "",
        supplierName: "",
        qty: "",
        price: "",
        unit: "kg",
      });

      setTimeout(() => {
        lastRowRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    }

    return next;
  });

  setSaveState("dirty");
}

  function addIngredientSupplierRow() {
    setIngredientSupplierRows((prev) => [
      ...prev,
      {
        ingredientName: "",
        supplierName: "",
        qty: "",
        price: "",
        unit: "kg",
      },
    ]);

    setTimeout(() => {
      lastRowRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);

    setSaveState("dirty");
  }

  function removeIngredientSupplierRow(index: number) {
    setIngredientSupplierRows((prev) => {
      if (prev.length === 1) {
        return [
          {
            ingredientName: "",
            supplierName: "",
            qty: "",
            price: "",
            unit: "kg",
          },
        ];
      }

      return prev.filter((_, i) => i !== index);
    });

    setSaveState("dirty");
  }

  function autofillIngredientQuantities() {
    if (!eventIngredients || eventIngredients.length === 0) return;

    setIngredientSupplierRows((prev) => {
      return prev.map((row) => {
        const match = eventIngredients.find(
          (ing) =>
            String(ing?.name || "").toLowerCase() ===
            row.ingredientName.toLowerCase()
        );

        if (!match) return row;

        return {
          ...row,
          qty: String(match.qty || ""),
          unit: match.unit || row.unit,
        };
      });
    });

    setSaveState("dirty");
    setSaveMsg("⚡ Quantities auto-filled from event ingredients");

    setTimeout(() => setSaveMsg(null), 2000);
  }

  function syncIngredientRowsToCostItems() {
    const generatedCosts: CostItem[] = ingredientSupplierRows
      .filter(
        (row) =>
          row.ingredientName.trim() &&
          Number(row.qty || 0) > 0 &&
          Number(row.price || 0) > 0
      )
      .map((row) => {
        const qty = Number(row.qty || 0);
        const price = Number(row.price || 0);
        const total = qty * price;

        return {
          name: `${row.ingredientName}${
            row.supplierName ? ` (${row.supplierName})` : ""
          }`,
          amount: total,
          ingredientId: undefined,
          unit: row.unit || "",
          qty,
        };
      });

    setCostItems(generatedCosts);
    setSaveState("dirty");
    setSaveMsg("✅ Ingredient costs synced to Cost Items");

    setTimeout(() => {
      setSaveMsg(null);
    }, 2000);
  }

  function calculateIngredientsForEvent() {
    const guestCount = Number(eventData?.guests || 0);

    if (guestCount <= 0) {
      setEventIngredients([]);
      return;
    }

    const result = calculateIngredients(selectedDishes, guestCount);
    setEventIngredients(result);
  }

  function updateSupplierPrice(
    ingredientKey: string,
    supplierIndex: number,
    value: string
  ) {
    setSupplierPrices((prev) => {
      const current = prev[ingredientKey] || [0, 0, 0, 0, 0];
      const nextRow = [...current];
      nextRow[supplierIndex] = value === "" ? 0 : Number(value);

      return {
        ...prev,
        [ingredientKey]: nextRow,
      };
    });
  }

  // INGREDIENT MASTER TEST
  const [storeInventory] = useState<Record<string, number>>({
    Rice: 80,
    "Red Chilli Powder": 500,
    Ghee: 5,
    "Soybean Oil": 10,
  });

  const testRequiredIngredients: Record<string, number> = {
    Rice: 40,
    "Red Chilli Powder": 200,
    Ghee: 3,
    Beef: 30,
  };

  const ingredientUnits: Record<string, string> = {
    Rice: "kg",
    Beef: "kg",
    Ghee: "kg",
    "Red Chilli Powder": "g",
    "Soybean Oil": "litre",
  };

  const storeStock: Record<string, number> = storeInventory;

  const storeCheckResults = Object.entries(testRequiredIngredients).map(
    ([name, requiredQty]) => {
      const stockQty = Number(storeStock[name] || 0);
      const neededQty = Number(requiredQty || 0);
      const balance = stockQty - neededQty;
      const stockManaged = stockQty > 0;
      const inStore = stockQty >= neededQty;
      const buyNow = stockQty < neededQty ? neededQty - stockQty : 0;

      return {
        name,
        requiredQty: neededQty,
        stockQty,
        balance,
        unit: ingredientUnits[name] || "",
        stockManaged,
        inStore,
        buyNow,
      };
    }
  );

  const purchaseList = storeCheckResults
    .filter((row) => row.buyNow > 0)
    .map((row) => {
      const ingredientKey = row.name || "";
      const rowPrices = supplierPrices[ingredientKey] || [0, 0, 0, 0, 0];
      const cheapest = getCheapestSupplier(
        rowPrices.map((p) => Number(p ?? 0) || 0),
        supplierNames
      );

      return {
        ...row,
        supplier: cheapest.name || "No supplier",
        price: Number(cheapest.price || 0),
      };
    });

  const testItems = [
    "Rice",
    "Beef",
    "Red Chilli Powder",
    "Onion (Whole)",
    "Ghee",
  ];

  const stockTestResults = testItems.map((name) => ({
    name,
    stockManaged: isStockManagedIngredient(name),
  }));

  const supplierTotals = useMemo(() => {
  const totals = [0, 0, 0, 0, 0];

  const ingredientRows = costItems.filter((it: any) => it.ingredientId);

  const mergedItems = Object.values(
    ingredientRows.reduce((acc: Record<string, any>, it: any) => {
      const unit = it.unit ?? "kg";
      const key = `${it.ingredientId}__${unit}`;
      const qty = Number(it.qty ?? it.amount ?? 0) || 0;

      const parts = String(it.name ?? "").split(" - ");
      const ingredientName = parts[0]?.trim() || String(it.name || "").trim();

      if (!acc[key]) {
        acc[key] = {
          name: ingredientName,
          ingredientId: it.ingredientId,
          unit,
          qty,
        };
      } else {
        acc[key].qty += qty;
      }

      return acc;
    }, {})
  );

  for (const item of mergedItems as any[]) {
    const ingredientKey = String(item.name || "").trim();
    if (!ingredientKey) continue;

    const prices = supplierPrices[ingredientKey] || [];

    for (let i = 0; i < 5; i++) {
      const price = Number(prices[i]) || 0;
      const qty = Number(item.qty) || 0;

      if (price > 0 && qty > 0) {
        totals[i] += price * qty;
      }
    }
  }

  return totals;
}, [costItems, supplierPrices]);

  const bestSupplierIndex = supplierTotals.some((v) => v > 0)
  ? supplierTotals.reduce((bestIdx, val, idx, arr) => {
      if (val <= 0) return bestIdx;
      if (arr[bestIdx] <= 0) return idx;
      return val < arr[bestIdx] ? idx : bestIdx;
    }, 0)
  : -1;

const supplierRankOrder = supplierTotals
  .map((total, i) => ({
    i,
    total: Number(total || 0),
  }))
  .filter((x) => x.total > 0)
  .sort((a, b) => a.total - b.total);

function getSupplierBadge(i: number) {
  const rank = supplierRankOrder.findIndex((x) => x.i === i);

  if (rank === 0) return "🥇";
  if (rank === 1) return "🥈";
  if (rank === 2) return "🥉";

  return "";
}

  const totalPurchaseCost = useMemo(() => {
    let total = 0;

    for (const row of purchaseList) {
      const prices = supplierPrices[row.name] || [0, 0, 0, 0, 0];
      const { price } = getCheapestSupplier(
        prices.map((p) => Number(p) || 0),
        supplierNames
      );

      const qty = Number(row.buyNow || 0);
      const unitPrice = Number(price || 0);

      total += qty * unitPrice;
    }

    return total;
}, [purchaseList, supplierPrices, supplierNames]);

const bestPurchasePlan = useMemo(() => {
  const items = Array.isArray(storeCheckResults)
    ? storeCheckResults.filter((row) => Number(row.buyNow || 0) > 0)
    : [];

  return items.map((item: any, rowIndex: number) => {
    const ingredientName =
      item.item ||
      item.name ||
      item.ingredient ||
      item.label ||
      `Item ${rowIndex + 1}`;

    const ingredientKey = ingredientName;
    const qty = Number(item.buyNow || 0);
    const unit = item.unit || "";
    const rowPrices = supplierPrices[ingredientKey] || [0, 0, 0, 0, 0];

    const numericPrices = rowPrices
      .map((p) => Number(p) || 0)
      .filter((p) => p > 0);

    const cheapest = getCheapestSupplier(
      rowPrices.map((p) => Number(p) || 0),
      supplierNames
    );

    const supplierName = cheapest.index >= 0 ? cheapest.name : "-";
    const unitPrice = cheapest.price > 0 ? cheapest.price : 0;
    const lineTotal = unitPrice > 0 ? qty * unitPrice : 0;

    const maxPrice =
      numericPrices.length > 0 ? Math.max(...numericPrices) : 0;

    const totalSaving =
      maxPrice > 0 && unitPrice > 0 ? (maxPrice - unitPrice) * qty : 0;

     return {
  ingredientName,
  qty,
  unit,
  supplierIndex: cheapest.index,
  supplierName,
  unitPrice,
  lineTotal,
  totalSaving,
};
  });
}, [storeCheckResults, supplierPrices, supplierNames]);

const totalEventSavings = useMemo(() => {
  return bestPurchasePlan.reduce(
    (sum, row) => sum + Number(row.totalSaving || 0),
    0
  );
}, [bestPurchasePlan]);

const optimizedTotalCost = useMemo(() => {
  return bestPurchasePlan.reduce((sum, row) => {
    return sum + Number(row.lineTotal || 0);
  }, 0);
}, [bestPurchasePlan]);

const bestSupplier = useMemo(() => {
  const map: Record<string, number> = {};

  bestPurchasePlan.forEach((row) => {
    const supplier = row.supplierName || "Unknown";
    const saving = Number(row.totalSaving || 0);

    map[supplier] = (map[supplier] || 0) + saving;
  });

  let best = { name: "-", saving: 0 };

  Object.entries(map).forEach(([name, saving]) => {
    if (Number(saving) > best.saving) {
      best = { name, saving: Number(saving) };
    }
  });

  return best;
}, [bestPurchasePlan]);

const staffAssignmentsTotal = useMemo(() => {
  return (staffAssignments || []).reduce((sum, row) => {
    return sum + Number(row?.totalCost || 0);
  }, 0);
}, [staffAssignments]);
  
  /* =======================
       /* =======================
     Voice + UI
  ======================= */
  const [voiceLang, setVoiceLang] = useState<"bn-BD" | "en-GB">("bn-BD");
  const [lastCommand, setLastCommand] = useState<string>("");
  const [voiceMsg, setVoiceMsg] = useState<string>("");
  const [voiceActionMsg, setVoiceActionMsg] = useState<string>("");
  const [msg, setMsg] = useState<string>("");

  const msgTimerRef = useRef<any>(null);
  const voiceMsgTimerRef = useRef<any>(null);
  const voiceHandledUntilRef = useRef<number>(0);

  const clearRevenueAmtRef = useRef<any>(null);
  const clearCostAmtRef = useRef<any>(null);

  const stickyRevenueRef = useRef<{ val: string; until: number } | null>(null);
  const stickyCostRef = useRef<{ val: string; until: number } | null>(null);

  const activeInputRef =
    React.useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const [focusVoiceOn, setFocusVoiceOn] = useState<boolean>(true);
  const [focusField, setFocusField] = useState<any>(null);

  function applyVoiceValueToFocusedField(raw: string) {
    const cleaned = normalizeDigits(raw).trim();
    if (!cleaned) return false;

    const amount = extractAmount(cleaned);
    const ff = String(focusField ?? "");

    switch (ff) {
      case "clientPrice":
        if (amount !== null) setClientPrice(String(amount));
        return true;

      case "advancePaid":
        if (amount !== null) setAdvancePaid(amount);
        return true;

      case "paidNow":
        if (amount !== null) setPaidNow(amount);
        return true;

      case "revenueName":
        setRevenueName(cleaned);
        return true;

      case "revenueAmount":
        if (amount !== null) setRevenueAmount(String(amount));
        else setRevenueAmount(cleaned);
        return true;

      case "costName":
        setCostName(cleaned);
        return true;

      case "costAmount":
        if (amount !== null) setCostAmount(String(amount));
        else setCostAmount(cleaned);
        return true;

      default:
        return false;
    }
  }

  function showMsg(text: string, ms = 3000) {
    setMsg(text);
    clearTimeout(msgTimerRef.current);
    msgTimerRef.current = setTimeout(() => {
      setMsg("");
    }, ms);
  }

  function flashMsg(text: string, ms = 2500) {
    setMsg(text);
    if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
    msgTimerRef.current = setTimeout(() => setMsg(""), ms);
  }

  function setRevenueAmountSticky(val: string, ms = 2500) {
    stickyRevenueRef.current = { val, until: Date.now() + ms };

    setRevenueAmount(val);
    clearTimeout(clearRevenueAmtRef.current);
    clearRevenueAmtRef.current = setTimeout(() => {
      stickyRevenueRef.current = null;
      setRevenueAmount("");
    }, ms);
  }

  function setCostAmountSticky(val: string, ms = 2500) {
    stickyCostRef.current = { val, until: Date.now() + ms };

    setCostAmount(val);
    clearTimeout(clearCostAmtRef.current);
    clearCostAmtRef.current = setTimeout(() => {
      stickyCostRef.current = null;
      setCostAmount("");
    }, ms);
  }

  function setNativeValue(
    el: HTMLInputElement | HTMLTextAreaElement,
    value: string
  ) {
    const setter = Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(el),
      "value"
    )?.set;
    setter?.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }

  /* =======================
     Derived
  ======================= */
  const bossUid = eventData?.bossUid ?? "";
  const isBoss = !!cpUid && !!bossUid && cpUid === bossUid;
  const isClosed = !!eventData && isEventClosed(eventData?.status);
  const locked = isClosed;
  useEffect(() => {
  if (locked) return;

  setCostItems((prev) => {
    const others = prev.filter((item) => item.name !== "Food Cost");

    if (totalMenuCost <= 0) return others;

    return [
      ...others,
      {
        name: "Food Cost",
        amount: Number(totalMenuCost.toFixed(2)),
      },
    ];
  });
}, [totalMenuCost, locked, setCostItems]);
  const lockReason = isClosed
    ? "🔒 Event is closed"
    : !isBoss
    ? "🔒 Only Boss can edit/save"
    : "";

  const startUI = useMemo(() => from24h(eventData?.startTime), [
    eventData?.startTime,
  ]);
  const endUI = useMemo(() => from24h(eventData?.endTime), [eventData?.endTime]);

  const itemsRevenueTotal = revenueItems.reduce(
    (sum, it) => sum + Number(it.amount || 0),
    0
  );
  const currentRevenueTotal =
    itemsRevenueTotal > 0 ? itemsRevenueTotal : Number(clientPrice || 0);
    const currentCostTotal =
  costItems.reduce(
    (sum: number, item: any) => sum + (Number(item?.amount) || 0),
    0
  ) + Number(staffAssignmentsTotal || 0);
  const profitNow = currentRevenueTotal - currentCostTotal;
const marginPercentNow =
  Number(clientPrice || 0) > 0
    ? ((Number(clientPrice || 0) - Number(totalMenuCost || 0)) /
        Number(clientPrice || 1)) *
      100
    : 0;
    const suggestedPriceFromTargetMargin =
  Number(totalMenuCost || 0) > 0 && Number(targetMargin || 0) < 100
    ? Number(totalMenuCost || 0) / (1 - Number(targetMargin || 0) / 100)
    : 0;
    const marginGapNow = marginPercentNow - Number(targetMargin || 0);
  const guestsCount = Number(eventData?.guests ?? 0);
  const costPerPlate =
  guestsCount > 0 ? Number(currentCostTotal || 0) / guestsCount : 0;
  const [targetMarginPercent, setTargetMarginPercent] = useState(30);

const suggestedPricePerPlate =
  costPerPlate > 0 ? costPerPlate * (1 + targetMarginPercent / 100) : 0;

const suggestedTotalRevenue =
  guestsCount > 0 ? suggestedPricePerPlate * guestsCount : 0;
  const profitPerPlate = guestsCount > 0 ? profitNow / guestsCount : 0;

  const profitClass =
    profitNow > 0
      ? "text-green-700"
      : profitNow < 0
      ? "text-red-700"
      : "text-neutral-900";

  const costDirty =
    JSON.stringify(costItems) !== JSON.stringify(lastSavedCostItems);
  const revenueDirty =
    JSON.stringify(revenueItems) !== JSON.stringify(lastSavedRevenueItems);

  const paidTotalNow = Math.max(
    0,
    Number(advancePaid || 0) + Number(paidNow || 0)
  );
  const balanceDueNow = Math.max(0, Number(clientPrice || 0) - paidTotalNow);
  const paymentStatusNow: PaymentStatus =
    Number(clientPrice || 0) <= 0
      ? "unpaid"
      : paidTotalNow <= 0
      ? "unpaid"
      : balanceDueNow <= 0
      ? "paid"
      : "partial";

  /* =======================
     Voice helpers that need state
  ======================= */
  async function persistTotalsAndLists() {
    if (!id) return;

    const newTotalRevenue = currentRevenueTotal;
    const newTotalCost = currentCostTotal;
    const newProfit = newTotalRevenue - newTotalCost;
const cleanedSupplierPrices = Object.fromEntries(
  Object.entries(supplierPrices || {}).map(([key, arr]) => [
    key,
    Array.isArray(arr)
      ? arr.map((v) =>
          v === undefined || v === null || Number.isNaN(v) ? "" : v
        )
      : [],
  ])
);

console.log("SAVING supplierPrices =", cleanedSupplierPrices);

await updateDoc(doc(db, "events", String(id)), {
  revenueItems,
  costItems,
  totalRevenue: newTotalRevenue,
  totalCost: newTotalCost,
  supplierNames,
  supplierPrices: cleanedSupplierPrices,
  profit: newProfit,
  clientPrice: Number(clientPrice || 0),
  advancePaid: Number(advancePaid || 0),
  paidNow: Number(paidNow || 0),
  paidTotal: paidTotalNow,
  balanceDue: balanceDueNow,
  paymentStatus: paymentStatusNow,
  supplierLogistics,
  ingredientSupplierRows,
  staffAssignments,
  staffCost: staffAssignmentsTotal,
  targetMarginPercent,
  labourCost: totalLabourCost,
});

    setLastSavedRevenueItems(JSON.parse(JSON.stringify(revenueItems)));
    setLastSavedCostItems(JSON.parse(JSON.stringify(costItems)));
    setLastSavedAt(new Date().toLocaleTimeString());
  }

  async function saveAll() {
  if (locked) {
    setError(lockReason || "🔒 Locked");
    return;
  }
  if (!id) return;
  if (savingRef.current) return;

  savingRef.current = true;
  setSaving(true);
  setError(null);
  setSaveState("saving");
  setVoiceActionMsg("💾 Saving...");
  setSaveMsg("💾 Saving...");

  try {
    await Promise.race([
      persistTotalsAndLists(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Save timeout (15s)")), 15000)
      ),
    ]);

    await updateDoc(doc(db, "events", id), {
      staffAssignments,
      updatedAt: serverTimestamp(),
    });

    setSaveState("saved");
    setVoiceActionMsg("✅ Saved");
    setSaveMsg("✅ Saved");

    const snap = await getDoc(doc(db, "events", String(id)));
    const raw = snap.data() as any;

    const normalized: EventData = {
      ...raw,
      allDay: typeof raw?.allDay === "boolean" ? raw.allDay : !!raw?.isWholeDay,
      date: raw?.date ?? "",
      guests: Number(raw?.guests ?? 0),
      startTime: raw?.startTime ?? "",
      endTime: raw?.endTime ?? "",
      clientName: raw?.clientName ?? raw?.customerNameSnapshot ?? "",
    };

    setEventData(normalized);
    setSupplierNames(
      Array.isArray(normalized?.supplierNames) &&
        normalized.supplierNames.length > 0
        ? [
            ...normalized.supplierNames,
            "Supplier A",
            "Supplier B",
            "Supplier C",
            "Supplier D",
            "Supplier E",
          ].slice(0, 5)
        : ["Supplier A", "Supplier B", "Supplier C", "Supplier D", "Supplier E"]
    );
    setSupplierPrices(normalized?.supplierPrices || {});

    setTimeout(() => {
      setSaveState("idle");
      setVoiceActionMsg("");
      setSaveMsg(null);
    }, 2500);
  } catch (e: any) {
    const errText = e?.message ?? "Failed to save";
    setError(errText);
    setSaveState("error");
    setVoiceActionMsg("❌ Save failed");
    setSaveMsg("❌ Save failed");

    setTimeout(() => {
      setVoiceActionMsg("");
      setSaveMsg(null);
    }, 3000);
  } finally {
    setSaving(false);
    savingRef.current = false;
  }
}

const handleUseSuggestedPrice = () => {
  const safeSuggested = Number(suggestedPriceFromTargetMargin || 0);

  setClientPrice(String(safeSuggested.toFixed(2)));
  setPriceApplied(true);

  setTimeout(() => {
    setPriceApplied(false);
  }, 2000);
};

function clearPendingAction() {
  setPendingAction(null);
  if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
  pendingTimerRef.current = null;
}

async function closeEvent() {
  if (!id) return;
  if (!isBoss) return;
  if (locked) return;

  const ok = window.confirm(
    "Close this event? Financial editing will be locked."
  );

  if (!ok) return;

  try {
    setSaving(true);
    setError(null);
    setSaveState("saving");

    await updateDoc(doc(db, "events", String(id)), {
      status: "closed",
      lockedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    setSaveState("saved");

    setEventData((prev) =>
      prev
        ? {
            ...prev,
            status: "closed",
            lockedAt: new Date(),
          }
        : prev
    );

    setSaveMsg("✅ Event closed");

    setTimeout(() => {
      setSaveMsg(null);
    }, 1500);
  } catch (e: any) {
    setSaveState("error");
    setError(e?.message ?? "Failed to close event");
  } finally {
    setSaving(false);
  }
}

const totalStaffLabourCost = staffAssignments.reduce(
  (sum, row) => sum + Number(row.totalCost || 0),
  0
);

async function executePendingAction() {
  const pa = pendingAction;
  if (!pa) return "";

  clearPendingAction();

  if (pa.type === "closeEvent") {
    try {
      await closeEvent();
      return "🔒 Event closed";
    } catch {
      return "❌ Failed to close event";
    }
  }

  if (pa.type === "addRevenue") {
    setRevenueItems((prev) => [
      ...(prev || []),
      { name: "Voice Revenue", amount: pa.amount },
    ]);
    await saveAll();
    return `✅ Revenue added: ${pa.amount}`;
  }

  return "";
}

async function voiceAutoSave(label: string) {
  try {
    setVoiceMsg(`💾 Saving (${label})...`);
    await saveAll();
    setTimeout(() => setVoiceMsg("✅ Saved"), 400);
  } catch (e) {
    console.error("voiceAutoSave error", e);
    setVoiceMsg("❌ Save failed");
  }
}

  async function runVoiceCommand(cmdRaw: string) {
    const cmd = normalizeSpeechText(cmdRaw);

    const isFullVoiceCommand = containsAny(cmd, [
      "cost",
      "expense",
      "খরচ",
      "ব্যয়",
      "ব্যয়",
      "কস্ট",
      "revenue",
      "rev",
      "income",
      "sales",
      "আয়",
      "আয়",
      "রেভিনিউ",
      "বিক্রি",
      "advance",
      "অগ্রিম",
      "অ্যাডভান্স",
      "paid now",
      "pay now",
      "today paid",
      "received today",
      "today received",
      "আজকে পেলাম",
      "পেলাম",
      "paid",
      "পেইড",
      "price",
      "client price",
      "rate",
      "দাম",
      "প্রাইস",
      "save",
      "saved",
      "সেভ",
      "close event",
      "event close",
      "ইভেন্ট বন্ধ",
      "ইভেন্ট ক্লোজ",
      "ইভেন্ট শেষ",
      "remove last cost",
      "delete last cost",
      "undo cost",
      "remove last revenue",
      "delete last revenue",
      "undo revenue",
      "show profit",
      "profit",
      "লাভ",
      "প্রফিট",
    ]);

    if (focusVoiceOn && activeInputRef.current && !isFullVoiceCommand) {
      const onlyNums = cmdRaw.replace(/[^\d০-৯]/g, "");
      if (onlyNums) {
        const normalized = normalizeDigits(onlyNums);
        const amt = Number(normalized);

        if (amt > 0) {
          if (Date.now() < voiceHandledUntilRef.current) {
            return true;
          }

          const ok = applyVoiceValueToFocusedField(String(amt));
          if (ok) {
            showMsg(`🎯 Filled: ${amt}`, 2000);
            return true;
          }
        }
      }
    }

    if (!cmdRaw?.trim()) return "";
    if (locked) return "🔒 Locked";
    if (isClosed) return "🔒 Event closed";

    if (
      containsAny(cmd, ["price", "client price", "rate", "দাম", "প্রাইস"])
    ) {
      const amt = extractAmount(cmdRaw) ?? 0;
      if (amt <= 0) return "❌ Say: price 5000";

      setClientPrice(String(amt));
      setSaveState("dirty");
      showMsg(`📋 Price set: ${amt}`, 2000);
      return `Price set: ${amt}`;
    }

    if (containsAny(cmd, ["advance", "অগ্রিম", "অ্যাডভান্স"])) {
      const amt = extractAmount(cmdRaw) ?? 0;

      if (amt > 0) {
        setAdvancePaid(amt);
        showMsg(`💰 Advance: ${amt}`, 2000);
        return `Advance ${amt}`;
      }

      setFocusField("advancePaid");
      activeInputRef.current = null;
      return "💰 Say only the amount";
    }

    if (
      containsAny(cmd, [
        "paid now",
        "pay now",
        "today paid",
        "received today",
        "today received",
        "আজকে পেলাম",
        "পেলাম",
        "paid",
        "পেইড",
        "পেইড নাউ",
        "পেইড নাও",
        "পেড নাউ",
        "পেড নাও",
      ])
    ) {
      const amt = extractAmount(cmdRaw) ?? 0;

      if (amt > 0) {
        setPaidNow(amt);
        showMsg(`💵 Paid Now: ${amt}`, 2000);
        return `Paid ${amt}`;
      }

      setFocusField("paidNow");
      activeInputRef.current = null;
      return "💵 Say only the amount";
    }

    if (
      containsAny(cmd, [
        "remove last revenue",
        "delete last revenue",
        "undo revenue",
        "last revenue remove",
        "remove revenue",
        "delete revenue",
        "রিমুভ লাস্ট রেভিনিউ",
        "রিমুভ রেভিনিউ",
        "ডিলিট লাস্ট রেভিনিউ",
        "ডিলিট রেভিনিউ",
        "আনডু রেভিনিউ",
        "শেষ রেভিনিউ বাদ",
        "শেষ আয় বাদ",
        "শেষ আয় বাদ",
        "রেভিনিউ বাদ",
        "আয় বাদ",
        "আয় বাদ",
      ])
    ) {
      if (locked) return lockReason || "🔒 Locked";

      let removed = false;

      setRevenueItems((prev: any[]) => {
        if (!prev || prev.length === 0) return prev;
        removed = true;
        return prev.slice(0, -1);
      });

      if (!removed) return "❌ No revenue item to remove";

      setVoiceMsg("🗑️ Last revenue removed");
      void voiceAutoSave("Last revenue removed");

      return "🗑️ Last revenue removed";
    }

    if (
      containsAny(cmd, [
        "revenue",
        "rev",
        "রেভিনিউ",
        "আয়",
        "আয়",
        "income",
        "sales",
        "বিক্রি",
      ])
    ) {
      const amt = extractAmountFromSpeech(cmd);
      if (!amt) return "❌ Say: revenue 5000 / রেভিনিউ ৫০০০";

      setRevenueAmountSticky(String(amt), 2500);
      showMsg(`✅ Revenue amount: ${amt}`, 3000);

      setRevenueItems((prev: any[]) => [
        ...(prev || []),
        { name: "Voice Revenue", amount: amt },
      ]);

      setTimeout(() => {
        setRevenueAmountSticky(String(amt), 2500);
      }, 0);

      setVoiceMsg(`✅ Revenue added: ${amt}`);
      void voiceAutoSave(`Revenue ${amt}`);
      return `✅ Revenue ${amt}`;
    }

    if (
      containsAny(cmd, [
        "remove last cost",
        "delete last cost",
        "undo cost",
        "last cost remove",
        "remove cost",
        "delete cost",
        "রিমুভ লাস্ট কস্ট",
        "রিমুভ কস্ট",
        "ডিলিট লাস্ট কস্ট",
        "ডিলিট কস্ট",
        "আনডু কস্ট",
        "শেষ খরচ বাদ",
        "শেষ খরচ ডিলিট",
        "শেষ খরচ মুছুন",
        "খরচ বাদ",
      ])
    ) {
      if (locked) return lockReason || "🔒 Locked";

      let removed = false;

      setCostItems((prev: any[]) => {
        if (!prev || prev.length === 0) return prev;
        removed = true;
        return prev.slice(0, -1);
      });

      if (!removed) return "❌ No cost item to remove";

      setVoiceMsg("🗑️ Last cost removed");
      void voiceAutoSave("Last cost removed");
      return "🗑️ Last cost removed";
    }

    if (
      containsAny(cmd, ["cost", "expense", "খরচ", "ব্যয়", "ব্যয়", "কস্ট"])
    ) {
      if (locked) return lockReason || "🔒 Locked";

      const amt = extractAmountFromSpeech(cmd);
      if (!amt) return "❌ Say cost amount like: খরচ ২০০";

      setCostAmountSticky(String(amt), 2500);

      setCostItems((prev: any[]) => [
        ...(prev || []),
        { name: "Voice Cost", amount: amt },
      ]);

      setVoiceMsg(`✅ Cost added: ${amt}`);
      void voiceAutoSave(`Cost ${amt}`);
      return `✅ Cost ${amt}`;
    }

    if (
      containsAny(cmd, [
        "show profit",
        "profit",
        "current profit",
        "লাভ",
        "প্রফিট",
        "বর্তমান লাভ",
      ])
    ) {
      const totalRevenue = (revenueItems || []).reduce(
        (sum: number, item: any) => sum + (Number(item?.amount) || 0),
        0
      );

      const totalCost = (costItems || []).reduce(
        (sum: number, item: any) => sum + (Number(item?.amount) || 0),
        0
      );

      const profit = totalRevenue - totalCost;
      

      showMsg(`📊 Profit: ${profit}`, 3000);
      return `📊 Profit ${profit}`;
    }

    if (
      containsAny(cmd, ["save", "saved", "সেভ", "সেভ কর", "সেভ করো", "সেভ করুন"])
    ) {
      if (locked) return "🔒 Locked";
      if (isClosed) return "🔒 Event closed";
      if (saving) return "⏳ Already saving...";

      void saveAll();
      return "💾 Saving...";
    }

    if (pendingAction) {
      if (
        containsAny(cmd, ["yes", "ok", "okay", "হ্যাঁ", "হ্যা", "জি", "ঠিক"])
      ) {
        return await executePendingAction();
      }
      if (
        containsAny(cmd, ["no", "না", "নাহ", "বাদ", "ক্যানসেল", "cancel"])
      ) {
        clearPendingAction();
        return "❎ Cancelled";
      }
      return "⚠️ Say YES/OK (হ্যাঁ) or NO (না)";
    }

    if (
      containsAny(cmd, [
        "close event",
        "event close",
        "ইভেন্ট বন্ধ",
        "ইভেন্ট ক্লোজ",
        "ইভেন্ট শেষ",
      ])
    ) {
      if (locked) return "🔒 Already closed";
      setPendingAction({ type: "closeEvent" });
      pendingTimerRef.current = setTimeout(() => clearPendingAction(), 8000);
      return "⚠️ Close event? Say YES / OK (হ্যাঁ) or NO (না)";
    }

    return "🤷 Command not recognized";
  }

  const { start, stop, voiceOn, lastHeard } = useVoiceEngine(
    voiceLang,
    runVoiceCommand
  );
  /* =======================
     Effects
  ======================= */
  useEffect(() => {
    const handler = (e: FocusEvent) => {
      const el = e.target as HTMLElement | null;
      if (!el) return;

      const tag = el.tagName?.toLowerCase();
      if (tag !== "input" && tag !== "textarea") return;

      const type = (el as HTMLInputElement).type;
      if (type === "checkbox" || type === "radio") return;

      activeInputRef.current = el as any;
    };

    document.addEventListener("focusin", handler, true);
    return () => document.removeEventListener("focusin", handler, true);
  }, []);

  useEffect(() => {
    const s = stickyRevenueRef.current;
    if (s && Date.now() < s.until && revenueAmount === "") {
      setRevenueAmount(s.val);
    }
  }, [revenueAmount]);

  useEffect(() => {
    const s = stickyCostRef.current;
    if (s && Date.now() < s.until && costAmount === "") {
      setCostAmount(s.val);
    }
  }, [costAmount]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) =>
      setCpUid(user?.uid ?? null)
    );
    return () => unsub();
  }, []);

  async function loadSuppliers() {
  try {
    if (!id) return;

    const suppliersSnap = await getDocs(collection(db, "suppliers"));
    const supplierList = suppliersSnap.docs.map((doc) => {
  const data = doc.data() as any;

  return {
    id: doc.id,
    name: data?.name || "Unnamed Supplier",
    minOrderQty: data?.minOrderQty ?? data?.minimumOrderQty ?? "",
    minOrderUnit: data?.minOrderUnit ?? data?.minimumOrderUnit ?? "kg",
    transport: data?.transport ?? "Ex-premises",
    transportCost: data?.transportCost ?? "",
  };
});

setAllSuppliers(supplierList);

    const snap = await getDoc(
      doc(db, "events", String(id), "supplierData", "main")
    );

    if (snap.exists()) {
      const data = snap.data();
      setSupplierNames(Array.isArray(data.supplierNames) ? data.supplierNames : []);

const loadedNames = Array.isArray(data.supplierNames) ? data.supplierNames : [];

setSupplierNames(loadedNames);

setSupplierLogistics(() => {
  const existing =
    data?.supplierLogistics && typeof data.supplierLogistics === "object"
      ? data.supplierLogistics
      : {};

  const hydrated = { ...existing };

  loadedNames.forEach((rawName: string) => {
    const key = rawName?.trim();
    if (!key) return;

    if (!hydrated[key]) {
      hydrated[key] = {
        minimumOrderQty: "",
        minimumOrderUnit: "",
        transport: "Ex-premises",
        transportCost: "",
      };
    }
  });

  return hydrated;
});
setIngredientSupplierRows(
  Array.isArray(data?.ingredientSupplierRows) ? data.ingredientSupplierRows : []
);

      setLabourCost(Number(data?.labourCost || 0));
      setStaffAssignments(data?.staffAssignments || []);
      setTargetMarginPercent(data?.targetMarginPercent ?? 30);

      if (Array.isArray(data?.supplierNames)) {
        setSupplierNames(
          [
            ...data.supplierNames,
            "Supplier A",
            "Supplier B",
            "Supplier C",
            "Supplier D",
            "Supplier E",
          ].slice(0, 5)
        );
      }

      if (data?.supplierPrices) {
        setSupplierPrices(data.supplierPrices);
      }
    }
  } catch (err) {
    console.error("Error loading suppliers:", err);
  }
}

useEffect(() => {
  loadSuppliers();
}, []);
  async function saveSuppliersToDB() {
    try {
      if (!id) return;

      await setDoc(doc(db, "events", String(id), "supplierData", "main"), {
        supplierNames,
        supplierPrices,
        updatedAt: serverTimestamp(),
      });

      alert("✅ Suppliers saved!");
      await loadSuppliers();
    } catch (err) {
      console.error(err);
      alert("❌ Error saving suppliers");
    }
  }

  useEffect(() => {
  if (!authReady || !authorized) return;

  async function load() {
    try {
      if (!id) return;

        setLoading(true);
        setError(null);

        const cleanId = String(id).trim();
        const snap = await getDoc(doc(db, "events", cleanId));

        if (!snap.exists()) {
          setError("❌ Event not found");
          setEventData(null);
          setRevenueItems([]);
          setCostItems([]);
          setLastSavedCostItems([]);
          setLastSavedRevenueItems([]);
          setIngredientSupplierRows([]);
          return;
        }

        const raw = snap.data() as EventData;

        if (raw?.supplierNames) {
          setSupplierNames(raw.supplierNames);
        }

        if (raw?.supplierPrices) {
          setSupplierPrices(raw.supplierPrices);
          localStorage.setItem(
            "supplierPrices",
            JSON.stringify(raw.supplierPrices)
          );
        } else {
          setSupplierPrices({});
          localStorage.removeItem("supplierPrices");
        }

        if (raw?.supplierLogistics) {
          setSupplierLogistics(raw.supplierLogistics);
        }

        if (raw?.ingredientSupplierRows) {
          setIngredientSupplierRows(
            Array.isArray(raw.ingredientSupplierRows)
              ? raw.ingredientSupplierRows.map((row: any) => ({
                  ingredientName: String(row?.ingredientName || ""),
                  supplierName: String(row?.supplierName || ""),
                  qty: String(row?.qty ?? ""),
                  price: String(row?.price ?? ""),
                  unit: String(row?.unit || "kg"),
                }))
              : []
          );
        } else {
          setIngredientSupplierRows([]);
        }
if (raw?.staffAssignments) {
  setStaffAssignments(
    (raw.staffAssignments || []).map((row: any) => ({
      staffId: row?.staffId || "",
      name: row?.name || "",
      role: row?.role || "",
      hourlyRate: Number(row?.hourlyRate || 0),
      hours: Number(row?.hours || 0),
      totalCost: Number(row?.totalCost || 0),
    }))
  );
}
        const fixed: EventData = {
          ...raw,
          status: (raw?.status as Status) || "draft",
        };

        setEventData(fixed);
        setClientPrice(String(fixed?.clientPrice ?? ""));
        setRevenueItems(
          Array.isArray(fixed?.revenueItems) ? fixed.revenueItems : []
        );
        setCostItems(Array.isArray(fixed?.costItems) ? fixed.costItems : []);
        setLastSavedRevenueItems(
          Array.isArray(fixed?.revenueItems) ? fixed.revenueItems : []
        );
        setLastSavedCostItems(
          Array.isArray(fixed?.costItems) ? fixed.costItems : []
        );
        setAdvancePaid(Number(fixed?.advancePaid ?? 0));
        setPaidNow(Number(fixed?.paidNow ?? 0));
      } catch (err: any) {
        console.error(err);
        setError(err?.message || "❌ Failed to load event");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [id]);

  useEffect(() => {
    if (!isBoss) return;
    if (!id) return;
    if (!costDirty && !revenueDirty) return;
    if (savingRef.current) return;

    const t = setTimeout(() => {
      void saveAll();
    }, 5000);

    return () => clearTimeout(t);
  }, [isBoss, id, costDirty, revenueDirty]);

  /* =======================
     Actions
  ======================= */
  async function setStatus(newStatus: Status) {
    if (!id) return;
    if (!isBoss) return;

    try {
      setSaving(true);
      setError(null);

      setEventData((prev) => (prev ? { ...prev, status: newStatus } : prev));
      setSaveState("saving");
      await updateDoc(doc(db, "events", String(id)), { status: newStatus });
      setSaveState("saved");
    } catch (e: any) {
      setSaveState("error");
      setError(e?.message ?? "Failed to update status");
    } finally {
      setSaving(false);
    }
  }

  async function deleteEvent() {
    if (!id) return;
    if (!isBoss) {
      setError("❌ Only Boss can delete this event");
      return;
    }
    if (locked) {
      setError(lockReason || "🔒 Locked");
      return;
    }

    const ok = window.confirm(
      "Are you sure you want to delete this event? This cannot be undone."
    );
    if (!ok) return;

    try {
      setSaving(true);
      setError(null);

      await deleteDoc(doc(db, "events", String(id)));

      setSaveMsg("✅ Event deleted");
      setTimeout(() => setSaveMsg(null), 1000);

      router.push("/events");
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete event");
    } finally {
      setSaving(false);
    }
  }

  function addRevenueItem() {
    const name = revenueName.trim();
    const amount = Number(revenueAmount);

    if (!name) return setError("❌ Revenue name required");
    if (!Number.isFinite(amount) || amount <= 0) {
      return setError("❌ Valid revenue amount required");
    }

    setError(null);
    setRevenueItems((prev) => [...prev, { name, amount }]);
    setRevenueName("");
    setSaveState("dirty");
  }

  function deleteRevenueItem(index: number) {
    setRevenueItems((prev) => {
      const item = prev[index];
      if (!item) return prev;

      setLastDeletedRevenue({ item, index });
      setUndoMsg(
        `✅ Deleted revenue: ${item.name} (${showMoney(item.amount)}). You can Undo.`
      );
      setSaveState("dirty");
      return prev.filter((_, i) => i !== index);
    });
  }

  function undoLastRevenueDelete() {
    if (!lastDeletedRevenue) return;

    setRevenueItems((prev) => {
      const next = [...prev];
      next.splice(lastDeletedRevenue.index, 0, lastDeletedRevenue.item);
      return next;
    });

    setUndoMsg("✅ Undo revenue delete successful");
    setLastDeletedRevenue(null);
    setSaveState("dirty");
  }

  function addCostItem() {
    const name = costName.trim();
    const amount = Number(costAmount);

    if (!name) return setError("❌ Cost name required");
    if (!Number.isFinite(amount) || amount <= 0) {
      return setError("❌ Valid amount required");
    }

    setError(null);
    setCostItems((prev) => [
      ...prev,
      {
        name,
        amount,
        ingredientId: undefined,
        unit: "",
        qty: 0,
      },
    ]);
    setCostName("");
    setCostAmount("");
    setSaveState("dirty");
  }

  function deleteCostItem(index: number) {
    setCostItems((prev) => {
      const item = prev[index];
      if (!item) return prev;

      setLastDeletedCost({ item, index });
      setUndoMsg(
        `✅ Deleted cost: ${item.name} (${showMoney(item.amount)}). You can Undo.`
      );
      setSaveState("dirty");
      return prev.filter((_, i) => i !== index);
    });
  }

  function undoLastCostDelete() {
    if (!lastDeletedCost) return;

    setCostItems((prev) => {
      const next = [...prev];
      next.splice(lastDeletedCost.index, 0, lastDeletedCost.item);
      return next;
    });

    setUndoMsg("✅ Undo cost delete successful");
    setLastDeletedCost(null);
    setSaveState("dirty");
  }

  async function saveClientPrice() {
    if (!id) return;

    try {
      setSaving(true);
      setError(null);
      setSaveState("saving");

      await updateDoc(doc(db, "events", String(id)), {
        clientPrice: Number(clientPrice || 0),
        updatedAt: serverTimestamp(),
      });

      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1500);
    } catch (e) {
      setSaveState("error");
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  type PurchasePlanRow = {
  ingredientName?: string;
  qty?: number;
  unit?: string;
  supplierName?: string;
  unitPrice?: number;
  price?: number;
  lineTotal?: number;
};

type SupplierOrderSentVia =
  | "whatsapp_single"
  | "whatsapp_all_one"
  | "whatsapp_all_separate"
  | "copy"
  | "pdf";

function getRowQty(row: PurchasePlanRow) {
  return Number(row?.qty || 0);
}

function getRowUnitPrice(row: PurchasePlanRow) {
  return Number(row?.unitPrice ?? row?.price ?? 0);
}

function getRowLineTotal(row: PurchasePlanRow) {
  const qty = getRowQty(row);
  const unitPrice = getRowUnitPrice(row);
  return Number(row?.lineTotal ?? qty * unitPrice);
}

function getRowSupplier(row: PurchasePlanRow) {
  return String(row?.supplierName || "Unknown Supplier");
}

function getRowIngredient(row: PurchasePlanRow, index: number) {
  return String(row?.ingredientName || `Item ${index + 1}`);
}

function getPurchaseRows(): PurchasePlanRow[] {
  return Array.isArray(bestPurchasePlan)
    ? (bestPurchasePlan as PurchasePlanRow[])
    : [];
}

function groupPurchasePlanBySupplier() {
  const grouped: Record<string, PurchasePlanRow[]> = {};

  getPurchaseRows().forEach((row) => {
    const supplier = getRowSupplier(row);
    if (!grouped[supplier]) grouped[supplier] = [];
    grouped[supplier].push(row);
  });

  return grouped;
}

function getSupplierPhone(supplierName: string) {
  const index = supplierNames.indexOf(supplierName);
  if (index === -1) return "";
  return supplierPhones[index] || "";
}

function buildSupplierMessages(): Record<string, string> {
  try {
    const grouped = groupPurchasePlanBySupplier();
    const messages: Record<string, string> = {};

    Object.entries(grouped).forEach(([supplier, rows]) => {
      let total = 0;

      const lines = rows.map((row, idx) => {
        const ingredientName = getRowIngredient(row, idx);
        const qty = getRowQty(row);
        const unit = String(row?.unit || "");
        const price = getRowUnitPrice(row);
        const lineTotal = getRowLineTotal(row);

        total += lineTotal;

        return `${idx + 1}. ${ingredientName}
Qty: ${qty} ${unit}
Unit Price: £${price.toFixed(2)}
Line Total: £${lineTotal.toFixed(2)}`;
      });

      messages[supplier] = `SUPPLIER ORDER

Supplier: ${supplier}

${lines.join("\n\n")}

-------------------------
TOTAL: £${total.toFixed(2)}`;
    });

    return messages;
  } catch (error) {
    console.error("buildSupplierMessages error:", error);
    return {};
  }
}

function buildAllSuppliersMessage() {
  const messages = buildSupplierMessages();
  const grouped = groupPurchasePlanBySupplier();
  const suppliers = Object.keys(messages);

  if (suppliers.length === 0) {
    return "No supplier orders found";
  }

  let grandTotal = 0;

  const blocks = suppliers.map((supplier) => {
    const rows = grouped[supplier] || [];
    const total = rows.reduce((sum, row) => sum + getRowLineTotal(row), 0);

    grandTotal += total;

    return `${messages[supplier]}

Supplier Total: £${total.toFixed(2)}
---------------------`;
  });

  return `ALL SUPPLIER ORDERS

${blocks.join("\n\n")}

GRAND TOTAL: £${grandTotal.toFixed(2)}`;
}

async function handleCopySupplierOrder() {
  try {
    if (getPurchaseRows().length === 0) {
      alert("No supplier order to copy");
      return;
    }

    const text = buildAllSuppliersMessage();

    await navigator.clipboard.writeText(text);

    await logActivity({
      supplier: "ALL",
      action: "copy",
      message: text,
    });

    await saveAllSuppliersOrderLog({
      message: text,
      sentVia: "copy",
    });

    alert("Supplier order copied");
  } catch (err) {
    console.error(err);
    alert("Failed to copy supplier order");
  }
}

function handleSendToSupplier() {
  try {
    if (getPurchaseRows().length === 0) {
      alert("No supplier order to send");
      return;
    }

    const message = buildAllSuppliersMessage();
    navigator.clipboard.writeText(message);
    alert("Supplier message copied");
  } catch (err) {
    console.error(err);
    alert("Failed to prepare supplier message");
  }
}

function handleSendToWhatsApp() {
  try {
    if (getPurchaseRows().length === 0) {
      alert("No supplier order to send");
      return;
    }

    const message = buildAllSuppliersMessage();
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  } catch (err) {
    console.error(err);
    alert("Failed to open WhatsApp");
  }
}

async function handleCopySupplierMessage(supplier: string) {
  try {
    const messages = buildSupplierMessages();
    const text = messages[supplier];

    if (!text) {
      alert("No message for this supplier");
      return;
    }

    const rows = groupPurchasePlanBySupplier()[supplier] || [];
    const total = rows.reduce((sum, row) => sum + getRowLineTotal(row), 0);

    await navigator.clipboard.writeText(text);

    await logActivity({
      supplier,
      action: "copy",
      message: text,
    });

    await saveSupplierOrderLog({
      supplier,
      rows,
      total,
      message: text,
      sentVia: "copy",
    });

    alert(`Copied message for ${supplier}`);
  } catch (err) {
    console.error(err);
    alert("Failed to copy supplier message");
  }
}

function buildSupplierComparisonSummary() {
  const totals = Object.entries(supplierTotals || {}).filter(
    ([, total]) => Number(total) > 0
  );

  if (totals.length === 0) {
    return "No supplier comparison data found";
  }

  const sorted = totals
    .map(([name, total]) => ({
      name,
      total: Number(total || 0),
    }))
    .sort((a, b) => a.total - b.total);

  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const saving = worst.total - best.total;

  const lines = sorted.map(
    (item, idx) => `${idx + 1}. ${item.name}: £${item.total.toFixed(2)}`
  );

  return `SUPPLIER COMPARISON SUMMARY

Best Supplier: ${best.name}
Best Total: £${best.total.toFixed(2)}
Highest Saving: £${saving.toFixed(2)}

Supplier Totals:
${lines.join("\n")}`;
}

async function handleCopyComparisonSummary() {
  try {
    const summary = buildSupplierComparisonSummary();
    await navigator.clipboard.writeText(summary);

    await logActivity({
      supplier: "ALL",
      action: "copy_comparison_summary",
      message: summary,
    });

    alert("Supplier comparison summary copied");
  } catch (err) {
    console.error(err);
    alert("Failed to copy comparison summary");
  }
}

async function handleWhatsAppAllInOne() {
  try {
    if (getPurchaseRows().length === 0) {
      alert("No data to send");
      return;
    }

    const summary = `📦 PURCHASE PLAN

💰 Total Cost: £${Number(optimizedTotalCost || 0).toFixed(2)}
💸 Total Savings: £${Number(totalEventSavings || 0).toFixed(2)}

🏆 Best Supplier: ${bestSupplier?.name || "-"}

------------------------

${buildAllSuppliersMessage()}`;

    await saveAllSuppliersOrderLog({
      message: summary.trim(),
      sentVia: "whatsapp_all_one",
    });

    const encoded = encodeURIComponent(summary.trim());
    window.open(`https://wa.me/?text=${encoded}`, "_blank");

    await logActivity({
      supplier: "ALL",
      action: "whatsapp_all_one",
      message: summary.trim(),
    });
  } catch (err) {
    console.error(err);
    alert("Failed to send WhatsApp message");
  }
}

async function handleWhatsAppSupplier(supplier: string) {
  try {
    const messages = buildSupplierMessages();
    const text = messages[supplier];

    if (!text) {
      alert("No message found");
      return;
    }

    const phone = getSupplierPhone(supplier);

    if (!phone) {
      alert(`No phone number set for ${supplier}`);
      return;
    }

    const rows = groupPurchasePlanBySupplier()[supplier] || [];
    const total = rows.reduce((sum, row) => sum + getRowLineTotal(row), 0);

    const formatted = `📦 SUPPLIER ORDER

Supplier: ${supplier}

------------------------

${text}

------------------------
Sent via Catering Planner`;

    await saveSupplierOrderLog({
      supplier,
      rows,
      total,
      message: formatted.trim(),
      sentVia: "whatsapp_single",
    });

    const encoded = encodeURIComponent(formatted.trim());
    window.open(`https://wa.me/${phone}?text=${encoded}`, "_blank");

    await logActivity({
      supplier,
      action: "whatsapp",
      message: formatted.trim(),
    });
  } catch (err) {
    console.error(err);
    alert("Failed to send supplier WhatsApp");
  }
}

async function handleWhatsAppAllSuppliers() {
  try {
    const messages = buildSupplierMessages();
    const grouped = groupPurchasePlanBySupplier();
    const suppliers = Object.keys(messages);

    if (suppliers.length === 0) {
      alert("No supplier messages found");
      return;
    }

    const missingPhones: string[] = [];
    let openedCount = 0;

    for (let index = 0; index < suppliers.length; index++) {
      const supplier = suppliers[index];
      const text = messages[supplier];
      const phone = getSupplierPhone(supplier);

      if (!text || !phone) {
        missingPhones.push(supplier);
        continue;
      }

      const rows = grouped[supplier] || [];
      const total = rows.reduce((sum, row) => sum + getRowLineTotal(row), 0);

      await saveSupplierOrderLog({
        supplier,
        rows,
        total,
        message: text,
        sentVia: "whatsapp_all_separate",
      });

      const encoded = encodeURIComponent(text);
      const url = `https://wa.me/${phone}?text=${encoded}`;

      setTimeout(() => {
        window.open(url, "_blank");
        void logActivity({
          supplier,
          action: "whatsapp",
          message: text,
        });
      }, index * 1200);

      openedCount += 1;
    }

    setTimeout(() => {
      if (openedCount === 0) {
        alert(
          missingPhones.length > 0
            ? `No WhatsApp opened. Missing phone for: ${missingPhones.join(", ")}`
            : "No WhatsApp opened"
        );
        return;
      }

      if (missingPhones.length > 0) {
        alert(
          `Opened ${openedCount} supplier WhatsApp chat(s). Missing phone for: ${missingPhones.join(", ")}`
        );
        return;
      }

      alert(`Opened ${openedCount} supplier WhatsApp chat(s)`);
    }, suppliers.length * 1200 + 300);
  } catch (err) {
    console.error(err);
    alert("Failed to send WhatsApp to suppliers");
  }
}

function handleExportPDF() {
  try {
    if (getPurchaseRows().length === 0) {
      alert("No data to export");
      return;
    }

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      alert("Popup blocked. Please allow popups and try again.");
      return;
    }

    const safeRows = getPurchaseRows().map((row, idx) => ({
      index: idx + 1,
      ingredientName: row?.ingredientName || "-",
      qty: getRowQty(row),
      unit: row?.unit || "",
      supplierName: getRowSupplier(row),
      unitPrice: getRowUnitPrice(row),
      lineTotal: getRowLineTotal(row),
    }));

    const supplierTotalsMap: Record<string, number> = {};

    safeRows.forEach((row) => {
      supplierTotalsMap[row.supplierName] =
        Number(supplierTotalsMap[row.supplierName] || 0) +
        Number(row.lineTotal || 0);
    });

    const supplierTotalsRows = Object.entries(supplierTotalsMap)
      .sort((a, b) => Number(a[1]) - Number(b[1]))
      .map(
        ([supplier, total], idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td>${supplier}</td>
            <td>£${Number(total || 0).toFixed(2)}</td>
          </tr>
        `
      )
      .join("");

    const rowsHtml = safeRows
      .map(
        (row) => `
          <tr>
            <td>${row.index}</td>
            <td>${row.ingredientName}</td>
            <td>${row.qty}</td>
            <td>${row.unit}</td>
            <td>${row.supplierName}</td>
            <td>£${row.unitPrice.toFixed(2)}</td>
            <td>£${row.lineTotal.toFixed(2)}</td>
          </tr>
        `
      )
      .join("");

    const html = `
      <html>
        <head>
          <title>Purchase Plan PDF</title>
          <style>
            * { box-sizing: border-box; }
            body {
              font-family: Arial, sans-serif;
              padding: 24px;
              color: #111827;
              line-height: 1.45;
            }
            h1 { margin: 0 0 8px 0; font-size: 24px; }
            h2 { margin: 28px 0 10px 0; font-size: 18px; }
            .sub { margin-bottom: 20px; color: #4b5563; font-size: 13px; }
            .summary {
              margin-bottom: 20px;
              padding: 14px 16px;
              border: 1px solid #d1d5db;
              border-radius: 10px;
              background: #f9fafb;
            }
            .summary div { margin: 6px 0; font-size: 14px; }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 12px;
            }
            th, td {
              border: 1px solid #d1d5db;
              padding: 10px;
              font-size: 13px;
              text-align: left;
              vertical-align: top;
            }
            th { background: #f3f4f6; }
            .section-gap { margin-top: 26px; }
            .footer-note {
              margin-top: 24px;
              font-size: 12px;
              color: #6b7280;
            }
            @media print {
              body { padding: 12px; }
              .summary { break-inside: avoid; }
              tr { break-inside: avoid; break-after: auto; }
            }
          </style>
        </head>
        <body>
          <h1>Purchase Plan</h1>
          <div class="sub">Generated from Catering Planner</div>

          <div class="summary">
            <div><strong>Optimized Total Cost:</strong> £${Number(
              optimizedTotalCost || 0
            ).toFixed(2)}</div>
            <div><strong>Total Event Savings:</strong> £${Number(
              totalEventSavings || 0
            ).toFixed(2)}</div>
            <div><strong>Best Supplier:</strong> ${bestSupplier?.name || "-"}</div>
            <div><strong>Best Supplier Saving:</strong> £${Number(
              bestSupplier?.saving || 0
            ).toFixed(2)}</div>
            <div><strong>Total Lines:</strong> ${safeRows.length}</div>
          </div>

          <h2>Supplier Totals</h2>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Supplier</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>${supplierTotalsRows}</tbody>
          </table>

          <h2 class="section-gap">Purchase Plan Details</h2>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Ingredient</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Supplier</th>
                <th>Unit Price</th>
                <th>Line Total</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>

          <div class="footer-note">
            This document was generated automatically from Catering Planner.
          </div>
        </body>
      </html>
    `;

    void saveAllSuppliersOrderLog({
      message: buildAllSuppliersMessage(),
      sentVia: "pdf",
    });

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  } catch (err) {
    console.error(err);
    alert("PDF export failed");
  }
}

async function handleExportSupplierPDF(supplier: string) {
  try {
    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      alert("Popup blocked. Please allow popups and try again.");
      return;
    }

    const grouped = groupPurchasePlanBySupplier();
    const rows = grouped[supplier] || [];

    if (rows.length === 0) {
      alert("No supplier rows found");
      return;
    }

    const total = rows.reduce((sum, row) => sum + getRowLineTotal(row), 0);

    const rowsHtml = rows
      .map(
        (row, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td>${getRowIngredient(row, idx)}</td>
            <td>${getRowQty(row)}</td>
            <td>${row.unit || ""}</td>
            <td>£${getRowUnitPrice(row).toFixed(2)}</td>
            <td>£${getRowLineTotal(row).toFixed(2)}</td>
          </tr>
        `
      )
      .join("");

    const html = `
      <html>
        <head>
          <title>${supplier} Order</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
            h1 { font-size: 24px; margin-bottom: 6px; }
            .sub { color: #6b7280; margin-bottom: 18px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td {
              border: 1px solid #d1d5db;
              padding: 10px;
              font-size: 13px;
              text-align: left;
            }
            th { background: #f3f4f6; }
            .total { margin-top: 18px; font-size: 16px; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Supplier Order</h1>
          <div class="sub">Supplier: ${supplier}</div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Ingredient</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Unit Price</th>
                <th>Line Total</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>

          <div class="total">Total: £${total.toFixed(2)}</div>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();

    await saveSupplierOrderLog({
      supplier,
      rows,
      total,
      message: buildSupplierMessages()[supplier] || "",
      sentVia: "pdf",
    });

    await logActivity({
      supplier,
      action: "pdf",
      message: "PDF exported",
    });
  } catch (err) {
    console.error("PDF export failed", err);
    alert("Supplier PDF export failed");
  }
}

async function logActivity({
  supplier,
  action,
  message,
}: {
  supplier: string;
  action: string;
  message: string;
}) {
  try {
    await addDoc(collection(db, "activity_logs"), {
      bossUid: auth.currentUser?.uid || null,
      eventId: id || null,
      supplier,
      action,
      message,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Logging failed", err);
  }
}

async function saveSupplierOrderLog({
  supplier,
  rows,
  total,
  message,
  sentVia,
}: {
  supplier: string;
  rows: PurchasePlanRow[];
  total: number;
  message: string;
  sentVia: SupplierOrderSentVia;
}) {
  try {
    await addDoc(collection(db, "supplier_orders"), {
      eventId: String(id || ""),
      supplier,
      rows: rows.map((row) => ({
        ingredientName: row?.ingredientName || "",
        qty: getRowQty(row),
        unit: row?.unit || "",
        supplierName: row?.supplierName || "",
        unitPrice: getRowUnitPrice(row),
        lineTotal: getRowLineTotal(row),
      })),
      total: Number(total || 0),
      message: message || "",
      sentVia,
      createdAt: serverTimestamp(),
    });
  } catch (err: any) {
    console.error("saveSupplierOrderLog failed:", err);
    alert(`Save failed: ${err?.message || "Unknown error"}`);
  }
}

async function saveAllSuppliersOrderLog({
  message,
  sentVia,
}: {
  message: string;
  sentVia: SupplierOrderSentVia;
}) {
  try {
    const rows = getPurchaseRows();

    await addDoc(collection(db, "supplier_orders"), {
      eventId: String(id || ""),
      supplier: "ALL_SUPPLIERS",
      rows: rows.map((row) => ({
        ingredientName: row?.ingredientName || "",
        qty: getRowQty(row),
        unit: row?.unit || "",
        supplierName: row?.supplierName || "",
        unitPrice: getRowUnitPrice(row),
        lineTotal: getRowLineTotal(row),
      })),
      total: Number(optimizedTotalCost || 0),
      message: message || "",
      sentVia,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("saveAllSuppliersOrderLog failed:", err);
  }
}
/* =======================
     UI states
  ======================= */

  const supplierTotalEntries = Object.entries(supplierTotals || {})
    .map(([name, total]) => ({
      name,
      total: Number(total || 0),
    }))
    .filter((item) => item.total > 0)
    .sort((a, b) => a.total - b.total);

  const cheapestSupplier = supplierTotalEntries[0]?.name || "";

  const cheapestGrandTotal: number = supplierTotalEntries[0]?.total || 0;

  const ingredientGrandTotal = ingredientSupplierRows.reduce((sum, row) => {
    const qty = Number(row.qty || 0);
    const price = Number(row.price || 0);
    return sum + qty * price;
  }, 0);

  const totalLabourCost = staffAssignmentsTotal;

  const cheapestSupplierByIngredient = ingredientSupplierRows.reduce<
    Record<string, { supplierName: string; price: number }>
  >((acc, row) => {
    const ingredientKey = (row.ingredientName || "").trim().toLowerCase();
    const supplierName = (row.supplierName || "").trim();
    const price = Number(row.price || 0);

    if (!ingredientKey || !supplierName || price <= 0) return acc;

    if (!acc[ingredientKey] || price < acc[ingredientKey].price) {
      acc[ingredientKey] = { supplierName, price };
    }

    return acc;
  }, {});

  const ingredientPriceSummary = ingredientSupplierRows.reduce<
    Record<
      string,
      {
        cheapestSupplier: string;
        cheapestPrice: number;
        highestPrice: number;
        savings: number;
      }
    >
  >((acc, row) => {
    const ingredientKey = (row.ingredientName || "").trim().toLowerCase();
    const supplierName = (row.supplierName || "").trim();
    const price = Number(row.price || 0);

    if (!ingredientKey || !supplierName || price <= 0) return acc;

    if (!acc[ingredientKey]) {
      acc[ingredientKey] = {
        cheapestSupplier: supplierName,
        cheapestPrice: price,
        highestPrice: price,
        savings: 0,
      };
    } else {
      if (price < acc[ingredientKey].cheapestPrice) {
        acc[ingredientKey].cheapestPrice = price;
        acc[ingredientKey].cheapestSupplier = supplierName;
      }

      if (price > acc[ingredientKey].highestPrice) {
        acc[ingredientKey].highestPrice = price;
      }

      acc[ingredientKey].savings =
        acc[ingredientKey].highestPrice - acc[ingredientKey].cheapestPrice;
    }

    return acc;
  }, {});

  async function handleExportExcel() {
    try {
      if (!bestPurchasePlan || bestPurchasePlan.length === 0) {
        alert("No data to export");
        return;
      }

      const data = bestPurchasePlan.map((row: any) => {
        const qty = Number(row.qty || 0);
        const unitPrice = Number(row.unitPrice ?? row.price ?? 0);
        const lineTotal = Number(row.lineTotal ?? qty * unitPrice);

        return {
          Ingredient: row.ingredientName || "-",
          Qty: qty,
          Unit: row.unit || "",
          Supplier: row.supplierName || "-",
          "Unit Price (£)": unitPrice,
          "Line Total (£)": lineTotal,
          "Saving (£)": Number(row.totalSaving || 0),
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(data);

      worksheet["!cols"] = [
        { wch: 22 },
        { wch: 10 },
        { wch: 10 },
        { wch: 18 },
        { wch: 15 },
        { wch: 15 },
        { wch: 12 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Purchase Plan");

      const summaryData = [
        {
          "Optimized Total Cost (£)": Number(optimizedTotalCost || 0),
          "Total Event Savings (£)": Number(totalEventSavings || 0),
          "Best Supplier": bestSupplier?.name || cheapestSupplier || "-",
          "Best Supplier Saving (£)": Number(bestSupplier?.saving || 0),
          "Cheapest Supplier Total (£)": Number(cheapestGrandTotal || 0),
          "Items in Plan": Array.isArray(bestPurchasePlan)
            ? bestPurchasePlan.length
            : 0,
        },
      ];

      const summarySheet = XLSX.utils.json_to_sheet(summaryData);

      summarySheet["!cols"] = [
        { wch: 24 },
        { wch: 24 },
        { wch: 22 },
        { wch: 24 },
        { wch: 24 },
        { wch: 14 },
      ];

      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

      XLSX.writeFile(workbook, "Purchase_Plan.xlsx");

      await logActivity({
        supplier: "ALL",
        action: "excel",
        message: "Excel exported",
      });
    } catch (err) {
      console.error(err);
      alert("Export failed");
    }
  }

  const profitMarginValue =
    currentRevenueTotal > 0
      ? ((currentRevenueTotal - currentCostTotal) / currentRevenueTotal) * 100
      : 0;

  const profitMarginClass =
    profitMarginValue < 10
      ? "text-red-600"
      : profitMarginValue < 20
      ? "text-amber-600"
      : "text-green-600";

  const profitMarginLabel =
    profitMarginValue < 10
      ? "Low Margin"
      : profitMarginValue < 20
      ? "Healthy Margin"
      : "Strong Margin";

  // ✅ STEP 5 — AUTH GUARD (FIRST)
  if (!authReady) {
    return (
      <div className="mx-auto w-full max-w-5xl p-6 text-sm text-neutral-600">
        Checking access…
      </div>
    );
  }

  if (authReady && !authorized) {
    return (
      <div className="mx-auto w-full max-w-3xl p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <div className="text-lg font-semibold text-red-800">
            Access not allowed
          </div>
          <div className="mt-2 text-sm text-red-700">
            You do not have permission to open this event.
          </div>
          <div className="mt-4">
            <Link
              href={getUnauthorizedRedirect(userRole)}
              className="inline-flex rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
            >
              Go back
            </Link>
          </div>
        </div>
      </div>
    );
  }

// ✅ THEN your existing loading

    if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl p-6 pt-20">
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <div className="text-lg font-semibold">Loading event…</div>
        </div>
      </div>
    );
  }

  const handleBlackCabBooking = () => {
  try {
    const payload = {
      eventId: String(id ?? ""),
      source: "event",
      sourcePath: `/events/${String(id ?? "")}`,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem("blackcab_event", JSON.stringify(payload));
    router.push("/blackcab");
  } catch (err) {
    console.error("BlackCab error:", err);
  }
};
  if (!eventData) {
    

    return (
      <div className="mx-auto w-full max-w-5xl p-6">
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <div className="text-xl font-semibold">Event Details</div>
          {error && <div className="mt-3 text-sm text-red-700">{error}</div>}

          <button
            type="button"
            onClick={() => router.push("/events")}
            className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  const ev = (eventData ?? { clientName: "" }) as EventData;
  const complete = eventData ? isComplete(ev) : false;
  const title = ev.clientName?.trim() ? ev.clientName : "Untitled Event";

  const ingredientSupplierTotals = ingredientSupplierRows.reduce(
    (acc, row) => {
      const supplier = (row.supplierName || "").trim();
      const price = Number(row.price || 0);

      if (!supplier) return acc;
      if (!Number.isFinite(price)) return acc;

      acc[supplier] = (acc[supplier] || 0) + price;
      return acc;
    },
    {} as Record<string, number>
  );
const supplierOptions = suppliers.map((s) => s.name).filter(Boolean);
  return (
    <div className="mx-auto min-h-screen w-full max-w-5xl bg-[#EAF4E2] p-6">
      {selectedIngredient && (
        <div className="mt-4 rounded-2xl border border-[#B7D3A8] bg-white p-5 shadow-[0_4px_14px_rgba(31,122,61,0.08)]">
          <div className="text-base font-semibold text-[#1F2937]">
            Selected Ingredient
          </div>

          <div className="mt-3">
            <label className="mb-1 block text-xs font-medium text-neutral-700">
              Item
            </label>
            <div className="rounded-lg border border-blue-200 bg-white px-3 py-2 font-medium text-neutral-900">
              {selectedIngredient.label}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-700">
                Qty
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={selectedIngredientQty}
                onChange={(e) => setSelectedIngredientQty(e.target.value)}
                placeholder="Qty"
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-700">
                Unit
              </label>
              <input
                type="text"
                value={selectedIngredientUnit}
                onChange={(e) => setSelectedIngredientUnit(e.target.value)}
                placeholder="Unit"
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => {
                if (!selectedIngredient || !selectedIngredientQty) return;

                setCostItems((prev: any[]) => {
                  const qtyToAdd = Number(selectedIngredientQty) || 0;
                  const unitToUse = selectedIngredientUnit || "kg";

                  const existingIndex = prev.findIndex(
                    (it: any) =>
                      it.ingredientId === selectedIngredient.value &&
                      (it.unit ?? "kg") === unitToUse
                  );

                  if (existingIndex >= 0) {
                    return prev.map((it: any, idx: number) =>
                      idx === existingIndex
                        ? {
                            ...it,
                            qty:
                              (Number(it.qty) || Number(it.amount) || 0) +
                              qtyToAdd,
                            amount:
                              (Number(it.amount) || Number(it.qty) || 0) +
                              qtyToAdd,
                          }
                        : it
                    );
                  }

                  return [
                    ...prev,
                    {
                      name: selectedIngredient.label,
                      amount: qtyToAdd,
                      qty: qtyToAdd,
                      unit: unitToUse,
                      ingredientId: selectedIngredient.value,
                    },
                  ];
                });

                setSelectedIngredient(null);
                setSelectedIngredientQty("");
                setSelectedIngredientUnit("kg");
              }}
              style={{
                display: "inline-block",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                padding: "10px 18px",
                borderRadius: "8px",
                border: "none",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              ADD INGREDIENT
            </button>
          </div>
        </div>
      )}
<div className="mt-6 rounded-2xl border border-[#B7D3A8] bg-white p-5 shadow-[0_4px_14px_rgba(31,122,61,0.08)]">
  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    <div>
      <div className="text-lg font-semibold text-[#1F2937]">
        Staff Planner
      </div>
      <div className="text-sm text-neutral-600">
        Assign event staff, working hours, and labour cost.
      </div>
    </div>

    <div className="rounded-xl bg-[#EAF4E2] px-4 py-2 text-sm font-semibold text-[#1F7A3D]">
      Total Labour Cost: £{Number(staffAssignmentsTotal || 0).toFixed(2)}
    </div>
  </div>

  <div className="mt-4 space-y-3">
    {staffAssignments.length === 0 ? (
      <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-5 text-sm text-neutral-500">
        No staff assigned yet.
      </div>
    ) : (
      staffAssignments.map((staff, index) => (
        <div
          key={`${staff.staffId || "staff"}-${index}`}
          className="grid grid-cols-1 gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 md:grid-cols-6"
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-700">
              Name
            </label>
            <input
              type="text"
              value={staff.name}
              onChange={(e) => {
                const value = e.target.value;
                setStaffAssignments((prev) =>
                  prev.map((row, i) =>
                    i === index ? { ...row, name: value } : row
                  )
                );
              }}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
              placeholder="Staff name"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-700">
              Role
            </label>
            <input
              type="text"
              value={staff.role}
              onChange={(e) => {
                const value = e.target.value;
                setStaffAssignments((prev) =>
                  prev.map((row, i) =>
                    i === index ? { ...row, role: value } : row
                  )
                );
              }}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
              placeholder="Chef / Helper / Server"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-700">
              Hourly Rate (£)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={staff.hourlyRate}
              onChange={(e) => {
                const hourlyRate = Number(e.target.value || 0);
                setStaffAssignments((prev) =>
                  prev.map((row, i) =>
                    i === index
                      ? {
                          ...row,
                          hourlyRate,
                          totalCost: hourlyRate * Number(row.hours || 0),
                        }
                      : row
                  )
                );
              }}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
              placeholder="0"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-700">
              Hours
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={staff.hours}
              onChange={(e) => {
                const hours = Number(e.target.value || 0);
                setStaffAssignments((prev) =>
                  prev.map((row, i) =>
                    i === index
                      ? {
                          ...row,
                          hours,
                          totalCost: Number(row.hourlyRate || 0) * hours,
                        }
                      : row
                  )
                );
              }}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
              placeholder="0"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-700">
              Total (£)
            </label>
            <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">
              £{Number(staff.totalCost || 0).toFixed(2)}
            </div>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setStaffAssignments((prev) =>
                  prev.filter((_, i) => i !== index)
                );
              }}
              className="w-full rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Remove
            </button>
          </div>
        </div>
      ))
    )}
  </div>

  <div className="mt-4 flex flex-wrap gap-3">
    <button
      type="button"
      onClick={() => {
        setStaffAssignments((prev) => [
          ...prev,
          {
            staffId: "",
            name: "",
            role: "",
            hourlyRate: 0,
            hours: 0,
            totalCost: 0,
          },
        ]);
      }}
      className="rounded-xl bg-[#1F7A3D] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
    >
      + Add Staff
    </button>
  </div>
</div>
      <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-4">
        <div className="flex items-center justify-between">
  <div className="text-lg font-semibold text-neutral-900">
    Supplier Names
  </div>

  <button
    type="button"
    onClick={addSupplierField}
    className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
  >
    + Add Supplier
  </button>
</div>

        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {supplierNames.map((name, idx) => (
            <div key={idx}>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Supplier {String.fromCharCode(65 + idx)}
              </label>
              <select
  value={name}
  onChange={(e) => {
  const selectedName = e.target.value;

  setSupplierNames((prev) => {
    const next = [...prev];
    next[idx] = selectedName;
    return next;
  });

  saveSuppliersToDB();

  const supplier = allSuppliers.find((s) => s.name === selectedName);

  if (supplier) {
    setSupplierLogistics((prev) => ({
      ...prev,
      [selectedName]: {
        minimumOrderQty: (supplier as any).minOrderQty || "",
        minimumOrderUnit: (supplier as any).minOrderUnit || "kg",
        transport: (supplier as any).transport || "Ex-premises",
        transportCost: (supplier as any).transportCost || "",
      },
    }));
  }
}}
  className="w-full rounded border px-3 py-2"
>
  <option value="">Select Supplier</option>
  {allSuppliers.map((s) => (
    <option key={s.id} value={s.name}>
      {s.name}
    </option>
  ))}
</select>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-4">
        <div className="text-lg font-semibold text-neutral-900">
          Supplier Logistics
        </div>

        <div className="mt-3 grid gap-4 md:grid-cols-3">
  {supplierNames
  .filter((name) => name && name !== "Select Supplier")
  .map((name, idx) => {
  const key = name?.trim() || `Supplier ${String.fromCharCode(65 + idx)}`;
  const data = supplierLogistics[key] || {
    minimumOrderQty: "",
    minimumOrderUnit: "kg",
    transport: "Ex-premises",
    transportCost: "",
  };

  return (
    <div key={idx} className="rounded-lg border border-neutral-200 p-3">
      <div className="mb-3 font-medium text-neutral-900">
        {name || `Supplier ${String.fromCharCode(65 + idx)}`}
      </div>

      <label className="mb-1 block text-sm text-neutral-700">
        Minimum Order Quantity
      </label>
      <input
        type="text"
        value={data.minimumOrderQty || ""}
        onChange={(e) =>
  updateSupplierLogistics(key, "minimumOrderQty", e.target.value)
}
        placeholder="e.g. 20 kg"
        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
      />

      <label className="mb-1 mt-3 block text-sm text-neutral-700">
        Minimum Order Unit
      </label>
      <input
        type="text"
        value={data.minimumOrderUnit || "kg"}
        onChange={(e) =>
  updateSupplierLogistics(key, "minimumOrderUnit", e.target.value)
}
        placeholder="e.g. kg"
        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
      />

      <label className="mb-1 mt-3 block text-sm text-neutral-700">
        Transport
      </label>
      <select
        value={data.transport || "Ex-premises"}
        onChange={(e) =>
  updateSupplierLogistics(key, "transport", e.target.value)
}
        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
      >
        <option value="Ex-premises">Ex-premises</option>
        <option value="Included">Transport Included</option>
      </select>

      <label className="mb-1 mt-3 block text-sm text-neutral-700">
        Transport Cost
      </label>
      <input
        type="text"
        value={data.transportCost || ""}
        onChange={(e) =>
  updateSupplierLogistics(key, "transportCost", e.target.value)
}
        placeholder="e.g. 50"
        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
      />
    </div>
  );
})}
</div>
</div>

<div className="mt-4 rounded-xl border border-neutral-200 bg-white p-4">
  <div className="text-base font-semibold text-neutral-900">
    Ingredient Browser
  </div>

  <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4">
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="text-lg font-semibold text-neutral-900">
          Ingredient Supplier Pricing
        </div>
        <div className="mt-1 text-sm text-neutral-600">
          Please use Smart Preview below to enter supplier prices and save them for this event.
        </div>
      </div>

      <button
        type="button"
        onClick={saveAll}
        className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
      >
        💾 Save Ingredients
      </button>
    </div>

    <div className="mt-4 flex justify-end">
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-right">
        <div className="text-xs font-medium text-neutral-500">Grand Total</div>
        <div className="text-lg font-bold text-green-600">
          £ {Number(ingredientGrandTotal || 0).toFixed(2)}
        </div>
      </div>
    </div>

    <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-4">
      <div className="text-sm font-semibold text-neutral-900">
        Supplier Totals (Auto Calculated)
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        {(() => {
  const entries = supplierNames
    .filter((supplier) => supplier && supplier !== "Select Supplier")
    .map((supplier, idx) => {
      const label = supplier?.trim() || `Supplier ${idx + 1}`;
      const total = Number(ingredientSupplierTotals?.[label] || 0);
      return { label, total };
    });

  return entries.map(({ label, total }, idx) => (
    <div key={idx}>
      {/* your UI block here */}
      {label} - £{total.toFixed(2)}
    </div>
  ));
})()}
      </div>
    </div>

<div className="mt-3 grid gap-3 md:grid-cols-2">
  <div>
    <label className="mb-1 block text-sm font-medium text-neutral-700">
      Category
    </label>
    <select
      value={ingredientCategoryFilter}
      onChange={(e) => setIngredientCategoryFilter(e.target.value)}
      className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
    >
      {ingredientCategories.map((cat) => (
        <option key={cat} value={cat}>
          {cat}
        </option>
      ))}
    </select>
  </div>

  <div>
    <label className="mb-1 block text-sm font-medium text-neutral-700">
      Search
    </label>
    <input
      value={ingredientSearch}
      onChange={(e) => setIngredientSearch(e.target.value)}
      placeholder="Search ingredient..."
      className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm outline-none transition placeholder:text-neutral-400 focus:border-green-500 focus:ring-2 focus:ring-green-100"
    />
  </div>
</div>

  <div className="mt-4 rounded-2xl border border-green-200 bg-linear-to-br from-green-50 to-emerald-50 p-4 shadow-sm">
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className="text-base font-semibold text-green-900">
          Added Ingredients
        </div>
        <div className="text-xs text-green-700">
          Combined ingredient quantities from your current cost items
        </div>
      </div>

      <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-green-800 shadow-sm">
        {(() => {
          const ingredientRows = costItems.filter((it: any) => it.ingredientId);

          const mergedItems = Object.values(
            ingredientRows.reduce((acc: Record<string, any>, it: any) => {
              const unit = it.unit ?? "kg";
              const key = `${it.ingredientId}__${unit}`;
              const qty = Number(it.qty ?? it.amount ?? 0) || 0;

              if (!acc[key]) {
                acc[key] = {
                  name: it.name,
                  ingredientId: it.ingredientId,
                  unit,
                  qty,
                };
              } else {
                acc[key].qty += qty;
              }

              return acc;
            }, {})
          );

          return `${mergedItems.length} item${mergedItems.length === 1 ? "" : "s"}`;
        })()}
      </div>
    </div>

    {(() => {
      const ingredientRows = costItems.filter((it: any) => it.ingredientId);

      const mergedItems = Object.values(
        ingredientRows.reduce((acc: Record<string, any>, it: any) => {
          const unit = it.unit ?? "kg";
          const key = `${it.ingredientId}__${unit}`;
          const qty = Number(it.qty ?? it.amount ?? 0) || 0;

          if (!acc[key]) {
            acc[key] = {
              name: it.name,
              ingredientId: it.ingredientId,
              unit,
              qty,
            };
          } else {
            acc[key].qty += qty;
          }

          return acc;
        }, {})
      );

      return mergedItems.length === 0 ? (
        <div className="mt-3 rounded-xl border border-dashed border-green-300 bg-white/70 px-4 py-4 text-sm text-green-800">
          No ingredients added yet.
        </div>
      ) : (
        <div className="mt-3 grid gap-2">
          {mergedItems.map((it: any, idx: number) => (
            <div
              key={`${it.ingredientId}-${it.unit}-${idx}`}
              className="flex items-center justify-between rounded-xl border border-green-200 bg-white px-3 py-2.5 text-sm shadow-sm"
            >
              <div className="min-w-0">
                <div className="truncate font-medium text-neutral-900">
                  {it.name}
                </div>
                <div className="text-xs text-neutral-500">
                  Ingredient ID: {it.ingredientId || "—"}
                </div>
              </div>

              <div className="ml-3 shrink-0 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-900">
                Qty: {it.qty} {it.unit}
              </div>
            </div>
          ))}
        </div>
      );
    })()}
  </div>

  <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-4">
    <div className="text-base font-semibold text-neutral-900">
      Supplier Price Entry (Smart Preview)
    </div>

    {(() => {
      const ingredientRows = costItems.filter((it: any) => it.ingredientId);

      const mergedItems = Object.values(
        ingredientRows.reduce((acc: Record<string, any>, it: any) => {
          const unit = it.unit ?? "kg";
          const key = `${it.ingredientId}__${unit}`;
          const qty = Number(it.qty ?? it.amount ?? 0) || 0;

          const parts = (it.name ?? "").split(" - ");
          const ingredientName = parts[0] ?? it.name;
          const specFromName = parts[1] ?? "";

          if (!acc[key]) {
            acc[key] = {
              name: ingredientName,
              ingredientId: it.ingredientId,
              unit,
              qty,
              spec: it.spec ?? it.grade ?? specFromName ?? "—",
              brand: it.brand ?? "—",
              packaging: it.packaging ?? "—",
            };
          } else {
            acc[key].qty += qty;
          }

          return acc;
        }, {})
      );

      return mergedItems.length === 0 ? (
        <div className="mt-2 text-sm text-neutral-500">
          No ingredients to price
        </div>
      ) : (
        <>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full border border-neutral-200 text-sm">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-3 py-2 text-left">Ingredient</th>
                  <th className="px-3 py-2 text-left">Spec</th>
                  <th className="px-3 py-2 text-left">Brand</th>
                  <th className="px-3 py-2 text-left">Packaging</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2 text-left">Unit</th>
                  <th className="px-3 py-2 text-right">
                    {supplierNames[0] || "Supplier A"}
                  </th>
                  <th className="px-3 py-2 text-right">
                    {supplierNames[1] || "Supplier B"}
                  </th>
                  <th className="px-3 py-2 text-right">
                    {supplierNames[2] || "Supplier C"}
                  </th>
                </tr>
              </thead>

              <tbody>
                {mergedItems.map((it: any, idx: number) => {
                  const ingredientKey =
                    typeof it.name === "string" && it.name.trim()
                      ? it.name
                      : `Item ${idx + 1}`;

                  const rowPrices =
                    supplierPrices[ingredientKey] || [
                      undefined,
                      undefined,
                      undefined,
                      undefined,
                      undefined,
                    ];

                  const numericPrices = rowPrices.map((p) => Number(p) || 0);
                  const positivePrices = numericPrices.filter((p) => p > 0);
                  const cheapestValue =
                    positivePrices.length > 0 ? Math.min(...positivePrices) : 0;
const cheapestSupplierIndex = numericPrices.findIndex(
  (p) => p > 0 && p === cheapestValue
);
                  return (
                    <tr key={`${it.ingredientId}-${it.unit}-${idx}`} className="border-t">
                      <td className="px-3 py-2">{it.name}</td>
                      <td className="px-3 py-2">{it.spec}</td>
                      <td className="px-3 py-2">{it.brand}</td>
                      <td className="px-3 py-2">{it.packaging}</td>
                      <td className="px-3 py-2 text-right">{it.qty}</td>
                      <td className="px-3 py-2">{it.unit}</td>

                      {[0, 1, 2].map((supplierIndex) => (
  <td
    key={supplierIndex}
    className="px-3 py-2 text-right whitespace-nowrap"
  >
    <div className="inline-flex items-center gap-1 whitespace-nowrap">
      <span className="text-sm text-neutral-500">£</span>

      <input
        type="number"
        placeholder="0.00"
        value={supplierPrices[ingredientKey]?.[supplierIndex] ?? ""}
        onChange={(e) => {
          const val = e.target.value;

          setSupplierPrices((prev) => {
            const current = prev[ingredientKey] || [
              undefined,
              undefined,
              undefined,
              undefined,
              undefined,
            ];

            const next = [...current];
            next[supplierIndex] =
              val === "" ? undefined : Number(val);

            return {
              ...prev,
              [ingredientKey]: next,
            };
          });
        }}
        className={`w-20 rounded border px-2 py-1 text-right text-sm ${
          numericPrices[supplierIndex] > 0 &&
          numericPrices[supplierIndex] === cheapestValue
            ? "border-green-500 bg-green-100"
            : "border-neutral-300"
        }`}
      />

      {cheapestSupplierIndex === supplierIndex && (
        <span className="rounded-full bg-green-600 px-2 py-0.5 text-xs font-semibold text-white">
          Best
        </span>
      )}
    </div>
  </td>
))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
            <div className="mb-2 text-base font-semibold text-green-900">
              Supplier Grand Totals
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                    Best Supplier
                  </div>
                  <div className="mt-2 text-lg font-bold text-amber-900">
                    {bestSupplier?.name || "-"}
                  </div>
                  <div className="mt-1 text-xs text-amber-700">
                    Highest total saving: £
                    {Number(bestSupplier?.saving || 0).toFixed(2)}
                  </div>
                </div>

                <div className="text-2xl">🥇</div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleExportExcel}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                📥 Download Purchase Plan (Excel)
              </button>

              <button
  type="button"
  onClick={handleCopySupplierOrder}
  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
>
  📋 Copy Supplier Order
</button>

<button
  type="button"
  onClick={handleSendToSupplier}
  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700"
>
  📲 Send to Supplier
</button>
<button
  type="button"
  onClick={handleCopyComparisonSummary}
  className="inline-flex items-center gap-2 rounded-xl bg-slate-700 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
>
  📊 Copy Comparison Summary
</button>
<button
  type="button"
  onClick={handleSendToWhatsApp}
  className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700"
>
  💬 WhatsApp Supplier
</button>

<button
  type="button"
  onClick={handleWhatsAppAllInOne}
  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
>
  📲 WhatsApp All (One Message)
</button>

<button
  type="button"
  onClick={handleWhatsAppAllSuppliers}
  className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800"
>
  🚀 WhatsApp All Suppliers
</button>
           <Link
  href="/blackcab"
  className="inline-flex items-center gap-2 rounded-xl border border-yellow-300 bg-yellow-50 px-5 py-2 text-sm font-semibold text-yellow-800 transition hover:bg-yellow-100"
>
  🚕 BlackCab
</Link> 
              <button
  type="button"
  onClick={handleExportPDF}
  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-600"
>
  🧾 Export PDF
</button>

            
</div>

<button
  type="button"
  onClick={handleBlackCabBooking}
  className="block mt-5 w-full text-left"
>
  <div className="relative overflow-hidden rounded-2xl border border-yellow-400 bg-linear-to-r from-neutral-900 via-neutral-800 to-black p-5 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl">
    <div className="absolute right-3 top-3 rounded-md bg-yellow-200 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-neutral-900">
      Coming Soon
    </div>

    <div className="flex items-start gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-400 text-2xl shadow">
        🚕
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-lg font-extrabold tracking-tight text-white">
          Book Black Cab for This Event
        </div>

        <p className="mt-1 text-sm leading-6 text-yellow-100">
          Prepare event-based transport details and continue to the Black Cab page.
        </p>

        <div className="mt-3 inline-flex items-center rounded-lg bg-yellow-400 px-3 py-2 text-sm font-bold text-neutral-900">
          Open Black Cab Booking
        </div>
      </div>
    </div>
  </div>
</button>

<div className="mt-4 space-y-2"></div>
            <div className="mt-4 space-y-2">
  <div className="font-semibold">Supplier Phone Numbers</div>

  {supplierNames.map((name, idx) => (
    <div key={idx} className="flex items-center gap-2">
      <div className="w-20 text-sm">{name}</div>

      <input
        type="text"
        placeholder="e.g. 447700900123"
        value={supplierPhones[idx] || ""}
        onChange={(e) => {
          const updated = [...supplierPhones];
          updated[idx] = e.target.value.replace(/\D/g, "");
          setSupplierPhones(updated);
        }}
        className="border rounded px-2 py-1 text-sm w-48"
      />
    </div>
  ))}
</div>
<div className="mt-6 space-y-4">
  {Object.entries(buildSupplierMessages()).map(([supplier, message]) => (
    <div key={supplier} className="rounded-xl border p-4 bg-white shadow-sm">
      
      {/* Supplier Name */}
      <div className="text-lg font-semibold mb-2">
        {supplier}
      </div>

      {/* ✅ MESSAGE PREVIEW */}
      <pre className="text-sm bg-gray-50 border p-3 rounded-lg whitespace-pre-wrap mb-3 max-h-60 overflow-auto">
        {message}
      </pre>

      {/* Buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => handleCopySupplierMessage(supplier)}
          className="rounded-lg bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
        >
          Copy
        </button>

        <button
          type="button"
          onClick={() => handleWhatsAppSupplier(supplier)}
          className="rounded-lg bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
        >
          WhatsApp
        </button>
        <button
  type="button"
  onClick={() => handleExportSupplierPDF(supplier)}
  className="rounded-lg bg-amber-500 px-3 py-1 text-sm text-white hover:bg-amber-600"
>
  PDF
</button>
      </div>

    </div>
  ))}
</div>
            {(() => {
              const positiveTotals = supplierTotals
                .map((total, i) => ({
                  total: Number(total || 0),
                  i,
                  label: supplierNames[i] || `Supplier ${String.fromCharCode(65 + i)}`,
                }))
                .filter((item) => item.total > 0);

              if (positiveTotals.length === 0) return null;

              const best = positiveTotals.reduce((prev, curr) =>
                curr.total < prev.total ? curr : prev
              );

              const worst = positiveTotals.reduce((prev, curr) =>
                curr.total > prev.total ? curr : prev
              );

              const saving = worst.total - best.total;

              return (
                <div className="mt-4 rounded-xl border border-green-300 bg-white px-4 py-3">
                  <div className="text-sm font-semibold text-green-900">
                    ✅ Best Supplier for This Event
                  </div>

                  <div className="mt-1 text-sm text-neutral-800">
                    {best.label} — £{best.total.toFixed(2)}
                  </div>

                  <div className="mt-1 text-xs text-neutral-600">
                    You save £{saving.toFixed(2)} vs the most expensive supplier
                  </div>
                </div>
              );
            })()}
          </div>
        </>
      );
    })()}
  </div>

  <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-4 text-sm">
    <div className="font-semibold text-neutral-900">Store Check Test</div>

    <div className="mt-3 space-y-1 text-sm text-neutral-700">
      {storeCheckResults.map((it) => (
        <div key={it.name}>
          {it.name} | Need: {it.requiredQty} | Store: {it.stockQty} | Buy:{" "}
          {it.buyNow} |{" "}
          {it.balance < 0
            ? `Shortage: ${Math.abs(it.balance)}`
            : `Balance: ${it.balance}`}
        </div>
      ))}
    </div>
  </div>
</div>

{voiceMsg && (
  <div className="mb-3 rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm shadow-sm">
    {voiceMsg}
  </div>
)}

<div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-4">
  <h3 className="text-base font-semibold text-brand-blue">
    Menu Selection
  </h3>

  <div className="mt-3 flex flex-wrap gap-2">
    {presetMenus.map((preset) => (
      <button
        key={preset.key}
        type="button"
        onClick={() => {
          if (locked) return;
          setSelectedDishes(preset.items);
        }}
        className="rounded-xl border border-amber-400 bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-200"
      >
        {preset.name}
      </button>
    ))}
  </div>

  <div className="mt-3">
    <div className="mb-2 text-xs font-semibold text-neutral-500">
      Quick Presets
    </div>

    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => {
          if (locked) return;
          setSelectedPreset("wedding");
          setSelectedDishes(menuPresets.wedding);
        }}
        className={`rounded-xl border px-3 py-2 text-sm ${
          selectedPreset === "wedding"
            ? "border-blue-500 bg-blue-50"
            : "border-neutral-300 bg-white"
        } ${locked ? "cursor-not-allowed opacity-60" : ""}`}
      >
        Wedding
      </button>

      <button
        type="button"
        onClick={() => {
          if (locked) return;
          setSelectedPreset("budget");
          setSelectedDishes(menuPresets.budget);
        }}
        className={`rounded-xl border px-3 py-2 text-sm ${
          selectedPreset === "budget"
            ? "border-blue-500 bg-blue-50"
            : "border-neutral-300 bg-white"
        } ${locked ? "cursor-not-allowed opacity-60" : ""}`}
      >
        Budget
      </button>

      <button
        type="button"
        onClick={() => {
          if (locked) return;
          setSelectedPreset("corporate");
          setSelectedDishes(menuPresets.corporate);
        }}
        className={`rounded-xl border px-3 py-2 text-sm ${
          selectedPreset === "corporate"
            ? "border-blue-500 bg-blue-50"
            : "border-neutral-300 bg-white"
        } ${locked ? "cursor-not-allowed opacity-60" : ""}`}
      >
        Corporate
      </button>

      <button
        type="button"
        onClick={() => {
          if (locked) return;
          setSelectedPreset("");
          setSelectedDishes([]);
        }}
        className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm"
      >
        Clear
      </button>
      
    </div>
  </div>

  <div className="mt-3 space-y-3">
    <div>
      <div className="mb-1 text-xs font-semibold text-neutral-500">Rice</div>
      <div className="flex flex-wrap gap-2">
        {[
          { key: "kacchi_biryani", label: "Kacchi Biryani" },
          { key: "plain_polao", label: "Plain Polao" },
        ].map((item) => {
          const selected = selectedDishes.includes(item.key);

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                if (locked) return;
                setSelectedDishes((prev) =>
                  prev.includes(item.key)
                    ? prev.filter((d) => d !== item.key)
                    : [...prev, item.key]
                );
              }}
              className={`rounded-xl border px-3 py-2 text-sm ${
                selected
                  ? "border-green-500 bg-green-50"
                  : "border-neutral-300 bg-white"
              } ${locked ? "cursor-not-allowed opacity-60" : ""}`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>

  {/* MEAT */}
  <div>
    <div className="text-xs font-semibold text-neutral-500 mb-1">Meat</div>
    <div className="flex flex-wrap gap-2">
      {[
        { key: "chicken_roast", label: "Chicken Roast" },
        { key: "beef_rezala", label: "Beef Rezala" }
      ].map((item) => {
        const selected = selectedDishes.includes(item.key);

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => {
              if (locked) return;
              setSelectedDishes((prev) =>
                prev.includes(item.key)
                  ? prev.filter((d) => d !== item.key)
                  : [...prev, item.key]
              );
            }}
            className={`rounded-xl border px-3 py-2 text-sm ${
              selected
                ? "border-green-500 bg-green-50"
                : "border-neutral-300 bg-white"
            } ${locked ? "cursor-not-allowed opacity-60" : ""}`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  </div>

  {/* DRINKS */}
  <div>
    <div className="text-xs font-semibold text-neutral-500 mb-1">Drinks</div>
    <div className="flex flex-wrap gap-2">
      {[
        { key: "borhani", label: "Borhani" }
      ].map((item) => {
        const selected = selectedDishes.includes(item.key);

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => {
              if (locked) return;
              setSelectedDishes((prev) =>
                prev.includes(item.key)
                  ? prev.filter((d) => d !== item.key)
                  : [...prev, item.key]
              );
            }}
            className={`rounded-xl border px-3 py-2 text-sm ${
              selected
                ? "border-green-500 bg-green-50"
                : "border-neutral-300 bg-white"
            } ${locked ? "cursor-not-allowed opacity-60" : ""}`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  </div>

</div>
  <div className="mt-3 text-sm text-neutral-700">
    Estimated Food Cost:{" "}
    <span className="font-semibold">£{totalMenuCost.toFixed(2)}</span>
  </div>
</div>

{/* SUPPLIER SETUP */}
<div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-4">
  <h3 className="text-base font-semibold text-neutral-900">
    Supplier Setup
  </h3>

  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
    {supplierNames.map((name, i) => {
      const label = name?.trim() || `Supplier ${i + 1}`;
      
      return (
        <div key={i}>
          <label className="mb-1 block text-xs font-medium text-neutral-600">
            {label}
          </label>

          <input
            type="text"
            value={name}
            onChange={(e) => updateSupplierName(i, e.target.value)}
            placeholder="Enter supplier name"
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
          />
        </div>
      );
    })}
  </div>
</div>

<div className="mt-6 overflow-x-auto rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
    <h3 className="text-base font-semibold text-neutral-900">
      Supplier Price Comparison
    </h3>
    <div className="text-xs text-neutral-500">
      Compare supplier pricing by ingredient and spot the best option quickly
    </div>
  </div>

  {(() => {
    const activeSupplierIndexes = supplierNames
      .map((name, i) => {
        const hasName = !!(name && name.trim() !== "");
        const total = Number(supplierTotals[i] || 0);

        return {
          i,
          isActive: hasName || total > 0,
        };
      })
      .filter((x) => x.isActive)
      .map((x) => x.i);

    return (
      <table className="mt-4 min-w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase">
            <th className="px-3 py-2 text-left font-semibold text-neutral-700">
              Ingredient
            </th>
            <th className="px-3 py-2 text-left font-semibold text-neutral-700">
              Qty
            </th>
            <th className="px-3 py-2 text-left font-semibold text-neutral-700">
              Unit
            </th>

            {activeSupplierIndexes.map((i) => {
              const isBest = i === bestSupplierIndex;

              return (
                <th
                  key={i}
                  className={`px-3 py-2 text-left font-semibold ${
                    isBest ? "bg-green-100 text-green-800" : "text-neutral-700"
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span>{getSupplierBadge(i)}</span>
                      <span>{supplierNames[i] || `Supplier ${i + 1}`}</span>

                      {isBest && (
                        <span className="rounded-full bg-green-200 px-2 py-0.5 text-[10px] font-bold uppercase text-green-800">
                          Best
                        </span>
                      )}
                    </div>

                    <span className="text-xs font-normal text-neutral-600">
                      £{Number(supplierTotals[i] || 0).toFixed(2)}
                    </span>
                  </div>
                </th>
              );
            })}

            <th className="px-3 py-2 text-right font-semibold text-neutral-700">
              Saving
            </th>
          </tr>
        </thead>

        <tbody>
          {(Array.isArray(storeCheckResults) ? storeCheckResults : []).map(
            (item: any, rowIndex: number) => {
              const ingredientName =
                item.item ||
                item.name ||
                item.ingredient ||
                item.label ||
                `Item ${rowIndex + 1}`;

              const ingredientKey = ingredientName;
              const rowPrices = supplierPrices[ingredientKey] || [0, 0, 0, 0, 0];

              const activePrices = activeSupplierIndexes.map(
                (i) => Number(rowPrices[i]) || 0
              );

              const positiveActivePrices = activePrices.filter((p) => p > 0);
              const cheapestActivePrice =
                positiveActivePrices.length > 0
                  ? Math.min(...positiveActivePrices)
                  : 0;
              const highestActivePrice =
                positiveActivePrices.length > 0
                  ? Math.max(...positiveActivePrices)
                  : 0;

              return (
                <tr
                  key={ingredientKey + rowIndex}
                  className="border-b border-neutral-100"
                >
                  <td className="px-3 py-2 text-neutral-800">
                    {ingredientName}
                  </td>

                  <td className="px-3 py-2 text-neutral-800">
                    {parseNum(item.buyNow || item.required || 0)}
                  </td>

                  <td className="px-3 py-2 text-neutral-800">
                    {item.unit || "-"}
                  </td>

                  {activeSupplierIndexes.map((i) => {
                    const price = rowPrices[i];
                    const numericPrice = Number(price) || 0;
                    const isCheapest =
                      numericPrice > 0 && numericPrice === cheapestActivePrice;

                    return (
                      <td
                        key={i}
                        className={`px-3 py-2 transition-colors ${
                          isCheapest ? "bg-green-100" : ""
                        } ${i === bestSupplierIndex ? "bg-green-50" : ""}`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={price ?? ""}
                            onChange={(e) =>
                              updateSupplierPrice(
                                ingredientKey,
                                i,
                                e.target.value
                              )
                            }
                            placeholder="0.00"
                            className={`w-24 rounded-xl border px-2.5 py-1.5 text-sm text-neutral-900 shadow-sm outline-none transition focus:ring-2 focus:ring-green-100 ${
                              isCheapest
                                ? "border-green-500 bg-green-50 focus:border-green-600"
                                : "border-neutral-300 bg-white focus:border-neutral-500"
                            }`}
                          />

                          {isCheapest && (
                            <span className="rounded-full bg-green-200 px-2 py-0.5 text-[10px] font-bold uppercase text-green-800">
                              Best
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}

                  <td className="px-3 py-2 text-right">
                    {cheapestActivePrice > 0 && highestActivePrice > cheapestActivePrice ? (
                      <span className="inline-block rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                        Saved £
                        {(
                          (highestActivePrice - cheapestActivePrice) *
                          Number(item.buyNow || item.required || 0)
                        ).toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-xs text-neutral-400">—</span>
                    )}
                  </td>
                </tr>
              );
            }
          )}
        </tbody>
      </table>
    );
  })()}
</div>


{/* Store Check Results */}
<div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5">
  <h3 className="text-lg font-semibold text-neutral-900">
    Store Check Results
  </h3>

  <div className="mt-4 overflow-x-auto">
    <table className="min-w-full border border-neutral-200 text-sm">
      <thead className="bg-neutral-50">
        <tr>
          <th className="px-3 py-2 text-left">Item</th>
          <th className="px-3 py-2 text-right">Required</th>
          <th className="px-3 py-2 text-right">In Stock</th>
          <th className="px-3 py-2 text-right">Balance</th>
          <th className="px-3 py-2 text-right">Buy Now</th>
          <th className="px-3 py-2 text-left">Unit</th>
        </tr>
      </thead>

      <tbody>
        {(Array.isArray(storeCheckResults) ? storeCheckResults : []).map(
          (row: any, i: number) => (
            <tr
              key={(row.name || "item") + i}
              className="border-t border-neutral-200"
            >
              <td className="px-3 py-2 text-left">{row.name || "-"}</td>

              <td className="px-3 py-2 text-right">
                {parseNum(row.requiredQty || 0)}
              </td>

              <td className="px-3 py-2 text-right">
                {parseNum(row.stockQty || 0)}
              </td>

              <td className="px-3 py-2 text-right">
                {parseNum(row.balance || 0)}
              </td>

              <td className="px-3 py-2 text-right font-semibold text-red-600">
                {parseNum(row.buyNow || 0)}
              </td>

              <td className="px-3 py-2 text-left">{row.unit || "-"}</td>
            </tr>
          )
        )}
      </tbody>
    </table>
  </div>
</div>

{/* Purchase List */}
<div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5">
  <h3 className="text-lg font-semibold text-neutral-900">
    Purchase List
  </h3>

  <div className="mt-4 overflow-x-auto">
    <table className="min-w-full border border-neutral-200 text-sm">
      <thead className="bg-neutral-50">
        <tr>
          <th className="px-3 py-2 text-left">Item</th>
          <th className="px-3 py-2 text-right">Qty</th>
          <th className="px-3 py-2 text-left">Unit</th>
          <th className="px-3 py-2 text-left">Supplier</th>
          <th className="px-3 py-2 text-right">Price</th>
        </tr>
      </thead>

      <tbody>
        {purchaseList.length === 0 ? (
          <tr>
            <td
              colSpan={5}
              className="px-3 py-4 text-center text-neutral-500"
            >
              No items need to be purchased.
            </td>
          </tr>
        ) : (
          purchaseList.map((row, i) => {
            return (
              <tr
                key={row.name + i}
                className="border-t border-neutral-200"
              >
                <td className="px-3 py-2">{row.name}</td>
                <td className="px-3 py-2 text-right">{row.buyNow}</td>
                <td className="px-3 py-2">{row.unit}</td>
                <td className="px-3 py-2">{row.supplier || "No supplier"}</td>
                <td className="px-3 py-2 text-right">
                  {Number(row.price || 0).toLocaleString()}
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  </div>
</div>

<div className="mt-6 grid gap-4 lg:grid-cols-[1.6fr_0.9fr]">
  <div className="rounded-xl border border-neutral-200 bg-white p-4">
    <div className="mb-3 text-sm font-semibold text-neutral-800">
      Supplier Totals
    </div>

    <div className="space-y-2">
      {supplierNames.filter(Boolean).map((supplier, i) => {
        const label = supplier?.trim() || `Supplier ${i + 1}`;
        const cheapest = cheapestSupplier === label;
        const safeTotal = Number(
  ingredientSupplierTotals?.[label] ??
    (!Array.isArray(supplierTotals)
      ? (supplierTotals as Record<string, number>)?.[label]
      : supplierTotals[i]) ??
    0
);
        const isCheapest = label === cheapestSupplier;

        return (
  <div
    key={label}
    className={`flex justify-between rounded-lg border px-3 py-2 text-sm ${
      isCheapest
        ? "border-green-500 bg-green-50 font-bold text-green-800"
        : "border-neutral-200 bg-neutral-50 text-neutral-700"
    }`}
  >
    <div className="flex items-center gap-2">
      <span>{label}</span>
      {isCheapest && (
        <span className="rounded-full bg-green-600 px-2 py-0.5 text-xs font-semibold text-white">
          Cheapest
        </span>
      )}
    </div>

    <span>£{safeTotal.toFixed(2)}</span>
  </div>
);
      })}
    </div>
  </div>

  <div className="rounded-xl border border-neutral-200 bg-white p-4">
    <div className="mb-3 text-sm font-semibold text-neutral-800">
      Ingredient Price Summary
    </div>

    <div className="space-y-2">
      {!bestPurchasePlan || bestPurchasePlan.length === 0 ? (
        <div className="text-sm text-neutral-500">
          No ingredient comparison yet.
        </div>
      ) : (
        bestPurchasePlan.map((row: any, idx: number) => {
          const lineTotal = Number(row?.lineTotal || 0);
          const rowSaving = Number(row?.saving || 0);

          return (
            <div
              key={`${row?.ingredientName || "item"}-${idx}`}
              className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 text-sm"
            >
              <div>
                <div className="font-semibold capitalize text-neutral-800">
                  {row?.ingredientName || `Item ${idx + 1}`}
                </div>
                <div className="text-xs text-neutral-500">
                  Cheapest: {row?.supplierName || "-"}
                </div>
              </div>

              <div className="text-right">
                <div className="font-bold text-green-700">
                  £{lineTotal.toFixed(2)}
                </div>
                <div className="text-xs font-medium text-amber-600">
                  Save £{rowSaving.toFixed(2)}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  </div>
</div>

<div className="rounded-xl border border-green-300 bg-green-50 px-4 py-2 text-sm font-semibold text-green-800">
  Total Purchase Cost: £{" "}
  {Number(optimizedTotalCost || 0).toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}
</div>
</div>

<div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-4">
  <h3 className="text-base font-semibold text-neutral-900">
    Total Comparison
  </h3>

  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
    {supplierTotals
      .map((total, i) => ({
        total,
        i,
        name: supplierNames[i] || `Supplier ${i + 1}`,
      }))
      .filter((item) => Number(item.total || 0) > 0)
      .map(({ total, i, name }) => {
        const positiveTotals = supplierTotals
  .map((t) => Number(t || 0))
  .filter((t) => t > 0);

const minTotal =
  positiveTotals.length > 0 ? Math.min(...positiveTotals) : 0;

const maxTotal =
  positiveTotals.length > 0 ? Math.max(...positiveTotals) : 0;

const isBest = Number(total) > 0 && Number(total) === minTotal;

// ✅ NEW
const savingVsWorst =
  maxTotal > minTotal ? maxTotal - minTotal : 0;

return (
  <div
    key={i}
    className={`rounded-xl border p-4 ${
      isBest
        ? "border-green-500 bg-green-50"
        : "border-neutral-200 bg-neutral-50"
    }`}
  >
    <div className="text-sm font-medium text-neutral-700">
      {name}
    </div>

    <div className="mt-2 text-lg font-bold text-neutral-900">
      £ {Number(total || 0).toFixed(2)}
    </div>

    {isBest && (
      <>
        <div className="mt-2 text-xs font-semibold text-green-700">
          Best Overall
        </div>

        {savingVsWorst > 0 && (
          <div className="mt-1 text-xs text-green-800">
            Save £ {savingVsWorst.toFixed(2)} vs worst
          </div>
        )}
      </>
    )}
  </div>
);
})}
</div>

  
</div>

<div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-4">
  <h3 className="text-base font-semibold text-neutral-900">
    Best Purchase Plan
  </h3>
  <div className="mt-4 overflow-x-auto">
    <table className="min-w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-neutral-200 bg-neutral-50">
          <th className="px-3 py-2 text-left font-semibold text-neutral-700">
            Ingredient
          </th>
          <th className="px-3 py-2 text-left font-semibold text-neutral-700">
            Qty
          </th>
          <th className="px-3 py-2 text-left font-semibold text-neutral-700">
            Unit
          </th>
          <th className="px-3 py-2 text-left font-semibold text-neutral-700">
            Best Supplier
          </th>
          <th className="px-3 py-2 text-right font-semibold text-neutral-700">
            Unit Price
          </th>
          <th className="px-3 py-2 text-right font-semibold text-neutral-700">
            Line Total
          </th>
        </tr>
      </thead>

      <tbody>
        {bestPurchasePlan.map((row, idx) => {
  const isValid = Number(row.unitPrice || 0) > 0;

  return (
  <tr
    key={`${row.ingredientName}-${idx}`}
    className={`border-b ${isValid ? "bg-green-50" : "bg-white"}`}
  >
    <td className="px-3 py-2 text-neutral-900">
      {row.ingredientName}
    </td>

    <td className="px-3 py-2 text-neutral-700">
      {row.qty}
    </td>

    <td className="px-3 py-2 text-neutral-700">
      {row.unit}
    </td>

    <td className="px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-green-700">
          {row.supplierName}
        </span>

        {isValid && (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase text-green-700">
            Cheapest
          </span>
        )}
      </div>
    </td>

    <td className="px-3 py-2 text-right text-neutral-700">
      £{Number(row.unitPrice || 0).toFixed(2)}
    </td>

    <td className="px-3 py-2 text-right">
      {Number(row.totalSaving || 0) > 0 ? (
        <span className="inline-block rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
          Saved £{Number(row.totalSaving || 0).toFixed(2)}
        </span>
      ) : (
        <span className="text-xs text-neutral-400">—</span>
      )}
    </td>
  </tr>
);
})}

        {bestPurchasePlan.length === 0 && (
          <tr>
            <td colSpan={6} className="px-3 py-6 text-center text-neutral-500">
              No purchase plan available yet.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
</div>

<div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4">
  <div className="text-sm font-medium text-green-700">
    Optimized Total Cost
  </div>
  <div className="mt-1 text-2xl font-bold text-green-900">
    £{optimizedTotalCost.toFixed(2)}
  </div>

  <div className="mt-1 text-sm text-green-700">
    This total is based on selecting the cheapest supplier for each ingredient.
  </div>
</div>

<div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
  <div className="text-sm font-medium text-emerald-700">
    Total Savings for this Event
  </div>
  <div className="mt-1 text-2xl font-bold text-emerald-900">
    £{totalEventSavings.toFixed(2)}
  </div>
</div>

<div className="fixed top-0 left-0 right-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur">
  <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-3">
    <button
      type="button"
      onClick={() => router.push("/events")}
      className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
    >
      ← Back
    </button>

    {voiceMsg && (
      <div className="ml-3 rounded-xl border border-neutral-200 bg-white px-3 py-1 text-sm">
        {voiceMsg}
      </div>
    )}

    <div className="relative z-50 pointer-events-auto flex items-center gap-2">
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => (voiceOn ? stop() : start())}
        className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm"
      >
        {voiceOn ? "🎤 Stop" : "🎤 Start"}
      </button>

      <select
        value={voiceLang}
        onChange={(e) => setVoiceLang(e.target.value as any)}
        className="rounded-xl border border-neutral-300 bg-white px-2 py-2 text-sm shadow-sm hover:border-neutral-400"
        title="Voice language"
      >
        <option value="bn-BD">BN</option>
        <option value="en-GB">EN</option>
      </select>

      <div className="flex flex-col gap-1 text-xs">
        {voiceActionMsg && (
          <div className="font-medium text-purple-600">
            💰 {voiceActionMsg}
          </div>
        )}

        {voiceOn && (
          <div className="text-xs font-medium text-green-600">
            🎤 Listening...
          </div>
        )}

        {lastHeard && (
          <div className="text-xs text-blue-600" title={lastHeard}>
            👂 Heard: {lastHeard}
          </div>
        )}

        {!voiceOn && !lastHeard && !voiceActionMsg && (
          <div className="flex flex-col gap-1 text-xs">
            <div className="text-neutral-500">
              Say: গেস্ট ৫০ / বিক্রি ২০০০০ / সেভ করো
            </div>
            <div className="text-neutral-500">
              Example: পেয়েছি ৫০০০ / লক করো / আনলক করো
            </div>
          </div>
        )}
      </div>

      {voiceActionMsg && (
        <div className="ml-2 rounded-xl bg-green-100 px-3 py-2 text-sm font-semibold text-green-800">
          {voiceActionMsg}
        </div>
      )}

      {saveState === "saved" && (
        <div className="ml-2 text-sm font-semibold text-green-600">
          ✅ Saved
        </div>
      )}
      {saveState === "error" && (
        <div className="ml-2 text-sm font-semibold text-red-600">
          ❌ Error saving
        </div>
      )}
    </div>
  </div>
</div>

<div className="flex flex-wrap items-start justify-between gap-3 pt-16">
  <div className="min-w-0">
    <div className="text-2xl font-semibold text-neutral-900">
      Event Details
    </div>

    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-700">
      <span className="font-semibold text-neutral-900">{title}</span>

      <span className="inline-flex items-center gap-2 text-xs text-neutral-600">
        <span>Msg: {msg || "—"}</span>

        {saveMsg && (
          <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
            ✅ {saveMsg}
          </span>
        )}
      </span>

      {!complete && (
        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
          ⚠️ Incomplete
        </span>
      )}
    </div>
  </div>

  <div className="flex items-center gap-2">
    {isBoss && (
      <>
        <button
          type="button"
          onClick={closeEvent}
          disabled={saving || locked}
          className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          🔒 Close Event
        </button>

        <button
          type="button"
          onClick={deleteEvent}
          disabled={saving || locked}
          className="rounded-xl border border-brand-red text-brand-red px-4 py-2 text-sm hover:bg-red-50"
        >
          Delete
        </button>
      </>
    )}
  </div>
</div>

{(saveMsg || lastSavedAt || undoMsg || error) && (
  <div className="mt-4 space-y-2">
    {lastSavedAt && (
      <div className="text-xs text-neutral-500">
        Last saved: {lastSavedAt}
      </div>
    )}
    {undoMsg && (
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
        {undoMsg}
      </div>
    )}
    {error && (
      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {error}
      </div>
    )}
  </div>
)}

<div className="mt-4 rounded-xl border border-neutral-200 bg-white p-4">
  <div className="flex items-center gap-2">
    <input
      id="allDay"
      type="checkbox"
      checked={!!eventData?.allDay}
      onChange={(e) =>
        setEventData((prev) =>
          prev
            ? {
                ...prev,
                allDay: e.target.checked,
                startTime: e.target.checked ? "" : prev.startTime,
                endTime: e.target.checked ? "" : prev.endTime,
              }
            : prev
        )
      }
    />
    <label
      htmlFor="allDay"
      className="text-sm font-semibold text-neutral-800"
    >
      Full day (সারাদিন)
    </label>
  </div>

  {!eventData?.allDay && (
    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
      <div>
        <div className="text-xs font-semibold text-neutral-700">
          Start time
        </div>
        <div className="mt-1 flex gap-2">
          <select
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500"
            value={startUI.hour12}
            onChange={(e) => {
              if (locked) return;
              const hour12 = Number(e.target.value);
              const newTime = buildTime(hour12, startUI.minute, startUI.ampm);
              setEventData((prev) =>
                prev ? { ...prev, startTime: newTime } : prev
              );
            }}
            disabled={locked}
          >
            {Array.from({ length: 12 }).map((_, i) => {
              const h = i + 1;
              return (
                <option key={h} value={h}>
                  {h}
                </option>
              );
            })}
          </select>

          <select
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500"
            value={startUI.minute}
            onChange={(e) => {
              if (locked) return;
              const minute = e.target.value;
              const newTime = buildTime(
                startUI.hour12,
                minute,
                startUI.ampm
              );
              setEventData((prev) =>
                prev ? { ...prev, startTime: newTime } : prev
              );
            }}
            disabled={locked}
          >
            {["00", "15", "30", "45"].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <select
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500"
            value={startUI.ampm}
            onChange={(e) => {
              if (locked) return;
              const ampm = e.target.value as "AM" | "PM";
              const newTime = buildTime(
                startUI.hour12,
                startUI.minute,
                ampm
              );
              setEventData((prev) =>
                prev ? { ...prev, startTime: newTime } : prev
              );
            }}
            disabled={locked}
          >
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold text-neutral-700">
          End time
        </div>
        <div className="mt-1 flex gap-2">
          <select
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500"
            value={endUI.hour12}
            onChange={(e) => {
              if (locked) return;
              const hour12 = Number(e.target.value);
              const newTime = buildTime(hour12, endUI.minute, endUI.ampm);
              setEventData((prev) =>
                prev ? { ...prev, endTime: newTime } : prev
              );
            }}
            disabled={locked}
          >
            {Array.from({ length: 12 }).map((_, i) => {
              const h = i + 1;
              return (
                <option key={h} value={h}>
                  {h}
                </option>
              );
            })}
          </select>

          <select
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500"
            value={endUI.minute}
            onChange={(e) => {
              if (locked) return;
              const minute = e.target.value;
              const newTime = buildTime(endUI.hour12, minute, endUI.ampm);
              setEventData((prev) =>
                prev ? { ...prev, endTime: newTime } : prev
              );
            }}
            disabled={locked}
          >
            {["00", "15", "30", "45"].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <select
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500"
            value={endUI.ampm}
            onChange={(e) => {
              if (locked) return;
              const ampm = e.target.value as "AM" | "PM";
              const newTime = buildTime(endUI.hour12, endUI.minute, ampm);
              setEventData((prev) =>
                prev ? { ...prev, endTime: newTime } : prev
              );
            }}
            disabled={locked}
          >
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </div>
      </div>
    </div>
  )}
</div>

{isBoss && (
  <div className="mt-5 rounded-xl border border-neutral-200 bg-white p-5">
    <div className="flex flex-wrap items-center gap-3">
      <div className="text-sm font-semibold text-neutral-700">
        Client Price:
        <span className="ml-2 text-xs font-normal text-neutral-500">
          (Used as revenue only if no revenue items)
        </span>
      </div>

      <input
        type="number"
        min="0"
        value={clientPrice ?? ""}
        onChange={(e) => setClientPrice(e.target.value)}
        disabled={locked}
        className={`w-28 rounded-lg border px-3 py-1.5 transition ${
  priceApplied
    ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200"
    : "border-neutral-300 bg-white"
}`}
      />
      <button
  type="button"
  onClick={handleUseSuggestedPrice}
  className="mt-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
>
  Use Suggested Price
</button>
<div className="mt-1 text-xs text-neutral-500">
  Suggested: £{Number(suggestedTotalRevenue || 0).toFixed(2)}
</div>
<div className="text-xs text-sky-600">
  Target-Based Suggestion: £
  {Number(suggestedPriceFromTargetMargin || 0).toFixed(2)}
</div>
<div className="text-xs font-semibold">
  Margin:{" "}
  <span
    className={
      marginPercentNow >= 30
        ? "text-emerald-600"
        : marginPercentNow >= 15
        ? "text-amber-600"
        : "text-red-600"
    }
  >
    {marginPercentNow.toFixed(1)}%
  </span>
</div>
<div className="text-xs text-neutral-700">
  £{Number((currentRevenueTotal || 0) - ((currentCostTotal || 0) + (totalLabourCost || labourCost || 0))).toFixed(2)}
</div>
{marginPercentNow < 15 && (
  <div className="mt-1 text-xs font-semibold text-red-600">
    Warning: Margin is very low
  </div>
  )}
  {marginPercentNow >= 30 && (
  <div className="mt-1 text-xs font-semibold text-emerald-600">
    Great: Healthy profit margin
  </div>
)}
{marginPercentNow >= 15 && marginPercentNow < 30 && (
  <div className="mt-1 text-xs font-semibold text-amber-600">
    Okay: Margin is acceptable but could be improved
  </div>
)}
<div className="mt-2 text-xs">
  Target Margin (%):
  <input
    type="number"
    min="0"
    max="100"
    value={targetMargin}
    onChange={(e) => setTargetMargin(e.target.value)}
    className="ml-2 w-16 rounded border border-neutral-300 px-2 py-1 text-xs"
  />
</div>
      <Link
        href={`/dashboard/ingredient-calculator?guests=${guestsCount || 0}&price=${clientPrice || 0}&menu=wedding_menu_1`}
        className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900 hover:border-neutral-400"
      >
        Ingredient Calculator
      </Link>

      <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-4">
        <div className="text-lg font-semibold">Event Planning</div>

        <div className="mt-3 text-sm text-neutral-600">
          Number of Guests: {eventData?.guests || 0}
        </div>

        <button
          onClick={calculateIngredientsForEvent}
          className="mt-3 rounded-lg bg-black px-4 py-2 text-white"
        >
          Calculate Ingredients
        </button>
      </div>
    </div>
  </div>
)}

{eventIngredients.length > 0 && (
  <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-4">
    <div className="font-semibold">Ingredient Requirement</div>

    <div className="mt-2 space-y-1 text-sm">
      {eventIngredients.map((item, idx) => {
        const storeQty = 0;
        const need = item.qty;
        const buy = Math.max(0, need - storeQty);

        return (
          <div key={idx}>
            {item.name} | Need: {need} | Store: {storeQty} | Buy: {buy}
          </div>
        );
      })}
    </div>
  </div>
)}

<div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5">
  <div className="mb-3 text-base font-semibold">💳 Payment</div>

  <div className="grid gap-3 sm:grid-cols-3">
    <label className="text-sm">
      Advance Paid (অগ্রিম)
      <input
        type="number"
        className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2"
        value={advancePaid}
        onChange={(e) => setAdvancePaid(Number(e.target.value || 0))}
        onFocus={(e) => {
          activeInputRef.current = e.currentTarget;
          setFocusField("advancePaid");
        }}
        disabled={locked}
      />
    </label>

    <label className="text-sm">
      Paid Now (আজকে পেলাম)
      <input
        type="number"
        className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2"
        value={paidNow}
        onChange={(e) => setPaidNow(Number(e.target.value || 0))}
        onFocus={(e) => {
          activeInputRef.current = e.currentTarget;
          setFocusField("paidNow");
        }}
        disabled={locked}
      />
    </label>

    <div className="text-sm">
      Summary
      {(() => {
        const price = Number(eventData?.clientPrice ?? 0);
        const prevAdvance = Number(advancePaid ?? 0);
        const extra = Number(paidNow ?? 0);
        const { paidTotal, balanceDue, paymentStatus } = calcPayment(
          price,
          prevAdvance,
          extra
        );

        return (
          <div className="mt-2 rounded-xl border border-neutral-200 p-3">
            <div>
              Paid Total: <b>{showMoney(paidTotal)}</b>
            </div>
            <div>
              Balance Due:{" "}
              <b
                className={
                  balanceDue > 0 ? "text-red-600" : "text-green-700"
                }
              >
                {showMoney(balanceDue)}
              </b>
            </div>
            <div>
              Status:{" "}
              <b
                className={
                  paymentStatus === "paid"
                    ? "text-green-700"
                    : paymentStatus === "partial"
                    ? "text-orange-600"
                    : "text-neutral-600"
                }
              >
                {paymentStatus.toUpperCase()}
              </b>
            </div>
          </div>
        );
      })()}
    </div>
  </div>

  <button
    type="button"
    className="mt-4 rounded-xl bg-black px-5 py-2 text-sm text-white disabled:opacity-60"
    disabled={!isBoss || locked}
    onClick={async () => {
      if (!id) return;

      const price = Number(eventData?.clientPrice ?? 0);
      const { paidTotal, balanceDue, paymentStatus } = calcPayment(
        price,
        advancePaid,
        paidNow
      );

      setSaveState("saving");
      try {
        await updateDoc(doc(db, "events", String(id)), {
          advancePaid: Number(advancePaid ?? 0),
          paidTotal,
          balanceDue,
          paymentStatus,
        });
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }

      setEventData((prev) => ({
        ...(prev ?? {}),
        advancePaid: Number(advancePaid ?? 0),
        paidTotal,
        balanceDue,
        paymentStatus,
      }));

      setPaidNow(0);

      setSaveMsg("✅ Payment saved");
      setTimeout(() => setSaveMsg(null), 1500);
    }}
  >
    Save Payment
  </button>
</div>

<div className="mt-5">
  <StatusBar
    value={(ev.status as Status) || "draft"}
    isBoss={isBoss}
    onChange={setStatus}
  />
</div>

<div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        Event Summary
      </div>
      <h2 className="mt-1 text-2xl font-bold text-neutral-900">
        {eventData?.clientName || "Unnamed client"}
      </h2>
      <div className="mt-1 text-sm text-neutral-600">
        {(eventData as any)?.customerPhoneSnapshot ||
          (eventData as any)?.clientPhone ||
          (eventData as any)?.phone ||
          "No phone saved"}
      </div>
    </div>

    <div className="flex flex-wrap gap-2">
      <span
        className={`rounded-full px-3 py-1 text-xs font-semibold ${
          locked
            ? "bg-red-100 text-red-700"
            : "bg-amber-100 text-amber-700"
        }`}
      >
        {locked ? "Closed" : "Draft"}
      </span>

      <span
        className={`rounded-full px-3 py-1 text-xs font-semibold ${
          isComplete(eventData as EventData)
            ? "bg-emerald-100 text-emerald-700"
            : "bg-neutral-100 text-neutral-700"
        }`}
      >
        {isComplete(eventData as EventData) ? "Complete" : "Incomplete"}
      </span>
    </div>
  </div>

  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
    <div className="rounded-xl bg-neutral-50 p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        Date
      </div>
      <div className="mt-1 text-sm font-semibold text-neutral-900">
        {eventData?.date || "Not set"}
      </div>
    </div>

    <div className="rounded-xl bg-neutral-50 p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        Time
      </div>
      <div className="mt-1 text-sm font-semibold text-neutral-900">
        {(eventData as any)?.isWholeDay ||
        (eventData as any)?.isWholeDayEvent ||
        (eventData as any)?.wholeDay
          ? "Whole day"
          : `${eventData?.startTime || "--:--"} - ${eventData?.endTime || "--:--"}`}
      </div>
    </div>

    <div className="rounded-xl bg-neutral-50 p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        Guests
      </div>
      <div className="mt-1 text-sm font-semibold text-neutral-900">
        {Number(eventData?.guests || 0)}
      </div>
    </div>

    <div className="rounded-xl bg-neutral-50 p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        Client Price
      </div>
      <div className="mt-1 text-sm font-semibold text-neutral-900">
        {showMoney(Number(eventData?.clientPrice || 0))}
      </div>
    </div>
  </div>

  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
    <div className="rounded-xl border border-neutral-200 p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        Advance Paid
      </div>
      <div className="mt-1 text-sm font-semibold text-neutral-900">
        {showMoney(Number(advancePaid || 0))}
      </div>
    </div>

    <div className="rounded-xl border border-neutral-200 p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        Paid Now
      </div>
      <div className="mt-1 text-sm font-semibold text-neutral-900">
        {showMoney(Number(paidNow || 0))}
      </div>
    </div>

    <div className="rounded-xl border border-neutral-200 p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        Paid Total
      </div>
      <div className="mt-1 text-sm font-semibold text-neutral-900">
        {showMoney(paidTotalNow)}
      </div>
    </div>

    <div className="rounded-xl border border-neutral-200 p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        Balance Due
      </div>
      <div className="mt-1 text-sm font-semibold text-neutral-900">
        {showMoney(
          Math.max(0, Number(eventData?.clientPrice || 0) - paidTotalNow)
        )}
      </div>
    </div>

    <div className="rounded-xl border border-neutral-200 p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        Payment Status
      </div>
      <div
        className={`mt-1 text-sm font-semibold ${
          paymentStatusNow === "paid"
            ? "text-green-600"
            : paymentStatusNow === "partial"
            ? "text-amber-600"
            : "text-red-600"
        }`}
      >
        {paymentStatusNow}
      </div>
    </div>
  </div>
</div>

<div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
  <StatCard label="Total Revenue" value={showMoney(currentRevenueTotal)} />
  <StatCard label="Total Cost" value={showMoney(currentCostTotal)} />
  <StatCard
    label="Profit"
    value={showMoney(profitNow)}
    valueClass={profitClass}
  />
  <StatCard label="Profit / Plate" value={showMoney(profitPerPlate)} />
</div>
<div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm">
  <div className="flex justify-between">
    <span>Food Cost</span>
    <span>
      £{Number(
        costItems?.reduce((sum: number, i: any) => sum + Number(i?.amount || 0), 0)
      ).toFixed(2)}
    </span>
  </div>

  <div className="flex justify-between">
    <span>Staff Cost</span>
    <span>£{Number(staffAssignmentsTotal || 0).toFixed(2)}</span>
  </div>
<div className="flex justify-between">
  <span>Total Revenue</span>
  <span>£{Number(currentRevenueTotal || 0).toFixed(2)}</span>
</div>
  <div className="flex items-center justify-between text-sm">
  <span className="text-neutral-600">Labour Cost</span>
  <span className="font-semibold text-neutral-900">
    £{Number(totalLabourCost || labourCost || 0).toFixed(2)}
  </span>
</div>
<div className="mt-2 text-xs text-neutral-500 space-y-1">
  <div className="flex justify-between">
    <span>Food / Supplier Cost</span>
    <span>£{Number(currentCostTotal || 0).toFixed(2)}</span>
  </div>

  <div className="flex justify-between">
    <span>Labour Cost</span>
    <span>£{Number(totalLabourCost || labourCost || 0).toFixed(2)}</span>
  </div>
</div>
  <div className="mt-2 border-t pt-2 flex justify-between font-semibold">
    <span>Total Cost</span>
    <span>
  £{Number((currentCostTotal || 0) + (totalLabourCost || labourCost || 0)).toFixed(2)}
</span>
  </div>
  <div className="mt-2 flex justify-between font-semibold">
  <span>Profit</span>
  <span className={profitClass}>£{Number(profitNow || 0).toFixed(2)}</span>
</div>
<div className="mt-2 flex justify-between text-sm">
  <span className="text-neutral-600">Profit Margin</span>
  <span className="font-semibold text-neutral-900">
    {currentRevenueTotal > 0
  ? `${profitMarginValue.toFixed(1)}% · ${profitMarginLabel}`
  : "0.0%"}
  </span>
</div>
<div className="flex justify-between text-sm text-neutral-600">
  <span>Profit per Plate</span>
  <span>£{Number(profitPerPlate || 0).toFixed(2)}</span>
</div>
<div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2">
  <div className="flex items-center justify-between">
    <span className="text-sm font-semibold text-sky-800">
      Suggested Price / Plate
    </span>

    <span className="text-lg font-bold text-sky-900">
      £{Number(suggestedPricePerPlate || 0).toFixed(2)}
    </span>
  </div>

  <div className="mt-2 flex justify-end">
    <button
      type="button"
      onClick={() => setClientPrice(String(Number(suggestedTotalRevenue || 0).toFixed(2)))}
      className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700"
    >
      Use Suggested Price
    </button>
  </div>
</div>
<div className="mt-2 flex justify-between text-sm text-sky-800">
  <span>Suggested Total Revenue</span>
  <span className="font-semibold">
    £{Number(suggestedTotalRevenue || 0).toFixed(2)}
  </span>
</div>
<div className="flex justify-between items-center text-xs text-neutral-500">
  <span>Target Margin</span>

  <input
    type="number"
    value={targetMarginPercent}
    onChange={(e) => setTargetMarginPercent(Number(e.target.value || 0))}
    className="w-16 rounded border border-neutral-300 px-2 py-1 text-right text-xs"
  />
  </div>
  <div className="mt-2 flex gap-2">
  {[25, 30, 40].map((pct) => (
    <button
      key={pct}
      type="button"
      onClick={() => setTargetMarginPercent(pct)}
      className={`rounded-full px-3 py-1 text-xs font-medium border ${
        targetMarginPercent === pct
          ? "border-sky-600 bg-sky-100 text-sky-800"
          : "border-neutral-300 bg-white text-neutral-700"
      }`}
    >
      {pct}%
    </button>
  ))}
</div>
</div>
{isBoss ? (
  <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">Revenue Breakdown</h3>
        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-700">
          Boss Only
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <input
          value={revenueName}
          onChange={(e) => setRevenueName(e.target.value)}
          onFocus={(e) => {
            activeInputRef.current = e.currentTarget;
          }}
          onMouseDown={(e) => e.currentTarget.focus()}
          placeholder="Revenue name (e.g., Customer payment)"
          className="w-full flex-1 rounded-lg border border-neutral-300 px-3 py-2 caret-black outline-none focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-black/20"
          disabled={locked}
        />

        <input
          value={revenueAmount}
          onChange={(e) => setRevenueAmount(e.target.value)}
          onFocus={(e) => {
            activeInputRef.current = e.currentTarget;
            setFocusField("revenueAmount");
          }}
          onMouseDown={(e) => e.currentTarget.focus()}
          placeholder="Amount (e.g., 5000)"
          inputMode="numeric"
          className="w-full flex-1 rounded-lg border border-neutral-300 px-3 py-2 caret-black outline-none focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-black/20"
          disabled={locked}
        />

        <button
          type="button"
          onClick={addRevenueItem}
          className="rounded-lg bg-black px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={locked}
        >
          Add
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {revenueItems.length === 0 ? (
          <div className="text-sm text-neutral-500">
            No revenue added yet.
          </div>
        ) : (
          revenueItems.map((it, idx) => (
            <div
              key={`${it.name}-${idx}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 p-3"
            >
              <div className="min-w-0">
                <div className="truncate font-semibold text-neutral-900">
                  {it.name}
                </div>
                <div className="text-sm text-neutral-600">
                  Amount: {showMoney(it.amount)}
                </div>
              </div>

              <button
                type="button"
                onClick={() => deleteRevenueItem(idx)}
                className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 hover:border-neutral-400 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={locked}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setRevenueItems(lastSavedRevenueItems);
            setLastDeletedRevenue(null);
            setUndoMsg("↩️ Revenue reverted to last saved");
            setError(null);
            setSaveState("dirty");
          }}
          disabled={!revenueDirty || saving || locked}
          className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Revert Revenue
        </button>

        {lastDeletedCost && (
          <button
            type="button"
            onClick={() => {
              setCostItems((prev) => {
                const copy = [...prev];
                copy.splice(lastDeletedCost.index, 0, lastDeletedCost.item);
                return copy;
              });

              setLastDeletedCost(null);
              setUndoMsg("↩️ Last delete undone");
              setSaveState("dirty");
            }}
            className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm text-blue-700 hover:bg-blue-100"
          >
            Undo Delete
          </button>
        )}

        <button
          type="button"
          onClick={undoLastRevenueDelete}
          disabled={!lastDeletedRevenue || saving || locked}
          className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Undo Revenue Delete
        </button>
      </div>
    </div>

    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">Cost Breakdown</h3>
        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-700">
          Boss Only
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <input
          value={costName}
          onChange={(e) => setCostName(e.target.value)}
          onFocus={(e) => {
            activeInputRef.current = e.currentTarget;
          }}
          onMouseDown={(e) => e.currentTarget.focus()}
          placeholder="Cost name (e.g., Chicken)"
          className="w-full flex-1 rounded-lg border border-neutral-300 px-3 py-2 caret-black outline-none focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-black/20"
          disabled={locked}
        />

              <input
  value={costAmount}
  onChange={(e) => setCostAmount(e.target.value)}
  onFocus={(e) => {
    activeInputRef.current = e.currentTarget;
    setFocusField("costAmount");
  }}
  onMouseDown={(e) => e.currentTarget.focus()}
  placeholder="Amount (e.g., 2000)"
  inputMode="numeric"
  className="w-full flex-1 rounded-lg border border-neutral-300 px-3 py-2 caret-black outline-none focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-black/20"
  disabled={locked}
/>

<button
  type="button"
  onClick={addCostItem}
  className="rounded-lg bg-black px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
  disabled={locked}
>
  Add
</button>
</div>

<div className="mt-4 space-y-2">
  {costItems.length === 0 ? (
    <div className="text-sm text-neutral-500">No costs added yet.</div>
  ) : (
    costItems
      .filter((it) => {
        const hasIngredientId = !!(
          (it as any).ingredientId &&
          String((it as any).ingredientId).trim()
        );
        const hasAmount = Number(it.amount || it.qty || 0) > 0;

        return hasIngredientId && hasAmount;
      })
      .map((it, idx) => (
        <div
          key={`${it.name}-${idx}`}
          className="grid grid-cols-1 gap-3 rounded-lg border border-neutral-200 p-3 md:grid-cols-12"
        >
          {/* Ingredient */}
          <div className="md:col-span-4">
            <select
              value={(it as any).ingredientId ?? ""}
              onChange={(e) => {
                const ingId = e.target.value;

                setCostItems((prev) => {
                  if (!ingId) return prev;

                  const arr = [...prev];
                  const ing = ingredients.find((x) => x.id === ingId);
                  if (!ing) return prev;

                  const cur: any = {
                    ...(arr[idx] ?? {}),
                    ingredientId: ingId,
                    name: ing.nameEn || "",
                    unit: ing.unit || "",
                    unitCost: Number((ing as any).unitCost ?? 0),
                    qty: (arr[idx] as any)?.qty ?? 1,
                  };

                  cur.amount = Number(cur.qty) * Number(cur.unitCost);

                  arr[idx] = cur;
                  return arr;
                });

                setSaveState("dirty");
              }}
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Select ingredient</option>
{ingredients.map((ing) => (
  <option key={ing.id} value={ing.id}>
    {ing.nameEn}
  </option>
))}
            </select>
          </div>

          {/* Qty */}
          <div className="md:col-span-2">
            <input
              type="number"
              min="0"
              step="0.01"
              value={Number((it as any).qty ?? 0)}
              onChange={(e) => {
                const qty = Number(e.target.value || 0);

                setCostItems((prev) => {
                  const arr = [...prev];
                  const cur: any = { ...(arr[idx] ?? {}) };

                  cur.qty = qty;
                  cur.amount = Number(cur.qty || 0) * Number(cur.unitCost || 0);

                  arr[idx] = cur;
                  return arr;
                });

                setSaveState("dirty");
              }}
              disabled={locked}
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm"
              placeholder="Qty"
            />
          </div>

          {/* Unit */}
          <div className="md:col-span-1">
            <input
              type="text"
              value={(it as any).unit ?? ""}
              readOnly
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700"
              placeholder="Unit"
            />
          </div>

          {/* Unit Cost */}
          <div className="md:col-span-2">
            <input
              type="number"
              min="0"
              step="0.01"
              value={Number((it as any).unitCost ?? 0)}
              onChange={(e) => {
                const unitCost = Number(e.target.value || 0);

                setCostItems((prev) => {
                  const arr = [...prev];
                  const cur: any = { ...(arr[idx] ?? {}) };

                  cur.unitCost = unitCost;
                  cur.amount = Number(cur.qty || 0) * Number(cur.unitCost || 0);

                  arr[idx] = cur;
                  return arr;
                });

                setSaveState("dirty");
              }}
              disabled={locked}
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm"
              placeholder="Unit Cost"
            />
          </div>

          {/* Amount */}
          <div className="md:col-span-2">
            <input
              type="text"
              value={`৳ ${Number((it as any).amount ?? 0).toLocaleString("en-BD")}`}
              readOnly
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-semibold text-neutral-800"
              placeholder="Amount"
            />
          </div>

          {/* Delete */}
          <div className="md:col-span-1">
            <button
              type="button"
              onClick={() => deleteCostItem(idx)}
              disabled={locked}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 hover:border-neutral-400 disabled:opacity-60"
            >
              Delete
            </button>
          </div>
        </div>
      ))
  )}
</div>

<div className="mt-4 flex flex-wrap gap-2">
  <button
    type="button"
    onClick={() => {
      setCostItems(lastSavedCostItems);
      setLastDeletedCost(null);
      setUndoMsg("↩️ Costs reverted to last saved");
      setError(null);
      setSaveState("dirty");
    }}
    disabled={!costDirty || saving || locked}
    className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900 disabled:opacity-50"
  >
    Revert Costs
  </button>

  {lastDeletedCost && (
    <button
      type="button"
      onClick={() => {
        setCostItems((prev) => {
          const copy = [...prev];
          copy.splice(lastDeletedCost.index, 0, lastDeletedCost.item);
          return copy;
        });

        setLastDeletedCost(null);
        setUndoMsg("↩️ Last delete undone");
        setSaveState("dirty");
      }}
      className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm text-blue-700 hover:bg-blue-100"
    >
      Undo Delete
    </button>
  )}

  <button
    type="button"
    onClick={undoLastCostDelete}
    disabled={!lastDeletedCost || saving || locked}
    className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900 disabled:opacity-50"
  >
    Undo Cost Delete
  </button>
</div>
</div>

<div className="lg:col-span-2">
  <div className="rounded-xl border border-neutral-200 bg-white p-5">
    <div className="flex flex-wrap items-center gap-2">
      <button
        id="saveBtn"
        type="button"
        onClick={() => void saveAll()}
        disabled={saving || locked}
        className="rounded-lg bg-black px-5 py-2 text-white disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save All"}
      </button>
<Link
  href="/blackcab?pickup=East%20London&date=2026-04-20&event=Test%20Event"
  className="ml-3 inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-500"
>
  <CarFront size={16} />
  Book Black Cab
</Link>
      <div className="text-xs text-neutral-500">
        Auto-save runs 5s after edits (Boss only).
      </div>
    </div>
  </div>
</div>
</div>
) : (
  <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-5 text-sm text-neutral-600">
    Boss only.
  </div>
)}

<div className="mt-6 rounded-xl border border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-700">
  🔒 Cost & revenue editing is visible to Boss only.
</div>
</div>
);
}

/** ----------- Local components ----------- */

function StatusBar({
  value,
  isBoss,
  onChange,
}: {
  value: Status;
  isBoss: boolean;
  onChange: (s: Status) => void;
}) {
  const currentIndex = STATUS_ORDER.indexOf(value);
  const percent =
    currentIndex <= 0
      ? 0
      : Math.round((currentIndex / (STATUS_ORDER.length - 1)) * 100);

  const currentLabel = STATUS_LABEL[value] ?? String(value);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">Status</h3>
        <div className="text-sm text-neutral-600">
          Current:{" "}
          <span className="font-semibold text-neutral-900">
            {currentLabel}
          </span>
        </div>
      </div>

      <div className="mt-3 h-2 w-full rounded-full bg-neutral-200">
        <div
          className="h-2 rounded-full bg-black transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {STATUS_ORDER.map((s, i) => {
          const active = i === currentIndex;
          const label = STATUS_LABEL[s] ?? String(s);

          return (
            <button
              key={s}
              type="button"
              disabled={!isBoss || active}
              onClick={() => onChange(s)}
              className={[
                "rounded-lg border px-3 py-2 text-sm transition",
                active
                  ? "border-black bg-black text-white"
                  : "border-neutral-300 bg-white text-neutral-900 hover:border-neutral-400",
                !isBoss ? "cursor-not-allowed opacity-60" : "",
              ].join(" ")}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="text-xs text-neutral-500">{label}</div>
      <div
        className={`mt-1 text-2xl font-semibold ${
          valueClass ?? "text-neutral-900"
        }`}
      >
        {value}
      </div>
    </div>
  );
}