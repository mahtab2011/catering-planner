"use client";

import { useEffect, useState, use } from "react";

type LangKey = "en" | "it" | "fr" | "de" | "es" | "ar" | "zh";

const pageCopy: Record<
  LangKey,
  {
    badge: string;
    description: string;
  }
> = {
  en: {
    badge: "Food Hub",
    description:
      "Explore this hub for nearby food places, local catering options, and area-based food services.",
  },
  it: {
    badge: "Hub gastronomico",
    description:
      "Esplora questo hub per luoghi dove mangiare nelle vicinanze, opzioni di catering locali e servizi gastronomici della zona.",
  },
  fr: {
    badge: "Pôle culinaire",
    description:
      "Explorez ce hub pour découvrir des lieux de restauration à proximité, des options de traiteur locales et des services alimentaires de la zone.",
  },
  de: {
    badge: "Food-Hub",
    description:
      "Entdecken Sie diesen Hub für nahegelegene Essensangebote, lokale Catering-Optionen und gastronomische Services in der Umgebung.",
  },
  es: {
    badge: "Centro gastronómico",
    description:
      "Explora este hub para encontrar lugares de comida cercanos, opciones de catering locales y servicios gastronómicos de la zona.",
  },
  ar: {
    badge: "مركز طعام",
    description:
      "استكشف هذا المركز للعثور على أماكن طعام قريبة وخيارات تموين محلية وخدمات طعام في المنطقة.",
  },
  zh: {
    badge: "美食中心",
    description:
      "探索该美食中心，了解附近餐饮地点、本地餐饮服务和区域美食选择。",
  },
};

const hubNameMap: Record<string, string> = {
  "barking-road": "Barking Road",
  boxpark: "BOXPARK",
  "brick-lane": "Brick Lane",
  "east-ham-town-centre": "East Ham Town Centre",
  "edgware-road": "Edgware Road",
  "high-street-north": "High Street North",
  "ilford-lane": "Ilford Lane",
  "london-street-food": "London Street Food",
  "plashet-road": "Plashet Road",
  "stratford-centre": "Stratford Centre",
  "upmarket-brick-lane-foodhall": "Upmarket Brick Lane Foodhall",
  westfield: "Westfield Stratford City",
};

const hubDescriptionMap: Record<string, Record<LangKey, string>> = {
  "barking-road": {
    en: "Visit Barking Road by travelling to Upton Park Station or nearby Barking Road bus stops. From there, walk along the main high street to explore local restaurants, cafés, takeaways, and everyday East London food spots.",
    it: "Visita Barking Road raggiungendo Upton Park Station o le fermate bus vicine su Barking Road. Da lì, cammina lungo la strada principale per esplorare ristoranti, caffè, takeaway e locali gastronomici dell’East London.",
    fr: "Visitez Barking Road en vous rendant à Upton Park Station ou aux arrêts de bus proches de Barking Road. Ensuite, marchez le long de la rue principale pour découvrir restaurants, cafés, plats à emporter et adresses locales de l’est de Londres.",
    de: "Besuchen Sie Barking Road über Upton Park Station oder nahegelegene Bushaltestellen an der Barking Road. Von dort aus laufen Sie die Hauptstraße entlang zu lokalen Restaurants, Cafés, Takeaways und typischen Food-Spots in East London.",
    es: "Visita Barking Road viajando hasta Upton Park Station o las paradas de autobús cercanas en Barking Road. Desde allí, camina por la calle principal para descubrir restaurantes, cafeterías, comida para llevar y locales de East London.",
    ar: "يمكنك زيارة Barking Road عبر محطة Upton Park أو مواقف الحافلات القريبة على Barking Road. من هناك، امشِ على طول الشارع الرئيسي لاستكشاف المطاعم والمقاهي ومحلات الوجبات السريعة وأماكن الطعام المحلية في شرق لندن.",
    zh: "前往 Barking Road 可到 Upton Park Station 或附近的 Barking Road 巴士站。到达后沿主街步行，即可探索当地餐厅、咖啡馆、外卖店和东伦敦日常美食地点。",
  },
  boxpark: {
    en: "Visit BOXPARK by getting off at Shoreditch High Street Station. From the station, it takes only a few minutes to walk to BOXPARK, close to Shoreditch, Brick Lane, and popular East London food streets.",
    it: "Visita BOXPARK scendendo a Shoreditch High Street Station. Dalla stazione bastano pochi minuti a piedi per raggiungere BOXPARK, vicino a Shoreditch, Brick Lane e alle famose strade gastronomiche dell’East London.",
    fr: "Visitez BOXPARK en descendant à Shoreditch High Street Station. Depuis la gare, il ne faut que quelques minutes à pied pour rejoindre BOXPARK, près de Shoreditch, Brick Lane et des rues culinaires populaires de l’est de Londres.",
    de: "Besuchen Sie BOXPARK über Shoreditch High Street Station. Von dort sind es nur wenige Gehminuten bis BOXPARK, nahe Shoreditch, Brick Lane und beliebten Food-Straßen in East London.",
    es: "Visita BOXPARK bajando en Shoreditch High Street Station. Desde la estación, solo se tarda unos minutos caminando hasta BOXPARK, cerca de Shoreditch, Brick Lane y conocidas calles gastronómicas de East London.",
    ar: "يمكنك زيارة BOXPARK بالنزول في Shoreditch High Street Station. من المحطة يستغرق المشي بضع دقائق فقط للوصول إلى BOXPARK بالقرب من Shoreditch وBrick Lane وشوارع الطعام الشهيرة في شرق لندن.",
    zh: "前往 BOXPARK 可在 Shoreditch High Street Station 下车。从车站步行几分钟即可到达 BOXPARK，靠近 Shoreditch、Brick Lane 和东伦敦热门美食街区。",
  },
  "brick-lane": {
    en: "Visit Brick Lane by exiting at Aldgate East Underground Station or getting off near Elder Street bus stop. From there, it takes around 5 minutes to walk to Brick Lane, one of London’s most famous food and market streets.",
    it: "Visita Brick Lane uscendo da Aldgate East Underground Station oppure scendendo vicino alla fermata bus Elder Street. Da lì, ci vogliono circa 5 minuti a piedi per raggiungere Brick Lane, una delle strade del cibo e dei mercati più famose di Londra.",
    fr: "Visitez Brick Lane en sortant à Aldgate East Underground Station ou en descendant près de l’arrêt de bus Elder Street. De là, il faut environ 5 minutes à pied pour rejoindre Brick Lane, l’une des rues gastronomiques et de marché les plus connues de Londres.",
    de: "Besuchen Sie Brick Lane, indem Sie an der Aldgate East Underground Station aussteigen oder nahe der Bushaltestelle Elder Street. Von dort sind es etwa 5 Minuten zu Fuß bis zur Brick Lane, einer der bekanntesten Food- und Marktstraßen Londons.",
    es: "Visita Brick Lane saliendo en Aldgate East Underground Station o bajando cerca de la parada de autobús Elder Street. Desde allí, se tarda unos 5 minutos caminando hasta Brick Lane, una de las calles de comida y mercado más famosas de Londres.",
    ar: "يمكنك زيارة Brick Lane بالخروج من محطة Aldgate East Underground Station أو النزول قرب موقف حافلات Elder Street. من هناك، يستغرق المشي حوالي 5 دقائق للوصول إلى Brick Lane، أحد أشهر شوارع الطعام والأسواق في لندن.",
    zh: "前往 Brick Lane 可从 Aldgate East Underground Station 出站，或在 Elder Street 附近巴士站下车。从那里步行约 5 分钟即可到达 Brick Lane，这是伦敦最有名的美食和市集街之一。",
  },
  "east-ham-town-centre": {
    en: "Visit East Ham Town Centre by exiting at East Ham Underground Station. From the station, walk towards the main high street to find local shops, restaurants, cafés, bakeries, and busy neighbourhood food places.",
    it: "Visita East Ham Town Centre uscendo da East Ham Underground Station. Dalla stazione, cammina verso la strada principale per trovare negozi locali, ristoranti, caffè, panetterie e vivaci luoghi gastronomici di quartiere.",
    fr: "Visitez East Ham Town Centre en sortant à East Ham Underground Station. Depuis la station, marchez vers la rue principale pour trouver boutiques locales, restaurants, cafés, boulangeries et adresses de quartier animées.",
    de: "Besuchen Sie East Ham Town Centre über die East Ham Underground Station. Von der Station aus laufen Sie zur Hauptstraße mit lokalen Geschäften, Restaurants, Cafés, Bäckereien und belebten Food-Spots.",
    es: "Visita East Ham Town Centre saliendo en East Ham Underground Station. Desde la estación, camina hacia la calle principal para encontrar tiendas locales, restaurantes, cafeterías, panaderías y lugares de comida del barrio.",
    ar: "يمكنك زيارة East Ham Town Centre بالخروج من محطة East Ham Underground Station. من المحطة، اتجه مشياً نحو الشارع الرئيسي حيث توجد المتاجر والمطاعم والمقاهي والمخابز وأماكن الطعام المحلية.",
    zh: "前往 East Ham Town Centre 可从 East Ham Underground Station 出站。从车站步行前往主街，可找到本地商店、餐厅、咖啡馆、面包店和热闹的社区美食地点。",
  },
  "edgware-road": {
    en: "Visit Edgware Road by exiting at Edgware Road Underground Station. The hub sits around the main Edgware Road area, known for restaurants, cafés, late-night food spots, and Middle Eastern food culture.",
    it: "Visita Edgware Road uscendo da Edgware Road Underground Station. L’hub si trova intorno alla zona principale di Edgware Road, nota per ristoranti, caffè, locali aperti fino a tardi e cucina mediorientale.",
    fr: "Visitez Edgware Road en sortant à Edgware Road Underground Station. Le hub se trouve autour de la zone principale d’Edgware Road, connue pour ses restaurants, cafés, adresses ouvertes tard et sa culture culinaire moyen-orientale.",
    de: "Besuchen Sie Edgware Road über die Edgware Road Underground Station. Der Hub liegt rund um die Hauptstraße Edgware Road, bekannt für Restaurants, Cafés, Late-Night-Food-Spots und nahöstliche Esskultur.",
    es: "Visita Edgware Road saliendo en Edgware Road Underground Station. El hub se encuentra alrededor de la zona principal de Edgware Road, conocida por restaurantes, cafeterías, locales nocturnos y cultura gastronómica de Oriente Medio.",
    ar: "يمكنك زيارة Edgware Road بالخروج من محطة Edgware Road Underground Station. يقع هذا الهب حول منطقة Edgware Road الرئيسية، المعروفة بالمطاعم والمقاهي وأماكن الطعام الليلية وثقافة الطعام الشرق أوسطية.",
    zh: "前往 Edgware Road 可从 Edgware Road Underground Station 出站。该 hub 位于 Edgware Road 主区域，周边以餐厅、咖啡馆、夜间美食点和中东饮食文化闻名。",
  },
  "high-street-north": {
    en: "Visit High Street North by travelling to East Ham Underground Station and walking towards High Street North. The area has local shops, restaurants, takeaways, cafés, and busy East London high-street food places.",
    it: "Visita High Street North raggiungendo East Ham Underground Station e camminando verso High Street North. La zona offre negozi locali, ristoranti, takeaway, caffè e vivaci punti food dell’East London.",
    fr: "Visitez High Street North en vous rendant à East Ham Underground Station puis en marchant vers High Street North. La zone compte des boutiques locales, restaurants, plats à emporter, cafés et adresses animées de l’est de Londres.",
    de: "Besuchen Sie High Street North über East Ham Underground Station und laufen Sie Richtung High Street North. Die Gegend bietet lokale Geschäfte, Restaurants, Takeaways, Cafés und belebte Food-Spots in East London.",
    es: "Visita High Street North viajando hasta East Ham Underground Station y caminando hacia High Street North. La zona cuenta con tiendas locales, restaurantes, comida para llevar, cafeterías y lugares gastronómicos de East London.",
    ar: "يمكنك زيارة High Street North عبر محطة East Ham Underground Station ثم المشي باتجاه High Street North. تضم المنطقة متاجر محلية ومطاعم ومحلات وجبات سريعة ومقاهي وأماكن طعام نشطة في شرق لندن.",
    zh: "前往 High Street North 可到 East Ham Underground Station，然后步行前往 High Street North。该区域有本地商店、餐厅、外卖店、咖啡馆和繁忙的东伦敦高街美食点。",
  },
  "ilford-lane": {
    en: "Visit Ilford Lane by travelling to Ilford Station, then walking or taking a short bus ride towards Ilford Lane. The area is well known for restaurants, dessert shops, cafés, family dining, and local food culture.",
    it: "Visita Ilford Lane raggiungendo Ilford Station, poi camminando o prendendo un breve autobus verso Ilford Lane. La zona è nota per ristoranti, dessert shop, caffè, cucina per famiglie e cultura gastronomica locale.",
    fr: "Visitez Ilford Lane en vous rendant à Ilford Station, puis en marchant ou en prenant un court trajet en bus vers Ilford Lane. La zone est connue pour ses restaurants, desserts, cafés, repas en famille et sa culture culinaire locale.",
    de: "Besuchen Sie Ilford Lane über Ilford Station und gehen Sie dann zu Fuß oder nehmen Sie kurz den Bus Richtung Ilford Lane. Die Gegend ist bekannt für Restaurants, Dessert-Shops, Cafés, Familienessen und lokale Food-Kultur.",
    es: "Visita Ilford Lane viajando hasta Ilford Station y luego caminando o tomando un corto autobús hacia Ilford Lane. La zona es conocida por restaurantes, tiendas de postres, cafeterías, comida familiar y cultura gastronómica local.",
    ar: "يمكنك زيارة Ilford Lane عبر محطة Ilford Station، ثم المشي أو ركوب حافلة قصيرة باتجاه Ilford Lane. تشتهر المنطقة بالمطاعم ومحلات الحلويات والمقاهي وتجارب الطعام العائلية والثقافة الغذائية المحلية.",
    zh: "前往 Ilford Lane 可到 Ilford Station，然后步行或乘坐短程巴士前往 Ilford Lane。该区域以餐厅、甜品店、咖啡馆、家庭用餐和本地美食文化闻名。",
  },
  "london-street-food": {
    en: "Explore London Street Food through selected street-food locations, markets, and pop-up food areas across London. This hub highlights casual food experiences, vendor-led dining, and event-style food spaces around the city.",
    it: "Esplora London Street Food attraverso location di street food selezionate, mercati e aree pop-up in tutta Londra. Questo hub mette in evidenza esperienze informali, venditori indipendenti e spazi food per eventi in città.",
    fr: "Explorez London Street Food à travers des lieux de street food sélectionnés, des marchés et des espaces pop-up dans Londres. Ce hub met en avant des expériences décontractées, des vendeurs indépendants et des espaces culinaires événementiels.",
    de: "Entdecken Sie London Street Food über ausgewählte Street-Food-Standorte, Märkte und Pop-up-Food-Bereiche in ganz London. Dieser Hub zeigt lockere Food-Erlebnisse, anbieterbasierte Gastronomie und Event-Food-Spaces.",
    es: "Explora London Street Food a través de ubicaciones seleccionadas de comida callejera, mercados y zonas pop-up en Londres. Este hub destaca experiencias informales, vendedores independientes y espacios gastronómicos para eventos.",
    ar: "استكشف London Street Food من خلال مواقع مختارة للطعام في الشوارع والأسواق ومناطق الطعام المؤقتة في لندن. يبرز هذا الهب تجارب الطعام غير الرسمية والبائعين المستقلين ومساحات الطعام الخاصة بالفعاليات.",
    zh: "通过伦敦精选街头美食地点、市集和快闪餐饮区域探索 London Street Food。该 hub 展示休闲餐饮体验、摊主主导的美食和城市活动型餐饮空间。",
  },
  "plashet-road": {
    en: "Visit Plashet Road by travelling to Upton Park Station. From the station, walk towards Plashet Road to find local restaurants, shops, cafés, takeaways, bakeries, and everyday East London food places.",
    it: "Visita Plashet Road raggiungendo Upton Park Station. Dalla stazione, cammina verso Plashet Road per trovare ristoranti locali, negozi, caffè, takeaway, panetterie e punti food quotidiani dell’East London.",
    fr: "Visitez Plashet Road en vous rendant à Upton Park Station. Depuis la station, marchez vers Plashet Road pour trouver restaurants locaux, boutiques, cafés, plats à emporter, boulangeries et adresses de l’est de Londres.",
    de: "Besuchen Sie Plashet Road über Upton Park Station. Von dort laufen Sie Richtung Plashet Road zu lokalen Restaurants, Geschäften, Cafés, Takeaways, Bäckereien und alltäglichen Food-Spots in East London.",
    es: "Visita Plashet Road viajando hasta Upton Park Station. Desde la estación, camina hacia Plashet Road para encontrar restaurantes locales, tiendas, cafeterías, comida para llevar, panaderías y lugares de comida de East London.",
    ar: "يمكنك زيارة Plashet Road عبر محطة Upton Park Station. من المحطة، امشِ باتجاه Plashet Road حيث ستجد مطاعم محلية ومتاجر ومقاهي ومحلات وجبات سريعة ومخابز وأماكن طعام يومية في شرق لندن.",
    zh: "前往 Plashet Road 可到 Upton Park Station。从车站步行前往 Plashet Road，可找到本地餐厅、商店、咖啡馆、外卖店、面包店和东伦敦日常美食点。",
  },
  "stratford-centre": {
    en: "Visit Stratford Centre by exiting at Stratford Station. The centre is only a short walk from the station and sits close to shops, food outlets, transport links, Westfield Stratford City, and busy East London retail areas.",
    it: "Visita Stratford Centre uscendo da Stratford Station. Il centro è a pochi passi dalla stazione ed è vicino a negozi, punti food, collegamenti di trasporto, Westfield Stratford City e vivaci aree retail dell’East London.",
    fr: "Visitez Stratford Centre en sortant à Stratford Station. Le centre est à quelques minutes à pied de la station, proche des boutiques, points de restauration, transports, Westfield Stratford City et zones commerciales animées.",
    de: "Besuchen Sie Stratford Centre über Stratford Station. Das Centre ist nur wenige Gehminuten entfernt und liegt nahe Geschäften, Food-Outlets, Verkehrsanbindungen, Westfield Stratford City und belebten Einkaufsbereichen.",
    es: "Visita Stratford Centre saliendo en Stratford Station. El centro está a pocos minutos caminando de la estación y cerca de tiendas, locales de comida, transporte, Westfield Stratford City y zonas comerciales de East London.",
    ar: "يمكنك زيارة Stratford Centre بالخروج من محطة Stratford Station. يقع المركز على مسافة قصيرة سيراً من المحطة وبالقرب من المتاجر ومنافذ الطعام ووسائل النقل وWestfield Stratford City ومناطق التسوق النشطة.",
    zh: "前往 Stratford Centre 可从 Stratford Station 出站。该中心距离车站仅几分钟步行，靠近商店、餐饮点、交通连接、Westfield Stratford City 和繁忙的东伦敦零售区。",
  },
  "upmarket-brick-lane-foodhall": {
    en: "Visit Upmarket Brick Lane Foodhall by exiting at Aldgate East Underground Station or getting off near Elder Street. From there, walk around 5 minutes towards Brick Lane to reach the food hall and surrounding market area.",
    it: "Visita Upmarket Brick Lane Foodhall uscendo da Aldgate East Underground Station oppure scendendo vicino a Elder Street. Da lì, cammina circa 5 minuti verso Brick Lane per raggiungere la food hall e l’area del mercato.",
    fr: "Visitez Upmarket Brick Lane Foodhall en sortant à Aldgate East Underground Station ou en descendant près de Elder Street. De là, marchez environ 5 minutes vers Brick Lane pour rejoindre le food hall et la zone de marché.",
    de: "Besuchen Sie Upmarket Brick Lane Foodhall über Aldgate East Underground Station oder nahe Elder Street. Von dort laufen Sie etwa 5 Minuten Richtung Brick Lane, um die Foodhall und den umliegenden Marktbereich zu erreichen.",
    es: "Visita Upmarket Brick Lane Foodhall saliendo en Aldgate East Underground Station o bajando cerca de Elder Street. Desde allí, camina unos 5 minutos hacia Brick Lane para llegar al food hall y la zona de mercado.",
    ar: "يمكنك زيارة Upmarket Brick Lane Foodhall بالخروج من محطة Aldgate East Underground Station أو النزول قرب Elder Street. من هناك، امشِ حوالي 5 دقائق باتجاه Brick Lane للوصول إلى قاعة الطعام ومنطقة السوق المحيطة.",
    zh: "前往 Upmarket Brick Lane Foodhall 可从 Aldgate East Underground Station 出站，或在 Elder Street 附近下车。从那里朝 Brick Lane 步行约 5 分钟即可到达 foodhall 和周边市集区域。",
  },
  westfield: {
    en: "Visit Westfield Stratford City by exiting at Stratford Station. The shopping centre is directly connected to the station area and offers restaurants, cafés, food courts, retail food options, and busy shopping-centre dining.",
    it: "Visita Westfield Stratford City uscendo da Stratford Station. Il centro commerciale è collegato direttamente alla zona della stazione e offre ristoranti, caffè, food court, opzioni food retail e ristorazione da shopping centre.",
    fr: "Visitez Westfield Stratford City en sortant à Stratford Station. Le centre commercial est directement relié à la zone de la station et propose restaurants, cafés, food courts, options alimentaires retail et restauration de centre commercial.",
    de: "Besuchen Sie Westfield Stratford City über Stratford Station. Das Einkaufszentrum ist direkt mit dem Stationsbereich verbunden und bietet Restaurants, Cafés, Food Courts, Retail-Food-Angebote und belebte Shopping-Centre-Gastronomie.",
    es: "Visita Westfield Stratford City saliendo en Stratford Station. El centro comercial está conectado directamente con la estación y ofrece restaurantes, cafeterías, food courts, opciones de comida retail y gastronomía de centro comercial.",
    ar: "يمكنك زيارة Westfield Stratford City بالخروج من محطة Stratford Station. يرتبط مركز التسوق مباشرة بمنطقة المحطة ويضم مطاعم ومقاهي وقاعات طعام وخيارات طعام داخل المتاجر وتجارب طعام مزدحمة.",
    zh: "前往 Westfield Stratford City 可从 Stratford Station 出站。购物中心与车站区域直接相连，提供餐厅、咖啡馆、美食广场、零售餐饮选择和繁忙的商场用餐体验。",
  },
};

function formatSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function HubPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [lang, setLang] = useState<LangKey>("en");

  useEffect(() => {
    const savedLang = localStorage.getItem("lang") as LangKey | null;

    if (
      savedLang === "en" ||
      savedLang === "it" ||
      savedLang === "fr" ||
      savedLang === "de" ||
      savedLang === "es" ||
      savedLang === "ar" ||
      savedLang === "zh"
    ) {
      setLang(savedLang);
    }
  }, []);

  const copy = pageCopy[lang];
  const isRtl = lang === "ar";
  const hubName = hubNameMap[slug] ?? formatSlug(slug);
  const hubDescription = hubDescriptionMap[slug]?.[lang] ?? copy.description;

  return (
    <main dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
          <div className="inline-flex rounded-full bg-amber-100 px-4 py-1 text-sm font-semibold text-amber-900">
            {copy.badge}
          </div>

          <h1 className="mt-4 text-3xl font-bold text-neutral-900 md:text-4xl">
            {hubName}
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-600">
            {hubDescription}
          </p>
        </div>
      </div>
    </main>
  );
}