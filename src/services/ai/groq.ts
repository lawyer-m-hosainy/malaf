/**
 * Groq AI Service - استخدام نماذج Llama 3 عبر Groq للتحليل القانوني.
 */

const GROQ_API_KEY = (import.meta as any).env.VITE_GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function generateLegalContentGroq(
  templateName: string,
  facts: string
): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error("Groq API Key is not configured");
  }

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
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "أنت محامي مصري خبير ومساعد قانوني ذكي."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Groq API Error:", errorData);
      throw new Error("فشل الاتصال بـ Groq AI");
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("Groq Generation Error:", error);
    throw new Error("فشل توليد المحتوى القانوني عبر Groq");
  }
}

export async function getLegalAssistantResponseGroq(
  userMessage: string,
  history: any[] = []
): Promise<string> {
  if (!GROQ_API_KEY) return "";

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "أنت 'مَلَف' - المساعد القانوني الذكي لمكاتب المحاماة في مصر. ساعد المستخدم في إدارة مكتبه، صياغة المذكرات، وفهم الإجراءات القانونية المصرية."
          },
          ...history.map(m => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content || (m.parts && m.parts[0]?.text) || ""
          })),
          {
            role: "user",
            content: userMessage
          }
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    return data.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("Groq Assistant Error:", error);
    return "";
  }
}
