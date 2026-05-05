import { Client } from "@/types";

/**
 * Validates that a client has the required identity fields based on type.
 */
export function validateClientIdentity(client: Partial<Client>): { valid: boolean; error?: string } {
  if (!client.name || client.name.trim().length < 2) {
    return { valid: false, error: "اسم العميل مطلوب (حرفان على الأقل)" };
  }
  if (!client.phone) {
    return { valid: false, error: "رقم الجوال مطلوب" };
  }
  if (client.type === "فرد" && !client.nationalId) {
    return { valid: false, error: "الرقم القومي مطلوب للأفراد" };
  }
  if (client.type === "منشأة" && !client.commercialRegistration) {
    return { valid: false, error: "السجل التجاري مطلوب للمنشآت" };
  }
  return { valid: true };
}

/**
 * Egyptian governorate codes (digits 8-9 of the 14-digit NID).
 */
const GOVERNORATE_CODES: Record<string, string> = {
  '01': 'القاهرة', '02': 'الإسكندرية', '03': 'بورسعيد', '04': 'السويس',
  '11': 'دمياط', '12': 'الدقهلية', '13': 'الشرقية', '14': 'القليوبية',
  '15': 'كفر الشيخ', '16': 'الغربية', '17': 'المنوفية', '18': 'البحيرة',
  '19': 'الإسماعيلية', '21': 'الجيزة', '22': 'بني سويف', '23': 'الفيوم',
  '24': 'المنيا', '25': 'أسيوط', '26': 'سوهاج', '27': 'قنا',
  '28': 'أسوان', '29': 'الأقصر', '31': 'البحر الأحمر', '32': 'الوادي الجديد',
  '33': 'مطروح', '34': 'شمال سيناء', '35': 'جنوب سيناء',
};

/**
 * Validates Egyptian National ID format (14 digits).
 * Digit 1 = century (2=1900s, 3=2000s)
 * Digits 2-7 = YYMMDD
 * Digits 8-9 = governorate code
 */
export function isValidNationalId(id: string): boolean {
  if (!/^[23]\d{13}$/.test(id)) return false;
  
  const century = id[0]; // 2 = 1900s, 3 = 2000s
  const year = parseInt(id.substring(1, 3));
  const month = parseInt(id.substring(3, 5));
  const day = parseInt(id.substring(5, 7));
  const govCode = id.substring(7, 9);
  
  // Validate date components
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  
  // Validate governorate code
  if (!GOVERNORATE_CODES[govCode]) return false;
  
  return true;
}

/**
 * Extracts governorate from Egyptian NID.
 */
export function getGovernorateFromNID(id: string): string | null {
  if (!isValidNationalId(id)) return null;
  return GOVERNORATE_CODES[id.substring(7, 9)] || null;
}

/**
 * Validates Egyptian Commercial Registration number.
 */
export function isValidCommercialRegistration(cr: string): boolean {
  return /^\d{5,10}$/.test(cr);
}

/**
 * Validates Egyptian Tax ID number (9 digits).
 */
export function isValidVatNumber(vat: string): boolean {
  return /^\d{9}$/.test(vat);
}

/**
 * Checks if a client can be safely deleted (no active cases linked).
 */
export function canDeleteClient(clientId: string, activeCaseClientIds: string[]): { allowed: boolean; reason?: string } {
  if (activeCaseClientIds.includes(clientId)) {
    return { allowed: false, reason: "لا يمكن حذف عميل لديه قضايا نشطة" };
  }
  return { allowed: true };
}

/**
 * Enriches client display data.
 */
export function getClientDisplayBadge(client: Client): { label: string; color: string } {
  if (client.type === "منشأة") {
    return { label: "منشأة", color: "blue" };
  }
  return { label: "فرد", color: "purple" };
}
