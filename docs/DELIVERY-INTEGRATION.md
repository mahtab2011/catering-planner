# Future Delivery Layer: How It Connects to London Food Hubs

Written for: whoever picks up delivery/ordering/payments once the discovery platform (restaurants, cuisines, hubs, reviews, blog, recommendations) has real users and listings.

Per the current instruction set, **no delivery, rider, payment, or customer-ordering logic was built in this pass** — this document exists only to record how the pieces built now are meant to connect to that layer later, so the discovery-platform work doesn't have to be reworked when ordering is added.

## What already exists and stays as-is

SmartServeUK's operational order/rider infrastructure was not touched in this session and remains the foundation for delivery when it's built:

- `orders` collection + `app/orders/board`, `kitchen`, `delivery`, `new`, `ready`, `rider*`, `search` — full order lifecycle (new → accepted → preparing → ready → completed/cancelled), already has kitchen and delivery-specific views.
- `riders` / `rider_signups` collections + `app/riders`, `app/orders/rider*` — rider onboarding and assignment.
- `lib/types.ts`'s `CustomerOrderDoc`, `OrderItem`, `CustomerOrderStatus` — the existing order data model.

## How the new discovery entities line up with the order model

| Discovery-side concept (this session) | Order-side concept (existing) | Notes |
|---|---|---|
| A restaurant/business found via `/restaurants`, `/cuisine/[slug]`, `/hubs/[slug]` | `restaurants/{id}` (`RestaurantDoc`, or the looser `LiveRestaurant` shape actually used by the public pages) | Same collection — discovery pages already read live restaurant docs, so a restaurant that starts taking orders doesn't need a new identity, just new fields (see below). |
| A menu item shown on a restaurant page (`restaurant.menuCategories[].items[]`) | `OrderItem` (`menuItemId`, `name`, `qty`, `unitPrice`, `lineTotal`) | Today menu items are an inline array with no stable `id`/price-as-number in the public-facing shape used by `app/restaurants/[id]/page.tsx` (`price` is a display string, e.g. `"£8.50"`, not `RestaurantMenuItemDoc`'s numeric `price`+`currency`). Before ordering can be built, menu items need a stable id and numeric price — see "Known gap" below. |
| A cuisine (`lib/cuisines.ts`) | — | Cuisines are editorial/taxonomy only; they don't need an order-side equivalent, they just group restaurants. |
| A food hub (`lib/hubs.ts`) | Potential future `deliveryZones` | A hub's `areaLabel`/postcode information is a natural starting point for defining delivery zones later, but no delivery-zone or delivery-pricing data exists yet — hubs today are purely editorial/geographic groupings. |
| Editorial recommendation targeting a restaurant (`recommendations` collection) | — | Purely editorial; no order-side dependency. |
| Customer review (`reviews` collection, `restaurantId`) | — | Independent of ordering — a review is left about a restaurant, not tied to a specific order today. (Once ordering exists, a natural enhancement is "verified order" reviews tied to a completed `CustomerOrderDoc`, but that's new scope, not assumed here.) |

## Known gap to resolve before building ordering

`app/restaurants/[id]/page.tsx`'s live restaurant shape stores menu items as `{ name: string; price: string; note?: string }[]` grouped under `{ category: string; items: [...] }[]` — a display-only shape with no item id and a free-text price (`"£8.50"`, sometimes `"Price on request"`). `RestaurantMenuItemDoc` in `lib/types.ts` (the more structured type touched on in the original inspection) has a stable `id`, numeric `price`, and `currency`, but the public restaurant page doesn't currently read from that model. Reconciling these two menu-item shapes — almost certainly by migrating restaurant-side menu editing onto `RestaurantMenuItemDoc` — is a prerequisite for a real "add to cart" flow, not something to improvise once ordering starts.

## Suggested phased connection (not built, for planning only)

1. **Customer ordering**: add a cart/checkout flow on `app/restaurants/[id]/page.tsx` once menu items have stable ids + numeric prices; writes a `CustomerOrderDoc` into the existing `orders` collection — no new collection needed.
2. **Restaurant order acceptance**: already exists (`app/orders/board`, `app/orders/kitchen`) — a restaurant taking online orders for the first time just starts seeing rows appear in a system it may already use for phone/walk-in orders today.
3. **Delivery pricing & zones**: add `deliveryFee`/`deliveryRadius`/`minimumOrder` fields to the restaurant doc, and/or a `hubIds`-based zone concept on top of `lib/hubs.ts`'s existing hub taxonomy.
4. **Rider allocation**: already exists (`riders` collection, `app/orders/rider*`) — extending it to auto-assign based on the customer's postcode is new logic, but the collection and the manual-assignment UI don't need to be rebuilt.
5. **Rider app**: a separate client (mobile or lightweight web) consuming the same `orders`/`riders` collections via the Firebase mobile SDKs — no backend rebuild required per the earlier architecture inspection.
6. **Payments**: today `app/checkout` is a stub and `app/order` explicitly lists manual-only payment methods ("SmartServeUK does not store card details"). Adding real payment processing (Stripe or similar) is a distinct, security-sensitive piece of work that should be scoped and reviewed on its own — it is out of scope for this document and wasn't started here.
