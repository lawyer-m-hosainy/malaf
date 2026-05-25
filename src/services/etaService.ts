import { supabase } from "@/lib/supabase";
import { requireOrgId } from "./utils";

// ─── الفاتورة الإلكترونية (ETA Invoices) ───────────────────────

/**
 * جلب قائمة فواتير منظومة الضرائب المصرية (ETA)
 * @returns {Promise<any[]>} قائمة فواتير ETA
 */
export async function fetchETAInvoices(): Promise<any[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("eta_invoices")
      .select("id, organization_id, amount, status, created_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("خطأ في جلب فواتير ETA:", error);
    return [];
  }
}

/**
 * حفظ أو تحديث بيانات فاتورة ETA في قاعدة البيانات المحلية
 * @param invoice - بيانات الفاتورة
 */
export async function saveETAInvoice(invoice: any): Promise<void> {
  const orgId = requireOrgId();
  try {
    const { error } = await supabase
      .from("eta_invoices")
      .upsert({ ...invoice, organization_id: orgId });
    if (error) throw error;
  } catch (error) {
    console.error("خطأ في حفظ فاتورة ETA:", error);
    throw error;
  }
}
