import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site";

/**
 * Nested layout for the London Food Hubs consumer-facing subtree.
 * Deliberately does NOT declare <html>/<body> — only app/layout.tsx
 * (the true root) is allowed to, and it already reads the locale
 * itself via getLocale()/getMessages() for <html lang>/dir and the
 * NextIntlClientProvider. This layout's job is just: reject an
 * unsupported locale segment (404, not a silent fallback), call
 * setRequestLocale so next-intl can statically render each locale,
 * and scope `metadataBase` to London Food Hubs' own production
 * domain (lib/site.ts) for this subtree only — the root layout's
 * metadataBase stays SmartServeUK's own domain, a legitimately
 * different default for the operational routes outside app/[locale].
 * Every page under here uses relative canonical/OpenGraph URLs that
 * resolve against this metadataBase.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return <>{children}</>;
}
