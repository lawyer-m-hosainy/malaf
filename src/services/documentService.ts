import { supabase } from "@/lib/supabase";
import { requireOrgId, logAuditAction } from "./utils";

// ─── المستندات (Documents Database Records) ──────────────────────

/**
 * جلب قائمة سجلات المستندات من قاعدة البيانات
 * @returns {Promise<any[]>} قائمة المستندات
 */
export async function fetchDocuments(limit: number = 50): Promise<any[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("documents")
      .select("id, case_id, client_id, file_name, file_url, category, shared_with_client, size, created_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("خطأ في جلب المستندات:", error);
    return [];
  }
}

/**
 * حفظ أو تحديث سجل مستند في قاعدة البيانات
 * @param doc - بيانات المستند
 */
export async function saveDocument(doc: any): Promise<void> {
  const orgId = requireOrgId();
  try {
    const { error } = await supabase
      .from("documents")
      .upsert({ ...doc, organization_id: orgId });
    if (error) throw error;
    await logAuditAction("CREATE/UPDATE", "documents", doc.id, `حفظ مستند: ${doc.name}`);
  } catch (error) {
    console.error("خطأ في حفظ المستند:", error);
    throw error;
  }
}

/**
 * حذف سجل مستند من قاعدة البيانات
 * @param id - معرف سجل المستند
 */
export async function deleteDocumentRecord(id: string): Promise<void> {
  const orgId = requireOrgId();
  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", id)
    .eq("organization_id", orgId);
  if (error) throw error;
  await logAuditAction("DELETE", "documents", id, "حذف مستند");
}

// ─── خدمات التخزين (Storage Operations) ──────────────────────────

/**
 * رفع ملف إلى Supabase Storage
 * @param file - ملف الـ Blob/File المطلوب رفعه
 * @param caseId - معرف القضية المرتبطة (اختياري)
 * @returns {Promise<{path: string, url: string}>} مسار الملف ورابطه العام
 */
export async function uploadDocumentFile(file: File, caseId: string): Promise<{path: string, url: string}> {
  const orgId = requireOrgId();
  const timestamp = Date.now();
  // تنظيف اسم الملف من الرموز الخاصة
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_أ-ي]/g, "_");
  const path = `${orgId}/${caseId || 'general'}/${timestamp}_${safeName}`;
  
  const { data, error } = await supabase.storage
    .from("documents")
    .upload(path, file);
    
  if (error) throw error;
  
  const { data: urlData } = supabase.storage
    .from("documents")
    .getPublicUrl(path);
    
  return { path: data.path, url: urlData.publicUrl };
}

/**
 * تحميل ملف من Supabase Storage
 * @param path - المسار النسبي للملف في الـ bucket
 * @returns {Promise<Blob>} محتوى الملف كـ Blob
 */
export async function downloadDocumentFile(path: string): Promise<Blob> {
  const { data, error } = await supabase.storage
    .from("documents")
    .download(path);
  if (error) throw error;
  return data;
}

/**
 * حذف ملف نهائياً من Supabase Storage
 * @param path - المسار النسبي للملف
 */
export async function deleteDocumentFile(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from("documents")
    .remove([path]);
  if (error) throw error;
}
