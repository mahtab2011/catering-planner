"use client";

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