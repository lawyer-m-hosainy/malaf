/**
 * Encryption API Client — uses Supabase Auth tokens.
 */
import { supabase } from "./supabase";

const API_URL = (import.meta as any).env?.VITE_APP_URL || "http://localhost:3005";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }
  return headers;
}

export async function encryptField(value: string | undefined | null): Promise<string> {
  if (!value) return "";
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/crypto/encrypt`, {
      method: "POST",
      headers,
      body: JSON.stringify({ text: value }),
    });
    if (!response.ok) throw new Error("Encryption failed");
    const data = await response.json();
    return data.result || "";
  } catch (error) {
    console.error("Encryption failed:", error);
    return "";
  }
}

export async function decryptField(encryptedValue: string | undefined | null): Promise<string> {
  if (!encryptedValue) return "";
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/crypto/decrypt`, {
      method: "POST",
      headers,
      body: JSON.stringify({ text: encryptedValue }),
    });
    if (!response.ok) throw new Error("Decryption failed");
    const data = await response.json();
    return data.result || encryptedValue; 
  } catch (error) {
    console.error("Decryption failed:", error);
    return encryptedValue; 
  }
}

export async function batchDecryptFields(encryptedValues: (string | undefined | null)[]): Promise<string[]> {
  if (!encryptedValues || encryptedValues.length === 0) return [];
  const validValues = encryptedValues.map(v => v || "");
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/crypto/batch-decrypt`, {
      method: "POST",
      headers,
      body: JSON.stringify({ texts: validValues }),
    });
    if (!response.ok) throw new Error("Batch decryption failed");
    const data = await response.json();
    return data.results || validValues; 
  } catch (error) {
    console.error("Batch decryption failed:", error);
    return validValues; 
  }
}
