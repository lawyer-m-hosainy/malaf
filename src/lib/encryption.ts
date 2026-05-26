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

/** 
 * مسح ذاكرة التخزين المؤقت لفك التشفير (يُستدعى عند تسجيل الخروج).
 * 
 * لضمان عدم بقاء البيانات الحساسة مفكوكة التشفير في الذاكرة بعد انتهاء الجلسة.
 */
export function clearDecryptCache(): void {
  decryptCache.clear();
}

// ─── Public API (Edge Function Proxy) ──────────────────────────

/** 
 * تشفير حقل نصي باستخدام Supabase Edge Function (AES-256).
 * 
 * [أمني] يتم التشفير في السيرفر لضمان عدم تعرض مفتاح التشفير للعميل.
 * 
 * @param {string | undefined | null} value - النص المراد تشفيره
 * @returns {Promise<string>} النص المشفر (Ciphertext)
 * @throws {Error} عند فشل الاتصال بالدالة السحابية
 */
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

/** 
 * فك تشفير حقل نصي مع استخدام ذاكرة تخزين مؤقت (Cache) محلية لتحسين الأداء.
 * 
 * @param {string | undefined | null} encryptedValue - النص المشفر
 * @returns {Promise<string>} النص الأصلي مفكوك التشفير
 */
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

/** 
 * فك تشفير مجموعة من الحقول دفعة واحدة (Batch Operation) لتقليل عدد طلبات الشبكة.
 * 
 * @param {(string | undefined | null)[]} encryptedValues - مصفوفة النصوص المشفرة
 * @returns {Promise<string[]>} مصفوفة النصوص مفكوكة التشفير بنفس الترتيب
 */
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
