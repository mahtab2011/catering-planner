export type UserRole =
  | "customer"
  | "restaurant"
  | "caterer"
  | "supplier"
  | "household"
  | "admin";

export type CountryCode = "UK" | "BD";

export type ServiceType =
  | "dine-in"
  | "takeaway"
  | "delivery"
  | "catering";

export type MenuItemType =
  | "rice"
  | "bread"
  | "main"
  | "grill"
  | "kebab"
  | "seafood"
  | "drink"
  | "hot-drink"
  | "dessert"
  | "set-menu"
  | "other";

export type SupplierCategory =
  | "fish"
  | "meat"
  | "vegetable"
  | "rice"
  | "spice"
  | "oil"
  | "flour"
  | "soft-drink"
  | "dessert"
  | "other";

export type TransportType = "ex-premises" | "delivered";

export type SubscriptionStatus =
  | "trial"
  | "active"
  | "expired"
  | "cancelled";

export type CustomerOrderStatus =
  | "new"
  | "accepted"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

export type SupplierOrderStatus =
  | "new"
  | "quoted"
  | "confirmed"
  | "packed"
  | "delivered"
  | "cancelled";

export type CurrencyCode = "GBP" | "BDT";

export type MenuLanguages = {
  en?: string;
  bn?: string;
  fr?: string;
  it?: string;
  es?: string;
  de?: string;
};

export type UserDoc = {
  uid: string;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  countryCode?: CountryCode;
  isActive: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type HubDoc = {
  id: string;
  name: string;
  slug: string;
  countryCode: CountryCode;
  city: string;
  areaLabel: string;
  description?: string;
  isActive: boolean;
  sortOrder?: number;
  heroImageUrl?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type RestaurantDoc = {
  id: string;
  ownerUid: string;
  name: string;
  slug: string;
  cuisine?: string;
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postcode?: string;
  countryCode: CountryCode;
  hubIds: string[];
  serviceTypes: ServiceType[];
  halal?: boolean;
  openingHours?: Record<string, string>;
  imageUrl?: string;
  logoUrl?: string;
  isFeatured?: boolean;
  isApproved?: boolean;
  isActive?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type RestaurantMenuCategoryDoc = {
  id: string;
  restaurantId: string;
  name: string;
  slug: string;
  itemType: MenuItemType;
  sortOrder: number;
  isActive: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type RestaurantMenuItemDoc = {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  currency: CurrencyCode;
  itemType: MenuItemType;
  tags?: string[];
  isPopular?: boolean;
  isAvailable?: boolean;
  imageUrl?: string;
  translatedNames?: MenuLanguages;
  translatedDescriptions?: MenuLanguages;
  spiceLevel?: "mild" | "medium" | "hot";
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type CateringPackageDoc = {
  id: string;
  ownerUid: string;
  ownerType: "restaurant" | "caterer";
  ownerBusinessId: string;
  name: string;
  description?: string;
  priceMode: "per-head" | "fixed";
  price: number;
  currency: CurrencyCode;
  minimumGuests?: number;
  maximumGuests?: number;
  includedItems: string[];
  addOnItems?: string[];
  isActive: boolean;
  isPopular?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type SupplierDoc = {
  id: string;
  ownerUid: string;
  name: string;
  slug: string;
  phone?: string;
  email?: string;
  website?: string;
  addressLine1?: string;
  city?: string;
  postcode?: string;
  countryCode: CountryCode;
  hubIds: string[];
  description?: string;
  deliveryTypes: TransportType[];
  isApproved?: boolean;
  isActive?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type SupplierProductDoc = {
  id: string;
  supplierId: string;

  // Linked to ingredient master where possible
  ingredientId?: string;

  name: string;
  category: SupplierCategory | string;

  // Size / grade / packaging
  spec?: string;
  variant?: string;
  brand?: string;
  packaging?: string;

  unit: "kg" | "g" | "litre" | "ml" | "pcs" | "box" | "tray" | string;

  price: number;
  currency: CurrencyCode;

  minimumOrderQty?: number;
  transportType?: TransportType;
  isAvailable?: boolean;

  aliases?: string[];

  createdAt?: unknown;
  updatedAt?: unknown;
};

export type OrderItem = {
  menuItemId: string;
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
};

export type CustomerOrderDoc = {
  id: string;
  customerUid?: string;
  restaurantId: string;
  customerName?: string;
  customerPhone?: string;
  orderItems: OrderItem[];
  serviceType: "dine-in" | "takeaway" | "delivery";
  subtotal: number;
  deliveryFee?: number;
  total: number;
  currency: CurrencyCode;
  status: CustomerOrderStatus;
  source?: "web" | "manual" | "phone";
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type SupplierOrderLine = {
  supplierProductId: string;
  name: string;
  qty: number;
  unit: string;
  agreedPrice?: number;
  lineTotal?: number;
};

export type SupplierOrderDoc = {
  id: string;
  buyerType: "restaurant" | "caterer" | "household";
  buyerBusinessId?: string;
  buyerUid: string;
  supplierId: string;
  items: SupplierOrderLine[];
  requestedDeliveryType?: TransportType;
  note?: string;
  status: SupplierOrderStatus;
  currency: CurrencyCode;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type SubscriptionDoc = {
  id: string;
  ownerUid: string;
  ownerType: "restaurant" | "supplier" | "caterer" | "household";
  ownerBusinessId?: string;
  planCode: string;
  planName: string;
  status: SubscriptionStatus;
  trialStartAt?: unknown;
  trialEndAt?: unknown;
  billingStartAt?: unknown;
  amount?: number;
  currency: CurrencyCode;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type FavouriteDoc = {
  id: string;
  userUid: string;
  restaurantId: string;
  createdAt?: unknown;
};