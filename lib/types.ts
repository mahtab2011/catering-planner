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

  /* ---- Ownership claim — see docs/RESTAURANT-CLAIM-WORKFLOW.md ----
   * PUBLIC WORKFLOW STATE ONLY. Claimant identity/contact details
   * (name, business email, phone, role, verification note) and claim
   * decision audit trail (submittedAt/decidedAt/decidedBy) live
   * exclusively in the private `restaurant_claims` collection
   * (`RestaurantClaimDoc` below) — never on this document. This
   * document is publicly readable for any active/pending restaurant
   * (Firestore has no field-level rules — the whole document or
   * nothing), so anything placed here is effectively public. Task K
   * moved claimant PII off this type after Task J's audit found it
   * was previously stored here and therefore retrievable by any
   * unauthenticated Firestore client, despite never being rendered by
   * any UI — see docs/PRODUCTION-READINESS-AUDIT.md's "J-01". Do not
   * add claimant PII back here; add it to `RestaurantClaimDoc`
   * instead. */
  ownerClaimStatus?: RestaurantOwnerClaimStatus;

  /** Owner-approved translations of THIS restaurant's OWN supplied
   *  content — see docs/MULTILINGUAL-ARCHITECTURE.md's "Restaurant-
   *  supplied content" policy and RestaurantTranslationRequestDoc
   *  below. Populated ONLY once a translation request for that locale
   *  has actually reached `PUBLISHED` — never auto-generated, never
   *  machine-translated, never partial-and-shown-as-if-complete.
   *  Absent for a given locale means exactly what it should: show the
   *  original (canonical) content unchanged in that locale. This is
   *  the data architecture only — no pricing/payment is implemented
   *  anywhere in this codebase, and nothing currently writes to this
   *  field (no restaurant has ever requested or received a paid
   *  translation). */
  contentTranslations?: Partial<Record<LocaleCode, RestaurantContentTranslation>>;

  /* ---- Live owner-workspace fields — Task F/G ----
   * These are read and written by app/restaurants/[id]/edit/page.tsx
   * and app/[locale]/restaurants/[id]/page.tsx today, but predate this
   * type and were never declared here — both pages use their own
   * local, ad hoc RestaurantDoc-shaped type instead of importing this
   * one. Declared here additively (Task G) so this type accurately
   * reflects what the live document actually contains and so new code
   * (tests, the field/capability matrix) has one canonical source
   * instead of a third copy — see docs/RESTAURANT-OWNER-WORKSPACE.md.
   * Nothing about the edit/public pages' own local types was changed;
   * this is documentation-by-typing, not a behavior change. Several of
   * these overlap in meaning with an earlier-declared field under a
   * different name (e.g. `isHalal` here vs `halal` above, `coverImage`
   * here vs `imageUrl` above) — both are kept, matching this file's
   * existing pattern for `dietaryAttributes`/`dietaryCertifications`,
   * rather than silently renaming/merging live data on a guess.
   */
  /** Status a restaurant listing has — REQUIRED reading for
   *  firestore.rules (`resource.data.status in ['active','pending']`
   *  gates public read; `status != 'blocked'` gates owner edits) even
   *  though it was never declared on this type before Task G. */
  status?: RestaurantStatus;
  ownerName?: string;
  /** Legacy single-hub-by-id/name fields, distinct from the
   *  structured `hubIds: string[]` above — the owner workspace only
   *  ever manages these, never `hubIds`. Whether that's an intentional
   *  admin-only/curatorial decision or a gap was not determined this
   *  task — see docs/RESTAURANT-OWNER-WORKSPACE.md's "known
   *  limitations." */
  hubId?: string;
  hubName?: string;
  area?: string;
  locationId?: string;
  /** Legacy single-line address, distinct from `addressLine1`/
   *  `addressLine2` above — the owner workspace only manages this. */
  fullAddress?: string;
  /** Owner-entered free text, never translated — see
   *  docs/MULTILINGUAL-ARCHITECTURE.md's restaurant-supplied-content
   *  policy. Distinct from the platform-controlled `cuisineSlugs`/
   *  `dietaryAttributes` vocabularies. */
  tags?: string[];
  priceRange?: string;
  /** Owner-supplied content, distinct from the shorter `description`
   *  field above — the live edit/public pages use these, not
   *  `description`. Never auto-translated; see
   *  `contentTranslations` above for the only sanctioned translation
   *  path. */
  shortDescription?: string;
  longDescription?: string;
  popularItems?: string[];
  /** Legacy media field names, distinct from `imageUrl`/`logoUrl`
   *  above — the live edit/public pages use these. See
   *  docs/RESTAURANT-OWNER-WORKSPACE.md's media section: there is no
   *  Firebase Storage upload anywhere in this codebase; these are
   *  plain owner-entered URLs. */
  coverImage?: string;
  videoUrl?: string;
  websiteUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  /** The restaurant workspace's actual live opening-hours
   *  representation — free text, not the structured
   *  `openingHours: Record<string,string>` declared above, which is
   *  unused dead scaffolding (never read or written anywhere in this
   *  codebase, confirmed by repo-wide search — Task G). */
  openingHoursText?: string;
  /** Legacy per-flag service booleans, distinct from the structured
   *  `serviceTypes: ServiceType[]` above — the owner workspace only
   *  manages these booleans, never `serviceTypes`. */
  dineIn?: boolean;
  takeaway?: boolean;
  delivery?: boolean;
  collectionEnabled?: boolean;
  /** Distinct from `halal` above (same meaning, different field name
   *  — both live in the data, kept rather than merged). */
  isHalal?: boolean;
  isHmcApproved?: boolean;
  isPremium?: boolean;
  subscriptionPlan?: "free" | "premium";
  offersEnabled?: boolean;
  loyaltyEnabled?: boolean;
  adsEnabled?: boolean;
  /** The live, actually-used inline menu — see `MenuCategory` below.
   *  `RestaurantMenuCategoryDoc`/`RestaurantMenuItemDoc` elsewhere in
   *  this file model a normalized, separate-collection menu that is
   *  entirely unused dead scaffolding (no collection, no rule, no UI
   *  references it anywhere — confirmed by repo-wide search, Task G).
   *  This inline array is the real thing. */
  menuCategories?: MenuCategory[];

  createdAt?: unknown;
  updatedAt?: unknown;
};

/** A restaurant listing's status — see the `status` field's own
 *  comment on `RestaurantDoc` for why this is documented here despite
 *  being load-bearing for firestore.rules. */
export type RestaurantStatus = "draft" | "active" | "pending" | "blocked";

/** One item on a restaurant's inline menu — owner-supplied name/price/
 *  note, never auto-translated. See `RestaurantDoc.menuCategories`. */
export type MenuItem = {
  name: string;
  price: string;
  note?: string;
};

/** One category on a restaurant's inline menu. */
export type MenuCategory = {
  category: string;
  items: MenuItem[];
};

/** One locale's owner-approved translation of a restaurant's own
 *  supplied content. Every field is optional — a translation can be
 *  partial (e.g. the description translated but not an alternative
 *  name) without that meaning anything is auto-filled for the rest;
 *  see getLocalizedRestaurantContent() in lib/restaurantTranslations.ts
 *  for exactly how a partial translation falls back. */
export type RestaurantContentTranslation = {
  /** Only set if the restaurant explicitly supplied/approved an
   *  alternative localized name for this locale — most restaurants
   *  will never set this, and the canonical `RestaurantDoc.name` is
   *  shown instead. Never auto-transliterated or auto-translated. */
  name?: string;
  shortDescription?: string;
  longDescription?: string;
};

/**
 * Status of a restaurant owner's request to have their own content
 * translated into one or more locales — see
 * docs/MULTILINGUAL-ARCHITECTURE.md and
 * docs/RESTAURANT-TRANSLATION-WORKFLOW section there. This is the
 * DATA ARCHITECTURE for a future paid-translation product; no
 * pricing, payment processing, or currency logic is implemented
 * anywhere in this codebase — `quotedAmount`/`quotedCurrency` are
 * plain stored values an admin/ops process would fill in by hand,
 * not computed or charged by anything here.
 *
 *   REQUESTED        — the owner asked for a translation. Only status
 *                       a client (the restaurant's own owner) may ever
 *                       set directly — see firestore.rules.
 *   QUOTED            — an admin/ops process has set a price (a plain
 *                       stored value, never invented/computed here).
 *   PAYMENT_PENDING   — quote accepted, awaiting payment (no payment
 *                       processing exists in this codebase — this
 *                       status exists for a future integration to set).
 *   IN_TRANSLATION    — payment received, translation work underway.
 *   OWNER_REVIEW      — a translation exists but is not yet approved
 *                       by the restaurant — `contentTranslations` on
 *                       RestaurantDoc must NOT be written yet at this
 *                       stage.
 *   PUBLISHED         — the owner approved it; only now may
 *                       `RestaurantDoc.contentTranslations` for this
 *                       locale actually be set.
 *   CANCELLED         — the owner or an admin ended the request before
 *                       publication (e.g. declined a quote). Terminal,
 *                       like PUBLISHED — never silently retried.
 */
export type RestaurantTranslationRequestStatus =
  | "REQUESTED"
  | "QUOTED"
  | "PAYMENT_PENDING"
  | "IN_TRANSLATION"
  | "OWNER_REVIEW"
  | "PUBLISHED"
  | "CANCELLED";

export type RestaurantTranslationRequestDoc = {
  id: string;
  restaurantId: string;
  /** Uid of the restaurant's owner who requested this — must equal
   *  the target restaurant's own `ownerUid` at request time (see
   *  firestore.rules), so only an actual owner can request a
   *  translation of their own listing. */
  requestedByUid: string;
  targetLocales: LocaleCode[];
  status: RestaurantTranslationRequestStatus;
  /** Plain stored values, never computed/charged by this codebase —
   *  see this type's own doc comment above. */
  quotedAmount?: number;
  quotedCurrency?: CurrencyCode;
  requestedAt?: unknown;
  quotedAt?: unknown;
  paymentReceivedAt?: unknown;
  translationStartedAt?: unknown;
  ownerReviewRequestedAt?: unknown;
  publishedAt?: unknown;
  cancelledAt?: unknown;
  /** Free-text notes for the admin/ops process handling this request
   *  — never shown to the public. */
  notes?: string;
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
import type { LocaleCode } from "./locales";

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

/** An individual ownership claim's own lifecycle — distinct from
 *  `RestaurantOwnerClaimStatus` (the restaurant's overall, public
 *  claim-workflow phase: "has this restaurant ever been claimed, and
 *  is a claim currently pending"). A claim record only exists once
 *  someone has actually submitted one, so there is no "unclaimed"
 *  value here — that's the absence of a claim, not a state of one. */
export type RestaurantClaimStatus = "pending" | "approved" | "rejected";

/** The private record of a single restaurant-ownership claim — see
 *  docs/RESTAURANT-CLAIM-WORKFLOW.md and
 *  docs/PRODUCTION-READINESS-AUDIT.md's "J-01". Holds the claimant's
 *  identity/contact details, which used to live inline on the public
 *  `RestaurantDoc` (a real privacy defect Task K fixed — any
 *  active/pending restaurant's entire document, including that data,
 *  was retrievable by an unauthenticated Firestore client, since
 *  Firestore has no field-level rules). Never publicly readable —
 *  see firestore.rules' `restaurant_claims` block: only the claimant
 *  themselves and admins may read a given record, and only an admin
 *  may ever change its `status` or record a decision.
 *
 *  A claim submission creates this document AND sets
 *  `restaurants/{restaurantId}.ownerClaimStatus = 'claim_pending'` in
 *  one client-side Firestore WriteBatch (atomic — both succeed or
 *  neither does) — see `components/restaurants/RestaurantClaimPanel.tsx`.
 *  Approving/rejecting similarly batches this document's `status`
 *  update together with the restaurant document's own
 *  `ownerClaimStatus` (and, on approval, `ownerUid`) update — see
 *  `app/admin/restaurant-claims/page.tsx`. */
export type RestaurantClaimDoc = {
  id: string;
  restaurantId: string;
  /** Must equal the uid of whoever created this document — enforced
   *  by firestore.rules, never trusted from the client alone. */
  claimantUid: string;
  /** Required at submission — the two things an admin actually needs
   *  to evaluate and reach a real claimant. */
  claimantName: string;
  claimantContactEmail: string;
  /** Optional context — never identity-document verification, see
   *  docs/RESTAURANT-CLAIM-WORKFLOW.md's "What this task did not do". */
  claimantRole?: string;
  claimantContactPhone?: string;
  claimantNote?: string;
  status: RestaurantClaimStatus;
  submittedAt?: unknown;
  decidedAt?: unknown;
  /** Uid of the admin who approved/rejected this claim — an audit
   *  trail field, not an authorization source. */
  decidedBy?: string;
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

/** A human-translated version of an article's reader-facing text. Any
 *  subset of fields may be present — a translator may only have done
 *  the title and excerpt so far, for instance — see
 *  getLocalizedArticleContent() in lib/articles.ts for exactly how
 *  partial translations fall back to the canonical English fields. */
export type ArticleTranslation = {
  title?: string;
  excerpt?: string;
  body?: string;
};

export type ArticleDoc = {
  id: string;
  slug: string;
  /** Canonical identity + English content — every article has this,
   *  regardless of which locales it's also been translated into. */
  title: string;
  excerpt: string;
  /** Body content stored as plain text / simple markdown-like paragraphs
   *  separated by blank lines — rendered as paragraphs, not raw HTML,
   *  so author-entered text can never inject markup. */
  body: string;
  /** Optional per-locale human translations, keyed by LocaleCode (see
   *  lib/locales.ts). One article, one canonical identity/slug — never
   *  a duplicate document per language. Not every locale needs an
   *  entry, and an entry doesn't need every field — see
   *  ArticleTranslation and getLocalizedArticleContent() in
   *  lib/articles.ts. Never machine-translated: only real,
   *  human-reviewed copy belongs here (same rule as
   *  Cuisine.localizedName and FoodHub.description). Never applies to
   *  customer reviews, which are a different collection entirely and
   *  are never translated as if they were editorial content. */
  translations?: Partial<Record<LocaleCode, ArticleTranslation>>;
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