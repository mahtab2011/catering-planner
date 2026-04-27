export type DishIngredient = {
  name: string;
  qtyPerGuest: number;
  unit: "g" | "kg" | "ml" | "litre" | "pcs";
  costPerUnit: number;
};

export type DishItem = {
  key: string;
  name: string;
  bangla: string;
  ingredients: DishIngredient[];
};

export type DishesMap = {
  rice: DishItem[];
  meat: DishItem[];
  kabab: DishItem[];
  sides: DishItem[];
  dessert: DishItem[];
  drinks: DishItem[];
  simpleEvent: DishItem[];
};

export const dishes: DishesMap = {
  rice: [
    {
      key: "kacchi_biryani",
      name: "Kacchi Biryani",
      bangla: "কাচ্চি বিরিয়ানি",
      ingredients: [
        { name: "Basmati Rice", qtyPerGuest: 120, unit: "g", costPerUnit: 0.0025 },
        { name: "Mutton", qtyPerGuest: 150, unit: "g", costPerUnit: 0.01 },
        { name: "Potato", qtyPerGuest: 40, unit: "g", costPerUnit: 0.0015 },
        { name: "Oil", qtyPerGuest: 20, unit: "ml", costPerUnit: 0.003 },
        { name: "Ghee", qtyPerGuest: 8, unit: "g", costPerUnit: 0.012 },
        { name: "Onion", qtyPerGuest: 25, unit: "g", costPerUnit: 0.0018 },
        { name: "Yogurt", qtyPerGuest: 20, unit: "g", costPerUnit: 0.0035 },
        { name: "Kacchi Masala", qtyPerGuest: 8, unit: "g", costPerUnit: 0.015 }
      ]
    },
    {
      key: "plain_polao",
      name: "Plain Polao",
      bangla: "পোলাও",
      ingredients: [
        { name: "Polao Rice", qtyPerGuest: 110, unit: "g", costPerUnit: 0.0025 },
        { name: "Oil", qtyPerGuest: 15, unit: "ml", costPerUnit: 0.003 },
        { name: "Ghee", qtyPerGuest: 6, unit: "g", costPerUnit: 0.012 },
        { name: "Onion", qtyPerGuest: 15, unit: "g", costPerUnit: 0.0018 },
        { name: "Whole Garam Masala", qtyPerGuest: 2, unit: "g", costPerUnit: 0.02 },
        { name: "Salt", qtyPerGuest: 3, unit: "g", costPerUnit: 0.0005 }
      ]
    },
    {
      key: "morog_polao",
      name: "Morog Polao",
      bangla: "মোরগ পোলাও",
      ingredients: [
        { name: "Polao Rice", qtyPerGuest: 100, unit: "g", costPerUnit: 0.0025 },
        { name: "Chicken", qtyPerGuest: 140, unit: "g", costPerUnit: 0.0065 },
        { name: "Oil", qtyPerGuest: 18, unit: "ml", costPerUnit: 0.003 },
        { name: "Ghee", qtyPerGuest: 6, unit: "g", costPerUnit: 0.012 },
        { name: "Onion", qtyPerGuest: 20, unit: "g", costPerUnit: 0.0018 },
        { name: "Yogurt", qtyPerGuest: 15, unit: "g", costPerUnit: 0.0035 },
        { name: "Morog Polao Masala", qtyPerGuest: 7, unit: "g", costPerUnit: 0.015 }
      ]
    }
  ],

  meat: [
    {
      key: "chicken_roast",
      name: "Chicken Roast",
      bangla: "চিকেন রোস্ট",
      ingredients: [
        { name: "Chicken", qtyPerGuest: 160, unit: "g", costPerUnit: 0.0065 },
        { name: "Onion", qtyPerGuest: 25, unit: "g", costPerUnit: 0.0018 },
        { name: "Oil", qtyPerGuest: 15, unit: "ml", costPerUnit: 0.003 },
        { name: "Yogurt", qtyPerGuest: 20, unit: "g", costPerUnit: 0.0035 },
        { name: "Roast Masala", qtyPerGuest: 6, unit: "g", costPerUnit: 0.015 }
      ]
    },
    {
      key: "mutton_rezala",
      name: "Mutton Rezala",
      bangla: "মাটন রেজালা",
      ingredients: [
        { name: "Mutton", qtyPerGuest: 150, unit: "g", costPerUnit: 0.01 },
        { name: "Onion", qtyPerGuest: 30, unit: "g", costPerUnit: 0.0018 },
        { name: "Oil", qtyPerGuest: 18, unit: "ml", costPerUnit: 0.003 },
        { name: "Yogurt", qtyPerGuest: 20, unit: "g", costPerUnit: 0.0035 },
        { name: "Rezala Masala", qtyPerGuest: 7, unit: "g", costPerUnit: 0.015 }
      ]
    },
    {
      key: "beef_rezala",
      name: "Beef Rezala",
      bangla: "বিফ রেজালা",
      ingredients: [
        { name: "Beef", qtyPerGuest: 160, unit: "g", costPerUnit: 0.008 },
        { name: "Onion", qtyPerGuest: 30, unit: "g", costPerUnit: 0.0018 },
        { name: "Oil", qtyPerGuest: 18, unit: "ml", costPerUnit: 0.003 },
        { name: "Yogurt", qtyPerGuest: 18, unit: "g", costPerUnit: 0.0035 },
        { name: "Rezala Masala", qtyPerGuest: 7, unit: "g", costPerUnit: 0.015 }
      ]
    },
    {
      key: "fish",
      name: "Fish",
      bangla: "মাছ",
      ingredients: [
        { name: "Fish", qtyPerGuest: 140, unit: "g", costPerUnit: 0.009 },
        { name: "Oil", qtyPerGuest: 12, unit: "ml", costPerUnit: 0.003 },
        { name: "Onion", qtyPerGuest: 15, unit: "g", costPerUnit: 0.0018 },
        { name: "Fish Masala", qtyPerGuest: 5, unit: "g", costPerUnit: 0.015 }
      ]
    }
  ],

  kabab: [
    {
      key: "jali_kabab",
      name: "Jali Kabab",
      bangla: "জালি কাবাব",
      ingredients: [
        { name: "Beef Mince", qtyPerGuest: 70, unit: "g", costPerUnit: 0.0085 },
        { name: "Onion", qtyPerGuest: 10, unit: "g", costPerUnit: 0.0018 },
        { name: "Oil", qtyPerGuest: 6, unit: "ml", costPerUnit: 0.003 },
        { name: "Kabab Masala", qtyPerGuest: 4, unit: "g", costPerUnit: 0.015 }
      ]
    },
    {
      key: "shami_kabab",
      name: "Shami Kabab",
      bangla: "শামি কাবাব",
      ingredients: [
        { name: "Beef Mince", qtyPerGuest: 65, unit: "g", costPerUnit: 0.0085 },
        { name: "Chana Dal", qtyPerGuest: 15, unit: "g", costPerUnit: 0.0018 },
        { name: "Oil", qtyPerGuest: 6, unit: "ml", costPerUnit: 0.003 },
        { name: "Kabab Masala", qtyPerGuest: 4, unit: "g", costPerUnit: 0.015 }
      ]
    }
  ],

  sides: [
    {
      key: "salad",
      name: "Seasonal Salad",
      bangla: "সালাদ",
      ingredients: [
        { name: "Cucumber", qtyPerGuest: 25, unit: "g", costPerUnit: 0.0018 },
        { name: "Carrot", qtyPerGuest: 15, unit: "g", costPerUnit: 0.0015 },
        { name: "Onion", qtyPerGuest: 10, unit: "g", costPerUnit: 0.0018 },
        { name: "Lemon", qtyPerGuest: 0.25, unit: "pcs", costPerUnit: 0.2 }
      ]
    },
    {
      key: "chatni",
      name: "Aloo Bukhara Chatni",
      bangla: "আলুবোখারা চাটনি",
      ingredients: [
        { name: "Aloo Bukhara", qtyPerGuest: 18, unit: "g", costPerUnit: 0.01 },
        { name: "Sugar", qtyPerGuest: 8, unit: "g", costPerUnit: 0.0012 },
        { name: "Chatni Masala", qtyPerGuest: 2, unit: "g", costPerUnit: 0.015 }
      ]
    }
  ],

  dessert: [
    {
      key: "firni",
      name: "Shahi Firni",
      bangla: "শাহী ফিরনি",
      ingredients: [
        { name: "Milk", qtyPerGuest: 120, unit: "ml", costPerUnit: 0.0018 },
        { name: "Chinigura Rice", qtyPerGuest: 12, unit: "g", costPerUnit: 0.003 },
        { name: "Sugar", qtyPerGuest: 18, unit: "g", costPerUnit: 0.0012 },
        { name: "Condensed Milk", qtyPerGuest: 10, unit: "g", costPerUnit: 0.0045 },
        { name: "Nuts/Raisin", qtyPerGuest: 3, unit: "g", costPerUnit: 0.02 }
      ]
    }
  ],

  drinks: [
    {
      key: "borhani",
      name: "Borhani",
      bangla: "বোরহানি",
      ingredients: [
        { name: "Yogurt", qtyPerGuest: 120, unit: "ml", costPerUnit: 0.0035 },
        { name: "Water", qtyPerGuest: 100, unit: "ml", costPerUnit: 0.0001 },
        { name: "Mint", qtyPerGuest: 2, unit: "g", costPerUnit: 0.01 },
        { name: "Borhani Masala", qtyPerGuest: 3, unit: "g", costPerUnit: 0.015 }
      ]
    }
  ],

  simpleEvent: [
    {
      key: "beef_tehari",
      name: "Beef Tehari",
      bangla: "বিফ তেহারি",
      ingredients: [
        { name: "Rice", qtyPerGuest: 115, unit: "g", costPerUnit: 0.0025 },
        { name: "Beef", qtyPerGuest: 140, unit: "g", costPerUnit: 0.008 },
        { name: "Potato", qtyPerGuest: 25, unit: "g", costPerUnit: 0.0015 },
        { name: "Oil", qtyPerGuest: 18, unit: "ml", costPerUnit: 0.003 },
        { name: "Onion", qtyPerGuest: 22, unit: "g", costPerUnit: 0.0018 },
        { name: "Tehari Masala", qtyPerGuest: 7, unit: "g", costPerUnit: 0.015 }
      ]
    }
  ]
};

export function getAllDishes(): DishItem[] {
  return [
    ...dishes.rice,
    ...dishes.meat,
    ...dishes.kabab,
    ...dishes.sides,
    ...dishes.dessert,
    ...dishes.drinks,
    ...dishes.simpleEvent
  ];
}

export function findDishByKey(key: string): DishItem | undefined {
  return getAllDishes().find((dish) => dish.key === key);
}

export function calculateDishCost(dish: DishItem, guests: number): number {
  if (!dish?.ingredients?.length || !guests) return 0;

  return dish.ingredients.reduce((total, ing) => {
    return total + ing.qtyPerGuest * guests * ing.costPerUnit;
  }, 0);
}

export function calculateDishIngredients(
  dish: DishItem,
  guests: number
): Array<{
  name: string;
  unit: DishIngredient["unit"];
  qty: number;
  cost: number;
}> {
  if (!dish?.ingredients?.length || !guests) return [];

  return dish.ingredients.map((ing) => {
    const qty = ing.qtyPerGuest * guests;
    const cost = qty * ing.costPerUnit;

    return {
      name: ing.name,
      unit: ing.unit,
      qty,
      cost
    };
  });
}

export function calculateMenuCost(selectedKeys: string[], guests: number): number {
  return selectedKeys.reduce((sum, key) => {
    const dish = findDishByKey(key);
    if (!dish) return sum;
    return sum + calculateDishCost(dish, guests);
  }, 0);
}