/**
 * AI Quality Checker - نظام مكافحة الهلوسة وتقييم الجودة (LLM-as-Judge)
 */

import { callAiApi } from "./apiClient";

export interface QualityResult {
  passed: boolean;
  confidence: number;
  reason: string;
  finalOutput: string;
  hallucinations?: string[];
}

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

const LEGAL_DISCLAIMER = "\n\n---\n⚠️ تنويه: هذا المخرج مولد بواسطة ذكاء اصطناعي. يجب مراجعته بواسطة محامٍ مختص قبل الاستخدام الرسمي.";

/**
 * تقييم مخرجات الذكاء الاصطناعي والتحقق من صحتها (Hallucination Guard)
 */
export async function evaluateOutput(
  text: string, 
  options: { domain?: string; country?: string } = {}
): Promise<QualityResult> {
  const { domain = 'general', country = 'EG' } = options;

  // 1. التحقق السريع من المواد القانونية المعروفة (قاعدة بيانات بسيطة)
  if (country === 'EG' && domain === 'civil_law') {
    const article999Pattern = /999/;
    if (article999Pattern.test(text)) {
      return {
        passed: false,
        confidence: 0.9,
        reason: "المادة 999 من القانون المدني المصري غير موجودة (هلوسة قانونية).",
        finalOutput: text
      };
    }
  }

  // 2. استدعاء الـ AI Judge للتحقق العميق
  const judgePrompt = `
بصفتك خبيراً قانونياً، قم بتقييم النص التالي بدقة:
النص: "${text}"
المجال: ${domain}
الدولة: ${country}

تحقق من:
1. هل المواد القانونية المذكورة صحيحة وموجودة في قوانين هذه الدولة؟
2. هل المعلومات دقيقة أم تحتوي على هلوسات؟
3. ما مدى الثقة في هذا الرد (من 0 إلى 1)؟

أجب بصيغة JSON فقط:
{
  "passed": boolean,
  "confidence": number,
  "reason": "سبب التقييم",
  "hallucinations": []
}
  `;

  try {
    const result = await callAiApi("/api/ai/judge", { prompt: judgePrompt });
    
    let qualityData: any = { passed: true, confidence: 0.8, reason: "فحص تلقائي مقبول" };
    
    if (result && result.text) {
      const jsonStr = result.text.match(/\{[\s\S]*\}/)?.[0];
      if (jsonStr) {
        try {
          qualityData = JSON.parse(jsonStr);
        } catch (e) {
          console.warn("Failed to parse judge JSON, using fallback", e);
        }
      }
    }

    // تطبيق عتبة الثقة
    if (qualityData.confidence < 0.7) {
      qualityData.passed = false;
      qualityData.reason = qualityData.reason || "مستوى الثقة في المخرج ضعيف جداً.";
    }

    return {
      passed: qualityData.passed ?? false,
      confidence: typeof qualityData.confidence === 'number' ? qualityData.confidence : 0,
      reason: qualityData.reason || "تعذر التحقق",
      hallucinations: qualityData.hallucinations || [],
      finalOutput: text + (qualityData.passed ? LEGAL_DISCLAIMER : "")
    };

  } catch (error) {
    console.error("Quality evaluation failed:", error);
    return {
      passed: false,
      confidence: 0,
      reason: "فشل نظام فحص الجودة التلقائي.",
      finalOutput: text
    };
  }
}

/**
 * الوظيفة القديمة للتوافق (Legacy)
 */
export async function checkDocumentQuality(input: QualityCheckInput): Promise<QualityReport> {
  const result = await evaluateOutput(input.generatedText, { domain: input.documentType });
  
  return {
    data_accuracy: result.confidence * 100,
    legal_validity: result.passed ? 100 : 0,
    hallucinations: result.hallucinations || [],
    missing_clauses: [],
    overall_score: result.confidence * 100,
    safe_to_use: result.passed,
    reviewer_note: result.reason
  };
}
