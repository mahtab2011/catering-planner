export type UserRole =
  | "customer"
  | "restaurant"
  | "caterer"
  | "supplier"
  | "household"
  | "admin";

export type CountryCode = "UK" | "BD";

export type ServiceType =
  | "dine-in"
  | "takeaway"
  | "delivery"
  | "catering";

export type MenuItemType =
  | "rice"
  | "bread"
  | "main"
  | "grill"
  | "kebab"
  | "seafood"
  | "drink"
  | "hot-drink"
  | "dessert"
  | "set-menu"
  | "other";

export type SupplierCategory =
  | "fish"
  | "meat"
  | "vegetable"
  | "rice"
  | "spice"
  | "oil"
  | "flour"
  | "soft-drink"
  | "dessert"
  | "other";

export type TransportType = "ex-premises" | "delivered";

export type SubscriptionStatus =
  | "trial"
  | "active"
  | "expired"
  | "cancelled";

export type CustomerOrderStatus =
  | "new"
  | "accepted"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

export type SupplierOrderStatus =
  | "new"
  | "quoted"
  | "confirmed"
  | "packed"
  | "delivered"
  | "cancelled";

export type CurrencyCode = "GBP" | "BDT";

export type MenuLanguages = {
  en?: string;
  bn?: string;
  fr?: string;
  it?: string;
  es?: string;
  de?: string;
};

export type UserDoc = {
  uid: string;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  countryCode?: CountryCode;
  isActive: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type HubDoc = {
  id: string;
  name: string;
  slug: string;
  countryCode: CountryCode;
  city: string;
  areaLabel: string;
  description?: string;
  isActive: boolean;
  sortOrder?: number;
  heroImageUrl?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type RestaurantDoc = {
  id: string;
  ownerUid: string;
  name: string;
  slug: string;
  cuisine?: string;
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postcode?: string;
  countryCode: CountryCode;
  hubIds: string[];
  serviceTypes: ServiceType[];
  halal?: boolean;
  openingHours?: Record<string, string>;
  imageUrl?: string;
  logoUrl?: string;
  isFeatured?: boolean;
  isApproved?: boolean;
  isActive?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type RestaurantMenuCategoryDoc = {
  id: string;
  restaurantId: string;
  name: string;
  slug: string;
  itemType: MenuItemType;
  sortOrder: number;
  isActive: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type RestaurantMenuItemDoc = {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  currency: CurrencyCode;
  itemType: MenuItemType;
  tags?: string[];
  isPopular?: boolean;
  isAvailable?: boolean;
  imageUrl?: string;
  translatedNames?: MenuLanguages;
  translatedDescriptions?: MenuLanguages;
  spiceLevel?: "mild" | "medium" | "hot";
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type CateringPackageDoc = {
  id: string;
  ownerUid: string;
  ownerType: "restaurant" | "caterer";
  ownerBusinessId: string;
  name: string;
  description?: string;
  priceMode: "per-head" | "fixed";
  price: number;
  currency: CurrencyCode;
  minimumGuests?: number;
  maximumGuests?: number;
  includedItems: string[];
  addOnItems?: string[];
  isActive: boolean;
  isPopular?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type SupplierDoc = {
  id: string;
  ownerUid: string;
  name: string;
  slug: string;
  phone?: string;
  email?: string;
  website?: string;
  addressLine1?: string;
  city?: string;
  postcode?: string;
  countryCode: CountryCode;
  hubIds: string[];
  description?: string;
  deliveryTypes: TransportType[];
  isApproved?: boolean;
  isActive?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type SupplierProductDoc = {
  id: string;
  supplierId: string;

  // Linked to ingredient master where possible
  ingredientId?: string;

  name: string;
  category: SupplierCategory | string;

  // Size / grade / packaging
  spec?: string;
  variant?: string;
  brand?: string;
  packaging?: string;

  unit: "kg" | "g" | "litre" | "ml" | "pcs" | "box" | "tray" | string;

  price: number;
  currency: CurrencyCode;

  minimumOrderQty?: number;
  transportType?: TransportType;
  isAvailable?: boolean;

  aliases?: string[];

  createdAt?: unknown;
  updatedAt?: unknown;
};

export type OrderItem = {
  menuItemId: string;
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
};

export type CustomerOrderDoc = {
  id: string;
  customerUid?: string;
  restaurantId: string;
  customerName?: string;
  customerPhone?: string;
  orderItems: OrderItem[];
  serviceType: "dine-in" | "takeaway" | "delivery";
  subtotal: number;
  deliveryFee?: number;
  total: number;
  currency: CurrencyCode;
  status: CustomerOrderStatus;
  source?: "web" | "manual" | "phone";
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type SupplierOrderLine = {
  supplierProductId: string;
  name: string;
  qty: number;
  unit: string;
  agreedPrice?: number;
  lineTotal?: number;
};

export type SupplierOrderDoc = {
  id: string;
  buyerType: "restaurant" | "caterer" | "household";
  buyerBusinessId?: string;
  buyerUid: string;
  supplierId: string;
  items: SupplierOrderLine[];
  requestedDeliveryType?: TransportType;
  note?: string;
  status: SupplierOrderStatus;
  currency: CurrencyCode;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type SubscriptionDoc = {
  id: string;
  ownerUid: string;
  ownerType: "restaurant" | "supplier" | "caterer" | "household";
  ownerBusinessId?: string;
  planCode: string;
  planName: string;
  status: SubscriptionStatus;
  trialStartAt?: unknown;
  trialEndAt?: unknown;
  billingStartAt?: unknown;
  amount?: number;
  currency: CurrencyCode;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type FavouriteDoc = {
  id: string;
  userUid: string;
  restaurantId: string;
  createdAt?: unknown;
};

/* =========================================================
   LONDON FOOD HUBS — DISCOVERY / EDITORIAL DATA MODEL

   These types back the consumer-facing discovery platform
   (cuisines, food hubs, reviews, blog, editorial
   recommendations). They are additive to the operational
   SmartServeUK model above and do not replace it.
========================================================= */

import type { AppLanguage } from "./i18n";

/** Partial multilingual text — only languages that have real,
 *  human-written copy should be present. Never auto-fill with
 *  placeholder/machine text. */
export type LocalizedText = Partial<Record<AppLanguage, string>>;

export type CuisineDishCategory = {
  title: string;
  items: string[];
};

/** A single, named dish worth calling out editorially.
 *  `description` is optional — many dishes are listed by name only. */
export type CuisineDish = {
  name: string;
  description?: string;
};

export type Cuisine = {
  id: string;
  /** URL slug, also used as the Firestore doc id and the legacy
   *  route path for redirect purposes (e.g. "pakistani-food-london"). */
  slug: string;
  /** Whether this entry represents a full cuisine or a narrower
   *  dish-topic guide (e.g. "biryani-polao-london"). Both render
   *  through the same /cuisine/[slug] route. */
  kind: "cuisine" | "dish-guide";
  name: string;
  /** Broad geographic/cultural grouping used for homepage variety
   *  and to avoid the site skewing toward one region. */
  region:
    | "South Asian"
    | "East Asian"
    | "Southeast Asian"
    | "Middle Eastern"
    | "African"
    | "European"
    | "Americas"
    | "Caribbean";
  shortDescription: string;
  /** Longer editorial intro paragraph(s), joined by \n\n. */
  longDescription: string;
  /** Terms matched (case-insensitively) against a restaurant's free-text
   *  `cuisine` field to associate live restaurants with this cuisine page. */
  matchTerms: string[];
  /** Dishes grouped under sub-headings (e.g. "Tandoor & Grill"). Empty
   *  for cuisine pages that only have a flat dish list. */
  dishCategories?: CuisineDishCategory[];
  /** Flat dish names with no category grouping (used for stub pages). */
  dishes: string[];
  /** Dishes with their own editorial description, where we have one. */
  featuredDishes?: CuisineDish[];
  dietaryTags?: string[];
  heroImage?: string;
  seoTitle: string;
  seoDescription: string;
  isActive: boolean;
  isFeatured?: boolean;
};

export type FoodHub = {
  id: string;
  slug: string;
  name: string;
  /** e.g. "East Ham, East London" */
  areaLabel: string;
  city: "London";
  /** Rich marketing-style description, multilingual where we have real
   *  translated copy (do not invent missing languages). */
  description: LocalizedText;
  /** Practical "how to get there" copy, multilingual where available. */
  travelInfo?: LocalizedText;
  /** English-only longer editorial paragraph used on the richer static
   *  hub pages. Optional — many hubs only have `description`. */
  editorialIntro?: string;
  cuisineTags?: string[];
  heroImage?: string;
  gallery?: string[];
  isActive: boolean;
  isFeatured?: boolean;
  seoTitle: string;
  seoDescription: string;
};

/** Lightweight projection of a live `restaurants` Firestore document,
 *  used for cards/listings without needing the full editable record. */
export type BusinessSummary = {
  id: string;
  name: string;
  cuisine?: string;
  hubName?: string;
  area?: string;
  shortDescription?: string;
  coverImage?: string;
  isHalal?: boolean;
  tags?: string[];
  href: string;
};

export type ReviewStatus = "pending" | "approved" | "rejected";

export type ReviewDoc = {
  id: string;
  restaurantId: string;
  userId: string;
  displayName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title?: string;
  reviewText: string;
  status: ReviewStatus;
  moderatedBy?: string;
  moderatedAt?: unknown;
  moderationNote?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type ArticleStatus = "draft" | "published";

export type ArticleDoc = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  /** Body content stored as plain text / simple markdown-like paragraphs
   *  separated by blank lines — rendered as paragraphs, not raw HTML,
   *  so author-entered text can never inject markup. */
  body: string;
  authorName: string;
  heroImage?: string;
  category: string;
  tags?: string[];
  relatedCuisineSlugs?: string[];
  relatedRestaurantIds?: string[];
  relatedHubSlugs?: string[];
  status: ArticleStatus;
  isFeatured?: boolean;
  publishedAt?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  seoTitle?: string;
  seoDescription?: string;
};

export type RecommendationType =
  | "editors_choice"
  | "dish_of_the_week"
  | "hidden_gem"
  | "worth_the_journey"
  | "family_favourite"
  | "budget_favourite"
  | "traditional_favourite"
  | "vegetarian_discovery"
  | "halal_discovery"
  | "special_occasion";

export type RecommendationTargetType =
  | "restaurant"
  | "dish"
  | "cuisine"
  | "hub"
  | "article";

export type RecommendationDoc = {
  id: string;
  type: RecommendationType;
  targetType: RecommendationTargetType;
  /** For a restaurant/cuisine/hub/article target, the id or slug of that
   *  entity. For a "dish" target, `dishName` carries the label instead. */
  targetId?: string;
  dishName?: string;
  /** Denormalised label + blurb so the homepage/recommendations page can
   *  render without an extra lookup per card. */
  title: string;
  blurb: string;
  linkHref: string;
  image?: string;
  isActive: boolean;
  sortOrder?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
};