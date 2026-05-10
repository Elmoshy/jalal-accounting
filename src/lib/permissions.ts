import { type Role, hasMinRole, type SessionUser } from "./types";

export function canManageLocation(user: SessionUser, targetLocationId: string): boolean {
  if (user.role === "super_admin") return true;
  return user.locationId === targetLocationId;
}

export function canManageUsers(user: SessionUser): boolean {
  return hasMinRole(user.role, "super_admin");
}

export function canManageRoles(user: SessionUser): boolean {
  return hasMinRole(user.role, "super_admin");
}

export function canViewAllLocations(user: SessionUser): boolean {
  return user.role === "super_admin";
}

export function canWrite(user: SessionUser): boolean {
  return hasMinRole(user.role, "accountant");
}

export function canManageCustody(user: SessionUser): boolean {
  return hasMinRole(user.role, "accountant");
}

export function canManageSalaries(user: SessionUser): boolean {
  return hasMinRole(user.role, "city_admin");
}

export function assertPermission(condition: boolean, msg = "Forbidden"): void {
  if (!condition) {
    throw new Error(msg);
  }
}
