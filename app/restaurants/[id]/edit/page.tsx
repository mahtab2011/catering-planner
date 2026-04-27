"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

type SubscriptionPlan = "free" | "premium";
type RestaurantStatus = "draft" | "active" | "pending" | "blocked";

type MenuItem = {
  name: string;
  price: string;
  note?: string;
};

type MenuCategory = {
  category: string;
  items: MenuItem[];
};

type RestaurantDoc = {
  ownerUid?: string;
  name?: string;
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
  subscriptionPlan?: SubscriptionPlan;
  offersEnabled?: boolean;
  loyaltyEnabled?: boolean;
  adsEnabled?: boolean;

  status?: RestaurantStatus;
  menuCategories?: MenuCategory[];
};

const HUB_OPTIONS = [
  { id: "brick-lane", label: "Brick Lane" },
  { id: "upmarket-brick-lane", label: "Upmarket Brick Lane" },
  { id: "green-street", label: "Green Street / Plashet Road" },
  { id: "westfield-stratford", label: "Westfield Stratford City" },
  { id: "stratford-centre", label: "Stratford Centre" },
  { id: "boxpark-croydon", label: "Boxpark Croydon" },
];

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function cleanStringArray(input: string) {
  return input
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function sanitizeMenuCategories(categories: MenuCategory[]) {
  return categories
    .map((cat) => ({
      category: (cat.category || "").trim(),
      items: Array.isArray(cat.items)
        ? cat.items
            .map((item) => ({
              name: (item.name || "").trim(),
              price: (item.price || "").trim(),
              note: (item.note || "").trim(),
            }))
            .filter((item) => item.name || item.price || item.note)
        : [],
    }))
    .filter((cat) => cat.category || cat.items.length > 0);
}

function normalizeUrl(url?: string) {
  const trimmed = (url || "").trim();
  if (!trimmed) return "";
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
  ) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export default function EditRestaurantPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id || "");

  const [authReady, setAuthReady] = useState(false);
  const [ownerUid, setOwnerUid] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [docExists, setDocExists] = useState(true);
  const [canEdit, setCanEdit] = useState(true);
  const [restaurantOwnerUid, setRestaurantOwnerUid] = useState("");

  const [name, setName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [hubId, setHubId] = useState("");
  const [hubName, setHubName] = useState("");
  const [area, setArea] = useState("");
  const [locationId, setLocationId] = useState("");
  const [postcode, setPostcode] = useState("");
  const [fullAddress, setFullAddress] = useState("");

  const [cuisine, setCuisine] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [priceRange, setPriceRange] = useState("£");

  const [shortDescription, setShortDescription] = useState("");
  const [longDescription, setLongDescription] = useState("");
  const [popularItemsText, setPopularItemsText] = useState("");

  const [coverImage, setCoverImage] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const [websiteUrl, setWebsiteUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");

  const [openingHoursText, setOpeningHoursText] = useState("");

  const [dineIn, setDineIn] = useState(true);
  const [takeaway, setTakeaway] = useState(true);
  const [delivery, setDelivery] = useState(false);
  const [collectionEnabled, setCollectionEnabled] = useState(false);

  const [isHalal, setIsHalal] = useState(false);
  const [isHmcApproved, setIsHmcApproved] = useState(false);

  const [isPremium, setIsPremium] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] =
    useState<SubscriptionPlan>("free");
  const [offersEnabled, setOffersEnabled] = useState(false);
  const [loyaltyEnabled, setLoyaltyEnabled] = useState(false);
  const [adsEnabled, setAdsEnabled] = useState(false);

  const [status, setStatus] = useState<RestaurantStatus>("draft");

  const [menuCategoryName, setMenuCategoryName] = useState("");
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setOwnerUid(user?.uid || "");
      setAuthReady(true);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!id) {
      setDocExists(false);
      setLoading(false);
      setMsg("Missing restaurant id.");
      return;
    }

    async function loadRestaurant() {
      try {
        setLoading(true);
        setMsg("Loading restaurant...");

        const snap = await getDoc(doc(db, "restaurants", id));

        if (!snap.exists()) {
          setDocExists(false);
          setMsg("Restaurant not found.");
          return;
        }

        const data = snap.data() as RestaurantDoc;

        setRestaurantOwnerUid(data.ownerUid || "");

        setName(data.name || "");
        setOwnerName(data.ownerName || "");
        setPhone(data.phone || "");
        setEmail(data.email || "");

        setHubId(data.hubId || "");
        setHubName(data.hubName || "");
        setArea(data.area || "");
        setLocationId(data.locationId || "");
        setPostcode(data.postcode || "");
        setFullAddress(data.fullAddress || "");

        setCuisine(data.cuisine || "");
        setTagsText(Array.isArray(data.tags) ? data.tags.join(", ") : "");
        setPriceRange(data.priceRange || "£");

        setShortDescription(data.shortDescription || "");
        setLongDescription(data.longDescription || "");
        setPopularItemsText(
          Array.isArray(data.popularItems) ? data.popularItems.join(", ") : ""
        );

        setCoverImage(data.coverImage || "");
        setVideoUrl(data.videoUrl || "");

        setWebsiteUrl(data.websiteUrl || "");
        setFacebookUrl(data.facebookUrl || "");
        setInstagramUrl(data.instagramUrl || "");
        setTiktokUrl(data.tiktokUrl || "");

        setOpeningHoursText(data.openingHoursText || "");

        setDineIn(data.dineIn ?? true);
        setTakeaway(data.takeaway ?? true);
        setDelivery(!!data.delivery);
        setCollectionEnabled(!!data.collectionEnabled);

        setIsHalal(!!data.isHalal);
        setIsHmcApproved(!!data.isHmcApproved);

        setIsPremium(!!data.isPremium);
        setSubscriptionPlan(data.subscriptionPlan || "free");
        setOffersEnabled(!!data.offersEnabled);
        setLoyaltyEnabled(!!data.loyaltyEnabled);
        setAdsEnabled(!!data.adsEnabled);

        setStatus(data.status || "draft");
        setMenuCategories(
          Array.isArray(data.menuCategories) ? data.menuCategories : []
        );

        setMsg("Restaurant loaded.");
      } catch (error) {
        console.error(error);
        setMsg("Failed to load restaurant.");
      } finally {
        setLoading(false);
      }
    }

    loadRestaurant();
  }, [id]);

  useEffect(() => {
    if (!authReady || loading) return;

    if (restaurantOwnerUid && ownerUid && restaurantOwnerUid !== ownerUid) {
      setCanEdit(false);
      setMsg("You do not have permission to edit this restaurant.");
    } else {
      setCanEdit(true);
    }
  }, [authReady, loading, restaurantOwnerUid, ownerUid]);

  useEffect(() => {
    if (isPremium) {
      setSubscriptionPlan("premium");
    } else {
      setSubscriptionPlan("free");
      setOffersEnabled(false);
      setLoyaltyEnabled(false);
      setAdsEnabled(false);
    }
  }, [isPremium]);

  const slug = useMemo(() => slugify(name), [name]);

  const tags = useMemo(() => cleanStringArray(tagsText), [tagsText]);

  const popularItems = useMemo(
    () => cleanStringArray(popularItemsText),
    [popularItemsText]
  );

  const cleanedMenuCategories = useMemo(
    () => sanitizeMenuCategories(menuCategories),
    [menuCategories]
  );

  const coverPreviewUrl = useMemo(() => normalizeUrl(coverImage), [coverImage]);

  const hasAnyMenuItems = useMemo(
    () => cleanedMenuCategories.some((cat) => cat.items.length > 0),
    [cleanedMenuCategories]
  );

  const readinessChecks = useMemo(
    () => [
      {
        label: "Restaurant name",
        ok: name.trim().length >= 2,
      },
      {
        label: "Short description",
        ok: shortDescription.trim().length >= 12,
      },
      {
        label: "Cover image",
        ok: coverImage.trim().length > 0,
      },
      {
        label: "Popular items",
        ok: popularItems.length > 0,
      },
      {
        label: "Opening hours",
        ok: openingHoursText.trim().length > 0,
      },
      {
        label: "At least 1 menu item",
        ok: hasAnyMenuItems,
      },
    ],
    [
      name,
      shortDescription,
      coverImage,
      popularItems,
      openingHoursText,
      hasAnyMenuItems,
    ]
  );

  const readyCount = readinessChecks.filter((item) => item.ok).length;
  const publishReady = readinessChecks.every((item) => item.ok);

  async function handleSave() {
    if (!id) {
      setMsg("Missing restaurant id.");
      return;
    }

    if (!canEdit) {
      setMsg("You do not have permission to edit this restaurant.");
      return;
    }

    if (name.trim().length < 2) {
      setMsg("Restaurant name must be at least 2 characters.");
      return;
    }

    if (status === "active") {
      if (shortDescription.trim().length < 12) {
        setMsg("Please add a stronger short description before making this listing active.");
        return;
      }

      if (!coverImage.trim()) {
        setMsg("Please add a cover image before making this listing active.");
        return;
      }

      if (!hasAnyMenuItems) {
        setMsg("Please add at least one menu item before making this listing active.");
        return;
      }
    }

    const finalHubName =
      hubName.trim() ||
      HUB_OPTIONS.find((hub) => hub.id === hubId)?.label ||
      "";

    try {
      setSaving(true);
      setMsg("Saving changes...");

      await updateDoc(doc(db, "restaurants", id), {
        name: name.trim(),
        slug,
        ownerUid: restaurantOwnerUid || ownerUid,
        ownerName: ownerName.trim(),
        phone: phone.trim(),
        email: email.trim(),

        hubId: hubId.trim(),
        hubName: finalHubName,
        area: area.trim(),
        locationId: locationId.trim(),
        postcode: postcode.trim(),
        fullAddress: fullAddress.trim(),

        cuisine: cuisine.trim(),
        tags,
        priceRange,

        shortDescription: shortDescription.trim(),
        longDescription: longDescription.trim(),
        popularItems,

        coverImage: coverImage.trim(),
        videoUrl: videoUrl.trim(),

        websiteUrl: websiteUrl.trim(),
        facebookUrl: facebookUrl.trim(),
        instagramUrl: instagramUrl.trim(),
        tiktokUrl: tiktokUrl.trim(),

        openingHoursText: openingHoursText.trim(),

        dineIn,
        takeaway,
        delivery,
        collectionEnabled,

        isHalal,
        isHmcApproved,

        isPremium,
        subscriptionPlan,
        offersEnabled,
        loyaltyEnabled,
        adsEnabled,
        status,

        menuCategories: cleanedMenuCategories,
        updatedAt: serverTimestamp(),
      });

      setHubName(finalHubName);
      setMenuCategories(cleanedMenuCategories);
      setMsg("Restaurant updated successfully.");
    } catch (error) {
      console.error(error);
      setMsg("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  function handleHubChange(value: string) {
    setHubId(value);
    const found = HUB_OPTIONS.find((hub) => hub.id === value);
    setHubName(found?.label || "");
  }

  function addMenuCategory() {
    const category = menuCategoryName.trim();
    if (!category) return;

    setMenuCategories((prev) => [
      ...prev,
      {
        category,
        items: [],
      },
    ]);
    setMenuCategoryName("");
  }

  function updateMenuCategoryName(index: number, value: string) {
    setMenuCategories((prev) =>
      prev.map((cat, i) => (i === index ? { ...cat, category: value } : cat))
    );
  }

  function removeMenuCategory(index: number) {
    setMenuCategories((prev) => prev.filter((_, i) => i !== index));
  }

  function addMenuItem(categoryIndex: number) {
    setMenuCategories((prev) =>
      prev.map((cat, i) =>
        i === categoryIndex
          ? {
              ...cat,
              items: [...cat.items, { name: "", price: "", note: "" }],
            }
          : cat
      )
    );
  }

  function updateMenuItem(
    categoryIndex: number,
    itemIndex: number,
    field: keyof MenuItem,
    value: string
  ) {
    setMenuCategories((prev) =>
      prev.map((cat, i) =>
        i === categoryIndex
          ? {
              ...cat,
              items: cat.items.map((item, j) =>
                j === itemIndex ? { ...item, [field]: value } : item
              ),
            }
          : cat
      )
    );
  }

  function removeMenuItem(categoryIndex: number, itemIndex: number) {
    setMenuCategories((prev) =>
      prev.map((cat, i) =>
        i === categoryIndex
          ? {
              ...cat,
              items: cat.items.filter((_, j) => j !== itemIndex),
            }
          : cat
      )
    );
  }

  if (!authReady) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600">
          Checking login...
        </div>
      </div>
    );
  }

  if (!ownerUid) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <div className="text-lg font-semibold text-red-700">
            Please log in first
          </div>
          <p className="mt-2 text-sm text-red-600">
            You need to be logged in before editing a restaurant profile.
          </p>
          <div className="mt-4">
            <Link
              href="/login"
              className="inline-flex rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
            >
              Go to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!docExists) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <div className="text-lg font-semibold text-neutral-900">
            Restaurant not found
          </div>
          <p className="mt-2 text-sm text-neutral-600">
            The restaurant document does not exist.
          </p>
          <div className="mt-4">
            <Link
              href="/restaurants"
              className="inline-flex rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700"
            >
              Back to restaurants
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600">
          Loading restaurant...
        </div>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <div className="text-lg font-semibold text-red-700">
            Access denied
          </div>
          <p className="mt-2 text-sm text-red-600">
            You do not have permission to edit this restaurant profile.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={`/restaurants/${id}`}
              className="inline-flex rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-700"
            >
              Open public page
            </Link>
            <Link
              href="/restaurants"
              className="inline-flex rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700"
            >
              Back to restaurants
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-2xl font-bold tracking-tight text-neutral-900">
            Edit Restaurant Profile
          </div>
          <div className="mt-1 text-sm text-neutral-600">
            Update restaurant details, menu categories, service settings, and
            business profile.
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/restaurants/${id}`}
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            View public page
          </Link>
          <Link
            href="/restaurants"
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            Back to restaurants
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-700">
        <span className="font-semibold text-neutral-900">Status:</span>{" "}
        {msg || "Ready"}
      </div>

      <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-base font-semibold text-neutral-900">
              Publish Readiness
            </div>
            <div className="mt-1 text-sm text-neutral-600">
              Complete these key sections before making the listing active.
            </div>
          </div>

          <div
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              publishReady
                ? "bg-green-100 text-green-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {readyCount}/{readinessChecks.length} ready
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {readinessChecks.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-xl border border-neutral-200 px-4 py-3"
            >
              <span className="text-sm font-medium text-neutral-800">
                {item.label}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  item.ok
                    ? "bg-green-100 text-green-800"
                    : "bg-neutral-100 text-neutral-600"
                }`}
              >
                {item.ok ? "Done" : "Missing"}
              </span>
            </div>
          ))}
        </div>

        {!publishReady ? (
          <div className="mt-4 rounded-xl bg-neutral-50 p-4 text-sm text-neutral-600">
            Tip: for a stronger public page, add a cover image, short description,
            opening hours, popular items, and at least one menu item.
          </div>
        ) : null}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="text-base font-semibold text-neutral-900">
            Core Identity
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-neutral-700">
                Restaurant name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Brick Lane Kacchi House"
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-black"
              />
            </div>

            <div>
  <label className="text-xs font-semibold text-neutral-700">
    Public URL name
  </label>
  <input
    value={slug}
    readOnly
    className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-600 outline-none"
  />
  <div className="mt-2 text-xs text-neutral-500">
    This is the link-friendly name used in the restaurant page URL.
  </div>
</div>

            <div>
              <label className="text-xs font-semibold text-neutral-700">
                Owner name
              </label>
              <input
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Owner or manager name"
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700">
                Phone
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Main phone number"
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700">
                Email
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Contact email"
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-black"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="text-base font-semibold text-neutral-900">
            Location & Hub Mapping
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-neutral-700">
                Hub
              </label>
              <select
                value={hubId}
                onChange={(e) => handleHubChange(e.target.value)}
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-black"
              >
                <option value="">Select hub</option>
                {HUB_OPTIONS.map((hub) => (
                  <option key={hub.id} value={hub.id}>
                    {hub.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700">
                Hub display name
              </label>
              <input
                value={hubName}
                onChange={(e) => setHubName(e.target.value)}
                placeholder="What visitors should see"
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700">
                Area
              </label>
              <input
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g. Brick Lane, Stratford"
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700">
                Location ID
              </label>
              <input
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                placeholder="e.g. brick-lane-main"
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700">
                Postcode
              </label>
              <input
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                placeholder="e.g. E1 6QL"
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700">
                Full address
              </label>
              <input
                value={fullAddress}
                onChange={(e) => setFullAddress(e.target.value)}
                placeholder="e.g. 91 Brick Lane, London"
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-black"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="text-base font-semibold text-neutral-900">
            Cuisine & Positioning
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-neutral-700">
                Cuisine
              </label>
              <select
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-black"
              >
                <option value="">Select cuisine</option>
                <option value="Bangladeshi">Bangladeshi</option>
                <option value="Indian">Indian</option>
                <option value="Pakistani">Pakistani</option>
                <option value="Turkish">Turkish</option>
                <option value="Chinese">Chinese</option>
                <option value="Japanese">Japanese</option>
                <option value="Italian">Italian</option>
                <option value="Global Street Food">Global Street Food</option>
                <option value="Middle Eastern">Middle Eastern</option>
                <option value="Mixed / Fusion">Mixed / Fusion</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700">
                Price range
              </label>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-black"
              >
                <option value="£">£</option>
                <option value="££">££</option>
                <option value="£££">£££</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-neutral-700">
                Tags (comma separated)
              </label>
              <input
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                placeholder="e.g. halal, biryani, family dining, grill"
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-black"
              />
              <div className="mt-2 text-xs text-neutral-500">
                Preview: {tags.length ? tags.join(" • ") : "No tags yet"}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="text-base font-semibold text-neutral-900">
            Description & Menu Preview
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4">
            <div>
              <label className="text-xs font-semibold text-neutral-700">
                Short description
              </label>
              <input
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="One strong line for the public restaurant page"
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-black"
              />
              <div className="mt-2 text-xs text-neutral-500">
                Recommended: at least 12 characters
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700">
                Long description
              </label>
              <textarea
                value={longDescription}
                onChange={(e) => setLongDescription(e.target.value)}
                rows={5}
                placeholder="Tell visitors about the restaurant, food style, story, service, and experience."
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700">
                Popular items (comma separated)
              </label>
              <input
                value={popularItemsText}
                onChange={(e) => setPopularItemsText(e.target.value)}
                placeholder="e.g. Kacchi Biryani, Chicken Roast, Borhani"
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-black"
              />
              <div className="mt-2 text-xs text-neutral-500">
                Preview:{" "}
                {popularItems.length
                  ? popularItems.join(" • ")
                  : "No popular items yet"}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="text-base font-semibold text-neutral-900">
            Media & Links
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-neutral-700">
                Cover image URL
              </label>
              <input
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="Paste a full image URL"
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-black"
              />
              <div className="mt-3 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50">
                {coverPreviewUrl ? (
                  <img
                    src={coverPreviewUrl}
                    alt="Cover preview"
                    className="h-52 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-40 items-center justify-center text-sm text-neutral-500">
                    Cover image preview will appear here
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700">
                Video URL
              </label>
              <input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="Promo video link"
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700">
                Website URL
              </label>
              <input
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://..."
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700">
                Facebook URL
              </label>
              <input
                value={facebookUrl}
                onChange={(e) => setFacebookUrl(e.target.value)}
                placeholder="Facebook page link"
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700">
                Instagram URL
              </label>
              <input
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="Instagram page link"
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700">
                TikTok URL
              </label>
              <input
                value={tiktokUrl}
                onChange={(e) => setTiktokUrl(e.target.value)}
                placeholder="TikTok page link"
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-black"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="text-base font-semibold text-neutral-900">
            Opening Hours & Service Options
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4">
            <div>
              <label className="text-xs font-semibold text-neutral-700">
                Opening hours
              </label>
              <textarea
                value={openingHoursText}
                onChange={(e) => setOpeningHoursText(e.target.value)}
                rows={4}
                placeholder="Example: Mon-Thu 12:00-22:00, Fri-Sat 12:00-23:30, Sun 12:00-21:30"
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-black"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <label className="flex items-center gap-3 rounded-xl border border-neutral-200 px-3 py-3">
                <input
                  type="checkbox"
                  checked={dineIn}
                  onChange={(e) => setDineIn(e.target.checked)}
                />
                <span className="text-sm font-medium text-neutral-800">
                  Dine in
                </span>
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-neutral-200 px-3 py-3">
                <input
                  type="checkbox"
                  checked={takeaway}
                  onChange={(e) => setTakeaway(e.target.checked)}
                />
                <span className="text-sm font-medium text-neutral-800">
                  Takeaway
                </span>
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-neutral-200 px-3 py-3">
                <input
                  type="checkbox"
                  checked={delivery}
                  onChange={(e) => setDelivery(e.target.checked)}
                />
                <span className="text-sm font-medium text-neutral-800">
                  Delivery
                </span>
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-neutral-200 px-3 py-3">
                <input
                  type="checkbox"
                  checked={collectionEnabled}
                  onChange={(e) => setCollectionEnabled(e.target.checked)}
                />
                <span className="text-sm font-medium text-neutral-800">
                  Collection enabled
                </span>
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-neutral-200 px-3 py-3">
                <input
                  type="checkbox"
                  checked={isHalal}
                  onChange={(e) => setIsHalal(e.target.checked)}
                />
                <span className="text-sm font-medium text-neutral-800">
                  Halal
                </span>
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-neutral-200 px-3 py-3">
                <input
                  type="checkbox"
                  checked={isHmcApproved}
                  onChange={(e) => setIsHmcApproved(e.target.checked)}
                />
                <span className="text-sm font-medium text-neutral-800">
                  HMC approved
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="text-base font-semibold text-neutral-900">
            Menu Builder
          </div>

          <div className="mt-4 flex flex-col gap-3 md:flex-row">
            <input
              value={menuCategoryName}
              onChange={(e) => setMenuCategoryName(e.target.value)}
              placeholder="e.g. Biryani, Grill, Drinks"
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-black"
            />
            <button
              onClick={addMenuCategory}
              type="button"
              className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              Add category
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {menuCategories.length === 0 ? (
              <div className="rounded-xl border border-dashed border-neutral-300 p-4 text-sm text-neutral-500">
                No menu categories yet.
              </div>
            ) : (
              menuCategories.map((cat, categoryIndex) => (
                <div
                  key={categoryIndex}
                  className="rounded-2xl border border-neutral-200 p-4"
                >
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_auto] md:items-center">
                      <input
                        value={cat.category}
                        onChange={(e) =>
                          updateMenuCategoryName(categoryIndex, e.target.value)
                        }
                        placeholder="Category name"
                        className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-900 outline-none focus:border-black"
                      />

                      <button
                        type="button"
                        onClick={() => addMenuItem(categoryIndex)}
                        className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                      >
                        Add item
                      </button>

                      <button
                        type="button"
                        onClick={() => removeMenuCategory(categoryIndex)}
                        className="rounded-xl border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                      >
                        Remove category
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {cat.items.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-neutral-300 p-3 text-sm text-neutral-500">
                        No items yet in this category.
                      </div>
                    ) : (
                      cat.items.map((item, itemIndex) => (
                        <div
                          key={itemIndex}
                          className="grid grid-cols-1 gap-3 rounded-xl border border-neutral-200 p-3 md:grid-cols-4"
                        >
                          <input
                            value={item.name}
                            onChange={(e) =>
                              updateMenuItem(
                                categoryIndex,
                                itemIndex,
                                "name",
                                e.target.value
                              )
                            }
                            placeholder="Item name"
                            className="rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-black"
                          />

                          <input
                            value={item.price}
                            onChange={(e) =>
                              updateMenuItem(
                                categoryIndex,
                                itemIndex,
                                "price",
                                e.target.value
                              )
                            }
                            placeholder="Price"
                            className="rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-black"
                          />

                          <input
                            value={item.note || ""}
                            onChange={(e) =>
                              updateMenuItem(
                                categoryIndex,
                                itemIndex,
                                "note",
                                e.target.value
                              )
                            }
                            placeholder="Short note"
                            className="rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-black"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              removeMenuItem(categoryIndex, itemIndex)
                            }
                            className="rounded-xl border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                          >
                            Remove item
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-3 text-xs text-neutral-500">
            Final categories to save: {cleanedMenuCategories.length}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="text-base font-semibold text-neutral-900">
            Business Settings
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="flex items-center gap-3 rounded-xl border border-neutral-200 px-3 py-3">
              <input
                type="checkbox"
                checked={isPremium}
                onChange={(e) => setIsPremium(e.target.checked)}
              />
              <span className="text-sm font-medium text-neutral-800">
                Premium account
              </span>
            </label>

            <div>
              <label className="text-xs font-semibold text-neutral-700">
                Subscription plan
              </label>
              <select
                value={subscriptionPlan}
                onChange={(e) =>
                  setSubscriptionPlan(e.target.value as SubscriptionPlan)
                }
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-black"
              >
                <option value="free">free</option>
                <option value="premium">premium</option>
              </select>
            </div>

            <label className="flex items-center gap-3 rounded-xl border border-neutral-200 px-3 py-3">
              <input
                type="checkbox"
                checked={offersEnabled}
                onChange={(e) => setOffersEnabled(e.target.checked)}
                disabled={!isPremium}
              />
              <span className="text-sm font-medium text-neutral-800">
                Offers enabled
              </span>
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-neutral-200 px-3 py-3">
              <input
                type="checkbox"
                checked={loyaltyEnabled}
                onChange={(e) => setLoyaltyEnabled(e.target.checked)}
                disabled={!isPremium}
              />
              <span className="text-sm font-medium text-neutral-800">
                Loyalty enabled
              </span>
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-neutral-200 px-3 py-3">
              <input
                type="checkbox"
                checked={adsEnabled}
                onChange={(e) => setAdsEnabled(e.target.checked)}
                disabled={!isPremium}
              />
              <span className="text-sm font-medium text-neutral-800">
                Ads enabled
              </span>
            </label>

            <div>
              <label className="text-xs font-semibold text-neutral-700">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as RestaurantStatus)}
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-black"
              >
                <option value="draft">draft</option>
                <option value="active">active</option>
                <option value="pending">pending</option>
                <option value="blocked">blocked</option>
              </select>
              {status === "active" && !publishReady ? (
                <div className="mt-2 text-xs text-amber-700">
                  Some recommended publish-ready fields are still missing.
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>

          <button
            type="button"
            onClick={() => router.push(`/restaurants/${id}`)}
            className="rounded-xl border border-neutral-300 px-5 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            Open public page
          </button>
        </div>
      </div>
    </div>
  );
}