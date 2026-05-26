import { supabase } from "@/lib/supabase";
import { getCurrentTenantId } from "@/lib/tenant";

/**
 * الحصول على معرف المكتب (org_id) الحالي من جلسة المستخدم الحالية.
 * 
 * [القيد] تتطلب هذه الدالة أن يكون المستخدم قد سجل دخوله بالفعل وأن يكون المستأجر (Tenant) محملاً في الذاكرة.
 * 
 * @returns {string} معرّف المكتب (UUID) المستخرج من JWT أو التخزين المحلي
 * @throws {Error} إذا لم يتم العثور على المعرف أو لم يسجل المستخدم دخوله
 * 
 * @example
 * const orgId = requireOrgId();
 */
export function requireOrgId(): string {
  const orgId = getCurrentTenantId();
  if (!orgId) throw new Error("لم يتم تسجيل الدخول أو لم يتم تحميل معرّف المكتب.");
  return orgId;
}

/**
 * تسجيل حركة تقنية في سجل التدقيق (Audit Logs) لضمان الشفافية والامتثال القانوني.
 * 
 * [Supabase] الجدول: `audit_logs` | الصلاحيات: تتم عبر دالة SECURITY DEFINER في قاعدة البيانات
 * 
 * @param {string} action - نوع العملية البرمجية (مثل: CREATE, UPDATE, DELETE)
 * @param {string} entityType - نوع المورد المتأثر (مثل: cases, clients, invoices)
 * @param {string} entityId - المعرف الفريد (UUID) للمورد المتأثر
 * @param {string} [details] - وصف نصي إضافي للعملية باللغة العربية أو الإنجليزية
 * 
 * @returns {Promise<void>} دالة مستقبلية تنتهي عند اكتمال عملية التسجيل (أو تجاهلها بصمت)
 * 
 * @throws {PostgrestError} يتم تجاهل أخطاء قاعدة البيانات بصمت لضمان استمرارية تجربة المستخدم
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
