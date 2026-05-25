import { supabase } from "@/lib/supabase";
import { Invoice } from "@/types";
import { requireOrgId, logAuditAction } from "./utils";

/**
 * تحويل بيانات الفاتورة من تنسيق التطبيق إلى تنسيق قاعدة البيانات
 * @param inv - بيانات الفاتورة
 * @param orgId - معرف المكتب
 */
function mapInvoiceToDB(inv: any, orgId: string) {
  return {
    id: inv.id,
    organization_id: orgId,
    client_id: inv.clientId,
    amount: inv.base || inv.amount,
    total: inv.total,
    status: inv.status,
    date: inv.date,
    vat_amount: inv.vat || 0,
    created_at: inv.createdAt || new Date().toISOString(),
  };
}

/**
 * تحويل بيانات المصروف من تنسيق التطبيق إلى تنسيق قاعدة البيانات
 * @param exp - بيانات المصروف
 * @param orgId - معرف المكتب
 */
function mapExpenseToDB(exp: any, orgId: string) {
  return {
    id: exp.id,
    organization_id: orgId,
    case_id: exp.caseId || exp.case_id || null,
    client_id: exp.clientId || exp.client_id || null,
    amount: exp.amount,
    category: exp.category,
    description: exp.description,
    status: exp.status || "معلق",
    date: exp.date,
    created_at: exp.createdAt || new Date().toISOString(),
  };
}

// ─── الفواتير (Invoices) ─────────────────────────────────────────

/**
 * جلب قائمة الفواتير الخاصة بالمكتب
 * @returns {Promise<Invoice[]>} قائمة الفواتير
 */
export async function fetchInvoices(): Promise<Invoice[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("invoices")
      .select("id, client_id, amount, total, status, date, created_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;
    return (data || []) as any;
  } catch (error) {
    console.error("خطأ في جلب الفواتير:", error);
    return [];
  }
}

/**
 * حفظ بيانات فاتورة (Create or Update)
 * @param invoice - بيانات الفاتورة
 * @param isUpdate - هل هي عملية تحديث؟
 */
export async function saveInvoice(
  invoice: Invoice,
  isUpdate: boolean = false
): Promise<void> {
  const orgId = requireOrgId();
  try {
    const mappedInvoice = mapInvoiceToDB(invoice, orgId);
    const { error } = await supabase
      .from("invoices")
      .upsert(mappedInvoice); 
    if (error) throw error;
    await logAuditAction(
      isUpdate ? "UPDATE" : "CREATE",
      "invoices",
      invoice.id,
      `فاتورة بإجمالي ${invoice.total} ج.م`
    );
  } catch (error) {
    console.error("خطأ في حفظ الفاتورة:", error);
    throw error;
  }
}

/**
 * حذف فاتورة نهائياً من قاعدة البيانات
 * @param invoiceId - معرف الفاتورة
 */
export async function deleteInvoice(invoiceId: string): Promise<void> {
  const orgId = requireOrgId();
  const { error } = await supabase
    .from("invoices")
    .delete()
    .eq("id", invoiceId)
    .eq("organization_id", orgId);
  if (error) throw error;
  await logAuditAction("DELETE", "invoices", invoiceId, "حذف فاتورة");
}

// ─── المصروفات (Expenses) ────────────────────────────────────────

/**
 * جلب قائمة المصروفات الخاصة بالمكتب
 * @returns {Promise<any[]>} قائمة المصروفات
 */
export async function fetchExpenses(): Promise<any[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("expenses")
      .select("id, case_id, client_id, category, amount, date, status, description, requires_partner_approval, created_at")
      .eq("organization_id", orgId)
      .order("date", { ascending: false })
      .limit(100);
    if (error) throw error;
    return (data || []).map(e => ({
      ...e,
      caseId: e.case_id,
      createdAt: e.created_at,
    }));
  } catch (error) {
    console.error("خطأ في جلب المصروفات:", error);
    return [];
  }
}

/**
 * حفظ بيانات مصروف (Create or Update)
 * @param expense - بيانات المصروف
 */
export async function saveExpense(expense: any): Promise<void> {
  const orgId = requireOrgId();
  try {
    const mappedExpense = mapExpenseToDB(expense, orgId);
    const { error } = await supabase.from("expenses").upsert(mappedExpense);
    if (error) throw error;
  } catch (error) {
    console.error("خطأ في حفظ المصروف:", error);
    throw error;
  }
}

/**
 * حذف سجل مصروف
 * @param id - معرف المصروف
 */
export async function deleteExpense(id: string): Promise<void> {
  const orgId = requireOrgId();
  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", id)
    .eq("organization_id", orgId);
  if (error) throw error;
  await logAuditAction("DELETE", "expenses", id, "حذف مصروف");
}

// ─── التحصيل والمطالبات (Receivables & Collections) ──────────────

/**
 * جلب قائمة المطالبات المالية (الذمم المدينة)
 * @returns {Promise<any[]>} قائمة المطالبات
 */
export async function fetchReceivables(): Promise<any[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("receivables")
      .select("id, client_id, client_name, amount, status, due_date, description, created_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("خطأ في جلب المطالبات:", error);
    return [];
  }
}

/**
 * حفظ بيانات مطالبة مالية
 * @param rec - بيانات المطالبة
 */
export async function saveReceivable(rec: any): Promise<void> {
  const orgId = requireOrgId();
  try {
    const { error } = await supabase
      .from("receivables")
      .upsert({ ...rec, organization_id: orgId });
    if (error) throw error;
  } catch (error) {
    console.error("خطأ في حفظ المطالبة:", error);
    throw error;
  }
}

/**
 * حذف سجل مطالبة مالية
 * @param id - معرف المطالبة
 */
export async function deleteReceivableRecord(id: string): Promise<void> {
  const orgId = requireOrgId();
  const { error } = await supabase
    .from("receivables")
    .delete()
    .eq("id", id)
    .eq("organization_id", orgId);
  if (error) throw error;
}

/**
 * جلب إجراءات التحصيل المتخذة لمطالبة معينة
 * @param receivableId - معرف المطالبة
 * @returns {Promise<any[]>} قائمة الإجراءات
 */
export async function fetchCollectionActions(receivableId: string): Promise<any[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("collection_actions")
      .select("id, receivable_id, action_type, notes, date, created_at")
      .eq("organization_id", orgId)
      .eq("receivable_id", receivableId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("خطأ في جلب إجراءات التحصيل:", error);
    return [];
  }
}

/**
 * حفظ إجراء تحصيل جديد
 * @param action - بيانات الإجراء
 */
export async function saveCollectionAction(action: any): Promise<void> {
  const orgId = requireOrgId();
  try {
    const { error } = await supabase
      .from("collection_actions")
      .upsert({ ...action, organization_id: orgId });
    if (error) throw error;
  } catch (error) {
    console.error("خطأ في حفظ إجراء التحصيل:", error);
    throw error;
  }
}
