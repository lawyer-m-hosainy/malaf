import { supabase } from "@/lib/supabase";
import { Client } from "@/types";
import { encryptField, batchDecryptFields } from "@/lib/encryption";
import { requireOrgId, logAuditAction } from "./utils";

const CLIENTS_TABLE = "clients";

/**
 * تحويل بيانات التوكيل من تنسيق التطبيق إلى تنسيق قاعدة البيانات
 * @param poa - بيانات التوكيل
 * @param orgId - معرف المكتب
 */
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

/**
 * جلب قائمة الموكلين مع فك تشفير البيانات الحساسة
 * @returns {Promise<Client[]>} قائمة الموكلين
 */
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

/**
 * جلب قائمة الموكلين بشكل مرقم (Paginated)
 * @param pageSize - عدد السجلات في الصفحة
 * @param page - رقم الصفحة
 */
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

/**
 * حفظ بيانات موكل (Create or Update) مع تشفير البيانات الحساسة
 * @param client - بيانات الموكل
 */
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

    if (client.id && !client.id.startsWith('C-')) {
      encryptedClient.id = client.id;
    }

    const { data, error } = await supabase.from(CLIENTS_TABLE).upsert(encryptedClient).select('id').single();
    if (error) throw error;
    if (data?.id) client.id = data.id;
    await logAuditAction("CREATE/UPDATE", "clients", client.id, `حفظ موكل: ${client.name}`);
  } catch (error) {
    console.error("خطأ في حفظ الموكل:", error);
    throw error;
  }
}

/**
 * حذف موكل (Soft Delete)
 * @param clientId - معرف الموكل
 */
export async function deleteClient(clientId: string): Promise<void> {
  const orgId = requireOrgId();
  const { error } = await supabase
    .from(CLIENTS_TABLE)
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", clientId)
    .eq("organization_id", orgId);
  if (error) throw error;
  await logAuditAction("DELETE_SOFT", "clients", clientId, "حذف موكل (ناعم)");
}

/**
 * جلب قائمة التوكيلات
 * @returns {Promise<any[]>} قائمة التوكيلات
 */
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

/**
 * حفظ بيانات توكيل
 * @param poa - بيانات التوكيل
 */
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
