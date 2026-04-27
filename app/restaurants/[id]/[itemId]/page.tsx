"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  restaurantsSample,
  menuItemsSample,
} from "@/lib/restaurantMenuSampleData";

type Lang = "en" | "fr" | "it" | "es" | "de";

function getDishName(item: (typeof menuItemsSample)[number], lang: Lang) {
  switch (lang) {
    case "fr":
      return item.name_fr || item.name_en;
    case "it":
      return item.name_it || item.name_en;
    case "es":
      return item.name_es || item.name_en;
    case "de":
      return item.name_de || item.name_en;
    case "en":
    default:
      return item.name_en;
  }
}

function langLabel(lang: Lang) {
  switch (lang) {
    case "en":
      return "English";
    case "fr":
      return "French";
    case "it":
      return "Italian";
    case "es":
      return "Spanish";
    case "de":
      return "German";
    default:
      return lang;
  }
}

export default function MenuItemPage() {
  const params = useParams<{ id: string; itemId: string }>();
  const [selectedLang, setSelectedLang] = useState<Lang>("en");

  const restaurant = restaurantsSample.find((r) => r.id === params.id);
  const item = menuItemsSample.find(
    (m) => m.id === params.itemId && m.restaurantId === params.id
  );

  const displayName = useMemo(() => {
    if (!item) return "";
    return getDishName(item, selectedLang);
  }, [item, selectedLang]);

  if (!restaurant || !item) {
    return <div className="p-6">Dish not found</div>;
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <Link
        href={`/restaurants/${restaurant.id}`}
        className="inline-flex rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-800 hover:bg-neutral-50"
      >
        ← Back to Menu
      </Link>

      <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-2 text-sm text-neutral-500">
          {restaurant.name}
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {(["en", "fr", "it", "es", "de"] as Lang[]).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setSelectedLang(lang)}
              className={`rounded-full px-4 py-2 text-sm ${
                selectedLang === lang
                  ? "bg-black text-white"
                  : "bg-neutral-200 text-neutral-800"
              }`}
            >
              {langLabel(lang)}
            </button>
          ))}
        </div>

        <div className="flex items-start justify-between">
  <div>
    <h1 className="text-3xl font-bold text-neutral-900">
      {displayName}
    </h1>

    {item.isPopular && (
      <span className="mt-2 inline-block rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-600">
        🔥 Popular
      </span>
    )}
  </div>
</div>

        {item.description_en && (
          <p className="mt-3 text-base text-neutral-600">
            {item.description_en}
          </p>
        )}

        <div className="mt-6 space-y-2 text-sm text-neutral-700">
          {item.priceMode === "single" && (
            <div>
              <span className="font-semibold text-neutral-900">Price:</span>{" "}
              £{item.price?.toFixed(2)}
            </div>
          )}

          {item.priceMode === "separate" && (
            <>
              <div>
                <span className="font-semibold text-neutral-900">
                  Eat-in:
                </span>{" "}
                £{item.eatInPrice?.toFixed(2)}
              </div>
              <div>
                <span className="font-semibold text-neutral-900">
                  Takeaway:
                </span>{" "}
                £{item.takeawayPrice?.toFixed(2)}
              </div>
            </>
          )}

          <div>
            <span className="font-semibold text-neutral-900">Popular:</span>{" "}
            {item.isPopular ? "Yes" : "No"}
          </div>

          <div>
            <span className="font-semibold text-neutral-900">
              Current language:
            </span>{" "}
            {langLabel(selectedLang)}
          </div>
        </div>

        <div className="mt-6 border-t border-neutral-200 pt-4">
          <h2 className="text-lg font-semibold text-neutral-900">
            Available translations
          </h2>

          <div className="mt-3 space-y-2 text-sm text-neutral-700">
            <div>
              <span className="font-semibold text-neutral-900">English:</span>{" "}
              {item.name_en}
            </div>
            {item.name_fr && (
              <div>
                <span className="font-semibold text-neutral-900">French:</span>{" "}
                {item.name_fr}
              </div>
            )}
            {item.name_it && (
              <div>
                <span className="font-semibold text-neutral-900">Italian:</span>{" "}
                {item.name_it}
              </div>
            )}
            {item.name_es && (
              <div>
                <span className="font-semibold text-neutral-900">Spanish:</span>{" "}
                {item.name_es}
              </div>
            )}
            {item.name_de && (
              <div>
                <span className="font-semibold text-neutral-900">German:</span>{" "}
                {item.name_de}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}