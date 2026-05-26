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
 * جلب قائمة بكافة الفواتير الصادرة عن المكتب.
 * 
 * [Supabase] الجدول: `invoices` | RLS: معزول حسب المستأجر
 * 
 * @returns {Promise<Invoice[]>} قائمة الفواتير مرتبة من الأحدث إلى الأقدم
 * @throws {PostgrestError} عند حدوث خطأ في استعلام قاعدة البيانات
 * 
 * @example
 * const invoices = await fetchInvoices();
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
 * حفظ أو تحديث بيانات فاتورة في قاعدة البيانات مع تسجيل الحركة في سجل التدقيق.
 * 
 * @param {Invoice} invoice - كائن بيانات الفاتورة المراد حفظه
 * @param {boolean} [isUpdate=false] - هل العملية تعديل لفاتورة موجودة أم إنشاء جديدة
 * 
 * @returns {Promise<void>} دالة مستقبلية تنتهي عند نجاح العملية
 * @throws {PostgrestError} إذا فشلت عملية الـ Upsert في قاعدة البيانات
 * 
 * @example
 * await saveInvoice(newInvoiceData, false);
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
 * حذف فاتورة بشكل نهائي من قاعدة البيانات.
 * 
 * [تحذير] هذه العملية لا يمكن التراجع عنها وتؤثر على التقارير المالية.
 * 
 * @param {string} invoiceId - المعرف الفريد للفاتورة
 * @returns {Promise<void>} دالة مستقبلية تنتهي عند نجاح الحذف
 * @throws {PostgrestError} إذا فشل الحذف أو خرق سياسة الـ RLS
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
 * جلب قائمة المصروفات الإدارية والقضائية المسجلة للمكتب.
 * 
 * @returns {Promise<any[]>} قائمة المصروفات مع بيانات الحالة والموافقة
 * @throws {PostgrestError} عند حدوث خطأ في قاعدة البيانات
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
 * حفظ أو تحديث سجل مصروف مالي.
 * 
 * @param {any} expense - بيانات المصروف (المبلغ، التصنيف، الوصف)
 * @returns {Promise<void>} دالة مستقبلية تنتهي عند نجاح العملية
 * @throws {PostgrestError} عند فشل الـ Upsert
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
 * حذف سجل مصروف مالي بشكل نهائي.
 * 
 * @param {string} id - معرف سجل المصروف
 * @returns {Promise<void>} دالة مستقبلية تنتهي عند نجاح الحذف
 * @throws {PostgrestError} عند فشل الحذف
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
 * جلب قائمة المطالبات المالية (الذمم المدينة) المستحقة للمكتب على الموكلين.
 * 
 * تقوم هذه الدالة بحساب المبالغ المتبقية (Outstanding) آلياً لكل مطالبة.
 * 
 * @returns {Promise<any[]>} قائمة المطالبات مع تفاصيل التحصيل والحسابات المتبقية
 * @throws {PostgrestError} عند حدوث خطأ في قاعدة البيانات
 */
export async function fetchReceivables(): Promise<any[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("receivables")
      .select("id, client_id, client_name, amount, collected_amount, status, due_date, description, created_at, case_id")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    
    return (data || []).map((row: any) => {
      const amount = parseFloat(row.amount) || 0;
      const collected = parseFloat(row.collected_amount) || 0;
      return {
        ...row,
        total_amount: amount,
        collected_amount: collected,
        outstanding_amount: amount - collected,
      };
    });
  } catch (error) {
    console.error("خطأ في جلب المطالبات:", error);
    return [];
  }
}

/**
 * حفظ بيانات مطالبة مالية جديدة أو تحديث مطالبة قائمة.
 * 
 * @param {any} rec - كائن بيانات المطالبة (المبلغ الكلي، الموكل، التاريخ)
 * @returns {Promise<void>} دالة مستقبلية تنتهي عند نجاح العملية
 * @throws {PostgrestError} عند فشل الـ Upsert
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
 * حذف سجل مطالبة مالية بشكل نهائي.
 * 
 * @param {string} id - معرف سجل المطالبة
 * @returns {Promise<void>} دالة مستقبلية تنتهي عند نجاح الحذف
 * @throws {PostgrestError} عند فشل الحذف
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
 * جلب كافة إجراءات التحصيل (اتصالات، خطابات، ملاحقات) المتخذة لمطالبة معينة.
 * 
 * @param {string} receivableId - المعرف الفريد للمطالبة المالية
 * @returns {Promise<any[]>} قائمة الإجراءات المسجلة
 * @throws {PostgrestError} عند فشل الاستعلام
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
 * تسجيل إجراء تحصيل جديد لمطالبة مالية.
 * 
 * @param {any} action - بيانات الإجراء المتخذ (نوع الإجراء، ملاحظات، تاريخ)
 * @returns {Promise<void>} دالة مستقبلية تنتهي عند نجاح الحفظ
 * @throws {PostgrestError} عند فشل عملية الإدراج
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
