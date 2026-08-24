// src/constants/admin.ts

export const MODULES = [
  "admins",
  "roles",
  "bus_types",
  "buses",
  "drivers",
  "codrivers",
  "pickup_points",
  "routes",
  "departments",
  "rides",
  "notes",
  "students",
  "parents",
  "City",
  "Zone",
  "feeinstallments",
  "Subscription",
  "invoices",
  "organizationServices",
  "payments",
  "paymentMethods",
  "plans"
] as const;

export const ACTION_NAMES = ["View", "Add", "Edit", "Delete", "Status"] as const;

export type ModuleName = (typeof MODULES)[number];
export type ActionName = (typeof ACTION_NAMES)[number];



// src/constants/superAdminPermissions.ts

export const SUPER_ADMIN_MODULES = [
  "organizations",
  "plans", 
  "payments",
  "subscriptions",
  "payment_methods",
  "promocodes",
  "parentplans",
  "sub_admins",
  "super_admin_roles",
  "type_organizations",
  "invoices",
  "installments",
  "wallets",
  "profile",
  "notes"
] as const;

export const SUPER_ADMIN_ACTIONS = [
  "view",
  "create",
  "update",
  "delete",
  "status"
] as const;

export type SuperAdminModule = (typeof SUPER_ADMIN_MODULES)[number];
export type SuperAdminAction = (typeof SUPER_ADMIN_ACTIONS)[number];