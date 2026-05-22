/**
 * ضمان ربط المستخدم بمكتب (organization_id) بعد التسجيل أو الدخول.
 * يحل فشل حفظ الموكلين/القضايا عندما يكون orgId فارغاً في JWT أو profiles.
 */
import { supabase } from "@/lib/supabase";
import { PLANS, PlanTier } from "@/modules/subscriptions/subscriptionService";
import { setTenantIdCache } from "@/lib/tenant";
import type { UserRole } from "@/types";

const DEFAULT_ROLE: UserRole = "محامي";
/** دور مؤسس المكتب — يجب أن يطابق enum/TEXT في Supabase (ليس org_admin) */
const OFFICE_FOUNDER_ROLE: UserRole = "مدير مكتب";
const PROFILE_SELECT = "id, role, full_name, org_id, organization_id, email";

let lastSetupError = "";

export function getLastOrganizationSetupError(): string {
  return lastSetupError;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function resolveOrgFromProfile(profile: Record<string, unknown> | null): string {
  if (!profile) return "";
  return String(profile.organization_id || profile.org_id || "");
}

/** مزامنة org_id مع JWT (مطلوب لـ RLS على clients/cases) */
export async function syncOrgToJwt(orgId: string, role: string = DEFAULT_ROLE): Promise<void> {
  if (!orgId) return;
  try {
    await supabase.auth.updateUser({
      data: { org_id: orgId, role },
    });
  } catch (e) {
    console.warn("[organizationSetup] JWT sync failed (non-fatal):", e);
  }
}

async function fetchProfile(userId: string) {
  return supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("id", userId)
    .maybeSingle();
}

async function createOrganization(user: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}, officeName?: string) {
  const slug = `office-${user.id.slice(0, 8)}`;
  const name =
    officeName ||
    (user.user_metadata?.full_name as string) ||
    user.email?.split("@")[0] ||
    "مكتب المحاماة";

  const { data: existing } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existing?.id) return existing.id as string;

  const { data: created, error } = await supabase
    .from("organizations")
    .insert({ name, slug, plan: "free" })
    .select("id")
    .single();

  if (error) {
    lastSetupError = error.message || "org_insert_failed";
    console.error("[organizationSetup] org insert failed:", error);
    return "";
  }
  return (created?.id as string) || "";
}

async function upsertProfile(
  user: { id: string; email?: string; user_metadata?: Record<string, unknown> },
  orgId: string,
  role: string = OFFICE_FOUNDER_ROLE
) {
  const payload: Record<string, unknown> = {
    id: user.id,
    full_name:
      (user.user_metadata?.full_name as string) ||
      user.email?.split("@")[0] ||
      "المستخدم",
    email: user.email || "",
    role,
    org_id: orgId,
    organization_id: orgId,
  };

  const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
  if (error) {
    lastSetupError = error.message || "profile_upsert_failed";
    // احتياط: بعض قواعد البيانات تستخدم org_id فقط
    const { error: retryError } = await supabase.from("profiles").upsert(
      { ...payload, organization_id: undefined },
      { onConflict: "id" }
    );
    if (retryError) {
      lastSetupError = retryError.message || "profile_upsert_failed";
      console.error("[organizationSetup] profile upsert failed:", retryError);
      return false;
    }
  }
  return true;
}

async function initTrialSubscription(orgId: string, plan: PlanTier = "advanced") {
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 14);

  const subPayload: Record<string, unknown> = {
    org_id: orgId,
    organization_id: orgId,
    plan,
    status: "trial",
    trial_ends_at: trialEnd.toISOString(),
    current_period_end: trialEnd.toISOString(),
    billing_cycle: "monthly",
    auto_renew: false,
  };

  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("org_id", orgId)
    .maybeSingle();

  if (!existing) {
    const { error: subErr } = await supabase.from("subscriptions").insert(subPayload);
    if (subErr) {
      await supabase.from("subscriptions").insert({
        org_id: orgId,
        plan,
        status: "trial",
        current_period_end: trialEnd.toISOString(),
      });
    }
  }

  const planLimits = PLANS[plan];
  const limitsPayload: Record<string, unknown> = {
    org_id: orgId,
    organization_id: orgId,
    cases_used: 0,
    cases_limit: planLimits.maxCases === -1 ? 999999 : planLimits.maxCases,
    users_used: 1,
    users_limit: planLimits.maxUsers === -1 ? 999999 : planLimits.maxUsers,
  };

  const { data: limitsRow } = await supabase
    .from("usage_limits")
    .select("id")
    .eq("org_id", orgId)
    .maybeSingle();

  if (!limitsRow) {
    const { error: limErr } = await supabase.from("usage_limits").insert(limitsPayload);
    if (limErr) {
      await supabase.from("usage_limits").insert({
        org_id: orgId,
        cases_used: 0,
        cases_limit: limitsPayload.cases_limit,
        users_used: 1,
        users_limit: limitsPayload.users_limit,
      });
    }
  }
}

/**
 * يضمن وجود مكتب وملف شخصي للمستخدم. يُرجع organization_id أو سلسلة فارغة.
 */
export async function ensureUserOrganization(
  user: { id: string; email?: string; user_metadata?: Record<string, unknown> },
  options?: { officeName?: string; plan?: PlanTier; role?: string }
): Promise<string> {
  if (!user?.id) return "";
  lastSetupError = "";

  const officeName = options?.officeName;
  const plan = options?.plan ?? "advanced";
  const role = options?.role ?? OFFICE_FOUNDER_ROLE;

  // انتظار trigger قاعدة البيانات (حتى 6 محاولات)
  for (let i = 0; i < 6; i++) {
    const { data: profile } = await fetchProfile(user.id);
    const orgId = resolveOrgFromProfile(profile as Record<string, unknown> | null);
    if (orgId) {
      // مزامنة organization_id إن كان الملف يستخدم org_id فقط (مهم لـ RLS)
      if (profile && !profile.organization_id && profile.org_id) {
        await supabase
          .from("profiles")
          .update({ organization_id: orgId })
          .eq("id", user.id);
      }
      await syncOrgToJwt(orgId, (profile?.role as string) || role);
      setTenantIdCache(orgId);
      return orgId;
    }
    await sleep(i === 0 ? 800 : 1200);
  }

  // إنشاء يدوي: مكتب + ملف + اشتراك تجريبي
  const orgId = await createOrganization(user, officeName);
  if (!orgId) return "";

  const profileOk = await upsertProfile(user, orgId, OFFICE_FOUNDER_ROLE);
  if (!profileOk) return "";

  await initTrialSubscription(orgId, plan);
  await syncOrgToJwt(orgId, OFFICE_FOUNDER_ROLE);
  setTenantIdCache(orgId);

  return orgId;
}
