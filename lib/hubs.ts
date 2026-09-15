import type { FoodHub } from "./types";

/**
 * Canonical food-hub data source for London Food Hubs.
 *
 * Consolidates hub content that was previously duplicated (and
 * partly inconsistent — different slugs for the same place) across
 * app/hubs/[slug]/page.tsx's local maps, app/page.tsx's inline hubs
 * array, lib/hubphotos.ts, and components/home/data/homepageData.ts.
 *
 * `description` carries the richer 10-language marketing copy that
 * already existed on the homepage. `travelInfo` carries the shorter
 * "how to get there" copy that already existed in the [slug] route's
 * hubDescriptionMap (only ever written in 7 languages). Both are
 * `LocalizedText` (partial) — never auto-filled for languages that
 * were never actually translated.
 */
export const HUBS: Record<string, FoodHub> = {
  "plashet-road": {
    id: "plashet-road",
    slug: "plashet-road",
    name: "Plashet Road",
    areaLabel: "Green Street, East London",
    citySlug: "london",
    description: {
      en: "A strong South Asian food corridor with family dining, takeaway favourites, practical local demand, and growing food-business clusters.",
      bn: "পারিবারিক ডাইনিং, টেকঅ্যাওয়ে পছন্দ, স্থানীয় চাহিদা এবং ক্রমবর্ধমান খাদ্য ব্যবসার জন্য একটি শক্তিশালী দক্ষিণ এশীয় ফুড করিডোর।",
      it: "Un forte corridoio gastronomico sudasiatico con ristorazione familiare, takeaway e domanda locale in crescita.",
      fr: "Un important corridor alimentaire sud-asiatique avec restauration familiale, plats à emporter et forte demande locale.",
      de: "Ein starker südasiatischer Food-Korridor mit Familienrestaurants, Takeaway und wachsender Nachfrage.",
      es: "Un fuerte corredor gastronómico del sur de Asia con comida familiar, takeaway y demanda local creciente.",
      ar: "ممر غذائي قوي لجنوب آسيا يضم مطاعم عائلية وخيارات تيك أواي وطلب محلي متزايد.",
      zh: "一个强大的南亚美食走廊，拥有家庭用餐、外卖需求和不断增长的本地市场。",
      ja: "家族向けレストランやテイクアウト、地域需要が高い南アジアのフードエリアです。",
      th: "ย่านอาหารเอเชียใต้ที่แข็งแกร่ง มีร้านอาหารสำหรับครอบครัว อาหารสั่งกลับบ้าน และความต้องการในพื้นที่สูง",
    },
    travelInfo: {
      en: "Visit Plashet Road by travelling to Upton Park Station. From the station, walk towards Plashet Road to find local restaurants, shops, cafés, takeaways, bakeries, and everyday East London food places.",
      it: "Visita Plashet Road raggiungendo Upton Park Station. Dalla stazione, cammina verso Plashet Road per trovare ristoranti locali, negozi, caffè, takeaway, panetterie e punti food quotidiani dell'East London.",
      fr: "Visitez Plashet Road en vous rendant à Upton Park Station. Depuis la station, marchez vers Plashet Road pour trouver restaurants locaux, boutiques, cafés, plats à emporter, boulangeries et adresses de l'est de Londres.",
      de: "Besuchen Sie Plashet Road über Upton Park Station. Von dort laufen Sie Richtung Plashet Road zu lokalen Restaurants, Geschäften, Cafés, Takeaways, Bäckereien und alltäglichen Food-Spots in East London.",
      es: "Visita Plashet Road viajando hasta Upton Park Station. Desde la estación, camina hacia Plashet Road para encontrar restaurantes locales, tiendas, cafeterías, comida para llevar, panaderías y lugares de comida de East London.",
      ar: "يمكنك زيارة Plashet Road عبر محطة Upton Park Station. من المحطة، امشِ باتجاه Plashet Road حيث ستجد مطاعم محلية ومتاجر ومقاهي ومحلات وجبات سريعة ومخابز وأماكن طعام يومية في شرق لندن.",
      zh: "前往 Plashet Road 可到 Upton Park Station。从车站步行前往 Plashet Road，可找到本地餐厅、商店、咖啡馆、外卖店、面包店和东伦敦日常美食点。",
    },
    editorialIntro:
      "Plashet Road is one of East London's growing neighbourhood food areas, home to a dense cluster of Bangladeshi, Pakistani, and Indian restaurants. From traditional biryani houses to grills, curries, snacks, and sweets, this hub reflects authentic community-driven dining. Many restaurants here are well-loved locally but have limited online presence — London Food Hubs brings them together in one place.",
    cuisineTags: ["Bangladeshi", "Pakistani", "Indian"],
    heroImage: "/hubs/plashet-road/13.jpg",
    gallery: Array.from({ length: 20 }, (_, i) => `/hubs/plashet-road/${i + 1}.jpg`),
    isActive: true,
    isFeatured: true,
    seoTitle: "Plashet Road Food Hub | Bangladeshi, Pakistani & Indian Food, East London",
    seoDescription:
      "Explore Plashet Road food hub in East London — Bangladeshi, Pakistani and Indian restaurants, biryani, grills, curries, snacks and sweets.",
  },

  "brick-lane": {
    id: "brick-lane",
    slug: "brick-lane",
    name: "Brick Lane",
    areaLabel: "East London",
    citySlug: "london",
    description: {
      en: "A major destination for Bangladeshi, South Asian, and multicultural dining, known for iconic curry houses, food halls, and strong visitor footfall.",
      bn: "বাংলাদেশি, দক্ষিণ এশীয় এবং বহুসাংস্কৃতিক খাবারের জন্য একটি গুরুত্বপূর্ণ গন্তব্য, যা বিখ্যাত কারি হাউস, ফুড হল এবং শক্তিশালী দর্শনার্থী উপস্থিতির জন্য পরিচিত।",
      it: "Una delle principali destinazioni per la cucina bangladese, sudasiatica e multiculturale, nota per le sue iconiche curry house, food hall e l'elevato afflusso di visitatori.",
      fr: "Une destination majeure pour la cuisine bangladaise, sud-asiatique et multiculturelle, connue pour ses célèbres curry houses, ses food halls et sa forte fréquentation.",
      de: "Ein wichtiges Ziel für bangladeschische, südasiatische und multikulturelle Küche, bekannt für ikonische Curry-Häuser, Food Halls und starke Besucherfrequenz.",
      es: "Un destino importante para la comida bangladesí, del sur de Asia y multicultural, conocido por sus icónicos curry houses, food halls y gran afluencia de visitantes.",
      ar: "وجهة رئيسية للمأكولات البنغلاديشية والجنوب آسيوية والمتعددة الثقافات، وتشتهر بمطاعم الكاري الشهيرة وقاعات الطعام وكثرة الزوار.",
      zh: "这里是孟加拉、南亚及多元文化餐饮的重要目的地，以知名咖喱餐厅、美食广场和大量客流而闻名。",
      ja: "バングラデシュ料理、南アジア料理、多文化料理の主要スポットで、象徴的なカレーハウス、フードホール、多くの来訪者で知られています。",
      th: "จุดหมายสำคัญสำหรับอาหารบังกลาเทศ เอเชียใต้ และอาหารหลากหลายวัฒนธรรม มีชื่อเสียงด้านร้านแกงกะหรี่ ฟู้ดฮอลล์ และผู้คนพลุกพล่าน",
    },
    travelInfo: {
      en: "Visit Brick Lane by exiting at Aldgate East Underground Station or getting off near Elder Street bus stop. From there, it takes around 5 minutes to walk to Brick Lane, one of London's most famous food and market streets.",
      it: "Visita Brick Lane uscendo da Aldgate East Underground Station oppure scendendo vicino alla fermata bus Elder Street. Da lì, ci vogliono circa 5 minuti a piedi per raggiungere Brick Lane, una delle strade del cibo e dei mercati più famose di Londra.",
      fr: "Visitez Brick Lane en sortant à Aldgate East Underground Station ou en descendant près de l'arrêt de bus Elder Street. De là, il faut environ 5 minutes à pied pour rejoindre Brick Lane, l'une des rues gastronomiques et de marché les plus connues de Londres.",
      de: "Besuchen Sie Brick Lane, indem Sie an der Aldgate East Underground Station aussteigen oder nahe der Bushaltestelle Elder Street. Von dort sind es etwa 5 Minuten zu Fuß bis zur Brick Lane, einer der bekanntesten Food- und Marktstraßen Londons.",
      es: "Visita Brick Lane saliendo en Aldgate East Underground Station o bajando cerca de la parada de autobús Elder Street. Desde allí, se tarda unos 5 minutos caminando hasta Brick Lane, una de las calles de comida y mercado más famosas de Londres.",
      ar: "يمكنك زيارة Brick Lane بالخروج من محطة Aldgate East Underground Station أو النزول قرب موقف حافلات Elder Street. من هناك، يستغرق المشي حوالي 5 دقائق للوصول إلى Brick Lane، أحد أشهر شوارع الطعام والأسواق في لندن.",
      zh: "前往 Brick Lane 可从 Aldgate East Underground Station 出站，或在 Elder Street 附近巴士站下车。从那里步行约 5 分钟即可到达 Brick Lane，这是伦敦最有名的美食和市集街之一。",
    },
    editorialIntro:
      "Brick Lane is one of London's most established food hubs, famous for its Bangladeshi and South Asian restaurant presence, strong visual identity, and long-standing appeal for locals and destination visitors.",
    cuisineTags: ["Bangladeshi", "Indian", "Curry & Grill", "Sweets & Snacks"],
    heroImage: "/hubs/brick-lane/7.jpg",
    gallery: Array.from({ length: 9 }, (_, i) => `/hubs/brick-lane/${i + 1}.jpg`),
    isActive: true,
    isFeatured: true,
    seoTitle: "Brick Lane Food Hub | Bangladeshi & South Asian Dining, East London",
    seoDescription:
      "Explore Brick Lane food hub — one of London's most iconic South Asian and multicultural dining destinations, with curry houses, food halls and street food.",
  },

  "upmarket-brick-lane-foodhall": {
    id: "upmarket-brick-lane-foodhall",
    slug: "upmarket-brick-lane-foodhall",
    name: "Upmarket Brick Lane Foodhall",
    areaLabel: "Brick Lane, East London",
    citySlug: "london",
    description: {
      en: "A vibrant market-style food hall with global stalls where visitors can explore varied cuisines in one place.",
      bn: "একটি প্রাণবন্ত মার্কেট-স্টাইল ফুড হল, যেখানে নানা দেশের স্টলে এক জায়গায় বিভিন্ন খাবার পাওয়া যায়।",
      it: "Una vivace food hall in stile mercato con stand internazionali dove i visitatori possono esplorare cucine diverse in un unico luogo.",
      fr: "Un food hall animé de style marché avec des stands internationaux où les visiteurs peuvent découvrir diverses cuisines en un seul lieu.",
      de: "Eine lebendige Markthallen-Food-Hall mit internationalen Ständen, in der Besucher viele Küchen an einem Ort entdecken können.",
      es: "Un animado food hall estilo mercado con puestos globales donde los visitantes pueden explorar distintas cocinas en un solo lugar.",
      ar: "قاعة طعام نابضة بالحياة على طراز السوق تضم أكشاكًا عالمية حيث يمكن للزوار استكشاف مطابخ متنوعة في مكان واحد.",
      zh: "一个充满活力的市场式美食广场，汇集全球餐饮摊位，游客可以在一处探索多种菜系。",
      ja: "世界各国の屋台が集まる活気あるマーケット型フードホールで、1か所で多彩な料理を楽しめます。",
      th: "ฟู้ดฮอลล์สไตล์ตลาดที่มีชีวิตชีวา พร้อมร้านอาหารนานาชาติให้ผู้มาเยือนได้ลองหลายรสชาติในที่เดียว",
    },
    travelInfo: {
      en: "Visit Upmarket Brick Lane Foodhall by exiting at Aldgate East Underground Station or getting off near Elder Street. From there, walk around 5 minutes towards Brick Lane to reach the food hall and surrounding market area.",
      it: "Visita Upmarket Brick Lane Foodhall uscendo da Aldgate East Underground Station oppure scendendo vicino a Elder Street. Da lì, cammina circa 5 minuti verso Brick Lane per raggiungere la food hall e l'area del mercato.",
      fr: "Visitez Upmarket Brick Lane Foodhall en sortant à Aldgate East Underground Station ou en descendant près de Elder Street. De là, marchez environ 5 minutes vers Brick Lane pour rejoindre le food hall et la zone de marché.",
      de: "Besuchen Sie Upmarket Brick Lane Foodhall über Aldgate East Underground Station oder nahe Elder Street. Von dort laufen Sie etwa 5 Minuten Richtung Brick Lane, um die Foodhall und den umliegenden Marktbereich zu erreichen.",
      es: "Visita Upmarket Brick Lane Foodhall saliendo en Aldgate East Underground Station o bajando cerca de Elder Street. Desde allí, camina unos 5 minutos hacia Brick Lane para llegar al food hall y la zona de mercado.",
      ar: "يمكنك زيارة Upmarket Brick Lane Foodhall بالخروج من محطة Aldgate East Underground Station أو النزول قرب Elder Street. من هناك، امشِ حوالي 5 دقائق باتجاه Brick Lane للوصول إلى قاعة الطعام ومنطقة السوق المحيطة.",
      zh: "前往 Upmarket Brick Lane Foodhall 可从 Aldgate East Underground Station 出站，或在 Elder Street 附近下车。从那里朝 Brick Lane 步行约 5 分钟即可到达 foodhall 和周边市集区域。",
    },
    editorialIntro:
      "Located within the Brick Lane area, Upmarket offers a curated indoor environment for independent food traders, combining global cuisines, experimental dishes, and a highly visual food experience — a dynamic micro food ecosystem in East London.",
    cuisineTags: ["Global Street Food"],
    heroImage: "/hubs/upmarket-brick-lane-foodhall/6.jpg",
    gallery: ["hero-upmarket", "1", "2", "3", "4", "5", "7", "8", "9"].map(
      (f) => `/hubs/upmarket-brick-lane-foodhall/${f}.jpg`
    ),
    isActive: true,
    seoTitle: "Upmarket Brick Lane Foodhall | Global Street Food, East London",
    seoDescription:
      "Explore Upmarket Brick Lane Foodhall — a market-style indoor food hall with independent traders and global street food.",
  },

  westfield: {
    id: "westfield",
    slug: "westfield",
    name: "Westfield Stratford City",
    areaLabel: "Stratford, East London",
    citySlug: "london",
    description: {
      en: "A major high-footfall dining zone inside one of London's busiest shopping destinations, serving shoppers, tourists, and local residents.",
      bn: "লন্ডনের অন্যতম ব্যস্ত শপিং গন্তব্যের ভেতরে অবস্থিত একটি উচ্চ-ফুটফল ডাইনিং জোন, যা ক্রেতা, পর্যটক ও স্থানীয়দের সেবা দেয়।",
      it: "Un'importante area ristoro ad alto afflusso in una delle destinazioni commerciali più frequentate di Londra.",
      fr: "Une importante zone de restauration à forte fréquentation dans l'un des centres commerciaux les plus animés de Londres.",
      de: "Ein stark frequentierter Gastronomiebereich in einem der belebtesten Einkaufsziele Londons.",
      es: "Una importante zona gastronómica de gran afluencia en uno de los destinos comerciales más concurridos de Londres.",
      ar: "منطقة طعام رئيسية ذات حركة كثيفة داخل أحد أكثر مراكز التسوق ازدحامًا في لندن.",
      zh: "位于伦敦最繁忙购物中心之一内的重要高客流餐饮区，服务购物者、游客和本地居民。",
      ja: "ロンドン有数の大型商業施設内にある、高い集客力を持つ主要な飲食エリアです。",
      th: "โซนอาหารสำคัญที่มีผู้คนหนาแน่นในหนึ่งในศูนย์การค้าที่คึกคักที่สุดของลอนดอน",
    },
    travelInfo: {
      en: "Visit Westfield Stratford City by exiting at Stratford Station. The shopping centre is directly connected to the station area and offers restaurants, cafés, food courts, retail food options, and busy shopping-centre dining.",
      it: "Visita Westfield Stratford City uscendo da Stratford Station. Il centro commerciale è collegato direttamente alla zona della stazione e offre ristoranti, caffè, food court, opzioni food retail e ristorazione da shopping centre.",
      fr: "Visitez Westfield Stratford City en sortant à Stratford Station. Le centre commercial est directement relié à la zone de la station et propose restaurants, cafés, food courts, options alimentaires retail et restauration de centre commercial.",
      de: "Besuchen Sie Westfield Stratford City über Stratford Station. Das Einkaufszentrum ist direkt mit dem Stationsbereich verbunden und bietet Restaurants, Cafés, Food Courts, Retail-Food-Angebote und belebte Shopping-Centre-Gastronomie.",
      es: "Visita Westfield Stratford City saliendo en Stratford Station. El centro comercial está conectado directamente con la estación y ofrece restaurantes, cafeterías, food courts, opciones de comida retail y gastronomía de centro comercial.",
      ar: "يمكنك زيارة Westfield Stratford City بالخروج من محطة Stratford Station. يرتبط مركز التسوق مباشرة بمنطقة المحطة ويضم مطاعم ومقاهي وقاعات طعام وخيارات طعام داخل المتاجر وتجارب طعام مزدحمة.",
      zh: "前往 Westfield Stratford City 可从 Stratford Station 出站。购物中心与车站区域直接相连，提供餐厅、咖啡馆、美食广场、零售餐饮选择和繁忙的商场用餐体验。",
    },
    cuisineTags: ["Global", "Food Court"],
    heroImage: "/hubs/westfield/hero-westfield.jpg",
    gallery: ["hero-westfield.jpg", "1.jpg", "2.jpg", "3.jpg", "4.jpg"].map(
      (f) => `/hubs/westfield/${f}`
    ),
    isActive: true,
    seoTitle: "Westfield Stratford City Food Hub | London Food Hubs",
    seoDescription:
      "Explore the dining scene at Westfield Stratford City — restaurants, cafés and food courts inside one of London's busiest shopping destinations.",
  },

  "stratford-centre": {
    id: "stratford-centre",
    slug: "stratford-centre",
    name: "Stratford Centre",
    areaLabel: "Stratford, East London",
    citySlug: "london",
    description: {
      en: "A diverse everyday food destination in central Stratford with strong multicultural appeal, commuter traffic, and practical grab-and-go demand.",
      bn: "স্ট্র্যাটফোর্ডের কেন্দ্রে অবস্থিত একটি বৈচিত্র্যময় দৈনন্দিন খাবারের গন্তব্য, যেখানে বহুসাংস্কৃতিক আকর্ষণ ও যাত্রী চলাচল শক্তিশালী।",
      it: "Una destinazione gastronomica quotidiana nel centro di Stratford con forte richiamo multiculturale e traffico di pendolari.",
      fr: "Une destination alimentaire quotidienne au centre de Stratford avec un fort attrait multiculturel et un important passage de navetteurs.",
      de: "Ein vielfältiges tägliches Food-Ziel im Zentrum von Stratford mit multikultureller Anziehungskraft und Pendlerverkehr.",
      es: "Un destino gastronómico diario en el centro de Stratford con fuerte atractivo multicultural y tráfico de viajeros.",
      ar: "وجهة طعام يومية متنوعة في وسط ستراتفورد ذات جاذبية متعددة الثقافات وحركة ركاب قوية.",
      zh: "位于斯特拉特福中心的多元日常餐饮地，具有强烈的多文化吸引力和通勤客流。",
      ja: "ストラトフォード中心部にある、多文化的な魅力と通勤客の流れを持つ日常的なフードスポットです。",
      th: "แหล่งอาหารประจำวันใจกลางสแตรตฟอร์ดที่มีความหลากหลายทางวัฒนธรรมและมีผู้สัญจรจำนวนมาก",
    },
    travelInfo: {
      en: "Visit Stratford Centre by exiting at Stratford Station. The centre is only a short walk from the station and sits close to shops, food outlets, transport links, Westfield Stratford City, and busy East London retail areas.",
      it: "Visita Stratford Centre uscendo da Stratford Station. Il centro è a pochi passi dalla stazione ed è vicino a negozi, punti food, collegamenti di trasporto, Westfield Stratford City e vivaci aree retail dell'East London.",
      fr: "Visitez Stratford Centre en sortant à Stratford Station. Le centre est à quelques minutes à pied de la station, proche des boutiques, points de restauration, transports, Westfield Stratford City et zones commerciales animées.",
      de: "Besuchen Sie Stratford Centre über Stratford Station. Das Centre ist nur wenige Gehminuten entfernt und liegt nahe Geschäften, Food-Outlets, Verkehrsanbindungen, Westfield Stratford City und belebten Einkaufsbereichen.",
      es: "Visita Stratford Centre saliendo en Stratford Station. El centro está a pocos minutos caminando de la estación y cerca de tiendas, locales de comida, transporte, Westfield Stratford City y zonas comerciales de East London.",
      ar: "يمكنك زيارة Stratford Centre بالخروج من محطة Stratford Station. يقع المركز على مسافة قصيرة سيراً من المحطة وبالقرب من المتاجر ومنافذ الطعام ووسائل النقل وWestfield Stratford City ومناطق التسوق النشطة.",
      zh: "前往 Stratford Centre 可从 Stratford Station 出站。该中心距离车站仅几分钟步行，靠近商店、餐饮点、交通连接、Westfield Stratford City 和繁忙的东伦敦零售区。",
    },
    heroImage: "/hubs/stratford-centre/hero-stratford-centre.jpg",
    gallery: ["hero-stratford-centre.jpg", "1.jpg", "2.jpg", "3.jpg", "4.jpg", "5.jpg"].map(
      (f) => `/hubs/stratford-centre/${f}`
    ),
    isActive: true,
    seoTitle: "Stratford Centre Food Hub | London Food Hubs",
    seoDescription:
      "Explore Stratford Centre — a diverse everyday dining destination in central Stratford, East London.",
  },

  boxpark: {
    id: "boxpark",
    slug: "boxpark",
    name: "Shoreditch / BOXPARK",
    areaLabel: "Shoreditch, East London",
    citySlug: "london",
    description: {
      en: "A younger, modern food crowd with high visual appeal, container-food energy, and strong discovery potential.",
      bn: "তরুণ ও আধুনিক ফুড ক্রাউড, ভিজ্যুয়াল আকর্ষণ এবং নতুন কিছু খুঁজে পাওয়ার সম্ভাবনা সমৃদ্ধ একটি এলাকা।",
      it: "Una scena gastronomica giovane e moderna con forte impatto visivo e ottimo potenziale di scoperta.",
      fr: "Une scène culinaire jeune et moderne avec un fort attrait visuel et un grand potentiel de découverte.",
      de: "Eine junge, moderne Food-Szene mit starker visueller Wirkung und hohem Entdeckungspotenzial.",
      es: "Un entorno gastronómico joven y moderno con gran atractivo visual y alto potencial de descubrimiento.",
      ar: "مشهد طعام حديث وشاب يتمتع بجاذبية بصرية قوية وإمكانات عالية للاكتشاف.",
      zh: "一个更年轻、更现代的美食人群聚集地，具有很强的视觉吸引力和发现潜力。",
      ja: "若くモダンなフードカルチャーが集まり、視覚的魅力と発見性の高いエリアです。",
      th: "แหล่งรวมอาหารสมัยใหม่สำหรับคนรุ่นใหม่ มีความโดดเด่นด้านภาพลักษณ์และน่าค้นหา",
    },
    travelInfo: {
      en: "Visit BOXPARK by getting off at Shoreditch High Street Station. From the station, it takes only a few minutes to walk to BOXPARK, close to Shoreditch, Brick Lane, and popular East London food streets.",
      it: "Visita BOXPARK scendendo a Shoreditch High Street Station. Dalla stazione bastano pochi minuti a piedi per raggiungere BOXPARK, vicino a Shoreditch, Brick Lane e alle famose strade gastronomiche dell'East London.",
      fr: "Visitez BOXPARK en descendant à Shoreditch High Street Station. Depuis la gare, il ne faut que quelques minutes à pied pour rejoindre BOXPARK, près de Shoreditch, Brick Lane et des rues culinaires populaires de l'est de Londres.",
      de: "Besuchen Sie BOXPARK über Shoreditch High Street Station. Von dort sind es nur wenige Gehminuten bis BOXPARK, nahe Shoreditch, Brick Lane und beliebten Food-Straßen in East London.",
      es: "Visita BOXPARK bajando en Shoreditch High Street Station. Desde la estación, solo se tarda unos minutos caminando hasta BOXPARK, cerca de Shoreditch, Brick Lane y conocidas calles gastronómicas de East London.",
      ar: "يمكنك زيارة BOXPARK بالنزول في Shoreditch High Street Station. من المحطة يستغرق المشي بضع دقائق فقط للوصول إلى BOXPARK بالقرب من Shoreditch وBrick Lane وشوارع الطعام الشهيرة في شرق لندن.",
      zh: "前往 BOXPARK 可在 Shoreditch High Street Station 下车。从车站步行几分钟即可到达 BOXPARK，靠近 Shoreditch、Brick Lane 和东伦敦热门美食街区。",
    },
    heroImage: "/hubs/boxpark/hero.jpg",
    gallery: ["hero.jpg", ...Array.from({ length: 9 }, (_, i) => `${i + 1}.jpg`)].map(
      (f) => `/hubs/boxpark/${f}`
    ),
    isActive: true,
    seoTitle: "Shoreditch / BOXPARK Food Hub | London Food Hubs",
    seoDescription:
      "Explore Shoreditch / BOXPARK — a modern container-food destination with strong visual appeal in East London.",
  },

  "edgware-road": {
    id: "edgware-road",
    slug: "edgware-road",
    name: "Edgware Road Arabian Food Hub",
    areaLabel: "Edgware Road, Central London",
    citySlug: "london",
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
    travelInfo: {
      en: "Visit Edgware Road by exiting at Edgware Road Underground Station. The hub sits around the main Edgware Road area, known for restaurants, cafés, late-night food spots, and Middle Eastern food culture.",
      it: "Visita Edgware Road uscendo da Edgware Road Underground Station. L'hub si trova intorno alla zona principale di Edgware Road, nota per ristoranti, caffè, locali aperti fino a tardi e cucina mediorientale.",
      fr: "Visitez Edgware Road en sortant à Edgware Road Underground Station. Le hub se trouve autour de la zone principale d'Edgware Road, connue pour ses restaurants, cafés, adresses ouvertes tard et sa culture culinaire moyen-orientale.",
      de: "Besuchen Sie Edgware Road über die Edgware Road Underground Station. Der Hub liegt rund um die Hauptstraße Edgware Road, bekannt für Restaurants, Cafés, Late-Night-Food-Spots und nahöstliche Esskultur.",
      es: "Visita Edgware Road saliendo en Edgware Road Underground Station. El hub se encuentra alrededor de la zona principal de Edgware Road, conocida por restaurantes, cafeterías, locales nocturnos y cultura gastronómica de Oriente Medio.",
      ar: "يمكنك زيارة Edgware Road بالخروج من محطة Edgware Road Underground Station. يقع هذا الهب حول منطقة Edgware Road الرئيسية، المعروفة بالمطاعم والمقاهي وأماكن الطعام الليلية وثقافة الطعام الشرق أوسطية.",
      zh: "前往 Edgware Road 可从 Edgware Road Underground Station 出站。该 hub 位于 Edgware Road 主区域，周边以餐厅、咖啡馆、夜间美食点和中东饮食文化闻名。",
    },
    cuisineTags: ["Middle Eastern", "Arabian"],
    heroImage: "/hubs/edgware-road/hero-edgware-road.jpg",
    gallery: ["hero-edgware-road.jpg", ...Array.from({ length: 9 }, (_, i) => `${i + 1}.jpg`)].map(
      (f) => `/hubs/edgware-road/${f}`
    ),
    isActive: true,
    isFeatured: true,
    seoTitle: "Edgware Road Arabian Food Hub | Middle Eastern Food, Central London",
    seoDescription:
      "Explore the Edgware Road Arabian food hub — Middle Eastern and Arabian restaurants, grills, sweets and shisha culture in Central London.",
  },

  "china-town-soho-food-hub": {
    id: "china-town-soho-food-hub",
    slug: "china-town-soho-food-hub",
    name: "China Town (Soho) Food Hub",
    areaLabel: "Soho, Central London",
    citySlug: "london",
    description: {
      en: "A globally recognised central London food destination known for East Asian restaurants, dessert shops, fast-moving visitor traffic, and strong tourist discovery appeal.",
      bn: "পূর্ব এশীয় রেস্টুরেন্ট, ডেজার্ট শপ এবং পর্যটকদের আকর্ষণের জন্য পরিচিত একটি বিশ্বখ্যাত সেন্ট্রাল লন্ডন ফুড ডেস্টিনেশন।",
      it: "Una destinazione gastronomica riconosciuta a livello globale nel centro di Londra, nota per ristoranti dell'Asia orientale e dessert shop.",
      fr: "Une destination culinaire mondialement reconnue au centre de Londres, célèbre pour ses restaurants est-asiatiques et ses boutiques de desserts.",
      de: "Ein weltweit bekanntes Gastronomieziel im Zentrum Londons, berühmt für ostasiatische Restaurants und Dessertläden.",
      es: "Un destino gastronómico reconocido mundialmente en el centro de Londres, famoso por sus restaurantes de Asia Oriental y tiendas de postres.",
      ar: "وجهة طعام شهيرة عالميًا في وسط لندن تشتهر بالمطاعم الشرق آسيوية ومحلات الحلويات وكثافة الزوار.",
      zh: "位于伦敦市中心、全球知名的美食目的地，以东亚餐厅、甜品店和高游客流著称。",
      ja: "東アジア系レストランやデザート店で知られる、世界的に有名なロンドン中心部のフードスポットです。",
      th: "แหล่งอาหารใจกลางลอนดอนที่มีชื่อเสียงระดับโลก โดดเด่นด้วยร้านอาหารเอเชียตะวันออก ร้านของหวาน และนักท่องเที่ยวจำนวนมาก",
    },
    cuisineTags: ["East Asian", "Chinese"],
    isActive: true,
    seoTitle: "China Town (Soho) Food Hub | East Asian Food, Central London",
    seoDescription:
      "Explore China Town (Soho) food hub — East Asian restaurants and dessert shops in one of central London's best-known food destinations.",
  },

  "east-ham-town-centre": {
    id: "east-ham-town-centre",
    slug: "east-ham-town-centre",
    name: "East Ham Town Centre",
    areaLabel: "East Ham, East London",
    citySlug: "london",
    description: {
      en: "A busy East London food zone with strong South Asian restaurants, takeaway demand, and everyday local footfall.",
      bn: "ইস্ট লন্ডনের একটি ব্যস্ত খাবার এলাকা, যেখানে দক্ষিণ এশীয় রেস্টুরেন্ট, টেকঅ্যাওয়ে চাহিদা এবং স্থানীয় মানুষের উপস্থিতি শক্তিশালী।",
      it: "Una vivace zona gastronomica dell'East London con forti ristoranti sudasiatici e domanda takeaway.",
      fr: "Une zone alimentaire animée de l'est de Londres avec de solides restaurants sud-asiatiques et une forte demande à emporter.",
      de: "Ein belebtes Food-Viertel im Osten Londons mit starken südasiatischen Restaurants und hoher Takeaway-Nachfrage.",
      es: "Una concurrida zona gastronómica del este de Londres con fuertes restaurantes del sur de Asia y demanda de comida para llevar.",
      ar: "منطقة طعام مزدحمة في شرق لندن تضم مطاعم جنوب آسيوية قوية وطلبًا يوميًا مرتفعًا.",
      zh: "东伦敦繁忙的餐饮区，拥有强劲的南亚餐厅、外卖需求和日常本地客流。",
      ja: "南アジア系レストランとテイクアウト需要が強い、東ロンドンの活気あるフードエリアです。",
      th: "ย่านอาหารที่คึกคักในอีสต์ลอนดอน มีร้านอาหารเอเชียใต้จำนวนมากและความต้องการสั่งกลับบ้านสูง",
    },
    travelInfo: {
      en: "Visit East Ham Town Centre by exiting at East Ham Underground Station. From the station, walk towards the main high street to find local shops, restaurants, cafés, bakeries, and busy neighbourhood food places.",
      it: "Visita East Ham Town Centre uscendo da East Ham Underground Station. Dalla stazione, cammina verso la strada principale per trovare negozi locali, ristoranti, caffè, panetterie e vivaci luoghi gastronomici di quartiere.",
      fr: "Visitez East Ham Town Centre en sortant à East Ham Underground Station. Depuis la station, marchez vers la rue principale pour trouver boutiques locales, restaurants, cafés, boulangeries et adresses de quartier animées.",
      de: "Besuchen Sie East Ham Town Centre über die East Ham Underground Station. Von der Station aus laufen Sie zur Hauptstraße mit lokalen Geschäften, Restaurants, Cafés, Bäckereien und belebten Food-Spots.",
      es: "Visita East Ham Town Centre saliendo en East Ham Underground Station. Desde la estación, camina hacia la calle principal para encontrar tiendas locales, restaurantes, cafeterías, panaderías y lugares de comida del barrio.",
      ar: "يمكنك زيارة East Ham Town Centre بالخروج من محطة East Ham Underground Station. من المحطة، اتجه مشياً نحو الشارع الرئيسي حيث توجد المتاجر والمطاعم والمقاهي والمخابز وأماكن الطعام المحلية.",
      zh: "前往 East Ham Town Centre 可从 East Ham Underground Station 出站。从车站步行前往主街，可找到本地商店、餐厅、咖啡馆、面包店和热闹的社区美食地点。",
    },
    heroImage: "/hubs/east-ham-town-centre/hero.jpg",
    gallery: ["hero.jpg", ...Array.from({ length: 11 }, (_, i) => `${i + 1}.jpg`)].map(
      (f) => `/hubs/east-ham-town-centre/${f}`
    ),
    isActive: true,
    seoTitle: "East Ham Town Centre Food Hub | London Food Hubs",
    seoDescription:
      "Explore East Ham Town Centre — a busy East London food zone with strong South Asian restaurants and everyday local dining.",
  },

  "barking-road": {
    id: "barking-road",
    slug: "barking-road",
    name: "Barking Road (East Ham)",
    areaLabel: "East Ham, East London",
    citySlug: "london",
    description: {
      en: "A practical food stretch near East Ham Town Hall with visible local trading activity and strong discovery potential.",
      bn: "ইস্ট হ্যাম টাউন হলের কাছে একটি কার্যকরী ফুড স্ট্রেচ, যেখানে স্থানীয় বাণিজ্যিক কার্যক্রম দৃশ্যমান এবং নতুন আবিষ্কারের সম্ভাবনা রয়েছে।",
      it: "Una pratica area food vicino a East Ham Town Hall con attività commerciali locali visibili e buon potenziale di scoperta.",
      fr: "Un axe alimentaire pratique près de l'hôtel de ville d'East Ham avec une activité commerciale locale visible.",
      de: "Ein praktischer Food-Abschnitt nahe East Ham Town Hall mit sichtbarer lokaler Handelsaktivität.",
      es: "Una franja gastronómica práctica cerca del Ayuntamiento de East Ham con actividad comercial local visible.",
      ar: "امتداد غذائي عملي بالقرب من مجلس مدينة إيست هام مع نشاط تجاري محلي واضح وإمكانات اكتشاف قوية.",
      zh: "位于 East Ham 市政厅附近的实用餐饮带，具有明显的本地商业活动和发现潜力。",
      ja: "イーストハム・タウンホール近くの実用的なフード通りで、地域の商業活動が見えやすいエリアです。",
      th: "แนวถนนอาหารใกล้อีสต์แฮมทาวน์ฮอลล์ ที่มีการค้าท้องถิ่นชัดเจนและมีศักยภาพในการค้นพบสูง",
    },
    travelInfo: {
      en: "Visit Barking Road by travelling to Upton Park Station or nearby Barking Road bus stops. From there, walk along the main high street to explore local restaurants, cafés, takeaways, and everyday East London food spots.",
      it: "Visita Barking Road raggiungendo Upton Park Station o le fermate bus vicine su Barking Road. Da lì, cammina lungo la strada principale per esplorare ristoranti, caffè, takeaway e locali gastronomici dell'East London.",
      fr: "Visitez Barking Road en vous rendant à Upton Park Station ou aux arrêts de bus proches de Barking Road. Ensuite, marchez le long de la rue principale pour découvrir restaurants, cafés, plats à emporter et adresses locales de l'est de Londres.",
      de: "Besuchen Sie Barking Road über Upton Park Station oder nahegelegene Bushaltestellen an der Barking Road. Von dort aus laufen Sie die Hauptstraße entlang zu lokalen Restaurants, Cafés, Takeaways und typischen Food-Spots in East London.",
      es: "Visita Barking Road viajando hasta Upton Park Station o las paradas de autobús cercanas en Barking Road. Desde allí, camina por la calle principal para descubrir restaurantes, cafeterías, comida para llevar y locales de East London.",
      ar: "يمكنك زيارة Barking Road عبر محطة Upton Park أو مواقف الحافلات القريبة على Barking Road. من هناك، امشِ على طول الشارع الرئيسي لاستكشاف المطاعم والمقاهي ومحلات الوجبات السريعة وأماكن الطعام المحلية في شرق لندن.",
      zh: "前往 Barking Road 可到 Upton Park Station 或附近的 Barking Road 巴士站。到达后沿主街步行，即可探索当地餐厅、咖啡馆、外卖店和东伦敦日常美食地点。",
    },
    heroImage: "/hubs/barking-road/hero.jpg",
    gallery: ["hero.jpg", ...Array.from({ length: 8 }, (_, i) => `${i + 1}.jpg`)].map(
      (f) => `/hubs/barking-road/${f}`
    ),
    isActive: true,
    seoTitle: "Barking Road Food Hub | East Ham, London Food Hubs",
    seoDescription:
      "Explore Barking Road — a practical East Ham food stretch with restaurants, cafés and takeaways in East London.",
  },

  "high-street-north": {
    id: "high-street-north",
    slug: "high-street-north",
    name: "High Street North",
    areaLabel: "East Ham, East London",
    citySlug: "london",
    description: {
      en: "A high-density food corridor with restaurants, takeaways, and practical local demand across East Ham.",
      bn: "ইস্ট হ্যাম জুড়ে রেস্টুরেন্ট, টেকঅ্যাওয়ে এবং স্থানীয় চাহিদা সমৃদ্ধ একটি উচ্চ-ঘনত্বের ফুড করিডোর।",
      it: "Un corridoio gastronomico ad alta densità con ristoranti, takeaway e forte domanda locale.",
      fr: "Un corridor alimentaire dense avec restaurants, plats à emporter et forte demande locale.",
      de: "Ein hochverdichteter Food-Korridor mit Restaurants, Takeaways und starker lokaler Nachfrage.",
      es: "Un corredor gastronómico de alta densidad con restaurantes, takeaway y fuerte demanda local.",
      ar: "ممر غذائي عالي الكثافة يضم مطاعم وخيارات تيك أواي وطلبًا محليًا قويًا.",
      zh: "一个高密度餐饮走廊，拥有餐厅、外卖店和稳定的本地需求。",
      ja: "レストランやテイクアウト店が集積し、地域需要が高い高密度フードコリドーです。",
      th: "ย่านอาหารหนาแน่นที่มีร้านอาหารและร้านสั่งกลับบ้านจำนวนมาก พร้อมความต้องการในพื้นที่สูง",
    },
    travelInfo: {
      en: "Visit High Street North by travelling to East Ham Underground Station and walking towards High Street North. The area has local shops, restaurants, takeaways, cafés, and busy East London high-street food places.",
      it: "Visita High Street North raggiungendo East Ham Underground Station e camminando verso High Street North. La zona offre negozi locali, ristoranti, takeaway, caffè e vivaci punti food dell'East London.",
      fr: "Visitez High Street North en vous rendant à East Ham Underground Station puis en marchant vers High Street North. La zone compte des boutiques locales, restaurants, plats à emporter, cafés et adresses animées de l'est de Londres.",
      de: "Besuchen Sie High Street North über East Ham Underground Station und laufen Sie Richtung High Street North. Die Gegend bietet lokale Geschäfte, Restaurants, Takeaways, Cafés und belebte Food-Spots in East London.",
      es: "Visita High Street North viajando hasta East Ham Underground Station y caminando hacia High Street North. La zona cuenta con tiendas locales, restaurantes, comida para llevar, cafeterías y lugares gastronómicos de East London.",
      ar: "يمكنك زيارة High Street North عبر محطة East Ham Underground Station ثم المشي باتجاه High Street North. تضم المنطقة متاجر محلية ومطاعم ومحلات وجبات سريعة ومقاهي وأماكن طعام نشطة في شرق لندن.",
      zh: "前往 High Street North 可到 East Ham Underground Station，然后步行前往 High Street North。该区域有本地商店、餐厅、外卖店、咖啡馆和繁忙的东伦敦高街美食点。",
    },
    editorialIntro:
      "High Street North in East Ham Town Centre is a practical and high-potential food hub with strong community presence and visible restaurant activity — independent restaurants, takeaway businesses, grills, curry houses, sweet shops, and family-focused operators.",
    cuisineTags: ["Bangladeshi", "Pakistani", "Indian"],
    heroImage: "/hubs/high-street-north/hero.jpg",
    gallery: Array.from({ length: 8 }, (_, i) => `/hubs/high-street-north/${i + 1}.jpg`),
    isActive: true,
    seoTitle: "High Street North Food Hub | East Ham, London Food Hubs",
    seoDescription:
      "Explore High Street North — a high-density East Ham food corridor with South Asian restaurants, grills and takeaways.",
  },

  "ilford-lane": {
    id: "ilford-lane",
    slug: "ilford-lane",
    name: "Ilford Lane",
    areaLabel: "Ilford, East London",
    citySlug: "london",
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
    travelInfo: {
      en: "Visit Ilford Lane by travelling to Ilford Station, then walking or taking a short bus ride towards Ilford Lane. The area is well known for restaurants, dessert shops, cafés, family dining, and local food culture.",
      it: "Visita Ilford Lane raggiungendo Ilford Station, poi camminando o prendendo un breve autobus verso Ilford Lane. La zona è nota per ristoranti, dessert shop, caffè, cucina per famiglie e cultura gastronomica locale.",
      fr: "Visitez Ilford Lane en vous rendant à Ilford Station, puis en marchant ou en prenant un court trajet en bus vers Ilford Lane. La zone est connue pour ses restaurants, desserts, cafés, repas en famille et sa culture culinaire locale.",
      de: "Besuchen Sie Ilford Lane über Ilford Station und gehen Sie dann zu Fuß oder nehmen Sie kurz den Bus Richtung Ilford Lane. Die Gegend ist bekannt für Restaurants, Dessert-Shops, Cafés, Familienessen und lokale Food-Kultur.",
      es: "Visita Ilford Lane viajando hasta Ilford Station y luego caminando o tomando un corto autobús hacia Ilford Lane. La zona es conocida por restaurantes, tiendas de postres, cafeterías, comida familiar y cultura gastronómica local.",
      ar: "يمكنك زيارة Ilford Lane عبر محطة Ilford Station، ثم المشي أو ركوب حافلة قصيرة باتجاه Ilford Lane. تشتهر المنطقة بالمطاعم ومحلات الحلويات والمقاهي وتجارب الطعام العائلية والثقافة الغذائية المحلية.",
      zh: "前往 Ilford Lane 可到 Ilford Station，然后步行或乘坐短程巴士前往 Ilford Lane。该区域以餐厅、甜品店、咖啡馆、家庭用餐和本地美食文化闻名。",
    },
    heroImage: "/hubs/ilford-lane/hero-ilford-lane.jpg",
    gallery: ["hero-ilford-lane.jpg", ...Array.from({ length: 9 }, (_, i) => `${i + 1}.jpg`)].map(
      (f) => `/hubs/ilford-lane/${f}`
    ),
    isActive: true,
    seoTitle: "Ilford Lane Food Hub | London Food Hubs",
    seoDescription:
      "Explore Ilford Lane — a very active East London food hub known for grills, sweets and South Asian family dining.",
  },

  "commercial-road": {
    id: "commercial-road",
    slug: "commercial-road",
    name: "Commercial Road",
    areaLabel: "East London",
    citySlug: "london",
    description: {
      en: "A diverse East London food corridor connecting multiple communities with strong multicultural dining potential.",
      bn: "বহু সম্প্রদায়কে সংযুক্ত করা একটি বৈচিত্র্যময় ইস্ট লন্ডন ফুড করিডোর, যেখানে বহুসাংস্কৃতিক ডাইনিং সম্ভাবনা শক্তিশালী।",
      it: "Un corridoio gastronomico diversificato dell'East London che collega più comunità con forte potenziale multiculturale.",
      fr: "Un corridor alimentaire diversifié de l'est de Londres reliant plusieurs communautés avec un fort potentiel multiculturel.",
      de: "Ein vielfältiger Food-Korridor im Osten Londons, der mehrere Communities mit starkem multikulturellem Potenzial verbindet.",
      es: "Un corredor gastronómico diverso del este de Londres que conecta varias comunidades con fuerte potencial multicultural.",
      ar: "ممر غذائي متنوع في شرق لندن يربط عدة مجتمعات مع إمكانات قوية لتناول الطعام متعدد الثقافات.",
      zh: "一条多元化的东伦敦餐饮走廊，连接多个社区，具有很强的多文化餐饮潜力。",
      ja: "複数のコミュニティをつなぐ、多文化的な食の可能性を持つ東ロンドンのフードコリドーです。",
      th: "แนวถนนอาหารที่หลากหลายในอีสต์ลอนดอน เชื่อมหลายชุมชนและมีศักยภาพด้านอาหารหลากหลายวัฒนธรรมสูง",
    },
    isActive: true,
    seoTitle: "Commercial Road Food Hub | London Food Hubs",
    seoDescription:
      "Explore Commercial Road — a diverse East London food corridor connecting multiple communities.",
  },

  "london-street-food": {
    id: "london-street-food",
    slug: "london-street-food",
    name: "London Street Food",
    areaLabel: "Citywide, London",
    citySlug: "london",
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
    travelInfo: {
      en: "Explore London Street Food through selected street-food locations, markets, and pop-up food areas across London. This hub highlights casual food experiences, vendor-led dining, and event-style food spaces around the city.",
      it: "Esplora London Street Food attraverso location di street food selezionate, mercati e aree pop-up in tutta Londra. Questo hub mette in evidenza esperienze informali, venditori indipendenti e spazi food per eventi in città.",
      fr: "Explorez London Street Food à travers des lieux de street food sélectionnés, des marchés et des espaces pop-up dans Londres. Ce hub met en avant des expériences décontractées, des vendeurs indépendants et des espaces culinaires événementiels.",
      de: "Entdecken Sie London Street Food über ausgewählte Street-Food-Standorte, Märkte und Pop-up-Food-Bereiche in ganz London. Dieser Hub zeigt lockere Food-Erlebnisse, anbieterbasierte Gastronomie und Event-Food-Spaces.",
      es: "Explora London Street Food a través de ubicaciones seleccionadas de comida callejera, mercados y zonas pop-up en Londres. Este hub destaca experiencias informales, vendedores independientes y espacios gastronómicos para eventos.",
      ar: "استكشف London Street Food من خلال مواقع مختارة للطعام في الشوارع والأسواق ومناطق الطعام المؤقتة في لندن. يبرز هذا الهب تجارب الطعام غير الرسمية والبائعين المستقلين ومساحات الطعام الخاصة بالفعاليات.",
      zh: "通过伦敦精选街头美食地点、市集和快闪餐饮区域探索 London Street Food。该 hub 展示休闲餐饮体验、摊主主导的美食和城市活动型餐饮空间。",
    },
    heroImage: "/hubs/london-street-food/hero.jpg",
    gallery: ["hero.jpg", ...Array.from({ length: 12 }, (_, i) => `${i + 1}.jpg`)].map(
      (f) => `/hubs/london-street-food/${f}`
    ),
    isActive: true,
    seoTitle: "London Street Food | London Food Hubs",
    seoDescription:
      "Explore London Street Food — street-food sellers, vans, stalls and pop-up food businesses from across London.",
  },
};

export function getHubBySlug(slug: string): FoodHub | undefined {
  return HUBS[slug];
}

export function getAllHubs(): FoodHub[] {
  return Object.values(HUBS).filter((h) => h.isActive);
}

export function getFeaturedHubs(): FoodHub[] {
  return getAllHubs().filter((h) => h.isFeatured);
}
