/**
 * AI API Client - يتصل بالخادم (Backend) لتوليد ردود حقيقية.
 * يُستخدم فقط عندما يكون الخادم متاحاً ومفتاح Gemini API مُعدّ.
 */

import { auth } from "@/lib/firebase";

export interface ApiResponse {
  text: string;
  provider?: string;
  isFallback?: boolean;
}

export async function callAiApi<T extends Record<string, unknown>>(
  path: string,
  payload: T
): Promise<ApiResponse> {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("UNAUTHORIZED");
  }

  const token = await currentUser.getIdToken();

  const response = await fetch(path, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
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
