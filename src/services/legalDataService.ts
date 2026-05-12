import { supabase } from "@/lib/supabase";
import { getCurrentTenantId } from "@/lib/tenant";
import { Case, Client, Invoice } from "@/types";
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
      .select("id, name, type, phone, email, national_id, commercial_reg")
      .eq("org_id", orgId)
      .is("deleted_at", null)
      .order("name")
      .limit(20);

    if (error) throw error;

    const nationalIdsToDecrypt = data?.map((d: any) => d.national_id) || [];
    const commercialRegsToDecrypt = data?.map((d: any) => d.commercial_reg) || [];
    
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
      .select("id, name, type, phone, email, national_id, commercial_reg", { count: "exact" })
      .eq("org_id", orgId)
      .is("deleted_at", null)
      .order("name")
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) throw error;

    const nationalIdsToDecrypt = data?.map((d: any) => d.national_id) || [];
    const commercialRegsToDecrypt = data?.map((d: any) => d.commercial_reg) || [];
    
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
  // ✅ الحذف الناعم بدلاً من الحذف الفعلي
  const { error } = await supabase
    .from(CLIENTS_TABLE)
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", clientId)
    .eq("org_id", orgId);
  if (error) throw error;
  await logAuditAction("DELETE_SOFT", "clients", clientId, "حذف موكل (ناعم)");
}

// ─── القضايا (Cases) ─────────────────────────────────────────────
export async function fetchCases(): Promise<Case[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from(CASES_TABLE)
      .select("id, plaintiff, defendant, court, case_number, case_year, status, created_at")
      .eq("org_id", orgId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;
    return (data || []) as any;
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

export async function saveCase(caseData: Partial<Case>): Promise<void> {
  const orgId = requireOrgId();
  try {
    const { error } = await supabase.from(CASES_TABLE).upsert({ ...caseData, org_id: orgId });
    if (error) throw error;
  } catch (error) {
    console.error("خطأ في حفظ القضية:", error);
    throw error;
  }
}

export async function deleteCase(caseId: string): Promise<void> {
  const orgId = requireOrgId();
  const { error } = await supabase
    .from(CASES_TABLE)
    .update({ deleted_at: new Date().toISOString() }) // ✅ حذف ناعم
    .eq("id", caseId)
    .eq("org_id", orgId);
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
      .eq("org_id", orgId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;
    return (data || []) as any;
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
    .update({ deleted_at: new Date().toISOString() }) // ✅ حذف ناعم
    .eq("id", invoiceId)
    .eq("org_id", orgId);
  if (error) throw error;
  await logAuditAction("DELETE_SOFT", "invoices", invoiceId, "حذف فاتورة (ناعم)");
}

// ─── المهام (Tasks) ──────────────────────────────────────────────
export async function fetchTasks(): Promise<any[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("tasks")
      .select("id, title, status, due_date, assigned_to")
      .eq("org_id", orgId)
      .is("deleted_at", null)
      .order("due_date")
      .limit(50);
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("خطأ في جلب المهام:", error);
    return [];
  }
}

export async function deleteTask(taskId: string): Promise<void> {
  const orgId = requireOrgId();
  const { error } = await supabase
    .from("tasks")
    .update({ deleted_at: new Date().toISOString() }) // ✅ حذف ناعم
    .eq("id", taskId)
    .eq("org_id", orgId);
  if (error) throw error;
  await logAuditAction("DELETE_SOFT", "tasks", taskId, "حذف مهمة (ناعم)");
}

// ─── فريق العمل (Profiles) ──────────────────────────────────────
export async function fetchTeam(): Promise<any[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, role, email, created_at")
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
      .select("id, case_id, amount_claimed, amount_collected, status, created_at")
      .eq("org_id", orgId)
      .is("deleted_at", null) // ✅ احترام الحذف الناعم
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
    .from("enforcement")
    .update({ deleted_at: new Date().toISOString() }) // ✅ حذف ناعم
    .eq("id", id)
    .eq("org_id", orgId);
  if (error) throw error;
  await logAuditAction("DELETE_SOFT", "enforcement", id, "حذف ملف تنفيذ (ناعم)");
}

// ─── حسابات الأمانات (Trust Accounts) ──────────────────────────
export async function fetchTrustAccounts(): Promise<any[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("trust_accounts")
      .select("id, client_id, amount, type, status, created_at")
      .eq("org_id", orgId)
      .is("deleted_at", null) // ✅ احترام الحذف الناعم
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
    .update({ deleted_at: new Date().toISOString() }) // ✅ حذف ناعم
    .eq("id", id)
    .eq("org_id", orgId);
  if (error) throw error;
  await logAuditAction("DELETE_SOFT", "trust_accounts", id, "حذف حساب أمانة (ناعم)");
}

// ─── الجلسات (Sessions) ──────────────────────────────────────────
export async function fetchSessions(caseId?: string): Promise<any[]> {
  const orgId = requireOrgId();
  try {
    let query = supabase
      .from("sessions")
      .select("id, case_id, org_id, date, time, court_room, notes, created_at")
      .eq("org_id", orgId) // ✅ عزل مباشر باستخدام org_id
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
      .select("id, client_id, number, year, office, type, status, expiry_date, created_at, clients!inner(org_id)")
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
      .select("id, case_id, amount, category, description, date, created_at")
      .eq("org_id", orgId)
      .is("deleted_at", null) // ✅ احترام الحذف الناعم
      .order("date", { ascending: false })
      .limit(100);
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("خطأ في جلب المصروفات:", error);
    return [];
  }
}

export async function deleteExpense(id: string): Promise<void> {
  const orgId = requireOrgId();
  const { error } = await supabase
    .from("expenses")
    .update({ deleted_at: new Date().toISOString() }) // ✅ حذف ناعم
    .eq("id", id)
    .eq("org_id", orgId);
  if (error) throw error;
  await logAuditAction("DELETE_SOFT", "expenses", id, "حذف مصروف (ناعم)");
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
      .select("*")
      .eq("org_id", orgId)
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
      .upsert({ ...invoice, org_id: orgId });
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
      .select("*")
      .eq("org_id", orgId)
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
      .upsert({ ...record, org_id: orgId });
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
      .select("*")
      .eq("org_id", orgId)
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
      .upsert({ ...article, org_id: orgId });
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
      .upsert({ ...record, org_id: orgId });
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
      .select("*")
      .eq("org_id", orgId)
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
      .select("*")
      .eq("org_id", orgId)
      .is("deleted_at", null)
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
      .upsert({ ...doc, org_id: orgId });
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
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", orgId);
  if (error) throw error;
  await logAuditAction("DELETE_SOFT", "documents", id, "حذف مستند (ناعم)");
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
      .select("*")
      .eq("org_id", orgId)
      .is("deleted_at", null)
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
      .upsert({ ...entry, org_id: orgId });
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
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", orgId);
  if (error) throw error;
}

// ─── التحصيل (Collections) ───────────────────────────────────────
export async function fetchReceivables(): Promise<any[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("receivables")
      .select("*")
      .eq("org_id", orgId)
      .is("deleted_at", null)
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
      .upsert({ ...rec, org_id: orgId });
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
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", orgId);
  if (error) throw error;
}

export async function fetchCollectionActions(receivableId: string): Promise<any[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("collection_actions")
      .select("*")
      .eq("org_id", orgId)
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
      .upsert({ ...action, org_id: orgId });
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
      .select("*")
      .eq("org_id", orgId)
      .is("deleted_at", null)
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
      .upsert({ ...mission, org_id: orgId });
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
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", orgId);
  if (error) throw error;
}

export async function fetchExpertSessions(missionId: string): Promise<any[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("expert_sessions")
      .select("*")
      .eq("org_id", orgId)
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
      .upsert({ ...session, org_id: orgId });
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
      .select("*")
      .eq("org_id", orgId)
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
      .upsert({ ...caseRef, org_id: orgId });
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
    .eq("org_id", orgId);
  if (error) throw error;
}

export async function deleteFieldCheckin(id: string): Promise<void> {
  const orgId = requireOrgId();
  const { error } = await supabase
    .from("field_checkins")
    .delete()
    .eq("id", id)
    .eq("org_id", orgId);
  if (error) throw error;
}

// ─── نماذج العقود (Contract Templates) ─────────────────────────
export async function fetchContractTemplates(): Promise<any[]> {
  const orgId = requireOrgId();
  const { data, error } = await supabase
    .from("contract_templates")
    .select("*")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function saveContractTemplate(templateData: any): Promise<void> {
  const orgId = requireOrgId();
  try {
    const { error } = await supabase
      .from("contract_templates")
      .upsert({ ...templateData, org_id: orgId });
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
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", orgId);
  if (error) throw error;
}

// ─── الزيارات الميدانية (Field Checkins) ─────────────────────────
export async function fetchFieldCheckins(): Promise<any[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from("field_checkins")
      .select("*")
      .eq("org_id", orgId)
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
      .upsert({ ...checkin, org_id: orgId });
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
      .select("*")
      .eq("org_id", orgId)
      .is("deleted_at", null)
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
      .upsert({ ...contract, org_id: orgId });
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
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", orgId);
  if (error) throw error;
}

