"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { isRTLLocale } from "@/lib/locales";

type RestaurantCardProps = {
  name: string;
  cuisine: string;
  area: string;
  tags?: string[];
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

// Tag translation is a small, fixed vocabulary of service/feature
// labels a restaurant can carry (not free text), so it's kept as a
// lookup table here rather than routed through the message catalogs —
// this list is stable and unlikely to grow much. Cuisine names are
// NOT translated here — see docs/CUISINE-TAXONOMY.md, which handles
// cuisine display names separately via Cuisine.localizedName.
const TAG_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    "Dine-in": "Dine-in", Takeaway: "Takeaway", Delivery: "Delivery", Collection: "Collection",
    Halal: "Halal", "HMC Approved": "HMC Approved", Premium: "Premium",
    "Live Listing": "Live Listing", Pending: "Pending", Catering: "Catering", Grill: "Grill",
    Coffee: "Coffee", "Food Court": "Food Court", Busy: "Busy", Tourist: "Tourist", Value: "Value",
  },
  bn: {
    "Dine-in": "বসে খাওয়া", Takeaway: "টেকঅ্যাওয়ে", Delivery: "ডেলিভারি", Collection: "সংগ্রহ",
    Halal: "হালাল", "HMC Approved": "HMC অনুমোদিত", Premium: "প্রিমিয়াম",
    "Live Listing": "লাইভ লিস্টিং", Pending: "অপেক্ষমাণ", Catering: "ক্যাটারিং", Grill: "গ্রিল",
    Coffee: "কফি", "Food Court": "ফুড কোর্ট", Busy: "ব্যস্ত", Tourist: "পর্যটকপ্রিয়", Value: "সাশ্রয়ী",
  },
  ar: {
    "Dine-in": "الأكل داخل المطعم", Takeaway: "سفري", Delivery: "توصيل", Collection: "استلام",
    Halal: "حلال", "HMC Approved": "معتمد من HMC", Premium: "بريميوم",
    "Live Listing": "إدراج مباشر", Pending: "بانتظار", Catering: "خدمات تموين", Grill: "مشويات",
    Coffee: "قهوة", "Food Court": "ساحة طعام", Busy: "مزدحم", Tourist: "سياحي", Value: "قيمة جيدة",
  },
  fr: {
    "Dine-in": "Sur place", Takeaway: "À emporter", Delivery: "Livraison", Collection: "Retrait",
    Halal: "Halal", "HMC Approved": "Approuvé HMC", Premium: "Premium",
    "Live Listing": "Annonce en ligne", Pending: "En attente", Catering: "Traiteur", Grill: "Grillades",
    Coffee: "Café", "Food Court": "Aire de restauration", Busy: "Très fréquenté", Tourist: "Touristique",
    Value: "Bon rapport qualité-prix",
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
  popularItems = [],
  href,
  shortDescription = "",
  imageUrl = "",
  rating = 0,
  reviewCount = 0,
}: RestaurantCardProps) {
  const locale = useLocale();
  const t = useTranslations("Restaurants");
  const isRtl = isRTLLocale(locale);

  const safeName = safeText(name) || "Restaurant";
  const hasRating = reviewCount > 0 && rating > 0;
  const safeCuisine = safeText(cuisine) || "Cuisine";
  const safeArea = safeText(area) || "Area";
  const safeDescription = safeText(shortDescription);

  const safeTags = tags.map((tag) => safeText(tag)).filter(Boolean).slice(0, 5);

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

            <p className="mt-3 min-h-18 line-clamp-3 text-sm leading-6 text-neutral-700">
              {safeDescription}
            </p>
          </div>

          {safeTags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {safeTags.map((tag, index) => (
                <span
                  key={`${tag}-${index}`}
                  className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900"
                >
                  {translateTag(tag)}
                </span>
              ))}
            </div>
          )}

          {safePopularItems.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-medium text-neutral-900">
                {t("highlights")}
              </div>

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
