/**
 * AI API Client — uses Supabase Auth tokens.
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

  const response = await fetch(path, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("AI_REQUEST_FAILED");
  }

  const data = await response.json();
  return {
    text: data.text || "",
    provider: data.provider,
    isFallback: data.isFallback
  };
}
