import { supabase } from "@/lib/supabase";
import { Case } from "@/types";
import { requireOrgId, logAuditAction } from "./utils";

const CASES_TABLE = "cases";

/**
 * تحويل بيانات القضية من تنسيق التطبيق إلى تنسيق قاعدة البيانات
 * @param c - بيانات القضية من الواجهة
 * @param orgId - معرف المكتب
 */
function mapCaseToDB(c: any, orgId: string) {
  const getVal = (val: any, fallback = "") => val || fallback;
  
  const mapped: any = {
    org_id: orgId,
    client_id: getVal(c.clientId, c.client_id),
    court: getVal(c.court, getVal(c.court_location)),
    type: getVal(c.type, getVal(c.court_category)),
    status: getVal(c.status, "متداولة"),
    plaintiff: getVal(c.plaintiff),
    defendant: getVal(c.defendant),
    first_instance_number: getVal(c.firstInstanceNumber, c.first_instance_number),
    appeal_number: getVal(c.appealNumber, c.appeal_number),
    cassation_number: getVal(c.cassationNumber, c.cassation_number),
  };

  if (c.id && typeof c.id === 'string' && c.id.length > 10) {
    mapped.id = c.id;
  }
  
  return mapped;
}

/**
 * تحويل بيانات القضية من تنسيق قاعدة البيانات إلى تنسيق التطبيق
 * @param d - البيانات الخام من Supabase
 * @returns {Case} كائن القضية المنسق
 */
function mapDBToCase(d: any): Case {
  return {
    ...d,
    clientId: d.client_id,
    clientRole: d.client_role,
    automatedNumber: d.case_number,
    firstInstanceNumber: d.first_instance_number,
    appealNumber: d.appeal_number,
    cassationNumber: d.cassation_number,
    createdAt: d.created_at,
  } as Case;
}

/**
 * يجلب قائمة بكافة القضايا النشطة التابعة للمكتب الحالي.
 * 
 * [Supabase] الجدول: `cases` | RLS: مفعل (عزل حسب organization_id)
 * [Supabase] الفلترة: يتم استبعاد السجلات التي تم حذفها ناعماً (deleted_at IS NULL)
 * 
 * @returns {Promise<Case[]>} قائمة منسقة بكائنات القضايا مع بيانات المحامي والوثائق المرتبطة
 * @throws {PostgrestError} إذا فشل الاتصال بقاعدة البيانات أو تم انتهاك سياسات الوصول
 * 
 * @example
 * const activeCases = await fetchCases();
 */
export async function fetchCases(): Promise<Case[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from(CASES_TABLE)
      .select("*, lawyer:profiles(full_name), documents(title, created_at)")
      .eq("org_id", orgId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    return (data || []).map(mapDBToCase);
  } catch (error) {
    console.error("خطأ في جلب القضايا:", error);
    throw error;
  }
}

/**
 * يقوم بحفظ أو تحديث مجموعة من القضايا دفعة واحدة (Bulk Operations).
 * 
 * [قانوني] يتم تسجيل عملية الحفظ لكل قضية في سجل التدقيق لضمان الامتثال.
 * 
 * @param {Case[]} cases - مصفوفة من كائنات القضايا المراد حفظها
 * @returns {Promise<void>} دالة مستقبلية تنتهي عند اكتمال عملية الحفظ والتسجيل
 * @throws {PostgrestError} إذا فشلت عملية الإدراج أو التحديث الجماعي
 * @throws {Error} إذا لم يتم العثور على معرف المكتب الحالي
 */
export async function saveCases(cases: Case[]): Promise<void> {
  const orgId = requireOrgId();
  try {
    const mappedCases = cases.map((c) => mapCaseToDB(c, orgId));
    const { error } = await supabase.from(CASES_TABLE).upsert(mappedCases);
    if (error) throw error;
    
    for (const c of cases) {
      await logAuditAction("UPSERT", "cases", c.id, `حفظ قضية: ${c.title || c.id}`);
    }
  } catch (error) {
    console.error("خطأ في حفظ القضايا:", error);
    throw error;
  }
}

/**
 * حفظ أو تحديث بيانات قضية واحدة بشكل مستقل.
 * 
 * @param {Partial<Case>} caseData - كائن يحتوي على بيانات القضية (أو جزء منها في حالة التحديث)
 * @returns {Promise<void>} دالة مستقبلية تنتهي عند نجاح العملية
 * @throws {PostgrestError} عند فشل الـ Upsert في قاعدة البيانات
 */
export async function saveCase(caseData: Partial<Case>): Promise<void> {
  const orgId = requireOrgId();
  try {
    const mappedCase = mapCaseToDB(caseData, orgId);
    const { data, error } = await supabase.from(CASES_TABLE).upsert(mappedCase).select('id').single();
    if (error) throw error;
    if (data?.id) (caseData as any).id = data.id;
    await logAuditAction("UPSERT", "cases", caseData.id!, `حفظ قضية: ${caseData.type || caseData.id}`);
  } catch (error) {
    console.error("خطأ في حفظ القضية:", error);
    throw error;
  }
}

/**
 * تنفيذ عملية حذف ناعم (Soft Delete) للقضية عبر وسمها بطابع زمني للحذف.
 * 
 * @param {string} caseId - المعرف الفريد (UUID) للقضية المراد حذفها
 * @returns {Promise<void>} دالة مستقبلية تنتهي عند نجاح التحديث
 * @throws {PostgrestError} إذا فشل التحديث أو لم يمتلك المستخدم صلاحية الحذف
 */
export async function deleteCase(caseId: string): Promise<void> {
  const orgId = requireOrgId();
  const { error } = await supabase
    .from(CASES_TABLE)
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", caseId)
    .eq("org_id", orgId);
  if (error) throw error;
  await logAuditAction("DELETE_SOFT", "cases", caseId, "حذف قضية (ناعم)");
}

/**
 * جلب سجلات التنفيذ القضائي المرتبطة بالمكتب الحالي.
 * 
 * @returns {Promise<any[]>} قائمة بسجلات التنفيذ تشمل المبالغ المطلوبة والمحصلة
 * @throws {PostgrestError} عند حدوث خطأ في الاستعلام
 */
export async function fetchEnforcement(): Promise<any[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("enforcement_cases")
      .select("id, case_id, debt_amount, collected_amount, status, created_at")
      .eq("org_id", orgId)
      .limit(100);
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("خطأ في جلب ملفات التنفيذ:", error);
    return [];
  }
}

/**
 * حذف سجل تنفيذ قضائي بشكل نهائي من قاعدة البيانات.
 * 
 * @param {string} id - معرف سجل التنفيذ
 * @returns {Promise<void>} دالة مستقبلية تنتهي عند نجاح الحذف
 * @throws {PostgrestError} إذا فشلت عملية الحذف أو خرق سياسة الـ RLS
 */
export async function deleteEnforcement(id: string): Promise<void> {
  const orgId = requireOrgId();
  const { error } = await supabase
    .from("enforcement_cases")
    .delete()
    .eq("id", id)
    .eq("org_id", orgId);
  if (error) throw error;
  await logAuditAction("DELETE", "enforcement_cases", id, "حذف ملف تنفيذ");
}

/**
 * حفظ أو تحديث سجل في أحد جداول المحاكم المتخصصة (مثل الجنايات، الأسرة، إلخ).
 * 
 * @param {string} table - اسم الجدول المستهدف في قاعدة البيانات
 * @param {any} record - كائن البيانات المراد حفظه
 * @returns {Promise<void>} دالة مستقبلية تنتهي عند نجاح العملية
 * @throws {PostgrestError} عند فشل عملية الـ Upsert
 */
export async function saveSpecializedCase(table: string, record: any): Promise<void> {
  const orgId = requireOrgId();
  try {
    const { error } = await supabase
      .from(table)
      .upsert({ ...record, organization_id: orgId });
    if (error) throw error;
  } catch (error) {
    console.error(`خطأ في حفظ سجل ${table}:`, error);
    throw error;
  }
}

/**
 * جلب السجلات من جداول المحاكم المتخصصة مرتبة تنازلياً حسب تاريخ الإنشاء.
 * 
 * @param {string} table - اسم الجدول المطلوب الاستعلام منه
 * @returns {Promise<any[]>} قائمة السجلات المسترجعة
 * @throws {PostgrestError} عند حدوث خطأ في قاعدة البيانات
 */
export async function fetchSpecializedCases(table: string): Promise<any[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from(table)
      .select("id, organization_id, created_at")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`خطأ في جلب سجلات ${table}:`, error);
    return [];
  }
}

/**
 * جلب قضايا التقاضي الإلكتروني
 * @returns {Promise<any[]>} قائمة القضايا الإلكترونية
 */
export async function fetchELitigationCases(): Promise<any[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("e_litigation_cases")
      .select("id, case_id, platform, status, reference_number, filing_date, notes, created_at")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("خطأ في جلب قضايا التقاضي الإلكتروني:", error);
    return [];
  }
}

/**
 * حفظ قضية في التقاضي الإلكتروني
 * @param caseRef - بيانات القضية الإلكترونية
 */
export async function saveELitigationCase(caseRef: any): Promise<void> {
  const orgId = requireOrgId();
  try {
    const { error } = await supabase
      .from("e_litigation_cases")
      .upsert({ ...caseRef, organization_id: orgId });
    if (error) throw error;
  } catch (error) {
    console.error("خطأ في حفظ قضية التقاضي الإلكتروني:", error);
    throw error;
  }
}

/**
 * حذف قضية من التقاضي الإلكتروني
 * @param caseId - معرف القضية
 */
export async function deleteELitigationCase(caseId: string): Promise<void> {
  const orgId = requireOrgId();
  const { error } = await supabase
    .from("e_litigation_cases")
    .delete()
    .eq("case_id", caseId)
    .eq("org_id", orgId);
  if (error) throw error;
}
