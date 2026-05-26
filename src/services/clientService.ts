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
 * جلب قائمة الموكلين التابعين للمكتب مع فك تشفير البيانات الحساسة (الرقم القومي والسجل التجاري).
 * 
 * [أمني] يتم فك التشفير برمجياً في طبقة الخدمة لضمان بقاء المفاتيح بعيدة عن قاعدة البيانات.
 * [Supabase] الجدول: `clients` | RLS: معزول حسب المستأجر
 * 
 * @returns {Promise<Client[]>} قائمة الموكلين مع البيانات الحساسة مفكوكة التشفير
 * @throws {PostgrestError} عند حدوث خطأ في استعلام قاعدة البيانات
 * @throws {Error} عند فشل عملية فك التشفير
 * 
 * @example
 * const clients = await fetchClients();
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
 * جلب قائمة الموكلين بشكل مرقم (Paginated) لدعم التصفح السريع في الواجهات الكبيرة.
 * 
 * @param {number} [pageSize=20] - عدد السجلات في كل صفحة
 * @param {number} [page=0] - رقم الصفحة المطلوبة (يبدأ من 0)
 * 
 * @returns {Promise<{ data: Client[]; hasMore: boolean }>} كائن يحتوي على البيانات وهل توجد صفحات إضافية
 * @throws {PostgrestError} عند فشل الاستعلام أو الحساب الإجمالي
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
 * حفظ بيانات موكل جديد أو تحديث بيانات موكل موجود، مع تشفير آلي للبيانات الحساسة.
 * 
 * [أمني] يتم تشفير الرقم القومي والسجل التجاري قبل الإرسال لقاعدة البيانات.
 * [التدقيق] يتم تسجيل الحركة في سجلات النظام للامتثال لقانون 151/2020.
 * 
 * @param {Client} client - كائن بيانات الموكل
 * @returns {Promise<void>} دالة مستقبلية تنتهي عند نجاح الحفظ والتشفير
 * @throws {PostgrestError} عند فشل عملية الـ Upsert
 * @throws {Error} عند فشل عملية التشفير
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
 * حذف موكل ناعماً (Soft Delete) عبر تحديث حقل `deleted_at`.
 * 
 * @param {string} clientId - المعرف الفريد للموكل
 * @returns {Promise<void>} دالة مستقبلية تنتهي عند نجاح التحديث
 * @throws {PostgrestError} عند فشل التحديث في قاعدة البيانات
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
 * جلب قائمة التوكيلات المرتبطة بموكلين المكتب الحالي.
 * 
 * @returns {Promise<any[]>} قائمة التوكيلات مع بيانات الموكلين المرتبطة
 * @throws {PostgrestError} عند فشل الاستعلام المعقد (Join)
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
 * حفظ أو تحديث بيانات توكيل قانوني.
 * 
 * @param {any} poa - بيانات التوكيل (رقم، سنة، مكتب، إلخ)
 * @returns {Promise<void>} دالة مستقبلية تنتهي عند نجاح العملية
 * @throws {PostgrestError} عند فشل عملية الحفظ
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
