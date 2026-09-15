# Editorial Content Templates

Written for: the London Food Hubs site owner, to use when writing real editorial content in `/admin/recommendations` and `/admin/blog`.

Every field below is a **structural placeholder** — no restaurant names, dish claims, or ratings are pre-filled, because none of that can be invented. Fill in the bracketed parts with things you've actually verified. Everything you publish through the admin UI defaults to inactive/draft, so nothing goes live until you explicitly switch it on.

## How the two systems differ

- **Recommendations** (`/admin/recommendations`) are short, single-card editorial picks — "London Food Hubs Recommends" badges shown on the homepage, cuisine pages, and the `/recommendations` page. They are clearly styled apart from customer reviews (purple "Editorial" badge, never a star rating).
- **Articles** (`/admin/blog`) are full long-form pieces on `/blog`.

Both are admin-only to write, per `firestore.rules`, and never appear publicly until you set them active/published.

---

## Recommendation templates

### Restaurant recommendation
- **Type:** pick whichever fits — Editor's Choice / Hidden Gem / Worth the Journey / Family Favourite / Budget Favourite / Traditional Favourite / Special Occasion
- **Target type:** Restaurant
- **Target ID:** the restaurant's Firestore document id (open the restaurant's `/restaurants/{id}` page and copy the id from the URL)
- **Title:** `[Restaurant name] — [why, in a few words]`
- **Blurb:** One or two sentences on what specifically makes this restaurant worth the pick — a dish, an atmosphere detail, something you or a trusted source actually experienced. Not a generic compliment.
- **Link:** `/restaurants/[id]`

### Dish recommendation
- **Type:** Dish of the Week (or another type if it fits better)
- **Target type:** Dish
- **Dish name:** `[Dish name]`
- **Title:** `[Dish name] at [Restaurant name]` (or just the dish name if not tied to one restaurant)
- **Blurb:** What the dish is, why it's worth trying, any real detail (spice level, portion, how it's served).
- **Link:** the restaurant page if tied to one, otherwise the relevant `/cuisine/[slug]` page.

### Cuisine recommendation
- **Type:** Editor's Choice / Traditional Favourite
- **Target type:** Cuisine
- **Target ID:** the cuisine's slug from `lib/cuisines.ts` (e.g. `bangladeshi-food-east-london`, `pakistani-food-london`)
- **Title:** `Why [Cuisine] Food Deserves More Attention` or similar
- **Blurb:** A genuine editorial point about the cuisine as a whole — not a restaurant-specific claim.
- **Link:** `/cuisine/[slug]`

### Food hub recommendation
- **Type:** Worth the Journey / Hidden Gem
- **Target type:** Hub
- **Target ID:** the hub's slug from `lib/hubs.ts` (e.g. `plashet-road`, `edgware-road`)
- **Title:** `[Hub name] — [why it's worth visiting]`
- **Blurb:** What makes the area worth a visit as a whole.
- **Link:** `/hubs/[slug]`

---

## Blog article templates

Pick a category from the existing taxonomy in `lib/blogCategories.ts` (London Food Stories, Cuisine Guides, Restaurant Stories, What to Eat, Food Hubs, Healthy Choices, Traditional Food, New in London, Festival & Seasonal Food) rather than inventing a new one — add a new category there first if you genuinely need one.

### Cuisine guide
```
Title: A Guide to [Cuisine] Food in London
Category: Cuisine Guides
Excerpt: One sentence hook — what a reader will learn.

Body (paragraphs separated by a blank line):
[Cuisine] cuisine brings together [2-3 real, verifiable characteristics
of the cuisine — flavour profile, key ingredients, cooking style].

[A paragraph on where to find it in London — reference real hubs by
name if you know specific concentrations, e.g. "East London's Brick
Lane and Green Street corridors..."]

[A paragraph naming 3-5 dishes worth trying, with one line each on
what they are — pull from lib/cuisines.ts's existing dish lists for
this cuisine rather than inventing new dish names.]

Related cuisines: [tick the matching cuisine in the admin form]
```

### Food hub spotlight
```
Title: Discovering [Hub Name]
Category: Food Hubs
Excerpt: One sentence on what makes this hub distinct.

Body:
[What the area is like, who it serves, transport info — you can pull
factual travel directions from lib/hubs.ts's travelInfo field for this
hub if it has one.]

[What kind of food/cuisines are concentrated there.]

[A closing paragraph inviting readers to explore restaurants in the
hub, linking to /hubs/[slug].]
```

### "What to eat" seasonal/festival piece
```
Title: What to Eat in London for [Festival/Season]
Category: Festival & Seasonal Food
Excerpt: One sentence hook.

Body:
[Context on the festival/season and its food traditions — only
include traditions you can verify.]

[2-4 dishes or cuisines relevant to the occasion, linking to their
/cuisine/[slug] pages.]
```

### Restaurant story
Only write this once you have a restaurant willing to be featured and factual details you've confirmed with them directly (their story, their menu, their background) — this is the one template that inherently involves real, specific claims about a real business, so it needs a real source, not a draft filled from imagination.

```
Title: [Restaurant Name]: [Angle — e.g. "Three Generations of Biryani"]
Category: Restaurant Stories
Excerpt: One sentence hook.

Body:
[The restaurant's actual story, confirmed with the owner — history,
what makes it distinct, a specific dish or technique.]

Related restaurant: [tick/link the restaurant]
```
