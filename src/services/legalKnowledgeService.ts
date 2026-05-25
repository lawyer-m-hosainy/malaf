import { supabase } from "@/lib/supabase";
import { requireOrgId } from "./utils";

// ─── المقالات المعرفية (Wiki Articles) ──────────────────────────

/**
 * جلب مقالات الويكي القانونية الخاصة بالمكتب
 * @returns {Promise<any[]>} قائمة المقالات
 */
export async function fetchWikiArticles(): Promise<any[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("wiki_articles")
      .select("id, organization_id, title, content, created_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("خطأ في جلب المقالات:", error);
    return [];
  }
}

/**
 * حفظ أو تحديث مقال ويكي
 * @param article - بيانات المقال
 */
export async function saveWikiArticle(article: any): Promise<void> {
  const orgId = requireOrgId();
  try {
    const { error } = await supabase
      .from("wiki_articles")
      .upsert({ ...article, organization_id: orgId });
    if (error) throw error;
  } catch (error) {
    console.error("خطأ في حفظ المقال:", error);
    throw error;
  }
}

// ─── المكتبة القانونية (Legal Library / Precedents) ──────────────

/**
 * جلب محتويات المكتبة القانونية والمبادئ القضائية
 * @returns {Promise<any[]>} قائمة المستندات
 */
export async function fetchLegalLibrary(): Promise<any[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("legal_library")
      .select("id, title, category, summary, tags, date, created_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });
    if (error) {
      if (error.code === "PGRST205" || error.code === "42P01") return [];
      throw error;
    }
    return data || [];
  } catch {
    return [];
  }
}

/**
 * إضافة مستند جديد للمكتبة القانونية
 * @param item - بيانات المستند
 */
export async function saveLegalLibraryItem(item: any): Promise<void> {
  const orgId = requireOrgId();
  try {
    const { error } = await supabase
      .from("legal_library")
      .upsert({ ...item, organization_id: orgId });
    if (error) throw error;
  } catch (error) {
    console.error("خطأ في حفظ مستند المكتبة القانونية:", error);
    throw error;
  }
}

// ─── نماذج العقود (Contract Templates) ─────────────────────────

/**
 * جلب نماذج العقود (النظامية والخاصة)
 * @returns {Promise<any[]>} قائمة النماذج
 */
export async function fetchContractTemplates(): Promise<any[]> {
  const orgId = requireOrgId();
  const { data, error } = await supabase
    .from("contract_templates")
    .select("id, title, category, content, is_system, created_at")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

/**
 * حفظ نموذج عقد جديد
 * @param templateData - بيانات النموذج
 */
export async function saveContractTemplate(templateData: any): Promise<void> {
  const orgId = requireOrgId();
  try {
    const { error } = await supabase
      .from("contract_templates")
      .upsert({ ...templateData, organization_id: orgId });
    if (error) throw error;
  } catch (error) {
    console.error("خطأ في حفظ نموذج العقد:", error);
    throw error;
  }
}

/**
 * حذف نموذج عقد
 * @param id - معرف النموذج
 */
export async function deleteContractTemplate(id: string): Promise<void> {
  const orgId = requireOrgId();
  const { error } = await supabase
    .from("contract_templates")
    .delete()
    .eq("id", id)
    .eq("organization_id", orgId);
  if (error) throw error;
}
