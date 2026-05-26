/**
 * Tenant (Organization) ID management — Supabase only.
 * Firebase has been completely removed from this project.
 */

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
 * Returns the current organization ID from the in-memory cache.
 */
export function getCurrentTenantId(): string {
  return cachedTenantId || "";
}
