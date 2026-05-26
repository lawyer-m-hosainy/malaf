import { supabase } from "@/lib/supabase";
import { requireOrgId } from "./utils";

/**
 * تحويل بيانات الجلسة من تنسيق التطبيق إلى تنسيق قاعدة البيانات
 * @param session - بيانات الجلسة من الواجهة
 * @param orgId - معرف المكتب
 */
function mapSessionToDB(session: any, orgId: string) {
  return {
    id: session.id,
    organization_id: orgId,
    case_id: session.caseId,
    date: session.date,
    time: session.time,
    court: session.court || session.courtRoom || "",
    circuit: session.circuit || "",
    notes: session.notes,
    created_at: session.createdAt || new Date().toISOString(),
  };
}

/**
 * جلب قائمة الجلسات (مع إمكانية الفلترة برقم القضية)
 * @param caseId - (اختياري) معرف القضية لجلب جلساتها فقط
 * @returns {Promise<any[]>} قائمة الجلسات
 */
export async function fetchSessions(caseId?: string): Promise<any[]> {
  const orgId = requireOrgId();
  try {
    let query = supabase
      .from("sessions")
      .select("id, case_id, date, time, court, circuit, status, previous_decision, postponement_reason, next_session_date, lawyer_id, notes, created_at")
      .eq("organization_id", orgId) 
      .order("date", { ascending: false })
      .limit(200);

    if (caseId) {
      query = query.eq("case_id", caseId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(s => ({
      ...s,
      caseId: s.case_id,
      createdAt: s.created_at,
    }));
  } catch (error) {
    console.error("خطأ في جلب الجلسات:", error);
    return [];
  }
}

/**
 * حفظ بيانات جلسة (Create or Update)
 * @param session - بيانات الجلسة
 */
export async function saveSession(session: any): Promise<void> {
  const orgId = requireOrgId();
  try {
    const mappedSession = mapSessionToDB(session, orgId);
    const { error } = await supabase.from("sessions").upsert(mappedSession);
    if (error) throw error;
  } catch (error) {
    console.error("خطأ في حفظ الجلسة:", error);
    throw error;
  }
}
