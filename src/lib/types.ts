export type Role = "super_admin" | "city_admin" | "accountant" | "viewer";

export const ROLE_HIERARCHY: Record<Role, number> = {
  super_admin: 100,
  city_admin: 50,
  accountant: 20,
  viewer: 10,
};

export function hasMinRole(userRole: Role, minRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole];
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  locationId: string | null;
}

export type InventoryTxType = "IN" | "OUT";

export type CustodyStatus = "active" | "returned" | "lost";

export type ExpenseCategory =
  | "petty_cash"
  | "transport"
  | "office"
  | "utilities"
  | "maintenance"
  | "other";

export type ProjectStatus = "active" | "completed" | "cancelled";
