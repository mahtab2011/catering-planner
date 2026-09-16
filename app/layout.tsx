import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";
import SessionGuard from "@/components/SessionGuard";
import { isRTLLocale } from "@/lib/locales";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ✅ CLEAN SEO METADATA (ONLY ONE BLOCK)
export const metadata: Metadata = {
  title: "SmartServeUK - Discover Food Across London",
  description:
    "Browse restaurants, stalls, vans, and street food traders across London. Explore menus and order locally.",
  metadataBase: new URL("https://smartserveuk.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "SmartServeUK - Discover Food Across London",
    description:
      "Discover great food across London’s food hubs.",
    url: "https://smartserveuk.com",
    siteName: "SmartServeUK",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SmartServeUK - Discover Food Across London",
    description:
      "Explore London’s best restaurants, street food, and catering services.",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Resolves to the negotiated locale for routes under app/[locale]/...
  // (set by proxy.ts's next-intl middleware) and to the default
  // locale ("en") for every other route — SmartServeUK operational
  // pages, CikenTikka, BlackCab — exactly matching the previous
  // hardcoded lang="en" for all of those. This single root layout is
  // the ONLY place <html> is declared (Next.js forbids a nested
  // layout from redeclaring it), which is why locale-awareness lives
  // here rather than in app/[locale]/layout.tsx — see
  // docs/MULTILINGUAL-ARCHITECTURE.md.
  const locale = await getLocale();
  const messages = await getMessages();
  const dir = isRTLLocale(locale) ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#F0F7FF]`}
      >
        <SessionGuard />
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}