"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

type SubscriptionPlan = "free" | "premium";
type RestaurantStatus = "draft" | "active" | "pending" | "blocked";

const HUB_OPTIONS = [
  { id: "brick-lane", label: "Brick Lane", area: "Brick Lane" },
  {
    id: "upmarket-brick-lane",
    label: "Upmarket Brick Lane",
    area: "Brick Lane",
  },
  {
    id: "green-street",
    label: "Green Street / Plashet Road",
    area: "Green Street",
  },
  {
    id: "westfield-stratford",
    label: "Westfield Stratford City",
    area: "Stratford",
  },
  { id: "stratford-centre", label: "Stratford Centre", area: "Stratford" },
  { id: "boxpark-croydon", label: "Boxpark Croydon", area: "Croydon" },
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

function cleanStringArray(text: string) {
  return text
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function safeText(value?: string) {
  return (value || "").trim();
}

export default function NewRestaurantPage() {
  const router = useRouter();

  const [authReady, setAuthReady] = useState(false);
  const [ownerUid, setOwnerUid] = useState("");

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setOwnerUid(user?.uid || "");
      setAuthReady(true);
    });

    return () => unsub();
  }, []);

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

  function handleHubChange(value: string) {
    setHubId(value);

    const found = HUB_OPTIONS.find((hub) => hub.id === value);

    if (found) {
      setHubName(found.label);

      if (!safeText(area)) {
        setArea(found.area);
      }
    } else {
      setHubName("");
    }
  }

  async function handleSave(mode: "draft" | "publish") {
    if (!ownerUid) {
      setMsg("Please log in first.");
      return;
    }

    if (safeText(name).length < 2) {
      setMsg("Restaurant name must be at least 2 characters.");
      return;
    }

    if (mode === "publish") {
      if (!safeText(hubId)) {
        setMsg("Please select a hub.");
        return;
      }

      if (!safeText(cuisine)) {
        setMsg("Please select a cuisine.");
        return;
      }

      if (!safeText(shortDescription)) {
        setMsg("Please enter a short description.");
        return;
      }
    }

    const foundHub = HUB_OPTIONS.find((hub) => hub.id === hubId);
    const finalHubName = safeText(hubName) || foundHub?.label || "";
    const finalArea = safeText(area) || foundHub?.area || "";

    let finalStatus: RestaurantStatus = "draft";

    if (mode === "draft") {
      finalStatus = "draft";
    } else {
      finalStatus = status === "draft" ? "active" : status;
    }

    try {
      setSaving(true);
      setMsg(mode === "draft" ? "Saving draft..." : "Saving restaurant profile...");

      const docRef = await addDoc(collection(db, "restaurants"), {
        name: safeText(name),
        slug,
        ownerUid,
        ownerName: safeText(ownerName),
        phone: safeText(phone),
        email: safeText(email),

        hubId: safeText(hubId),
        hubName: finalHubName,
        area: finalArea,
        locationId: safeText(locationId),
        postcode: safeText(postcode),
        fullAddress: safeText(fullAddress),

        cuisine: safeText(cuisine),
        tags,
        priceRange,

        shortDescription: safeText(shortDescription),
        longDescription: safeText(longDescription),
        popularItems,

        menuCategories: [],

        coverImage: safeText(coverImage),
        galleryImages: [],
        videoUrl: safeText(videoUrl),

        websiteUrl: safeText(websiteUrl),
        facebookUrl: safeText(facebookUrl),
        instagramUrl: safeText(instagramUrl),
        tiktokUrl: safeText(tiktokUrl),

        openingHoursText: safeText(openingHoursText),

        dineIn,
        takeaway,
        delivery,
        collectionEnabled,

        isHalal,
        isHmcApproved,

        rating: 0,
        reviewCount: 0,
        visitCount: 0,

        isPremium,
        subscriptionPlan,
        offersEnabled,
        loyaltyEnabled,
        adsEnabled,

        status: finalStatus,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setStatus(finalStatus);
      setHubName(finalHubName);
      setArea(finalArea);
      setMsg(mode === "draft" ? "Draft saved." : "Restaurant profile saved.");

      router.push(`/restaurants/${docRef.id}/edit`);
    } catch (error) {
      console.error(error);
      setMsg(
        mode === "draft"
          ? "Failed to save draft."
          : "Failed to save restaurant profile."
      );
    } finally {
      setSaving(false);
    }
  }

  if (!authReady) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <div className="text-sm text-neutral-600">Checking login...</div>
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
            You need to be logged in before creating a restaurant profile.
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-2xl font-bold tracking-tight text-neutral-900">
            Create Restaurant Profile
          </div>
          <div className="mt-1 text-sm text-neutral-600">
            Add a new restaurant, food stall, or food court operator profile.
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/restaurants"
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            Back to restaurants
          </Link>

          <button
            onClick={() => handleSave("draft")}
            disabled={saving}
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save draft"}
          </button>

          <button
            onClick={() => handleSave("publish")}
            disabled={saving}
            className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save restaurant"}
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-700">
        <span className="font-semibold text-neutral-900">Status:</span>{" "}
        {msg || "Ready"}
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
                Auto slug
              </label>
              <input
                value={slug}
                readOnly
                className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-600 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700">
                Owner name
              </label>
              <input
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g. Abdul Karim"
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
                placeholder="e.g. +44 7..."
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
                placeholder="e.g. hello@restaurant.com"
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
                placeholder="e.g. Brick Lane"
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
                placeholder="e.g. Stratford"
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
                placeholder="e.g. westfield-level-1-food-court"
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
                placeholder="e.g. halal, biryani, grill, vegetarian"
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
                placeholder="One-line summary for cards and listings"
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700">
                Long description
              </label>
              <textarea
                value={longDescription}
                onChange={(e) => setLongDescription(e.target.value)}
                placeholder="Tell customers about food, history, uniqueness, service style..."
                rows={5}
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
            <div>
              <label className="text-xs font-semibold text-neutral-700">
                Cover image URL
              </label>
              <input
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="Paste image URL for now"
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700">
                Video URL
              </label>
              <input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="Paste 30 sec video URL for now"
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
                placeholder="e.g. https://restaurant.com"
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
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleSave("draft")}
            disabled={saving}
            className="rounded-xl border border-neutral-300 px-5 py-3 text-sm font-semibold text-neutral-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save draft"}
          </button>

          <button
            onClick={() => handleSave("publish")}
            disabled={saving}
            className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save restaurant"}
          </button>

          <Link
            href="/restaurants"
            className="rounded-xl border border-neutral-300 px-5 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}