import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";

/**
 * Nested layout for the London Food Hubs consumer-facing subtree.
 * Deliberately does NOT declare <html>/<body> — only app/layout.tsx
 * (the true root) is allowed to, and it already reads the locale
 * itself via getLocale()/getMessages() for <html lang>/dir and the
 * NextIntlClientProvider. This layout's job is just: reject an
 * unsupported locale segment (404, not a silent fallback), and call
 * setRequestLocale so next-intl can statically render each locale.
 */
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
