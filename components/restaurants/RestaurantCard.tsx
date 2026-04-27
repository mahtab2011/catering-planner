import Link from "next/link";
import type { AppLanguage } from "@/lib/i18n";

type RestaurantCardProps = {
  name: string;
  cuisine: string;
  area: string;
  tags?: string[];
  popularItems?: string[];
  href: string;
  shortDescription?: string;
  imageUrl?: string;
  lang?: AppLanguage;
};

const cardCopy: Partial<
  Record<
    AppLanguage,
    {
      fallbackDescription: string;
      highlights: string;
      viewProfile: string;
    }
  >
> = {
  en: {
    fallbackDescription:
      "Restaurant profile available on SmartServeUK. Open the page to see menu, service options, and more details.",
    highlights: "Highlights",
    viewProfile: "View Profile & Menu →",
  },
  bn: {
    fallbackDescription:
      "এই রেস্টুরেন্টের প্রোফাইল SmartServeUK-এ রয়েছে। মেনু, সেবার ধরন এবং আরও বিস্তারিত দেখতে পেজটি খুলুন।",
    highlights: "বিশেষ আকর্ষণ",
    viewProfile: "প্রোফাইল ও মেনু দেখুন →",
  },
  it: {
    fallbackDescription:
      "Profilo del ristorante disponibile su SmartServeUK. Apri la pagina per vedere menu, opzioni di servizio e altri dettagli.",
    highlights: "Punti salienti",
    viewProfile: "Vedi profilo e menu →",
  },
  fr: {
    fallbackDescription:
      "Profil du restaurant disponible sur SmartServeUK. Ouvrez la page pour voir le menu, les options de service et plus de détails.",
    highlights: "Points forts",
    viewProfile: "Voir le profil et le menu →",
  },
  de: {
    fallbackDescription:
      "Restaurantprofil auf SmartServeUK verfügbar. Öffnen Sie die Seite, um Speisekarte, Serviceoptionen und weitere Details zu sehen.",
    highlights: "Highlights",
    viewProfile: "Profil und Menü ansehen →",
  },
  es: {
    fallbackDescription:
      "Perfil del restaurante disponible en SmartServeUK. Abre la página para ver el menú, las opciones de servicio y más detalles.",
    highlights: "Destacados",
    viewProfile: "Ver perfil y menú →",
  },
  ar: {
    fallbackDescription:
      "ملف المطعم متاح على SmartServeUK. افتح الصفحة لرؤية القائمة وخيارات الخدمة والمزيد من التفاصيل.",
    highlights: "أبرز العناصر",
    viewProfile: "عرض الملف والقائمة ←",
  },
  zh: {
    fallbackDescription:
      "SmartServeUK 上提供该餐厅资料。打开页面可查看菜单、服务选项和更多详情。",
    highlights: "推荐亮点",
    viewProfile: "查看资料与菜单 →",
  },
};

const tagTranslations: Partial<Record<AppLanguage, Record<string, string>>> = {
  en: {
    "Dine-in": "Dine-in",
    Takeaway: "Takeaway",
    Delivery: "Delivery",
    Collection: "Collection",
    Halal: "Halal",
    "HMC Approved": "HMC Approved",
    Premium: "Premium",
    "Live Listing": "Live Listing",
    Pending: "Pending",
    Catering: "Catering",
    Grill: "Grill",
    Coffee: "Coffee",
    "Food Court": "Food Court",
    Busy: "Busy",
    Tourist: "Tourist",
    Value: "Value",
  },
  bn: {
    "Dine-in": "বসে খাওয়া",
    Takeaway: "টেকঅ্যাওয়ে",
    Delivery: "ডেলিভারি",
    Collection: "সংগ্রহ",
    Halal: "হালাল",
    "HMC Approved": "HMC অনুমোদিত",
    Premium: "প্রিমিয়াম",
    "Live Listing": "লাইভ লিস্টিং",
    Pending: "অপেক্ষমাণ",
    Catering: "ক্যাটারিং",
    Grill: "গ্রিল",
    Coffee: "কফি",
    "Food Court": "ফুড কোর্ট",
    Busy: "ব্যস্ত",
    Tourist: "পর্যটকপ্রিয়",
    Value: "সাশ্রয়ী",
  },
  it: {
    "Dine-in": "Consumazione sul posto",
    Takeaway: "Asporto",
    Delivery: "Consegna",
    Collection: "Ritiro",
    Halal: "Halal",
    "HMC Approved": "Approvato HMC",
    Premium: "Premium",
    "Live Listing": "Scheda attiva",
    Pending: "In attesa",
    Catering: "Catering",
    Grill: "Griglia",
    Coffee: "Caffè",
    "Food Court": "Area ristoro",
    Busy: "Molto frequentato",
    Tourist: "Turistico",
    Value: "Conveniente",
  },
  fr: {
    "Dine-in": "Sur place",
    Takeaway: "À emporter",
    Delivery: "Livraison",
    Collection: "Retrait",
    Halal: "Halal",
    "HMC Approved": "Approuvé HMC",
    Premium: "Premium",
    "Live Listing": "Annonce en ligne",
    Pending: "En attente",
    Catering: "Traiteur",
    Grill: "Grillades",
    Coffee: "Café",
    "Food Court": "Aire de restauration",
    Busy: "Très fréquenté",
    Tourist: "Touristique",
    Value: "Bon rapport qualité-prix",
  },
  de: {
    "Dine-in": "Vor Ort",
    Takeaway: "Zum Mitnehmen",
    Delivery: "Lieferung",
    Collection: "Abholung",
    Halal: "Halal",
    "HMC Approved": "HMC-zertifiziert",
    Premium: "Premium",
    "Live Listing": "Live-Eintrag",
    Pending: "Ausstehend",
    Catering: "Catering",
    Grill: "Grill",
    Coffee: "Kaffee",
    "Food Court": "Food Court",
    Busy: "Gut besucht",
    Tourist: "Touristisch",
    Value: "Preiswert",
  },
  es: {
    "Dine-in": "Comer en el local",
    Takeaway: "Para llevar",
    Delivery: "Entrega",
    Collection: "Recogida",
    Halal: "Halal",
    "HMC Approved": "Aprobado por HMC",
    Premium: "Premium",
    "Live Listing": "Listado activo",
    Pending: "Pendiente",
    Catering: "Catering",
    Grill: "Parrilla",
    Coffee: "Café",
    "Food Court": "Zona de comidas",
    Busy: "Muy concurrido",
    Tourist: "Turístico",
    Value: "Buena relación calidad-precio",
  },
  ar: {
    "Dine-in": "الأكل داخل المطعم",
    Takeaway: "سفري",
    Delivery: "توصيل",
    Collection: "استلام",
    Halal: "حلال",
    "HMC Approved": "معتمد من HMC",
    Premium: "بريميوم",
    "Live Listing": "إدراج مباشر",
    Pending: "بانتظار",
    Catering: "خدمات تموين",
    Grill: "مشويات",
    Coffee: "قهوة",
    "Food Court": "ساحة طعام",
    Busy: "مزدحم",
    Tourist: "سياحي",
    Value: "قيمة جيدة",
  },
  zh: {
    "Dine-in": "堂食",
    Takeaway: "外卖",
    Delivery: "配送",
    Collection: "自取",
    Halal: "清真",
    "HMC Approved": "HMC 认证",
    Premium: "高级",
    "Live Listing": "已上线",
    Pending: "待审核",
    Catering: "餐饮服务",
    Grill: "烧烤",
    Coffee: "咖啡",
    "Food Court": "美食广场",
    Busy: "繁忙",
    Tourist: "游客热门",
    Value: "高性价比",
  },
};

function safeText(value?: string) {
  return (value || "").trim();
}

function translateTag(tag: string, lang: AppLanguage) {
  return tagTranslations[lang]?.[tag] || tagTranslations.en?.[tag] || tag;
}

export default function RestaurantCard({
  name,
  cuisine,
  area,
  tags = [],
  popularItems = [],
  href,
  shortDescription = "",
  imageUrl = "",
  lang = "en",
}: RestaurantCardProps) {
  const safeName = safeText(name) || "Restaurant";
  const safeCuisine = safeText(cuisine) || "Cuisine";
  const safeArea = safeText(area) || "Area";
  const safeDescription = safeText(shortDescription);

  const safeTags = tags.map((tag) => safeText(tag)).filter(Boolean).slice(0, 5);

  const safePopularItems = popularItems
    .map((item) => safeText(item))
    .filter(Boolean)
    .slice(0, 4);

  const safeImageUrl = safeText(imageUrl);
  const copy = cardCopy[lang] ?? cardCopy.en!;
  const isRtl = lang === "ar";

  return (
    <Link href={href} className="group block h-full">
      <div
        dir={isRtl ? "rtl" : "ltr"}
        className="flex h-full min-h-117.5 flex-col overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
      >
        <div className="relative h-44 w-full overflow-hidden bg-amber-50">
          {safeImageUrl ? (
            <img
              src={safeImageUrl}
              alt={safeName}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-end bg-linear-to-br from-amber-200 via-orange-100 to-rose-100 p-4">
              <div className="rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-amber-900 shadow-sm">
                {safeCuisine}
              </div>
            </div>
          )}

          {safeImageUrl ? (
            <div
              className={`absolute top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-amber-900 shadow-sm ${
                isRtl ? "right-3" : "left-3"
              }`}
            >
              {safeCuisine}
            </div>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div>
            <h3 className="line-clamp-2 text-xl font-semibold text-neutral-900">
              {safeName}
            </h3>

            <p className="mt-1 text-sm text-neutral-600">{safeArea}</p>

            <p className="mt-3 min-h-18 line-clamp-3 text-sm leading-6 text-neutral-700">
              {safeDescription || copy.fallbackDescription}
            </p>
          </div>

          {safeTags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {safeTags.map((tag, index) => (
                <span
                  key={`${tag}-${index}`}
                  className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900"
                >
                  {translateTag(tag, lang)}
                </span>
              ))}
            </div>
          )}

          {safePopularItems.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-medium text-neutral-900">
                {copy.highlights}
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                {safePopularItems.map((item, index) => (
                  <span
                    key={`${item}-${index}`}
                    className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-auto pt-5">
            <div className="w-full rounded-xl bg-amber-600 px-4 py-3 text-center text-sm font-semibold text-white transition-colors duration-200 group-hover:bg-amber-700">
              {copy.viewProfile}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}