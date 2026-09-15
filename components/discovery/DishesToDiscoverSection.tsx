import Link from "next/link";
import { getAllCuisines } from "@/lib/cuisines";

type DishCard = {
  name: string;
  description?: string;
  cuisineName: string;
  cuisineSlug: string;
};

function buildDishCards(): DishCard[] {
  const cuisines = getAllCuisines();
  const cards: DishCard[] = [];

  // Prioritise dishes that already have real editorial descriptions.
  for (const cuisine of cuisines) {
    for (const dish of cuisine.featuredDishes || []) {
      cards.push({
        name: dish.name,
        description: dish.description,
        cuisineName: cuisine.name,
        cuisineSlug: cuisine.slug,
      });
    }
  }

  // Fill out with a spread of named dishes across different cuisines
  // (no invented descriptions) so the section isn't dominated by one
  // region.
  const seenCuisines = new Set(cards.map((c) => c.cuisineSlug));
  for (const cuisine of cuisines) {
    if (cards.length >= 8) break;
    if (seenCuisines.has(cuisine.slug)) continue;
    const firstDish =
      cuisine.dishCategories?.[0]?.items?.[0] || cuisine.dishes?.[0];
    if (firstDish) {
      cards.push({ name: firstDish, cuisineName: cuisine.name, cuisineSlug: cuisine.slug });
      seenCuisines.add(cuisine.slug);
    }
  }

  return cards.slice(0, 8);
}

export default function DishesToDiscoverSection() {
  const dishes = buildDishCards();

  if (dishes.length === 0) return null;

  return (
    <section>
      <h2 className="text-2xl font-bold text-neutral-900">Dishes to Discover</h2>
      <p className="mt-2 max-w-2xl text-sm text-neutral-600">
        A taste of what's out there — explore the cuisine page for restaurants serving each dish.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {dishes.map((dish) => (
          <Link
            key={`${dish.cuisineSlug}-${dish.name}`}
            href={`/cuisine/${dish.cuisineSlug}`}
            className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="text-sm font-semibold text-neutral-900">{dish.name}</div>
            <div className="mt-1 text-xs text-amber-700">{dish.cuisineName}</div>
            {dish.description ? (
              <p className="mt-2 line-clamp-3 text-xs text-neutral-600">{dish.description}</p>
            ) : null}
          </Link>
        ))}
      </div>
    </section>
  );
}
