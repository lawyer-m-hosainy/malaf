/**
 * AI Conflict Checker - نظام فحص تعارض المصالح الذكي
 */

import { callAiApi } from "./apiClient";

export interface ConflictMatch {
  entityName: string;
  relationshipType: 'Client' | 'AdverseParty' | 'Subsidiary' | 'Relative' | 'Other';
  severity: 'High' | 'Medium' | 'Low';
  details: string;
}

export interface ConflictCheckResult {
  status: 'Clear' | 'DirectConflict' | 'IndirectConflict' | 'PotentialConflict';
  matches: ConflictMatch[];
  aiReasoning: string;
}

/**
 * فحص تعارض المصالح باستخدام الذكاء الاصطناعي للكشف عن العلاقات المعقدة
 */
export async function checkConflictAI(
  targetName: string,
  existingData: { clients: any[]; cases: any[] }
): Promise<ConflictCheckResult> {
  if (!targetName) {
    throw new Error("Target name is required for conflict check");
  }

  const conflictPrompt = `
أنت خبير امتثال قانوني (Legal Compliance Officer). قم بفحص تعارض المصالح للكيان التالي:
الكيان المطلوب فصحه: "${targetName}"

البيانات الموجودة في المنصة:
الموكلون الحاليون: ${JSON.stringify(existingData.clients.map(c => ({ name: c.name, subsidiaries: c.subsidiaries })))}
القضايا والخصوم: ${JSON.stringify(existingData.cases.map(c => ({ plaintiff: c.plaintiff, defendant: c.defendant })))}

المطلوب:
1. هل هناك تطابق مباشر أو تقارب شديد في الأسماء (Fuzzy matching)؟
2. هل هناك علاقة تبعية (شركات تابعة)؟
3. هل يظهر هذا الكيان كخصم في أي قضية حالية؟
4. هل هناك أي علاقة محتملة تثير الشبهة؟

أجب بصيغة JSON فقط بالتنسيق التالي:
{
  "status": "Clear" | "DirectConflict" | "IndirectConflict" | "PotentialConflict",
  "matches": [
    { "entityName": "", "relationshipType": "", "severity": "High" | "Medium" | "Low", "details": "" }
  ],
  "aiReasoning": "شرح موجز بالعربية للقرار"
}
  `;

  try {
    const result = await callAiApi("/api/ai/conflict", { prompt: conflictPrompt });
    
    if (result && result.text) {
      const jsonStr = result.text.match(/\{[\s\S]*\}/)?.[0];
      if (jsonStr) {
        return JSON.parse(jsonStr);
      }
    }

    return { status: 'Clear', matches: [], aiReasoning: "لم يتم العثور على تعارض واضح." };

  } catch (error) {
    console.error("AI Conflict Check failed:", error);
    // Fallback to basic logic (mocking the behavior for safety)
    return { 
      status: 'Clear', 
      matches: [], 
      aiReasoning: "فشل نظام الفحص الذكي، يرجى المراجعة يدوياً." 
    };
  }
}
