"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type RestaurantSignup = {
  id: string;

  // old fields
  name?: string;
  owner?: string;
  hub?: string;

  // new fields
  restaurantName?: string;
  ownerName?: string;
  hubId?: string;
  hubName?: string;
  area?: string;
  notes?: string;

  phone?: string;
  email?: string;
  cuisine?: string;
  status?: string;
  profileCreated?: boolean;
  restaurantId?: string;
  createdAt?: any;
  updatedAt?: any;
};

type HubConfig = {
  hubId: string;
  hubName: string;
  area: string;
  locationId: string;
};

const HUB_MAP: Record<string, HubConfig> = {
  "Brick Lane": {
    hubId: "brick-lane",
    hubName: "Brick Lane",
    area: "Brick Lane",
    locationId: "brick-lane-main",
  },
  "Upmarket Food Hall": {
    hubId: "upmarket-brick-lane",
    hubName: "Upmarket Brick Lane",
    area: "Brick Lane",
    locationId: "upmarket-brick-lane",
  },
  "Upmarket Brick Lane": {
    hubId: "upmarket-brick-lane",
    hubName: "Upmarket Brick Lane",
    area: "Brick Lane",
    locationId: "upmarket-brick-lane",
  },
  "Green Street / Plashet Road": {
    hubId: "green-street",
    hubName: "Green Street / Plashet Road",
    area: "Green Street",
    locationId: "green-street-main",
  },
  "Westfield Stratford": {
    hubId: "westfield-stratford",
    hubName: "Westfield Stratford City",
    area: "Stratford",
    locationId: "westfield-stratford-main",
  },
  "Westfield Stratford City": {
    hubId: "westfield-stratford",
    hubName: "Westfield Stratford City",
    area: "Stratford",
    locationId: "westfield-stratford-main",
  },
  "Stratford Centre": {
    hubId: "stratford-centre",
    hubName: "Stratford Centre",
    area: "Stratford",
    locationId: "stratford-centre-main",
  },
  "Bethnal Green / BOXPARK": {
    hubId: "bethnal-green",
    hubName: "Bethnal Green",
    area: "Bethnal Green",
    locationId: "bethnal-green-main",
  },
  "Bethnal Green": {
    hubId: "bethnal-green",
    hubName: "Bethnal Green",
    area: "Bethnal Green",
    locationId: "bethnal-green-main",
  },
  "Boxpark Croydon": {
    hubId: "boxpark-croydon",
    hubName: "Boxpark Croydon",
    area: "Croydon",
    locationId: "boxpark-croydon-main",
  },
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function safeText(value?: string) {
  return (value || "").trim();
}

function getSignupName(item: RestaurantSignup) {
  return safeText(item.restaurantName) || safeText(item.name) || "—";
}

function getSignupOwner(item: RestaurantSignup) {
  return safeText(item.ownerName) || safeText(item.owner) || "—";
}

function getSignupHub(item: RestaurantSignup) {
  return safeText(item.hubName) || safeText(item.hub) || "—";
}

function statusBadgeClass(status?: string) {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    case "contacted":
      return "bg-blue-100 text-blue-800";
    case "reviewing":
      return "bg-amber-100 text-amber-900";
    default:
      return "bg-amber-100 text-amber-900";
  }
}

export default function RestaurantSignupsAdminPage() {
  const router = useRouter();

  const [items, setItems] = useState<RestaurantSignup[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, "restaurant_signups"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows: RestaurantSignup[] = snap.docs.map((docSnap) => {
          const data = docSnap.data() as Omit<RestaurantSignup, "id">;
          return {
            id: docSnap.id,
            ...data,
          };
        });

        setItems(rows);
        setLoading(false);
      },
      (error) => {
        console.error("Failed to load restaurant signups:", error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  async function updateStatus(item: RestaurantSignup, status: string) {
    if (updatingId) return;
    if ((item.status || "new") === status) return;

    setUpdatingId(item.id);

    try {
      await updateDoc(doc(db, "restaurant_signups", item.id), {
        status,
        updatedAt: serverTimestamp(),
      });

      setItems((prev) =>
        prev.map((row) =>
          row.id === item.id
            ? {
                ...row,
                status,
              }
            : row
        )
      );
    } catch (error) {
      console.error("Failed to update signup status:", error);
      alert("Failed to update status. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function createProfile(item: RestaurantSignup) {
    if (updatingId) return;

    if (item.restaurantId) {
      router.push(`/restaurants/${item.restaurantId}/edit`);
      return;
    }

    setUpdatingId(item.id);

    try {
      const signupName = getSignupName(item);
      const signupOwner = getSignupOwner(item);
      const signupHubLabel = getSignupHub(item);

      const fallbackSlug = slugify(signupHubLabel || "unknown-hub");

      const mappedHub: HubConfig = HUB_MAP[signupHubLabel] || {
        hubId: safeText(item.hubId) || fallbackSlug,
        hubName: signupHubLabel || "Unknown Hub",
        area: safeText(item.area) || signupHubLabel || "Unknown Area",
        locationId: safeText(item.hubId) || `${fallbackSlug}-main`,
      };

      const finalHubId = safeText(item.hubId) || mappedHub.hubId;
      const finalHubName = signupHubLabel || mappedHub.hubName;
      const finalArea = safeText(item.area) || mappedHub.area;

      const cuisineText = safeText(item.cuisine);
      const shortDescription = cuisineText
        ? `${signupName} is a restaurant listing on SmartServeUK serving ${cuisineText} cuisine in ${finalHubName}.`
        : `${signupName} is a restaurant listing on SmartServeUK in ${finalHubName}.`;

      const docRef = await addDoc(collection(db, "restaurants"), {
        name: signupName,
        slug: slugify(signupName),
        ownerUid: "",
        ownerName: signupOwner,
        phone: safeText(item.phone),
        email: safeText(item.email),

        hubId: finalHubId,
        hubName: finalHubName,
        area: finalArea,
        locationId: mappedHub.locationId,
        postcode: "",
        fullAddress: "",

        cuisine: cuisineText,
        tags: [],
        priceRange: "£",

        shortDescription,
        longDescription: safeText(item.notes),

        popularItems: [],
        menuCategories: [],

        coverImage: "",
        galleryImages: [],
        videoUrl: "",

        websiteUrl: "",
        facebookUrl: "",
        instagramUrl: "",
        tiktokUrl: "",

        openingHoursText: "Not added yet",

        dineIn: true,
        takeaway: true,
        delivery: false,
        collectionEnabled: false,

        isHalal: false,
        isHmcApproved: false,

        rating: 0,
        reviewCount: 0,
        visitCount: 0,

        isPremium: false,
        subscriptionPlan: "free",
        offersEnabled: false,
        loyaltyEnabled: false,
        adsEnabled: false,

        status: "active",

        sourceSignupId: item.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "restaurant_signups", item.id), {
        status: "approved",
        profileCreated: true,
        restaurantId: docRef.id,
        updatedAt: serverTimestamp(),
      });

      setItems((prev) =>
        prev.map((row) =>
          row.id === item.id
            ? {
                ...row,
                status: "approved",
                profileCreated: true,
                restaurantId: docRef.id,
              }
            : row
        )
      );

      router.push(`/restaurants/${docRef.id}/edit`);
    } catch (error) {
      console.error("Failed to create restaurant profile:", error);
      alert("Failed to create profile. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  }

  const newCount = useMemo(
    () =>
      items.filter(
        (item) =>
          !item.status || item.status === "new" || item.status === "reviewing"
      ).length,
    [items]
  );

  const contactedCount = useMemo(
    () => items.filter((item) => item.status === "contacted").length,
    [items]
  );

  const approvedCount = useMemo(
    () => items.filter((item) => item.status === "approved").length,
    [items]
  );

  const rejectedCount = useMemo(
    () => items.filter((item) => item.status === "rejected").length,
    [items]
  );

  const createdProfileCount = useMemo(
    () => items.filter((item) => item.profileCreated || item.restaurantId).length,
    [items]
  );

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-8 md:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex rounded-full bg-amber-100 px-4 py-1 text-sm font-semibold text-amber-900">
                Admin
              </div>
              <h1 className="mt-4 text-3xl font-bold text-neutral-900">
                Restaurant Signups
              </h1>
              <p className="mt-2 text-neutral-600">
                Review restaurants that submitted interest through SmartServeUK.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin"
                className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Back to Admin
              </Link>

              <div className="rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700">
                {items.length} applications
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-5">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="text-sm font-medium text-amber-700">
                New/Reviewing
              </div>
              <div className="mt-1 text-2xl font-bold text-amber-900">
                {newCount}
              </div>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <div className="text-sm font-medium text-blue-700">Contacted</div>
              <div className="mt-1 text-2xl font-bold text-blue-900">
                {contactedCount}
              </div>
            </div>

            <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
              <div className="text-sm font-medium text-green-700">Approved</div>
              <div className="mt-1 text-2xl font-bold text-green-900">
                {approvedCount}
              </div>
            </div>

            <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <div className="text-sm font-medium text-red-700">Rejected</div>
              <div className="mt-1 text-2xl font-bold text-red-900">
                {rejectedCount}
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="text-sm font-medium text-emerald-700">
                Profiles Created
              </div>
              <div className="mt-1 text-2xl font-bold text-emerald-900">
                {createdProfileCount}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="mt-8 rounded-2xl border border-dashed border-neutral-300 p-8 text-center text-neutral-500">
              Loading applications...
            </div>
          ) : items.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-neutral-300 p-8 text-center text-neutral-500">
              No restaurant applications yet.
            </div>
          ) : (
            <div className="mt-8 overflow-x-auto">
              <table className="min-w-full border border-neutral-200 text-sm">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-700">
                      Restaurant
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-700">
                      Owner
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-700">
                      Phone
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-700">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-700">
                      Hub
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-700">
                      Cuisine
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-700">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-700">
                      Profile
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-700">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((item) => {
                    const busy = updatingId === item.id;

                    return (
                      <tr key={item.id} className="border-t border-neutral-200">
                        <td className="px-4 py-3 text-neutral-900">
                          {getSignupName(item)}
                        </td>
                        <td className="px-4 py-3 text-neutral-700">
                          {getSignupOwner(item)}
                        </td>
                        <td className="px-4 py-3 text-neutral-700">
                          {safeText(item.phone) || "—"}
                        </td>
                        <td className="px-4 py-3 text-neutral-700">
                          {safeText(item.email) || "—"}
                        </td>
                        <td className="px-4 py-3 text-neutral-700">
                          {getSignupHub(item)}
                        </td>
                        <td className="px-4 py-3 text-neutral-700">
                          {safeText(item.cuisine) || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(
                              item.status
                            )}`}
                          >
                            {item.status || "new"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-neutral-700">
                          {item.profileCreated || item.restaurantId ? (
                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                              Created
                            </span>
                          ) : (
                            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
                              Not created
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3" style={{ minWidth: "560px" }}>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => createProfile(item)}
                              style={{
                                backgroundColor: item.restaurantId
                                  ? "#111827"
                                  : "#f59e0b",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: "8px",
                                padding: "8px 12px",
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: busy ? "not-allowed" : "pointer",
                                opacity: busy ? 0.5 : 1,
                              }}
                            >
                              {item.restaurantId
                                ? "Edit Profile"
                                : "Approve & Create Profile"}
                            </button>

                            {item.restaurantId ? (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  router.push(`/restaurants/${item.restaurantId}`)
                                }
                                style={{
                                  backgroundColor: "#4b5563",
                                  color: "#ffffff",
                                  border: "none",
                                  borderRadius: "8px",
                                  padding: "8px 12px",
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  cursor: busy ? "not-allowed" : "pointer",
                                  opacity: busy ? 0.5 : 1,
                                }}
                              >
                                View Public
                              </button>
                            ) : null}

                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => updateStatus(item, "contacted")}
                              style={{
                                backgroundColor: "#2563eb",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: "8px",
                                padding: "8px 12px",
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: busy ? "not-allowed" : "pointer",
                                opacity: busy ? 0.5 : 1,
                              }}
                            >
                              Contacted
                            </button>

                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => updateStatus(item, "rejected")}
                              style={{
                                backgroundColor: "#dc2626",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: "8px",
                                padding: "8px 12px",
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: busy ? "not-allowed" : "pointer",
                                opacity: busy ? 0.5 : 1,
                              }}
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}