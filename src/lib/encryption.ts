/**
 * خدمات التشفير المباشرة (بدون Edge Functions!)
 * يستخدم Web Crypto API متوفرًا في المتصفح
 */

const RAW_KEY = "malaf-default-fallback-key-2024-prod";
const SALT = "malaf-salt-v1";
const ITERATIONS = 100000;

/** تحويل مفتاح نصي إلى مفتاح AES */
async function deriveKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(RAW_KEY),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode(SALT),
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

let _cachedKey: CryptoKey | null = null;

export async function encrypt(data: string): Promise<string> {
  try {
    if (!data) return data;
    if (!_cachedKey) _cachedKey = await deriveKey();
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      _cachedKey,
      enc.encode(data)
    );
    
    const combined = new Uint8Array(iv.length + new Uint8Array(ciphertext).length);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);
    return btoa(String.fromCharCode(...combined));
  } catch (e) {
    console.warn("Encryption failed, storing raw data:", e);
    return data; // Fallback to raw data if encryption fails
  }
}

export async function decrypt(data: string): Promise<string> {
  try {
    if (!data) return data;
    if (!_cachedKey) _cachedKey = await deriveKey();
    
    const combined = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      _cachedKey,
      ciphertext
    );
    return new TextDecoder().decode(decrypted);
  } catch (e) {
    console.warn("Decryption failed, returning raw data:", e);
    return data; // Fallback to raw data if decryption fails
  }
}

export async function batchDecrypt(dataArray: (string | null | undefined)[]): Promise<string[]> {
  return Promise.all(
    dataArray.map(item => item ? decrypt(item) : "")
  );
}
