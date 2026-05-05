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
import { generateLegalContent } from "./gemini";
import { generateLegalContentGroq, getLegalAssistantResponseGroq } from "./groq";

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


export async function getLegalAssistantResponse(
  userMessage: string,
  history: any[] = []
): Promise<string> {
  // 1. Try Groq (User preferred)
  try {
    const groqResponse = await getLegalAssistantResponseGroq(userMessage, history);
    if (groqResponse) return groqResponse;
  } catch (e) {
    console.warn("Groq failed, trying backend...");
  }

  // 2. Try Backend
  try {
    const result = await callAiApi("/api/ai/legal-assistant", { userMessage, history });
    return result || getMockAssistantResponse(userMessage);
  } catch {
    console.warn("AI Backend unavailable → using local response");
    return getMockAssistantResponse(userMessage);
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
    // 1. Generate AI content (Prefer Groq, then Gemini)
    let aiContent = "";
    
    try {
      // Try Groq first
      aiContent = await generateLegalContentGroq(template.name, facts);
    } catch (groqError) {
      console.warn("Groq failed, trying Gemini:", groqError);
      try {
        // Fallback to Gemini
        aiContent = await generateLegalContent(template.name, facts);
      } catch (geminiError) {
        console.warn("Gemini failed, using raw facts:", geminiError);
        aiContent = facts;
      }
    }

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
    return getMockDraftResponse(templateId, facts);
  }
}


export async function analyzeLegalDocument(
  content: string
): Promise<string> {
  try {
    const result = await callAiApi("/api/ai/analyze", { content });
    return result || getMockAnalyzeResponse(content);
  } catch {
    console.warn("AI Backend unavailable → using local analysis");
    return getMockAnalyzeResponse(content);
  }
}
