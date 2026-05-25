import { supabase } from "@/lib/supabase";
import { requireOrgId } from "./utils";

// ─── الخبراء (Expert Missions) ───────────────────────────────────

/**
 * جلب قائمة مأموريات الخبراء
 * @returns {Promise<any[]>} قائمة المأموريات
 */
export async function fetchExpertMissions(): Promise<any[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("expert_missions")
      .select("id, title, expert_name, case_id, status, mission_type, date, notes, created_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("خطأ في جلب المأموريات:", error);
    return [];
  }
}

/**
 * حفظ بيانات مأمورية خبير
 * @param mission - بيانات المأمورية
 */
export async function saveExpertMission(mission: any): Promise<void> {
  const orgId = requireOrgId();
  try {
    const { error } = await supabase
      .from("expert_missions")
      .upsert({ ...mission, organization_id: orgId });
    if (error) throw error;
  } catch (error) {
    console.error("خطأ في حفظ المأمورية:", error);
    throw error;
  }
}

/**
 * حذف سجل مأمورية خبير
 * @param id - معرف المأمورية
 */
export async function deleteExpertMissionRecord(id: string): Promise<void> {
  const orgId = requireOrgId();
  const { error } = await supabase
    .from("expert_missions")
    .delete()
    .eq("id", id)
    .eq("organization_id", orgId);
  if (error) throw error;
}

/**
 * جلب جلسات الخبير المرتبطة بمأمورية معينة
 * @param missionId - معرف المأمورية
 * @returns {Promise<any[]>} قائمة الجلسات
 */
export async function fetchExpertSessions(missionId: string): Promise<any[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("expert_sessions")
      .select("id, mission_id, date, notes, decision, next_date, created_at")
      .eq("organization_id", orgId)
      .eq("mission_id", missionId)
      .order("date", { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("خطأ في جلب جلسات الخبير:", error);
    return [];
  }
}

/**
 * حفظ جلسة خبير جديدة
 * @param session - بيانات الجلسة
 */
export async function saveExpertSession(session: any): Promise<void> {
  const orgId = requireOrgId();
  try {
    const { error } = await supabase
      .from("expert_sessions")
      .upsert({ ...session, organization_id: orgId });
    if (error) throw error;
  } catch (error) {
    console.error("خطأ في حفظ جلسة الخبير:", error);
    throw error;
  }
}

// ─── الزيارات الميدانية (Field Checkins) ─────────────────────────

/**
 * جلب قائمة الزيارات الميدانية
 * @returns {Promise<any[]>} قائمة الزيارات
 */
export async function fetchFieldCheckins(): Promise<any[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("field_checkins")
      .select("id, case_id, location, lat, lng, notes, photo_url, created_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("خطأ في جلب الزيارات الميدانية:", error);
    return [];
  }
}

/**
 * حفظ تسجيل زيارة ميدانية
 * @param checkin - بيانات الزيارة
 */
export async function saveFieldCheckin(checkin: any): Promise<void> {
  const orgId = requireOrgId();
  try {
    const { error } = await supabase
      .from("field_checkins")
      .upsert({ ...checkin, organization_id: orgId });
    if (error) throw error;
  } catch (error) {
    console.error("خطأ في حفظ الزيارة الميدانية:", error);
    throw error;
  }
}

/**
 * حذف تسجيل زيارة ميدانية
 * @param id - معرف الزيارة
 */
export async function deleteFieldCheckin(id: string): Promise<void> {
  const orgId = requireOrgId();
  const { error } = await supabase
    .from("field_checkins")
    .delete()
    .eq("id", id)
    .eq("organization_id", orgId);
  if (error) throw error;
}

// ─── العقود (Contracts) ──────────────────────────────────────────

/**
 * جلب قائمة العقود المبرمة
 * @returns {Promise<any[]>} قائمة العقود
 */
export async function fetchContracts(): Promise<any[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("contracts")
      .select("id, title, parties, contract_type, status, start_date, end_date, value, notes, created_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("خطأ في جلب العقود:", error);
    return [];
  }
}

/**
 * حفظ أو تحديث بيانات عقد
 * @param contract - بيانات العقد
 */
export async function saveContract(contract: any): Promise<void> {
  const orgId = requireOrgId();
  try {
    const { error } = await supabase
      .from("contracts")
      .upsert({ ...contract, organization_id: orgId });
    if (error) throw error;
  } catch (error) {
    console.error("خطأ في حفظ العقد:", error);
    throw error;
  }
}

/**
 * حذف سجل عقد
 * @param id - معرف العقد
 */
export async function deleteContractRecord(id: string): Promise<void> {
  const orgId = requireOrgId();
  const { error } = await supabase
    .from("contracts")
    .delete()
    .eq("id", id)
    .eq("organization_id", orgId);
  if (error) throw error;
}

// ─── فحص التعارض (Conflict Checks) ─────────────────────────────

/**
 * جلب سجلات فحص التعارض
 * @returns {Promise<any[]>} قائمة السجلات
 */
export async function fetchConflictChecks(): Promise<any[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("conflict_checks")
      .select("id, organization_id, entity_name, check_date, status, created_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("خطأ في جلب سجلات التعارض:", error);
    return [];
  }
}

/**
 * حفظ سجل فحص تعارض جديد
 * @param record - بيانات الفحص
 */
export async function saveConflictCheck(record: any): Promise<void> {
  const orgId = requireOrgId();
  try {
    const { error } = await supabase
      .from("conflict_checks")
      .upsert({ ...record, organization_id: orgId });
    if (error) throw error;
  } catch (error) {
    console.error("خطأ في حفظ سجل التعارض:", error);
    throw error;
  }
}
