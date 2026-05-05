import CryptoJS from "crypto-js";

const ENV_KEY = 
  (typeof process !== "undefined" && process.env?.VITE_ENCRYPTION_KEY) || 
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_ENCRYPTION_KEY) || 
  "";

const SECRET_KEY = ENV_KEY || (() => {
  console.warn("[SECURITY] VITE_ENCRYPTION_KEY غير معيّن — يُستخدم مفتاح مؤقت للتطوير فقط. لا تنشر بدون تعيين المفتاح.");
  return "dev-only-" + window.location.hostname + "-unsafe";
})();

export function encryptField(value: string | undefined | null): string {
  if (!value) return "";
  try {
    return CryptoJS.AES.encrypt(value, SECRET_KEY).toString();
  } catch (error) {
    console.error("Encryption failed:", error);
    return "";
  }
}

export function decryptField(encryptedValue: string | undefined | null): string {
  if (!encryptedValue) return "";
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedValue, SECRET_KEY);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText || encryptedValue; 
  } catch (error) {
    console.error("Decryption failed:", error);
    return encryptedValue; 
  }
}
