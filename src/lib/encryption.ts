/**
 * Client-side AES-256 Encryption using Web Crypto API.
 * No server needed — works directly in the browser.
 * R8-FIX: Added client-side LRU cache to avoid redundant decryption calls.
 */

// ─── مفتاح التشفير ───────────────────────────────────────────────
// في Production: يُقرأ من env variable
// في Development: يُقرأ من .env.local
const RAW_KEY = (import.meta as any).env?.VITE_ENCRYPTION_KEY || "malaf-default-enc-key-2024-prod";

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

// ─── Web Crypto helpers ──────────────────────────────────────────

/** Derive a 256-bit AES key from a passphrase */
async function deriveKey(passphrase: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw", enc.encode(passphrase), "PBKDF2", false, ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: enc.encode("malaf-salt-v1"), iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

let _cachedKey: CryptoKey | null = null;
async function getKey(): Promise<CryptoKey> {
  if (!_cachedKey) _cachedKey = await deriveKey(RAW_KEY);
  return _cachedKey;
}

// ─── Public API ──────────────────────────────────────────────────

export async function encryptField(value: string | undefined | null): Promise<string> {
  if (!value) return "";
  try {
    const key = await getKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv }, key, enc.encode(value)
    );
    // Combine IV + ciphertext and encode as base64
    const combined = new Uint8Array(iv.length + new Uint8Array(ciphertext).length);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);
    return btoa(String.fromCharCode(...combined));
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
    const key = await getKey();
    const combined = Uint8Array.from(atob(encryptedValue), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv }, key, ciphertext
    );
    const result = new TextDecoder().decode(decrypted);
    setCache(encryptedValue, result);
    return result;
  } catch (error) {
    // If decryption fails, it might be plain text or old format — return as-is
    console.warn("Decryption failed (might be unencrypted):", encryptedValue.substring(0, 20) + "...");
    return encryptedValue;
  }
}

export async function batchDecryptFields(encryptedValues: (string | undefined | null)[]): Promise<string[]> {
  if (!encryptedValues || encryptedValues.length === 0) return [];
  
  const results: string[] = [];
  for (const val of encryptedValues) {
    results.push(await decryptField(val));
  }
  return results;
}
