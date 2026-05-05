import { supabase } from "@/lib/supabase";
import { Case, Client, Invoice } from "@/types";
import { decryptField, encryptField } from "@/lib/encryption";

const CLIENTS_TABLE = "clients";
const CASES_TABLE = "cases";

export async function logAuditAction(action: string, entityType: string, entityId: string, details?: string): Promise<void> {
  try {
    await supabase.from("audit_logs").insert({
      action,
      entity_type: entityType,
      entity_id: entityId,
      details: { info: details || `${action} on ${entityId}` }
    });
  } catch (error) {
    console.error("Audit log failed:", error);
  }
}

export async function fetchClients(): Promise<Client[]> {
  try {
    const { data, error } = await supabase
      .from(CLIENTS_TABLE)
      .select("*")
      .limit(20);

    if (error) throw error;

    return (data || []).map((d: any) => ({
      ...d,
      nationalId: d.national_id ? decryptField(d.national_id) : undefined,
      commercialRegistration: d.commercial_reg ? decryptField(d.commercial_reg) : undefined,
    } as Client));
  } catch (error) {
    console.error("Supabase Error fetching clients:", error);
    throw error;
  }
}

export async function saveClient(client: Client): Promise<void> {
  try {
    const encryptedClient = {
      id: client.id,
      name: client.name,
      type: client.type,
      national_id: client.nationalId ? encryptField(client.nationalId) : undefined,
      commercial_reg: client.commercialRegistration ? encryptField(client.commercialRegistration) : undefined,
      phone: client.phone,
      email: client.email,
    };

    const { error } = await supabase
      .from(CLIENTS_TABLE)
      .upsert(encryptedClient);

    if (error) throw error;
    await logAuditAction('CREATE/UPDATE', 'clients', client.id, `Saved client ${client.name}`);
  } catch (error) {
    console.error("Supabase Error saving client:", error);
    throw error;
  }
}

export interface PaginatedResult<T> {
  data: T[];
  hasMore: boolean;
}

export async function fetchClientsPaginated(
  pageSize: number = 10,
  page: number = 0
): Promise<{ data: Client[]; hasMore: boolean }> {
  try {
    const { data, error, count } = await supabase
      .from(CLIENTS_TABLE)
      .select("*", { count: 'exact' })
      .order("name")
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) throw error;

    const mappedData = (data || []).map((d: any) => ({
      ...d,
      nationalId: d.national_id ? decryptField(d.national_id) : undefined,
      commercialRegistration: d.commercial_reg ? decryptField(d.commercial_reg) : undefined,
    } as Client));

    return { data: mappedData, hasMore: (count || 0) > (page + 1) * pageSize };
  } catch (error) {
    console.error("Supabase Error fetching paginated clients:", error);
    throw error;
  }
}

export async function fetchCases(): Promise<Case[]> {
  try {
    const { data, error } = await supabase
      .from(CASES_TABLE)
      .select("*")
      .limit(20);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Supabase Error fetching cases:", error);
    throw error;
  }
}

export async function saveCases(cases: Case[]): Promise<void> {
  try {
    const { error } = await supabase
      .from(CASES_TABLE)
      .upsert(cases);

    if (error) throw error;
  } catch (error) {
    console.error("Supabase Error saving cases:", error);
    throw error;
  }
}

export async function fetchInvoices(): Promise<Invoice[]> {
  try {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .limit(20);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Supabase Error fetching invoices:", error);
    return [];
  }
}

export async function saveInvoice(invoice: Invoice, isUpdate: boolean = false): Promise<void> {
  try {
    const { error } = await supabase
      .from("invoices")
      .upsert(invoice);

    if (error) throw error;
    await logAuditAction(isUpdate ? 'UPDATE' : 'CREATE', 'invoices', invoice.id, `Saved invoice with total ${invoice.total}`);
  } catch (error) {
    console.error("Supabase Error saving invoice:", error);
    throw error;
  }
}

export async function deleteInvoice(invoiceId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("invoices")
      .delete()
      .eq("id", invoiceId);

    if (error) throw error;
    await logAuditAction('DELETE', 'invoices', invoiceId, 'Deleted invoice');
  } catch (error) {
    console.error("Supabase Error deleting invoice:", error);
    throw error;
  }
}

export async function fetchTasks(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .limit(20);
    if (error) throw error;
    return data || [];
  } catch (error) {
    return [];
  }
}

export async function fetchTeam(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .limit(20);
    if (error) throw error;
    return data || [];
  } catch (error) {
    return [];
  }
}

export async function fetchEnforcement(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("enforcement")
      .select("*")
      .limit(20);
    if (error) throw error;
    return data || [];
  } catch (error) {
    return [];
  }
}

export async function fetchTrustAccounts(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("trust_accounts")
      .select("*")
      .limit(20);
    if (error) throw error;
    return data || [];
  } catch (error) {
    return [];
  }
}

export async function getNextCounter(type: 'circulation' | 'archive'): Promise<string> {
  try {
    const { data, error } = await supabase
      .from("counters")
      .select("last_value")
      .eq("type", type)
      .single();

    let newValue = 1;
    if (data) {
      newValue = data.last_value + 1;
      await supabase
        .from("counters")
        .update({ last_value: newValue })
        .eq("type", type);
    } else {
      await supabase
        .from("counters")
        .insert({ type, last_value: 1 });
    }

    const prefix = type === 'circulation' ? 'T-' : 'H-';
    return `${prefix}${newValue.toString().padStart(4, '0')}`;
  } catch (error) {
    console.error("Counter error:", error);
    const random = Math.floor(1000 + Math.random() * 9000);
    return type === 'circulation' ? `T-${random}` : `H-${random}`;
  }
}
