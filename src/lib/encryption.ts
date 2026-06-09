import { supabase } from './supabase';

/**
 * خدمات التشفير باستخدام Supabase Edge Functions
 * لضمان الأمان وعدم كشف المفاتيح في المتصفح
 */

export async function encryptViaEdge(data: string): Promise<string> {
  try {
    if (!data) return data;
    
    const { data: resultData, error } = await supabase.functions.invoke('encrypt-data', {
      body: { data, operation: 'encrypt' }
    });

    if (error) {
      throw error;
    }

    if (resultData?.error) {
      throw new Error(resultData.error);
    }

    return resultData.result;
  } catch (e) {
    console.error("[Malaf Security] Edge Encryption failed:", e);
    throw new Error("فشل التشفير عبر الخادم. يرجى المحاولة لاحقاً.");
  }
}

export async function decryptViaEdge(data: string, iv?: string, tag?: string): Promise<string> {
  try {
    if (!data) return data;
    
    const cacheKey = `${data}:${iv || ''}:${tag || ''}`;
    if (decryptCache.has(cacheKey)) {
      return decryptCache.get(cacheKey)!.value;
    }
    
    const { data: resultData, error } = await supabase.functions.invoke('encrypt-data', {
      body: { data, operation: 'decrypt', iv, tag }
    });

    if (error) {
      throw error;
    }

    if (resultData?.error) {
      throw new Error(resultData.error);
    }

    const result = resultData.result;
    
    // Cache the decrypted result with TTL
    const timeoutId = setTimeout(() => {
      decryptCache.delete(cacheKey);
    }, CACHE_TTL_MS);
    decryptCache.set(cacheKey, { value: result, timeout: timeoutId });

    return result;
  } catch (e) {
    console.error("[Malaf Security] Edge Decryption failed:", e);
    // Return original string if decryption fails (fallback for old unencrypted data)
    return data; 
  }
}

// ============================================================
// Aliases + Cache Management — مطلوبة من أجزاء متعددة في الكود
// ============================================================

export const encrypt = encryptViaEdge;
export const decrypt = decryptViaEdge;
export const encryptField = encryptViaEdge;
export const decryptField = decryptViaEdge;

export async function batchDecrypt(dataArray: (string | null | undefined)[]): Promise<string[]> {
  return Promise.all(
    dataArray.map(item => item ? decryptViaEdge(item) : "")
  );
}

const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes
const decryptCache = new Map<string, { value: string, timeout: ReturnType<typeof setTimeout> }>();

export function clearDecryptCache(): void {
  decryptCache.forEach((entry) => clearTimeout(entry.timeout));
  decryptCache.clear();
}
