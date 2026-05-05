import { auth } from "@/lib/firebase";

export const DEMO_TENANT_ID = "demo-tenant";

/**
 * In-memory cache for the resolved tenantId.
 * Set by AuthProvider after reading the user profile from Firestore.
 */
let cachedTenantId: string | null = null;

export function setTenantIdCache(tenantId: string | null) {
  cachedTenantId = tenantId;
}

/**
 * Returns the current tenant ID.
 * Priority: cached value from Firestore > Firebase Auth tenantId > demo fallback.
 */
export function getCurrentTenantId(): string {
  if (cachedTenantId) return cachedTenantId;
  return auth.currentUser?.tenantId || "";
}
