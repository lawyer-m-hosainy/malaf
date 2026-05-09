/**
 * Encryption API Client — uses Supabase Auth tokens.
 * R8-FIX: Added client-side LRU cache to avoid redundant decryption API calls.
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

// ═══════════════════════════════════════════════════════
// R8-FIX: Client-side decryption cache (LRU, max 500 entries, TTL 5 min)
// ═══════════════════════════════════════════════════════
const CACHE_MAX_SIZE = 500;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  value: string;
  timestamp: number;
}

const decryptCache = new Map<string, CacheEntry>();

function getCached(key: string): string | null {
  const entry = decryptCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    decryptCache.delete(key);
    return null;
  }
  return entry.value;
}

function setCache(key: string, value: string): void {
  // LRU eviction: remove oldest if at capacity
  if (decryptCache.size >= CACHE_MAX_SIZE) {
    const oldestKey = decryptCache.keys().next().value;
    if (oldestKey) decryptCache.delete(oldestKey);
  }
  decryptCache.set(key, { value, timestamp: Date.now() });
}

/** Clear decryption cache (call on logout) */
export function clearDecryptCache(): void {
  decryptCache.clear();
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
  
  // R8-FIX: Check cache first
  const cached = getCached(encryptedValue);
  if (cached !== null) return cached;
  
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/crypto/decrypt`, {
      method: "POST",
      headers,
      body: JSON.stringify({ text: encryptedValue }),
    });
    if (!response.ok) throw new Error("Decryption failed");
    const data = await response.json();
    const result = data.result || encryptedValue;
    
    // Cache the result
    setCache(encryptedValue, result);
    return result;
  } catch (error) {
    console.error("Decryption failed:", error);
    return encryptedValue; 
  }
}

export async function batchDecryptFields(encryptedValues: (string | undefined | null)[]): Promise<string[]> {
  if (!encryptedValues || encryptedValues.length === 0) return [];
  const validValues = encryptedValues.map(v => v || "");
  
  // R8-FIX: Split into cached and uncached values
  const results: string[] = new Array(validValues.length);
  const uncachedIndices: number[] = [];
  const uncachedValues: string[] = [];
  
  for (let i = 0; i < validValues.length; i++) {
    const cached = getCached(validValues[i]);
    if (cached !== null) {
      results[i] = cached;
    } else {
      uncachedIndices.push(i);
      uncachedValues.push(validValues[i]);
    }
  }
  
  // If everything was cached, return immediately (no API call!)
  if (uncachedValues.length === 0) return results;
  
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/crypto/batch-decrypt`, {
      method: "POST",
      headers,
      body: JSON.stringify({ texts: uncachedValues }),
    });
    if (!response.ok) throw new Error("Batch decryption failed");
    const data = await response.json();
    const decryptedResults = data.results || uncachedValues;
    
    // Populate results and cache
    for (let i = 0; i < uncachedIndices.length; i++) {
      const idx = uncachedIndices[i];
      results[idx] = decryptedResults[i];
      setCache(uncachedValues[i], decryptedResults[i]);
    }
    
    return results;
  } catch (error) {
    console.error("Batch decryption failed:", error);
    // Fill uncached slots with original values
    for (const idx of uncachedIndices) {
      results[idx] = validValues[idx];
    }
    return results;
  }
}
