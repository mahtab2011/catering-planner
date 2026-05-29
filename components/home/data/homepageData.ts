import type { AppLanguage } from "@/lib/i18n";

export const HERO_DATA: Record<
  AppLanguage,
  {
    title: string;
    subtitle: string;
    restaurantCTA: string;
    buttons: { label: string; href: string }[];
  }
> = {
  en: {
    title: "Discover Great Food Across London’s Food Hubs",
    subtitle:
      "Browse restaurants, stalls, vans, and street food traders by area. Explore menus, speciality dishes, and order food locally.",
    restaurantCTA:
      "No website? Join SmartServeUK for free and showcase your menu, speciality dishes, photos, and short videos.",
    buttons: [
      { label: "Browse Restaurants", href: "/orders" },
      { label: "Join as Restaurant", href: "/signup/restaurant" },
      { label: "Order Food", href: "/orders" },
    ],
  },

  bn: {
    title: "লন্ডনের ফুড হাবজুড়ে দারুণ খাবার খুঁজে নিন",
    subtitle:
      "এলাকা অনুযায়ী রেস্টুরেন্ট, স্টল, ভ্যান এবং স্ট্রিট ফুড ট্রেডার খুঁজুন। মেনু, বিশেষ খাবার এবং স্থানীয় অর্ডার সুবিধা দেখুন।",
    restaurantCTA:
      "ওয়েবসাইট নেই? SmartServeUK-এ ফ্রি যোগ দিন এবং আপনার মেনু, বিশেষ খাবার, ছবি ও ছোট ভিডিও দেখান।",
    buttons: [
      { label: "রেস্টুরেন্ট দেখুন", href: "/orders" },
      { label: "রেস্টুরেন্ট হিসেবে যোগ দিন", href: "/signup/restaurant" },
      { label: "খাবার অর্ডার করুন", href: "/orders" },
    ],
  },

  it: {
    title: "Discover Great Food Across London’s Food Hubs",
    subtitle:
      "Browse restaurants, stalls, vans, and street food traders by area.",
    restaurantCTA: "Join SmartServeUK and showcase your restaurant.",
    buttons: [
      { label: "Browse Restaurants", href: "/orders" },
      { label: "Join as Restaurant", href: "/signup/restaurant" },
      { label: "Order Food", href: "/orders" },
    ],
  },

  fr: {
    title: "Discover Great Food Across London’s Food Hubs",
    subtitle:
      "Browse restaurants, stalls, vans, and street food traders by area.",
    restaurantCTA: "Join SmartServeUK and showcase your restaurant.",
    buttons: [
      { label: "Browse Restaurants", href: "/orders" },
      { label: "Join as Restaurant", href: "/signup/restaurant" },
      { label: "Order Food", href: "/orders" },
    ],
  },

  de: {
    title: "Discover Great Food Across London’s Food Hubs",
    subtitle:
      "Browse restaurants, stalls, vans, and street food traders by area.",
    restaurantCTA: "Join SmartServeUK and showcase your restaurant.",
    buttons: [
      { label: "Browse Restaurants", href: "/orders" },
      { label: "Join as Restaurant", href: "/signup/restaurant" },
      { label: "Order Food", href: "/orders" },
    ],
  },

  es: {
    title: "Discover Great Food Across London’s Food Hubs",
    subtitle:
      "Browse restaurants, stalls, vans, and street food traders by area.",
    restaurantCTA: "Join SmartServeUK and showcase your restaurant.",
    buttons: [
      { label: "Browse Restaurants", href: "/orders" },
      { label: "Join as Restaurant", href: "/signup/restaurant" },
      { label: "Order Food", href: "/orders" },
    ],
  },

  ar: {
    title: "Discover Great Food Across London’s Food Hubs",
    subtitle:
      "Browse restaurants, stalls, vans, and street food traders by area.",
    restaurantCTA: "Join SmartServeUK and showcase your restaurant.",
    buttons: [
      { label: "Browse Restaurants", href: "/orders" },
      { label: "Join as Restaurant", href: "/signup/restaurant" },
      { label: "Order Food", href: "/orders" },
    ],
  },

  zh: {
    title: "Discover Great Food Across London’s Food Hubs",
    subtitle:
      "Browse restaurants, stalls, vans, and street food traders by area.",
    restaurantCTA: "Join SmartServeUK and showcase your restaurant.",
    buttons: [
      { label: "Browse Restaurants", href: "/orders" },
      { label: "Join as Restaurant", href: "/signup/restaurant" },
      { label: "Order Food", href: "/orders" },
    ],
  },

  ja: {
    title: "Discover Great Food Across London’s Food Hubs",
    subtitle:
      "Browse restaurants, stalls, vans, and street food traders by area.",
    restaurantCTA: "Join SmartServeUK and showcase your restaurant.",
    buttons: [
      { label: "Browse Restaurants", href: "/orders" },
      { label: "Join as Restaurant", href: "/signup/restaurant" },
      { label: "Order Food", href: "/orders" },
    ],
  },

  th: {
    title: "Discover Great Food Across London’s Food Hubs",
    subtitle:
      "Browse restaurants, stalls, vans, and street food traders by area.",
    restaurantCTA: "Join SmartServeUK and showcase your restaurant.",
    buttons: [
      { label: "Browse Restaurants", href: "/orders" },
      { label: "Join as Restaurant", href: "/signup/restaurant" },
      { label: "Order Food", href: "/orders" },
    ],
  },
};