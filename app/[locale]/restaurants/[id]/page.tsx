"use client";

import NextLink from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import RestaurantReviews from "@/components/reviews/RestaurantReviews";
import { isRTLLocale } from "@/lib/locales";
import type {
  DietaryAttribute,
  RestaurantDataConfidence,
  RestaurantOwnerClaimStatus,
  RestaurantSourceType,
} from "@/lib/types";
import SiteHeader from "@/components/discovery/SiteHeader";
import SiteFooter from "@/components/discovery/SiteFooter";
import PublicListingNotice from "@/components/restaurants/PublicListingNotice";
import RestaurantClaimPanel from "@/components/restaurants/RestaurantClaimPanel";

type MenuItem = {
  name: string;
  price: string;
  note?: string;
};

type MenuCategory = {
  category: string;
  items: MenuItem[];
};

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
  dietaryAttributes?: DietaryAttribute[];
  dietaryCertifications?: DietaryAttribute[];

  cuisineSlugs?: string[];
  primaryCuisineSlug?: string;

  sourceType?: RestaurantSourceType;
  sourceName?: string;
  dataConfidence?: RestaurantDataConfidence;
  ownerClaimStatus?: RestaurantOwnerClaimStatus;
  claimantUid?: string;

  isPremium?: boolean;
  subscriptionPlan?: "free" | "premium";
  offersEnabled?: boolean;
  loyaltyEnabled?: boolean;
  adsEnabled?: boolean;

  status?: "draft" | "active" | "pending" | "blocked";
  menuCategories?: MenuCategory[];

  createdAt?: any;
  updatedAt?: any;
};

// Maps DietaryAttribute's snake_case values to the Dietary message
// namespace's camelCase keys.
const DIETARY_TRANSLATION_KEY: Record<DietaryAttribute, string> = {
  vegetarian: "vegetarian",
  vegan: "vegan",
  non_vegetarian: "nonVegetarian",
  halal: "halal",
  kosher: "kosher",
  jain: "jain",
};

function normalizeUrl(url?: string) {
  const trimmed = (url || "").trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function safeText(value?: string) {
  return (value || "").trim();
}

export default function RestaurantDetailPage() {
  const params = useParams();
  const rawId = String(params?.id || "");
  const locale = useLocale();
  const t = useTranslations("RestaurantDetail");
  const tDietary = useTranslations("Dietary");
  const isRtl = isRTLLocale(locale);

  const [restaurant, setRestaurant] = useState<LiveRestaurant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRestaurant() {
      try {
        setLoading(true);

        if (!rawId) {
          setRestaurant(null);
          return;
        }

        const snap = await getDoc(doc(db, "restaurants", rawId));

        if (!snap.exists()) {
          setRestaurant(null);
          return;
        }

        const data = snap.data() as Omit<LiveRestaurant, "id">;

        setRestaurant({ id: snap.id, ...data });
      } catch (error) {
        console.error("Failed to load restaurant details:", error);
        setRestaurant(null);
      } finally {
        setLoading(false);
      }
    }

    loadRestaurant();
  }, [rawId]);

  const serviceLabels = useMemo(() => {
    if (!restaurant) return [];

    const labels: string[] = [];
    if (restaurant.dineIn) labels.push(t("dineIn"));
    if (restaurant.takeaway) labels.push(t("takeaway"));
    if (restaurant.delivery) labels.push(t("delivery"));
    if (restaurant.collectionEnabled) labels.push(t("collection"));
    return labels;
  }, [restaurant, t]);

  const visibleMenuCategories = useMemo(() => {
    return (restaurant?.menuCategories || [])
      .map((cat) => ({
        category: safeText(cat?.category),
        items: Array.isArray(cat?.items)
          ? cat.items.filter((item) => safeText(item?.name) || safeText(item?.price) || safeText(item?.note))
          : [],
      }))
      .filter((cat) => cat.category || cat.items.length > 0);
  }, [restaurant]);

  const websiteUrl = normalizeUrl(restaurant?.websiteUrl);
  const facebookUrl = normalizeUrl(restaurant?.facebookUrl);
  const instagramUrl = normalizeUrl(restaurant?.instagramUrl);
  const tiktokUrl = normalizeUrl(restaurant?.tiktokUrl);
  const videoUrl = normalizeUrl(restaurant?.videoUrl);
  const phoneHref = safeText(restaurant?.phone) ? `tel:${safeText(restaurant?.phone)}` : "";
  const emailHref = safeText(restaurant?.email) ? `mailto:${safeText(restaurant?.email)}` : "";

  const locationText =
    safeText(restaurant?.fullAddress) ||
    [safeText(restaurant?.area), safeText(restaurant?.postcode)].filter(Boolean).join(", ");

  if (loading) {
    return (
      <>
        <SiteHeader />
        <main dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-neutral-50 px-4 py-8 md:px-6">
          <div className="mx-auto max-w-6xl rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-neutral-900">{t("loadingTitle")}</h1>
            <p className="mt-3 text-neutral-600">{t("loadingText")}</p>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  if (!restaurant) {
    return (
      <>
        <SiteHeader />
        <main dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-neutral-50 px-4 py-8 md:px-6">
          <div className="mx-auto max-w-6xl rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-neutral-900">{t("notFoundTitle")}</h1>
            <p className="mt-3 text-neutral-600">{t("notFoundText")}</p>
            <Link href="/restaurants" className="mt-6 inline-flex rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white">
              {t("backToRestaurants")}
            </Link>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  const statusLabel =
    restaurant.status === "active"
      ? t("liveListing")
      : restaurant.status === "pending"
      ? t("pendingApproval")
      : restaurant.status === "blocked"
      ? t("blocked")
      : t("draft");

  const statusBadgeClass =
    restaurant.status === "active"
      ? "bg-green-100 text-green-800"
      : restaurant.status === "pending"
      ? "bg-amber-100 text-amber-800"
      : restaurant.status === "blocked"
      ? "bg-red-100 text-red-800"
      : "bg-neutral-200 text-neutral-700";

  const statusDescription =
    restaurant.status === "active"
      ? t("activeStatusText")
      : restaurant.status === "pending"
      ? t("pendingStatusText")
      : restaurant.status === "blocked"
      ? t("blockedStatusText")
      : t("draftStatusText");

  return (
    <>
      <SiteHeader />
      <main dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-neutral-50 px-4 py-8 md:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-3">
            <Link
              href="/restaurants"
              className="inline-flex rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              {t("backToRestaurants")}
            </Link>

            <NextLink
              href={`/restaurants/${restaurant.id}/edit`}
              className="inline-flex rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              {t("editProfile")}
            </NextLink>
          </div>
        </div>

        <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
          {safeText(restaurant.coverImage) ? (
            <div className="relative h-64 w-full bg-neutral-100 md:h-96">
              <img src={restaurant.coverImage} alt={restaurant.name} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-linear-to-t from-black/50 via-black/10 to-transparent" />
            </div>
          ) : (
            <div className="flex h-56 flex-col items-center justify-center bg-neutral-200 px-6 text-center md:h-72">
              <div className="text-lg font-semibold text-neutral-700">{t("coverMissing")}</div>
              <div className="mt-2 text-sm text-neutral-500">{t("addCoverFromEdit")}</div>
            </div>
          )}

          <div className="p-8">
            <div className="flex flex-wrap items-center gap-2">
              {safeText(restaurant.hubName) ? (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                  {restaurant.hubName}
                </span>
              ) : null}

              {safeText(restaurant.cuisine) ? (
                <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
                  {restaurant.cuisine}
                </span>
              ) : null}

              {safeText(restaurant.priceRange) ? (
                <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
                  {restaurant.priceRange}
                </span>
              ) : null}

              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass}`}>
                {statusLabel}
              </span>

              {restaurant.isHalal ? (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                  {t("halal")}
                </span>
              ) : null}

              {restaurant.isHmcApproved ? (
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                  {t("hmcApproved")}
                </span>
              ) : null}

              {[...new Set([...(restaurant.dietaryAttributes || []), ...(restaurant.dietaryCertifications || [])])]
                .filter((attr) => attr !== "halal")
                .map((attr) => (
                  <span
                    key={attr}
                    className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800"
                  >
                    {tDietary(DIETARY_TRANSLATION_KEY[attr])}
                  </span>
                ))}

              {restaurant.isPremium ? (
                <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800">
                  {t("premium")}
                </span>
              ) : null}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <div className="text-sm font-medium text-neutral-500">{t("openingSoon")}</div>

                <h1 className="mt-2 text-3xl font-bold text-neutral-900 md:text-5xl">{restaurant.name}</h1>

                <p className="mt-4 max-w-4xl text-base leading-7 text-neutral-700">
                  {safeText(restaurant.shortDescription) || t("defaultShortDescription")}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {phoneHref ? (
                  <a href={phoneHref} className="inline-flex rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white hover:opacity-90">
                    {t("callNow")}
                  </a>
                ) : null}

                {emailHref ? (
                  <a
                    href={emailHref}
                    className="inline-flex rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                  >
                    {t("emailNow")}
                  </a>
                ) : null}

                <NextLink
                  href="/events/new"
                  className="inline-flex rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  {t("planEvent")}
                </NextLink>
              </div>
            </div>

            {restaurant.tags && restaurant.tags.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {restaurant.tags
                  .filter((tag) => safeText(tag))
                  .map((tag, index) => (
                    <span
                      key={`${tag}-${index}`}
                      className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-700"
                    >
                      {tag}
                    </span>
                  ))}
              </div>
            ) : null}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="space-y-6 lg:col-span-2">
            <section className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-neutral-900">{t("aboutTitle")}</h2>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-neutral-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{t("owner")}</div>
                  <div className="mt-2 text-sm font-medium text-neutral-900">
                    {safeText(restaurant.ownerName) || t("notAdded")}
                  </div>
                </div>

                <div className="rounded-2xl bg-neutral-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{t("phone")}</div>
                  <div className="mt-2 text-sm font-medium text-neutral-900">
                    {safeText(restaurant.phone) || t("notAdded")}
                  </div>
                </div>

                <div className="rounded-2xl bg-neutral-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{t("email")}</div>
                  <div className="mt-2 break-all text-sm font-medium text-neutral-900">
                    {safeText(restaurant.email) || t("notAdded")}
                  </div>
                </div>

                <div className="rounded-2xl bg-neutral-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{t("website")}</div>
                  <div className="mt-2 text-sm font-medium text-neutral-900">
                    {websiteUrl ? (
                      <a href={websiteUrl} target="_blank" rel="noreferrer" className="break-all text-amber-700 underline underline-offset-4">
                        {t("visitWebsite")}
                      </a>
                    ) : (
                      t("notAdded")
                    )}
                  </div>
                </div>

                <div className="rounded-2xl bg-neutral-50 p-4 md:col-span-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{t("address")}</div>
                  <div className="mt-2 text-sm font-medium text-neutral-900">{locationText || t("notAdded")}</div>
                </div>
              </div>

              {safeText(restaurant.longDescription) ? (
                <div className="mt-6 rounded-2xl border border-neutral-200 p-5">
                  <div className="text-sm font-semibold text-neutral-900">{t("fullDescription")}</div>
                  <p className="mt-3 whitespace-pre-line text-sm leading-7 text-neutral-700">
                    {restaurant.longDescription}
                  </p>
                </div>
              ) : null}
            </section>

            <section className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-neutral-900">{t("popularItems")}</h2>

              {restaurant.popularItems && restaurant.popularItems.filter((item) => safeText(item)).length > 0 ? (
                <div className="mt-6 flex flex-wrap gap-3">
                  {restaurant.popularItems
                    .filter((item) => safeText(item))
                    .map((item, index) => (
                      <span
                        key={`${item}-${index}`}
                        className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-medium text-neutral-800"
                      >
                        {item}
                      </span>
                    ))}
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 p-6 text-sm text-neutral-500">
                  {t("popularItemsEmpty")}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-neutral-900">{t("menu")}</h2>

              {visibleMenuCategories.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 p-6 text-sm text-neutral-500">
                  {t("fullMenuEmpty")}
                </div>
              ) : (
                <div className="mt-6 space-y-5">
                  {visibleMenuCategories.map((category, categoryIndex) => (
                    <div key={`${category.category}-${categoryIndex}`} className="rounded-2xl border border-neutral-200 p-5">
                      <h3 className="text-lg font-semibold text-neutral-900">
                        {category.category || t("untitledCategory")}
                      </h3>

                      {category.items && category.items.length > 0 ? (
                        <div className="mt-4 space-y-3">
                          {category.items.map((item, itemIndex) => (
                            <div key={`${item.name}-${itemIndex}`} className="rounded-xl bg-neutral-50 p-4">
                              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                                <div>
                                  <div className="text-sm font-semibold text-neutral-900">
                                    {safeText(item.name) || t("unnamedItem")}
                                  </div>
                                  {safeText(item.note) ? (
                                    <div className="mt-1 text-sm text-neutral-600">{item.note}</div>
                                  ) : null}
                                </div>

                                <div className="text-sm font-semibold text-neutral-900">
                                  {safeText(item.price) || t("priceOnRequest")}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-4 rounded-xl border border-dashed border-neutral-300 p-4 text-sm text-neutral-500">
                          {t("noItemsInCategory")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-neutral-900">{t("location")}</h2>

              {locationText ? (
                <div className="mt-6 rounded-2xl bg-neutral-50 p-6">
                  <div className="text-lg font-semibold text-neutral-900">{locationText}</div>
                  {safeText(restaurant.hubName) || safeText(restaurant.area) ? (
                    <div className="mt-3 text-sm text-neutral-600">
                      {[safeText(restaurant.hubName), safeText(restaurant.area)].filter(Boolean).join(" • ")}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 p-6 text-sm text-neutral-500">
                  {t("locationEmpty")}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-neutral-900">{t("gallery")}</h2>

              <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 p-8 text-sm text-neutral-500">
                {t("galleryEmpty")}
              </div>
            </section>

            <section className="space-y-4">
              <PublicListingNotice
                sourceType={restaurant.sourceType}
                sourceName={restaurant.sourceName}
                ownerClaimStatus={restaurant.ownerClaimStatus}
                dataConfidence={restaurant.dataConfidence}
              />
              <RestaurantClaimPanel
                restaurantId={restaurant.id}
                restaurantName={restaurant.name}
                ownerUid={restaurant.ownerUid}
                ownerClaimStatus={restaurant.ownerClaimStatus}
              />
            </section>

            <RestaurantReviews restaurantId={restaurant.id} restaurantName={restaurant.name} />
          </section>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-neutral-900">{t("quickActions")}</h2>

              <div className="mt-4 flex flex-col gap-3">
                {phoneHref ? (
                  <a
                    href={phoneHref}
                    className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
                  >
                    {t("callNow")}
                  </a>
                ) : null}

                {emailHref ? (
                  <a
                    href={emailHref}
                    className="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                  >
                    {t("emailNow")}
                  </a>
                ) : null}

                <NextLink
                  href="/events/new"
                  className="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  {t("planEvent")}
                </NextLink>
              </div>
            </section>

            <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-neutral-900">{t("status")}</h2>
              <div className="mt-4">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass}`}>
                  {statusLabel}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-neutral-600">{statusDescription}</p>
            </section>

            <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-neutral-900">{t("quickInfo")}</h2>

              <div className="mt-4 space-y-3 text-sm text-neutral-700">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-neutral-500">{t("restaurantId")}</span>
                  <span className="break-all text-right font-medium text-neutral-900">{restaurant.id}</span>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <span className="text-neutral-500">{t("hub")}</span>
                  <span className="text-right font-medium text-neutral-900">
                    {safeText(restaurant.hubName) || t("notAdded")}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <span className="text-neutral-500">{t("area")}</span>
                  <span className="text-right font-medium text-neutral-900">
                    {safeText(restaurant.area) || t("notAdded")}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <span className="text-neutral-500">{t("cuisine")}</span>
                  <span className="text-right font-medium text-neutral-900">
                    {safeText(restaurant.cuisine) || t("notAdded")}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <span className="text-neutral-500">{t("openingHours")}</span>
                  <span className="whitespace-pre-line text-right font-medium text-neutral-900">
                    {safeText(restaurant.openingHoursText) || t("notAddedYet")}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <span className="text-neutral-500">{t("locationId")}</span>
                  <span className="text-right font-medium text-neutral-900">
                    {safeText(restaurant.locationId) || t("notAdded")}
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-neutral-900">{t("serviceOptions")}</h2>

              {serviceLabels.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {serviceLabels.map((label) => (
                    <span key={label} className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
                      {label}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="mt-4 text-sm text-neutral-500">{t("noServiceOptions")}</div>
              )}
            </section>

            <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-neutral-900">{t("onlineLinks")}</h2>

              <div className="mt-4 space-y-3 text-sm">
                <div>
                  {websiteUrl ? (
                    <a href={websiteUrl} target="_blank" rel="noreferrer" className="break-all font-medium text-amber-700 underline underline-offset-4">
                      {t("website")}
                    </a>
                  ) : (
                    <span className="text-neutral-500">{t("websiteNotAdded")}</span>
                  )}
                </div>

                <div>
                  {facebookUrl ? (
                    <a href={facebookUrl} target="_blank" rel="noreferrer" className="break-all font-medium text-amber-700 underline underline-offset-4">
                      {t("facebook")}
                    </a>
                  ) : (
                    <span className="text-neutral-500">{t("facebookNotAdded")}</span>
                  )}
                </div>

                <div>
                  {instagramUrl ? (
                    <a href={instagramUrl} target="_blank" rel="noreferrer" className="break-all font-medium text-amber-700 underline underline-offset-4">
                      {t("instagram")}
                    </a>
                  ) : (
                    <span className="text-neutral-500">{t("instagramNotAdded")}</span>
                  )}
                </div>

                <div>
                  {tiktokUrl ? (
                    <a href={tiktokUrl} target="_blank" rel="noreferrer" className="break-all font-medium text-amber-700 underline underline-offset-4">
                      TikTok
                    </a>
                  ) : (
                    <span className="text-neutral-500">{t("tiktokNotAdded")}</span>
                  )}
                </div>

                <div>
                  {videoUrl ? (
                    <a href={videoUrl} target="_blank" rel="noreferrer" className="break-all font-medium text-amber-700 underline underline-offset-4">
                      {t("promoVideo")}
                    </a>
                  ) : (
                    <span className="text-neutral-500">{t("videoNotAdded")}</span>
                  )}
                </div>
              </div>
            </section>

            {(restaurant.offersEnabled || restaurant.loyaltyEnabled || restaurant.adsEnabled) && (
              <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-neutral-900">{t("businessFeatures")}</h2>

                <div className="mt-4 flex flex-wrap gap-2">
                  {restaurant.offersEnabled ? (
                    <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800">
                      {t("offersEnabled")}
                    </span>
                  ) : null}

                  {restaurant.loyaltyEnabled ? (
                    <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800">
                      {t("loyaltyEnabled")}
                    </span>
                  ) : null}

                  {restaurant.adsEnabled ? (
                    <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800">
                      {t("adsEnabled")}
                    </span>
                  ) : null}
                </div>
              </section>
            )}
          </aside>
        </div>
      </div>
      </main>
      <SiteFooter />
    </>
  );
}
