"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { isRTLLocale } from "@/lib/locales";
import { DIETARY_ATTRIBUTE_TRANSLATION_KEY } from "@/lib/dietary";
import type { DietaryAttribute } from "@/lib/types";

type RestaurantCardProps = {
  name: string;
  cuisine: string;
  area: string;
  /** Platform-generated status/feature labels ONLY — e.g. "Live
   *  Listing", "Premium", "HMC Approved", a service type, a price
   *  range. Translated via TAG_TRANSLATIONS below. NEVER pass a
   *  restaurant's own free-text tags here — see `ownerTags`. */
  tags?: string[];
  /** The restaurant's own self-declared dietary attributes — see
   *  docs/RESTAURANT-DATA-PROVENANCE.md. This is platform-defined
   *  vocabulary (the fixed DietaryAttribute set), not free text, so
   *  translating it is correct — unlike `ownerTags`. */
  dietaryAttributes?: DietaryAttribute[];
  /** The restaurant's OWN free-text tags (the `tags` field on
   *  RestaurantDoc a restaurant owner typed themselves — e.g. "family
   *  dining", "biryani"). Per London Food Hubs' translation policy
   *  (see docs/MULTILINGUAL-ARCHITECTURE.md's "Restaurant-supplied
   *  content" section), this is restaurant-supplied content and is
   *  NEVER auto-translated — rendered exactly as the owner wrote it,
   *  in every locale, unless the owner has requested and approved a
   *  paid translation (not implemented yet — see that doc). Do not
   *  route these through `tags`/TAG_TRANSLATIONS. */
  ownerTags?: string[];
  /** The restaurant's own popular-dish names — also restaurant-
   *  supplied content, also never translated (dish names are
   *  explicitly covered by the same policy). Already rendered as-is
   *  below; documented here so a future edit doesn't accidentally
   *  wrap this in a translation call. */
  popularItems?: string[];
  href: string;
  shortDescription?: string;
  imageUrl?: string;
  /** Trusted aggregate only — maintained server-side by a Cloud
   *  Function from approved reviews (see functions/index.js), never
   *  written by a client. Omit/zero reviewCount hides the badge
   *  rather than showing a fake "0.0 (0)". */
  rating?: number;
  reviewCount?: number;
};

// Small, fixed vocabulary of PLATFORM-generated service/status labels
// — never restaurant free text. See the `tags` prop's own doc comment
// above for the line this must not cross. Cuisine names are NOT
// translated here — see docs/CUISINE-TAXONOMY.md, which handles
// cuisine display names separately via Cuisine.localizedName.
const TAG_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    "Dine-in": "Dine-in", Takeaway: "Takeaway", Delivery: "Delivery", Collection: "Collection",
    Halal: "Halal", "HMC Approved": "HMC Approved", Premium: "Premium",
    "Live Listing": "Live Listing", Pending: "Pending",
  },
  bn: {
    "Dine-in": "বসে খাওয়া", Takeaway: "টেকঅ্যাওয়ে", Delivery: "ডেলিভারি", Collection: "সংগ্রহ",
    Halal: "হালাল", "HMC Approved": "HMC অনুমোদিত", Premium: "প্রিমিয়াম",
    "Live Listing": "লাইভ লিস্টিং", Pending: "অপেক্ষমাণ",
  },
  ar: {
    "Dine-in": "الأكل داخل المطعم", Takeaway: "سفري", Delivery: "توصيل", Collection: "استلام",
    Halal: "حلال", "HMC Approved": "معتمد من HMC", Premium: "بريميوم",
    "Live Listing": "إدراج مباشر", Pending: "بانتظار",
  },
  fr: {
    "Dine-in": "Sur place", Takeaway: "À emporter", Delivery: "Livraison", Collection: "Retrait",
    Halal: "Halal", "HMC Approved": "Approuvé HMC", Premium: "Premium",
    "Live Listing": "Annonce en ligne", Pending: "En attente",
  },
};

function safeText(value?: string) {
  return (value || "").trim();
}

export default function RestaurantCard({
  name,
  cuisine,
  area,
  tags = [],
  dietaryAttributes = [],
  ownerTags = [],
  popularItems = [],
  href,
  shortDescription = "",
  imageUrl = "",
  rating = 0,
  reviewCount = 0,
}: RestaurantCardProps) {
  const locale = useLocale();
  const t = useTranslations("Restaurants");
  const tDietary = useTranslations("Dietary");
  const isRtl = isRTLLocale(locale);

  const safeName = safeText(name) || "Restaurant";
  const hasRating = reviewCount > 0 && rating > 0;
  const safeCuisine = safeText(cuisine) || "Cuisine";
  const safeArea = safeText(area) || "Area";
  const safeDescription = safeText(shortDescription);

  const safeTags = tags.map((tag) => safeText(tag)).filter(Boolean).slice(0, 3);
  const safeOwnerTags = ownerTags.map((tag) => safeText(tag)).filter(Boolean).slice(0, 3);

  const safePopularItems = popularItems
    .map((item) => safeText(item))
    .filter(Boolean)
    .slice(0, 4);

  const safeImageUrl = safeText(imageUrl);
  const tagLookup = TAG_TRANSLATIONS[locale] ?? TAG_TRANSLATIONS.en;

  function translateTag(tag: string) {
    return tagLookup[tag] || TAG_TRANSLATIONS.en[tag] || tag;
  }

  return (
    <Link href={href} className="group block h-full">
      <div
        dir={isRtl ? "rtl" : "ltr"}
        className="flex h-full min-h-117.5 flex-col overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
      >
        <div className="relative h-44 w-full overflow-hidden bg-amber-50">
          {safeImageUrl ? (
            <img
              src={safeImageUrl}
              alt={safeName}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-end bg-linear-to-br from-amber-200 via-orange-100 to-rose-100 p-4">
              <div className="rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-amber-900 shadow-sm">
                {safeCuisine}
              </div>
            </div>
          )}

          {safeImageUrl ? (
            <div
              className={`absolute top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-amber-900 shadow-sm ${
                isRtl ? "right-3" : "left-3"
              }`}
            >
              {safeCuisine}
            </div>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div>
            <h3 className="line-clamp-2 text-xl font-semibold text-neutral-900">
              {safeName}
            </h3>

            <div className="mt-1 flex items-center gap-2 text-sm text-neutral-600">
              <span>{safeArea}</span>
              {hasRating ? (
                <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                  <span aria-hidden="true">★</span>
                  {rating.toFixed(1)}
                  <span className="font-normal text-neutral-500">({reviewCount})</span>
                </span>
              ) : null}
            </div>

            {/* Restaurant-supplied content (shortDescription) — never
                translated, shown exactly as the owner wrote it. See
                docs/MULTILINGUAL-ARCHITECTURE.md's translation policy. */}
            <p className="mt-3 min-h-18 line-clamp-3 text-sm leading-6 text-neutral-700">
              {safeDescription}
            </p>
          </div>

          {safeTags.length > 0 || dietaryAttributes.length > 0 || safeOwnerTags.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {safeTags.map((tag, index) => (
                <span
                  key={`platform-${tag}-${index}`}
                  className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900"
                >
                  {translateTag(tag)}
                </span>
              ))}
              {dietaryAttributes.map((attr) => (
                <span
                  key={`dietary-${attr}`}
                  className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-900"
                >
                  {tDietary(DIETARY_ATTRIBUTE_TRANSLATION_KEY[attr])}
                </span>
              ))}
              {/* Restaurant-supplied free-text tags — never translated,
                  shown exactly as the owner wrote them. */}
              {safeOwnerTags.map((tag, index) => (
                <span
                  key={`owner-${tag}-${index}`}
                  className="rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-medium text-amber-900"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          {safePopularItems.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-medium text-neutral-900">
                {t("highlights")}
              </div>

              {/* Restaurant-supplied dish names — never translated. */}
              <div className="mt-2 flex flex-wrap gap-2">
                {safePopularItems.map((item, index) => (
                  <span
                    key={`${item}-${index}`}
                    className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-auto pt-5">
            <div className="w-full rounded-xl bg-amber-600 px-4 py-3 text-center text-sm font-semibold text-white transition-colors duration-200 group-hover:bg-amber-700">
              {t("viewProfileMenu")} →
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
