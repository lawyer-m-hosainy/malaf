import { supabase } from "@/lib/supabase";
import { getCurrentTenantId } from "@/lib/tenant";
import { Case, Client, Invoice, TrustTransaction, TrustTransactionType, TrustPageStats, DBPaymentPlan, DBPaymentInstallment } from "@/types";
import { decryptField, encryptField, batchDecryptFields } from "@/lib/encryption";

const CLIENTS_TABLE = "clients";
const CASES_TABLE = "cases";

// ─── مساعد: الحصول على org_id الحالي مع التحقق ────────────────
function requireOrgId(): string {
  const orgId = getCurrentTenantId();
  if (!orgId) throw new Error("لم يتم تسجيل الدخول أو لم يتم تحميل معرّف المكتب.");
  return orgId;
}

// ─── سجلات التدقيق (Audit Logs) ─────────────────────────────────
// NOTE: audit_logs table may not exist yet in production.
// This function silently no-ops if the table is missing.
export async function logAuditAction(
  action: string,
  entityType: string,
  entityId: string,
  details?: string
): Promise<void> {
  try {
    const orgId = getCurrentTenantId();
    if (!orgId) return;
    const { error } = await supabase.from("audit_logs").insert({
      organization_id: orgId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details: { info: details || `${action} on ${entityId}` },
    });
    // Silently ignore if table doesn't exist (404/PGRST205)
    if (error && error.code !== "PGRST205" && error.code !== "42P01") {
      console.warn("Audit log skipped:", error.message);
    }
  } catch {
    // Completely silent — audit logs should never break the app
  }
}

// HIGH-002-FIX: جلب سجلات التدقيق من Supabase
export async function fetchAuditLogs(): Promise<any[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("id, action, entity_type, entity_id, details, created_at, user_id")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    // تحويل البيانات لتتوافق مع الواجهة الحالية
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

// ─── الموكلون (Clients) ──────────────────────────────────────────
export async function fetchClients(): Promise<Client[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from(CLIENTS_TABLE)
      .select("id, name, type, phone, national_id_encrypted, commercial_registration_encrypted")
      .eq("organization_id", orgId)
      .is("deleted_at", null)
      .order("name")
      .limit(20);

    if (error) throw error;

    const nationalIdsToDecrypt = data?.map((d: any) => d.national_id_encrypted) || [];
    const commercialRegsToDecrypt = data?.map((d: any) => d.commercial_registration_encrypted) || [];
    
    const [decryptedNationalIds, decryptedCommercialRegs] = await Promise.all([
      batchDecryptFields(nationalIdsToDecrypt),
      batchDecryptFields(commercialRegsToDecrypt)
    ]);

    return (data || []).map(
      (d: any, index: number) =>
        ({
          ...d,
          nationalId: decryptedNationalIds[index] || undefined,
          commercialRegistration: decryptedCommercialRegs[index] || undefined,
        } as Client)
    );
  } catch (error) {
    console.error("خطأ في جلب الموكلين:", error);
    throw error;
  }
}

export async function fetchClientsPaginated(
  pageSize: number = 20,
  page: number = 0
): Promise<{ data: Client[]; hasMore: boolean }> {
  const orgId = requireOrgId();
  try {
    const { data, error, count } = await supabase
      .from(CLIENTS_TABLE)
      .select("id, name, type, phone, national_id_encrypted, commercial_registration_encrypted", { count: "exact" })
      .eq("organization_id", orgId)
      .is("deleted_at", null)
      .order("name")
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) throw error;

    const nationalIdsToDecrypt = data?.map((d: any) => d.national_id_encrypted) || [];
    const commercialRegsToDecrypt = data?.map((d: any) => d.commercial_registration_encrypted) || [];
    
    const [decryptedNationalIds, decryptedCommercialRegs] = await Promise.all([
      batchDecryptFields(nationalIdsToDecrypt),
      batchDecryptFields(commercialRegsToDecrypt)
    ]);

    const mappedData = (data || []).map(
      (d: any, index: number) =>
        ({
          ...d,
          nationalId: decryptedNationalIds[index] || undefined,
          commercialRegistration: decryptedCommercialRegs[index] || undefined,
        } as Client)
    );

    return { data: mappedData, hasMore: (count || 0) > (page + 1) * pageSize };
  } catch (error) {
    console.error("خطأ في جلب الموكلين (صفحات):", error);
    throw error;
  }
}

export async function saveClient(client: Client): Promise<void> {
  const orgId = requireOrgId();
  try {
    const encryptedClient: any = {
      organization_id: orgId,
      name: client.name,
      type: client.type,
      national_id_encrypted: client.nationalId ? await encryptField(client.nationalId) : null,
      commercial_registration_encrypted: client.commercialRegistration
        ? await encryptField(client.commercialRegistration)
        : null,
      phone: client.phone,
    };

    // عند التعديل، نحدد الـ id — عند الإضافة، ندع الـ DB يولّده تلقائياً
    if (client.id && !client.id.startsWith('C-')) {
      encryptedClient.id = client.id;
    }

    const { data, error } = await supabase.from(CLIENTS_TABLE).upsert(encryptedClient).select('id').single();
    if (error) throw error;
    // تحديث الـ id المحلي بالـ UUID الحقيقي من قاعدة البيانات
    if (data?.id) client.id = data.id;
    await logAuditAction("CREATE/UPDATE", "clients", client.id, `حفظ موكل: ${client.name}`);
  } catch (error) {
    console.error("خطأ في حفظ الموكل:", error);
    throw error;
  }
}

export async function deleteClient(clientId: string): Promise<void> {
  const orgId = requireOrgId();
  // ✅ الحذف الناعم بدلاً من الحذف الفعلي
  const { error } = await supabase
    .from(CLIENTS_TABLE)
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", clientId)
    .eq("organization_id", orgId);
  if (error) throw error;
  await logAuditAction("DELETE_SOFT", "clients", clientId, "حذف موكل (ناعم)");
}

// ─── مساعدات التحويل (Mapping Helpers) ──────────────────────────
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

// ─── القضايا (Cases) ─────────────────────────────────────────────
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

export async function saveCases(cases: Case[]): Promise<void> {
  const orgId = requireOrgId();
  try {
    const mappedCases = cases.map((c) => mapCaseToDB(c, orgId));
    const { error } = await supabase.from(CASES_TABLE).upsert(mappedCases);
    if (error) throw error;
    
    // Log audit for each case
    for (const c of cases) {
      await logAuditAction("UPSERT", "cases", c.id, `حفظ قضية: ${c.title || c.id}`);
    }
  } catch (error) {
    console.error("خطأ في حفظ القضايا:", error);
    throw error;
  }
}

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

// ─── الفواتير (Invoices) ─────────────────────────────────────────
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

// ─── المهام (Tasks) ──────────────────────────────────────────────
function mapTaskToDB(task: any, orgId: string) {
  return {
    id: task.id,
    organization_id: orgId,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    due_date: task.dueDate,
    assigned_to: task.assignedTo,
    created_at: task.createdAt || new Date().toISOString(),
  };
}

export async function fetchTasks(): Promise<any[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("tasks")
      .select("id, case_id, assigned_to, title, description, due_date, status, priority, created_at")
      .eq("organization_id", orgId)
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

export async function deleteTask(taskId: string): Promise<void> {
  const orgId = requireOrgId();
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("organization_id", orgId);
  if (error) throw error;
  await logAuditAction("DELETE", "tasks", taskId, "حذف مهمة");
}

// ─── فريق العمل (Profiles) ──────────────────────────────────────
export async function fetchTeam(): Promise<any[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, role, email, created_at")
      .eq("organization_id", orgId) // ✅ عزل المستأجر
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

// ─── حسابات الأمانات (Trust Accounts) ──────────────────────────
export async function fetchTrustAccounts(): Promise<any[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("trust_accounts")
      .select("id, client_id, amount, type, status, created_at")
      .eq("organization_id", orgId)
      .limit(100);
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("خطأ في جلب الأمانات:", error);
    return [];
  }
}

export async function deleteTrustAccount(id: string): Promise<void> {
  const orgId = requireOrgId();
  const { error } = await supabase
    .from("trust_accounts")
    .delete()
    .eq("id", id)
    .eq("organization_id", orgId);
  if (error) throw error;
  await logAuditAction("DELETE", "trust_accounts", id, "حذف حساب أمانة");
}

// ─── الجلسات (Sessions) ──────────────────────────────────────────
function mapSessionToDB(session: any, orgId: string) {
  return {
    id: session.id,
    organization_id: orgId,
    case_id: session.caseId,
    date: session.date,
    time: session.time,
    court_room: session.courtRoom || session.court_room || "",
    notes: session.notes,
    created_at: session.createdAt || new Date().toISOString(),
  };
}

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

// ─── التوكيلات (POAs) ────────────────────────────────────────────
function mapPOAToDB(poa: any, orgId: string) {
  return {
    id: poa.id,
    organization_id: orgId,
    client_id: poa.clientId,
    number: poa.number,
    year: poa.year,
    office: poa.office,
    type: poa.type,
    status: poa.status,
    expiry_date: poa.expiryDate || poa.expiry_date,
    created_at: poa.createdAt || new Date().toISOString(),
  };
}

export async function fetchPOAs(): Promise<any[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("poas")
      .select("*, clients!inner(organization_id)")
      .eq("clients.organization_id", orgId) 
      .limit(100);
    if (error) throw error;
    return (data || []).map(p => ({
      ...p,
      clientId: p.client_id,
      expiryDate: p.expiry_date,
      createdAt: p.created_at,
    }));
  } catch (error) {
    console.error("خطأ في جلب التوكيلات:", error);
    return [];
  }
}

export async function savePOA(poa: any): Promise<void> {
  const orgId = requireOrgId();
  try {
    const mappedPOA = mapPOAToDB(poa, orgId);
    const { error } = await supabase.from("poas").upsert(mappedPOA);
    if (error) throw error;
  } catch (error) {
    console.error("خطأ في حفظ التوكيل:", error);
    throw error;
  }
}

// ─── المصروفات (Expenses) ────────────────────────────────────────
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

// ─── الفاتورة الإلكترونية (ETA Invoices) ───────────────────────
export async function fetchETAInvoices(): Promise<any[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("eta_invoices")
      .select("id, organization_id, amount, status, created_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("خطأ في جلب فواتير ETA:", error);
    return [];
  }
}

export async function saveETAInvoice(invoice: any): Promise<void> {
  const orgId = requireOrgId();
  try {
    const { error } = await supabase
      .from("eta_invoices")
      .upsert({ ...invoice, organization_id: orgId });
    if (error) throw error;
  } catch (error) {
    console.error("خطأ في حفظ فاتورة ETA:", error);
    throw error;
  }
}

// ─── فحص التعارض (Conflict Checks) ─────────────────────────────
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

// ─── المقالات المعرفية (Wiki Articles) ──────────────────────────
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

// ─── المحاكم المتخصصة والقضايا الجنائية ──────────────────────────
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

export async function fetchSpecializedCases(table: string): Promise<any[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from(table)
      .select("id, organization_id, created_at") // Dynamic table select
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`خطأ في جلب سجلات ${table}:`, error);
    return [];
  }
}

// ─── المستندات (Documents) ──────────────────────────────────────
export async function fetchDocuments(): Promise<any[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("documents")
      .select("id, case_id, client_id, file_name, file_url, category, shared_with_client, size, created_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("خطأ في جلب المستندات:", error);
    return [];
  }
}

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

export async function uploadDocumentFile(file: File, caseId: string): Promise<{path: string, url: string}> {
  const orgId = requireOrgId();
  const timestamp = Date.now();
  // Safe filename
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

export async function downloadDocumentFile(path: string): Promise<Blob> {
  const { data, error } = await supabase.storage
    .from("documents")
    .download(path);
  if (error) throw error;
  return data;
}

export async function deleteDocumentFile(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from("documents")
    .remove([path]);
  if (error) throw error;
}

// ─── تتبع الوقت (Time Tracking) ──────────────────────────────────
export async function fetchTimeEntries(): Promise<any[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("time_entries")
      .select("id, case_id, lawyer_id, description, duration_minutes, billable, is_billed, date, created_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("خطأ في جلب سجلات الوقت:", error);
    return [];
  }
}

export async function saveTimeEntry(entry: any): Promise<void> {
  const orgId = requireOrgId();
  try {
    const { error } = await supabase
      .from("time_entries")
      .upsert({ ...entry, organization_id: orgId });
    if (error) throw error;
  } catch (error) {
    console.error("خطأ في حفظ سجل الوقت:", error);
    throw error;
  }
}

export async function deleteTimeEntryRecord(id: string): Promise<void> {
  const orgId = requireOrgId();
  const { error } = await supabase
    .from("time_entries")
    .delete()
    .eq("id", id)
    .eq("organization_id", orgId);
  if (error) throw error;
}

// ─── التحصيل (Collections) ───────────────────────────────────────
export async function fetchReceivables(): Promise<any[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("receivables")
      .select("id, client_id, client_name, amount, status, due_date, description, created_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("خطأ في جلب المطالبات:", error);
    return [];
  }
}

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

export async function deleteReceivableRecord(id: string): Promise<void> {
  const orgId = requireOrgId();
  const { error } = await supabase
    .from("receivables")
    .delete()
    .eq("id", id)
    .eq("organization_id", orgId);
  if (error) throw error;
}

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

// ─── الخبراء (Expert Missions) ───────────────────────────────────
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

export async function deleteExpertMissionRecord(id: string): Promise<void> {
  const orgId = requireOrgId();
  const { error } = await supabase
    .from("expert_missions")
    .delete()
    .eq("id", id)
    .eq("organization_id", orgId);
  if (error) throw error;
}

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

// ─── التقاضي الإلكتروني (E-Litigation) ───────────────────────────
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

export async function deleteELitigationCase(caseId: string): Promise<void> {
  const orgId = requireOrgId();
  const { error } = await supabase
    .from("e_litigation_cases")
    .delete()
    .eq("case_id", caseId)
    .eq("organization_id", orgId);
  if (error) throw error;
}

export async function deleteFieldCheckin(id: string): Promise<void> {
  const orgId = requireOrgId();
  const { error } = await supabase
    .from("field_checkins")
    .delete()
    .eq("id", id)
    .eq("organization_id", orgId);
  if (error) throw error;
}

// ─── نماذج العقود (Contract Templates) ─────────────────────────
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

export async function deleteContractTemplate(id: string): Promise<void> {
  const orgId = requireOrgId();
  const { error } = await supabase
    .from("contract_templates")
    .delete()
    .eq("id", id)
    .eq("organization_id", orgId);
  if (error) throw error;
}

// ─── الزيارات الميدانية (Field Checkins) ─────────────────────────
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

// ─── العقود (Contracts) ──────────────────────────────────────────
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

export async function deleteContractRecord(id: string): Promise<void> {
  const orgId = requireOrgId();
  const { error } = await supabase
    .from("contracts")
    .delete()
    .eq("id", id)
    .eq("organization_id", orgId);
  if (error) throw error;
}

// ─── المكتبة القانونية (Legal Library / Precedents) ──────────────
export async function fetchLegalLibrary(): Promise<any[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("legal_library")
      .select("id, title, category, summary, tags, date, created_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });
    if (error) {
      // fallback: الجدول قد لا يكون موجوداً بعد
      if (error.code === "PGRST205" || error.code === "42P01") return [];
      throw error;
    }
    return data || [];
  } catch {
    return [];
  }
}

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

// ═══════════════════════════════════════════════════════════════════
// خدمات الأمانات
// ═══════════════════════════════════════════════════════════════════

// جلب جميع الحركات
export async function fetchTrustTransactions(): Promise<TrustTransaction[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("trust_transactions")
      .select("*, clients(name), cases(plaintiff, defendant)")
      .eq("organization_id", orgId)
      .order("transaction_date", { ascending: false });

    if (error) throw error;

    return (data || []).map((t: any) => ({
      id: t.id,
      organization_id: t.organization_id,
      clientId: t.client_id,
      clientName: t.clients?.name ?? "غير معروف",
      caseId: t.case_id ?? undefined,
      caseName: t.cases
        ? `${t.cases.plaintiff} ضد ${t.cases.defendant}`
        : undefined,
      transactionType: t.transaction_type as TrustTransactionType,
      amount: parseFloat(t.amount),
      description: t.description ?? undefined,
      receiptNumber: t.receipt_number ?? undefined,
      transactionDate: t.transaction_date,
      createdBy: t.created_by ?? undefined,
      createdAt: t.created_at,
    }));
  } catch (error) {
    console.error("خطأ في جلب حركات الأمانات:", error);
    return [];
  }
}

// حفظ حركة جديدة
export async function saveTrustTransaction(
  tx: Omit<TrustTransaction, "id" | "createdAt" | "clientName" | "caseName">
): Promise<void> {
  const orgId = requireOrgId();
  try {
    const { error } = await supabase.from("trust_transactions").insert({
      organization_id: orgId,
      client_id: tx.clientId,
      case_id: tx.caseId ?? null,
      transaction_type: tx.transactionType,
      amount: tx.amount,
      description: tx.description ?? null,
      receipt_number: tx.receiptNumber ?? null,
      transaction_date: tx.transactionDate,
    });

    if (error) throw error;

    await logAuditAction(
      tx.transactionType === "deposit" ? "TRUST_DEPOSIT" : "TRUST_WITHDRAWAL",
      "trust_transactions",
      tx.clientId,
      `عملية ${tx.transactionType === "deposit" ? "إيداع" : "صرف"} بقيمة ${tx.amount} ج.م`
    );
  } catch (error) {
    console.error("خطأ في تسجيل حركة الأمانة:", error);
    throw error;
  }
}

// حساب رصيد موكل (بقضية أو بدونها)
export async function fetchClientTrustBalance(
  clientId: string,
  caseId?: string
): Promise<number> {
  const orgId = requireOrgId();
  try {
    let query = supabase
      .from("trust_transactions")
      .select("transaction_type, amount")
      .eq("organization_id", orgId)
      .eq("client_id", clientId);

    if (caseId) query = query.eq("case_id", caseId);

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).reduce((bal, row) => {
      const amt = parseFloat(row.amount);
      return row.transaction_type === "deposit" ? bal + amt : bal - amt;
    }, 0);
  } catch (error) {
    console.error("خطأ في حساب رصيد الأمانة:", error);
    return 0;
  }
}

// إحصائيات الصفحة
export async function fetchTrustPageStats(): Promise<TrustPageStats> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("trust_transactions")
      .select("transaction_type, amount")
      .eq("organization_id", orgId);

    if (error) throw error;

    const stats = (data || []).reduce(
      (acc, row) => {
        const amt = parseFloat(row.amount);
        if (row.transaction_type === "deposit") acc.totalDeposits += amt;
        else acc.totalWithdrawals += amt;
        acc.transactionCount++;
        return acc;
      },
      { totalDeposits: 0, totalWithdrawals: 0, transactionCount: 0 }
    );

    return {
      ...stats,
      totalAvailableBalance: stats.totalDeposits - stats.totalWithdrawals,
    };
  } catch (error) {
    console.error("خطأ في جلب إحصائيات الأمانات:", error);
    return { totalDeposits: 0, totalWithdrawals: 0, totalAvailableBalance: 0, transactionCount: 0 };
  }
}

// حذف حركة
export async function deleteTrustTransaction(id: string): Promise<void> {
  const orgId = requireOrgId();
  const { error } = await supabase
    .from("trust_transactions")
    .delete()
    .eq("id", id)
    .eq("organization_id", orgId);
  if (error) throw error;
}

// ═══════════════════════════════════════════════════════════════════
// خدمات خطط الدفع والأقساط
// ═══════════════════════════════════════════════════════════════════

// جلب كل خطط الدفع مع تفاصيل الموكلين والقضايا والأقساط التابعة
export async function fetchPaymentPlans(): Promise<DBPaymentPlan[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("payment_plans")
      .select("*, clients(name), cases(plaintiff, defendant), payment_installments(*)")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data || []).map((p: any) => ({
      id: p.id,
      organization_id: p.organization_id,
      caseId: p.case_id ?? undefined,
      caseName: p.cases ? `${p.cases.plaintiff} ضد ${p.cases.defendant}` : undefined,
      clientId: p.client_id,
      clientName: p.clients?.name ?? "غير معروف",
      totalAmount: parseFloat(p.total_amount),
      paidAmount: parseFloat(p.paid_amount || "0"),
      planDescription: p.plan_description ?? undefined,
      status: p.status as any,
      createdAt: p.created_at,
      installments: (p.payment_installments || []).map((i: any) => ({
        id: i.id,
        planId: i.plan_id,
        organization_id: i.organization_id,
        dueDate: i.due_date,
        amount: parseFloat(i.amount),
        paidDate: i.paid_date ?? undefined,
        status: i.status as any,
        notes: i.notes ?? undefined,
      })).sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    }));
  } catch (error) {
    console.error("خطأ في جلب خطط الدفع:", error);
    return [];
  }
}

// حفظ خطة دفع جديدة مع أقساطها المجدولة داخل معاملة واحدة
export async function savePaymentPlan(
  plan: Omit<DBPaymentPlan, "id" | "createdAt" | "clientName" | "caseName" | "installments">,
  installments: Omit<DBPaymentInstallment, "id" | "planId" | "organization_id">[]
): Promise<void> {
  const orgId = requireOrgId();
  try {
    const { data: planData, error: planError } = await supabase
      .from("payment_plans")
      .insert({
        organization_id: orgId,
        case_id: plan.caseId ?? null,
        client_id: plan.clientId,
        total_amount: plan.totalAmount,
        paid_amount: plan.paidAmount || 0,
        plan_description: plan.planDescription ?? null,
        status: plan.status || 'active',
      })
      .select()
      .single();

    if (planError) throw planError;
    const planId = planData.id;

    if (installments.length > 0) {
      const dbInstallments = installments.map(i => ({
        plan_id: planId,
        organization_id: orgId,
        due_date: i.dueDate,
        amount: i.amount,
        status: i.status || 'pending',
        notes: i.notes ?? null,
      }));

      const { error: instError } = await supabase
        .from("payment_installments")
        .insert(dbInstallments);

      if (instError) throw instError;
    }

    await logAuditAction(
      "CREATE_PAYMENT_PLAN",
      "payment_plans",
      planId,
      `إنشاء خطة دفع بقيمة ${plan.totalAmount} ج.م للموكل`
    );
  } catch (error) {
    console.error("خطأ في تسجيل خطة الدفع والأقساط:", error);
    throw error;
  }
}

// تسجيل سداد قسط محدد وتعديل حالة الخطة تلقائياً
export async function recordInstallmentPayment(
  installmentId: string,
  amount: number,
  paidDate: string,
  notes?: string
): Promise<void> {
  const orgId = requireOrgId();
  try {
    const { data: instData, error: fetchError } = await supabase
      .from("payment_installments")
      .select("plan_id, amount, status")
      .eq("id", installmentId)
      .eq("organization_id", orgId)
      .single();

    if (fetchError) throw fetchError;
    if (instData.status === 'paid') {
      throw new Error("هذا القسط مدفوع بالفعل.");
    }

    const { error: instUpdateError } = await supabase
      .from("payment_installments")
      .update({
        paid_date: paidDate,
        status: 'paid',
        notes: notes ?? null,
      })
      .eq("id", installmentId)
      .eq("organization_id", orgId);

    if (instUpdateError) throw instUpdateError;

    const { data: planData, error: planFetchError } = await supabase
      .from("payment_plans")
      .select("total_amount, paid_amount")
      .eq("id", instData.plan_id)
      .eq("organization_id", orgId)
      .single();

    if (planFetchError) throw planFetchError;

    const newPaidAmount = parseFloat(planData.paid_amount || "0") + amount;
    const isCompleted = newPaidAmount >= parseFloat(planData.total_amount);

    const { error: planUpdateError } = await supabase
      .from("payment_plans")
      .update({
        paid_amount: newPaidAmount,
        status: isCompleted ? 'completed' : 'active',
      })
      .eq("id", instData.plan_id)
      .eq("organization_id", orgId);

    if (planUpdateError) throw planUpdateError;

    await logAuditAction(
      "PAY_INSTALLMENT",
      "payment_installments",
      installmentId,
      `تسجيل سداد قسط بقيمة ${amount} ج.م للخطة ${instData.plan_id}`
    );
  } catch (error) {
    console.error("خطأ في سداد القسط:", error);
    throw error;
  }
}




