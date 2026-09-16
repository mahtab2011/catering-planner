import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getAllCuisines, getCuisineDisplayName } from "@/lib/cuisines";
import type { Cuisine } from "@/lib/types";

type DishCard = {
  name: string;
  description?: string;
  cuisine: Cuisine;
};

function buildDishCards(): DishCard[] {
  const cuisines = getAllCuisines();
  const cards: DishCard[] = [];

  // Prioritise dishes that already have real editorial descriptions.
  for (const cuisine of cuisines) {
    for (const dish of cuisine.featuredDishes || []) {
      cards.push({ name: dish.name, description: dish.description, cuisine });
    }
  }

  // Fill out with a spread of named dishes across different cuisines
  // (no invented descriptions) so the section isn't dominated by one
  // region.
  const seenCuisines = new Set(cards.map((c) => c.cuisine.slug));
  for (const cuisine of cuisines) {
    if (cards.length >= 8) break;
    if (seenCuisines.has(cuisine.slug)) continue;
    const firstDish =
      cuisine.dishCategories?.[0]?.items?.[0] || cuisine.dishes?.[0];
    if (firstDish) {
      cards.push({ name: firstDish, cuisine });
      seenCuisines.add(cuisine.slug);
    }
  }

  return cards.slice(0, 8);
}

export default function DishesToDiscoverSection() {
  const t = useTranslations("Home");
  const locale = useLocale();
  const dishes = buildDishCards();

  if (dishes.length === 0) return null;

  return (
    <section>
      <h2 className="text-2xl font-bold text-neutral-900">{t("dishesToDiscover")}</h2>
      <p className="mt-2 max-w-2xl text-sm text-neutral-600">
        {t("dishesToDiscoverSubtitle")}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {dishes.map((dish) => (
          <Link
            key={`${dish.cuisine.slug}-${dish.name}`}
            href={`/cuisine/${dish.cuisine.slug}`}
            className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="text-sm font-semibold text-neutral-900">{dish.name}</div>
            <div className="mt-1 text-xs text-amber-700">{getCuisineDisplayName(dish.cuisine, locale)}</div>
            {dish.description ? (
              <p className="mt-2 line-clamp-3 text-xs text-neutral-600">{dish.description}</p>
            ) : null}
          </Link>
        ))}
      </div>
    </section>
  );
}
