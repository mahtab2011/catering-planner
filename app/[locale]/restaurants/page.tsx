"use client";

import NextLink from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import RestaurantCard from "@/components/restaurants/RestaurantCard";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { buildDietaryBadgeAttributes, DIETARY_ATTRIBUTES, DIETARY_ATTRIBUTE_TRANSLATION_KEY } from "@/lib/dietary";
import { CUISINE_REGION_ORDER, getAllCuisines, getCuisineBySlug, getCuisineDisplayName } from "@/lib/cuisines";
import { getLocalizedRestaurantContent } from "@/lib/restaurantTranslations";
import { belongsToActiveCity } from "@/lib/cities";
import { restaurantHasDietaryAttribute, restaurantOffersService, type ServiceFilterValue } from "@/lib/restaurantDiscoveryFilters";
import type { Cuisine, DietaryAttribute, RestaurantContentTranslation } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import SiteHeader from "@/components/discovery/SiteHeader";
import SiteFooter from "@/components/discovery/SiteFooter";

type ServiceFilter = ServiceFilterValue;

type LiveRestaurant = {
  id: string;
  name: string;
  slug?: string;
  ownerUid?: string;
  ownerName?: string;
  phone?: string;
  email?: string;

  hubId?: string;
  hubName?: string;
  area?: string;
  locationId?: string;
  postcode?: string;
  fullAddress?: string;

  cuisine?: string;
  cuisineSlugs?: string[];
  tags?: string[];
  priceRange?: string;
  citySlug?: string;

  // Trusted aggregate maintained by a Cloud Function from approved
  // reviews only (see functions/index.js) — never written by a client.
  rating?: number;
  reviewCount?: number;

  shortDescription?: string;
  longDescription?: string;
  popularItems?: string[];

  coverImage?: string;
  videoUrl?: string;

  websiteUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;

  openingHoursText?: string;

  dineIn?: boolean;
  takeaway?: boolean;
  delivery?: boolean;
  collectionEnabled?: boolean;

  isHalal?: boolean;
  dietaryAttributes?: DietaryAttribute[];
  dietaryCertifications?: DietaryAttribute[];
  isHmcApproved?: boolean;

  isPremium?: boolean;
  subscriptionPlan?: "free" | "premium";
  offersEnabled?: boolean;
  loyaltyEnabled?: boolean;
  adsEnabled?: boolean;

  status?: "draft" | "active" | "pending" | "blocked";

  /** See docs/MULTILINGUAL-ARCHITECTURE.md — owner-approved
   *  translations only, never auto-translated. */
  contentTranslations?: Partial<Record<string, RestaurantContentTranslation>>;

  createdAt?: any;
  updatedAt?: any;
};

const hubOrder = [
  "Brick Lane",
  "Upmarket Brick Lane",
  "Green Street / Plashet Road",
  "Westfield Stratford City",
  "Stratford Centre",
  "Boxpark Croydon",
];

const cuisinePriority: Record<string, string[]> = {
  "Brick Lane": [
    "Bangladeshi", "Indian", "Pakistani", "Chinese", "Turkish", "Italian",
    "Mixed / Fusion", "Global Street Food",
  ],
  "Upmarket Brick Lane": [
    "Global Street Food", "Bangladeshi", "Japanese", "Italian", "Chinese",
    "Turkish", "Mixed / Fusion",
  ],
  "Green Street / Plashet Road": [
    "Bangladeshi", "Indian", "Pakistani", "Italian", "Turkish", "Mixed / Fusion",
  ],
  "Westfield Stratford City": [
    "Global Street Food", "Italian", "Japanese", "Chinese", "Middle Eastern", "Mixed / Fusion",
  ],
  "Stratford Centre": ["Bangladeshi", "Turkish", "Global Street Food", "Mixed / Fusion"],
  "Boxpark Croydon": ["Global Street Food", "Mixed / Fusion", "Italian", "Japanese", "Middle Eastern"],
};

const preferredCuisineOrder = [
  "Bangladeshi", "Indian", "Pakistani", "Turkish", "Chinese", "Japanese",
  "Italian", "Global Street Food", "Middle Eastern", "Mixed / Fusion",
];

function safeText(value?: string) {
  return (value || "").trim();
}

function normalizeText(value?: string) {
  return safeText(value).toLowerCase();
}

function uniqueStrings(values: (string | undefined)[]) {
  return Array.from(new Set(values.map((v) => safeText(v)).filter(Boolean)));
}

function orderHubs(hubs: string[]) {
  return [
    ...hubOrder.filter((hub) => hubs.includes(hub)),
    ...hubs.filter((hub) => !hubOrder.includes(hub)).sort((a, b) => a.localeCompare(b)),
  ];
}

function orderCuisines(cuisines: string[], hub?: string) {
  const priority = hub ? cuisinePriority[hub] || [] : preferredCuisineOrder;
  return [
    ...priority.filter((c) => cuisines.includes(c)),
    ...cuisines.filter((c) => !priority.includes(c)).sort((a, b) => a.localeCompare(b)),
  ];
}

/** Individual cuisine names for a restaurant, for filtering — prefers
 *  the structured `cuisineSlugs` (resolved to canonical names via
 *  lib/cuisines.ts), and falls back to splitting the legacy free-text
 *  `cuisine` field on "/" for restaurants that haven't been tagged
 *  with the canonical taxonomy yet. */
function restaurantCuisineNames(restaurant: { cuisineSlugs?: string[]; cuisine?: string }): string[] {
  if (restaurant.cuisineSlugs && restaurant.cuisineSlugs.length > 0) {
    return restaurant.cuisineSlugs
      .map((slug) => getCuisineBySlug(slug)?.name)
      .filter((name): name is string => Boolean(name));
  }
  return safeText(restaurant.cuisine).split("/").map((part) => part.trim()).filter(Boolean);
}

/** Which parent regions a restaurant's cuisines belong to — used for
 *  the "regional cuisine group" filter (e.g. "South Asian"), which
 *  supplements the specific-cuisine filter rather than replacing it —
 *  see docs/CUISINE-TAXONOMY.md. Resolved from cuisineSlugs when
 *  present; falls back to matching the legacy free-text `cuisine`
 *  field against each cuisine's matchTerms for untagged restaurants. */
function restaurantRegions(restaurant: { cuisineSlugs?: string[]; cuisine?: string }, allCuisines: Cuisine[]): string[] {
  if (restaurant.cuisineSlugs && restaurant.cuisineSlugs.length > 0) {
    return Array.from(
      new Set(
        restaurant.cuisineSlugs
          .map((slug) => getCuisineBySlug(slug)?.region)
          .filter((region): region is Cuisine["region"] => Boolean(region))
      )
    );
  }
  const text = normalizeText(restaurant.cuisine);
  if (!text) return [];
  return Array.from(
    new Set(
      allCuisines
        .filter((c) => c.matchTerms.some((term) => text.includes(term.toLowerCase())))
        .map((c) => c.region)
    )
  );
}

export default function RestaurantsPage() {
  return (
    <Suspense fallback={null}>
      <RestaurantsPageContent />
    </Suspense>
  );
}

function RestaurantsPageContent() {
  const t = useTranslations("Restaurants");
  const tDetail = useTranslations("RestaurantDetail");
  const tDietary = useTranslations("Dietary");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [restaurants, setRestaurants] = useState<LiveRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [selectedHub, setSelectedHub] = useState(searchParams.get("hub") || "All");
  const [selectedCuisine, setSelectedCuisine] = useState(searchParams.get("cuisine") || "All");
  const [selectedRegion, setSelectedRegion] = useState(searchParams.get("region") || "All");
  const [selectedDietary, setSelectedDietary] = useState<"All" | DietaryAttribute>(
    (searchParams.get("dietary") as DietaryAttribute | null) || "All"
  );
  const [selectedService, setSelectedService] = useState<ServiceFilter>(
    (searchParams.get("service") as ServiceFilter | null) || "All"
  );
  const [selectedStatus, setSelectedStatus] = useState("active");

  const allCuisineDefs = useMemo(() => getAllCuisines(), []);

  const serviceLabel: Record<Exclude<ServiceFilter, "All">, string> = {
    dineIn: tDetail("dineIn"),
    takeaway: tDetail("takeaway"),
    delivery: tDetail("delivery"),
    collection: tDetail("collection"),
  };

  // Reflects the active filters/search in the URL so a reload or a
  // shared link reproduces the same view — see
  // docs/RESTAURANT-DISCOVERY.md's "URL state" section. Shallow
  // (`replace`, no history entry per keystroke) and locale-safe (uses
  // the app/[locale] navigation wrapper, not next/navigation
  // directly), so it never drops the current locale prefix.
  useEffect(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (selectedHub !== "All") params.set("hub", selectedHub);
    if (selectedCuisine !== "All") params.set("cuisine", selectedCuisine);
    if (selectedRegion !== "All") params.set("region", selectedRegion);
    if (selectedDietary !== "All") params.set("dietary", selectedDietary);
    if (selectedService !== "All") params.set("service", selectedService);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectedHub, selectedCuisine, selectedRegion, selectedDietary, selectedService]);

  /** Canonical English cuisine name -> localized display name, for
   *  the filter dropdown's labels. The dropdown's underlying value
   *  stays the canonical name (matching what restaurantCuisineNames()
   *  produces), so filtering itself doesn't depend on UI language —
   *  only the label a user sees does. */
  const cuisineDisplayNameByCanonicalName = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of allCuisineDefs) map.set(c.name, getCuisineDisplayName(c, locale));
    return map;
  }, [allCuisineDefs, locale]);

  useEffect(() => {
    async function loadRestaurants() {
      try {
        setLoading(true);
        const q = query(collection(db, "restaurants"), where("status", "in", ["active", "pending"]));
        const snap = await getDocs(q);
        const rows: LiveRestaurant[] = snap.docs.map((docSnap) => {
          const data = docSnap.data() as Omit<LiveRestaurant, "id">;
          return { id: docSnap.id, ...data };
        });
        // London is the only active launch city — see
        // docs/RESTAURANT-DISCOVERY.md. Filtered client-side (not via
        // a Firestore `where`) so this never requires a new composite
        // index, and so restaurants that predate `citySlug` (treated
        // as belonging to the active city — see
        // belongsToActiveCity()) still show up.
        setRestaurants(rows.filter((r) => belongsToActiveCity(r.citySlug)));
      } catch (error) {
        console.error("Failed to load restaurants:", error);
        setRestaurants([]);
      } finally {
        setLoading(false);
      }
    }

    loadRestaurants();
  }, []);

  const allHubs = useMemo(() => {
    const found = uniqueStrings(restaurants.map((r) => r.hubName));
    return ["All", ...orderHubs(found)];
  }, [restaurants]);

  const allCuisineNames = useMemo(() => {
    const found = uniqueStrings(restaurants.flatMap((r) => restaurantCuisineNames(r)));
    return ["All", ...orderCuisines(found)];
  }, [restaurants]);

  const filteredRestaurants = useMemo(() => {
    const q = search.trim().toLowerCase();

    return restaurants.filter((restaurant) => {
      const matchesSearch =
        !q ||
        normalizeText(restaurant.name).includes(q) ||
        normalizeText(restaurant.ownerName).includes(q) ||
        normalizeText(restaurant.hubName).includes(q) ||
        normalizeText(restaurant.area).includes(q) ||
        normalizeText(restaurant.cuisine).includes(q) ||
        normalizeText(restaurant.shortDescription).includes(q) ||
        normalizeText(restaurant.fullAddress).includes(q) ||
        normalizeText(restaurant.postcode).includes(q) ||
        (restaurant.tags || []).some((tag) => normalizeText(tag).includes(q)) ||
        (restaurant.popularItems || []).some((item) => normalizeText(item).includes(q));

      const matchesHub = selectedHub === "All" || safeText(restaurant.hubName) === selectedHub;

      const matchesCuisine =
        selectedCuisine === "All" || restaurantCuisineNames(restaurant).includes(selectedCuisine);

      const matchesRegion =
        selectedRegion === "All" || restaurantRegions(restaurant, allCuisineDefs).includes(selectedRegion as Cuisine["region"]);

      const matchesDietary =
        selectedDietary === "All" || restaurantHasDietaryAttribute(restaurant, selectedDietary);

      const matchesService = restaurantOffersService(restaurant, selectedService);

      const matchesStatus = selectedStatus === "All" || safeText(restaurant.status) === selectedStatus;

      return (
        matchesSearch && matchesHub && matchesCuisine && matchesRegion && matchesDietary && matchesService && matchesStatus
      );
    });
  }, [
    restaurants,
    search,
    selectedHub,
    selectedCuisine,
    selectedRegion,
    selectedDietary,
    selectedService,
    selectedStatus,
    allCuisineDefs,
  ]);

  const visibleHubs = useMemo(() => {
    const hubsFromFiltered = uniqueStrings(filteredRestaurants.map((r) => r.hubName));
    if (selectedHub !== "All") {
      return hubsFromFiltered.includes(selectedHub) ? [selectedHub] : [];
    }
    return orderHubs(hubsFromFiltered);
  }, [filteredRestaurants, selectedHub]);

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex rounded-full bg-amber-100 px-4 py-1 text-sm font-semibold text-amber-900">
              {t("title")}
            </div>

            <div className="flex flex-wrap gap-2">
              <NextLink
                href="/suppliers"
                className="inline-flex items-center rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                🏪 {t("suppliers")}
              </NextLink>

              <NextLink
                href="/riders"
                className="inline-flex items-center rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
              >
                🛵 {t("riders")}
              </NextLink>

              <NextLink
                href="/restaurants/new"
                className="inline-flex items-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800"
              >
                + {t("addRestaurant")}
              </NextLink>
            </div>
          </div>

          <h1 className="mt-4 text-3xl font-bold text-neutral-900 md:text-4xl">
            {t("title")}
          </h1>

          <p className="mt-4 max-w-3xl text-base leading-7 text-neutral-600">
            {t("subtitle")}
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-700">
                {t("searchLabel")}
              </label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-700">
                {t("hubLabel")}
              </label>
              <select
                value={selectedHub}
                onChange={(e) => setSelectedHub(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-amber-500"
              >
                {allHubs.map((hub) => (
                  <option key={hub} value={hub}>{hub === "All" ? t("all") : hub}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-700">
                {t("regionLabel")}
              </label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-amber-500"
              >
                <option value="All">{t("all")}</option>
                {CUISINE_REGION_ORDER.map((region) => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-700">
                {t("cuisineLabel")}
              </label>
              <select
                value={selectedCuisine}
                onChange={(e) => setSelectedCuisine(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-amber-500"
              >
                {allCuisineNames.map((cuisine) => (
                  <option key={cuisine} value={cuisine}>
                    {cuisine === "All" ? t("all") : cuisineDisplayNameByCanonicalName.get(cuisine) || cuisine}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-700">
                {t("dietaryLabel")}
              </label>
              <select
                value={selectedDietary}
                onChange={(e) => setSelectedDietary(e.target.value as "All" | DietaryAttribute)}
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-amber-500"
              >
                <option value="All">{t("all")}</option>
                {DIETARY_ATTRIBUTES.map((attr) => (
                  <option key={attr} value={attr}>{tDietary(DIETARY_ATTRIBUTE_TRANSLATION_KEY[attr])}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-700">
                {t("serviceLabel")}
              </label>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value as ServiceFilter)}
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-amber-500"
              >
                <option value="All">{t("all")}</option>
                <option value="dineIn">{serviceLabel.dineIn}</option>
                <option value="takeaway">{serviceLabel.takeaway}</option>
                <option value="delivery">{serviceLabel.delivery}</option>
                <option value="collection">{serviceLabel.collection}</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-700">
                {t("statusLabel")}
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-amber-500"
              >
                <option value="All">{t("all")}</option>
                <option value="active">{tDetail("liveListing")}</option>
                <option value="pending">{tDetail("pendingApproval")}</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-neutral-600">
            <span className="rounded-full bg-neutral-100 px-3 py-1">
              {loading ? t("loadingRestaurants") : t("placesFound", { count: filteredRestaurants.length })}
            </span>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedHub("All");
                setSelectedCuisine("All");
                setSelectedRegion("All");
                setSelectedDietary("All");
                setSelectedService("All");
                setSelectedStatus("active");
              }}
              className="rounded-full border border-neutral-300 bg-white px-3 py-1 font-medium text-neutral-700 hover:bg-neutral-50"
            >
              {t("clearFilters")}
            </button>
          </div>

          {loading ? (
            <div className="mt-10 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
              <div className="text-lg font-semibold text-neutral-900">
                {t("loadingRestaurants")}
              </div>
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
              <div className="text-lg font-semibold text-neutral-900">
                {t("noRestaurantsFound")}
              </div>
              <p className="mt-2 text-sm text-neutral-600">
                {t("tryAnotherSearch")}
              </p>
            </div>
          ) : (
            <div className="mt-10 space-y-12">
              {visibleHubs.map((hub) => {
                const hubRestaurants = filteredRestaurants.filter((r) => safeText(r.hubName) === hub);
                if (hubRestaurants.length === 0) return null;

                const cuisinesInHub = uniqueStrings(hubRestaurants.map((r) => r.cuisine));
                const orderedCuisines = selectedCuisine === "All" ? orderCuisines(cuisinesInHub, hub) : cuisinesInHub;

                return (
                  <section key={hub}>
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-neutral-900">{hub}</h2>
                      <div className="rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-600">
                        {t("placesCount", { count: hubRestaurants.length })}
                      </div>
                    </div>

                    <div className="space-y-8">
                      {orderedCuisines.map((cuisine) => {
                        const cuisineRestaurants = hubRestaurants.filter((r) => safeText(r.cuisine) === cuisine);
                        if (cuisineRestaurants.length === 0) return null;

                        return (
                          <div key={`${hub}-${cuisine}`}>
                            <h3 className="mb-4 text-lg font-semibold text-amber-800">{cuisine}</h3>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                              {cuisineRestaurants.map((restaurant) => {
                                const serviceTags: string[] = [];
                                if (restaurant.dineIn) serviceTags.push("Dine-in");
                                if (restaurant.takeaway) serviceTags.push("Takeaway");
                                if (restaurant.delivery) serviceTags.push("Delivery");
                                if (restaurant.collectionEnabled) serviceTags.push("Collection");

                                const tags = [
                                  restaurant.status === "pending" ? "Pending" : "Live Listing",
                                  ...(safeText(restaurant.priceRange) ? [safeText(restaurant.priceRange)] : []),
                                  ...(restaurant.isHmcApproved ? ["HMC Approved"] : []),
                                  ...(restaurant.isPremium ? ["Premium"] : []),
                                  ...serviceTags.slice(0, 2),
                                ].filter(Boolean);

                                const popularItems = [
                                  ...(restaurant.popularItems || []).map((item) => safeText(item)).filter(Boolean).slice(0, 2),
                                  ...(safeText(restaurant.area) ? [safeText(restaurant.area)] : []),
                                ].slice(0, 3);

                                const content = getLocalizedRestaurantContent(restaurant, locale);

                                return (
                                  <RestaurantCard
                                    key={restaurant.id}
                                    name={safeText(content.name) || "Restaurant"}
                                    cuisine={safeText(restaurant.cuisine) || "Cuisine not added"}
                                    area={safeText(restaurant.area) || safeText(restaurant.hubName) || "Area not added"}
                                    rating={restaurant.rating}
                                    reviewCount={restaurant.reviewCount}
                                    tags={tags}
                                    dietaryAttributes={buildDietaryBadgeAttributes(restaurant)}
                                    ownerTags={restaurant.tags || []}
                                    popularItems={
                                      popularItems.length > 0
                                        ? popularItems
                                        : [safeText(restaurant.cuisine) || "Cuisine", safeText(restaurant.hubName) || "Food hub"]
                                    }
                                    href={`/restaurants/${restaurant.id}`}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </div>
      </main>
      <SiteFooter />
    </>
  );
}
