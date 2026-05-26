/**
 * AI Service - الواجهة الرئيسية للذكاء الاصطناعي في التطبيق.
 * 
 * الهيكل:
 *   ai/
 *   ├── index.ts          ← أنت هنا (الواجهة العامة)
 *   ├── apiClient.ts      ← الاتصال بالخادم (Backend)
 *   └── mockResponses.ts  ← ردود احتياطية تعمل بدون خادم
 * 
 * كيف يعمل:
 *   1. يحاول الاتصال بالخادم (Backend) أولاً.
 *   2. إذا فشل (لا يوجد خادم أو لا يوجد مفتاح API) ← يُرجع رداً محلياً ذكياً.
 *   3. المستخدم لا يرى أي فرق — النظام يعمل دائماً.
 * 
 * للمستثمر:
 *   - لترقية الـ AI: فقط أضف GEMINI_API_KEY في إعدادات Render وشغّل الخادم.
 *   - لتغيير مزود الـ AI: عدّل apiClient.ts فقط.
 */

import { callAiApi } from "./apiClient";
import {
  getMockAssistantResponse,
  getMockDraftResponse,
  getMockAnalyzeResponse,
} from "./mockResponses";
import { EGYPTIAN_LEGAL_TEMPLATES, AI_DISCLAIMER } from "./templates";
import { useUIStore } from "../../store/useUIStore";
import { sanitizeUserInput, sanitizeData } from "./prompt-sanitizer";
import { checkDocumentQuality } from "./quality-checker";

export interface DocumentContext {
  clientName?: string;
  clientNationalId?: string;
  defendantName?: string;
  courtName?: string;
  caseNumber?: string;
  caseYear?: string;
  poaRef?: string;
  clientRole?: string;
  opponentName?: string;
  opponentRole?: string;
}

/**
 * دالة ذكية لإدارة توليد المستندات مع نظام Fallback متعدد الطبقات وفحص الجودة
 */
async function smartGenerate(
  type: string,
  prompt: string,
  context: Record<string, any> = {}
): Promise<{ text: string; provider: string; quality?: any }> {
  const FALLBACK_CHAIN = [
    { name: 'primary_api', path: '/api/ai/generate', timeout: 15000 },
    { name: 'secondary_api', path: '/api/ai/draft', timeout: 10000 },
    { name: 'mock_fallback', path: null, timeout: 0 }
  ];

  const sanitizedPrompt = sanitizeUserInput(prompt);
  const sanitizedContext = sanitizeData(context);

  for (const provider of FALLBACK_CHAIN) {
    try {
      if (!provider.path) break; // الانتقال للمحاكاة (Mock)

      const result = await Promise.race([
        callAiApi(provider.path, { type, prompt: sanitizedPrompt, context: sanitizedContext }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), provider.timeout))
      ]) as any;

      if (result && result.text) {
        // فحص الجودة (اختياري حسب نوع المستند)
        if (type !== 'chat') {
          const quality = await checkDocumentQuality({
            documentType: type,
            generatedText: result.text,
            sourceData: sanitizedContext
          });
          
          if (quality.safe_to_use || quality.overall_score > 70) {
            return { text: result.text, provider: provider.name, quality };
          }
          console.warn(`Quality too low for ${provider.name}, trying next...`);
        } else {
          return { text: result.text, provider: provider.name };
        }
      }
    } catch (error) {
      console.warn(`Provider ${provider.name} failed:`, error);
    }
  }

  // الملاذ الأخير: المحاكاة الذكية
  return { text: "", provider: 'mock' };
}

export async function getLegalAssistantResponse(
  userMessage: string,
  history: any[] = []
): Promise<string> {
  const sanitizedMessage = sanitizeUserInput(userMessage);
  try {
    const result = await callAiApi("/api/ai/legal-assistant", { userMessage: sanitizedMessage, history });
    if (result.isFallback) {
      useUIStore.getState().setAiFallback(true);
    } else {
      useUIStore.getState().setAiFallback(false);
    }
    return result.text || getMockAssistantResponse(sanitizedMessage);
  } catch (error) {
    console.warn("AI Backend unavailable → using local response", error);
    useUIStore.getState().setAiFallback(true);
    return getMockAssistantResponse(sanitizedMessage);
  }
}

export async function draftLegalDocument(
  templateId: string,
  facts: string,
  context: DocumentContext = {}
): Promise<string> {
  const template = EGYPTIAN_LEGAL_TEMPLATES.find(t => t.id === templateId);
  if (!template) throw new Error("Template not found");

  try {
    // استخدام المنطق الذكي للتوليد مع نظام Fallback وفحص الجودة
    const result = await smartGenerate(template.name, facts, context as any);
    
    if (result.provider === 'mock') {
      useUIStore.getState().setAiFallback(true);
      return getMockDraftResponse(template.name, facts);
    }

    useUIStore.getState().setAiFallback(false);
    const aiContent = result.text || facts;

    // 2. Auto-fill template
    let filledTemplate = template.structure;
    
    const replacements: Record<string, string> = {
      "{{CLIENT_NAME}}": context.clientName || "_________",
      "{{CLIENT_NATIONAL_ID}}": context.clientNationalId || "_________",
      "{{DEFENDANT_NAME}}": context.defendantName || "_________",
      "{{OPPONENT_NAME}}": context.opponentName || context.defendantName || "_________",
      "{{COURT_NAME}}": context.courtName || "_________",
      "{{CASE_NUMBER}}": context.caseNumber || "_________",
      "{{CASE_YEAR}}": context.caseYear || "2024",
      "{{POA_REF}}": context.poaRef || "_________",
      "{{CLIENT_ROLE}}": context.clientRole || "المدعي",
      "{{OPPONENT_ROLE}}": context.opponentRole || "المدعى عليه",
      "{{FACTS_AND_ARGUMENTS}}": aiContent,
      "{{FACTS}}": aiContent.split("الدفاع")[0] || aiContent,
      "{{LEGAL_ARGUMENTS}}": aiContent.split("الدفاع")[1] || "يترك للمرافعة الشفوية.",
    };

    Object.entries(replacements).forEach(([placeholder, value]) => {
      filledTemplate = filledTemplate.replaceAll(placeholder, value);
    });

    // 3. Add Disclaimer
    return `${filledTemplate}\n\n---\n${AI_DISCLAIMER}`;
  } catch (error) {
    console.error("Drafting Error:", error);
    useUIStore.getState().setAiFallback(true);
    return getMockDraftResponse(templateId, facts);
  }
}


export async function analyzeLegalDocument(
  content: string
): Promise<string> {
  try {
    const result = await callAiApi("/api/ai/analyze", { content });
    if (result.isFallback) {
      useUIStore.getState().setAiFallback(true);
    } else {
      useUIStore.getState().setAiFallback(false);
    }
    return result.text || getMockAnalyzeResponse(content);
  } catch (error) {
    console.warn("AI Backend unavailable → using local analysis", error);
    useUIStore.getState().setAiFallback(true);
    return getMockAnalyzeResponse(content);
  }
}
