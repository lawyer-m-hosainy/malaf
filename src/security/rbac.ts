import { UserRole } from "@/types";

export type SystemRole = "admin" | "lawyer" | "staff" | "client";

const roleMap: Record<UserRole, SystemRole> = {
  "مدير مكتب": "admin",
  "محامي": "lawyer",
  "محامي شريك": "lawyer",
  "محامي مستشار": "lawyer",
  "محامي متدرب": "lawyer",
  "سكرتير": "staff",
};

export function mapToSystemRole(role?: UserRole | null): SystemRole | null {
  if (!role) return null;
  return roleMap[role] || null;
}

export function hasRequiredRole(userRole: UserRole | null | undefined, requiredRoles?: SystemRole[]) {
  if (!requiredRoles || requiredRoles.length === 0) return true;
  const mapped = mapToSystemRole(userRole);
  return !!mapped && requiredRoles.includes(mapped);
}
