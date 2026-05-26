/**
 * API Client — Malaf Platform
 * ═══════════════════════════════════════════════════════
 * مساعد مركزي لإرسال الطلبات إلى Backend مع Authorization header
 * يستخدم Supabase Auth token تلقائياً
 * ═══════════════════════════════════════════════════════
 */
import { supabase } from "./supabase";

const API_URL = (import.meta as any).env?.VITE_APP_URL || "";

/**
 * Get auth headers with Bearer token from current Supabase session
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }
  return headers;
}

/**
 * Authenticated GET request
 */
export async function apiGet<T = any>(path: string): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}${path}`, { headers });
  if (!res.ok) throw new Error(`API GET ${path} failed: ${res.status}`);
  return res.json();
}

/**
 * Authenticated POST request
 */
export async function apiPost<T = any>(path: string, body: any): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API POST ${path} failed: ${res.status}`);
  return res.json();
}

/**
 * Authenticated PUT request
 */
export async function apiPut<T = any>(path: string, body: any): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}${path}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API PUT ${path} failed: ${res.status}`);
  return res.json();
}
