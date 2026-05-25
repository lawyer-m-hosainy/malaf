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
  const mapped: any = {
    organization_id: orgId,
    client_id: c.clientId || c.client_id,
    court: c.court || c.court_location || "",
    type: c.type || c.court_category || "",
    status: c.status || "متداولة",
    plaintiff: c.plaintiff || "",
    defendant: c.defendant || "",
    first_instance_number: c.firstInstanceNumber || c.first_instance_number || "",
    appeal_number: c.appealNumber || c.appeal_number || "",
    cassation_number: c.cassationNumber || c.cassation_number || "",
  };
  // عند التعديل نحدد الـ id — عند الإضافة ندع DB يولّد UUID تلقائياً
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
 * جلب قائمة القضايا الخاصة بالمكتب
 * @returns {Promise<Case[]>} قائمة القضايا
 */
export async function fetchCases(): Promise<Case[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from(CASES_TABLE)
      .select("*, lawyer:profiles(name), documents(title, created_at)")
      .eq("organization_id", orgId)
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
 * حفظ مجموعة من القضايا (Bulk Upsert)
 * @param cases - قائمة القضايا المطلوب حفظها
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
 * حفظ بيانات قضية واحدة (Create or Update)
 * @param caseData - بيانات القضية
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
 * حذف قضية (حذف ناعم - Soft Delete)
 * @param caseId - معرف القضية
 */
export async function deleteCase(caseId: string): Promise<void> {
  const orgId = requireOrgId();
  const { error } = await supabase
    .from(CASES_TABLE)
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", caseId)
    .eq("organization_id", orgId);
  if (error) throw error;
  await logAuditAction("DELETE_SOFT", "cases", caseId, "حذف قضية (ناعم)");
}

/**
 * جلب ملفات التنفيذ القضائي
 * @returns {Promise<any[]>} قائمة ملفات التنفيذ
 */
export async function fetchEnforcement(): Promise<any[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("enforcement_cases")
      .select("id, case_id, amount_claimed, amount_collected, status, created_at")
      .eq("organization_id", orgId)
      .limit(100);
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("خطأ في جلب ملفات التنفيذ:", error);
    return [];
  }
}

/**
 * حذف ملف تنفيذ قضائي
 * @param id - معرف ملف التنفيذ
 */
export async function deleteEnforcement(id: string): Promise<void> {
  const orgId = requireOrgId();
  const { error } = await supabase
    .from("enforcement_cases")
    .delete()
    .eq("id", id)
    .eq("organization_id", orgId);
  if (error) throw error;
  await logAuditAction("DELETE", "enforcement_cases", id, "حذف ملف تنفيذ");
}

/**
 * حفظ سجل في المحاكم المتخصصة
 * @param table - اسم الجدول المستهدف
 * @param record - بيانات السجل
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
 * جلب سجلات من المحاكم المتخصصة
 * @param table - اسم الجدول
 * @returns {Promise<any[]>} قائمة السجلات
 */
export async function fetchSpecializedCases(table: string): Promise<any[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from(table)
      .select("id, organization_id, created_at")
      .eq("organization_id", orgId)
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
      .eq("organization_id", orgId)
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
    .eq("organization_id", orgId);
  if (error) throw error;
}
