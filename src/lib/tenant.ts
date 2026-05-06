import { auth } from "@/lib/firebase";

export const DEMO_TENANT_ID = "demo-tenant";

/**
 * In-memory cache for the resolved orgId (tenantId).
 * Set by AuthProvider after reading the user profile from the database.
 */
let cachedTenantId: string | null = null;

export function setTenantIdCache(tenantId: string | null) {
  cachedTenantId = tenantId;
}

/**
 * Returns the current organization ID.
 * Priority: cached value from AuthProvider > Firebase Auth tenantId > demo fallback.
 */
export function getCurrentTenantId(): string {
  if (cachedTenantId) return cachedTenantId;
  return auth.currentUser?.tenantId || "";
}
