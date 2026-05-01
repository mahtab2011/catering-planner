import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientLayout from "./client-layout";
import SessionGuard from "@/components/SessionGuard";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#F0F7FF]`}
      >
        <SessionGuard />
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}