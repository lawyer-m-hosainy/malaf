/**
 * AI API Client — يستدعي Supabase Edge Functions.
 */
import { supabase } from "@/lib/supabase";

export interface ApiResponse {
  text: string;
  provider?: string;
  isFallback?: boolean;
}

/**
 * استدعاء الدالة السحابية لخدمة الذكاء الاصطناعي.
 * 
 * @template T - نوع البيانات المرسلة للـ API
 * @param {string} path - المسار القديم ليتم تعيينه لإجراء
 * @param {T} payload - محتوى الطلب
 * @returns {Promise<ApiResponse>} الرد المولد من الذكاء الاصطناعي
 */
export async function callAiApi<T extends Record<string, unknown>>(
  path: string,
  payload: T
): Promise<ApiResponse> {
  const sessionResult = await supabase.auth.getSession();
  const sessionData = sessionResult.data.session;

  if (!sessionData) {
    throw new Error("UNAUTHORIZED");
  }

  // استخدام شروط صريحة وبسيطة لتقليل تعقيد الدالة
  let action = "chat";
  if (path.includes("analyze")) {
    action = "analyze";
  } else if (path.includes("draft")) {
    action = "draft";
  }

  // Call Supabase Edge Function directly
  const { data, error } = await supabase.functions.invoke("legal-assistant", {
    body: { action, ...payload },
  });

  if (error) {
    console.error("Edge Function error:", error);
    throw error;
  }

  if (!data) {
    throw new Error("NO_DATA_RECEIVED");
  }

  if (data.error) {
    throw new Error(data.error);
  }

  const resText = data.text;
  const resProvider = data.provider;

  return {
    text: resText ? resText : "",
    provider: resProvider ? resProvider : "gemini",
    isFallback: false,
  };
}
