/**
 * Backend-proxied AES-256 Encryption via Supabase Edge Functions.
 * This ensures that the ENCRYPTION_KEY is never exposed to the client bundle.
 */
import { supabase } from "./supabase";

// ═══════════════════════════════════════════════════════
// Client-side decryption cache (LRU, max 500 entries, TTL 5 min)
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

// ─── Public API (Edge Function Proxy) ──────────────────────────

/** Encrypt a field using Edge Function */
export async function encryptField(value: string | undefined | null): Promise<string> {
  if (!value) return "";
  try {
    const { data, error } = await supabase.functions.invoke("encrypt-decrypt", {
      body: { action: "encrypt", data: value },
    });

    if (error) throw error;
    return data.result || "";
  } catch (error) {
    console.error("Encryption failed:", error);
    return "";
  }
}

/** Decrypt a field using Edge Function with local caching */
export async function decryptField(encryptedValue: string | undefined | null): Promise<string> {
  if (!encryptedValue) return "";
  
  const cached = getCached(encryptedValue);
  if (cached !== null) return cached;
  
  try {
    const { data, error } = await supabase.functions.invoke("encrypt-decrypt", {
      body: { action: "decrypt", data: encryptedValue },
    });

    if (error) throw error;
    const result = data.result || encryptedValue;
    setCache(encryptedValue, result);
    return result;
  } catch (error) {
    console.warn("Decryption failed (returning as-is):", error);
    return encryptedValue;
  }
}

/** Batch decrypt fields using Edge Function for efficiency */
export async function batchDecryptFields(encryptedValues: (string | undefined | null)[]): Promise<string[]> {
  if (!encryptedValues || encryptedValues.length === 0) return [];
  
  // Filter out values already in cache
  const uncachedValues = encryptedValues.filter(v => v && !getCached(v)) as string[];
  
  try {
    let decryptedMap = new Map<string, string>();

    if (uncachedValues.length > 0) {
      const { data, error } = await supabase.functions.invoke("encrypt-decrypt", {
        body: { action: "decrypt", batch: uncachedValues },
      });

      if (error) throw error;

      if (data.results && Array.isArray(data.results)) {
        data.results.forEach((res: string, idx: number) => {
          decryptedMap.set(uncachedValues[idx], res);
          setCache(uncachedValues[idx], res);
        });
      }
    }

    return encryptedValues.map(v => {
      if (!v) return "";
      return getCached(v) || decryptedMap.get(v) || v;
    });
  } catch (error) {
    console.error("Batch decryption failed:", error);
    return encryptedValues.map(v => v || "");
  }
}
