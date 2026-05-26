/**
 * AI Document Analyzer - نظام تحليل الوثائق القانونية واستخراج البيانات الأساسية
 */

import { callAiApi } from "./apiClient";
import { evaluateOutput } from "./quality-checker";

export interface DocumentParty {
  name: string;
  role: string;
}

export interface FinancialDetail {
  label: string;
  amount: number;
  currency: string;
}

export interface DocumentAnalysisResult {
  contractType: string;
  parties: DocumentParty[];
  financials: FinancialDetail[];
  startDate?: string;
  duration?: string;
  summary: string;
  qualityScore: number;
  isSafe: boolean;
}

/**
 * تحليل نص الوثيقة واستخراج البيانات الهيكلية منها
 */
export async function analyzeDocument(text: string): Promise<DocumentAnalysisResult> {
  if (!text) {
    throw new Error("No text provided for analysis");
  }

  const analyzerPrompt = `
أنت خبير تحليل عقود قانونية مصري. قم بتحليل النص التالي واستخرج البيانات بصيغة JSON فقط:
النص: "${text}"

المطلوب استخراجه:
1. نوع العقد (contractType).
2. الأطراف المعنية وأدوارهم (parties: [{name, role}]).
3. المبالغ المالية المذكورة (financials: [{label, amount, currency}]).
4. تاريخ بداية العقد (startDate).
5. مدة العقد (duration).
6. ملخص موجز (summary).

أجب بصيغة JSON فقط:
{
  "contractType": "",
  "parties": [],
  "financials": [],
  "startDate": "",
  "duration": "",
  "summary": ""
}
  `;

  try {
    // 1. استدعاء الـ AI للتحليل
    const result = await callAiApi("/api/ai/analyze", { prompt: analyzerPrompt });
    
    let analysisData: any = {
      contractType: "غير محدد",
      parties: [],
      financials: [],
      summary: "تعذر التحليل التلقائي"
    };

    if (result && result.text) {
      const jsonStr = result.text.match(/\{[\s\S]*\}/)?.[0];
      if (jsonStr) {
        try {
          analysisData = JSON.parse(jsonStr);
        } catch (e) {
          console.error("Failed to parse analysis JSON", e);
        }
      }
    }

    // 2. فحص الجودة (Quality Gate)
    const quality = await evaluateOutput(text, { domain: analysisData.contractType });

    return {
      ...analysisData,
      qualityScore: quality.confidence * 100,
      isSafe: quality.passed
    };

  } catch (error) {
    console.error("Document analysis failed:", error);
    // Fallback logic for manual testing or API failure
    return {
      contractType: text.includes("إيجار") ? "عقد إيجار" : "عقد عمل",
      parties: [],
      financials: [],
      summary: "فشل الاتصال بنظام التحليل الذكي.",
      qualityScore: 0,
      isSafe: false
    };
  }
}
