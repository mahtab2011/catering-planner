import { MenuItemType, ServiceType, SupplierCategory } from "./types";

/* =========================
   HUBS
========================= */

export const HUBS = [
  {
    name: "Brick Lane",
    slug: "brick-lane",
    city: "London",
  },
  {
    name: "Green Street / Plashet Road",
    slug: "green-street-plashet-road",
    city: "London",
  },
  {
    name: "Bethnal Green / BOXPARK",
    slug: "bethnal-green-boxpark",
    city: "London",
  },
  {
    name: "Brick Lane Food Hall",
    slug: "brick-lane-food-hall",
    city: "London",
  },
] as const;

/* =========================
   SERVICE TYPES
========================= */

export const SERVICE_TYPES: ServiceType[] = [
  "dine-in",
  "takeaway",
  "delivery",
  "catering",
];

/* =========================
   MENU ITEM TYPES
========================= */

export const MENU_ITEM_TYPES: MenuItemType[] = [
  "rice",
  "bread",
  "main",
  "grill",
  "kebab",
  "seafood",
  "drink",
  "hot-drink",
  "dessert",
  "set-menu",
  "other",
];

/* =========================
   DEFAULT MENU CATEGORIES
========================= */

export const DEFAULT_MENU_CATEGORIES = [
  { name: "Rice & Biryani", type: "rice" },
  { name: "Bread", type: "bread" },
  { name: "Curry & Main Dishes", type: "main" },
  { name: "Grill", type: "grill" },
  { name: "Kebabs", type: "kebab" },
  { name: "Seafood", type: "seafood" },
  { name: "Hot Drinks", type: "hot-drink" },
  { name: "Drinks", type: "drink" },
  { name: "Desserts", type: "dessert" },
  { name: "Catering Packages", type: "set-menu" },
] as const;

/* =========================
   SUPPLIER CATEGORIES
========================= */

export const SUPPLIER_CATEGORIES: SupplierCategory[] = [
  "fish",
  "meat",
  "vegetable",
  "rice",
  "spice",
  "oil",
  "flour",
  "soft-drink",
  "dessert",
  "other",
];

/* =========================
   COMMON UNITS
========================= */

export const UNITS = [
  "kg",
  "g",
  "litre",
  "ml",
  "pcs",
  "box",
  "tray",
] as const;

/* =========================
   CURRENCIES
========================= */

export const CURRENCIES = ["GBP", "BDT"] as const;

/* =========================
   ORDER STATUS
========================= */

export const CUSTOMER_ORDER_STATUSES = [
  "new",
  "accepted",
  "preparing",
  "ready",
  "completed",
  "cancelled",
] as const;

export const SUPPLIER_ORDER_STATUSES = [
  "new",
  "quoted",
  "confirmed",
  "packed",
  "delivered",
  "cancelled",
] as const;

/* =========================
   SUBSCRIPTION
========================= */

export const SUBSCRIPTION_PLANS = [
  {
    code: "trial",
    name: "Free Trial",
    durationDays: 60,
  },
  {
    code: "basic",
    name: "Basic Plan",
    price: 21.98,
    currency: "GBP",
  },
];