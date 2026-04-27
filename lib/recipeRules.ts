export type RecipeRule =
  | {
      type: "piece" | "cup" | "ml" | "gram";
      perGuest: number;
      extraAllowed?: boolean;
      extraOptions?: number[];
    }
  | {
      type: "ratio";
      perPeople: number;
      quantity: number;
    };

export const recipeRules: Record<string, RecipeRule> = {
  chicken_roast: {
    type: "piece",
    perGuest: 1,
    extraAllowed: true,
    extraOptions: [0, 5, 10],
  },

  jali_kabab: {
    type: "piece",
    perGuest: 1,
    extraAllowed: false,
  },

  shami_kabab: {
    type: "piece",
    perGuest: 1,
    extraAllowed: false,
  },

  firni: {
    type: "cup",
    perGuest: 1,
  },

  borhani: {
    type: "ml",
    perGuest: 400,
  },

  salad: {
    type: "gram",
    perGuest: 100,
  },

  // NOTE: this is NOT used directly unless you call "lemon" as a dish
  lemon: {
    type: "ratio",
    perPeople: 6,
    quantity: 1,
  },
};