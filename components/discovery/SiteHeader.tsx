"use client";

import PlainLink from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import LanguageSelector from "@/components/discovery/LanguageSelector";

// Login/signup/dashboard are SmartServeUK operational routes OUTSIDE
// the app/[locale] subtree — they must use next/link (no locale
// prefix exists for them), never the locale-aware Link from
// @/i18n/navigation used for every other link on this page.

export default function SiteHeader() {
  const t = useTranslations("Nav");
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const navLinks = [
    { label: t("restaurants"), href: "/restaurants" },
    { label: t("cuisines"), href: "/cuisines" },
    { label: t("foodHubs"), href: "/hubs" },
    { label: t("reviews"), href: "/reviews" },
    { label: t("blog"), href: "/blog" },
    { label: t("recommends"), href: "/recommendations" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-black tracking-tight text-neutral-900">
            London <span className="text-amber-600">Food Hubs</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href + link.label}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <LanguageSelector />

          {user ? (
            <PlainLink
              href="/dashboard"
              className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              {t("myAccount")}
            </PlainLink>
          ) : (
            <>
              <PlainLink
                href="/login"
                className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                {t("logIn")}
              </PlainLink>
              <PlainLink
                href="/signup"
                className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
              >
                {t("signUp")}
              </PlainLink>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={t("menu")}
          aria-expanded={menuOpen}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-300 lg:hidden"
        >
          <span className="text-xl">{menuOpen ? "✕" : "☰"}</span>
        </button>
      </div>

      {menuOpen ? (
        <div className="border-t border-neutral-200 bg-white px-4 py-3 lg:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href + link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
              >
                {link.label}
              </Link>
            ))}

            <div className="mt-2 border-t border-neutral-200 pt-3">
              <LanguageSelector variant="mobile" />
            </div>

            <div className="mt-2 flex gap-2 border-t border-neutral-200 pt-3">
              {user ? (
                <PlainLink
                  href="/dashboard"
                  className="flex-1 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-center text-sm font-semibold text-neutral-700"
                >
                  {t("myAccount")}
                </PlainLink>
              ) : (
                <>
                  <PlainLink
                    href="/login"
                    className="flex-1 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-center text-sm font-semibold text-neutral-700"
                  >
                    {t("logIn")}
                  </PlainLink>
                  <PlainLink
                    href="/signup"
                    className="flex-1 rounded-xl bg-amber-600 px-4 py-3 text-center text-sm font-semibold text-white"
                  >
                    {t("signUp")}
                  </PlainLink>
                </>
              )}
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
