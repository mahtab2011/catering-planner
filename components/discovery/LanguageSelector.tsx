"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { getActiveLocaleDefinitions, type LocaleCode } from "@/lib/locales";

/**
 * Polished, accessible language selector — a dropdown rather than a
 * permanent list of every language, so this scales to the ~26-locale
 * registry without ever crowding the navbar (only ACTIVE_LOCALES are
 * listed; see lib/locales.ts). Native names are shown so a Bengali or
 * Arabic speaker recognises their language immediately rather than
 * scanning English names.
 *
 * Switching preserves the current page: usePathname()/useRouter() are
 * next-intl's locale-aware versions (@/i18n/navigation), so
 * router.replace(pathname, { locale }) re-renders the SAME route in
 * the new locale rather than bouncing to the homepage. next-intl also
 * sets its own NEXT_LOCALE cookie on this navigation, so the choice
 * is remembered for the next visit without any extra code here.
 */
export default function LanguageSelector({ variant = "desktop" }: { variant?: "desktop" | "mobile" }) {
  const locale = useLocale() as LocaleCode;
  const t = useTranslations("LanguageSelector");
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const locales = getActiveLocaleDefinitions();
  const current = locales.find((l) => l.code === locale) ?? locales[0];

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  function switchTo(nextLocale: LocaleCode) {
    setOpen(false);
    router.replace(pathname, { locale: nextLocale });
  }

  if (variant === "mobile") {
    return (
      <div className="grid grid-cols-2 gap-2">
        {locales.map((l) => (
          <button
            key={l.code}
            type="button"
            onClick={() => switchTo(l.code)}
            aria-current={l.code === locale ? "true" : undefined}
            className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
              l.code === locale
                ? "border-amber-600 bg-amber-50 text-amber-900"
                : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
            }`}
          >
            {l.nativeName}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("current", { language: current.nativeName })}
        className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
      >
        <span aria-hidden="true" className="text-xs">
          🌐
        </span>
        <span>{current.nativeName}</span>
        <span aria-hidden="true" className="text-xs text-neutral-400">
          ▾
        </span>
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-label={t("label")}
          className="absolute end-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-lg"
        >
          {locales.map((l) => (
            <li key={l.code} role="option" aria-selected={l.code === locale}>
              <button
                type="button"
                onClick={() => switchTo(l.code)}
                className={`flex w-full items-center justify-between px-4 py-2.5 text-start text-sm transition hover:bg-neutral-50 ${
                  l.code === locale ? "font-semibold text-amber-700" : "text-neutral-700"
                }`}
              >
                <span>{l.nativeName}</span>
                {l.code === locale ? (
                  <span aria-hidden="true" className="text-amber-600">
                    ✓
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
