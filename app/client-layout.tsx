"use client";

// RETIRED — no longer imported anywhere (removed from app/layout.tsx).
// This client-side localStorage("lang") + document.documentElement
// patch was the only thing ever driving <html lang>/dir before this
// task, and it was only ever reachable via components/LanguageSwitcher.tsx,
// which was itself dead code (never rendered on any live page — see
// docs/MULTILINGUAL-ARCHITECTURE.md's inspection notes). Superseded by
// app/layout.tsx's server-side getLocale()-based <html lang>/dir,
// which is correct for both the new app/[locale] subtree and every
// other route. Left in place, unused, rather than deleted — see the
// same doc for why nothing here was removed outright.

import { useEffect, useState } from "react";

type LangKey =
  | "en"
  | "it"
  | "fr"
  | "de"
  | "es"
  | "ar"
  | "zh";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [lang, setLang] = useState<LangKey>("en");

  useEffect(() => {
    const savedLang = localStorage.getItem("lang") as LangKey | null;

    if (savedLang) {
      setLang(savedLang);
    }
  }, []);

  useEffect(() => {
    const html = document.documentElement;

    html.lang = lang;
    html.dir = lang === "ar" ? "rtl" : "ltr";

    localStorage.setItem("lang", lang);
  }, [lang]);

  return <>{children}</>;
}