"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { AppLanguage } from "@/lib/i18n";

type HubCardProps = {
  name: string;
  description?: string;
  href: string;
  image?: string;
  photos?: string[];
  lang?: AppLanguage;
};

const BUTTON_LABELS: Record<AppLanguage, string> = {
  en: "Explore Hub",
  bn: "হাব দেখুন",
  it: "Esplora Hub",
  fr: "Explorer le Hub",
  de: "Hub ansehen",
  es: "Explorar Hub",
  ar: "استكشف المركز",
  zh: "查看美食中心",
  ja: "ハブを見る",
  th: "ดูศูนย์อาหาร",
};

const FALLBACK_DESCRIPTION =
  "Explore this hub for local food options, nearby food places, and catering services in the area.";

function getSlugFromHref(href: string) {
  return href.split("?")[0].split("#")[0].split("/").filter(Boolean).pop() || "";
}

export default function HubCard({
  name,
  description,
  href,
  image,
  photos = [],
  lang = "en",
}: HubCardProps) {
  const [imageFailed, setImageFailed] = useState(false);

  const slug = useMemo(() => getSlugFromHref(href), [href]);
  const showImage = Boolean(image) && !imageFailed;
  const finalDescription = description?.trim() || FALLBACK_DESCRIPTION;

  return (
    <div
      data-hub-slug={slug}
      className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className="relative h-72 w-full overflow-hidden sm:h-96 lg:h-105">
        {showImage ? (
          <>
            <img
              src={image}
              alt={name}
              onError={() => setImageFailed(true)}
              className="h-full w-full object-cover object-center transition duration-700 ease-out hover:scale-110"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/25 to-transparent" />
          </>
        ) : (
          <div className="h-full w-full bg-linear-to-r from-emerald-100 via-sky-100 to-amber-100" />
        )}

        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-2xl font-bold text-white drop-shadow-sm">
            {name}
          </h3>
        </div>
      </div>

      <div className="p-6">
        <p className="text-base leading-7 text-neutral-700">
          {finalDescription}
        </p>

        {photos.length > 0 ? (
  <div className="mt-5 grid grid-cols-3 gap-2">
    {photos.map((photo, index) => (
      <img
        key={`${photo}-${index}`}
        src={photo}
        alt={`${name} photo ${index + 1}`}
        className="h-24 w-full rounded-xl bg-neutral-100 object-cover"
        loading="lazy"
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
      />
    ))}
  </div>
) : null}

        <div className="mt-6">
          <Link
            href={href}
            aria-label={`${BUTTON_LABELS[lang]}: ${name}`}
            className="inline-flex items-center rounded-full border border-emerald-500 px-6 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
          >
            {BUTTON_LABELS[lang]}
          </Link>
        </div>
      </div>
    </div>
  );
}