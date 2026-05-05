import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY;
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export async function generateLegalContent(
  templateName: string,
  facts: string
): Promise<string> {
  if (!genAI) {
    throw new Error("Gemini API Key is not configured");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    أنت مساعد قانوني متخصص في القانون المصري. 
    المهمة: كتابة "الوقائع والأسانيد القانونية" لمستند قانوني من نوع "${templateName}".
    المعطيات المتوفرة: ${facts}
    
    القواعد:
    1. استخدم لغة قانونية عربية فصحى وبليغة.
    2. استشهد بمواد من القانون المدني أو قانون المرافعات أو القوانين المصرية ذات الصلة إذا لزم الأمر.
    3. ركز فقط على قسم "الوقائع" و "الأسانيد". لا تكتب الديباجة أو الخاتمة.
    4. اجعل النص متسلسلاً ومنطقياً.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw new Error("فشل توليد المحتوى القانوني عبر الذكاء الاصطناعي");
  }
}
