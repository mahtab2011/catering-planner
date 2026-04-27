export type AppLanguage =
  | "en"
  | "bn"
  | "it"
  | "fr"
  | "de"
  | "es"
  | "ar"
  | "zh"
  | "ja"
  | "th";
export const LANGUAGE_LABELS: Record<AppLanguage, string> = {
  en: "English",
  bn: "বাংলা",
  it: "Italiano",
  fr: "Français",
  de: "Deutsch",
  es: "Español",
  ar: "العربية",
  zh: "中文",
  ja: "日本語",
th: "ไทย",
};

export const RTL_LANGS: AppLanguage[] = ["ar"];

export function isRTL(lang: AppLanguage) {
  return RTL_LANGS.includes(lang);
}

export const pageCopy: Record<
  AppLanguage,
  {
    welcome: string;
    subtitle: string;
    exploreHubs: string;
    browseRestaurants: string;
    searchPlaceholder: string;
  }
> = {
  en: {
    welcome: "Discover Great Food Across London’s Food Hubs",
    subtitle:
      "Browse restaurants, stalls, vans, and street food traders by area.",
    exploreHubs: "Explore Hubs",
    browseRestaurants: "Browse Restaurants",
    searchPlaceholder: "Search restaurants or cuisines",
  },

  bn: {
    welcome: "লন্ডনের ফুড হাব জুড়ে সেরা খাবার আবিষ্কার করুন",
    subtitle:
      "এলাকার ভিত্তিতে রেস্টুরেন্ট, স্টল, ভ্যান এবং স্ট্রিট ফুড খুঁজুন।",
    exploreHubs: "হাব দেখুন",
    browseRestaurants: "রেস্টুরেন্ট দেখুন",
    searchPlaceholder: "রেস্টুরেন্ট বা খাবার খুঁজুন",
  },

  it: {
    welcome: "Scopri ottimo cibo nei food hub di Londra",
    subtitle:
      "Esplora ristoranti, bancarelle e street food per area.",
    exploreHubs: "Esplora Hub",
    browseRestaurants: "Sfoglia Ristoranti",
    searchPlaceholder: "Cerca ristoranti o cucine",
  },

  fr: {
    welcome: "Découvrez la bonne cuisine dans les food hubs de Londres",
    subtitle:
      "Parcourez restaurants, stands et street food par zone.",
    exploreHubs: "Explorer les hubs",
    browseRestaurants: "Voir les restaurants",
    searchPlaceholder: "Rechercher restaurants ou cuisines",
  },

  de: {
    welcome: "Entdecken Sie großartiges Essen in Londons Food Hubs",
    subtitle:
      "Finden Sie Restaurants, Stände und Street Food nach Gegend.",
    exploreHubs: "Hubs erkunden",
    browseRestaurants: "Restaurants ansehen",
    searchPlaceholder: "Restaurants oder Küche suchen",
  },

  es: {
    welcome: "Descubre buena comida en los food hubs de Londres",
    subtitle:
      "Explora restaurantes, puestos y comida callejera por zona.",
    exploreHubs: "Explorar hubs",
    browseRestaurants: "Ver restaurantes",
    searchPlaceholder: "Buscar restaurantes o cocina",
  },

  ar: {
    welcome: "اكتشف أفضل الطعام في مراكز الطعام في لندن",
    subtitle:
      "تصفح المطاعم والأكشاك وطعام الشارع حسب المنطقة.",
    exploreHubs: "استكشاف المراكز",
    browseRestaurants: "عرض المطاعم",
    searchPlaceholder: "ابحث عن مطاعم أو أطعمة",
  },

  zh: {
    welcome: "探索伦敦美食中心的美味佳肴",
    subtitle:
      "按区域浏览餐厅、小吃摊和街头美食。",
    exploreHubs: "探索美食区",
    browseRestaurants: "浏览餐厅",
    searchPlaceholder: "搜索餐厅或菜系",
  },
  ja: {
    welcome: "ロンドンのフードハブで素晴らしい料理を発見",
    subtitle:
      "エリア別にレストラン、屋台、フードバン、ストリートフードのお店を探せます。",
    exploreHubs: "ハブを見る",
    browseRestaurants: "レストランを見る",
    searchPlaceholder: "レストランや料理を検索",
  },

  th: {
    welcome: "ค้นพบอาหารยอดเยี่ยมในศูนย์อาหารลอนดอน",
    subtitle:
      "ค้นหาร้านอาหาร แผงขายอาหาร รถขายอาหาร และร้านสตรีทฟู้ดตามพื้นที่",
    exploreHubs: "ดูฮับอาหาร",
    browseRestaurants: "ดูร้านอาหาร",
    searchPlaceholder: "ค้นหาร้านอาหารหรือประเภทอาหาร",
  },
};
