export type Supplier = {
  id: string;
  name: string;
  location?: string;
  phone?: string;
  email?: string;
  address?: string;
  postcode?: string;
  serviceArea?: string;
};

export type SupplierItemPrice = {
  supplierId: string;
  supplierName?: string;

  itemName: string;
  ingredientId?: string;
  category?: string;

  // grading / size, very important for fish, meat, rice, oil, drinks
  variant?: string;
  unit: string;

  price: number;

  // business logic
  minOrderQty?: number;
  priceType?: "ex-premises" | "with-transport";
  available?: boolean;

  updatedAt?: number;
};