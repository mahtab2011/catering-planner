import type { Cuisine } from "./types";
import type { LocaleCode } from "./locales";

/**
 * Canonical cuisine / dish-guide data source for London Food Hubs.
 *
 * This consolidates content that was previously copy-pasted across
 * ~15 separate hardcoded page.tsx files (app/african-food-london,
 * app/pakistani-food-london, etc). Those legacy routes still exist on
 * disk (untouched) but are no longer the source of truth — the new
 * /cuisine/[slug] route reads from this file, and next.config.ts
 * redirects the legacy URLs here so existing links/SEO keep working.
 *
 * This list is not exhaustive of world cuisines on purpose — it only
 * contains cuisines we have real, previously-written copy for. Adding
 * a new cuisine later means adding one more entry here; no route or
 * component code needs to change (see app/cuisine/[slug]/page.tsx).
 */
export const CUISINES: Record<string, Cuisine> = {
  "bangladeshi-food-east-london": {
    id: "bangladeshi-food-east-london",
    slug: "bangladeshi-food-east-london",
    kind: "cuisine",
    name: "Bangladeshi",
    localizedName: { bn: "বাংলাদেশি", ar: "بنغلاديشي", fr: "Bangladais" },
    region: "South Asian",
    shortDescription:
      "East London is home to one of the largest Bangladeshi communities in the UK, with authentic cuisine ranging from home-style cooking to vibrant street food.",
    longDescription:
      "East London is home to one of the largest Bangladeshi communities in the UK. Areas like Brick Lane, Green Street, East Ham and High Street North offer authentic Bangladeshi cuisine ranging from traditional home-style cooking to vibrant street food.\n\nBangladeshi food is known for its rich spices, mustard oil flavours, slow-cooked meats, fresh fish curries and unique sweets. Whether you are looking for a quick snack like fuchka or a full meal like kacchi biryani, East London has it all.",
    matchTerms: ["Bangladeshi"],
    dishCategories: [
      {
        title: "Traditional Dishes",
        items: [
          "Bhorta (Aloo, Begun, Shutki)",
          "Beef Shatkora",
          "Shorshe Ilish",
          "Kacchi Biryani",
          "Bhuna Khichuri",
          "Fish Curries (Rui, Katla, Boal)",
          "Kala Bhuna",
          "Beef Bhuna",
          "Chicken Roast",
          "Gorur Kolija Bhuna",
          "Kosha Mangsho",
          "Beef Kofta Curry",
        ],
      },
      {
        title: "Street Food & Snacks",
        items: ["Chotpoti", "Fuchka", "Mughlai Paratha", "Naga Spicy Dishes"],
      },
      {
        title: "Rice & Comfort Food",
        items: ["Tehari", "Khichuri", "Chaler Roti"],
      },
      {
        title: "Pitha (Traditional Cakes)",
        items: [
          "Bhapa Pitha",
          "Chitoi Pitha",
          "Patishapta",
          "Puli Pitha",
          "Poa Pitha",
          "Nokshi Pitha",
        ],
      },
      {
        title: "Desserts & Sweets",
        items: [
          "Roshomalai",
          "Roshogolla",
          "Chom Chom",
          "Sandesh",
          "Mishti Doi",
          "Kala Jamun",
          "Khir Kodom",
          "Rajbhog",
        ],
      },
      { title: "Drinks", items: ["Motka Cha", "Karak Cha"] },
    ],
    dishes: [],
    dietaryTags: ["Halal widely available"],
    seoTitle: "Bangladeshi Food in East London | Brick Lane, Green Street & East Ham",
    seoDescription:
      "Discover authentic Bangladeshi food in East London including bhorta, kacchi biryani, shorshe ilish, beef shatkora, pitha, street food and traditional sweets.",
    isActive: true,
    isFeatured: true,
  },

  "indian-food-london": {
    id: "indian-food-london",
    slug: "indian-food-london",
    kind: "cuisine",
    name: "Indian",
    localizedName: { bn: "ভারতীয়", ar: "هندي", fr: "Indien" },
    region: "South Asian",
    shortDescription:
      "Rich curries, vegetarian dishes, tandoori grills, aromatic spices and freshly baked breads — one of London's most popular cuisines.",
    longDescription:
      "Indian food is one of the most popular cuisines in London, known for its rich curries, vegetarian dishes, tandoori grills, aromatic spices, freshly baked breads and takeaway favourites. From classic curry houses to modern Indian restaurants and catering services, London offers a wide range of Indian food experiences.\n\nMany UK Indian restaurants serve familiar favourites such as onion bhaji, vegetable samosas, chicken tikka, chicken tikka masala, vegetable jalfrezi, saag paneer, Bombay aloo, garlic naan and Peshwari naan. These dishes are popular with customers looking for both traditional flavour and comforting takeaway options.",
    matchTerms: ["Indian"],
    dishCategories: [
      {
        title: "Popular Vegetarian Dishes",
        items: [
          "Paneer Butter Masala",
          "Palak Paneer",
          "Aloo Gobi",
          "Chana Masala",
          "Vegetable Korma",
          "Bhindi Masala",
          "Dal Makhani",
          "Tarka Dal",
        ],
      },
      {
        title: "Vegetarian Starters & Snacks",
        items: ["Samosas", "Onion Bhaji", "Paneer Tikka", "Hara Bhara Kabab", "Aloo Tikki"],
      },
      {
        title: "Popular Non-Vegetarian Dishes",
        items: [
          "Chicken Tikka Masala",
          "Butter Chicken",
          "Lamb Rogan Josh",
          "Chicken Jalfrezi",
          "Balti Chicken",
          "Balti Lamb",
          "Phaal Curry",
          "Mutton Keema",
        ],
      },
      {
        title: "Tandoor & Grill",
        items: ["Tandoori Chicken", "Chicken Tikka", "Seekh Kebab", "Lamb Chops", "Fish Pakora"],
      },
      {
        title: "Breads & Sides",
        items: [
          "Plain Naan",
          "Garlic Naan",
          "Peshwari Naan",
          "Roti",
          "Paratha",
          "Papadums with Chutneys",
          "Bombay Aloo",
          "Saag Paneer",
        ],
      },
      { title: "South Indian Favourites", items: ["Masala Dosa", "Idli", "Vada"] },
    ],
    dishes: [],
    dietaryTags: ["Extensive vegetarian options", "Halal widely available"],
    seoTitle: "Indian Food in London | Curries, Tandoori, Vegetarian & Takeaway",
    seoDescription:
      "Discover Indian food in London including vegetarian curries, paneer dishes, chicken tikka masala, butter chicken, lamb rogan josh, tandoori grills, naan and classic UK Indian restaurant favourites.",
    isActive: true,
    isFeatured: true,
  },

  "pakistani-food-london": {
    id: "pakistani-food-london",
    slug: "pakistani-food-london",
    kind: "cuisine",
    name: "Pakistani",
    localizedName: { bn: "পাকিস্তানি", ar: "باكستاني", fr: "Pakistanais" },
    region: "South Asian",
    shortDescription:
      "Rich curries, slow-cooked stews, grilled kebabs, fragrant rice dishes and fresh naan — bold flavour and comfort across London.",
    longDescription:
      "Pakistani food is loved across London for its rich curries, slow-cooked stews, grilled kebabs, fragrant rice dishes, fresh naan breads and colourful street food. From karahi and nihari to biryani, chapli kebab and falooda, Pakistani cuisine offers bold flavour and comfort.",
    matchTerms: ["Pakistani"],
    dishCategories: [
      {
        title: "Classic Curries & Stews",
        items: ["Chicken Karahi", "Lamb Karahi", "Nihari", "Haleem", "Chicken Korma", "Aloo Keema", "Paya"],
      },
      {
        title: "BBQ & Grilled Items",
        items: ["Seekh Kebab", "Chapli Kebab", "Chicken Tikka", "Malai Boti", "Balochi Sajji"],
      },
      { title: "Rice Dishes", items: ["Sindhi Biryani", "Mutton Pulao", "Chicken Pulao"] },
      { title: "Breads", items: ["Roghni Naan", "Paratha", "Qeema Naan"] },
      {
        title: "Street Food & Snacks",
        items: ["Gol Gappay", "Samosa Chaat", "Pakora", "Bun Kebab"],
      },
      {
        title: "Desserts & Drinks",
        items: ["Gajar ka Halwa", "Kheer", "Firni", "Gulab Jamun", "Falooda", "Doodh Patti", "Chai"],
      },
    ],
    dishes: [],
    dietaryTags: ["Halal widely available"],
    seoTitle: "Pakistani Food in London | Karahi, Nihari, Biryani & Kebabs",
    seoDescription:
      "Discover Pakistani food in London including chicken karahi, lamb karahi, nihari, haleem, seekh kebab, chapli kebab, sajji, biryani, pulao, naan, samosa chaat and more.",
    isActive: true,
    isFeatured: true,
  },

  "lebanese-food-london": {
    id: "lebanese-food-london",
    slug: "lebanese-food-london",
    kind: "cuisine",
    name: "Lebanese",
    localizedName: { bn: "লেবানিজ", ar: "لبناني", fr: "Libanais" },
    region: "Middle Eastern",
    shortDescription:
      "Fresh herbs, grilled meats, seafood, mezze plates, garlic sauces, tahini flavours and colourful salads.",
    longDescription:
      "Lebanese food is popular in London for its fresh herbs, grilled meats, seafood dishes, mezze plates, garlic sauces, tahini flavours and colourful salads. From shawarma and kafta to sayadieh and hummus, Lebanese cuisine offers both everyday takeaway favourites and elegant catering options.",
    matchTerms: ["Lebanese"],
    dishCategories: [
      {
        title: "Fish & Seafood",
        items: [
          "Sayadieh / Saiadia",
          "Samke Harra",
          "Grilled Sea Bass",
          "Grilled Sea Bream",
          "Sautéed Prawns",
          "Sautéed Squid",
          "Baked Fish en Papillote",
        ],
      },
      {
        title: "Meat Dishes",
        items: [
          "Kibbeh",
          "Kibbeh Nayyeh",
          "Kafta Kebabs",
          "Shish Taouk",
          "Shawarma",
          "Sfeeha",
          "Lamb Chops",
          "Shish Barak",
          "Bazella",
          "Warak Enab",
        ],
      },
      { title: "Accompaniments", items: ["Hummus", "Tabbouleh", "Fattoush", "Toum"] },
    ],
    dishes: [],
    dietaryTags: ["Halal widely available", "Strong vegetarian mezze options"],
    seoTitle: "Lebanese Food in London | Shawarma, Kibbeh, Kafta & Seafood",
    seoDescription:
      "Discover Lebanese food in London including shawarma, kibbeh, kafta kebabs, shish taouk, sayadieh, samke harra, hummus, tabbouleh and fattoush.",
    isActive: true,
  },

  "turkish-food-london": {
    id: "turkish-food-london",
    slug: "turkish-food-london",
    kind: "cuisine",
    name: "Turkish",
    localizedName: { bn: "তুর্কি", ar: "تركي", fr: "Turc" },
    region: "Middle Eastern",
    shortDescription:
      "Grilled kebabs, charcoal flavours, fresh salads, warm flatbreads and generous mixed grill platters.",
    longDescription:
      "Turkish food is one of London's most loved cuisines, known for grilled kebabs, charcoal flavours, fresh salads, warm flatbreads and generous mixed grill platters.",
    matchTerms: ["Turkish"],
    dishCategories: [
      {
        title: "Popular Turkish Dishes",
        items: [
          "Lamb Shish",
          "Chicken Shish",
          "Doner Kebab",
          "Lamb Kofta",
          "Adana Kebab",
          "Mixed Grill",
          "Chicken Wings",
          "Iskender Kebab",
          "Beyti Kebab",
          "Patlıcan Kebab",
          "Çöp Şiş",
          "Pide / Lavaş",
          "Cacık",
          "Ezme Salad",
          "Bulgur Pilav",
          "Sumac Onions",
          "Halloumi Grill",
          "Falafel",
        ],
      },
    ],
    dishes: [],
    dietaryTags: ["Halal widely available"],
    seoTitle: "Turkish Food in London | Kebabs, Doner, Shish & Mixed Grill",
    seoDescription:
      "Discover Turkish food in London including lamb shish, chicken shish, doner kebab, kofta, Adana kebab, Iskender kebab, pide, cacik, ezme and more.",
    isActive: true,
  },

  "thai-food-london": {
    id: "thai-food-london",
    slug: "thai-food-london",
    kind: "cuisine",
    name: "Thai",
    localizedName: { bn: "থাই", ar: "تايلاندي", fr: "Thaïlandais" },
    region: "Southeast Asian",
    shortDescription:
      "A balance of sweet, sour, salty and spicy — from street food classics to rich curries and fresh salads.",
    longDescription:
      "Thai food is popular in London for its balance of sweet, sour, salty and spicy flavours. From street food classics like pad thai to rich curries and fresh salads, Thai cuisine offers a vibrant dining experience.",
    matchTerms: ["Thai"],
    dishes: [
      "Pad Thai",
      "Pad Kra Pao",
      "Green Curry",
      "Tom Yum Goong",
      "Massaman Curry",
      "Som Tum",
      "Pad Kee Mao",
      "Mango Sticky Rice",
    ],
    seoTitle: "Thai Food in London | Pad Thai, Green Curry & Street Food",
    seoDescription:
      "Discover Thai food in London including pad thai, green curry, tom yum, pad kra pao, som tum and mango sticky rice.",
    isActive: true,
  },

  "japanese-food-london": {
    id: "japanese-food-london",
    slug: "japanese-food-london",
    kind: "cuisine",
    name: "Japanese",
    localizedName: { bn: "জাপানি", ar: "ياباني", fr: "Japonais" },
    region: "East Asian",
    shortDescription:
      "Sushi, rice dishes, light curries and traditional meals — simplicity, freshness and balance.",
    longDescription:
      "Japanese food in London includes sushi, rice dishes, light curries and traditional meals. Known for simplicity and freshness, Japanese cuisine focuses on balance and quality ingredients.",
    matchTerms: ["Japanese"],
    dishes: [
      "Sushi (Nigiri, Maki, Temaki)",
      "Chirashi Sushi",
      "Inari Sushi",
      "Curry Rice",
      "Onigiri",
      "Omurice",
      "Takikomi Gohan",
      "Ochazuke",
      "Mochi",
      "Fried Rice (Chahan)",
    ],
    seoTitle: "Japanese Food in London | Sushi, Ramen & Rice Dishes",
    seoDescription:
      "Discover Japanese food in London including sushi, ramen, curry rice, onigiri, mochi and traditional rice dishes.",
    isActive: true,
  },

  "african-food-london": {
    id: "african-food-london",
    slug: "african-food-london",
    kind: "cuisine",
    name: "African",
    localizedName: { bn: "আফ্রিকান", ar: "أفريقي", fr: "Africain" },
    region: "African",
    shortDescription:
      "Dishes from West, East, North and South Africa, offering bold flavours, spices and traditional cooking styles.",
    longDescription:
      "African food in London includes dishes from West, East, North and South Africa, offering bold flavours, spices and traditional cooking styles.",
    // Ethiopian/Eritrean and Somali cuisine are distinct culinary
    // traditions with their own dedicated entries below — kept out of
    // this list so a restaurant tagged with either matches ONLY its
    // specific cuisine page, not this broader West/Central/Southern
    // African one as well.
    matchTerms: ["African", "West African", "Nigerian", "Ghanaian"],
    dishes: [
      "Jollof Rice",
      "Fufu & Egusi Soup",
      "Suya",
      "Waakye",
      "Moi Moi",
      "Akara",
      "Plantain (Dodo/Boli)",
      "Bobotie",
      "Boerewors",
      "Bunny Chow",
      "Chakalaka",
      "Mandazi",
      "Ugali",
      "Chapati",
      "Tagine",
      "Koshary",
      "Couscous",
    ],
    seoTitle: "African Food in London | Jollof Rice, Suya & Traditional Dishes",
    seoDescription:
      "Discover African food in London including jollof rice, fufu, suya, waakye, bobotie, bunny chow and tagine.",
    isActive: true,
  },

  "jamaican-food-london": {
    id: "jamaican-food-london",
    slug: "jamaican-food-london",
    kind: "cuisine",
    name: "Jamaican",
    localizedName: { bn: "জ্যামাইকান", ar: "جامايكي", fr: "Jamaïcain" },
    region: "Caribbean",
    shortDescription:
      "Bold spices, smoky jerk flavours and rich Caribbean dishes, from street food to takeaway and catering.",
    longDescription:
      "Jamaican food is popular in London for its bold spices, smoky jerk flavours and rich Caribbean dishes. From street food to takeaway shops and catering, you can find authentic Jamaican cuisine across the city.",
    matchTerms: ["Jamaican", "Caribbean"],
    dishes: [
      "Jerk Chicken",
      "Curry Goat",
      "Oxtail Stew",
      "Ackee and Saltfish",
      "Escovitch Fish",
      "Rice and Peas",
      "Jamaican Patties",
      "Fried Plantain",
      "Festival",
      "Callaloo",
    ],
    seoTitle: "Jamaican Food in London | Jerk Chicken, Curry Goat & Caribbean Dishes",
    seoDescription:
      "Discover Jamaican food in London including jerk chicken, curry goat, oxtail stew, patties and Caribbean street food.",
    isActive: true,
  },

  "british-food-london": {
    id: "british-food-london",
    slug: "british-food-london",
    kind: "cuisine",
    name: "British",
    localizedName: { bn: "ব্রিটিশ", ar: "بريطاني", fr: "Britannique" },
    region: "European",
    shortDescription:
      "Classic dishes like fish and chips, Sunday roast and full English breakfast, plus traditional desserts.",
    longDescription:
      "British food includes classic dishes like fish and chips, Sunday roast and full English breakfast, along with traditional desserts and regional specialties.",
    matchTerms: ["British", "English"],
    dishes: [
      "Fish and Chips",
      "Sunday Roast",
      "Full English Breakfast",
      "Shepherd's Pie",
      "Bangers and Mash",
      "Chicken Tikka Masala",
      "Toad in the Hole",
      "Cornish Pasty",
      "Sausage Roll",
      "Scotch Egg",
      "Sticky Toffee Pudding",
      "Scones",
      "Eton Mess",
      "Trifle",
      "Crumpets",
      "Haggis",
      "Black Pudding",
      "Jellied Eels",
    ],
    seoTitle: "British Food in London | Fish & Chips, Roast & Classic Dishes",
    seoDescription:
      "Discover British food in London including fish and chips, Sunday roast, full English breakfast and traditional desserts.",
    isActive: true,
  },

  "american-food-london": {
    id: "american-food-london",
    slug: "american-food-london",
    kind: "cuisine",
    name: "American",
    localizedName: { bn: "আমেরিকান", ar: "أمريكي", fr: "Américain" },
    region: "Americas",
    shortDescription: "Burgers, BBQ, fried chicken and comfort food — classic US-style meals and takeaway.",
    longDescription:
      "American food in London includes burgers, BBQ, fried chicken and comfort food. Many restaurants offer classic US-style meals and takeaway options.",
    matchTerms: ["American"],
    dishes: [
      "Burgers",
      "BBQ Ribs",
      "Pulled Pork",
      "Fried Chicken",
      "Mac and Cheese",
      "Chilli Con Carne",
      "Philly Cheesesteak",
      "Pancakes",
      "Bagels",
    ],
    seoTitle: "American Food in London | Burgers, BBQ & Comfort Food",
    seoDescription:
      "Explore American food in London including burgers, BBQ ribs, fried chicken, mac and cheese and classic comfort dishes.",
    isActive: true,
  },

  "brazilian-food-london": {
    id: "brazilian-food-london",
    slug: "brazilian-food-london",
    kind: "cuisine",
    name: "Brazilian",
    localizedName: { bn: "ব্রাজিলিয়ান", ar: "برازيلي", fr: "Brésilien" },
    region: "Americas",
    shortDescription: "BBQ meats, stews and street snacks, with a growing number of restaurants and caterers.",
    longDescription:
      "Brazilian food includes BBQ meats, stews and street snacks. London has growing Brazilian restaurants and catering services.",
    matchTerms: ["Brazilian"],
    dishes: [
      "Feijoada",
      "Churrasco",
      "Pão de Queijo",
      "Coxinha",
      "Pastel",
      "Moqueca",
      "Açaí Bowl",
      "Farofa",
      "Brigadeiro",
    ],
    seoTitle: "Brazilian Food in London | BBQ, Feijoada & Street Food",
    seoDescription:
      "Discover Brazilian food in London including churrasco BBQ, feijoada, coxinha, pão de queijo and desserts.",
    isActive: true,
  },

  "mexican-food-london": {
    id: "mexican-food-london",
    slug: "mexican-food-london",
    kind: "cuisine",
    name: "Mexican",
    localizedName: { bn: "মেক্সিকান", ar: "مكسيكي", fr: "Mexicain" },
    region: "Americas",
    shortDescription: "Bold flavours, spices and street food culture — from tacos to burritos.",
    longDescription:
      "Mexican food is popular for its bold flavours, spices and street food culture. From tacos to burritos, London has many Mexican food options.",
    matchTerms: ["Mexican"],
    dishes: [
      "Tacos",
      "Burritos",
      "Quesadillas",
      "Fajitas",
      "Nachos",
      "Enchiladas",
      "Guacamole",
      "Tamales",
      "Churros",
    ],
    seoTitle: "Mexican Food in London | Tacos, Burritos & Street Food",
    seoDescription:
      "Discover Mexican food in London including tacos, burritos, quesadillas, nachos and authentic street food.",
    isActive: true,
  },

  "biryani-polao-london": {
    id: "biryani-polao-london",
    slug: "biryani-polao-london",
    kind: "dish-guide",
    name: "Biryani & Pulao",
    localizedName: { bn: "বিরিয়ানি ও পোলাও", ar: "برياني وبولاو", fr: "Biryani et Pulao" },
    region: "South Asian",
    shortDescription:
      "Rich spices, fragrant rice and slow-cooked meats — from Hyderabadi dum biryani to Bangladeshi kacchi biryani and Afghan pulao.",
    longDescription:
      "Biryani and pulao are among the most loved dishes in London, bringing together rich spices, fragrant rice and slow-cooked meats. From traditional Indian and Bangladeshi biryanis to Afghan-style pulao, London offers a wide range of flavours for every food lover.\n\nWhether you are searching for authentic Hyderabadi dum biryani, kacchi biryani in East London or a modern fusion version, London Food Hubs helps you discover the best restaurants, street food vendors and catering services across the city.",
    matchTerms: ["Biryani", "Pulao", "Polao"],
    dishes: [],
    featuredDishes: [
      {
        name: "Hyderabadi Dum Biryani",
        description:
          "A bold and aromatic classic, slow-cooked using the dum method where tender meat and fragrant rice are sealed together for deep flavour. Often served with cooling raita and spicy mirchi ka salan.",
      },
      {
        name: "Lucknowi (Awadhi) Biryani",
        description:
          "A lighter and more refined biryani, delicately spiced with saffron, yoghurt and aromatic herbs, offering a rich yet balanced flavour.",
      },
      {
        name: "Bangladeshi Kacchi Biryani",
        description:
          "A signature East London favourite featuring raw-marinated meat layered with rice and slow-cooked to perfection, delivering intense flavour and tenderness.",
      },
      {
        name: "Morog Polao",
        description:
          "A fragrant and slightly sweet Bangladeshi pulao cooked with chicken, often served with shami kebab and borhani for a complete meal.",
      },
      {
        name: "Chicken Tikka / 65 Biryani",
        description:
          "Modern fusion biryanis combining grilled chicken tikka or spicy chicken 65 with traditional biryani rice, popular in contemporary London menus.",
      },
      {
        name: "Kabuli Pulao",
        description:
          "An Afghan-style rice dish topped with caramelised carrots, raisins and tender meat, offering a rich and slightly sweet flavour profile.",
      },
      {
        name: "Vegetable & Vegan Biryani",
        description:
          "A lighter option made with seasonal vegetables, herbs and spices, often available as vegan-friendly alternatives across London.",
      },
    ],
    seoTitle: "Best Biryani & Pulao in London | Hyderabadi, Kacchi, Kabuli & More",
    seoDescription:
      "Discover the best biryani and pulao in London including Hyderabadi dum biryani, Bangladeshi kacchi biryani, Afghan kabuli pulao and more.",
    isActive: true,
  },

  "ethiopian-eritrean-food-london": {
    id: "ethiopian-eritrean-food-london",
    slug: "ethiopian-eritrean-food-london",
    kind: "cuisine",
    name: "Ethiopian & Eritrean",
    localizedName: { bn: "ইথিওপিয়ান ও ইরিত্রিয়ান", ar: "إثيوبي وإريتري", fr: "Éthiopien et Érythréen" },
    region: "African",
    shortDescription:
      "Injera flatbread served with richly spiced stews, shared from a single plate in the traditional style.",
    longDescription:
      "Ethiopian and Eritrean food centres on injera — a soft, spongy sourdough flatbread — served alongside richly spiced stews (wat) made with lentils, vegetables or meat. Meals are traditionally shared from one large plate, torn and scooped by hand rather than eaten with cutlery.",
    matchTerms: ["Ethiopian", "Eritrean", "Habesha"],
    dishes: [
      "Injera",
      "Doro Wat",
      "Tibs",
      "Misir Wat",
      "Kitfo",
      "Shiro",
      "Gomen",
      "Zigni",
    ],
    dietaryTags: ["Strong vegan/vegetarian options (fasting dishes)"],
    seoTitle: "Ethiopian & Eritrean Food in London | Injera, Doro Wat & Tibs",
    seoDescription:
      "Discover Ethiopian and Eritrean food in London including injera, doro wat, tibs, misir wat and shiro.",
    isActive: true,
  },

  "somali-food-london": {
    id: "somali-food-london",
    slug: "somali-food-london",
    kind: "cuisine",
    name: "Somali",
    localizedName: { bn: "সোমালি", ar: "صومالي", fr: "Somalien" },
    region: "African",
    shortDescription:
      "Fragrant spiced rice, slow-cooked meats and East African/Middle Eastern-influenced flavours.",
    longDescription:
      "Somali food blends East African, Arabian and South Asian influences into fragrant spiced rice dishes, slow-cooked meats and flatbreads. Basmati rice cooked with xawaash spice blend, alongside grilled or stewed meat, is a common everyday meal.",
    matchTerms: ["Somali"],
    dishes: [
      "Bariis (Somali Rice)",
      "Suqaar",
      "Hilib Ari",
      "Sambuusa",
      "Canjeero",
      "Malawah",
      "Muqmad",
    ],
    dietaryTags: ["Halal widely available"],
    seoTitle: "Somali Food in London | Bariis, Suqaar & Sambuusa",
    seoDescription:
      "Discover Somali food in London including bariis spiced rice, suqaar, sambuusa and canjeero.",
    isActive: true,
  },

  "chinese-food-london": {
    id: "chinese-food-london",
    slug: "chinese-food-london",
    kind: "cuisine",
    name: "Chinese",
    localizedName: { bn: "চাইনিজ", ar: "صيني", fr: "Chinois" },
    region: "East Asian",
    shortDescription:
      "From Cantonese dim sum to Sichuan spice — one of London's most widespread and varied cuisines.",
    longDescription:
      "Chinese food in London spans many regional traditions, from Cantonese dim sum and roast meats to the bold chilli-and-Sichuan-pepper flavours of Sichuan cooking. It ranges from everyday takeaway staples to specialist regional restaurants.",
    matchTerms: ["Chinese", "Cantonese", "Sichuan", "Szechuan"],
    dishCategories: [
      {
        title: "Dim Sum",
        items: ["Har Gow", "Siu Mai", "Char Siu Bao", "Spring Rolls"],
      },
      {
        title: "Popular Dishes",
        items: [
          "Sweet and Sour Chicken",
          "Kung Pao Chicken",
          "Mapo Tofu",
          "Peking Duck",
          "Char Siu",
          "Chow Mein",
          "Egg Fried Rice",
          "Hot and Sour Soup",
        ],
      },
    ],
    dishes: [],
    seoTitle: "Chinese Food in London | Dim Sum, Cantonese & Sichuan",
    seoDescription:
      "Discover Chinese food in London including dim sum, Cantonese roast meats, Sichuan classics and takeaway favourites.",
    isActive: true,
  },

  "vietnamese-food-london": {
    id: "vietnamese-food-london",
    slug: "vietnamese-food-london",
    kind: "cuisine",
    name: "Vietnamese",
    localizedName: { bn: "ভিয়েতনামিজ", ar: "فيتنامي", fr: "Vietnamien" },
    region: "Southeast Asian",
    shortDescription:
      "Fresh herbs, light broths and bold dipping sauces — best known for pho and banh mi.",
    longDescription:
      "Vietnamese food is known for its balance of fresh herbs, light broths, rice noodles and bold dipping sauces. London has a well-established Vietnamese food scene, especially in areas like Kingsland Road, offering everything from pho to banh mi.",
    matchTerms: ["Vietnamese"],
    dishes: [
      "Pho",
      "Banh Mi",
      "Bun Cha",
      "Goi Cuon (Fresh Spring Rolls)",
      "Banh Xeo",
      "Com Tam",
      "Vietnamese Iced Coffee",
    ],
    seoTitle: "Vietnamese Food in London | Pho, Banh Mi & Fresh Spring Rolls",
    seoDescription:
      "Discover Vietnamese food in London including pho, banh mi, bun cha and fresh spring rolls.",
    isActive: true,
  },

  "korean-food-london": {
    id: "korean-food-london",
    slug: "korean-food-london",
    kind: "cuisine",
    name: "Korean",
    localizedName: { bn: "কোরিয়ান", ar: "كوري", fr: "Coréen" },
    region: "East Asian",
    shortDescription:
      "Bold fermented flavours, sizzling barbecue and comforting stews.",
    longDescription:
      "Korean food is loved for its bold fermented flavours (kimchi, gochujang), sizzling barbecue and comforting stews. London's Korean food scene has grown quickly, from casual fried chicken shops to full barbecue restaurants.",
    matchTerms: ["Korean"],
    dishes: [
      "Kimchi",
      "Bibimbap",
      "Korean Fried Chicken",
      "Bulgogi",
      "Tteokbokki",
      "Japchae",
      "Kimchi Jjigae",
      "Samgyeopsal",
    ],
    seoTitle: "Korean Food in London | Bibimbap, BBQ & Fried Chicken",
    seoDescription:
      "Discover Korean food in London including bibimbap, Korean fried chicken, bulgogi and tteokbokki.",
    isActive: true,
  },

  "nepalese-food-london": {
    id: "nepalese-food-london",
    slug: "nepalese-food-london",
    kind: "cuisine",
    name: "Nepalese",
    localizedName: { bn: "নেপালি", ar: "نيبالي", fr: "Népalais" },
    region: "South Asian",
    shortDescription:
      "Hearty dumplings, lentil dishes and mild, comforting spicing distinct from neighbouring cuisines.",
    longDescription:
      "Nepalese food is distinct from Indian cuisine — generally milder, with lentil-based dal-bhat as an everyday staple, alongside steamed or fried momo dumplings and grilled meats influenced by Tibetan and Himalayan traditions.",
    matchTerms: ["Nepalese", "Nepali"],
    dishes: [
      "Momo",
      "Dal Bhat",
      "Thukpa",
      "Sekuwa",
      "Gundruk",
      "Chatamari",
    ],
    seoTitle: "Nepalese Food in London | Momo, Dal Bhat & Thukpa",
    seoDescription:
      "Discover Nepalese food in London including momo dumplings, dal bhat, thukpa and sekuwa.",
    isActive: true,
  },

  "sri-lankan-food-london": {
    id: "sri-lankan-food-london",
    slug: "sri-lankan-food-london",
    kind: "cuisine",
    name: "Sri Lankan",
    localizedName: { bn: "শ্রীলঙ্কান", ar: "سريلانكي", fr: "Sri-lankais" },
    region: "South Asian",
    shortDescription:
      "Coconut-rich curries, hoppers and fiery sambols — distinct from South Indian cuisine despite some overlap.",
    longDescription:
      "Sri Lankan food shares some techniques with South Indian cooking but has its own identity — coconut milk, curry leaves and fiery sambols feature heavily, alongside bowl-shaped hoppers and string hoppers.",
    matchTerms: ["Sri Lankan"],
    dishes: [
      "Hoppers (Appa)",
      "String Hoppers",
      "Kottu Roti",
      "Sri Lankan Fish Curry",
      "Pol Sambol",
      "Lamprais",
    ],
    seoTitle: "Sri Lankan Food in London | Hoppers, Kottu Roti & Sambol",
    seoDescription:
      "Discover Sri Lankan food in London including hoppers, kottu roti, fish curry and pol sambol.",
    isActive: true,
  },

  "persian-food-london": {
    id: "persian-food-london",
    slug: "persian-food-london",
    kind: "cuisine",
    name: "Persian / Iranian",
    localizedName: { bn: "পার্সিয়ান/ইরানি", ar: "فارسي/إيراني", fr: "Persan/Iranien" },
    region: "Middle Eastern",
    shortDescription:
      "Fragrant saffron rice, slow-grilled kebabs and herb-forward stews.",
    longDescription:
      "Persian (Iranian) food is known for fragrant saffron-infused rice, slow-grilled kebabs and herb-forward stews (khoresh) simmered for hours. Fresh herbs, dried limes, pomegranate and walnuts are common flavourings.",
    matchTerms: ["Persian", "Iranian"],
    dishes: [
      "Chelo Kebab",
      "Joojeh Kebab",
      "Ghormeh Sabzi",
      "Zereshk Polo",
      "Tahdig",
      "Fesenjan",
      "Ash Reshteh",
    ],
    seoTitle: "Persian & Iranian Food in London | Saffron Rice, Kebabs & Khoresh",
    seoDescription:
      "Discover Persian and Iranian food in London including chelo kebab, ghormeh sabzi, tahdig and fesenjan.",
    isActive: true,
  },

  "greek-food-london": {
    id: "greek-food-london",
    slug: "greek-food-london",
    kind: "cuisine",
    name: "Greek",
    localizedName: { bn: "গ্রিক", ar: "يوناني", fr: "Grec" },
    region: "European",
    shortDescription:
      "Grilled meats, fresh salads, olive oil and sharing-style mezze plates.",
    longDescription:
      "Greek food centres on grilled meats, fresh salads, olive oil and sharing-style mezze plates. Souvlaki and gyros are popular everyday takeaway options, alongside slow-baked dishes like moussaka.",
    matchTerms: ["Greek"],
    dishes: [
      "Souvlaki",
      "Gyros",
      "Moussaka",
      "Greek Salad",
      "Tzatziki",
      "Spanakopita",
      "Dolmades",
      "Baklava",
    ],
    seoTitle: "Greek Food in London | Souvlaki, Gyros & Moussaka",
    seoDescription:
      "Discover Greek food in London including souvlaki, gyros, moussaka, Greek salad and baklava.",
    isActive: true,
  },

  "italian-food-london": {
    id: "italian-food-london",
    slug: "italian-food-london",
    kind: "cuisine",
    name: "Italian",
    localizedName: { bn: "ইতালিয়ান", ar: "إيطالي", fr: "Italien" },
    region: "European",
    shortDescription:
      "Pasta, pizza and regional specialities, from casual trattorias to family-run restaurants.",
    longDescription:
      "Italian food in London ranges from classic pizza and pasta to regional specialities from across Italy, served in everything from casual trattorias to family-run restaurants and delis.",
    matchTerms: ["Italian"],
    dishes: [
      "Pizza Napoletana",
      "Carbonara",
      "Lasagne",
      "Risotto",
      "Arancini",
      "Tiramisu",
      "Bruschetta",
      "Gnocchi",
    ],
    seoTitle: "Italian Food in London | Pizza, Pasta & Regional Specialities",
    seoDescription:
      "Discover Italian food in London including pizza, carbonara, lasagne, risotto and tiramisu.",
    isActive: true,
  },

  "polish-food-london": {
    id: "polish-food-london",
    slug: "polish-food-london",
    kind: "cuisine",
    name: "Polish",
    localizedName: { bn: "পোলিশ", ar: "بولندي", fr: "Polonais" },
    region: "European",
    shortDescription:
      "Hearty, comforting dishes — dumplings, cured meats and slow-cooked stews.",
    longDescription:
      "Polish food is hearty and comforting, built around dumplings (pierogi), cured meats, soups and slow-cooked stews. London has a long-established Polish community and a strong network of Polish delis and restaurants.",
    matchTerms: ["Polish"],
    dishes: [
      "Pierogi",
      "Bigos",
      "Zurek",
      "Kielbasa",
      "Golabki",
      "Placki Ziemniaczane",
    ],
    seoTitle: "Polish Food in London | Pierogi, Bigos & Kielbasa",
    seoDescription:
      "Discover Polish food in London including pierogi, bigos, zurek and kielbasa.",
    isActive: true,
  },

  "filipino-food-london": {
    id: "filipino-food-london",
    slug: "filipino-food-london",
    kind: "cuisine",
    name: "Filipino",
    localizedName: { bn: "ফিলিপিনো", ar: "فلبيني", fr: "Philippin" },
    region: "Southeast Asian",
    shortDescription:
      "Sweet, sour and savoury flavours combined in dishes like adobo, sisig and lumpia.",
    longDescription:
      "Filipino food combines sweet, sour and savoury flavours, often built around vinegar and soy-based marinades. Adobo, sisig and lumpia are among the dishes most commonly found in London's growing Filipino food scene.",
    matchTerms: ["Filipino"],
    dishes: [
      "Adobo",
      "Sisig",
      "Lumpia",
      "Pancit",
      "Lechon",
      "Halo-Halo",
    ],
    seoTitle: "Filipino Food in London | Adobo, Sisig & Lumpia",
    seoDescription:
      "Discover Filipino food in London including adobo, sisig, lumpia, pancit and halo-halo.",
    isActive: true,
  },

  "chicken-tikka-london": {
    id: "chicken-tikka-london",
    slug: "chicken-tikka-london",
    kind: "dish-guide",
    name: "Chicken Tikka",
    localizedName: { bn: "চিকেন টিক্কা", ar: "دجاج تكة", fr: "Poulet Tikka" },
    region: "South Asian",
    shortDescription:
      "Loved across London for its smoky flavour and rich spices, from street food to restaurant dining and catering.",
    longDescription:
      "Chicken tikka is one of the most popular dishes in London, loved for its smoky flavour and rich spices. Whether you're looking for street food, restaurant dining, or catering services, London offers a wide range of options.\n\nYou can find chicken tikka across East London, West London, and Central London. Many restaurants, food stalls, and catering services specialise in authentic Indian and Bangladeshi flavours.",
    matchTerms: ["Chicken Tikka"],
    dishes: [],
    seoTitle: "Best Chicken Tikka in London | London Food Hubs",
    seoDescription:
      "Discover the best chicken tikka in London. Find top restaurants, street food vendors, and catering services offering authentic chicken tikka near you.",
    isActive: true,
  },
};

export function getCuisineBySlug(slug: string): Cuisine | undefined {
  return CUISINES[slug];
}

/** Display name for a cuisine in a given locale — reads
 *  `Cuisine.localizedName` when a real, human-reviewed translation
 *  exists for that locale, otherwise falls back to the canonical
 *  English `name`. The `slug` never changes based on this — see
 *  docs/CUISINE-TAXONOMY.md. */
export function getCuisineDisplayName(cuisine: Cuisine, locale: LocaleCode | string): string {
  return cuisine.localizedName?.[locale as keyof typeof cuisine.localizedName] || cuisine.name;
}

export function getAllCuisines(): Cuisine[] {
  return Object.values(CUISINES).filter((c) => c.isActive);
}

export function getFeaturedCuisines(): Cuisine[] {
  return getAllCuisines().filter((c) => c.isFeatured);
}

/** Best-effort match of a restaurant's free-text `cuisine` field
 *  against a canonical Cuisine entry. Restaurant records store cuisine
 *  as plain text (e.g. "Bangladeshi", "Indian / Pakistani"), not a
 *  cuisine id, so this is a substring match rather than an exact key
 *  lookup. Prefer restaurantMatchesCuisineSlug() for any restaurant
 *  that has been tagged with structured `cuisineSlugs` — this remains
 *  only for restaurants that haven't been re-tagged yet. */
export function restaurantMatchesCuisine(
  restaurantCuisineText: string | undefined,
  cuisine: Cuisine
): boolean {
  const text = (restaurantCuisineText || "").toLowerCase();
  if (!text) return false;
  return cuisine.matchTerms.some((term) => text.includes(term.toLowerCase()));
}

/** Structured match: does a restaurant's `cuisineSlugs` array include
 *  this cuisine? Exact, not a substring guess — the preferred check
 *  wherever a restaurant has been tagged with the canonical taxonomy.
 *  Falls back to restaurantMatchesCuisine() for legacy records with no
 *  `cuisineSlugs` at all, so older untagged listings don't disappear
 *  from cuisine pages during the transition. */
export function restaurantMatchesCuisineSlug(
  restaurant: { cuisineSlugs?: string[]; cuisine?: string },
  cuisine: Cuisine
): boolean {
  if (restaurant.cuisineSlugs && restaurant.cuisineSlugs.length > 0) {
    return restaurant.cuisineSlugs.includes(cuisine.slug);
  }
  return restaurantMatchesCuisine(restaurant.cuisine, cuisine);
}

/** Every distinct `region` value in use, in a fixed, sensible display
 *  order — the "parent grouping" layer over individual cuisines (see
 *  docs/CUISINE-TAXONOMY.md). Supplements the flat cuisine list; never
 *  replaces it, and never merges distinct cuisines together. */
export const CUISINE_REGION_ORDER: Cuisine["region"][] = [
  "South Asian",
  "Middle Eastern",
  "East Asian",
  "Southeast Asian",
  "African",
  "Caribbean",
  "European",
  "Americas",
];

/** Groups all active, full cuisines (kind === "cuisine"; dish-guides
 *  like "biryani-polao-london" are excluded since they're not a
 *  region-level category) by their parent region, in
 *  CUISINE_REGION_ORDER. Regions with no active cuisines are omitted
 *  rather than shown empty. */
export function getCuisinesByRegion(): { region: Cuisine["region"]; cuisines: Cuisine[] }[] {
  const cuisines = getAllCuisines().filter((c) => c.kind === "cuisine");
  return CUISINE_REGION_ORDER.map((region) => ({
    region,
    cuisines: cuisines.filter((c) => c.region === region),
  })).filter((group) => group.cuisines.length > 0);
}
