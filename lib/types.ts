export type UserRole =
  | "customer"
  | "restaurant"
  | "caterer"
  | "supplier"
  | "household"
  | "admin";

export type CountryCode = "UK" | "BD";

/* =========================================================
   CITY — multi-city discovery architecture

   London Food Hubs is the first implementation. This type exists so
   the discovery domain (hubs, restaurants, cuisines, reviews,
   articles, recommendations, language/dietary defaults) is modelled
   as belonging to a city rather than being implicitly "London" —
   without building any other city's routes, pages or data yet.
   Adding a second city later means adding one more entry to
   lib/cities.ts; it should not require changing these types again.
========================================================= */

/** A city food-discovery edition. Only "london" is active today —
 *  see lib/cities.ts. Everything else in the discovery domain
 *  (FoodHub, restaurants, reviews, articles, recommendations) refers
 *  to a city by its `slug`, never by name, so a city can be renamed
 *  without touching every record that belongs to it. */
export type City = {
  id: string;
  slug: string;
  name: string;
  /** ISO 3166-1 alpha-2 or a short display code — deliberately not
   *  constrained to the existing narrow CountryCode union above,
   *  which only covers the two countries SmartServeUK's operational
   *  side currently serves (UK/BD) and is out of scope to widen here. */
  countryCode: string;
  currencyCode: CurrencyCode;
  /** Languages this city edition should prioritise in its language
   *  switcher / default detection, most-important first. Distinct
   *  cities can prioritise differently (e.g. Paris would lead with
   *  fr, Makkah/Madinah with ar) without changing the shared
   *  AppLanguage type in lib/i18n.ts that lists what's translatable
   *  at all. */
  priorityLanguages: AppLanguage[];
  /** Which structured dietary filters this city edition should
   *  surface prominently in discovery UI (e.g. filter chips). Every
   *  attribute in DietaryAttribute is always supported everywhere —
   *  this only controls what's *featured* for this city, the same
   *  way isFeatured works for hubs/cuisines. */
  prominentDietaryFilters: DietaryAttribute[];
  /** Optional: cuisine slugs (from lib/cuisines.ts) this city edition
   *  wants to feature first. Cuisines themselves are not city-scoped
   *  — a cuisine like "Turkish" is the same concept in every city —
   *  this is purely an editorial ordering hint for that city's UI. */
  prominentCuisineSlugs?: string[];
  isActive: boolean;
  seoTitle: string;
  seoDescription: string;
};

/**
 * Structured dietary attributes. These are explicit, self-declared
 * facts about a business or a dish — NEVER inferred from a cuisine
 * (e.g. "Indian" does not imply vegetarian) or from customer reviews
 * (a reviewer saying "great vegan options" is not the same as the
 * business declaring vegan availability). Every place this type is
 * used should be a plain stored value the business/admin entered,
 * not a computed one.
 */
export type DietaryAttribute =
  | "vegetarian"
  | "vegan"
  | "non_vegetarian"
  | "halal"
  | "kosher"
  | "jain";

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
  /** References a City.slug from lib/cities.ts. Optional alongside
   *  the existing free-text `city` display field rather than
   *  replacing it, since this type isn't currently backed by a live
   *  Firestore collection (hubs are served from lib/hubs.ts) — see
   *  docs/MULTI-CITY-ARCHITECTURE.md. */
  citySlug?: string;
  areaLabel: string;
  description?: string;
  isActive: boolean;
  sortOrder?: number;
  heroImageUrl?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

/**
 * How a restaurant record entered the platform. Set once at creation
 * and not expected to change afterwards — see
 * docs/RESTAURANT-DATA-PROVENANCE.md for the full model and exactly
 * what each value means and who is allowed to set it.
 */
export type RestaurantSourceType =
  | "restaurant_submitted"
  | "owner_claimed"
  | "open_data"
  | "licensed_provider"
  | "official_public_source"
  | "editorial_research";

/** How much this record's factual accuracy can currently be trusted.
 *  A plain stored value set by an admin/moderation process — never
 *  computed from ratings, review sentiment, or popularity. */
export type RestaurantDataConfidence = "verified" | "unverified" | "flagged";

/** Where a restaurant's ownership claim stands. "unclaimed" is the
 *  default for any restaurant with no `ownerUid` (mainly editorial /
 *  imported records — see docs/RESTAURANT-IMPORT-PIPELINE.md).
 *  "claim_pending" means a `claimantUid` has been submitted but not
 *  yet reviewed. Only an admin moving a record to "claimed" may also
 *  set `ownerUid` — see docs/RESTAURANT-CLAIM-WORKFLOW.md and the
 *  matching firestore.rules branch; no client path can set `ownerUid`
 *  any other way. */
export type RestaurantOwnerClaimStatus =
  | "unclaimed"
  | "claim_pending"
  | "claimed"
  | "claim_rejected";

/** Where a piece of media (a photo, a logo) actually came from —
 *  distinct from data provenance because a business can be
 *  owner-claimed while still using a platform-created cover photo, or
 *  vice versa. See docs/RESTAURANT-DATA-PROVENANCE.md. */
export type MediaProvenance =
  | "owner_uploaded"
  | "platform_created"
  | "licensed"
  | "open_license";

export type MediaAsset = {
  url: string;
  provenance: MediaProvenance;
  /** Required in practice (not type-enforced) when provenance is
   *  "licensed" or "open_license" — the attribution/license text that
   *  license requires displaying alongside the image. */
  attribution?: string;
  uploadedAt?: unknown;
};

export type RestaurantDoc = {
  id: string;
  ownerUid: string;
  name: string;
  slug: string;
  cuisine?: string;
  /** Canonical, language-independent cuisine slugs (keys into
   *  lib/cuisines.ts's CUISINES) this restaurant genuinely serves. A
   *  restaurant can belong to more than one cuisine (e.g. an "Indian
   *  / Pakistani grill") — list every slug that applies. Distinct
   *  cuisines (Bangladeshi and Indian, for example) must never be
   *  collapsed into one slug just because a restaurant serves both;
   *  add both. This is the structured companion to the free-text
   *  `cuisine` field above, which stays for backward compatibility
   *  and for restaurants that haven't been re-tagged yet. */
  cuisineSlugs?: string[];
  /** The single most representative entry from `cuisineSlugs`, used
   *  wherever only one cuisine can be displayed (card badges, the
   *  hero cuisine label). Must be one of `cuisineSlugs` when both are
   *  present. */
  primaryCuisineSlug?: string;
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  /** References a City.slug from lib/cities.ts — the structured
   *  companion to the free-text `city` field above. Defaults to
   *  "london" for every restaurant today, since London is the only
   *  active city edition. */
  citySlug?: string;
  postcode?: string;
  countryCode: CountryCode;
  hubIds: string[];
  serviceTypes: ServiceType[];
  halal?: boolean;
  /** Structured, self-declared dietary attributes for the whole
   *  business (as opposed to a single dish) — see DietaryAttribute.
   *  Additive alongside the legacy `halal` boolean above, which stays
   *  for backward compatibility rather than being removed. */
  dietaryAttributes?: DietaryAttribute[];
  /** @deprecated Renamed to `dietaryAttributes` — this name
   *  misleadingly implied every entry was a formal third-party
   *  certification, when most (e.g. "vegetarian", "non_vegetarian")
   *  are just a self-declared fact. Kept, additively, so existing
   *  documents and earlier docs referencing this name keep working;
   *  lib/dietary.ts's buildDietaryBadgeLabels() reads both fields.
   *  New code should read/write `dietaryAttributes` only. */
  dietaryCertifications?: DietaryAttribute[];
  openingHours?: Record<string, string>;
  imageUrl?: string;
  logoUrl?: string;
  /** Optional richer media list with per-asset provenance — additive
   *  alongside `imageUrl`/`logoUrl`, not a replacement for them. */
  mediaAssets?: MediaAsset[];
  isFeatured?: boolean;
  isApproved?: boolean;
  isActive?: boolean;

  /* ---- Data provenance — see docs/RESTAURANT-DATA-PROVENANCE.md ---- */
  sourceType?: RestaurantSourceType;
  /** Human-readable name of the source (e.g. "Restaurant self-signup
   *  form", "Camden Council food hygiene open dataset", "Editorial
   *  research — London Food Hubs team"). Required in practice for any
   *  non-"restaurant_submitted" sourceType — see the provenance doc. */
  sourceName?: string;
  /** Public URL of the source record, when the source is an external
   *  dataset or official page. Never a competitor listing page — see
   *  docs/RESTAURANT-IMPORT-PIPELINE.md's prohibited-sources list. */
  sourceUrl?: string;
  sourceRetrievedAt?: unknown;
  /** Last time an admin (or the owning business) confirmed this
   *  record's core facts are still accurate. Distinct from
   *  `updatedAt`, which changes on every edit regardless of whether
   *  anything was actually re-verified. */
  lastVerifiedAt?: unknown;
  dataConfidence?: RestaurantDataConfidence;

  /* ---- Ownership claim — see docs/RESTAURANT-CLAIM-WORKFLOW.md ---- */
  ownerClaimStatus?: RestaurantOwnerClaimStatus;
  /** Uid of the user who submitted an ownership claim. Deliberately
   *  separate from `ownerUid` — submitting a claim never grants edit
   *  access by itself. Only an admin approving the claim may also set
   *  `ownerUid`; no client-writable path can set `ownerUid` from
   *  `claimantUid` directly (see firestore.rules). */
  claimantUid?: string;
  claimSubmittedAt?: unknown;
  claimDecidedAt?: unknown;
  /** Uid of the admin who approved/rejected the claim — an audit
   *  trail field, not an authorization source. */
  claimDecidedBy?: string;

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
  /** Structured, self-declared per-dish dietary attributes — a
   *  restaurant that isn't wholly vegetarian can still tag individual
   *  dishes. Never inferred from the dish name/cuisine. */
  dietaryAttributes?: DietaryAttribute[];
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
  /** Optional human-translated display names, keyed by locale. The
   *  `slug` (and Firestore/route identity) never changes based on
   *  language — this is purely a display override so a cuisine is one
   *  entity everywhere, not a duplicated entity per language. Only
   *  populate a locale here once real, human-reviewed copy exists for
   *  it; an absent locale falls back to `name` (English). */
  localizedName?: LocalizedText;
  /** Broad geographic/cultural grouping — this is deliberately reused
   *  as the parent-grouping mechanism the taxonomy needs (South
   *  Asian, Middle Eastern, etc.): it supplements individual cuisines
   *  for browsing/variety, it never replaces or merges them (e.g.
   *  Bangladeshi and Indian both sit under "South Asian" but remain
   *  distinct cuisine entries with their own slugs). See
   *  docs/CUISINE-TAXONOMY.md. */
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
  /** References a City.slug from lib/cities.ts. Every hub belongs to
   *  exactly one city — today that's always "london", the only
   *  active city edition, but the field is a slug (not a literal
   *  "London" type) so a second city edition doesn't require
   *  changing this type. */
  citySlug: string;
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
  /** Structured, language-independent cuisine slugs — see the matching
   *  field on RestaurantDoc. */
  cuisineSlugs?: string[];
  primaryCuisineSlug?: string;
  /** References a City.slug from lib/cities.ts. */
  citySlug?: string;
  hubName?: string;
  area?: string;
  shortDescription?: string;
  coverImage?: string;
  isHalal?: boolean;
  /** Structured, self-declared dietary attributes — see
   *  DietaryAttribute. Additive alongside `isHalal`, not a
   *  replacement for it. */
  dietaryAttributes?: DietaryAttribute[];
  /** @deprecated Renamed to `dietaryAttributes` — see the matching
   *  field on RestaurantDoc for why. */
  dietaryCertifications?: DietaryAttribute[];
  dataConfidence?: RestaurantDataConfidence;
  tags?: string[];
  href: string;
};

/** A moderation-queue request from a member of the public asking for
 *  a restaurant's details to be corrected, or for the listing to be
 *  removed entirely. Never applied automatically — see
 *  docs/RESTAURANT-CLAIM-WORKFLOW.md, which covers this alongside the
 *  ownership claim flow since both are "someone other than the
 *  current owner asking to change a listing" requests reviewed by the
 *  same admin queue. */
export type RestaurantRequestType = "correction" | "removal";
export type RestaurantRequestStatus = "pending" | "accepted" | "rejected";

export type RestaurantCorrectionRequestDoc = {
  id: string;
  restaurantId: string;
  requestType: RestaurantRequestType;
  submittedByUid: string;
  submittedByEmail?: string;
  /** For requestType "correction": plain-text description of which
   *  field is wrong and what it should say instead. Deliberately
   *  free-text rather than a strict per-field enum, since a correction
   *  can touch anything from a phone number to opening hours to the
   *  cuisine tagging. */
  fieldDescription?: string;
  currentValueNote?: string;
  suggestedValueNote?: string;
  /** For requestType "removal": why the requester believes the
   *  listing shouldn't exist (e.g. "permanently closed", "duplicate
   *  of another listing", "not a real business"). */
  reasonNote?: string;
  status: RestaurantRequestStatus;
  moderatedBy?: string;
  moderatedAt?: unknown;
  moderationNote?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
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
  /** References a City.slug from lib/cities.ts. Optional — many
   *  articles (a cuisine guide, a general "what to eat" piece) are
   *  reusable across cities and shouldn't be forced to pick one;
   *  set this only for genuinely city-specific pieces (a hub
   *  spotlight, "New in [City]"). */
  citySlug?: string;
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
  /** References a City.slug from lib/cities.ts. Optional — a
   *  restaurant/hub target already implies a city through its own
   *  record, so this is mainly useful for cuisine/dish-type
   *  recommendations that want to be scoped to one city edition's
   *  homepage rather than shown everywhere. */
  citySlug?: string;
  isActive: boolean;
  sortOrder?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
};