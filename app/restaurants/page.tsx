"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import RestaurantCard from "@/components/restaurants/RestaurantCard";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
  tags?: string[];
  priceRange?: string;

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
  isHmcApproved?: boolean;

  isPremium?: boolean;
  subscriptionPlan?: "free" | "premium";
  offersEnabled?: boolean;
  loyaltyEnabled?: boolean;
  adsEnabled?: boolean;

  status?: "draft" | "active" | "pending" | "blocked";

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
    "Bangladeshi",
    "Indian",
    "Pakistani",
    "Chinese",
    "Turkish",
    "Italian",
    "Mixed / Fusion",
    "Global Street Food",
  ],
  "Upmarket Brick Lane": [
    "Global Street Food",
    "Bangladeshi",
    "Japanese",
    "Italian",
    "Chinese",
    "Turkish",
    "Mixed / Fusion",
  ],
  "Green Street / Plashet Road": [
    "Bangladeshi",
    "Indian",
    "Pakistani",
    "Italian",
    "Turkish",
    "Mixed / Fusion",
  ],
  "Westfield Stratford City": [
    "Global Street Food",
    "Italian",
    "Japanese",
    "Chinese",
    "Middle Eastern",
    "Mixed / Fusion",
  ],
  "Stratford Centre": [
    "Bangladeshi",
    "Turkish",
    "Global Street Food",
    "Mixed / Fusion",
  ],
  "Boxpark Croydon": [
    "Global Street Food",
    "Mixed / Fusion",
    "Italian",
    "Japanese",
    "Middle Eastern",
  ],
};

const preferredCuisineOrder = [
  "Bangladeshi",
  "Indian",
  "Pakistani",
  "Turkish",
  "Chinese",
  "Japanese",
  "Italian",
  "Global Street Food",
  "Middle Eastern",
  "Mixed / Fusion",
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
    ...hubs
      .filter((hub) => !hubOrder.includes(hub))
      .sort((a, b) => a.localeCompare(b)),
  ];
}

function orderCuisines(cuisines: string[], hub?: string) {
  const priority = hub ? cuisinePriority[hub] || [] : preferredCuisineOrder;

  return [
    ...priority.filter((c) => cuisines.includes(c)),
    ...cuisines
      .filter((c) => !priority.includes(c))
      .sort((a, b) => a.localeCompare(b)),
  ];
}

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<LiveRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedHub, setSelectedHub] = useState("All");
  const [selectedCuisine, setSelectedCuisine] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("active");

  useEffect(() => {
    async function loadRestaurants() {
      try {
        setLoading(true);

        const q = query(
          collection(db, "restaurants"),
          where("status", "in", ["active", "pending"])
        );

        const snap = await getDocs(q);

        const rows: LiveRestaurant[] = snap.docs.map((docSnap) => {
          const data = docSnap.data() as Omit<LiveRestaurant, "id">;
          return {
            id: docSnap.id,
            ...data,
          };
        });

        setRestaurants(rows);
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

  const allCuisines = useMemo(() => {
    const found = uniqueStrings(restaurants.map((r) => r.cuisine));
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
        (restaurant.popularItems || []).some((item) =>
          normalizeText(item).includes(q)
        );

      const matchesHub =
        selectedHub === "All" || safeText(restaurant.hubName) === selectedHub;

      const matchesCuisine =
        selectedCuisine === "All" ||
        safeText(restaurant.cuisine) === selectedCuisine;

      const matchesStatus =
        selectedStatus === "All" ||
        safeText(restaurant.status) === selectedStatus;

      return matchesSearch && matchesHub && matchesCuisine && matchesStatus;
    });
  }, [restaurants, search, selectedHub, selectedCuisine, selectedStatus]);

  const visibleHubs = useMemo(() => {
    const hubsFromFiltered = uniqueStrings(
      filteredRestaurants.map((r) => r.hubName)
    );

    if (selectedHub !== "All") {
      return hubsFromFiltered.includes(selectedHub) ? [selectedHub] : [];
    }

    return orderHubs(hubsFromFiltered);
  }, [filteredRestaurants, selectedHub]);

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex rounded-full bg-amber-100 px-4 py-1 text-sm font-semibold text-amber-900">
              Restaurants
            </div>

            <div className="flex flex-wrap gap-2">
  <Link
    href="/suppliers"
    className="inline-flex items-center rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
  >
    🏪 Suppliers
  </Link>

  <Link
    href="/riders"
    className="inline-flex items-center rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
  >
    🛵 Riders
  </Link>

  <Link
    href="/restaurants/new"
    className="inline-flex items-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800"
  >
    + Add Restaurant
  </Link>
</div>
          </div>

          <h1 className="mt-4 text-3xl font-bold text-neutral-900 md:text-4xl">
            South Asian & Global Food Hubs
          </h1>

          <p className="mt-4 max-w-3xl text-base leading-7 text-neutral-600">
            Browse restaurant listings across London food hubs. Search by
            restaurant name, owner, hub, area, cuisine, tags, or popular items
            and discover richer profile pages on SmartServeUK.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-700">
                Search
              </label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search restaurant, owner, hub, area..."
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-700">
                Hub
              </label>
              <select
                value={selectedHub}
                onChange={(e) => setSelectedHub(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-amber-500"
              >
                {allHubs.map((hub) => (
                  <option key={hub} value={hub}>
                    {hub}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-700">
                Cuisine
              </label>
              <select
                value={selectedCuisine}
                onChange={(e) => setSelectedCuisine(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-amber-500"
              >
                {allCuisines.map((cuisine) => (
                  <option key={cuisine} value={cuisine}>
                    {cuisine}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-700">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-amber-500"
              >
                <option value="All">All</option>
                <option value="active">active</option>
                <option value="pending">pending</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-neutral-600">
            <span className="rounded-full bg-neutral-100 px-3 py-1">
              {loading
                ? "Loading..."
                : `${filteredRestaurants.length} places found`}
            </span>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedHub("All");
                setSelectedCuisine("All");
                setSelectedStatus("active");
              }}
              className="rounded-full border border-neutral-300 bg-white px-3 py-1 font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Clear filters
            </button>
          </div>

          {loading ? (
            <div className="mt-10 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
              <div className="text-lg font-semibold text-neutral-900">
                Loading restaurants...
              </div>
              <p className="mt-2 text-sm text-neutral-600">
                Please wait while restaurant profiles are loaded.
              </p>
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
              <div className="text-lg font-semibold text-neutral-900">
                No restaurants found
              </div>
              <p className="mt-2 text-sm text-neutral-600">
                Try another search term or reset the filters.
              </p>
            </div>
          ) : (
            <div className="mt-10 space-y-12">
              {visibleHubs.map((hub) => {
                const hubRestaurants = filteredRestaurants.filter(
                  (r) => safeText(r.hubName) === hub
                );

                if (hubRestaurants.length === 0) return null;

                const cuisinesInHub = uniqueStrings(
                  hubRestaurants.map((r) => r.cuisine)
                );

                const orderedCuisines =
                  selectedCuisine === "All"
                    ? orderCuisines(cuisinesInHub, hub)
                    : cuisinesInHub;

                return (
                  <section key={hub}>
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-neutral-900">
                        {hub}
                      </h2>
                      <div className="rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-600">
                        {hubRestaurants.length} places
                      </div>
                    </div>

                    <div className="space-y-8">
                      {orderedCuisines.map((cuisine) => {
                        const cuisineRestaurants = hubRestaurants.filter(
                          (r) => safeText(r.cuisine) === cuisine
                        );

                        if (cuisineRestaurants.length === 0) return null;

                        return (
                          <div key={`${hub}-${cuisine}`}>
                            <h3 className="mb-4 text-lg font-semibold text-amber-800">
                              {cuisine}
                            </h3>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                              {cuisineRestaurants.map((restaurant) => {
                                const serviceTags: string[] = [];

                                if (restaurant.dineIn) serviceTags.push("Dine-in");
                                if (restaurant.takeaway) {
                                  serviceTags.push("Takeaway");
                                }
                                if (restaurant.delivery) serviceTags.push("Delivery");
                                if (restaurant.collectionEnabled) {
                                  serviceTags.push("Collection");
                                }

                                const tags = [
                                  restaurant.status === "pending"
                                    ? "Pending"
                                    : "Live Listing",
                                  ...(safeText(restaurant.priceRange)
                                    ? [safeText(restaurant.priceRange)]
                                    : []),
                                  ...(restaurant.isHalal ? ["Halal"] : []),
                                  ...(restaurant.isHmcApproved
                                    ? ["HMC Approved"]
                                    : []),
                                  ...(restaurant.isPremium ? ["Premium"] : []),
                                  ...serviceTags.slice(0, 2),
                                ].filter(Boolean);

                                const popularItems = [
                                  ...(restaurant.popularItems || [])
                                    .map((item) => safeText(item))
                                    .filter(Boolean)
                                    .slice(0, 2),
                                  ...(safeText(restaurant.area)
                                    ? [safeText(restaurant.area)]
                                    : []),
                                ].slice(0, 3);

                                return (
                                  <RestaurantCard
                                    key={restaurant.id}
                                    name={safeText(restaurant.name) || "Restaurant"}
                                    cuisine={
                                      safeText(restaurant.cuisine) ||
                                      "Cuisine not added"
                                    }
                                    area={
                                      safeText(restaurant.area) ||
                                      safeText(restaurant.hubName) ||
                                      "Area not added"
                                    }
                                    tags={tags}
                                    popularItems={
                                      popularItems.length > 0
                                        ? popularItems
                                        : [
                                            safeText(restaurant.cuisine) || "Cuisine",
                                            safeText(restaurant.hubName) || "Food hub",
                                          ]
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
  );
}