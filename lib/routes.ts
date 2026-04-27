export const ROUTES = {
  home: "/",
  about: "/about",
  contact: "/contact",
  pricing: "/pricing",
  howItWorks: "/how-it-works",

  hubs: "/hubs",
  restaurants: "/restaurants",
  catering: "/catering",

  login: "/login",
  signup: "/signup",

  dashboard: "/dashboard",

  customerDashboard: "/dashboard/customer",
  restaurantDashboard: "/dashboard/restaurant",
  catererDashboard: "/dashboard/caterer",
  supplierDashboard: "/dashboard/supplier",
  householdDashboard: "/dashboard/household",
  adminDashboard: "/dashboard/admin",
} as const;

export const hubDetailRoute = (slug: string) => `/hubs/${slug}`;

export const restaurantDetailRoute = (id: string) => `/restaurants/${id}`;
export const restaurantMenuRoute = (id: string) => `/restaurants/${id}/menu`;

export const cateringDetailRoute = (id: string) => `/catering/${id}`;

export const customerOrderDetailRoute = (id: string) =>
  `/dashboard/customer/orders/${id}`;

export const restaurantOrderDetailRoute = (id: string) =>
  `/dashboard/restaurant/orders/${id}`;

export const catererEventDetailRoute = (id: string) =>
  `/dashboard/caterer/events/${id}`;

export const supplierOrderDetailRoute = (id: string) =>
  `/dashboard/supplier/orders/${id}`;