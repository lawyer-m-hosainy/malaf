/**
 * AI Quality Checker - نظام تقييم جودة المستندات القانونية الموُلدة
 */

import { callAiApi } from "./apiClient";

export interface QualityReport {
  data_accuracy: number;     // 0-100
  legal_validity: number;    // 0-100
  hallucinations: string[];  // قائمة بالهلوسات المكتشفة
  missing_clauses: string[]; // البنود المفقودة
  overall_score: number;     // 0-100
  safe_to_use: boolean;
  reviewer_note: string;
}

export interface QualityCheckInput {
  documentType: string;
  generatedText: string;
  sourceData: Record<string, any>;
}

/**
 * استخدام نموذج ذكاء اصطناعي لتقييم مخرجات نموذج آخر (LLM-as-Judge)
 */
export async function checkDocumentQuality(input: QualityCheckInput): Promise<QualityReport> {
  const judgePrompt = `
أنت مراجع قانوني مصري متخصص. قيّم المستند التالي:
نوع المستند: ${input.documentType}
البيانات المصدر (ما يجب أن يحتويه): ${JSON.stringify(input.sourceData)}
المستند المُولَّد: ${input.generatedText}

ارصد فقط:
1. هل تتطابق الأسماء/الأرقام/التواريخ مع البيانات المصدر؟
2. هل المواد القانونية المذكورة موجودة فعلاً في القانون المصري؟
3. هل البنود الإلزامية لهذا النوع من المستندات موجودة؟

أجب بـ JSON فقط بالتنسيق التالي:
{
  "data_accuracy": 0-100,
  "legal_validity": 0-100,
  "hallucinations": [],
  "missing_clauses": [],
  "overall_score": 0-100,
  "safe_to_use": true/false,
  "reviewer_note": ""
}
  `;

  try {
    const result = await callAiApi("/api/ai/judge", { prompt: judgePrompt });
    
    // محاولة تحويل الرد إلى JSON
    if (result.text) {
      const jsonStr = result.text.match(/\{[\s\S]*\}/)?.[0];
      if (jsonStr) {
        return JSON.parse(jsonStr);
      }
    }
    
    throw new Error("Invalid judge response");
  } catch (error) {
    console.error("Quality check failed:", error);
    // رد افتراضي في حالة الفشل (حذر)
    return {
      data_accuracy: 0,
      legal_validity: 0,
      hallucinations: ["فشل فحص الجودة التلقائي"],
      missing_clauses: [],
      overall_score: 0,
      safe_to_use: false,
      reviewer_note: "تعذر التحقق من جودة المستند برمجياً."
    };
  }
}
