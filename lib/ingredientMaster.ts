export type IngredientCategory =
  | "grain"
  | "dal"
  | "oil_fat"
  | "powder_spice"
  | "whole_spice"
  | "nut_garnish"
  | "frozen"
  | "fresh"
  | "dairy"
  | "sweet"
  | "other";

export type IngredientMasterItem = {
  id: string;
  name: string;
  nameBn: string;
  category: IngredientCategory;
  unit: string;
  stockManaged: boolean;
};

export const INGREDIENT_MASTER: IngredientMasterItem[] = [
  // Grains & Staples
  {
    id: "rice",
    name: "Rice",
    nameBn: "চাল",
    category: "grain",
    unit: "kg",
    stockManaged: true,
  },
  {
    id: "basmati_rice",
    name: "Basmati Rice",
    nameBn: "বাসমতি চাল",
    category: "grain",
    unit: "kg",
    stockManaged: true,
  },
  {
    id: "flour",
    name: "Flour",
    nameBn: "ময়দা",
    category: "grain",
    unit: "kg",
    stockManaged: true,
  },
  {
    id: "atta",
    name: "Atta",
    nameBn: "আটা",
    category: "grain",
    unit: "kg",
    stockManaged: true,
  },
  {
    id: "suji",
    name: "Suji",
    nameBn: "সুজি",
    category: "grain",
    unit: "kg",
    stockManaged: true,
  },
  {
    id: "semai",
    name: "Semai",
    nameBn: "সেমাই",
    category: "grain",
    unit: "kg",
    stockManaged: true,
  },

  // Dal
  {
    id: "moshur_dal",
    name: "Moshur Dal",
    nameBn: "মসুর ডাল",
    category: "dal",
    unit: "kg",
    stockManaged: true,
  },
  {
    id: "mug_dal",
    name: "Mug Dal",
    nameBn: "মুগ ডাল",
    category: "dal",
    unit: "kg",
    stockManaged: true,
  },
  {
    id: "maskolai_dal",
    name: "Maskolai Dal",
    nameBn: "মাসকলাই ডাল",
    category: "dal",
    unit: "kg",
    stockManaged: true,
  },
  {
    id: "chhola_dal",
    name: "Chhola Dal",
    nameBn: "ছোলা ডাল",
    category: "dal",
    unit: "kg",
    stockManaged: true,
  },

  // Oils & Fats
  {
    id: "soybean_oil",
    name: "Soybean Oil",
    nameBn: "সয়াবিন তেল",
    category: "oil_fat",
    unit: "litre",
    stockManaged: true,
  },
  {
    id: "mustard_oil",
    name: "Mustard Oil",
    nameBn: "সরিষার তেল",
    category: "oil_fat",
    unit: "litre",
    stockManaged: true,
  },
  {
    id: "ghee",
    name: "Ghee",
    nameBn: "ঘি",
    category: "oil_fat",
    unit: "kg",
    stockManaged: true,
  },
  {
    id: "vegetable_ghee_dalda",
    name: "Vegetable Ghee (Dalda)",
    nameBn: "ডালডা / ভেজিটেবল ঘি",
    category: "oil_fat",
    unit: "kg",
    stockManaged: true,
  },

  // Powder Spices
  {
    id: "red_chilli_powder",
    name: "Red Chilli Powder",
    nameBn: "লাল মরিচের গুঁড়া",
    category: "powder_spice",
    unit: "g",
    stockManaged: true,
  },
  {
    id: "turmeric_powder",
    name: "Turmeric Powder",
    nameBn: "হলুদের গুঁড়া",
    category: "powder_spice",
    unit: "g",
    stockManaged: true,
  },
  {
    id: "coriander_powder",
    name: "Coriander Powder",
    nameBn: "ধনিয়ার গুঁড়া",
    category: "powder_spice",
    unit: "g",
    stockManaged: true,
  },
  {
    id: "cumin_powder",
    name: "Cumin (Zeera) Powder",
    nameBn: "জিরা গুঁড়া",
    category: "powder_spice",
    unit: "g",
    stockManaged: true,
  },
  {
    id: "garam_masala_powder",
    name: "Garam Masala Powder",
    nameBn: "গরম মসলা গুঁড়া",
    category: "powder_spice",
    unit: "g",
    stockManaged: true,
  },

  // Whole Spices
  {
    id: "black_pepper",
    name: "Black Pepper",
    nameBn: "গোলমরিচ",
    category: "whole_spice",
    unit: "g",
    stockManaged: true,
  },
  {
    id: "white_pepper",
    name: "White Pepper",
    nameBn: "সাদা গোলমরিচ",
    category: "whole_spice",
    unit: "g",
    stockManaged: true,
  },
  {
    id: "cinnamon",
    name: "Cinnamon",
    nameBn: "দারুচিনি",
    category: "whole_spice",
    unit: "g",
    stockManaged: true,
  },
  {
    id: "cardamom",
    name: "Cardamom",
    nameBn: "এলাচ",
    category: "whole_spice",
    unit: "g",
    stockManaged: true,
  },
  {
    id: "bay_leaf",
    name: "Bay Leaf",
    nameBn: "তেজপাতা",
    category: "whole_spice",
    unit: "g",
    stockManaged: true,
  },
  {
    id: "clove",
    name: "Clove",
    nameBn: "লবঙ্গ",
    category: "whole_spice",
    unit: "g",
    stockManaged: true,
  },
  {
    id: "poppy_seed",
    name: "Poppy Seed",
    nameBn: "পোস্ত দানা",
    category: "whole_spice",
    unit: "g",
    stockManaged: true,
  },

  // Nuts & Garnish
  {
    id: "cashew_nut",
    name: "Cashew Nut",
    nameBn: "কাজুবাদাম",
    category: "nut_garnish",
    unit: "g",
    stockManaged: true,
  },
  {
    id: "almond",
    name: "Almond",
    nameBn: "কাঠবাদাম",
    category: "nut_garnish",
    unit: "g",
    stockManaged: true,
  },
  {
    id: "peanut",
    name: "Peanut",
    nameBn: "চিনাবাদাম",
    category: "nut_garnish",
    unit: "g",
    stockManaged: true,
  },
  {
    id: "raisin",
    name: "Raisin",
    nameBn: "কিশমিশ",
    category: "nut_garnish",
    unit: "g",
    stockManaged: true,
  },

  // Frozen / stocked
  {
    id: "green_peas_frozen",
    name: "Green Peas (Frozen)",
    nameBn: "সবুজ মটরশুঁটি (ফ্রোজেন)",
    category: "frozen",
    unit: "kg",
    stockManaged: true,
  },
  {
    id: "ginger_paste_frozen",
    name: "Ginger Paste (Frozen)",
    nameBn: "আদা বাটা (ফ্রোজেন)",
    category: "frozen",
    unit: "kg",
    stockManaged: true,
  },
  {
    id: "garlic_paste_frozen",
    name: "Garlic Paste (Frozen)",
    nameBn: "রসুন বাটা (ফ্রোজেন)",
    category: "frozen",
    unit: "kg",
    stockManaged: true,
  },
  {
    id: "onion_paste_frozen",
    name: "Onion Paste (Frozen)",
    nameBn: "পেঁয়াজ বাটা (ফ্রোজেন)",
    category: "frozen",
    unit: "kg",
    stockManaged: true,
  },

  // Fresh items
  {
    id: "beef",
    name: "Beef",
    nameBn: "গরুর মাংস",
    category: "fresh",
    unit: "kg",
    stockManaged: false,
  },
  {
    id: "mutton",
    name: "Mutton",
    nameBn: "খাসির মাংস",
    category: "fresh",
    unit: "kg",
    stockManaged: false,
  },
  {
    id: "chicken",
    name: "Chicken",
    nameBn: "মুরগির মাংস",
    category: "fresh",
    unit: "kg",
    stockManaged: false,
  },
  {
    id: "fish",
    name: "Fish",
    nameBn: "মাছ",
    category: "fresh",
    unit: "kg",
    stockManaged: false,
  },
  {
    id: "onion_whole",
    name: "Onion (Whole)",
    nameBn: "পেঁয়াজ",
    category: "fresh",
    unit: "kg",
    stockManaged: false,
  },
  {
    id: "garlic_whole",
    name: "Garlic (Whole)",
    nameBn: "রসুন",
    category: "fresh",
    unit: "kg",
    stockManaged: false,
  },
  {
    id: "ginger_whole",
    name: "Ginger (Whole)",
    nameBn: "আদা",
    category: "fresh",
    unit: "kg",
    stockManaged: false,
  },
  {
    id: "potato",
    name: "Potato",
    nameBn: "আলু",
    category: "fresh",
    unit: "kg",
    stockManaged: false,
  },
  {
    id: "carrot",
    name: "Carrot",
    nameBn: "গাজর",
    category: "fresh",
    unit: "kg",
    stockManaged: false,
  },
  {
    id: "cucumber",
    name: "Cucumber",
    nameBn: "শসা",
    category: "fresh",
    unit: "kg",
    stockManaged: false,
  },
  {
    id: "green_chilli",
    name: "Green Chilli",
    nameBn: "কাঁচা মরিচ",
    category: "fresh",
    unit: "g",
    stockManaged: false,
  },

  // Dairy
  {
    id: "milk",
    name: "Milk",
    nameBn: "দুধ",
    category: "dairy",
    unit: "litre",
    stockManaged: false,
  },
  {
    id: "yogurt",
    name: "Yogurt",
    nameBn: "দই",
    category: "dairy",
    unit: "kg",
    stockManaged: false,
  },
  {
    id: "cream_malai",
    name: "Cream / Malai",
    nameBn: "মালাই",
    category: "dairy",
    unit: "kg",
    stockManaged: false,
  },

  // Sweet
  {
    id: "sugar",
    name: "Sugar",
    nameBn: "চিনি",
    category: "sweet",
    unit: "kg",
    stockManaged: true,
  },
  {
    id: "kewra_water",
    name: "Kewra Water",
    nameBn: "কেওড়া জল",
    category: "sweet",
    unit: "ml",
    stockManaged: true,
  },
  {
    id: "rose_water",
    name: "Rose Water",
    nameBn: "রোজ ওয়াটার",
    category: "sweet",
    unit: "ml",
    stockManaged: true,
  },

  // Other essentials
  {
    id: "salt",
    name: "Salt",
    nameBn: "লবণ",
    category: "other",
    unit: "kg",
    stockManaged: true,
  },
];

export const INGREDIENT_MASTER_BY_NAME = new Map(
  INGREDIENT_MASTER.map((item) => [item.name.toLowerCase(), item])
);

export function getIngredientMasterItem(name: string) {
  return INGREDIENT_MASTER_BY_NAME.get(String(name || "").trim().toLowerCase());
}

export function isStockManagedIngredient(name: string) {
  return !!getIngredientMasterItem(name)?.stockManaged;
}