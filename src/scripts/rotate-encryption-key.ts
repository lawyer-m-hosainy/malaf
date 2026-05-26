/**
 * @file rotate-encryption-key.ts
 * @description Script to rotate ENCRYPTION_KEY for encrypted fields in the clients table without downtime.
 * @author مهندس الموثوقية والأمان (SRE)
 * @copyright (c) 2026. All rights reserved.
 */

import { webcrypto } from "crypto";
import { createClient } from "@supabase/supabase-js";

const cryptoInstance = (globalThis.crypto || webcrypto) as any;

const SALT = "malaf-salt-v1";
const ITERATIONS = 100000;

/** Derive CryptoKey from passphrase */
async function deriveKey(passphrase: string): Promise<any> {
  const enc = new TextEncoder();
  const keyMaterial = await cryptoInstance.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return cryptoInstance.subtle.deriveKey(
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

/** Decrypt using specific key */
async function decryptValue(encryptedValue: string, key: any): Promise<string> {
  if (!encryptedValue) return "";
  try {
    const combined = Uint8Array.from(atob(encryptedValue), (c) => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    const decrypted = await cryptoInstance.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );
    return new TextDecoder().decode(decrypted);
  } catch (error: any) {
    console.error("Decryption failed:", error.message);
    throw error;
  }
}

/** Encrypt using specific key */
async function encryptValue(plainText: string, key: any): Promise<string> {
  if (!plainText) return "";
  const iv = cryptoInstance.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const ciphertext = await cryptoInstance.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(plainText)
  );
  const combined = new Uint8Array(iv.length + new Uint8Array(ciphertext).length);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode(...combined));
}

/** Main execution function */
async function runRotation() {
  console.log("🔑 بدء تدوير مفتاح تشفير البيانات...");

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const oldKeyPass = process.env.OLD_ENCRYPTION_KEY;
  const newKeyPass = process.env.NEW_ENCRYPTION_KEY;

  if (!supabaseUrl || !serviceRoleKey || !oldKeyPass || !newKeyPass) {
    console.error(
      "❌ خطأ: المتغيرات البيئية التالية مطلوبة للتشغيل:\n" +
      "- SUPABASE_URL\n" +
      "- SUPABASE_SERVICE_ROLE_KEY\n" +
      "- OLD_ENCRYPTION_KEY\n" +
      "- NEW_ENCRYPTION_KEY"
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // تهيئة المفاتيح
  const oldKey = await deriveKey(oldKeyPass);
  const newKey = await deriveKey(newKeyPass);

  // جلب كافة العملاء الذين لديهم بيانات مشفرة
  console.log("📥 جلب سجلات العملاء من قاعدة البيانات...");
  const { data: clients, error } = await supabase
    .from("clients")
    .select("id, national_id_encrypted, commercial_registration_encrypted");

  if (error) {
    console.error("❌ فشل جلب سجلات العملاء:", error.message);
    process.exit(1);
  }

  if (!clients || clients.length === 0) {
    console.log("✅ لا توجد سجلات للعملاء مشفرة حالياً.");
    process.exit(0);
  }

  console.log(`🔍 تم العثور على ${clients.length} سجل. بدء تدوير البيانات...`);

  let updatedCount = 0;
  const batchSize = 50;

  for (let i = 0; i < clients.length; i += batchSize) {
    const batch = clients.slice(i, i + batchSize);
    const updates = [];

    for (const client of batch) {
      try {
        let updatedNationalId = client.national_id_encrypted;
        let updatedCommReg = client.commercial_registration_encrypted;

        // فك تشفير وإعادة تشفير الرقم القومي إن وجد
        if (client.national_id_encrypted) {
          const decrypted = await decryptValue(client.national_id_encrypted, oldKey);
          updatedNationalId = await encryptValue(decrypted, newKey);
        }

        // فك تشفير وإعادة تشفير السجل التجاري إن وجد
        if (client.commercial_registration_encrypted) {
          const decrypted = await decryptValue(client.commercial_registration_encrypted, oldKey);
          updatedCommReg = await encryptValue(decrypted, newKey);
        }

        updates.push({
          id: client.id,
          national_id_encrypted: updatedNationalId,
          commercial_registration_encrypted: updatedCommReg,
        });
      } catch (err: any) {
        console.error(`❌ فشل معالجة العميل ذو المعرف ${client.id}:`, err.message);
      }
    }

    if (updates.length > 0) {
      const { error: upsertError } = await supabase
        .from("clients")
        .upsert(updates);

      if (upsertError) {
        console.error("❌ فشل تحديث الدفعة في قاعدة البيانات:", upsertError.message);
      } else {
        updatedCount += updates.length;
        console.log(`✅ تم تحديث وإعادة تشفير ${updatedCount}/${clients.length} سجل`);
      }
    }
  }

  console.log("🎉 اكتمل تدوير مفتاح التشفير بنجاح!");
}

// تشغيل التدوير
if (process.env.NODE_ENV !== "test") {
  runRotation().catch((err) => {
    console.error("❌ خطأ غير متوقع أثناء تدوير المفاتيح:", err);
    process.exit(1);
  });
}

export { deriveKey, decryptValue, encryptValue };
