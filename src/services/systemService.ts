import { supabase } from "@/lib/supabase";
import { getCurrentTenantId } from "@/lib/tenant";
import { requireOrgId, logAuditAction } from "./utils";

// ─── سجلات التدقيق (Audit Logs) ─────────────────────────────────

/**
 * جلب سجلات التدقيق الخاصة بالمكتب
 * @returns {Promise<any[]>} قائمة السجلات المنسقة للواجهة
 */
export async function fetchAuditLogs(): Promise<any[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("id, action, entity_type, entity_id, details, created_at, user_id")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    
    return (data || []).map((log: any) => ({
      id: log.id,
      userName: log.user_id || 'النظام',
      action: log.action,
      module: log.entity_type,
      details: typeof log.details === 'object' ? log.details?.info || JSON.stringify(log.details) : log.details,
      timestamp: log.created_at,
      ipAddress: null,
    }));
  } catch {
    return [];
  }
}

// ─── المهام (Tasks) ──────────────────────────────────────────────

/**
 * تحويل بيانات المهمة إلى تنسيق قاعدة البيانات
 * @param task - بيانات المهمة
 * @param orgId - معرف المكتب
 */
function mapTaskToDB(task: any, orgId: string) {
  return {
    id: task.id,
    org_id: orgId,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    due_date: task.dueDate,
    assigned_to: task.assignedTo,
    created_at: task.createdAt || new Date().toISOString(),
  };
}

/**
 * جلب قائمة المهام الخاصة بالمكتب
 * @returns {Promise<any[]>} قائمة المهام
 */
export async function fetchTasks(): Promise<any[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("tasks")
      .select("id, case_id, assigned_to, title, description, due_date, status, priority, created_at")
      .eq("org_id", orgId)
      .order("due_date")
      .limit(50);
    if (error) throw error;
    return (data || []).map(t => ({
      ...t,
      dueDate: t.due_date,
      assignedTo: t.assigned_to,
      createdAt: t.created_at,
    }));
  } catch (error) {
    console.error("خطأ في جلب المهام:", error);
    return [];
  }
}

/**
 * حفظ أو تحديث بيانات مهمة
 * @param task - بيانات المهمة
 */
export async function saveTask(task: any): Promise<void> {
  const orgId = requireOrgId();
  try {
    const mappedTask = mapTaskToDB(task, orgId);
    const { error } = await supabase.from("tasks").upsert(mappedTask);
    if (error) throw error;
  } catch (error) {
    console.error("خطأ في حفظ المهمة:", error);
    throw error;
  }
}

/**
 * حذف مهمة من قاعدة البيانات
 * @param taskId - معرف المهمة
 */
export async function deleteTask(taskId: string): Promise<void> {
  const orgId = requireOrgId();
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("org_id", orgId);
  if (error) throw error;
  await logAuditAction("DELETE", "tasks", taskId, "حذف مهمة");
}

// ─── فريق العمل (Profiles) ──────────────────────────────────────

/**
 * جلب قائمة فريق العمل (الملفات الشخصية) المرتبطة بالمكتب
 * @returns {Promise<any[]>} قائمة الفريق
 */
export async function fetchTeam(): Promise<any[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, role, email, created_at")
      .eq("org_id", orgId)
      .limit(50);
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("خطأ في جلب فريق العمل:", error);
    return [];
  }
}

// ─── العداد التسلسلي (Counters) ─────────────────────────────────

/**
 * الحصول على الرقم التسلسلي التالي لنوع معين (تداول أو أرشيف)
 * @param type - نوع العداد
 * @returns {Promise<string>} الرقم المنسق (مثل T-0001)
 */
export async function getNextCounter(
  type: "circulation" | "archive"
): Promise<string> {
  const orgId = getCurrentTenantId() || "demo";
  try {
    const counterKey = `${type}-${orgId}`;
    const { data, error } = await supabase
      .from("counters")
      .select("last_value")
      .eq("type", counterKey)
      .single();

    let newValue = 1;
    if (data) {
      newValue = data.last_value + 1;
      await supabase
        .from("counters")
        .update({ last_value: newValue })
        .eq("type", counterKey);
    } else {
      await supabase.from("counters").insert({ type: counterKey, last_value: 1 });
    }

    const prefix = type === "circulation" ? "T-" : "H-";
    return `${prefix}${newValue.toString().padStart(4, "0")}`;
  } catch (error) {
    console.error("خطأ في العداد التسلسلي:", error);
    const random = Math.floor(1000 + Math.random() * 9000);
    return type === "circulation" ? `T-${random}` : `H-${random}`;
  }
}

// ─── تتبع الوقت (Time Tracking) ──────────────────────────────────

/**
 * جلب سجلات تتبع الوقت الخاصة بالمكتب
 * @returns {Promise<any[]>} قائمة السجلات
 */
export async function fetchTimeEntries(): Promise<any[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("time_entries")
      .select("id, case_id, lawyer_id, description, duration_minutes, billable, is_billed, date, created_at")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("خطأ في جلب سجلات الوقت:", error);
    return [];
  }
}

/**
 * حفظ سجل تتبع وقت جديد
 * @param entry - بيانات السجل
 */
export async function saveTimeEntry(entry: any): Promise<void> {
  const orgId = requireOrgId();
  try {
    const { error } = await supabase
      .from("time_entries")
      .upsert({ ...entry, org_id: orgId });
    if (error) throw error;
  } catch (error) {
    console.error("خطأ في حفظ سجل الوقت:", error);
    throw error;
  }
}

/**
 * حذف سجل تتبع وقت
 * @param id - معرف السجل
 */
export async function deleteTimeEntryRecord(id: string): Promise<void> {
  const orgId = requireOrgId();
  const { error } = await supabase
    .from("time_entries")
    .delete()
    .eq("id", id)
    .eq("org_id", orgId);
  if (error) throw error;
}
