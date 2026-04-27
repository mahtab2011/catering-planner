export type FoodArea =
  | "brick_lane"
  | "bethnal_green_road"
  | "green_street_plashet";

export type CuisineType =
  | "bangladeshi"
  | "indian"
  | "italian"
  | "mixed";

export type ServiceMode = "eat_in" | "takeaway" | "both";

export type MenuPriceMode = "single" | "separate";

export type Restaurant = {
  id: string;
  name: string;
  hubLabel?: string;
  slug: string;
  area: FoodArea;
  cuisine: CuisineType;
  address?: string;
  phone?: string;
  websiteUrl?: string;
  hasWebsite: boolean;
  serviceMode: ServiceMode;
  isActive: boolean;
};

export type MenuCategory = {
  id: string;
  restaurantId: string;
  name_en: string;
  sortOrder: number;
  isActive: boolean;
};

export type MenuItem = {
  id: string;
  restaurantId: string;
  categoryId: string;

  name_en: string;
  name_fr?: string;
  name_it?: string;
  name_es?: string;
  name_de?: string;

  description_en?: string;

  priceMode: MenuPriceMode;
  price?: number;
  eatInPrice?: number;
  takeawayPrice?: number;

  isPopular?: boolean;
  isActive: boolean;
};

export type RestaurantLanguageSettings = {
  restaurantId: string;
  enableFrench: boolean;
  enableItalian: boolean;
  enableSpanish: boolean;
  enableGerman: boolean;
};