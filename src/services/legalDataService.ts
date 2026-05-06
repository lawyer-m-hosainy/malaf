import { supabase } from "@/lib/supabase";
import { getCurrentTenantId } from "@/lib/tenant";
import { Case, Client, Invoice } from "@/types";
import { decryptField, encryptField } from "@/lib/encryption";

const CLIENTS_TABLE = "clients";
const CASES_TABLE = "cases";

// ─── مساعد: الحصول على org_id الحالي مع التحقق ────────────────
function requireOrgId(): string {
  const orgId = getCurrentTenantId();
  if (!orgId) throw new Error("لم يتم تسجيل الدخول أو لم يتم تحميل معرّف المكتب.");
  return orgId;
}

// ─── سجلات التدقيق (Audit Logs) ─────────────────────────────────
export async function logAuditAction(
  action: string,
  entityType: string,
  entityId: string,
  details?: string
): Promise<void> {
  try {
    const orgId = getCurrentTenantId();
    if (!orgId) return; // لا نسجّل في حالة وضع العرض التجريبي
    await supabase.from("audit_logs").insert({
      org_id: orgId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details: { info: details || `${action} on ${entityId}` },
    });
  } catch (error) {
    console.error("Audit log failed:", error);
  }
}

// ─── الموكلون (Clients) ──────────────────────────────────────────
export async function fetchClients(): Promise<Client[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from(CLIENTS_TABLE)
      .select("*")
      .eq("org_id", orgId) // ✅ عزل المستأجر
      .order("name")
      .limit(50);

    if (error) throw error;

    return await Promise.all((data || []).map(
      async (d: any) =>
        ({
          ...d,
          nationalId: d.national_id ? await decryptField(d.national_id) : undefined,
          commercialRegistration: d.commercial_reg
            ? await decryptField(d.commercial_reg)
            : undefined,
        } as Client)
    ));
  } catch (error) {
    console.error("خطأ في جلب الموكلين:", error);
    throw error;
  }
}

export async function fetchClientsPaginated(
  pageSize: number = 10,
  page: number = 0
): Promise<{ data: Client[]; hasMore: boolean }> {
  const orgId = requireOrgId();
  try {
    const { data, error, count } = await supabase
      .from(CLIENTS_TABLE)
      .select("*", { count: "exact" })
      .eq("org_id", orgId) // ✅ عزل المستأجر
      .order("name")
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) throw error;

    const mappedData = await Promise.all((data || []).map(
      async (d: any) =>
        ({
          ...d,
          nationalId: d.national_id ? await decryptField(d.national_id) : undefined,
          commercialRegistration: d.commercial_reg
            ? await decryptField(d.commercial_reg)
            : undefined,
        } as Client)
    ));

    return { data: mappedData, hasMore: (count || 0) > (page + 1) * pageSize };
  } catch (error) {
    console.error("خطأ في جلب الموكلين (صفحات):", error);
    throw error;
  }
}

export async function saveClient(client: Client): Promise<void> {
  const orgId = requireOrgId();
  try {
    const encryptedClient = {
      id: client.id,
      org_id: orgId, // ✅ ربط المكتب دائماً
      name: client.name,
      type: client.type,
      national_id: client.nationalId ? await encryptField(client.nationalId) : null,
      commercial_reg: client.commercialRegistration
        ? await encryptField(client.commercialRegistration)
        : null,
      phone: client.phone,
      email: client.email,
    };

    const { error } = await supabase.from(CLIENTS_TABLE).upsert(encryptedClient);
    if (error) throw error;
    await logAuditAction("CREATE/UPDATE", "clients", client.id, `حفظ موكل: ${client.name}`);
  } catch (error) {
    console.error("خطأ في حفظ الموكل:", error);
    throw error;
  }
}

export async function deleteClient(clientId: string): Promise<void> {
  const orgId = requireOrgId();
  const { error } = await supabase
    .from(CLIENTS_TABLE)
    .delete()
    .eq("id", clientId)
    .eq("org_id", orgId); // ✅ منع حذف بيانات مكتب آخر
  if (error) throw error;
  await logAuditAction("DELETE", "clients", clientId, "حذف موكل");
}

// ─── القضايا (Cases) ─────────────────────────────────────────────
export async function fetchCases(): Promise<Case[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from(CASES_TABLE)
      .select("*")
      .eq("org_id", orgId) // ✅ عزل المستأجر
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("خطأ في جلب القضايا:", error);
    throw error;
  }
}

export async function saveCases(cases: Case[]): Promise<void> {
  const orgId = requireOrgId();
  try {
    const casesWithOrg = cases.map((c) => ({ ...c, org_id: orgId }));
    const { error } = await supabase.from(CASES_TABLE).upsert(casesWithOrg);
    if (error) throw error;
  } catch (error) {
    console.error("خطأ في حفظ القضايا:", error);
    throw error;
  }
}

// ─── الفواتير (Invoices) ─────────────────────────────────────────
export async function fetchInvoices(): Promise<Invoice[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("org_id", orgId) // ✅ عزل المستأجر
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("خطأ في جلب الفواتير:", error);
    return [];
  }
}

export async function saveInvoice(
  invoice: Invoice,
  isUpdate: boolean = false
): Promise<void> {
  const orgId = requireOrgId();
  try {
    const { error } = await supabase
      .from("invoices")
      .upsert({ ...invoice, org_id: orgId }); // ✅ ربط المكتب دائماً
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

export async function deleteInvoice(invoiceId: string): Promise<void> {
  const orgId = requireOrgId();
  const { error } = await supabase
    .from("invoices")
    .delete()
    .eq("id", invoiceId)
    .eq("org_id", orgId); // ✅ منع حذف بيانات مكتب آخر
  if (error) throw error;
  await logAuditAction("DELETE", "invoices", invoiceId, "حذف فاتورة");
}

// ─── المهام (Tasks) ──────────────────────────────────────────────
export async function fetchTasks(): Promise<any[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("org_id", orgId) // ✅ عزل المستأجر
      .order("due_date")
      .limit(100);
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("خطأ في جلب المهام:", error);
    return [];
  }
}

// ─── فريق العمل (Profiles) ──────────────────────────────────────
export async function fetchTeam(): Promise<any[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("org_id", orgId) // ✅ عزل المستأجر
      .limit(50);
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("خطأ في جلب فريق العمل:", error);
    return [];
  }
}

// ─── التنفيذ القضائي (Enforcement) ──────────────────────────────
export async function fetchEnforcement(): Promise<any[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("enforcement")
      .select("*")
      .eq("org_id", orgId) // ✅ عزل المستأجر
      .limit(100);
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("خطأ في جلب ملفات التنفيذ:", error);
    return [];
  }
}

// ─── حسابات الأمانات (Trust Accounts) ──────────────────────────
export async function fetchTrustAccounts(): Promise<any[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("trust_accounts")
      .select("*")
      .eq("org_id", orgId) // ✅ عزل المستأجر
      .limit(100);
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("خطأ في جلب الأمانات:", error);
    return [];
  }
}

// ─── الجلسات (Sessions) ──────────────────────────────────────────
export async function fetchSessions(caseId?: string): Promise<any[]> {
  const orgId = requireOrgId();
  try {
    let query = supabase
      .from("sessions")
      .select("*, cases!inner(org_id)")
      .eq("cases.org_id", orgId) // ✅ عزل عبر العلاقة مع القضايا
      .order("date", { ascending: false })
      .limit(200);

    if (caseId) {
      query = query.eq("case_id", caseId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("خطأ في جلب الجلسات:", error);
    return [];
  }
}

// ─── التوكيلات (POAs) ────────────────────────────────────────────
export async function fetchPOAs(): Promise<any[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("poas")
      .select("*, clients!inner(org_id)")
      .eq("clients.org_id", orgId) // ✅ عزل عبر العلاقة مع الموكلين
      .limit(100);
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("خطأ في جلب التوكيلات:", error);
    return [];
  }
}

// ─── المصروفات (Expenses) ────────────────────────────────────────
export async function fetchExpenses(): Promise<any[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("org_id", orgId) // ✅ عزل المستأجر
      .order("date", { ascending: false })
      .limit(100);
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("خطأ في جلب المصروفات:", error);
    return [];
  }
}

// ─── العداد التسلسلي (Counters) ─────────────────────────────────
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
