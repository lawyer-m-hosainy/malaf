/**
 * AI API Client — يستدعي Supabase Edge Functions.
 * 
 * بدلاً من استدعاء /api/ai/* (خادم غير موجود)،
 * يستدعي Supabase Edge Function "legal-assistant" مباشرةً.
 */
import { supabase } from "@/lib/supabase";

export interface ApiResponse {
  text: string;
  provider?: string;
  isFallback?: boolean;
}

export async function callAiApi<T extends Record<string, unknown>>(
  path: string,
  payload: T
): Promise<ApiResponse> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("UNAUTHORIZED");
  }

  // Map old paths to Edge Function action
  let action = "chat";
  if (path.includes("analyze")) {
    action = "analyze";
  } else if (path.includes("draft")) {
    action = "draft";
  }

  // Call Supabase Edge Function
  const { data, error } = await supabase.functions.invoke("legal-assistant", {
    body: { action, ...payload },
  });

  if (error) {
    console.error("Edge Function error:", error);
    throw new Error("AI_REQUEST_FAILED");
  }

  return {
    text: data?.text || "",
    provider: data?.provider,
    isFallback: data?.isFallback ?? true,
  };
}
