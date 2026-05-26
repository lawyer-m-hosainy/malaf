/**
 * AI Conflict Check - نظام فحص تعارض المصالح
 */

export interface ConflictResult {
  hasConflict: boolean;
  conflictingClientId?: string;
  conflictingCaseId?: string;
  reason?: string;
}

export interface ConflictCheckInput {
  clientName: string;
  opposingParty: string;
}

export interface MockDB {
  clients: Array<{ id: string; name: string; cases: string[] }>;
  cases: Array<{ id: string; title: string; plaintiff: string; defendant: string }>;
}

/**
 * فحص تعارض المصالح بناءً على بيانات الموكلين والقضايا الحالية
 */
export async function conflictCheck(
  input: ConflictCheckInput,
  db: MockDB
): Promise<ConflictResult> {
  const { clientName, opposingParty } = input;

  // 1. التحقق إذا كان الطرف الخصم موكلاً حالياً (تعارض مباشر)
  const conflictingClient = db.clients.find(c => c.name === opposingParty);
  if (conflictingClient) {
    return {
      hasConflict: true,
      conflictingClientId: conflictingClient.id,
      conflictingCaseId: conflictingClient.cases[0],
      reason: `الطرف الخصم (${opposingParty}) هو موكل حالي في المكتب.`
    };
  }

  // 2. التحقق إذا كان الموكل الجديد خصماً في قضية سابقة/حالية
  const conflictingCase = db.cases.find(c => c.defendant === clientName);
  if (conflictingCase) {
    return {
      hasConflict: true,
      conflictingClientId: conflictingCase.plaintiff,
      conflictingCaseId: conflictingCase.id,
      reason: `الموكل الجديد (${clientName}) مسجل كخصم في القضية رقم ${conflictingCase.id}.`
    };
  }

  return { hasConflict: false };
}
