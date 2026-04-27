import { UserRole } from "./types";

export function isCustomerRole(role?: UserRole) {
  return role === "customer";
}

export function isRestaurantRole(role?: UserRole) {
  return role === "restaurant";
}

export function isCatererRole(role?: UserRole) {
  return role === "caterer";
}

export function isSupplierRole(role?: UserRole) {
  return role === "supplier";
}

export function isHouseholdRole(role?: UserRole) {
  return role === "household";
}

export function isAdminRole(role?: UserRole) {
  return role === "admin";
}

export function isBusinessRole(role?: UserRole) {
  return (
    role === "restaurant" ||
    role === "caterer" ||
    role === "supplier" ||
    role === "admin"
  );
}

export function canManageRestaurant(role?: UserRole) {
  return role === "restaurant" || role === "admin";
}

export function canManageCaterer(role?: UserRole) {
  return role === "caterer" || role === "admin";
}

export function canManageSupplier(role?: UserRole) {
  return role === "supplier" || role === "admin";
}

export function canViewAdmin(role?: UserRole) {
  return role === "admin";
}

export function canPlaceSupplierOrder(role?: UserRole) {
  return (
    role === "restaurant" ||
    role === "caterer" ||
    role === "household" ||
    role === "admin"
  );
}

export function getDefaultDashboardRoute(role?: UserRole) {
  switch (role) {
    case "customer":
      return "/dashboard/customer";
    case "restaurant":
      return "/dashboard/restaurant";
    case "caterer":
      return "/dashboard/caterer";
    case "supplier":
      return "/dashboard/supplier";
    case "household":
      return "/dashboard/household";
    case "admin":
      return "/dashboard/admin";
    default:
      return "/login";
  }
}