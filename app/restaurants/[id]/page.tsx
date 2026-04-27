"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type LangKey = "en" | "it" | "fr" | "de" | "es" | "ar" | "zh";

type MenuItem = {
  name: string;
  price: string;
  note?: string;
};

type MenuCategory = {
  category: string;
  items: MenuItem[];
};

type LiveRestaurant = {
  id: string;
  name: string;
  slug?: string;
  ownerUid?: string;
  ownerName?: string;
  phone?: string;
  email?: string;

  hubId?: string;
  hubName?: string;
  area?: string;
  locationId?: string;
  postcode?: string;
  fullAddress?: string;

  cuisine?: string;
  tags?: string[];
  priceRange?: string;

  shortDescription?: string;
  longDescription?: string;
  popularItems?: string[];

  coverImage?: string;
  videoUrl?: string;

  websiteUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;

  openingHoursText?: string;

  dineIn?: boolean;
  takeaway?: boolean;
  delivery?: boolean;
  collectionEnabled?: boolean;

  isHalal?: boolean;
  isHmcApproved?: boolean;

  isPremium?: boolean;
  subscriptionPlan?: "free" | "premium";
  offersEnabled?: boolean;
  loyaltyEnabled?: boolean;
  adsEnabled?: boolean;

  status?: "draft" | "active" | "pending" | "blocked";
  menuCategories?: MenuCategory[];

  createdAt?: any;
  updatedAt?: any;
};

const LANGUAGE_OPTIONS: { key: LangKey; label: string }[] = [
  { key: "en", label: "English" },
  { key: "it", label: "Italiano" },
  { key: "fr", label: "Français" },
  { key: "de", label: "Deutsch" },
  { key: "es", label: "Español" },
  { key: "ar", label: "العربية" },
  { key: "zh", label: "中文" },
];

const pageCopy: Record<
  LangKey,
  {
    loadingTitle: string;
    loadingText: string;
    notFoundTitle: string;
    notFoundText: string;
    backToRestaurants: string;
    editProfile: string;
    coverMissing: string;
    addCoverFromEdit: string;
    liveListing: string;
    pendingApproval: string;
    blocked: string;
    draft: string;
    halal: string;
    hmcApproved: string;
    premium: string;
    defaultShortDescription: string;
    aboutTitle: string;
    planEvent: string;
    owner: string;
    phone: string;
    email: string;
    website: string;
    address: string;
    visitWebsite: string;
    notAdded: string;
    fullDescription: string;
    popularItems: string;
    popularItemsEmpty: string;
    menu: string;
    fullMenuEmpty: string;
    untitledCategory: string;
    unnamedItem: string;
    priceOnRequest: string;
    noItemsInCategory: string;
    status: string;
    quickInfo: string;
    restaurantId: string;
    hub: string;
    area: string;
    cuisine: string;
    openingHours: string;
    locationId: string;
    notAddedYet: string;
    serviceOptions: string;
    noServiceOptions: string;
    onlineLinks: string;
    websiteNotAdded: string;
    facebookNotAdded: string;
    instagramNotAdded: string;
    tiktokNotAdded: string;
    videoNotAdded: string;
    promoVideo: string;
    businessFeatures: string;
    offersEnabled: string;
    loyaltyEnabled: string;
    adsEnabled: string;
    activeStatusText: string;
    pendingStatusText: string;
    blockedStatusText: string;
    draftStatusText: string;
    dineIn: string;
    takeaway: string;
    delivery: string;
    collection: string;
    facebook: string;
    instagram: string;
    language: string;
    location: string;
    locationEmpty: string;
    gallery: string;
    galleryEmpty: string;
    callNow: string;
    emailNow: string;
    openingSoon: string;
    quickActions: string;
  }
> = {
  en: {
    loadingTitle: "Loading restaurant...",
    loadingText: "Please wait while the restaurant details are loaded.",
    notFoundTitle: "Restaurant not found",
    notFoundText:
      "This restaurant has not been added yet or is no longer available.",
    backToRestaurants: "← Back to restaurants",
    editProfile: "Edit profile",
    coverMissing: "Cover image not added yet",
    addCoverFromEdit: "Add cover image from edit page",
    liveListing: "Live Listing",
    pendingApproval: "Pending Approval",
    blocked: "Blocked",
    draft: "Draft",
    halal: "Halal",
    hmcApproved: "HMC Approved",
    premium: "Premium",
    defaultShortDescription:
      "This restaurant is now listed on SmartServeUK. More menu, contact, media, and service details can be added by the owner.",
    aboutTitle: "About this restaurant",
    planEvent: "Plan event with this restaurant",
    owner: "Owner",
    phone: "Phone",
    email: "Email",
    website: "Website",
    address: "Address",
    visitWebsite: "Visit website",
    notAdded: "Not added",
    fullDescription: "Full description",
    popularItems: "Popular items",
    popularItemsEmpty: "Popular items have not been added yet.",
    menu: "Menu",
    fullMenuEmpty: "Full menu has not been added yet.",
    untitledCategory: "Untitled category",
    unnamedItem: "Unnamed item",
    priceOnRequest: "Price on request",
    noItemsInCategory: "No items added in this category yet.",
    status: "Status",
    quickInfo: "Quick info",
    restaurantId: "Restaurant ID",
    hub: "Hub",
    area: "Area",
    cuisine: "Cuisine",
    openingHours: "Opening hours",
    locationId: "Location ID",
    notAddedYet: "Not added yet",
    serviceOptions: "Service options",
    noServiceOptions: "No service options added yet.",
    onlineLinks: "Online links",
    websiteNotAdded: "Website not added",
    facebookNotAdded: "Facebook not added",
    instagramNotAdded: "Instagram not added",
    tiktokNotAdded: "TikTok not added",
    videoNotAdded: "Video not added",
    promoVideo: "Promo video",
    businessFeatures: "Business features",
    offersEnabled: "Offers enabled",
    loyaltyEnabled: "Loyalty enabled",
    adsEnabled: "Ads enabled",
    activeStatusText:
      "This restaurant profile is active and visible on the platform.",
    pendingStatusText:
      "This restaurant profile is waiting for review or approval.",
    blockedStatusText:
      "This restaurant profile is currently blocked from normal listing.",
    draftStatusText:
      "This restaurant profile is currently saved as a draft.",
    dineIn: "Dine-in",
    takeaway: "Takeaway",
    delivery: "Delivery",
    collection: "Collection",
    facebook: "Facebook",
    instagram: "Instagram",
    language: "Language",
    location: "Location",
    locationEmpty: "Location details have not been added yet.",
    gallery: "Photos",
    galleryEmpty: "Photos have not been added yet.",
    callNow: "Call now",
    emailNow: "Email now",
    openingSoon: "Open for discovery on SmartServeUK",
    quickActions: "Quick actions",
  },
  it: {
    loadingTitle: "Caricamento ristorante...",
    loadingText:
      "Attendi mentre vengono caricati i dettagli del ristorante.",
    notFoundTitle: "Ristorante non trovato",
    notFoundText:
      "Questo ristorante non è ancora stato aggiunto o non è più disponibile.",
    backToRestaurants: "← Torna ai ristoranti",
    editProfile: "Modifica profilo",
    coverMissing: "Immagine di copertina non ancora aggiunta",
    addCoverFromEdit: "Aggiungi immagine di copertina dalla pagina di modifica",
    liveListing: "Scheda attiva",
    pendingApproval: "In attesa di approvazione",
    blocked: "Bloccato",
    draft: "Bozza",
    halal: "Halal",
    hmcApproved: "Approvato HMC",
    premium: "Premium",
    defaultShortDescription:
      "Questo ristorante è ora presente su SmartServeUK. Il proprietario può aggiungere altri dettagli su menu, contatti, media e servizi.",
    aboutTitle: "Informazioni su questo ristorante",
    planEvent: "Pianifica un evento con questo ristorante",
    owner: "Proprietario",
    phone: "Telefono",
    email: "Email",
    website: "Sito web",
    address: "Indirizzo",
    visitWebsite: "Visita il sito",
    notAdded: "Non aggiunto",
    fullDescription: "Descrizione completa",
    popularItems: "Piatti popolari",
    popularItemsEmpty: "I piatti popolari non sono ancora stati aggiunti.",
    menu: "Menu",
    fullMenuEmpty: "Il menu completo non è ancora stato aggiunto.",
    untitledCategory: "Categoria senza titolo",
    unnamedItem: "Articolo senza nome",
    priceOnRequest: "Prezzo su richiesta",
    noItemsInCategory: "Nessun articolo ancora aggiunto in questa categoria.",
    status: "Stato",
    quickInfo: "Informazioni rapide",
    restaurantId: "ID ristorante",
    hub: "Hub",
    area: "Zona",
    cuisine: "Cucina",
    openingHours: "Orari di apertura",
    locationId: "ID posizione",
    notAddedYet: "Non ancora aggiunto",
    serviceOptions: "Opzioni di servizio",
    noServiceOptions: "Nessuna opzione di servizio ancora aggiunta.",
    onlineLinks: "Link online",
    websiteNotAdded: "Sito web non aggiunto",
    facebookNotAdded: "Facebook non aggiunto",
    instagramNotAdded: "Instagram non aggiunto",
    tiktokNotAdded: "TikTok non aggiunto",
    videoNotAdded: "Video non aggiunto",
    promoVideo: "Video promozionale",
    businessFeatures: "Funzionalità aziendali",
    offersEnabled: "Offerte abilitate",
    loyaltyEnabled: "Fedeltà abilitata",
    adsEnabled: "Pubblicità abilitata",
    activeStatusText:
      "Questo profilo ristorante è attivo e visibile sulla piattaforma.",
    pendingStatusText:
      "Questo profilo ristorante è in attesa di revisione o approvazione.",
    blockedStatusText:
      "Questo profilo ristorante è attualmente bloccato dall'elenco normale.",
    draftStatusText:
      "Questo profilo ristorante è attualmente salvato come bozza.",
    dineIn: "Consumazione sul posto",
    takeaway: "Asporto",
    delivery: "Consegna",
    collection: "Ritiro",
    facebook: "Facebook",
    instagram: "Instagram",
    language: "Lingua",
    location: "Posizione",
    locationEmpty: "I dettagli della posizione non sono ancora stati aggiunti.",
    gallery: "Foto",
    galleryEmpty: "Le foto non sono ancora state aggiunte.",
    callNow: "Chiama ora",
    emailNow: "Invia email",
    openingSoon: "Scopribile su SmartServeUK",
    quickActions: "Azioni rapide",
  },
  fr: {
    loadingTitle: "Chargement du restaurant...",
    loadingText:
      "Veuillez patienter pendant le chargement des détails du restaurant.",
    notFoundTitle: "Restaurant introuvable",
    notFoundText:
      "Ce restaurant n'a pas encore été ajouté ou n'est plus disponible.",
    backToRestaurants: "← Retour aux restaurants",
    editProfile: "Modifier le profil",
    coverMissing: "Image de couverture non encore ajoutée",
    addCoverFromEdit: "Ajoutez une image de couverture depuis la page d’édition",
    liveListing: "Annonce en ligne",
    pendingApproval: "En attente d'approbation",
    blocked: "Bloqué",
    draft: "Brouillon",
    halal: "Halal",
    hmcApproved: "Approuvé HMC",
    premium: "Premium",
    defaultShortDescription:
      "Ce restaurant est désormais répertorié sur SmartServeUK. Le propriétaire peut ajouter davantage de détails sur le menu, les contacts, les médias et les services.",
    aboutTitle: "À propos de ce restaurant",
    planEvent: "Planifier un événement avec ce restaurant",
    owner: "Propriétaire",
    phone: "Téléphone",
    email: "Email",
    website: "Site web",
    address: "Adresse",
    visitWebsite: "Visiter le site",
    notAdded: "Non ajouté",
    fullDescription: "Description complète",
    popularItems: "Plats populaires",
    popularItemsEmpty: "Les plats populaires n'ont pas encore été ajoutés.",
    menu: "Menu",
    fullMenuEmpty: "Le menu complet n'a pas encore été ajouté.",
    untitledCategory: "Catégorie sans titre",
    unnamedItem: "Élément sans nom",
    priceOnRequest: "Prix sur demande",
    noItemsInCategory:
      "Aucun élément n'a encore été ajouté dans cette catégorie.",
    status: "Statut",
    quickInfo: "Infos rapides",
    restaurantId: "ID du restaurant",
    hub: "Hub",
    area: "Zone",
    cuisine: "Cuisine",
    openingHours: "Heures d'ouverture",
    locationId: "ID de localisation",
    notAddedYet: "Pas encore ajouté",
    serviceOptions: "Options de service",
    noServiceOptions: "Aucune option de service ajoutée pour le moment.",
    onlineLinks: "Liens en ligne",
    websiteNotAdded: "Site web non ajouté",
    facebookNotAdded: "Facebook non ajouté",
    instagramNotAdded: "Instagram non ajouté",
    tiktokNotAdded: "TikTok non ajouté",
    videoNotAdded: "Vidéo non ajoutée",
    promoVideo: "Vidéo promotionnelle",
    businessFeatures: "Fonctionnalités business",
    offersEnabled: "Offres activées",
    loyaltyEnabled: "Fidélité activée",
    adsEnabled: "Publicités activées",
    activeStatusText:
      "Ce profil de restaurant est actif et visible sur la plateforme.",
    pendingStatusText:
      "Ce profil de restaurant est en attente d'examen ou d'approbation.",
    blockedStatusText:
      "Ce profil de restaurant est actuellement bloqué de l'affichage normal.",
    draftStatusText:
      "Ce profil de restaurant est actuellement enregistré comme brouillon.",
    dineIn: "Sur place",
    takeaway: "À emporter",
    delivery: "Livraison",
    collection: "Retrait",
    facebook: "Facebook",
    instagram: "Instagram",
    language: "Langue",
    location: "Localisation",
    locationEmpty: "Les informations de localisation n'ont pas encore été ajoutées.",
    gallery: "Photos",
    galleryEmpty: "Aucune photo n'a encore été ajoutée.",
    callNow: "Appeler",
    emailNow: "Envoyer un email",
    openingSoon: "Visible sur SmartServeUK",
    quickActions: "Actions rapides",
  },
  de: {
    loadingTitle: "Restaurant wird geladen...",
    loadingText:
      "Bitte warten Sie, während die Restaurantdetails geladen werden.",
    notFoundTitle: "Restaurant nicht gefunden",
    notFoundText:
      "Dieses Restaurant wurde noch nicht hinzugefügt oder ist nicht mehr verfügbar.",
    backToRestaurants: "← Zurück zu den Restaurants",
    editProfile: "Profil bearbeiten",
    coverMissing: "Titelbild noch nicht hinzugefügt",
    addCoverFromEdit: "Titelbild über die Bearbeitungsseite hinzufügen",
    liveListing: "Live-Eintrag",
    pendingApproval: "Wartet auf Genehmigung",
    blocked: "Blockiert",
    draft: "Entwurf",
    halal: "Halal",
    hmcApproved: "HMC-zertifiziert",
    premium: "Premium",
    defaultShortDescription:
      "Dieses Restaurant ist jetzt auf SmartServeUK gelistet. Weitere Menü-, Kontakt-, Medien- und Servicedetails können vom Eigentümer hinzugefügt werden.",
    aboutTitle: "Über dieses Restaurant",
    planEvent: "Event mit diesem Restaurant planen",
    owner: "Inhaber",
    phone: "Telefon",
    email: "E-Mail",
    website: "Website",
    address: "Adresse",
    visitWebsite: "Website besuchen",
    notAdded: "Nicht hinzugefügt",
    fullDescription: "Vollständige Beschreibung",
    popularItems: "Beliebte Artikel",
    popularItemsEmpty: "Beliebte Artikel wurden noch nicht hinzugefügt.",
    menu: "Menü",
    fullMenuEmpty: "Das vollständige Menü wurde noch nicht hinzugefügt.",
    untitledCategory: "Unbenannte Kategorie",
    unnamedItem: "Unbenannter Artikel",
    priceOnRequest: "Preis auf Anfrage",
    noItemsInCategory:
      "In dieser Kategorie wurden noch keine Artikel hinzugefügt.",
    status: "Status",
    quickInfo: "Kurzinfo",
    restaurantId: "Restaurant-ID",
    hub: "Hub",
    area: "Gebiet",
    cuisine: "Küche",
    openingHours: "Öffnungszeiten",
    locationId: "Standort-ID",
    notAddedYet: "Noch nicht hinzugefügt",
    serviceOptions: "Serviceoptionen",
    noServiceOptions: "Noch keine Serviceoptionen hinzugefügt.",
    onlineLinks: "Online-Links",
    websiteNotAdded: "Website nicht hinzugefügt",
    facebookNotAdded: "Facebook nicht hinzugefügt",
    instagramNotAdded: "Instagram nicht hinzugefügt",
    tiktokNotAdded: "TikTok nicht hinzugefügt",
    videoNotAdded: "Video nicht hinzugefügt",
    promoVideo: "Promo-Video",
    businessFeatures: "Geschäftsfunktionen",
    offersEnabled: "Angebote aktiviert",
    loyaltyEnabled: "Treueprogramm aktiviert",
    adsEnabled: "Werbung aktiviert",
    activeStatusText:
      "Dieses Restaurantprofil ist aktiv und auf der Plattform sichtbar.",
    pendingStatusText:
      "Dieses Restaurantprofil wartet auf Prüfung oder Genehmigung.",
    blockedStatusText:
      "Dieses Restaurantprofil ist derzeit für normale Listung gesperrt.",
    draftStatusText:
      "Dieses Restaurantprofil ist derzeit als Entwurf gespeichert.",
    dineIn: "Vor Ort",
    takeaway: "Zum Mitnehmen",
    delivery: "Lieferung",
    collection: "Abholung",
    facebook: "Facebook",
    instagram: "Instagram",
    language: "Sprache",
    location: "Standort",
    locationEmpty: "Standortdetails wurden noch nicht hinzugefügt.",
    gallery: "Fotos",
    galleryEmpty: "Fotos wurden noch nicht hinzugefügt.",
    callNow: "Jetzt anrufen",
    emailNow: "Jetzt mailen",
    openingSoon: "Auf SmartServeUK sichtbar",
    quickActions: "Schnellaktionen",
  },
  es: {
    loadingTitle: "Cargando restaurante...",
    loadingText: "Espera mientras se cargan los detalles del restaurante.",
    notFoundTitle: "Restaurante no encontrado",
    notFoundText:
      "Este restaurante aún no ha sido añadido o ya no está disponible.",
    backToRestaurants: "← Volver a restaurantes",
    editProfile: "Editar perfil",
    coverMissing: "Imagen de portada aún no añadida",
    addCoverFromEdit: "Añade la imagen de portada desde la página de edición",
    liveListing: "Listado activo",
    pendingApproval: "Pendiente de aprobación",
    blocked: "Bloqueado",
    draft: "Borrador",
    halal: "Halal",
    hmcApproved: "Aprobado por HMC",
    premium: "Premium",
    defaultShortDescription:
      "Este restaurante ya figura en SmartServeUK. El propietario puede añadir más detalles sobre menú, contacto, medios y servicios.",
    aboutTitle: "Sobre este restaurante",
    planEvent: "Planificar evento con este restaurante",
    owner: "Propietario",
    phone: "Teléfono",
    email: "Correo electrónico",
    website: "Sitio web",
    address: "Dirección",
    visitWebsite: "Visitar sitio web",
    notAdded: "No añadido",
    fullDescription: "Descripción completa",
    popularItems: "Platos populares",
    popularItemsEmpty: "Aún no se han añadido platos populares.",
    menu: "Menú",
    fullMenuEmpty: "El menú completo aún no se ha añadido.",
    untitledCategory: "Categoría sin título",
    unnamedItem: "Elemento sin nombre",
    priceOnRequest: "Precio a consultar",
    noItemsInCategory:
      "Todavía no se han añadido elementos en esta categoría.",
    status: "Estado",
    quickInfo: "Información rápida",
    restaurantId: "ID del restaurante",
    hub: "Hub",
    area: "Zona",
    cuisine: "Cocina",
    openingHours: "Horario de apertura",
    locationId: "ID de ubicación",
    notAddedYet: "Aún no añadido",
    serviceOptions: "Opciones de servicio",
    noServiceOptions: "Aún no se han añadido opciones de servicio.",
    onlineLinks: "Enlaces en línea",
    websiteNotAdded: "Sitio web no añadido",
    facebookNotAdded: "Facebook no añadido",
    instagramNotAdded: "Instagram no añadido",
    tiktokNotAdded: "TikTok no añadido",
    videoNotAdded: "Vídeo no añadido",
    promoVideo: "Vídeo promocional",
    businessFeatures: "Funciones comerciales",
    offersEnabled: "Ofertas habilitadas",
    loyaltyEnabled: "Fidelidad habilitada",
    adsEnabled: "Anuncios habilitados",
    activeStatusText:
      "Este perfil de restaurante está activo y visible en la plataforma.",
    pendingStatusText:
      "Este perfil de restaurante está esperando revisión o aprobación.",
    blockedStatusText:
      "Este perfil de restaurante está actualmente bloqueado del listado normal.",
    draftStatusText:
      "Este perfil de restaurante está guardado actualmente como borrador.",
    dineIn: "Comer en el local",
    takeaway: "Para llevar",
    delivery: "Entrega",
    collection: "Recogida",
    facebook: "Facebook",
    instagram: "Instagram",
    language: "Idioma",
    location: "Ubicación",
    locationEmpty: "Los detalles de ubicación aún no se han añadido.",
    gallery: "Fotos",
    galleryEmpty: "Aún no se han añadido fotos.",
    callNow: "Llamar ahora",
    emailNow: "Enviar email",
    openingSoon: "Visible en SmartServeUK",
    quickActions: "Acciones rápidas",
  },
  ar: {
    loadingTitle: "جاري تحميل المطعم...",
    loadingText: "يرجى الانتظار أثناء تحميل تفاصيل المطعم.",
    notFoundTitle: "المطعم غير موجود",
    notFoundText: "هذا المطعم لم تتم إضافته بعد أو لم يعد متاحًا.",
    backToRestaurants: "العودة إلى المطاعم →",
    editProfile: "تعديل الملف",
    coverMissing: "لم تتم إضافة صورة الغلاف بعد",
    addCoverFromEdit: "أضف صورة الغلاف من صفحة التعديل",
    liveListing: "إدراج مباشر",
    pendingApproval: "بانتظار الموافقة",
    blocked: "محظور",
    draft: "مسودة",
    halal: "حلال",
    hmcApproved: "معتمد من HMC",
    premium: "بريميوم",
    defaultShortDescription:
      "هذا المطعم مدرج الآن على SmartServeUK. يمكن للمالك إضافة المزيد من تفاصيل القائمة والتواصل والوسائط والخدمات.",
    aboutTitle: "حول هذا المطعم",
    planEvent: "خطط فعالية مع هذا المطعم",
    owner: "المالك",
    phone: "الهاتف",
    email: "البريد الإلكتروني",
    website: "الموقع الإلكتروني",
    address: "العنوان",
    visitWebsite: "زيارة الموقع",
    notAdded: "غير مضاف",
    fullDescription: "الوصف الكامل",
    popularItems: "الأصناف المشهورة",
    popularItemsEmpty: "لم تتم إضافة الأصناف المشهورة بعد.",
    menu: "القائمة",
    fullMenuEmpty: "لم تتم إضافة القائمة الكاملة بعد.",
    untitledCategory: "فئة بدون عنوان",
    unnamedItem: "عنصر بدون اسم",
    priceOnRequest: "السعر عند الطلب",
    noItemsInCategory: "لم تتم إضافة عناصر في هذه الفئة بعد.",
    status: "الحالة",
    quickInfo: "معلومات سريعة",
    restaurantId: "معرّف المطعم",
    hub: "المركز",
    area: "المنطقة",
    cuisine: "المطبخ",
    openingHours: "ساعات العمل",
    locationId: "معرّف الموقع",
    notAddedYet: "لم تتم إضافته بعد",
    serviceOptions: "خيارات الخدمة",
    noServiceOptions: "لم تتم إضافة خيارات خدمة بعد.",
    onlineLinks: "الروابط الإلكترونية",
    websiteNotAdded: "لم تتم إضافة الموقع",
    facebookNotAdded: "لم تتم إضافة فيسبوك",
    instagramNotAdded: "لم تتم إضافة إنستغرام",
    tiktokNotAdded: "لم تتم إضافة تيك توك",
    videoNotAdded: "لم تتم إضافة الفيديو",
    promoVideo: "فيديو ترويجي",
    businessFeatures: "ميزات الأعمال",
    offersEnabled: "العروض مفعلة",
    loyaltyEnabled: "الولاء مفعل",
    adsEnabled: "الإعلانات مفعلة",
    activeStatusText: "ملف هذا المطعم نشط ومرئي على المنصة.",
    pendingStatusText: "ملف هذا المطعم بانتظار المراجعة أو الموافقة.",
    blockedStatusText: "ملف هذا المطعم محظور حاليًا من الإدراج العادي.",
    draftStatusText: "ملف هذا المطعم محفوظ حاليًا كمسودة.",
    dineIn: "الأكل داخل المطعم",
    takeaway: "سفري",
    delivery: "توصيل",
    collection: "استلام",
    facebook: "فيسبوك",
    instagram: "إنستغرام",
    language: "اللغة",
    location: "الموقع",
    locationEmpty: "لم تتم إضافة تفاصيل الموقع بعد.",
    gallery: "الصور",
    galleryEmpty: "لم تتم إضافة صور بعد.",
    callNow: "اتصل الآن",
    emailNow: "أرسل بريداً",
    openingSoon: "ظاهر على SmartServeUK",
    quickActions: "إجراءات سريعة",
  },
  zh: {
    loadingTitle: "正在加载餐厅...",
    loadingText: "请稍候，正在加载餐厅详情。",
    notFoundTitle: "未找到餐厅",
    notFoundText: "该餐厅尚未添加或已不可用。",
    backToRestaurants: "← 返回餐厅列表",
    editProfile: "编辑资料",
    coverMissing: "尚未添加封面图片",
    addCoverFromEdit: "请在编辑页面添加封面图片",
    liveListing: "已上线",
    pendingApproval: "待审核",
    blocked: "已封禁",
    draft: "草稿",
    halal: "清真",
    hmcApproved: "HMC 认证",
    premium: "高级",
    defaultShortDescription:
      "该餐厅现已列入 SmartServeUK。店主可添加更多菜单、联系信息、媒体和服务详情。",
    aboutTitle: "关于这家餐厅",
    planEvent: "用这家餐厅规划活动",
    owner: "所有者",
    phone: "电话",
    email: "电子邮箱",
    website: "网站",
    address: "地址",
    visitWebsite: "访问网站",
    notAdded: "未添加",
    fullDescription: "完整描述",
    popularItems: "热门菜品",
    popularItemsEmpty: "尚未添加热门菜品。",
    menu: "菜单",
    fullMenuEmpty: "尚未添加完整菜单。",
    untitledCategory: "未命名分类",
    unnamedItem: "未命名菜品",
    priceOnRequest: "价格面议",
    noItemsInCategory: "该分类中尚未添加菜品。",
    status: "状态",
    quickInfo: "快速信息",
    restaurantId: "餐厅 ID",
    hub: "中心",
    area: "区域",
    cuisine: "菜系",
    openingHours: "营业时间",
    locationId: "位置 ID",
    notAddedYet: "尚未添加",
    serviceOptions: "服务选项",
    noServiceOptions: "尚未添加服务选项。",
    onlineLinks: "在线链接",
    websiteNotAdded: "尚未添加网站",
    facebookNotAdded: "尚未添加 Facebook",
    instagramNotAdded: "尚未添加 Instagram",
    tiktokNotAdded: "尚未添加 TikTok",
    videoNotAdded: "尚未添加视频",
    promoVideo: "宣传视频",
    businessFeatures: "商业功能",
    offersEnabled: "已启用优惠",
    loyaltyEnabled: "已启用会员忠诚",
    adsEnabled: "已启用广告",
    activeStatusText: "该餐厅资料已激活并在平台上可见。",
    pendingStatusText: "该餐厅资料正在等待审核或批准。",
    blockedStatusText: "该餐厅资料当前被禁止正常展示。",
    draftStatusText: "该餐厅资料当前保存为草稿。",
    dineIn: "堂食",
    takeaway: "外卖",
    delivery: "配送",
    collection: "自取",
    facebook: "Facebook",
    instagram: "Instagram",
    language: "语言",
    location: "位置",
    locationEmpty: "尚未添加位置详情。",
    gallery: "照片",
    galleryEmpty: "尚未添加照片。",
    callNow: "立即致电",
    emailNow: "发送邮件",
    openingSoon: "已在 SmartServeUK 展示",
    quickActions: "快捷操作",
  },
};

function normalizeUrl(url?: string) {
  const trimmed = (url || "").trim();
  if (!trimmed) return "";
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:")
  ) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function safeText(value?: string) {
  return (value || "").trim();
}

export default function RestaurantDetailPage() {
  const params = useParams();
  const rawId = String(params?.id || "");

  const [restaurant, setRestaurant] = useState<LiveRestaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<LangKey>("en");

  useEffect(() => {
    const savedLang = localStorage.getItem("lang") as LangKey | null;
    if (savedLang && LANGUAGE_OPTIONS.some((l) => l.key === savedLang)) {
      setLang(savedLang);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);

  useEffect(() => {
    async function loadRestaurant() {
      try {
        setLoading(true);

        if (!rawId) {
          setRestaurant(null);
          return;
        }

        const snap = await getDoc(doc(db, "restaurants", rawId));

        if (!snap.exists()) {
          setRestaurant(null);
          return;
        }

        const data = snap.data() as Omit<LiveRestaurant, "id">;

        setRestaurant({
          id: snap.id,
          ...data,
        });
      } catch (error) {
        console.error("Failed to load restaurant details:", error);
        setRestaurant(null);
      } finally {
        setLoading(false);
      }
    }

    loadRestaurant();
  }, [rawId]);

  const copy = pageCopy[lang];
  const isRtl = lang === "ar";

  const serviceLabels = useMemo(() => {
    if (!restaurant) return [];

    const labels: string[] = [];
    if (restaurant.dineIn) labels.push(copy.dineIn);
    if (restaurant.takeaway) labels.push(copy.takeaway);
    if (restaurant.delivery) labels.push(copy.delivery);
    if (restaurant.collectionEnabled) labels.push(copy.collection);
    return labels;
  }, [restaurant, copy]);

  const visibleMenuCategories = useMemo(() => {
    return (restaurant?.menuCategories || [])
      .map((cat) => ({
        category: safeText(cat?.category),
        items: Array.isArray(cat?.items)
          ? cat.items.filter(
              (item) =>
                safeText(item?.name) ||
                safeText(item?.price) ||
                safeText(item?.note)
            )
          : [],
      }))
      .filter((cat) => cat.category || cat.items.length > 0);
  }, [restaurant]);

  const websiteUrl = normalizeUrl(restaurant?.websiteUrl);
  const facebookUrl = normalizeUrl(restaurant?.facebookUrl);
  const instagramUrl = normalizeUrl(restaurant?.instagramUrl);
  const tiktokUrl = normalizeUrl(restaurant?.tiktokUrl);
  const videoUrl = normalizeUrl(restaurant?.videoUrl);
  const phoneHref = safeText(restaurant?.phone)
    ? `tel:${safeText(restaurant?.phone)}`
    : "";
  const emailHref = safeText(restaurant?.email)
    ? `mailto:${safeText(restaurant?.email)}`
    : "";

  const locationText =
    safeText(restaurant?.fullAddress) ||
    [safeText(restaurant?.area), safeText(restaurant?.postcode)]
      .filter(Boolean)
      .join(", ");

  if (loading) {
    return (
      <main
        dir={isRtl ? "rtl" : "ltr"}
        className="min-h-screen bg-neutral-50 px-4 py-8 md:px-6"
      >
        <div className="mx-auto max-w-6xl rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-neutral-900">
            {copy.loadingTitle}
          </h1>
          <p className="mt-3 text-neutral-600">{copy.loadingText}</p>
        </div>
      </main>
    );
  }

  if (!restaurant) {
    return (
      <main
        dir={isRtl ? "rtl" : "ltr"}
        className="min-h-screen bg-neutral-50 px-4 py-8 md:px-6"
      >
        <div className="mx-auto max-w-6xl rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-neutral-900">
            {copy.notFoundTitle}
          </h1>
          <p className="mt-3 text-neutral-600">{copy.notFoundText}</p>
          <Link
            href="/restaurants"
            className="mt-6 inline-flex rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
          >
            {copy.backToRestaurants}
          </Link>
        </div>
      </main>
    );
  }

  const statusLabel =
    restaurant.status === "active"
      ? copy.liveListing
      : restaurant.status === "pending"
      ? copy.pendingApproval
      : restaurant.status === "blocked"
      ? copy.blocked
      : copy.draft;

  const statusBadgeClass =
    restaurant.status === "active"
      ? "bg-green-100 text-green-800"
      : restaurant.status === "pending"
      ? "bg-amber-100 text-amber-800"
      : restaurant.status === "blocked"
      ? "bg-red-100 text-red-800"
      : "bg-neutral-200 text-neutral-700";

  const statusDescription =
    restaurant.status === "active"
      ? copy.activeStatusText
      : restaurant.status === "pending"
      ? copy.pendingStatusText
      : restaurant.status === "blocked"
      ? copy.blockedStatusText
      : copy.draftStatusText;

  return (
    <main
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen bg-neutral-50 px-4 py-8 md:px-6"
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-3">
            <Link
              href="/restaurants"
              className="inline-flex rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              {copy.backToRestaurants}
            </Link>

            <Link
              href={`/restaurants/${restaurant.id}/edit`}
              className="inline-flex rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              {copy.editProfile}
            </Link>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {copy.language}
            </span>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as LangKey)}
              className="rounded-lg border border-neutral-300 px-2 py-1 text-sm outline-none focus:border-black"
            >
              {LANGUAGE_OPTIONS.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
          {safeText(restaurant.coverImage) ? (
            <div className="relative h-64 w-full bg-neutral-100 md:h-96">
              <img
                src={restaurant.coverImage}
                alt={restaurant.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/50 via-black/10 to-transparent" />
            </div>
          ) : (
            <div className="flex h-56 flex-col items-center justify-center bg-neutral-200 px-6 text-center md:h-72">
              <div className="text-lg font-semibold text-neutral-700">
                {copy.coverMissing}
              </div>
              <div className="mt-2 text-sm text-neutral-500">
                {copy.addCoverFromEdit}
              </div>
            </div>
          )}

          <div className="p-8">
            <div className="flex flex-wrap items-center gap-2">
              {safeText(restaurant.hubName) ? (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                  {restaurant.hubName}
                </span>
              ) : null}

              {safeText(restaurant.cuisine) ? (
                <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
                  {restaurant.cuisine}
                </span>
              ) : null}

              {safeText(restaurant.priceRange) ? (
                <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
                  {restaurant.priceRange}
                </span>
              ) : null}

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass}`}
              >
                {statusLabel}
              </span>

              {restaurant.isHalal ? (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                  {copy.halal}
                </span>
              ) : null}

              {restaurant.isHmcApproved ? (
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                  {copy.hmcApproved}
                </span>
              ) : null}

              {restaurant.isPremium ? (
                <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800">
                  {copy.premium}
                </span>
              ) : null}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <div className="text-sm font-medium text-neutral-500">
                  {copy.openingSoon}
                </div>

                <h1 className="mt-2 text-3xl font-bold text-neutral-900 md:text-5xl">
                  {restaurant.name}
                </h1>

                <p className="mt-4 max-w-4xl text-base leading-7 text-neutral-700">
                  {safeText(restaurant.shortDescription) ||
                    copy.defaultShortDescription}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {phoneHref ? (
                  <a
                    href={phoneHref}
                    className="inline-flex rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
                  >
                    {copy.callNow}
                  </a>
                ) : null}

                {emailHref ? (
                  <a
                    href={emailHref}
                    className="inline-flex rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                  >
                    {copy.emailNow}
                  </a>
                ) : null}

                <Link
                  href="/events/new"
                  className="inline-flex rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  {copy.planEvent}
                </Link>
              </div>
            </div>

            {restaurant.tags && restaurant.tags.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {restaurant.tags
                  .filter((tag) => safeText(tag))
                  .map((tag, index) => (
                    <span
                      key={`${tag}-${index}`}
                      className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-700"
                    >
                      {tag}
                    </span>
                  ))}
              </div>
            ) : null}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="space-y-6 lg:col-span-2">
            <section className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-neutral-900">
                  {copy.aboutTitle}
                </h2>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-neutral-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    {copy.owner}
                  </div>
                  <div className="mt-2 text-sm font-medium text-neutral-900">
                    {safeText(restaurant.ownerName) || copy.notAdded}
                  </div>
                </div>

                <div className="rounded-2xl bg-neutral-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    {copy.phone}
                  </div>
                  <div className="mt-2 text-sm font-medium text-neutral-900">
                    {safeText(restaurant.phone) || copy.notAdded}
                  </div>
                </div>

                <div className="rounded-2xl bg-neutral-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    {copy.email}
                  </div>
                  <div className="mt-2 break-all text-sm font-medium text-neutral-900">
                    {safeText(restaurant.email) || copy.notAdded}
                  </div>
                </div>

                <div className="rounded-2xl bg-neutral-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    {copy.website}
                  </div>
                  <div className="mt-2 text-sm font-medium text-neutral-900">
                    {websiteUrl ? (
                      <a
                        href={websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="break-all text-amber-700 underline underline-offset-4"
                      >
                        {copy.visitWebsite}
                      </a>
                    ) : (
                      copy.notAdded
                    )}
                  </div>
                </div>

                <div className="rounded-2xl bg-neutral-50 p-4 md:col-span-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    {copy.address}
                  </div>
                  <div className="mt-2 text-sm font-medium text-neutral-900">
                    {locationText || copy.notAdded}
                  </div>
                </div>
              </div>

              {safeText(restaurant.longDescription) ? (
                <div className="mt-6 rounded-2xl border border-neutral-200 p-5">
                  <div className="text-sm font-semibold text-neutral-900">
                    {copy.fullDescription}
                  </div>
                  <p className="mt-3 whitespace-pre-line text-sm leading-7 text-neutral-700">
                    {restaurant.longDescription}
                  </p>
                </div>
              ) : null}
            </section>

            <section className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-neutral-900">
                {copy.popularItems}
              </h2>

              {restaurant.popularItems &&
              restaurant.popularItems.filter((item) => safeText(item)).length >
                0 ? (
                <div className="mt-6 flex flex-wrap gap-3">
                  {restaurant.popularItems
                    .filter((item) => safeText(item))
                    .map((item, index) => (
                      <span
                        key={`${item}-${index}`}
                        className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-medium text-neutral-800"
                      >
                        {item}
                      </span>
                    ))}
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 p-6 text-sm text-neutral-500">
                  {copy.popularItemsEmpty}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-neutral-900">
                {copy.menu}
              </h2>

              {visibleMenuCategories.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 p-6 text-sm text-neutral-500">
                  {copy.fullMenuEmpty}
                </div>
              ) : (
                <div className="mt-6 space-y-5">
                  {visibleMenuCategories.map((category, categoryIndex) => (
                    <div
                      key={`${category.category}-${categoryIndex}`}
                      className="rounded-2xl border border-neutral-200 p-5"
                    >
                      <h3 className="text-lg font-semibold text-neutral-900">
                        {category.category || copy.untitledCategory}
                      </h3>

                      {category.items && category.items.length > 0 ? (
                        <div className="mt-4 space-y-3">
                          {category.items.map((item, itemIndex) => (
                            <div
                              key={`${item.name}-${itemIndex}`}
                              className="rounded-xl bg-neutral-50 p-4"
                            >
                              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                                <div>
                                  <div className="text-sm font-semibold text-neutral-900">
                                    {safeText(item.name) || copy.unnamedItem}
                                  </div>
                                  {safeText(item.note) ? (
                                    <div className="mt-1 text-sm text-neutral-600">
                                      {item.note}
                                    </div>
                                  ) : null}
                                </div>

                                <div className="text-sm font-semibold text-neutral-900">
                                  {safeText(item.price) || copy.priceOnRequest}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-4 rounded-xl border border-dashed border-neutral-300 p-4 text-sm text-neutral-500">
                          {copy.noItemsInCategory}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-neutral-900">
                {copy.location}
              </h2>

              {locationText ? (
                <div className="mt-6 rounded-2xl bg-neutral-50 p-6">
                  <div className="text-lg font-semibold text-neutral-900">
                    {locationText}
                  </div>
                  {safeText(restaurant.hubName) || safeText(restaurant.area) ? (
                    <div className="mt-3 text-sm text-neutral-600">
                      {[safeText(restaurant.hubName), safeText(restaurant.area)]
                        .filter(Boolean)
                        .join(" • ")}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 p-6 text-sm text-neutral-500">
                  {copy.locationEmpty}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-neutral-900">
                {copy.gallery}
              </h2>

              <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 p-8 text-sm text-neutral-500">
                {copy.galleryEmpty}
              </div>
            </section>
          </section>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-neutral-900">
                {copy.quickActions}
              </h2>

              <div className="mt-4 flex flex-col gap-3">
                {phoneHref ? (
                  <a
                    href={phoneHref}
                    className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
                  >
                    {copy.callNow}
                  </a>
                ) : null}

                {emailHref ? (
                  <a
                    href={emailHref}
                    className="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                  >
                    {copy.emailNow}
                  </a>
                ) : null}

                <Link
                  href="/events/new"
                  className="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  {copy.planEvent}
                </Link>
              </div>
            </section>

            <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-neutral-900">
                {copy.status}
              </h2>
              <div className="mt-4">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass}`}
                >
                  {statusLabel}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-neutral-600">
                {statusDescription}
              </p>
            </section>

            <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-neutral-900">
                {copy.quickInfo}
              </h2>

              <div className="mt-4 space-y-3 text-sm text-neutral-700">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-neutral-500">{copy.restaurantId}</span>
                  <span className="break-all text-right font-medium text-neutral-900">
                    {restaurant.id}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <span className="text-neutral-500">{copy.hub}</span>
                  <span className="text-right font-medium text-neutral-900">
                    {safeText(restaurant.hubName) || copy.notAdded}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <span className="text-neutral-500">{copy.area}</span>
                  <span className="text-right font-medium text-neutral-900">
                    {safeText(restaurant.area) || copy.notAdded}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <span className="text-neutral-500">{copy.cuisine}</span>
                  <span className="text-right font-medium text-neutral-900">
                    {safeText(restaurant.cuisine) || copy.notAdded}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <span className="text-neutral-500">{copy.openingHours}</span>
                  <span className="whitespace-pre-line text-right font-medium text-neutral-900">
                    {safeText(restaurant.openingHoursText) || copy.notAddedYet}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <span className="text-neutral-500">{copy.locationId}</span>
                  <span className="text-right font-medium text-neutral-900">
                    {safeText(restaurant.locationId) || copy.notAdded}
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-neutral-900">
                {copy.serviceOptions}
              </h2>

              {serviceLabels.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {serviceLabels.map((label) => (
                    <span
                      key={label}
                      className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="mt-4 text-sm text-neutral-500">
                  {copy.noServiceOptions}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-neutral-900">
                {copy.onlineLinks}
              </h2>

              <div className="mt-4 space-y-3 text-sm">
                <div>
                  {websiteUrl ? (
                    <a
                      href={websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="break-all font-medium text-amber-700 underline underline-offset-4"
                    >
                      {copy.website}
                    </a>
                  ) : (
                    <span className="text-neutral-500">
                      {copy.websiteNotAdded}
                    </span>
                  )}
                </div>

                <div>
                  {facebookUrl ? (
                    <a
                      href={facebookUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="break-all font-medium text-amber-700 underline underline-offset-4"
                    >
                      {copy.facebook}
                    </a>
                  ) : (
                    <span className="text-neutral-500">
                      {copy.facebookNotAdded}
                    </span>
                  )}
                </div>

                <div>
                  {instagramUrl ? (
                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="break-all font-medium text-amber-700 underline underline-offset-4"
                    >
                      {copy.instagram}
                    </a>
                  ) : (
                    <span className="text-neutral-500">
                      {copy.instagramNotAdded}
                    </span>
                  )}
                </div>

                <div>
                  {tiktokUrl ? (
                    <a
                      href={tiktokUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="break-all font-medium text-amber-700 underline underline-offset-4"
                    >
                      TikTok
                    </a>
                  ) : (
                    <span className="text-neutral-500">
                      {copy.tiktokNotAdded}
                    </span>
                  )}
                </div>

                <div>
                  {videoUrl ? (
                    <a
                      href={videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="break-all font-medium text-amber-700 underline underline-offset-4"
                    >
                      {copy.promoVideo}
                    </a>
                  ) : (
                    <span className="text-neutral-500">
                      {copy.videoNotAdded}
                    </span>
                  )}
                </div>
              </div>
            </section>

            {(restaurant.offersEnabled ||
              restaurant.loyaltyEnabled ||
              restaurant.adsEnabled) && (
              <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-neutral-900">
                  {copy.businessFeatures}
                </h2>

                <div className="mt-4 flex flex-wrap gap-2">
                  {restaurant.offersEnabled ? (
                    <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800">
                      {copy.offersEnabled}
                    </span>
                  ) : null}

                  {restaurant.loyaltyEnabled ? (
                    <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800">
                      {copy.loyaltyEnabled}
                    </span>
                  ) : null}

                  {restaurant.adsEnabled ? (
                    <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800">
                      {copy.adsEnabled}
                    </span>
                  ) : null}
                </div>
              </section>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}