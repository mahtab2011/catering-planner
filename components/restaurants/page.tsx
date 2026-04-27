"use client";

import { useState } from "react";
import RestaurantCard from "@/components/restaurants/RestaurantCard";
import RestaurantFilters from "@/components/restaurants/RestaurantFilters";

const restaurants = [
  {
    name: "Royal Bengal Kitchen",
    cuisine: "Bangladeshi",
    area: "Brick Lane",
    tags: ["Dine-in", "Takeaway", "Halal"],
    popularItems: ["Chicken Biryani", "Beef Bhuna", "Masala Chai"],
    href: "/restaurants/r1",
  },
  {
    name: "Green Spice House",
    cuisine: "Bangladeshi / Indian",
    area: "Green Street",
    tags: ["Takeaway", "Catering"],
    popularItems: ["Plain Polao", "Roast Chicken", "Firni"],
    href: "/restaurants/r2",
  },
];

export default function RestaurantsPage() {
  const [filtered, setFiltered] = useState(restaurants);

  function handleFilter(filters: {
    search: string;
    area: string;
    cuisine: string;
  }) {
    let result = restaurants;

    if (filters.search) {
      result = result.filter((r) =>
        r.name.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.area) {
      result = result.filter((r) => r.area === filters.area);
    }

    if (filters.cuisine) {
      result = result.filter((r) =>
        r.cuisine.toLowerCase().includes(filters.cuisine.toLowerCase())
      );
    }

    setFiltered(result);
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        
        <h1 className="text-3xl font-bold mb-6">
          Explore Restaurants
        </h1>

        <RestaurantFilters onFilterChange={handleFilter} />

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((restaurant) => (
            <RestaurantCard key={restaurant.name} {...restaurant} />
          ))}
        </div>
      </div>
    </main>
  );
}