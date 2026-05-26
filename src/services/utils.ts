import { supabase } from "@/lib/supabase";
import { getCurrentTenantId } from "@/lib/tenant";

/**
 * الحصول على معرف المكتب (org_id) الحالي مع التحقق من وجوده
 * @returns {string} معرّف المكتب
 * @throws {Error} إذا لم يتم العثور على المعرف
 */
export function requireOrgId(): string {
  const orgId = getCurrentTenantId();
  if (!orgId) throw new Error("لم يتم تسجيل الدخول أو لم يتم تحميل معرّف المكتب.");
  return orgId;
}

/**
 * تسجيل حركة في سجل التدقيق (Audit Logs)
 * @param action - نوع الحركة (CREATE, UPDATE, DELETE, etc.)
 * @param entityType - نوع الكيان المتأثر (cases, clients, etc.)
 * @param entityId - معرف الكيان
 * @param details - تفاصيل إضافية
 */
export async function logAuditAction(
  action: string,
  entityType: string,
  entityId: string,
  details?: string
): Promise<void> {
  try {
    const orgId = getCurrentTenantId();
    if (!orgId) return;
    const { error } = await supabase.from("audit_logs").insert({
      organization_id: orgId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details: { 
        info: details || `${action} on ${entityId}`,
        ip_address: typeof window !== 'undefined' ? 'client-side' : 'server-side', // Placeholder for actual IP
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
      },
    });
    // Silently ignore if table doesn't exist
    if (error && error.code !== "PGRST205" && error.code !== "42P01") {
      console.warn("Audit log skipped:", error.message);
    }
  } catch {
    // Completely silent
  }
}
