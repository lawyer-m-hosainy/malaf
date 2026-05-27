/**
 * AI Service - الواجهة الرئيسية للذكاء الاصطناعي في التطبيق.
 */

import { callAiApi } from "./apiClient";
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
 * استدعاء المساعد القانوني التفاعلي للحصول على ردود استشارية ذكية.
 * 
 * @param {string} userMessage - رسالة المستخدم/المحامي
 * @param {any[]} history - سجل المحادثة السابقة
 * @returns {Promise<string>} الرد القانوني المولد
 */
export async function getLegalAssistantResponse(
  userMessage: string,
  history: any[] = []
): Promise<string> {
  const sanitizedMessage = sanitizeUserInput(userMessage);
  try {
    const result = await callAiApi("/api/ai/legal-assistant", { userMessage: sanitizedMessage, history });
    useUIStore.getState().setAiFallback(false);
    return result.text;
  } catch (error: any) {
    console.error("AI Backend error:", error);
    useUIStore.getState().setAiFallback(true);
    throw new Error(error.message || "عذراً، حدث خطأ في الاتصال بالذكاء الاصطناعي. يرجى المحاولة مرة أخرى.");
  }
}

/**
 * الحصول على خارطة بالاستبدالات القانونية بناءً على سياق القضية.
 * 
 * @param {Record<string, string>} merged - سياق القضية المدمج بالقيم الافتراضية
 * @param {string} aiContent - المحتوى المولد بالذكاء الاصطناعي
 * @returns {Record<string, string>} خارطة الاستبدالات
 */
function getReplacementsMap(
  merged: Record<string, string>,
  aiContent: string
): Record<string, string> {
  const opponent = merged.opponentName === "_________" ? merged.defendantName : merged.opponentName;
  const factsArr = aiContent.split("الدفاع");
  const factsText = factsArr[0];
  const factsVal = factsText ? factsText : aiContent;
  
  const legalText = factsArr[1];
  const legalVal = legalText ? legalText : "يترك للمرافعة الشفوية.";

  return {
    "{{CLIENT_NAME}}": merged.clientName,
    "{{CLIENT_NATIONAL_ID}}": merged.clientNationalId,
    "{{DEFENDANT_NAME}}": merged.defendantName,
    "{{OPPONENT_NAME}}": opponent,
    "{{COURT_NAME}}": merged.courtName,
    "{{CASE_NUMBER}}": merged.caseNumber,
    "{{CASE_YEAR}}": merged.caseYear,
    "{{POA_REF}}": merged.poaRef,
    "{{CLIENT_ROLE}}": merged.clientRole,
    "{{OPPONENT_ROLE}}": merged.opponentRole,
    "{{FACTS_AND_ARGUMENTS}}": aiContent,
    "{{FACTS}}": factsVal,
    "{{LEGAL_ARGUMENTS}}": legalVal,
  };
}

/**
 * تطبيق استبدال الحقول البرمجية داخل بنية المستند القانوني.
 * 
 * @param {string} structure - البنية الأساسية للنموذج
 * @param {string} aiContent - المحتوى المولد بالذكاء الاصطناعي
 * @param {DocumentContext} context - سياق القضية والموكل
 * @returns {string} النموذج بعد استبدال الحقول
 */
function applyTemplateReplacements(
  structure: string,
  aiContent: string,
  context: DocumentContext
): string {
  const defaultContext: Record<string, string> = {
    clientName: "_________",
    clientNationalId: "_________",
    defendantName: "_________",
    opponentName: "_________",
    courtName: "_________",
    caseNumber: "_________",
    caseYear: "2024",
    poaRef: "_________",
    clientRole: "المدعي",
    opponentRole: "المدعى عليه",
  };

  const cleanContext: Record<string, string> = {};
  const entries = Object.entries(context);
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const key = entry[0];
    const val = entry[1];
    if (val !== undefined && val !== null) {
      cleanContext[key] = val;
    }
  }

  const merged = { ...defaultContext, ...cleanContext };
  const replacements = getReplacementsMap(merged, aiContent);

  let filled = structure;
  const replacementEntries = Object.entries(replacements);
  for (let j = 0; j < replacementEntries.length; j++) {
    const item = replacementEntries[j];
    filled = filled.replaceAll(item[0], item[1]);
  }

  return filled;
}

/**
 * صياغة مسودة وثيقة قانونية جديدة بالاعتماد على الذكاء الاصطناعي ومراقبة الجودة.
 * 
 * @param {string} templateId - معرف النموذج المراد صياغته
 * @param {string} facts - الوقائع المدخلة من المحامي
 * @param {DocumentContext} context - سياق المستند والمعلومات الحقيقية
 * @returns {Promise<string>} نص العقد النهائي المصاغ والمعدل
 */
export async function draftLegalDocument(
  templateId: string,
  facts: string,
  context: DocumentContext = {}
): Promise<string> {
  const template = EGYPTIAN_LEGAL_TEMPLATES.find(t => t.id === templateId);
  if (!template) {
    throw new Error("Template not found");
  }

  const sanitizedFacts = sanitizeUserInput(facts);
  const sanitizedContext = sanitizeData(context);

  try {
    const result = await callAiApi("/api/ai/draft", {
      type: template.name,
      prompt: sanitizedFacts,
      context: sanitizedContext
    });
    
    useUIStore.getState().setAiFallback(false);
    const aiContent = result.text;

    // Quality check
    const quality = await checkDocumentQuality({
      documentType: template.name,
      generatedText: aiContent,
      sourceData: sanitizedContext
    });
    if (!quality.safe_to_use && quality.overall_score < 50) {
      console.warn("Quality of generated document is low:", quality);
    }

    const filledTemplate = applyTemplateReplacements(template.structure, aiContent, context);
    return `${filledTemplate}\n\n---\n${AI_DISCLAIMER}`;
  } catch (error: any) {
    console.error("Drafting Error:", error);
    useUIStore.getState().setAiFallback(true);
    throw new Error(error.message || "عذراً، حدث خطأ في الاتصال بالذكاء الاصطناعي. يرجى المحاولة مرة أخرى.");
  }
}

/**
 * تحليل وثيقة قانونية لاستخراج نقاط القوة والضعف والمخاطر.
 * 
 * @param {string} content - نص الوثيقة المراد تحليلها
 * @returns {Promise<string>} نتيجة التحليل المفصلة
 */
export async function analyzeLegalDocument(
  content: string
): Promise<string> {
  const sanitizedContent = sanitizeUserInput(content);
  try {
    const result = await callAiApi("/api/ai/analyze", { content: sanitizedContent });
    useUIStore.getState().setAiFallback(false);
    return result.text;
  } catch (error: any) {
    console.error("AI Analysis error:", error);
    useUIStore.getState().setAiFallback(true);
    throw new Error(error.message || "عذراً، حدث خطأ في الاتصال بالذكاء الاصطناعي. يرجى المحاولة مرة أخرى.");
  }
}
