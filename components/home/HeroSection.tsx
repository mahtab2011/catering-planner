"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AppLanguage } from "@/lib/i18n";

type HeroButton = {
  label: string;
  href: string;
};

type HeroSectionProps = {
  title: string;
  subtitle: string;
  restaurantCTA?: string;
  buttons: HeroButton[];
  lang: AppLanguage;
  image?: string;
};

export default function HeroSection({
  title,
  subtitle,
  restaurantCTA,
  buttons,
  lang,
  image = "/hubs/westfield/hero-westfield.jpg",
}: HeroSectionProps) {
  const isRTL = lang === "ar";
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  return (
    <section
      dir={isRTL ? "rtl" : "ltr"}
      className="relative overflow-hidden border-b border-sky-100"
    >
      {/* Background Image with zoom effect */}
      <div
        className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-8000 ${
          loaded ? "scale-105" : "scale-100"
        }`}
        style={{ backgroundImage: `url('${image}')` }}
      />

      {/* Dark cinematic overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Gradient overlay (premium depth) */}
      <div className="absolute inset-0 bg-linear-to-r from-sky-950/80 via-sky-900/50 to-black/60" />

      {/* Soft vignette edges */}
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.6)]" />

      {/* Content */}
      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
        <div className="max-w-4xl">
          <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur-md">
            SmartServeUK
          </div>

          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {title}
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-sky-50 sm:text-xl">
            {subtitle}
          </p>

          {restaurantCTA ? (
            <p className="mt-5 max-w-3xl text-base font-medium text-sky-100">
              {restaurantCTA}
            </p>
          ) : null}

          <div className="mt-10 flex flex-wrap gap-4">
            {buttons.map((button, index) => {
              const primary = index === 0;

              return (
                <Link
                  key={`${button.href}-${button.label}-${index}`}
                  href={button.href}
                  className={
                    primary
                      ? "inline-flex items-center justify-center rounded-xl bg-sky-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-105 hover:bg-sky-700"
                      : "inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/20"
                  }
                >
                  {button.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}