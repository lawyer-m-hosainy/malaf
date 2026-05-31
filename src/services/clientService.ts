import { supabase } from "@/lib/supabase";
import { Client } from "@/types";
import { encrypt, batchDecrypt } from "@/lib/encryption";
import { requireOrgId } from "./utils";

const CLIENTS_TABLE = "clients";

/**
 * جلب قائمة الموكلين
 */
export async function fetchClients(): Promise<Client[]> {
  const orgId = requireOrgId();
  try {
    const { data, error } = await supabase
      .from(CLIENTS_TABLE)
      .select("id, name, type, phone, national_id, company_reg_number, email, address, created_at")
      .or(`org_id.eq.${orgId},organization_id.eq.${orgId}`)
      .is("deleted_at", null)
      .order("name");

    if (error) throw error;
    return (data || []) as Client[];
  } catch (error) {
    console.error("خطأ في جلب الموكلين:", error);
    throw error;
  }
}

/**
 * جلب قائمة الموكلين بشكل مرقم
 */
export async function fetchClientsPaginated(
  pageSize: number = 20,
  page: number = 0
): Promise<{ data: Client[]; hasMore: boolean }> {
  const orgId = requireOrgId();
  try {
    const { data, error, count } = await supabase
      .from(CLIENTS_TABLE)
      .select("id, name, type, phone, national_id, company_reg_number, email, address, created_at", { count: "exact" })
      .or(`org_id.eq.${orgId},organization_id.eq.${orgId}`)
      .is("deleted_at", null)
      .order("name")
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) throw error;
    return { 
      data: (data || []) as Client[], 
      hasMore: (count || 0) > (page + 1) * pageSize 
    };
  } catch (error) {
    console.error("خطأ في جلب الموكلين:", error);
    throw error;
  }
}

/**
 * حفظ موكل جديد أو تحديث موكل موجود
 */
export async function saveClient(client: Client): Promise<void> {
  const orgId = requireOrgId();
  try {
    const payload: any = {
      organization_id: orgId,
      org_id: orgId,
      name: client.name,
      type: client.type,
      phone: client.phone,
      email: client.email,
      address: client.address,
    };

    if (client.nationalId) {
      payload.national_id = client.nationalId;
    }
    if (client.commercialRegistration) {
      payload.company_reg_number = client.commercialRegistration;
    }
    if (client.vatNumber) {
      payload.tax_id = client.vatNumber;
    }

    const { data, error } = await supabase.from(CLIENTS_TABLE).upsert(payload).select('id').single();
    if (error) throw error;
    if (data?.id) client.id = data.id;
  } catch (error) {
    console.error("خطأ في حفظ الموكل:", error);
    throw error;
  }
}

/**
 * حذف موكل ناعم
 */
export async function deleteClient(clientId: string): Promise<void> {
  const orgId = requireOrgId();
  const { error } = await supabase
    .from(CLIENTS_TABLE)
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", clientId)
    .or(`org_id.eq.${orgId},organization_id.eq.${orgId}`);
  
  if (error) throw error;
}
