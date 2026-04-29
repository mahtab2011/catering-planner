"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import HeroSection from "../components/home/HeroSection";
import HubCard from "../components/home/HubCard";
import RestaurantCard from "../components/restaurants/RestaurantCard";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import LogoutButton from "@/components/LogoutButton";
import { useLanguage } from "@/hooks/useLanguage";
import type { AppLanguage } from "@/lib/i18n";
import { auth, db } from "@/lib/firebase";
import FreeAccessBlock from "@/components/home/FreeAccessBlock";
import HowItWorksBlock from "@/components/home/HowItWorksBlock";
import TrustDataBlock from "@/components/home/TrustDataBlock";
import AudienceBlock from "@/components/home/AudienceBlock";
import ImpactBlock from "@/components/home/ImpactBlock";
import PlatformReadinessBlock from "@/components/home/PlatformReadinessBlock";
import FinalCTA from "@/components/home/FinalCTA";

const HERO_DATA: Record<
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
    title: "Scopri ottimo cibo nei food hub di Londra",
    subtitle:
      "Esplora ristoranti, chioschi, van e street food per zona. Guarda menu, specialità e ordina cibo locale.",
    restaurantCTA:
      "Nessun sito web? Unisciti gratis a SmartServeUK e mostra il tuo menu, i piatti speciali, foto e brevi video.",
    buttons: [
      { label: "Esplora ristoranti", href: "/orders" },
      { label: "Unisciti come ristorante", href: "/signup/restaurant" },
      { label: "Ordina cibo", href: "/orders" },
    ],
  },

  fr: {
    title: "Découvrez les meilleurs food hubs de Londres",
    subtitle:
      "Parcourez les restaurants, stands, vans et vendeurs de street food par quartier. Découvrez les menus, spécialités et commandez localement.",
    restaurantCTA:
      "Pas de site web ? Rejoignez SmartServeUK gratuitement et présentez votre menu, vos spécialités, vos photos et de courtes vidéos.",
    buttons: [
      { label: "Voir les restaurants", href: "/orders" },
      { label: "Rejoindre comme restaurant", href: "/signup/restaurant" },
      { label: "Commander", href: "/orders" },
    ],
  },

  de: {
    title: "Entdecke großartiges Essen in Londons Food Hubs",
    subtitle:
      "Finde Restaurants, Stände, Vans und Street-Food-Anbieter nach Gegend. Entdecke Menüs, Spezialitäten und bestelle lokal.",
    restaurantCTA:
      "Keine Website? Tritt SmartServeUK kostenlos bei und präsentiere dein Menü, Spezialitäten, Fotos und kurze Videos.",
    buttons: [
      { label: "Restaurants ansehen", href: "/orders" },
      { label: "Als Restaurant beitreten", href: "/signup/restaurant" },
      { label: "Essen bestellen", href: "/orders" },
    ],
  },

  es: {
    title: "Descubre excelente comida en los food hubs de Londres",
    subtitle:
      "Explora restaurantes, puestos, vans y vendedores de comida callejera por zona. Consulta menús, especialidades y pide comida local.",
    restaurantCTA:
      "¿No tienes sitio web? Únete gratis a SmartServeUK y muestra tu menú, platos especiales, fotos y vídeos cortos.",
    buttons: [
      { label: "Ver restaurantes", href: "/orders" },
      { label: "Unirse como restaurante", href: "/signup/restaurant" },
      { label: "Pedir comida", href: "/orders" },
    ],
  },

  ar: {
    title: "اكتشف طعامًا رائعًا عبر مراكز الطعام في لندن",
    subtitle:
      "تصفح المطاعم والأكشاك وعربات الطعام وباعة الأطعمة الشعبية حسب المنطقة. استكشف القوائم والأطباق المميزة واطلب محليًا.",
    restaurantCTA:
      "ليس لديك موقع إلكتروني؟ انضم إلى SmartServeUK مجانًا واعرض قائمتك وأطباقك المميزة وصورك ومقاطع الفيديو القصيرة.",
    buttons: [
      { label: "تصفح المطاعم", href: "/orders" },
      { label: "انضم كمطعم", href: "/signup/restaurant" },
      { label: "اطلب الطعام", href: "/orders" },
    ],
  },

  zh: {
    title: "探索伦敦美食中心的精彩美食",
    subtitle:
      "按地区浏览餐厅、小吃摊、餐车和街头美食商家。查看菜单、招牌菜，并在本地订餐。",
    restaurantCTA:
      "没有网站？免费加入 SmartServeUK，展示您的菜单、特色菜、照片和短视频。",
    buttons: [
      { label: "浏览餐厅", href: "/orders" },
      { label: "餐厅入驻", href: "/signup/restaurant" },
      { label: "订餐", href: "/orders" },
    ],
  },

  ja: {
    title: "ロンドンのフードハブで素晴らしい食を見つけよう",
    subtitle:
      "エリア別にレストラン、屋台、フードバン、ストリートフードのお店を探せます。メニューや名物料理を見て、地元で注文できます。",
    restaurantCTA:
      "ウェブサイトがなくても大丈夫。SmartServeUK に無料で参加して、メニュー、名物料理、写真、短い動画を紹介しましょう。",
    buttons: [
      { label: "レストランを見る", href: "/orders" },
      { label: "レストランとして参加", href: "/signup/restaurant" },
      { label: "料理を注文", href: "/orders" },
    ],
  },

  th: {
    title: "ค้นพบอาหารยอดเยี่ยมทั่วศูนย์รวมอาหารในลอนดอน",
    subtitle:
      "ค้นหาร้านอาหาร แผงขายอาหาร รถขายอาหาร และร้านสตรีทฟู้ดตามพื้นที่ ดูเมนู อาหารแนะนำ และสั่งอาหารใกล้คุณได้",
    restaurantCTA:
      "ยังไม่มีเว็บไซต์? เข้าร่วม SmartServeUK ฟรี และแสดงเมนู อาหารแนะนำ รูปภาพ และวิดีโอสั้นของคุณ",
    buttons: [
      { label: "ดูร้านอาหาร", href: "/orders" },
      { label: "เข้าร่วมเป็นร้านอาหาร", href: "/signup/restaurant" },
      { label: "สั่งอาหาร", href: "/orders" },
    ],
  },
};

const FOUNDER_OFFER: Record<
  AppLanguage,
  {
    text: string;
    tiers: string[];
  }
> = {
  en: {
    text: "Founding Restaurant Offer: First 20 signups receive free subscription rewards.",
    tiers: ["Signups #1–10: 1 year free", "Signups #11–20: 6 months free"],
  },

  bn: {
    text: "প্রতিষ্ঠাতা রেস্টুরেন্ট অফার: প্রথম ২০টি সাইনআপ ফ্রি সাবস্ক্রিপশন সুবিধা পাবে।",
    tiers: ["সাইনআপ #১–১০: ১ বছর ফ্রি", "সাইনআপ #১১–২০: ৬ মাস ফ্রি"],
  },

  it: {
    text: "Offerta Ristorante Fondatore: i primi 20 iscritti riceveranno premi di abbonamento gratuiti.",
    tiers: ["Iscrizioni #1–10: 1 anno gratis", "Iscrizioni #11–20: 6 mesi gratis"],
  },

  fr: {
    text: "Offre Restaurant Fondateur : les 20 premiers inscrits recevront des avantages d’abonnement gratuits.",
    tiers: ["Inscriptions #1–10 : 1 an gratuit", "Inscriptions #11–20 : 6 mois gratuits"],
  },

  de: {
    text: "Gründer-Restaurant-Angebot: Die ersten 20 Anmeldungen erhalten kostenlose Abonnement-Vorteile.",
    tiers: ["Anmeldungen #1–10: 1 Jahr kostenlos", "Anmeldungen #11–20: 6 Monate kostenlos"],
  },

  es: {
    text: "Oferta para Restaurantes Fundadores: los primeros 20 registros recibirán beneficios de suscripción gratis.",
    tiers: ["Registros #1–10: 1 año gratis", "Registros #11–20: 6 meses gratis"],
  },

  ar: {
    text: "عرض المطاعم المؤسسة: أول 20 تسجيلًا سيحصلون على مزايا اشتراك مجانية.",
    tiers: ["التسجيلات #1–10: سنة مجانية", "التسجيلات #11–20: 6 أشهر مجانية"],
  },

  zh: {
    text: "创始餐厅优惠：前20个注册商家可获得免费订阅奖励。",
    tiers: ["注册 #1–10：免费 1 年", "注册 #11–20：免费 6 个月"],
  },

  ja: {
    text: "創業レストラン特典：最初の20件の登録で無料サブスクリプション特典を受けられます。",
    tiers: ["登録 #1–10：1年間無料", "登録 #11–20：6か月無料"],
  },

  th: {
    text: "ข้อเสนอสำหรับร้านอาหารผู้ก่อตั้ง: 20 ร้านแรกที่สมัครจะได้รับสิทธิ์สมัครสมาชิกฟรี",
    tiers: ["สมัคร #1–10: ฟรี 1 ปี", "สมัคร #11–20: ฟรี 6 เดือน"],
  },
};

const JOIN_SECTION: Record<
  AppLanguage,
  {
    title: string;
    description: string;
    features: {
      title: string;
      desc: string;
      icon: string;
      style: string;
    }[];
    button: {
      label: string;
      href: string;
    };
  }
> = {
  en: {
    title: "No Website? Join Us for Free",
    description:
      "SmartServeUK helps restaurants, stalls, vans, and food traders create a digital presence and reach local customers.",
    features: [
      {
        title: "Upload Your Menu",
        desc: "Show your dishes and prices online.",
        icon: "📋",
        style: "border-sky-200 bg-sky-50",
      },
      {
        title: "Show Your Speciality",
        desc: "Highlight your signature and best-selling dishes.",
        icon: "⭐",
        style: "border-amber-200 bg-amber-50",
      },
      {
        title: "Add Photos & Videos",
        desc: "Make your page vivid, visual, and more trustworthy.",
        icon: "🎥",
        style: "border-rose-200 bg-rose-50",
      },
      {
        title: "Get Discovered Locally",
        desc: "Appear in your local food hub and reach nearby customers.",
        icon: "📍",
        style: "border-emerald-200 bg-emerald-50",
      },
      {
        title: "Receive Orders",
        desc: "Get customer orders through SmartServeUK.",
        icon: "🛒",
        style: "border-violet-200 bg-violet-50",
      },
      {
        title: "Promote from £5",
        desc: "Boost visibility with simple paid promotions.",
        icon: "📣",
        style: "border-indigo-200 bg-indigo-50",
      },
    ],
    button: {
      label: "List Your Restaurant Free",
      href: "/signup/restaurant",
    },
  },

  bn: {
    title: "ওয়েবসাইট নেই? ফ্রি যোগ দিন",
    description:
      "SmartServeUK রেস্টুরেন্ট, স্টল, ভ্যান এবং ফুড ট্রেডারদের ডিজিটাল উপস্থিতি তৈরি করতে এবং স্থানীয় গ্রাহকদের কাছে পৌঁছাতে সাহায্য করে।",
    features: [
      {
        title: "আপনার মেনু আপলোড করুন",
        desc: "আপনার খাবার ও মূল্য অনলাইনে দেখান।",
        icon: "📋",
        style: "border-sky-200 bg-sky-50",
      },
      {
        title: "বিশেষ খাবার দেখান",
        desc: "আপনার জনপ্রিয় ও সিগনেচার ডিশ তুলে ধরুন।",
        icon: "⭐",
        style: "border-amber-200 bg-amber-50",
      },
      {
        title: "ছবি ও ভিডিও যুক্ত করুন",
        desc: "আপনার পেজকে আরও আকর্ষণীয় ও বিশ্বাসযোগ্য করুন।",
        icon: "🎥",
        style: "border-rose-200 bg-rose-50",
      },
      {
        title: "লোকালভাবে পরিচিত হন",
        desc: "আপনার এলাকার ফুড হাবে দেখা যাবে।",
        icon: "📍",
        style: "border-emerald-200 bg-emerald-50",
      },
      {
        title: "অর্ডার গ্রহণ করুন",
        desc: "SmartServeUK এর মাধ্যমে অর্ডার পান।",
        icon: "🛒",
        style: "border-violet-200 bg-violet-50",
      },
      {
        title: "£5 থেকে প্রচার করুন",
        desc: "সহজ প্রচারের মাধ্যমে দৃশ্যমানতা বাড়ান।",
        icon: "📣",
        style: "border-indigo-200 bg-indigo-50",
      },
    ],
    button: {
      label: "ফ্রি রেস্টুরেন্ট লিস্ট করুন",
      href: "/signup/restaurant",
    },
  },

  it: {} as any,
  fr: {} as any,
  de: {} as any,
  es: {} as any,
  ar: {} as any,
  zh: {} as any,
  ja: {} as any,
  th: {} as any,
};

const ORDER_SECTION: Record<
  AppLanguage,
  {
    title: string;
    subtitle: string;
    features: {
      title: string;
      desc: string;
      icon: string;
    }[];
    buttons: { label: string; href: string }[];
  }
> = {
  en: {
    title: "Order Food Through SmartServeUK",
    subtitle:
      "Browse local restaurants, explore menus, and place orders through our platform.",
    features: [
      {
        title: "Browse by Hub",
        desc: "Find restaurants in your local area.",
        icon: "🗺️",
      },
      {
        title: "Explore Menus",
        desc: "See dishes, speciality items, and food styles.",
        icon: "🍽️",
      },
      {
        title: "Order Securely",
        desc: "Checkout with card or PayPal.",
        icon: "🔒",
      },
    ],
    buttons: [
      { label: "Order Food", href: "/orders" },
      { label: "Browse Restaurants", href: "/orders" },
    ],
  },

  bn: {
    title: "SmartServeUK এর মাধ্যমে খাবার অর্ডার করুন",
    subtitle:
      "স্থানীয় রেস্টুরেন্ট খুঁজুন, মেনু দেখুন এবং আমাদের প্ল্যাটফর্মের মাধ্যমে অর্ডার করুন।",
    features: [
      {
        title: "হাব অনুযায়ী খুঁজুন",
        desc: "আপনার এলাকার রেস্টুরেন্ট খুঁজে নিন।",
        icon: "🗺️",
      },
      {
        title: "মেনু দেখুন",
        desc: "খাবার, বিশেষ আইটেম এবং ফুড স্টাইল দেখুন।",
        icon: "🍽️",
      },
      {
        title: "নিরাপদ অর্ডার",
        desc: "কার্ড বা PayPal দিয়ে পেমেন্ট করুন।",
        icon: "🔒",
      },
    ],
    buttons: [
      { label: "খাবার অর্ডার করুন", href: "/orders" },
      { label: "রেস্টুরেন্ট দেখুন", href: "/orders" },
    ],
  },

  it: {} as any,
  fr: {} as any,
  de: {} as any,
  es: {} as any,
  ar: {} as any,
  zh: {} as any,
  ja: {} as any,
  th: {} as any,
};

const CHECKOUT_SECTION: Record<
  AppLanguage,
  {
    title: string;
    description: string;
    methods: string[];
    button: { label: string; href: string };
  }
> = {
  en: {
    title: "Secure Checkout",
    description:
      "Customers can place orders using secure payment methods including card and PayPal.",
    methods: ["Credit / Debit Card", "PayPal"],
    button: {
      label: "Go to Secure Checkout",
      href: "/checkout",
    },
  },

  bn: {
    title: "নিরাপদ চেকআউট",
    description:
      "গ্রাহকরা কার্ড এবং PayPal সহ নিরাপদ পেমেন্ট পদ্ধতিতে অর্ডার করতে পারবেন।",
    methods: ["ক্রেডিট / ডেবিট কার্ড", "PayPal"],
    button: {
      label: "নিরাপদ চেকআউটে যান",
      href: "/checkout",
    },
  },

  it: {} as any,
  fr: {} as any,
  de: {} as any,
  es: {} as any,
  ar: {} as any,
  zh: {} as any,
  ja: {} as any,
  th: {} as any,
};

const PROMOTION_SECTION: Record<
  AppLanguage,
  {
    title: string;
    description: string;
    features: { title: string; desc: string }[];
    priceNote: string;
    button: { label: string; href: string };
  }
> = {
  en: {
    title: "Promote Your Restaurant",
    description:
      "Increase your visibility with simple promotional options for restaurants, stalls, and street food sellers.",
    features: [
      { title: "Featured Restaurant", desc: "Appear higher in your hub." },
      { title: "Promoted Dish", desc: "Highlight a best-selling item." },
      { title: "Offer Spotlight", desc: "Promote deals and combos." },
    ],
    priceNote: "Promotional options from £5",
    button: {
      label: "Promote My Restaurant",
      href: "/promotions",
    },
  },

  bn: {
    title: "আপনার রেস্টুরেন্ট প্রচার করুন",
    description:
      "রেস্টুরেন্ট, স্টল এবং স্ট্রিট ফুড বিক্রেতাদের জন্য সহজ প্রচারের মাধ্যমে দৃশ্যমানতা বাড়ান।",
    features: [
      { title: "ফিচার্ড রেস্টুরেন্ট", desc: "আপনার হাবে আরও ওপরে দেখাবে।" },
      { title: "প্রমোটেড ডিশ", desc: "জনপ্রিয় একটি আইটেম আলাদা করে দেখান।" },
      { title: "অফার স্পটলাইট", desc: "ডিল, কম্বো বা অফার প্রচার করুন।" },
    ],
    priceNote: "প্রচার সুবিধা £5 থেকে",
    button: {
      label: "আমার রেস্টুরেন্ট প্রচার করুন",
      href: "/promotions",
    },
  },

  it: {} as any,
  fr: {} as any,
  de: {} as any,
  es: {} as any,
  ar: {} as any,
  zh: {} as any,
  ja: {} as any,
  th: {} as any,
};

const FUTURE_SECTION: Record<
  AppLanguage,
  {
    title: string;
    description: string;
  }
> = {
  en: {
    title: "Built for Restaurants, Stalls, Vans and Traders",
    description:
      "SmartServeUK supports restaurants, food stalls, vans, and street food traders across London.",
  },

  bn: {
    title: "রেস্টুরেন্ট, স্টল, ভ্যান এবং ট্রেডারদের জন্য তৈরি",
    description:
      "SmartServeUK লন্ডনজুড়ে রেস্টুরেন্ট, ফুড স্টল, ভ্যান এবং স্ট্রিট ফুড ট্রেডারদের সহায়তা করার জন্য তৈরি।",
  },

  it: {} as any,
  fr: {} as any,
  de: {} as any,
  es: {} as any,
  ar: {} as any,
  zh: {} as any,
  ja: {} as any,
  th: {} as any,
};

const FINAL_CTA: Record<
  AppLanguage,
  {
    title: string;
    description: string;
    buttons: { label: string; href: string }[];
  }
> = {
  en: {
    title: "Join SmartServeUK Early",
    description:
      "Be part of a growing platform connecting restaurants and customers across London.",
    buttons: [
      { label: "Join as Restaurant", href: "/signup/restaurant" },
      { label: "Browse Restaurants", href: "/orders" },
      { label: "Order Food", href: "/orders" },
    ],
  },

  bn: {
    title: "শুরুতেই SmartServeUK-এ যোগ দিন",
    description:
      "লন্ডনজুড়ে রেস্টুরেন্ট এবং গ্রাহকদের সংযোগকারী একটি বাড়তে থাকা প্ল্যাটফর্মের অংশ হোন।",
    buttons: [
      { label: "রেস্টুরেন্ট হিসেবে যোগ দিন", href: "/signup/restaurant" },
      { label: "রেস্টুরেন্ট দেখুন", href: "/orders" },
      { label: "খাবার অর্ডার করুন", href: "/orders" },
    ],
  },

  it: {} as any,
  fr: {} as any,
  de: {} as any,
  es: {} as any,
  ar: {} as any,
  zh: {} as any,
  ja: {} as any,
  th: {} as any,
};

type LocalizedText = Record<AppLanguage, string>;

const gallery = (folder: string, files: string[]) =>
  files.map((file) => `/hubs/${folder}/${file}`);

const hubs: {
  name: LocalizedText;
  description: LocalizedText;
  href: string;
  image?: string;
  gallery?: string[];
}[] = [
  {
    name: {
      en: "Brick Lane",
      bn: "ব্রিক লেন",
      it: "Brick Lane",
      fr: "Brick Lane",
      de: "Brick Lane",
      es: "Brick Lane",
      ar: "بريك لين",
      zh: "布里克巷",
      ja: "ブリック・レーン",
      th: "บริคเลน",
    },
    description: {
      en: "A major destination for Bangladeshi, South Asian, and multicultural dining, known for iconic curry houses, food halls, and strong visitor footfall.",
      bn: "বাংলাদেশি, দক্ষিণ এশীয় এবং বহুসাংস্কৃতিক খাবারের জন্য একটি গুরুত্বপূর্ণ গন্তব্য, যা বিখ্যাত কারি হাউস, ফুড হল এবং শক্তিশালী দর্শনার্থী উপস্থিতির জন্য পরিচিত।",
      it: "Una delle principali destinazioni per la cucina bangladese, sudasiatica e multiculturale, nota per le sue iconiche curry house, food hall e l’elevato afflusso di visitatori.",
      fr: "Une destination majeure pour la cuisine bangladaise, sud-asiatique et multiculturelle, connue pour ses célèbres curry houses, ses food halls et sa forte fréquentation.",
      de: "Ein wichtiges Ziel für bangladeschische, südasiatische und multikulturelle Küche, bekannt für ikonische Curry-Häuser, Food Halls und starke Besucherfrequenz.",
      es: "Un destino importante para la comida bangladesí, del sur de Asia y multicultural, conocido por sus icónicos curry houses, food halls y gran afluencia de visitantes.",
      ar: "وجهة رئيسية للمأكولات البنغلاديشية والجنوب آسيوية والمتعددة الثقافات، وتشتهر بمطاعم الكاري الشهيرة وقاعات الطعام وكثرة الزوار.",
      zh: "这里是孟加拉、南亚及多元文化餐饮的重要目的地，以知名咖喱餐厅、美食广场和大量客流而闻名。",
      ja: "バングラデシュ料理、南アジア料理、多文化料理の主要スポットで、象徴的なカレーハウス、フードホール、多くの来訪者で知られています。",
      th: "จุดหมายสำคัญสำหรับอาหารบังกลาเทศ เอเชียใต้ และอาหารหลากหลายวัฒนธรรม มีชื่อเสียงด้านร้านแกงกะหรี่ ฟู้ดฮอลล์ และผู้คนพลุกพล่าน",
    },
    href: "/hubs/brick-lane",
    image: "/hubs/brick-lane/7.jpg",
    gallery: gallery("brick-lane", [
      "1.jpg",
      "2.jpg",
      "3.jpg",
      "4.jpg",
      "5.jpg",
      "6.jpg",
      "7.jpg",
      "8.jpg",
      "9.jpg",
    ]),
  },

  {
    name: {
      en: "Green Street / Plashet Road",
      bn: "গ্রিন স্ট্রিট / প্লাশেট রোড",
      it: "Green Street / Plashet Road",
      fr: "Green Street / Plashet Road",
      de: "Green Street / Plashet Road",
      es: "Green Street / Plashet Road",
      ar: "جرين ستريت / بلاشيت رود",
      zh: "格林街 / 普拉谢特路",
      ja: "グリーンストリート / プラシェットロード",
      th: "กรีนสตรีท / พลาชेटโรด",
    },
    description: {
      en: "A strong South Asian food corridor with family dining, takeaway favourites, practical local demand, and growing food-business clusters.",
      bn: "পারিবারিক ডাইনিং, টেকঅ্যাওয়ে পছন্দ, স্থানীয় চাহিদা এবং ক্রমবর্ধমান খাদ্য ব্যবসার জন্য একটি শক্তিশালী দক্ষিণ এশীয় ফুড করিডোর।",
      it: "Un forte corridoio gastronomico sudasiatico con ristorazione familiare, takeaway e domanda locale in crescita.",
      fr: "Un important corridor alimentaire sud-asiatique avec restauration familiale, plats à emporter et forte demande locale.",
      de: "Ein starker südasiatischer Food-Korridor mit Familienrestaurants, Takeaway und wachsender Nachfrage.",
      es: "Un fuerte corredor gastronómico del sur de Asia con comida familiar, takeaway y demanda local creciente.",
      ar: "ممر غذائي قوي لجنوب آسيا يضم مطاعم عائلية وخيارات تيك أواي وطلب محلي متزايد.",
      zh: "一个强大的南亚美食走廊，拥有家庭用餐、外卖需求和不断增长的本地市场。",
      ja: "家族向けレストランやテイクアウト、地域需要が高い南アジアのフードエリアです。",
      th: "ย่านอาหารเอเชียใต้ที่แข็งแกร่ง มีร้านอาหารสำหรับครอบครัว อาหารสั่งกลับบ้าน และความต้องการในพื้นที่สูง",
    },
    href: "/hubs/green-street",

// ✅ keep clean hero
image: "/hubs/plashet-road/13.jpg",

// ✅ only your new photos (1–20)
gallery: gallery("plashet-road", [
  "1.jpg",
  "2.jpg",
  "3.jpg",
  "4.jpg",
  "5.jpg",
  "6.jpg",
  "7.jpg",
  "8.jpg",
  "9.jpg",
  "10.jpg",
  "11.jpg",
  "12.jpg",
  "13.jpg",
  "14.jpg",
  "15.jpg",
  "16.jpg",
  "17.jpg",
  "18.jpg",
  "19.jpg",
  "20.jpg",
]),
  },

  {
    name: {
      en: "Upmarket Food Hall, Brick Lane",
      bn: "আপমার্কেট ফুড হল, ব্রিক লেন",
      it: "Upmarket Food Hall, Brick Lane",
      fr: "Upmarket Food Hall, Brick Lane",
      de: "Upmarket Food Hall, Brick Lane",
      es: "Upmarket Food Hall, Brick Lane",
      ar: "أبماركت فود هول، بريك لين",
      zh: "布里克巷 Upmarket 美食广场",
      ja: "アップマーケット・フードホール（ブリック・レーン）",
      th: "อัพมาร์เก็ตฟู้ดฮอลล์, บริคเลน",
    },
    description: {
      en: "A vibrant market-style food hall with global stalls where visitors can explore varied cuisines in one place.",
      bn: "একটি প্রাণবন্ত মার্কেট-স্টাইল ফুড হল, যেখানে নানা দেশের স্টলে এক জায়গায় বিভিন্ন খাবার পাওয়া যায়।",
      it: "Una vivace food hall in stile mercato con stand internazionali dove i visitatori possono esplorare cucine diverse in un unico luogo.",
      fr: "Un food hall animé de style marché avec des stands internationaux où les visiteurs peuvent découvrir diverses cuisines en un seul lieu.",
      de: "Eine lebendige Markthallen-Food-Hall mit internationalen Ständen, in der Besucher viele Küchen an einem Ort entdecken können.",
      es: "Un animado food hall estilo mercado con puestos globales donde los visitantes pueden explorar distintas cocinas en un solo lugar.",
      ar: "قاعة طعام نابضة بالحياة على طراز السوق تضم أكشاكًا عالمية حيث يمكن للزوار استكشاف مطابخ متنوعة في مكان واحد.",
      zh: "一个充满活力的市场式美食广场，汇集全球餐饮摊位，游客可以在一处探索多种菜系。",
      ja: "世界各国の屋台が集まる活気あるマーケット型フードホールで、1か所で多彩な料理を楽しめます。",
      th: "ฟู้ดฮอลล์สไตล์ตลาดที่มีชีวิตชีวา พร้อมร้านอาหารนานาชาติให้ผู้มาเยือนได้ลองหลายรสชาติในที่เดียว",
    },
    href: "/hubs/upmarket-brick-lane",
    image: "/hubs/upmarket-brick-lane-foodhall/6.jpg",
    gallery: gallery("upmarket-brick-lane-foodhall", [
      "hero-upmarket.jpg",
      "1.jpg",
      "2.jpg",
      "3.jpg",
      "4.jpg",
      "5.jpg",
      "7.jpg",
      "8.jpg",
      "9.jpg",
    ]),
  },

  {
    name: {
      en: "Westfield Stratford Food Court",
      bn: "ওয়েস্টফিল্ড স্ট্র্যাটফোর্ড ফুড কোর্ট",
      it: "Westfield Stratford Food Court",
      fr: "Westfield Stratford Food Court",
      de: "Westfield Stratford Food Court",
      es: "Westfield Stratford Food Court",
      ar: "ويستفيلد ستراتفورد فود كورت",
      zh: "Westfield Stratford 美食广场",
      ja: "ウェストフィールド・ストラトフォード・フードコート",
      th: "ฟู้ดคอร์ทเวสต์ฟิลด์สแตรตฟอร์ด",
    },
    description: {
      en: "A major high-footfall dining zone inside one of London’s busiest shopping destinations, serving shoppers, tourists, and local residents.",
      bn: "লন্ডনের অন্যতম ব্যস্ত শপিং গন্তব্যের ভেতরে অবস্থিত একটি উচ্চ-ফুটফল ডাইনিং জোন, যা ক্রেতা, পর্যটক ও স্থানীয়দের সেবা দেয়।",
      it: "Un’importante area ristoro ad alto afflusso in una delle destinazioni commerciali più frequentate di Londra.",
      fr: "Une importante zone de restauration à forte fréquentation dans l’un des centres commerciaux les plus animés de Londres.",
      de: "Ein stark frequentierter Gastronomiebereich in einem der belebtesten Einkaufsziele Londons.",
      es: "Una importante zona gastronómica de gran afluencia en uno de los destinos comerciales más concurridos de Londres.",
      ar: "منطقة طعام رئيسية ذات حركة كثيفة داخل أحد أكثر مراكز التسوق ازدحامًا في لندن.",
      zh: "位于伦敦最繁忙购物中心之一内的重要高客流餐饮区，服务购物者、游客和本地居民。",
      ja: "ロンドン有数の大型商業施設内にある、高い集客力を持つ主要な飲食エリアです。",
      th: "โซนอาหารสำคัญที่มีผู้คนหนาแน่นในหนึ่งในศูนย์การค้าที่คึกคักที่สุดของลอนดอน",
    },
    href: "/hubs/westfield-stratford",
    image: "/hubs/westfield/hero-westfield.jpg",
    gallery: gallery("westfield", [
      "hero-westfield.jpg",
      "1.jpg",
      "2.jpg",
      "3.jpg",
      "4.jpg",
      
    ]),
  },

  {
    name: {
      en: "Stratford Centre Food Court",
      bn: "স্ট্র্যাটফোর্ড সেন্টার ফুড কোর্ট",
      it: "Stratford Centre Food Court",
      fr: "Stratford Centre Food Court",
      de: "Stratford Centre Food Court",
      es: "Stratford Centre Food Court",
      ar: "فود كورت ستراتفورد سنتر",
      zh: "Stratford Centre 美食广场",
      ja: "ストラトフォード・センター・フードコート",
      th: "ฟู้ดคอร์ทสแตรตฟอร์ดเซ็นเตอร์",
    },
    description: {
      en: "A diverse everyday food destination in central Stratford with strong multicultural appeal, commuter traffic, and practical grab-and-go demand.",
      bn: "স্ট্র্যাটফোর্ডের কেন্দ্রে অবস্থিত একটি বৈচিত্র্যময় দৈনন্দিন খাবারের গন্তব্য, যেখানে বহুসাংস্কৃতিক আকর্ষণ ও যাত্রী চলাচল শক্তিশালী।",
      it: "Una destinazione gastronomica quotidiana nel centro di Stratford con forte richiamo multiculturale e traffico di pendolari.",
      fr: "Une destination alimentaire quotidienne au centre de Stratford avec un fort attrait multiculturel et un important passage de navetteurs.",
      de: "Ein vielfältiges tägliches Food-Ziel im Zentrum von Stratford mit multikultureller Anziehungskraft und Pendlerverkehr.",
      es: "Un destino gastronómico diario en el centro de Stratford con fuerte atractivo multicultural y tráfico de viajeros.",
      ar: "وجهة طعام يومية متنوعة في وسط ستراتفورد ذات جاذبية متعددة الثقافات وحركة ركاب قوية.",
      zh: "位于斯特拉特福中心的多元日常餐饮地，具有强烈的多文化吸引力和通勤客流。",
      ja: "ストラトフォード中心部にある、多文化的な魅力と通勤客の流れを持つ日常的なフードスポットです。",
      th: "แหล่งอาหารประจำวันใจกลางสแตรตฟอร์ดที่มีความหลากหลายทางวัฒนธรรมและมีผู้สัญจรจำนวนมาก",
    },
    href: "/hubs/stratford-centre",
    image: "/hubs/stratford-centre/hero-stratford-centre.jpg",
    gallery: gallery("stratford-centre", [
      "hero-stratford-centre.jpg",
      "1.jpg",
      "2.jpg",
      "3.jpg",
      "4.jpg",
      "5.jpg",
      
    ]),
  },

  {
    name: {
      en: "Shoreditch / BOXPARK",
      bn: "শোরডিচ / বক্সপার্ক",
      it: "Shoreditch / BOXPARK",
      fr: "Shoreditch / BOXPARK",
      de: "Shoreditch / BOXPARK",
      es: "Shoreditch / BOXPARK",
      ar: "شورديتش / بوكس بارك",
      zh: "Shoreditch / BOXPARK",
      ja: "ショーディッチ / BOXPARK",
      th: "ชอร์ดิช / BOXPARK",
    },
    description: {
      en: "A younger, modern food crowd with high visual appeal, container-food energy, and strong discovery potential.",
      bn: "তরুণ ও আধুনিক ফুড ক্রাউড, ভিজ্যুয়াল আকর্ষণ এবং নতুন কিছু খুঁজে পাওয়ার সম্ভাবনা সমৃদ্ধ একটি এলাকা।",
      it: "Una scena gastronomica giovane e moderna con forte impatto visivo e ottimo potenziale di scoperta.",
      fr: "Une scène culinaire jeune et moderne avec un fort attrait visuel et un grand potentiel de découverte.",
      de: "Eine junge, moderne Food-Szene mit starker visueller Wirkung und hohem Entdeckungspotenzial.",
      es: "Un entorno gastronómico joven y moderno con gran atractivo visual y alto potencial de descubrimiento.",
      ar: "مشهد طعام حديث وشاب يتمتع بجاذبية بصرية قوية وإمكانات عالية للاكتشاف.",
      zh: "一个更年轻、更现代的美食人群聚集地，具有很强的视觉吸引力和发现潜力。",
      ja: "若くモダンなフードカルチャーが集まり、視覚的魅力と発見性の高いエリアです。",
      th: "แหล่งรวมอาหารสมัยใหม่สำหรับคนรุ่นใหม่ มีความโดดเด่นด้านภาพลักษณ์และน่าค้นหา",
    },
    href: "/hubs/shoreditch-boxpark",
    image: "/hubs/boxpark/hero.jpg",
    gallery: gallery("boxpark", [
      "hero.jpg",
      "1.jpg",
      "2.jpg",
      "3.jpg",
      "4.jpg",
      "5.jpg",
      "6.jpg",
      "7.jpg",
      "8.jpg",
      "9.jpg",
    ]),
  },

  {
    name: {
      en: "Edgware Road Arabian Food Hub",
      bn: "এজওয়্যার রোড আরাবিয়ান ফুড হাব",
      it: "Edgware Road Arabian Food Hub",
      fr: "Edgware Road Arabian Food Hub",
      de: "Edgware Road Arabian Food Hub",
      es: "Edgware Road Arabian Food Hub",
      ar: "مركز طعام إدجوير رود العربي",
      zh: "Edgware Road 阿拉伯美食中心",
      ja: "エッジウェア・ロード・アラビアン・フードハブ",
      th: "ศูนย์อาหารอาหรับเอดจ์แวร์โรด",
    },
    description: {
      en: "A strong Middle Eastern and Arabian dining corridor with high tourist visibility, late-night demand, shisha culture, grills, sweets, and broad cross-community appeal.",
      bn: "মধ্যপ্রাচ্য ও আরবীয় খাবারের শক্তিশালী করিডোর, যেখানে পর্যটক উপস্থিতি, রাতের চাহিদা, শীশা সংস্কৃতি, গ্রিল ও মিষ্টির আকর্ষণ রয়েছে।",
      it: "Un forte corridoio gastronomico mediorientale e arabo con alta visibilità turistica, domanda notturna, narghilè, grill e dolci.",
      fr: "Un important corridor culinaire moyen-oriental et arabe avec forte visibilité touristique, demande nocturne, shisha, grillades et desserts.",
      de: "Ein starker mittelöstlicher und arabischer Gastronomiekorridor mit hoher touristischer Sichtbarkeit und Nachfrage bis spät in die Nacht.",
      es: "Un fuerte corredor gastronómico árabe y de Oriente Medio con gran visibilidad turística, demanda nocturna, shisha, parrillas y dulces.",
      ar: "ممر قوي للمطاعم العربية والشرق أوسطية مع حضور سياحي مرتفع وطلب ليلي وثقافة الشيشة والمشاوي والحلويات.",
      zh: "一条强劲的中东和阿拉伯餐饮走廊，具有高旅游可见度、夜间需求、水烟文化、烧烤和甜点吸引力。",
      ja: "観光客からの注目度が高く、深夜需要、シーシャ文化、グリル料理やスイーツが魅力の中東・アラブ系フードエリアです。",
      th: "ย่านอาหารตะวันออกกลางและอาหรับที่แข็งแกร่ง มีนักท่องเที่ยวมาก ความต้องการยามดึก ชิชา อาหารย่าง และขนมหวาน",
    },
    href: "/hubs/edgware-road",
    image: "/hubs/edgware-road/hero-edgware-road.jpg",
    gallery: gallery("edgware-road", [
      "hero-edgware-road.jpg",
      "1.jpg",
      "2.jpg",
      "3.jpg",
      "4.jpg",
      "5.jpg",
      "6.jpg",
      "7.jpg",
      "8.jpg",
      "9.jpg",
    ]),
  },

  {
    name: {
      en: "China Town (Soho) Food Hub",
      bn: "চায়না টাউন (সোহো) ফুড হাব",
      it: "China Town (Soho) Food Hub",
      fr: "China Town (Soho) Food Hub",
      de: "China Town (Soho) Food Hub",
      es: "China Town (Soho) Food Hub",
      ar: "مركز طعام الحي الصيني (سوهو)",
      zh: "中国城（Soho）美食中心",
      ja: "チャイナタウン（ソーホー）フードハブ",
      th: "ศูนย์อาหารไชน่าทาวน์ (โซโห)",
    },
    description: {
      en: "A globally recognised central London food destination known for East Asian restaurants, dessert shops, fast-moving visitor traffic, and strong tourist discovery appeal.",
      bn: "পূর্ব এশীয় রেস্টুরেন্ট, ডেজার্ট শপ এবং পর্যটকদের আকর্ষণের জন্য পরিচিত একটি বিশ্বখ্যাত সেন্ট্রাল লন্ডন ফুড ডেস্টিনেশন।",
      it: "Una destinazione gastronomica riconosciuta a livello globale nel centro di Londra, nota per ristoranti dell’Asia orientale e dessert shop.",
      fr: "Une destination culinaire mondialement reconnue au centre de Londres, célèbre pour ses restaurants est-asiatiques et ses boutiques de desserts.",
      de: "Ein weltweit bekanntes Gastronomieziel im Zentrum Londons, berühmt für ostasiatische Restaurants und Dessertläden.",
      es: "Un destino gastronómico reconocido mundialmente en el centro de Londres, famoso por sus restaurantes de Asia Oriental y tiendas de postres.",
      ar: "وجهة طعام شهيرة عالميًا في وسط لندن تشتهر بالمطاعم الشرق آسيوية ومحلات الحلويات وكثافة الزوار.",
      zh: "位于伦敦市中心、全球知名的美食目的地，以东亚餐厅、甜品店和高游客流著称。",
      ja: "東アジア系レストランやデザート店で知られる、世界的に有名なロンドン中心部のフードスポットです。",
      th: "แหล่งอาหารใจกลางลอนดอนที่มีชื่อเสียงระดับโลก โดดเด่นด้วยร้านอาหารเอเชียตะวันออก ร้านของหวาน และนักท่องเที่ยวจำนวนมาก",
    },
    href: "/hubs/china-town",
  },

  {
    name: {
      en: "East Ham Town Centre",
      bn: "ইস্ট হ্যাম টাউন সেন্টার",
      it: "East Ham Town Centre",
      fr: "East Ham Town Centre",
      de: "East Ham Town Centre",
      es: "East Ham Town Centre",
      ar: "مركز مدينة إيست هام",
      zh: "East Ham 镇中心",
      ja: "イーストハム・タウンセンター",
      th: "อีสต์แฮมทาวน์เซ็นเตอร์",
    },
    description: {
      en: "A busy East London food zone with strong South Asian restaurants, takeaway demand, and everyday local footfall.",
      bn: "ইস্ট লন্ডনের একটি ব্যস্ত খাবার এলাকা, যেখানে দক্ষিণ এশীয় রেস্টুরেন্ট, টেকঅ্যাওয়ে চাহিদা এবং স্থানীয় মানুষের উপস্থিতি শক্তিশালী।",
      it: "Una vivace zona gastronomica dell’East London con forti ristoranti sudasiatici e domanda takeaway.",
      fr: "Une zone alimentaire animée de l’est de Londres avec de solides restaurants sud-asiatiques et une forte demande à emporter.",
      de: "Ein belebtes Food-Viertel im Osten Londons mit starken südasiatischen Restaurants und hoher Takeaway-Nachfrage.",
      es: "Una concurrida zona gastronómica del este de Londres con fuertes restaurantes del sur de Asia y demanda de comida para llevar.",
      ar: "منطقة طعام مزدحمة في شرق لندن تضم مطاعم جنوب آسيوية قوية وطلبًا يوميًا مرتفعًا.",
      zh: "东伦敦繁忙的餐饮区，拥有强劲的南亚餐厅、外卖需求和日常本地客流。",
      ja: "南アジア系レストランとテイクアウト需要が強い、東ロンドンの活気あるフードエリアです。",
      th: "ย่านอาหารที่คึกคักในอีสต์ลอนดอน มีร้านอาหารเอเชียใต้จำนวนมากและความต้องการสั่งกลับบ้านสูง",
    },
    href: "/hubs/east-ham-town-centre",
    image: "/hubs/east-ham-town-centre/hero.jpg",
gallery: gallery("east-ham-town-centre", [
  "hero.jpg",
  "1.jpg",
  "2.jpg",
  "3.jpg",
  "4.jpg",
  "5.jpg",
  "6.jpg",
  "7.jpg",
  "8.jpg",
  "9.jpg",
  "10.jpg",
  "11.jpg",
]),
  },

  {
    name: {
      en: "Barking Road (East Ham)",
      bn: "বার্কিং রোড (ইস্ট হ্যাম)",
      it: "Barking Road (East Ham)",
      fr: "Barking Road (East Ham)",
      de: "Barking Road (East Ham)",
      es: "Barking Road (East Ham)",
      ar: "باركينغ رود (إيست هام)",
      zh: "Barking Road（East Ham）",
      ja: "バーキング・ロード（イーストハム）",
      th: "บาร์คิงโรด (อีสต์แฮม)",
    },
    description: {
      en: "A practical food stretch near East Ham Town Hall with visible local trading activity and strong discovery potential.",
      bn: "ইস্ট হ্যাম টাউন হলের কাছে একটি কার্যকরী ফুড স্ট্রেচ, যেখানে স্থানীয় বাণিজ্যিক কার্যক্রম দৃশ্যমান এবং নতুন আবিষ্কারের সম্ভাবনা রয়েছে।",
      it: "Una pratica area food vicino a East Ham Town Hall con attività commerciali locali visibili e buon potenziale di scoperta.",
      fr: "Un axe alimentaire pratique près de l’hôtel de ville d’East Ham avec une activité commerciale locale visible.",
      de: "Ein praktischer Food-Abschnitt nahe East Ham Town Hall mit sichtbarer lokaler Handelsaktivität.",
      es: "Una franja gastronómica práctica cerca del Ayuntamiento de East Ham con actividad comercial local visible.",
      ar: "امتداد غذائي عملي بالقرب من مجلس مدينة إيست هام مع نشاط تجاري محلي واضح وإمكانات اكتشاف قوية.",
      zh: "位于 East Ham 市政厅附近的实用餐饮带，具有明显的本地商业活动和发现潜力。",
      ja: "イーストハム・タウンホール近くの実用的なフード通りで、地域の商業活動が見えやすいエリアです。",
      th: "แนวถนนอาหารใกล้อีสต์แฮมทาวน์ฮอลล์ ที่มีการค้าท้องถิ่นชัดเจนและมีศักยภาพในการค้นพบสูง",
    },
    href: "/hubs/barking-road",
    image: "/hubs/barking-road/hero.jpg",
    gallery: gallery("barking-road", [
      "hero.jpg",
      "1.jpg",
      "2.jpg",
      "3.jpg",
      "4.jpg",
      "5.jpg",
      "6.jpg",
      "7.jpg",
      "8.jpg",
      "9.jpg",
    ]),
  },

  {
    name: {
      en: "High Street North (East Ham)",
      bn: "হাই স্ট্রিট নর্থ (ইস্ট হ্যাম)",
      it: "High Street North (East Ham)",
      fr: "High Street North (East Ham)",
      de: "High Street North (East Ham)",
      es: "High Street North (East Ham)",
      ar: "هاي ستريت نورث (إيست هام)",
      zh: "High Street North（East Ham）",
      ja: "ハイストリート・ノース（イーストハム）",
      th: "ไฮสตรีทนอร์ธ (อีสต์แฮม)",
    },
    description: {
      en: "A high-density food corridor with restaurants, takeaways, and practical local demand across East Ham.",
      bn: "ইস্ট হ্যাম জুড়ে রেস্টুরেন্ট, টেকঅ্যাওয়ে এবং স্থানীয় চাহিদা সমৃদ্ধ একটি উচ্চ-ঘনত্বের ফুড করিডোর।",
      it: "Un corridoio gastronomico ad alta densità con ristoranti, takeaway e forte domanda locale.",
      fr: "Un corridor alimentaire dense avec restaurants, plats à emporter et forte demande locale.",
      de: "Ein hochverdichteter Food-Korridor mit Restaurants, Takeaways und starker lokaler Nachfrage.",
      es: "Un corredor gastronómico de alta densidad con restaurantes, takeaway y fuerte demanda local.",
      ar: "ممر غذائي عالي الكثافة يضم مطاعم وخيارات تيك أواي وطلبًا محليًا قويًا.",
      zh: "一个高密度餐饮走廊，拥有餐厅、外卖店和稳定的本地需求。",
      ja: "レストランやテイクアウト店が集積し、地域需要が高い高密度フードコリドーです。",
      th: "ย่านอาหารหนาแน่นที่มีร้านอาหารและร้านสั่งกลับบ้านจำนวนมาก พร้อมความต้องการในพื้นที่สูง",
    },
    href: "/hubs/high-street-north",
    image: "/hubs/high-street-north/8.jpg",
    gallery: gallery("high-street-north", [
      "hero.jpg",
      "1.jpg",
      "2.jpg",
      "3.jpg",
      "4.jpg",
      "5.jpg",
      "6.jpg",
      "7.jpg",
      "8.jpg",
      "9.jpg",
    ]),
  },

  {
    name: {
      en: "Ilford Lane",
      bn: "ইলফোর্ড লেন",
      it: "Ilford Lane",
      fr: "Ilford Lane",
      de: "Ilford Lane",
      es: "Ilford Lane",
      ar: "إلفورد لين",
      zh: "Ilford Lane",
      ja: "イルフォード・レーン",
      th: "อิลฟอร์ดเลน",
    },
    description: {
      en: "A very active food hub known for grills, sweets, South Asian cuisine, and strong family dining appeal.",
      bn: "গ্রিল, মিষ্টি, দক্ষিণ এশীয় রান্না এবং পারিবারিক ডাইনিং আকর্ষণের জন্য পরিচিত একটি অত্যন্ত সক্রিয় ফুড হাব।",
      it: "Un food hub molto attivo noto per grill, dolci, cucina sudasiatica e forte appeal per famiglie.",
      fr: "Un food hub très actif connu pour ses grillades, ses douceurs, sa cuisine sud-asiatique et son attrait familial.",
      de: "Ein sehr aktiver Food Hub, bekannt für Grills, Süßwaren, südasiatische Küche und familienfreundliches Essen.",
      es: "Un food hub muy activo conocido por parrillas, dulces, cocina del sur de Asia y gran atractivo familiar.",
      ar: "مركز طعام نشط جدًا معروف بالمشاوي والحلويات والمطبخ الجنوب آسيوي وجاذبيته للعائلات.",
      zh: "一个非常活跃的美食中心，以烧烤、甜品、南亚菜和家庭聚餐吸引力而闻名。",
      ja: "グリル料理、スイーツ、南アジア料理、家族向けの食事需要で知られる非常に活発なフードハブです。",
      th: "ศูนย์อาหารที่คึกคักมาก โดดเด่นด้วยอาหารย่าง ขนมหวาน อาหารเอเชียใต้ และเหมาะกับการรับประทานแบบครอบครัว",
    },
    href: "/hubs/ilford-lane",
    image: "/hubs/ilford-lane/hero-ilford-lane.jpg",
    gallery: gallery("ilford-lane", [
      "hero-ilford-lane.jpg",
      "1.jpg",
      "2.jpg",
      "3.jpg",
      "4.jpg",
      "5.jpg",
      "6.jpg",
      "7.jpg",
      "8.jpg",
      "9.jpg",
    ]),
  },

  {
    name: {
      en: "Commercial Road",
      bn: "কমার্শিয়াল রোড",
      it: "Commercial Road",
      fr: "Commercial Road",
      de: "Commercial Road",
      es: "Commercial Road",
      ar: "كوميرشال رود",
      zh: "Commercial Road",
      ja: "コマーシャル・ロード",
      th: "คอมเมอร์เชียลโรด",
    },
    description: {
      en: "A diverse East London food corridor connecting multiple communities with strong multicultural dining potential.",
      bn: "বহু সম্প্রদায়কে সংযুক্ত করা একটি বৈচিত্র্যময় ইস্ট লন্ডন ফুড করিডোর, যেখানে বহুসাংস্কৃতিক ডাইনিং সম্ভাবনা শক্তিশালী।",
      it: "Un corridoio gastronomico diversificato dell’East London che collega più comunità con forte potenziale multiculturale.",
      fr: "Un corridor alimentaire diversifié de l’est de Londres reliant plusieurs communautés avec un fort potentiel multiculturel.",
      de: "Ein vielfältiger Food-Korridor im Osten Londons, der mehrere Communities mit starkem multikulturellem Potenzial verbindet.",
      es: "Un corredor gastronómico diverso del este de Londres que conecta varias comunidades con fuerte potencial multicultural.",
      ar: "ممر غذائي متنوع في شرق لندن يربط عدة مجتمعات مع إمكانات قوية لتناول الطعام متعدد الثقافات.",
      zh: "一条多元化的东伦敦餐饮走廊，连接多个社区，具有很强的多文化餐饮潜力。",
      ja: "複数のコミュニティをつなぐ、多文化的な食の可能性を持つ東ロンドンのフードコリドーです。",
      th: "แนวถนนอาหารที่หลากหลายในอีสต์ลอนดอน เชื่อมหลายชุมชนและมีศักยภาพด้านอาหารหลากหลายวัฒนธรรมสูง",
    },
    href: "/hubs/commercial-road",
  },

  {
    name: {
      en: "London Street Food",
      bn: "লন্ডন স্ট্রিট ফুড",
      it: "London Street Food",
      fr: "London Street Food",
      de: "London Street Food",
      es: "London Street Food",
      ar: "طعام الشارع في لندن",
      zh: "伦敦街头美食",
      ja: "ロンドン・ストリートフード",
      th: "สตรีทฟู้ดลอนดอน",
    },
    description: {
      en: "A flexible hub for street food sellers, vans, stalls, market traders, and pop-up food businesses from any part of London.",
      bn: "লন্ডনের যেকোনো এলাকার স্ট্রিট ফুড বিক্রেতা, ভ্যান, স্টল, মার্কেট ট্রেডার এবং পপ-আপ ফুড ব্যবসার জন্য একটি নমনীয় হাব।",
      it: "Un hub flessibile per venditori di street food, van, bancarelle, commercianti di mercato e pop-up food business da tutta Londra.",
      fr: "Un hub flexible pour les vendeurs de street food, food vans, stands, commerçants de marché et activités pop-up de toute la ville.",
      de: "Ein flexibler Hub für Street-Food-Verkäufer, Vans, Stände, Marktbetreiber und Pop-up-Food-Betriebe aus ganz London.",
      es: "Un hub flexible para vendedores de comida callejera, vans, puestos, comerciantes de mercado y negocios pop-up de toda Londres.",
      ar: "مركز مرن لبائعي طعام الشارع والعربات والأكشاك وتجار الأسواق ومشاريع الطعام المؤقتة من جميع أنحاء لندن.",
      zh: "一个灵活的中心，面向来自伦敦各地的街头小吃卖家、餐车、摊位、市场商贩和快闪餐饮业务。",
      ja: "ロンドン各地の屋台、フードバン、市場の出店者、ポップアップ型フード事業のための柔軟なハブです。",
      th: "ฮับที่ยืดหยุ่นสำหรับผู้ขายสตรีทฟู้ด รถขายอาหาร แผงขายของ พ่อค้าในตลาด และธุรกิจอาหารป๊อปอัพจากทั่วลอนดอน",
    },
    href: "/hubs/london-street-food",
    image: "/hubs/london-street-food/hero.jpg",
gallery: gallery("london-street-food", [
  "hero.jpg",
  "1.jpg",
  "2.jpg",
  "3.jpg",
  "4.jpg",
  "5.jpg",
  "6.jpg",
  "7.jpg",
  "8.jpg",
  "9.jpg",
  "10.jpg",
  "11.jpg",
  "12.jpg",
]),
  },
];

const featuredRestaurants = [
  {
    name: "Royal Bengal Kitchen",
    cuisine: "Bangladeshi",
    area: "Brick Lane",
    tags: ["Dine-in", "Takeaway", "Halal"],
    popularItems: ["Chicken Biryani", "Beef Bhuna", "Masala Chai"],
    href: "/restaurants/r1",
  },
  {
    name: "Green Spice House",
    cuisine: "Bangladeshi / Indian",
    area: "Green Street",
    tags: ["Takeaway", "Catering"],
    popularItems: ["Plain Polao", "Roast Chicken", "Firni"],
    href: "/restaurants/r2",
  },
  {
    name: "Dockside Grill & Curry",
    cuisine: "Fusion Grill",
    area: "Shoreditch/Boxpark",
    tags: ["Dine-in", "Grill"],
    popularItems: ["Chicken Tikka", "Sea Bass", "Garlic Nan"],
    href: "/restaurants/r3",
  },
  {
    name: "Spice Route Dining",
    cuisine: "Indian",
    area: "Brick Lane",
    tags: ["Dine-in"],
    popularItems: ["Lamb Karahi", "Garlic Nan", "Masala Chai"],
    href: "/restaurants/r4",
  },
  {
    name: "Plashet Family Grill",
    cuisine: "Grill",
    area: "Green Street",
    tags: ["Takeaway", "Halal"],
    popularItems: ["Chicken Grill", "Sheesh Kebab", "Paratha"],
    href: "/restaurants/r5",
  },
  {
    name: "Boxpark Bites",
    cuisine: "Cafe",
    area: "Shoreditch/Boxpark",
    tags: ["Dine-in", "Coffee"],
    popularItems: ["Cappuccino", "Ice Cream", "Roast Chicken"],
    href: "/restaurants/r6",
  },
  {
    name: "Westfield Global Bowl",
    cuisine: "Global",
    area: "Westfield Stratford",
    tags: ["Food Court", "Busy", "Tourist"],
    popularItems: ["Rice Bowl", "Chicken Wrap", "Loaded Fries"],
    href: "/restaurants/r7",
  },
  {
    name: "Stratford Centre Bangla Kitchen",
    cuisine: "Bangladeshi",
    area: "Stratford Centre",
    tags: ["Halal", "Value", "Takeaway"],
    popularItems: ["Chicken Biryani", "Beef Curry", "Dal"],
    href: "/restaurants/r8",
  },
  {
    name: "Stratford Flame Grill",
    cuisine: "Turkish",
    area: "Stratford Centre",
    tags: ["Grill", "Halal", "Busy"],
    popularItems: ["Doner Wrap", "Lamb Shish", "Fries"],
    href: "/restaurants/r9",
  },
  {
    name: "Cedars Arabian Grill",
    cuisine: "Arabian / Middle Eastern",
    area: "Edgware Road",
    tags: ["Dine-in", "Late Night", "Halal"],
    popularItems: ["Mixed Grill", "Lamb Shawarma", "Kunafa"],
    href: "/restaurants/r10",
  },
  {
    name: "Nile Nights Kitchen",
    cuisine: "Arabian / Middle Eastern",
    area: "Edgware Road",
    tags: ["Family Dining", "Desserts", "Halal"],
    popularItems: ["Chicken Mandi", "Hummus", "Baklava"],
    href: "/restaurants/r11",
  },
  {
    name: "Soho Dragon Wok",
    cuisine: "Chinese",
    area: "China Town (Soho)",
    tags: ["Dine-in", "Tourist", "Noodles"],
    popularItems: ["Roast Duck", "Chow Mein", "Dim Sum"],
    href: "/restaurants/r12",
  },
  {
    name: "Golden Panda House",
    cuisine: "East Asian",
    area: "China Town (Soho)",
    tags: ["Busy", "Desserts", "Bubble Tea"],
    popularItems: ["Hot Pot", "Bubble Tea", "Mango Pancake"],
    href: "/restaurants/r13",
  },
  {
    name: "East Ham Spice Corner",
    cuisine: "Bangladeshi / Indian",
    area: "East Ham Town Centre",
    tags: ["Takeaway", "Family Dining", "Halal"],
    popularItems: ["Chicken Biryani", "Kala Bhuna", "Paratha"],
    href: "/restaurants/r14",
  },
  {
    name: "Ilford Lane Grill House",
    cuisine: "Grill",
    area: "Ilford Lane",
    tags: ["Grill", "Takeaway", "Halal"],
    popularItems: ["Mixed Grill", "Chicken Wings", "Naan"],
    href: "/restaurants/r15",
  },
  {
    name: "Commercial Road Kitchen",
    cuisine: "Global",
    area: "Commercial Road",
    tags: ["Lunch", "Busy", "Delivery"],
    popularItems: ["Rice Bowl", "Wrap", "Fries"],
    href: "/restaurants/r16",
  },
  {
    name: "London Street Food Van",
    cuisine: "Street Food",
    area: "London Street Food",
    tags: ["Van", "Street Food", "Mobile"],
    popularItems: ["Loaded Fries", "Burger", "Wrap"],
    href: "/restaurants/r17",
  },
];

const popularFoodAndDrinks = [
  "Chicken Biryani",
  "Kacchi Biryani",
  "Beef Tehari",
  "Masala Chai",
  "Cappuccino",
  "Firni",
  "Ice Cream",
  "Roast Chicken",
  "Doner Wrap",
  "Rice Bowl",
  "Mixed Grill",
  "Loaded Fries",
  "Bubble Tea",
];

const areaOptions = [
  "All",
  "Brick Lane",
  "Green Street",
  "Shoreditch/Boxpark",
  "Westfield Stratford",
  "Stratford Centre",
  "Edgware Road",
  "China Town (Soho)",
  "East Ham Town Centre",
  "Barking Road",
  "High Street North",
  "Ilford Lane",
  "Commercial Road",
  "London Street Food",
];

const cuisineOptions = [
  "All",
  "Bangladeshi",
  "Bangladeshi / Indian",
  "Indian",
  "Thai",
  "Japanese",
  "Fusion Grill",
  "Grill",
  "Cafe",
  "Global",
  "Turkish",
  "Arabian / Middle Eastern",
  "Chinese",
  "East Asian",
  "Street Food",
];

const pageCopy: Record<
  AppLanguage,
  {
    hubsTitle: string;
    hubsSubtitle: string;
    foodsTitle: string;
    foodsSubtitle: string;
    featuredTitle: string;
    featuredSubtitle: string;
    searchLabel: string;
    searchPlaceholder: string;
    areaLabel: string;
    cuisineLabel: string;
    locationLabel?: string;
    showing: string;
    restaurant: string;
    restaurants: string;
    clearFilters: string;
    noResults: string;
    ctaTitle: string;
    ctaSubtitle: string;
    viewCatering: string;
    join: string;
    all: string;
  }
> = {
  en: {
    hubsTitle: "Explore London’s Key South Asian & Global Food Hubs",
    hubsSubtitle:
      "Start with focused food hubs where real restaurants, real menus, and real customer traffic already exist.",
    foodsTitle: "Popular Food & Drinks",
    foodsSubtitle:
      "A flexible menu system for rice, breads, curries, grills, seafood, hot drinks, desserts, and more.",
    featuredTitle: "Featured Restaurants",
    featuredSubtitle:
      "Early featured listings can help diners quickly discover popular restaurants and give owners a strong first impression of the platform.",
    searchLabel: "Search",
    searchPlaceholder: "Search restaurant or dish...",
    areaLabel: "Area",
    cuisineLabel: "Cuisine",
    showing: "Showing",
    restaurant: "restaurant",
    restaurants: "restaurants",
    clearFilters: "Clear filters",
    noResults: "No restaurants matched your filters.",
    ctaTitle: "Planning an event or family gathering?",
    ctaSubtitle:
      "SmartServeUK will also support catering packages, set menus, and food planning for parties, events, and group orders.",
    viewCatering: "View Catering",
    join: "Join SmartServeUK",
    all: "All",
  },

  bn: {
    hubsTitle: "লন্ডনের ফুড হাবসমূহ",
    hubsSubtitle:
      "ব্রিক লেন, গ্রিন স্ট্রিট, স্ট্র্যাটফোর্ড এবং আরও অনেক এলাকার জনপ্রিয় খাবারের জায়গা খুঁজে নিন।",
    foodsTitle: "জনপ্রিয় খাবার ও কুইজিন",
    foodsSubtitle:
      "বাংলাদেশি, দক্ষিণ এশীয়, ইতালিয়ান, আরবি, থাই, জাপানিজ এবং আরও অনেক স্বাদের খাবার খুঁজুন।",
    featuredTitle: "নির্বাচিত রেস্টুরেন্ট",
    featuredSubtitle:
      "এলাকার সেরা রেস্টুরেন্ট, স্টল, ভ্যান এবং স্ট্রিট ফুড ব্যবসা এক জায়গায় দেখুন।",
    searchLabel: "খুঁজুন",
    searchPlaceholder: "রেস্টুরেন্ট, এলাকা বা খাবারের নাম লিখুন",
    areaLabel: "এলাকা",
    cuisineLabel: "কুইজিন",
    showing: "দেখানো হচ্ছে",
    restaurant: "রেস্টুরেন্ট",
    restaurants: "রেস্টুরেন্টসমূহ",
    clearFilters: "ফিল্টার মুছুন",
    noResults: "কোনো ফলাফল পাওয়া যায়নি",
    ctaTitle: "ক্যাটারিং ও বড় অর্ডারের জন্য প্রস্তুত হন",
    ctaSubtitle:
      "SmartServeUK শীঘ্রই ক্যাটারিং প্যাকেজ, সাপ্লায়ার সংযোগ, স্টাফ পরিকল্পনা এবং ডেলিভারি ব্যবস্থাপনা যুক্ত করবে।",
    viewCatering: "ক্যাটারিং দেখুন",
    join: "যোগ দিন",
    all: "সব",
  },

  it: {
    hubsTitle:
      "Esplora i principali poli gastronomici sudasiatici e globali di Londra",
    hubsSubtitle:
      "Inizia con hub gastronomici mirati dove esistono già veri ristoranti, veri menu e vero traffico di clienti.",
    foodsTitle: "Cibi e Bevande Popolari",
    foodsSubtitle:
      "Un sistema di menu flessibile per riso, pane, curry, grigliate, frutti di mare, bevande calde, dessert e altro.",
    featuredTitle: "Ristoranti in Evidenza",
    featuredSubtitle:
      "Le prime inserzioni in evidenza aiutano i clienti a scoprire rapidamente ristoranti popolari e danno ai proprietari una forte prima impressione della piattaforma.",
    searchLabel: "Cerca",
    searchPlaceholder: "Cerca ristorante o piatto...",
    areaLabel: "Zona",
    cuisineLabel: "Cucina",
    showing: "Mostrando",
    restaurant: "ristorante",
    restaurants: "ristoranti",
    clearFilters: "Cancella filtri",
    noResults: "Nessun ristorante corrisponde ai filtri selezionati.",
    ctaTitle: "Stai pianificando un evento o una riunione di famiglia?",
    ctaSubtitle:
      "SmartServeUK supporterà anche pacchetti catering, menu fissi e pianificazione del cibo per feste, eventi e ordini di gruppo.",
    viewCatering: "Vedi Catering",
    join: "Unisciti a SmartServeUK",
    all: "Tutti",
  },

  fr: {
    hubsTitle:
      "Explorez les principaux pôles culinaires sud-asiatiques et mondiaux de Londres",
    hubsSubtitle:
      "Commencez par des pôles culinaires ciblés où il existe déjà de vrais restaurants, de vrais menus et un vrai trafic client.",
    foodsTitle: "Plats et Boissons Populaires",
    foodsSubtitle:
      "Un système de menu flexible pour le riz, les pains, les currys, les grillades, les fruits de mer, les boissons chaudes, les desserts et plus encore.",
    featuredTitle: "Restaurants en Vedette",
    featuredSubtitle:
      "Les premières mises en avant aident les clients à découvrir rapidement des restaurants populaires et donnent aux propriétaires une forte première impression de la plateforme.",
    searchLabel: "Recherche",
    searchPlaceholder: "Rechercher un restaurant ou un plat...",
    areaLabel: "Zone",
    cuisineLabel: "Cuisine",
    showing: "Affichage de",
    restaurant: "restaurant",
    restaurants: "restaurants",
    clearFilters: "Effacer les filtres",
    noResults: "Aucun restaurant ne correspond à vos filtres.",
    ctaTitle: "Vous préparez un événement ou une réunion de famille ?",
    ctaSubtitle:
      "SmartServeUK prendra également en charge les formules traiteur, les menus fixes et la planification alimentaire pour les fêtes, événements et commandes de groupe.",
    viewCatering: "Voir le Catering",
    join: "Rejoindre SmartServeUK",
    all: "Tous",
  },

  de: {
    hubsTitle:
      "Entdecken Sie Londons wichtigste südasiatische und globale Food-Hubs",
    hubsSubtitle:
      "Beginnen Sie mit gezielten Food-Hubs, in denen es bereits echte Restaurants, echte Speisekarten und echten Kundenverkehr gibt.",
    foodsTitle: "Beliebte Speisen & Getränke",
    foodsSubtitle:
      "Ein flexibles Menüsystem für Reis, Brote, Currys, Grillgerichte, Meeresfrüchte, Heißgetränke, Desserts und mehr.",
    featuredTitle: "Empfohlene Restaurants",
    featuredSubtitle:
      "Frühe hervorgehobene Einträge helfen Gästen, beliebte Restaurants schnell zu entdecken, und geben Eigentümern einen starken ersten Eindruck von der Plattform.",
    searchLabel: "Suche",
    searchPlaceholder: "Restaurant oder Gericht suchen...",
    areaLabel: "Gebiet",
    cuisineLabel: "Küche",
    showing: "Anzeige",
    restaurant: "Restaurant",
    restaurants: "Restaurants",
    clearFilters: "Filter löschen",
    noResults: "Keine Restaurants entsprechen Ihren Filtern.",
    ctaTitle: "Planen Sie eine Veranstaltung oder ein Familientreffen?",
    ctaSubtitle:
      "SmartServeUK unterstützt auch Catering-Pakete, feste Menüs und Essensplanung für Feiern, Veranstaltungen und Gruppenbestellungen.",
    viewCatering: "Catering ansehen",
    join: "SmartServeUK beitreten",
    all: "Alle",
  },

  es: {
    hubsTitle:
      "Explora los principales centros gastronómicos del sur de Asia y del mundo en Londres",
    hubsSubtitle:
      "Comienza con centros gastronómicos enfocados donde ya existen restaurantes reales, menús reales y tráfico real de clientes.",
    foodsTitle: "Comidas y Bebidas Populares",
    foodsSubtitle:
      "Un sistema de menú flexible para arroz, panes, curris, parrillas, mariscos, bebidas calientes, postres y más.",
    featuredTitle: "Restaurantes Destacados",
    featuredSubtitle:
      "Los primeros listados destacados ayudan a los clientes a descubrir rápidamente restaurantes populares y dan a los propietarios una fuerte primera impresión de la plataforma.",
    searchLabel: "Buscar",
    searchPlaceholder: "Buscar restaurante o plato...",
    areaLabel: "Zona",
    cuisineLabel: "Cocina",
    showing: "Mostrando",
    restaurant: "restaurante",
    restaurants: "restaurantes",
    clearFilters: "Borrar filtros",
    noResults: "Ningún restaurante coincide con tus filtros.",
    ctaTitle: "¿Planeando un evento o una reunión familiar?",
    ctaSubtitle:
      "SmartServeUK también admitirá paquetes de catering, menús fijos y planificación de comida para fiestas, eventos y pedidos grupales.",
    viewCatering: "Ver Catering",
    join: "Únete a SmartServeUK",
    all: "Todos",
  },

  ar: {
    hubsTitle: "استكشف أهم مراكز الطعام الجنوب آسيوية والعالمية في لندن",
    hubsSubtitle:
      "ابدأ بمراكز طعام مركزة حيث توجد مطاعم حقيقية وقوائم حقيقية وحركة عملاء حقيقية بالفعل.",
    foodsTitle: "الأطعمة والمشروبات الشائعة",
    foodsSubtitle:
      "نظام قوائم مرن للأرز والخبز والكاري والمشاوي والمأكولات البحرية والمشروبات الساخنة والحلويات وغير ذلك.",
    featuredTitle: "مطاعم مميزة",
    featuredSubtitle:
      "يمكن أن تساعد القوائم المميزة المبكرة الزبائن على اكتشاف المطاعم الشعبية بسرعة وتمنح الملاك انطباعًا أوليًا قويًا عن المنصة.",
    searchLabel: "بحث",
    searchPlaceholder: "ابحث عن مطعم أو طبق...",
    areaLabel: "المنطقة",
    cuisineLabel: "المطبخ",
    showing: "عرض",
    restaurant: "مطعم",
    restaurants: "مطاعم",
    clearFilters: "مسح الفلاتر",
    noResults: "لم يتم العثور على مطاعم تطابق الفلاتر.",
    ctaTitle: "هل تخطط لفعالية أو تجمع عائلي؟",
    ctaSubtitle:
      "سيدعم SmartServeUK أيضًا باقات التموين والقوائم المحددة وتخطيط الطعام للحفلات والفعاليات والطلبات الجماعية.",
    viewCatering: "عرض التموين",
    join: "انضم إلى SmartServeUK",
    all: "الكل",
  },

  zh: {
    hubsTitle: "探索伦敦主要的南亚及全球美食中心",
    hubsSubtitle: "从已有真实餐厅、真实菜单和真实客流的重点美食中心开始。",
    foodsTitle: "热门美食与饮品",
    foodsSubtitle:
      "灵活的菜单系统，涵盖米饭、面包、咖喱、烧烤、海鲜、热饮、甜点等。",
    featuredTitle: "精选餐厅",
    featuredSubtitle:
      "早期精选列表可以帮助食客快速发现热门餐厅，也能让店主对平台留下良好的第一印象。",
    searchLabel: "搜索",
    searchPlaceholder: "搜索餐厅或菜品...",
    areaLabel: "区域",
    cuisineLabel: "菜系",
    showing: "显示",
    restaurant: "家餐厅",
    restaurants: "家餐厅",
    clearFilters: "清除筛选",
    noResults: "没有餐厅符合你的筛选条件。",
    ctaTitle: "正在计划活动或家庭聚会？",
    ctaSubtitle:
      "SmartServeUK 也将支持餐饮套餐、固定菜单以及聚会、活动和团体订单的餐食规划。",
    viewCatering: "查看餐饮",
    join: "加入 SmartServeUK",
    all: "全部",
  },

  ja: {
    hubsTitle: "ロンドンの主要な南アジア・グローバルフードハブを探そう",
    hubsSubtitle:
      "実際のレストラン、実際のメニュー、実際の来客がすでにある注目のフードハブから始めましょう。",
    foodsTitle: "人気の料理とドリンク",
    foodsSubtitle:
      "ご飯、パン、カレー、グリル、シーフード、温かい飲み物、デザートなどに対応した柔軟なメニューシステムです。",
    featuredTitle: "注目のレストラン",
    featuredSubtitle:
      "初期の注目掲載は、利用者が人気レストランをすばやく見つける助けになり、オーナーにも強い第一印象を与えます。",
    searchLabel: "検索",
    searchPlaceholder: "レストランまたは料理を検索...",
    areaLabel: "エリア",
    cuisineLabel: "料理",
    showing: "表示中",
    restaurant: "レストラン",
    restaurants: "レストラン",
    clearFilters: "フィルターをクリア",
    noResults: "条件に一致するレストランが見つかりませんでした。",
    ctaTitle: "イベントや家族の集まりを計画していますか？",
    ctaSubtitle:
      "SmartServeUK は、ケータリングパッケージ、セットメニュー、パーティー・イベント・団体注文向けのフードプランニングにも対応予定です。",
    viewCatering: "ケータリングを見る",
    join: "SmartServeUK に参加",
    all: "すべて",
  },

  th: {
    hubsTitle: "สำรวจศูนย์รวมอาหารเอเชียใต้และอาหารนานาชาติสำคัญของลอนดอน",
    hubsSubtitle:
      "เริ่มต้นด้วยศูนย์รวมอาหารที่มีร้านอาหารจริง เมนูจริง และลูกค้าจริงอยู่แล้ว",
    foodsTitle: "อาหารและเครื่องดื่มยอดนิยม",
    foodsSubtitle:
      "ระบบเมนูที่ยืดหยุ่นสำหรับข้าว ขนมปัง แกง อาหารย่าง ซีฟู้ด เครื่องดื่มร้อน ของหวาน และอื่น ๆ",
    featuredTitle: "ร้านอาหารแนะนำ",
    featuredSubtitle:
      "รายการแนะนำช่วงแรกช่วยให้ลูกค้าค้นหาร้านยอดนิยมได้เร็วขึ้น และช่วยสร้างความประทับใจแรกที่ดีให้เจ้าของร้านต่อแพลตฟอร์ม",
    searchLabel: "ค้นหา",
    searchPlaceholder: "ค้นหาร้านอาหารหรือเมนู...",
    areaLabel: "พื้นที่",
    cuisineLabel: "ประเภทอาหาร",
    showing: "กำลังแสดง",
    restaurant: "ร้านอาหาร",
    restaurants: "ร้านอาหาร",
    clearFilters: "ล้างตัวกรอง",
    noResults: "ไม่พบร้านอาหารที่ตรงกับตัวกรองของคุณ",
    ctaTitle: "กำลังวางแผนงานอีเวนต์หรือการรวมตัวของครอบครัวใช่ไหม?",
    ctaSubtitle:
      "SmartServeUK จะรองรับแพ็กเกจจัดเลี้ยง เซ็ตเมนู และการวางแผนอาหารสำหรับงานปาร์ตี้ อีเวนต์ และคำสั่งซื้อแบบกลุ่มด้วย",
    viewCatering: "ดูบริการจัดเลี้ยง",
    join: "เข้าร่วม SmartServeUK",
    all: "ทั้งหมด",
  },
};

async function getUserRoleLabel(uid: string) {
  const roleMap: { collection: string; label: string }[] = [
    { collection: "restaurants", label: "Restaurant" },
    { collection: "suppliers", label: "Supplier" },
    { collection: "customers", label: "Customer" },
    { collection: "riders", label: "Rider" },
    { collection: "catering_houses", label: "Catering House" },
    { collection: "blackcabs", label: "Black Cab" },
    { collection: "blackcab_drivers", label: "Black Cab Driver" },
    { collection: "staff", label: "Staff" },
  ];

  for (const item of roleMap) {
    const snap = await getDoc(doc(db, item.collection, uid));
    if (snap.exists()) {
      return item.label;
    }
  }

  return "User";
}

function getShortEmail(email?: string | null) {
  if (!email) return "Signed in";
  return email;
}
const LOCATION_MAP: Record<string, string[]> = {
  e1: ["Brick Lane", "Shoreditch/Boxpark", "Commercial Road"],
  e6: ["Barking Road", "East Ham Town Centre"],
  e7: ["East Ham Town Centre", "High Street North", "Barking Road"],
  e15: ["Stratford Centre", "Westfield Stratford"],

  w1: ["China Town (Soho)"],
  w2: ["Edgware Road"],
  nw1: ["Edgware Road"],
  nw8: ["Edgware Road"],
  ig1: ["Ilford Lane"],

  brick: ["Brick Lane"],
  shoreditch: ["Shoreditch/Boxpark"],
  stratford: ["Stratford Centre", "Westfield Stratford"],
  westfield: ["Westfield Stratford"],
  edgware: ["Edgware Road"],
  ilford: ["Ilford Lane"],
  china: ["China Town (Soho)"],
  soho: ["China Town (Soho)"],
  commercial: ["Commercial Road"],
};
function getTopDishesForArea(area: string) {
  const restaurants =
    area === "All"
      ? featuredRestaurants
      : featuredRestaurants.filter((restaurant) => restaurant.area === area);

  const dishCount: Record<string, number> = {};

  restaurants.forEach((restaurant) => {
    restaurant.popularItems.forEach((item) => {
      dishCount[item] = (dishCount[item] || 0) + 1;
    });
  });

  return Object.entries(dishCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([dish]) => dish);
}
export default function HomePage() {
  const { lang, setLang } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [showCookieBanner, setShowCookieBanner] = useState(false);
  const [selectedArea, setSelectedArea] = useState("All");
  const [selectedCuisine, setSelectedCuisine] = useState("All");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");
  const [selectedGallery, setSelectedGallery] = useState<{
  photos: string[];
  index: number;
  title: string;
} | null>(null);
  
  useEffect(() => {
    setMounted(true);
  }, []);
useEffect(() => {
  const cookieChoice = localStorage.getItem("smartserveuk_cookie_choice");

  if (!cookieChoice) {
    setShowCookieBanner(true);
  }
}, []);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUserEmail("");
        setUserRole("");
        return;
      }

      setUserEmail(user.email ?? "");
      const roleLabel = await getUserRoleLabel(user.uid);
      setUserRole(roleLabel);
    });

    return () => unsub();
  }, []);

  const activeLanguage: AppLanguage = mounted ? lang : "en";
  const copy = pageCopy[activeLanguage] ?? pageCopy.en;
  const isRTL = activeLanguage === "ar";

  const filteredRestaurants = useMemo(() => {
    const locationTerm = locationSearch.trim().toLowerCase();
    const mappedAreas =
  LOCATION_MAP[locationTerm] ||
  Object.entries(LOCATION_MAP)
    .filter(([key]) => locationTerm.includes(key))
    .flatMap(([, areas]) => areas);
    const term = search.trim().toLowerCase();

    return featuredRestaurants.filter((restaurant) => {
      const matchesSearch =
        !term ||
        restaurant.name.toLowerCase().includes(term) ||
        restaurant.cuisine.toLowerCase().includes(term) ||
        restaurant.area.toLowerCase().includes(term) ||
        restaurant.tags.some((tag) => tag.toLowerCase().includes(term)) ||
        restaurant.popularItems.some((item) => item.toLowerCase().includes(term));

      const matchesArea =
        selectedArea === "All" || restaurant.area === selectedArea;

      const matchesCuisine =
        selectedCuisine === "All" || restaurant.cuisine === selectedCuisine;

      const matchesLocation =
  !locationTerm ||
  restaurant.area.toLowerCase().includes(locationTerm) ||
  mappedAreas.includes(restaurant.area);

return matchesSearch && matchesArea && matchesCuisine && matchesLocation;
    });
  }, [search, selectedArea, selectedCuisine]);
  

  const topDishesNearYou = useMemo(() => {
  if (locationSearch.trim()) {
    const locationTerm = locationSearch.trim().toLowerCase();

    const mappedAreas =
      LOCATION_MAP[locationTerm] ||
      Object.entries(LOCATION_MAP)
        .filter(([key]) => locationTerm.includes(key))
        .flatMap(([, areas]) => areas);

    if (mappedAreas.length > 0) {
      return mappedAreas
        .flatMap((area) => getTopDishesForArea(area))
        .slice(0, 8);
    }
  }

  return getTopDishesForArea(selectedArea);
}, [locationSearch, selectedArea]);
const clearFilters = () => {
  setSearch("");
  setLocationSearch("");
  setSelectedArea("All");
  setSelectedCuisine("All");
};

  const heroData = HERO_DATA[activeLanguage] ?? HERO_DATA.en;
  const founderOffer = FOUNDER_OFFER[activeLanguage] ?? FOUNDER_OFFER.en;

  const joinSectionRaw = JOIN_SECTION[activeLanguage] ?? JOIN_SECTION.en;
  const joinSection = {
    ...JOIN_SECTION.en,
    ...joinSectionRaw,
    button: joinSectionRaw.button ?? JOIN_SECTION.en.button,
    features: joinSectionRaw.features ?? JOIN_SECTION.en.features,
  };

  const orderSectionRaw = ORDER_SECTION[activeLanguage] ?? ORDER_SECTION.en;
  const orderSection = {
    ...ORDER_SECTION.en,
    ...orderSectionRaw,
    features: orderSectionRaw.features ?? ORDER_SECTION.en.features,
    buttons: orderSectionRaw.buttons ?? ORDER_SECTION.en.buttons,
  };

  const checkoutSectionRaw =
    CHECKOUT_SECTION[activeLanguage] ?? CHECKOUT_SECTION.en;
  const checkoutSection = {
    ...CHECKOUT_SECTION.en,
    ...checkoutSectionRaw,
    methods: checkoutSectionRaw.methods ?? CHECKOUT_SECTION.en.methods,
    button: checkoutSectionRaw.button ?? CHECKOUT_SECTION.en.button,
  };

  const promotionSectionRaw =
    PROMOTION_SECTION[activeLanguage] ?? PROMOTION_SECTION.en;
  const promotionSection = {
    ...PROMOTION_SECTION.en,
    ...promotionSectionRaw,
    features: promotionSectionRaw.features ?? PROMOTION_SECTION.en.features,
    button: promotionSectionRaw.button ?? PROMOTION_SECTION.en.button,
  };

  const futureSection = FUTURE_SECTION[activeLanguage] ?? FUTURE_SECTION.en;

  const finalCtaRaw = FINAL_CTA[activeLanguage] ?? FINAL_CTA.en;
  const finalCta = {
    ...FINAL_CTA.en,
    ...finalCtaRaw,
    buttons: finalCtaRaw.buttons ?? FINAL_CTA.en.buttons,
  };

  return (
    <main
      dir={isRTL ? "rtl" : "ltr"}
      className="min-h-screen bg-linear-to-b from-sky-50 via-white to-white text-neutral-900"
    >
      <section className="border-b border-sky-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8 md:flex-row md:items-center md:justify-between">
          <Link
            href="/"
            className="text-lg font-extrabold tracking-tight text-sky-700"
          >
            SmartServeUK
          </Link>

          <div className="flex flex-col gap-3 md:items-end">
            <div className="flex items-center gap-3">
              <LanguageSwitcher lang={activeLanguage} onChangeLang={setLang} />
            </div>

            {userEmail ? (
              <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-sky-100 bg-sky-50 px-3 py-2 text-sm shadow-sm">
                <span className="rounded-full bg-sky-600 px-2.5 py-1 text-xs font-bold text-white">
                  {userRole || "User"}
                </span>

                <span className="font-medium text-neutral-700">
                  {getShortEmail(userEmail)}
                </span>

                <LogoutButton
                  label="Sign Out"
                  className="rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                />
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/login"
                  className="rounded-xl border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-50"
                >
                  Login
                </Link>

                <Link
                  href="/create-account"
                  className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <HeroSection
        {...heroData}
        lang={activeLanguage}
        image="/hubs/westfield/hero-westfield.jpg"
      />
      <FreeAccessBlock />
      <HowItWorksBlock />
      <TrustDataBlock />
      <AudienceBlock />
      <ImpactBlock />
      <PlatformReadinessBlock />
      
<section className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
  <div className="rounded-3xl border border-sky-100 bg-white p-4 shadow-lg">
    <div className="flex flex-col gap-3 md:flex-row">
      <input
        type="text"
        value={search}
        onChange={(e) => {
  setSearch(e.target.value);

  const section = document.getElementById("featured-restaurants");
  if (section) {
    section.scrollIntoView({ behavior: "smooth" });
  }
}}
        placeholder="Search restaurants, food, hubs or cuisine..."
        className="flex-1 rounded-2xl border border-neutral-300 px-5 py-4 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
      />

      <a
        href="#featured-restaurants"
        className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-6 py-4 text-sm font-bold text-white hover:bg-sky-700"
      >
        Search
      </a>

      <Link
        href="/how-it-works"
        className="inline-flex items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 px-6 py-4 text-sm font-bold text-sky-700 hover:bg-sky-100"
      >
        How It Works
      </Link>
    </div>
  </div>
</section>
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <div className="text-base font-semibold text-amber-900">
            {founderOffer.text}
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            {founderOffer.tiers.map((tier: string) => (
              <span
                key={tier}
                className="rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-800"
              >
                {tier}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-sky-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h2 className="text-3xl font-bold tracking-tight">
              Expanding SmartServeUK
            </h2>
            <p className="mt-2 max-w-3xl text-neutral-600">
              SmartServeUK is evolving into a connected platform supporting food,
              transport, and fresh produce across London.
            </p>
          </div>

          <div className="grid items-stretch gap-6 md:grid-cols-2">
            <Link href="/orders" className="block">
              <div className="group h-full cursor-pointer rounded-2xl border border-sky-200 bg-sky-50 p-6 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md">
                <div className="text-3xl transition duration-300 group-hover:scale-110">
                  🍽️
                </div>
                <div className="mt-3 text-lg font-bold text-neutral-900">
                  Food & Catering
                </div>
                <div className="mt-2 text-sm text-neutral-700">
                  Discover restaurants, explore menus, and plan catering events
                  with SmartServeUK.
                </div>
              </div>
            </Link>

            <Link href="/blackcab" className="block">
              <div className="group h-full cursor-pointer rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_10px_25px_rgba(255,200,0,0.25)]">
                <div className="text-3xl transition duration-300 group-hover:scale-110">
                  🚕
                </div>

                <div className="mt-3 text-lg font-bold text-yellow-400 transition duration-300 group-hover:text-yellow-300">
                  Black Cab Booking (Coming Soon)
                </div>

                <div className="mt-2 text-sm text-yellow-300">
                  Pre-book licensed London black cabs with transparent pricing.
                  Powered by bcabs.london.
                </div>
              </div>
            </Link>
<Link href="/suppliers" className="block">
  <div className="group h-full cursor-pointer rounded-2xl border border-emerald-300 bg-emerald-50 p-6 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md">
    <div className="text-3xl">🏪</div>
    <div className="mt-3 text-lg font-bold text-emerald-900">
      Suppliers
    </div>
    <div className="mt-2 text-sm text-emerald-800">
      Browse cash & carry, wholesalers, grocery suppliers, meat suppliers, and restaurant supply partners.
    </div>
  </div>
</Link>

<Link href="/riders" className="block">
  <div className="group h-full cursor-pointer rounded-2xl border border-orange-300 bg-orange-50 p-6 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md">
    <div className="text-3xl">🛵</div>
    <div className="mt-3 text-lg font-bold text-orange-900">
      Riders
    </div>
    <div className="mt-2 text-sm text-orange-800">
      Connect restaurants with local delivery riders.
    </div>
  </div>
</Link>
            <Link href="/eggies" className="block">
              <div className="group h-full cursor-pointer rounded-2xl border border-green-300 bg-green-100 p-6 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md">
                <div className="text-3xl">🥚</div>
                <div className="mt-3 text-lg font-bold text-green-800">
                  Eggies.com (Coming Soon)
                </div>
                <div className="mt-2 text-sm text-green-700">
                  Fresh produce and farm goods from trusted suppliers,
                  supporting households, restaurants, and catering buyers.
                </div>
              </div>
            </Link>

            <Link href="/florist" className="block">
              <div className="group h-full cursor-pointer rounded-2xl border border-pink-300 bg-pink-100 p-6 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md">
                <div className="text-3xl transition duration-300 group-hover:scale-110">
                  🌸
                </div>
                <div className="mt-3 text-lg font-bold text-neutral-900">
                  Flowers & Gifts (Coming Soon)
                </div>

                <div className="mt-2 text-sm text-neutral-700">
                  Order flowers, bouquets, and event decorations for weddings,
                  parties, and special occasions.
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section
  id="featured-restaurants"
  className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
>

        <div className="flex flex-col gap-8">
  {hubs.map((hub, index) => {
  const hubName = hub.name[activeLanguage] ?? hub.name.en;

  return (
    <div key={`${hub.href}-${index}`} className="space-y-4">
      <HubCard
  href={hub.href}
  name={hubName}
  description={hub.description[activeLanguage] ?? hub.description.en}
  image={hub.image}
    lang={activeLanguage}
/>

      {hub.gallery && hub.gallery.length > 0 ? (
  <div className="grid grid-cols-2 gap-3 rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
    {hub.gallery.map((photo, photoIndex) => (
      <button
        key={`${photo}-${photoIndex}`}
        type="button"
        onClick={() =>
          setSelectedGallery({
            photos: hub.gallery ?? [],
            index: photoIndex,
            title: hub.name[activeLanguage] ?? hub.name.en,
          })
        }
        className="group aspect-4/3 overflow-hidden rounded-xl bg-neutral-100"
      >
        <img
          src={photo}
          alt={`${hub.name[activeLanguage] ?? hub.name.en} photo ${photoIndex + 1}`}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      </button>
    ))}
  </div>
) : (
  <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center text-sm font-semibold text-neutral-500">
    Photos coming soon
  </div>
)}
    </div>
  );
})}
</div>
      </section>

      <section className="border-y border-sky-100 bg-sky-50/60">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h2 className="text-3xl font-bold tracking-tight">{copy.foodsTitle}</h2>
            <p className="mt-2 max-w-3xl text-neutral-600">{copy.foodsSubtitle}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            {popularFoodAndDrinks.map((item) => (
              <span
                key={item}
                className="rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-medium text-sky-800 shadow-sm"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold tracking-tight">
            {copy.featuredTitle}
          </h2>
          <p className="mt-2 max-w-3xl text-neutral-600">
            {copy.featuredSubtitle}
          </p>
        </div>

        <div className="mb-8 rounded-2xl border border-sky-100 bg-white p-4 shadow-sm">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-700">
                {copy.searchLabel}
              </label>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={copy.searchPlaceholder}
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              />
              <div>
  <label className="mb-2 block text-sm font-semibold text-neutral-700">
  {copy.locationLabel ?? "Location"}
</label>
  <input
    type="text"
    value={locationSearch}
    onChange={(e) => setLocationSearch(e.target.value)}
    placeholder="E7, Stratford, Brick Lane..."
    className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
  />
</div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-700">
                {copy.areaLabel}
              </label>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              >
                {areaOptions.map((area) => (
                  <option key={area} value={area}>
                    {area === "All" ? copy.all : area}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-700">
                {copy.cuisineLabel}
              </label>
              <select
                value={selectedCuisine}
                onChange={(e) => setSelectedCuisine(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              >
                {cuisineOptions.map((cuisine) => (
                  <option key={cuisine} value={cuisine}>
                    {cuisine === "All" ? copy.all : cuisine}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-neutral-600">
              {copy.showing}{" "}
              <span className="font-bold text-sky-700">
                {filteredRestaurants.length}
              </span>{" "}
              {filteredRestaurants.length === 1
                ? copy.restaurant
                : copy.restaurants}
            </div>

            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
            >
              {copy.clearFilters}
            </button>
          </div>
        </div>
<div className="mb-8 rounded-2xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
  <div>
    <h3 className="text-lg font-bold text-emerald-900">
      Top Dishes Near You
    </h3>
    <p className="text-sm text-emerald-700">
      Popular dishes based on your area or postcode
    </p>
  </div>

  <div className="mt-4 flex flex-wrap gap-3">
    {topDishesNearYou.length > 0 ? (
      topDishesNearYou.map((dish) => (
        <button
          key={dish}
          type="button"
          onClick={() => setSearch(dish)}
          className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 transition"
        >
          {dish}
        </button>
      ))
    ) : (
      <span className="text-sm text-emerald-700">
        Enter a postcode or select an area to see popular dishes
      </span>
    )}
  </div>
</div>
        {filteredRestaurants.length > 0 ? (
          <div className="flex flex-col gap-8">
            {filteredRestaurants.map((restaurant) => (
              <RestaurantCard key={restaurant.href} {...restaurant} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center text-neutral-600">
            {copy.noResults}
          </div>
        )}
      </section>

      <section className="border-t border-sky-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h2 className="text-3xl font-bold tracking-tight">
              {joinSection.title}
            </h2>
            <p className="mt-2 max-w-3xl text-neutral-600">
              {joinSection.description}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {joinSection.features.map((feature) => (
              <div
                key={feature.title}
                className={`rounded-2xl border p-5 shadow-sm ${feature.style}`}
              >
                <div className="text-3xl">{feature.icon}</div>

                <div className="mt-3 text-lg font-bold text-neutral-900">
                  {feature.title}
                </div>

                <p className="mt-2 text-sm text-neutral-600">{feature.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <Link
              href={joinSection.button.href}
              className="inline-flex rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              {joinSection.button.label}
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-sky-100 bg-sky-50/60">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h2 className="text-3xl font-bold tracking-tight">
              {orderSection.title}
            </h2>
            <p className="mt-2 max-w-3xl text-neutral-600">
              {orderSection.subtitle}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {orderSection.features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm"
              >
                <div className="text-3xl">{feature.icon}</div>
                <div className="mt-3 text-lg font-bold">{feature.title}</div>
                <div className="mt-2 text-sm text-neutral-600">
                  {feature.desc}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <Link
              href="https://bcabs.london"
              target="_blank"
              className="block rounded-2xl border border-sky-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="text-3xl">🚖</div>
              <div className="mt-3 text-lg font-bold text-neutral-900">
                Black Cab Booking (Coming Soon)
              </div>
              <div className="mt-2 text-sm text-neutral-600">
                Pre-book licensed London black cabs with trusted drivers.
                Powered by bcabs.london.
              </div>
            </Link>

            <Link
              href="https://eggies.com"
              target="_blank"
              className="block rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="text-3xl">🥚</div>
              <div className="mt-3 text-lg font-bold text-neutral-900">
                Eggies – Fresh Produce (Coming Soon)
              </div>
              <div className="mt-2 text-sm text-neutral-600">
                Fresh farm produce including eggs and local goods, supporting
                households, restaurants, and caterers.
              </div>
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {orderSection.buttons.map((button, index) => (
              <Link
                key={`${button.href}-${button.label}-${index}`}
                href={button.href}
                className="inline-flex rounded-xl bg-sky-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-sky-700"
              >
                {button.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-sky-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold tracking-tight">
                {checkoutSection.title}
              </h2>
              <p className="mt-3 text-neutral-600">
                {checkoutSection.description}
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                {checkoutSection.methods.map((method) => (
                  <span
                    key={method}
                    className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800"
                  >
                    {method}
                  </span>
                ))}
              </div>

              <div className="mt-6">
                <Link
                  href={checkoutSection.button.href}
                  className="inline-flex rounded-xl bg-neutral-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-neutral-800"
                >
                  {checkoutSection.button.label}
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold tracking-tight">
                {promotionSection.title}
              </h2>
              <p className="mt-3 text-neutral-600">
                {promotionSection.description}
              </p>

              <div className="mt-4 space-y-3">
                {promotionSection.features.map((feature) => (
                  <div
                    key={feature.title}
                    className="rounded-xl border border-neutral-200 bg-neutral-50 p-4"
                  >
                    <div className="font-semibold text-neutral-900">
                      {feature.title}
                    </div>
                    <div className="mt-1 text-sm text-neutral-600">
                      {feature.desc}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 text-sm font-semibold text-indigo-700">
                {promotionSection.priceNote}
              </div>

              <div className="mt-6">
                <Link
                  href={promotionSection.button.href}
                  className="inline-flex rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
                >
                  {promotionSection.button.label}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-sky-100 bg-sky-50/50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-sky-100 bg-white p-8 shadow-sm">
            <h2 className="text-3xl font-bold tracking-tight">
              {futureSection.title}
            </h2>
            <p className="mt-3 max-w-4xl text-neutral-600">
              {futureSection.description}
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-sky-100 bg-linear-to-r from-sky-700 to-blue-700 text-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight">{copy.ctaTitle}</h2>
          <p className="mt-3 max-w-3xl text-sky-50">{copy.ctaSubtitle}</p>

          <div className="mt-6">
            <Link
              href="/catering"
              className="inline-flex rounded-xl bg-white px-6 py-3 text-sm font-bold text-sky-700 transition hover:bg-sky-50"
            >
              {copy.viewCatering}
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-neutral-950 text-white">
  <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
    <div className="grid gap-10 lg:grid-cols-2">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          {finalCta.title}
        </h2>
        <p className="mt-3 text-neutral-300">{finalCta.description}</p>

        <div className="mt-8 flex flex-wrap gap-3">
          {finalCta.buttons.map((button, index) => (
            <Link
              key={`${button.href}-${button.label}-${index}`}
              href={button.href}
              className="inline-flex rounded-xl bg-white px-6 py-3 text-sm font-bold text-neutral-900 transition hover:bg-neutral-100"
            >
              {button.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-xl font-bold text-white">Contact SmartServeUK</h3>

        <div className="mt-4 space-y-2 text-sm leading-6 text-neutral-300">
          <p>
            <span className="font-semibold text-white">Email:</span>{" "}
            <a
              href="mailto:mahtab@mbncon.com"
              className="text-sky-300 hover:text-sky-200"
            >
              mahtab@mbncon.com
            </a>
          </p>

          <p>
            <span className="font-semibold text-white">Address:</span> 85 Halley
            Road, London E7 8DS, United Kingdom
          </p>

          <p>
            <span className="font-semibold text-white">Phone / WhatsApp:</span>{" "}
            <a href="tel:+447454586658" className="text-sky-300 hover:text-sky-200">
              +44 (0)7454 586658
            </a>
          </p>
        </div>
      </div>
    </div>

    <div className="mt-10 grid gap-6 border-t border-white/10 pt-8 lg:grid-cols-2">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-lg font-bold text-white">Photo Disclaimer</h3>
        <p className="mt-3 text-sm leading-6 text-neutral-300">
          All photos used on this platform have been taken by SmartServeUK from
          public places. They are used to showcase and promote London’s food hubs
          to tourists, local customers, restaurants, traders, and communities,
          with the aim of supporting the London economy and local employment.
        </p>
        <p className="mt-3 text-sm leading-6 text-neutral-300">
          If you are the owner of a business or organisation featured in any
          image and are not happy with its use, or if you would like to suggest
          an improvement, please contact us. We will review your request and take
          appropriate action.
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-lg font-bold text-white">Data Protection & Security</h3>
        <p className="mt-3 text-sm leading-6 text-neutral-300">
          SmartServeUK treats customer, restaurant, supplier, rider, black cab,
          and partner information as confidential. Personal information submitted
          through the platform will not be shared with any third party unless it
          is necessary to provide the requested service, required by law, or
          permitted under UK GDPR and the Data Protection Act 2018.
        </p>
        <p className="mt-3 text-sm leading-6 text-neutral-300">
          For restaurant signups, SmartServeUK may use mobile OTP verification to
          help protect account access and reduce misuse of the platform.
        </p>
      </div>
    </div>

    <div className="mt-8 border-t border-white/10 pt-6 text-sm text-neutral-400">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
  <span>
    © {new Date().getFullYear()} SmartServeUK.com — All rights reserved.
  </span>

  <div className="flex flex-wrap gap-4">
    <Link href="/cookie-policy" className="hover:text-white">
      Cookie Policy
    </Link>
    <Link href="/privacy-policy" className="hover:text-white">
      Privacy Policy
    </Link>
    <Link href="/terms" className="hover:text-white">
      Terms
    </Link>
  </div>
</div>
    </div>
  </div>
</section>
            {selectedGallery ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4">
          <button
            type="button"
            onClick={() => setSelectedGallery(null)}
            className="absolute right-5 top-5 rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-white hover:bg-white/25"
          >
            Close ✕
          </button>

          <button
            type="button"
            onClick={() =>
              setSelectedGallery((current) =>
                current
                  ? {
                      ...current,
                      index:
                        current.index === 0
                          ? current.photos.length - 1
                          : current.index - 1,
                    }
                  : current
              )
            }
            className="absolute left-5 rounded-full bg-white/15 px-4 py-3 text-2xl font-bold text-white hover:bg-white/25"
          >
            ‹
          </button>

          <div className="max-w-5xl text-center">
            <img
              src={selectedGallery.photos[selectedGallery.index]}
              alt={`${selectedGallery.title} photo ${
                selectedGallery.index + 1
              }`}
              className="max-h-[82vh] max-w-full rounded-3xl object-contain shadow-2xl"
            />

            <div className="mt-4 text-sm font-semibold text-white">
              {selectedGallery.title} • {selectedGallery.index + 1} /{" "}
              {selectedGallery.photos.length}
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setSelectedGallery((current) =>
                current
                  ? {
                      ...current,
                      index:
                        current.index === current.photos.length - 1
                          ? 0
                          : current.index + 1,
                    }
                  : current
              )
            }
            className="absolute right-5 rounded-full bg-white/15 px-4 py-3 text-2xl font-bold text-white hover:bg-white/25"
          >
            ›
          </button>
        </div>
      ) : null}
      {showCookieBanner ? (
  <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 bg-white p-4 shadow-2xl">
    <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm leading-6 text-neutral-700">
        <span className="font-semibold text-neutral-900">We use cookies.</span>{" "}
        We use essential cookies to run this website and optional cookies to improve your experience.{" "}
        <Link
          href="/cookie-policy"
          className="font-semibold text-sky-700 underline hover:text-sky-800"
        >
          Read our Cookie Policy
        </Link>
      </p>

      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => {
            window.localStorage.setItem(
              "smartserveuk_cookie_choice",
              "rejected"
            );
            setShowCookieBanner(false);
          }}
          className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
        >
          Reject
        </button>

        <button
          type="button"
          onClick={() => {
            window.localStorage.setItem(
              "smartserveuk_cookie_choice",
              "accepted"
            );
            setShowCookieBanner(false);
          }}
          className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
        >
          Accept
        </button>
      </div>
    </div>
  </div>
) : null}
<FinalCTA />
    </main>
  );
}