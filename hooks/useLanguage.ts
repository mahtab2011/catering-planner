"use client";

import { useEffect, useState } from "react";
import type { AppLanguage } from "@/lib/i18n";

const STORAGE_KEY = "smartserve_lang";

const SUPPORTED_LANGUAGES: AppLanguage[] = [
  "en",
  "bn",
  "it",
  "fr",
  "de",
  "es",
  "ar",
  "zh",
  "ja",
  "th",
];

function isSupportedLanguage(value: string | null): value is AppLanguage {
  return !!value && SUPPORTED_LANGUAGES.includes(value as AppLanguage);
}

function detectBrowserLanguage(defaultLang: AppLanguage = "en"): AppLanguage {
  if (typeof navigator === "undefined") return defaultLang;

  const browser = navigator.language.toLowerCase();

  if (browser.startsWith("bn")) return "bn";
  if (browser.startsWith("ja")) return "ja";
  if (browser.startsWith("th")) return "th";
  if (browser.startsWith("it")) return "it";
  if (browser.startsWith("fr")) return "fr";
  if (browser.startsWith("de")) return "de";
  if (browser.startsWith("es")) return "es";
  if (browser.startsWith("ar")) return "ar";
  if (browser.startsWith("zh")) return "zh";

  return defaultLang;
}

export function useLanguage(defaultLang: AppLanguage = "en") {
  const [lang, setLang] = useState<AppLanguage>(defaultLang);

  useEffect(() => {
    const saved =
      typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;

    if (isSupportedLanguage(saved)) {
      setLang(saved);
      return;
    }

    setLang(detectBrowserLanguage(defaultLang));
  }, [defaultLang]);

  const changeLanguage = (next: AppLanguage) => {
    setLang(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, next);
    }
  };

  return { lang, setLang: changeLanguage };
}