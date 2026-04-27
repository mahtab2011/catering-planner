"use client";

import { useState } from "react";

type Props = {
  onFilterChange: (filters: {
    search: string;
    area: string;
    cuisine: string;
  }) => void;
};

export default function RestaurantFilters({ onFilterChange }: Props) {
  const [search, setSearch] = useState("");
  const [area, setArea] = useState("");
  const [cuisine, setCuisine] = useState("");

  function updateFilters(next: {
    search?: string;
    area?: string;
    cuisine?: string;
  }) {
    const newFilters = {
      search: next.search ?? search,
      area: next.area ?? area,
      cuisine: next.cuisine ?? cuisine,
    };

    setSearch(newFilters.search);
    setArea(newFilters.area);
    setCuisine(newFilters.cuisine);

    onFilterChange(newFilters);
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      
      {/* Search */}
      <input
        type="text"
        placeholder="Search (e.g. Biryani)"
        value={search}
        onChange={(e) => updateFilters({ search: e.target.value })}
        className="rounded-xl border border-neutral-300 px-4 py-2"
      />

      {/* Area */}
      <select
        value={area}
        onChange={(e) => updateFilters({ area: e.target.value })}
        className="rounded-xl border border-neutral-300 px-4 py-2"
      >
        <option value="">All Areas</option>
        <option>Brick Lane</option>
        <option>Green Street</option>
        <option>Bethnal Green</option>
      </select>

      {/* Cuisine */}
      <select
        value={cuisine}
        onChange={(e) => updateFilters({ cuisine: e.target.value })}
        className="rounded-xl border border-neutral-300 px-4 py-2"
      >
        <option value="">All Cuisines</option>
        <option>Bangladeshi</option>
        <option>Indian</option>
        <option>Fusion</option>
      </select>
    </div>
  );
}