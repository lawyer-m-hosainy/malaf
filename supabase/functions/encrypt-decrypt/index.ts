import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── مفتاح التشفير من الأسرار ──────────────────────────────────
const RAW_KEY = Deno.env.get("ENCRYPTION_KEY") || "malaf-default-fallback-key-2024-prod";
const SALT = "malaf-salt-v1";
const ITERATIONS = 100000;

/** Derive a 256-bit AES key from a passphrase */
async function deriveKey(passphrase: string): Promise<CryptoKey> {
  try {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      enc.encode(passphrase),
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
  } catch (e) {
    console.error("Key derivation error:", e);
    throw e;
  }
}

let _cachedKey: CryptoKey | null = null;
async function getKey(): Promise<CryptoKey> {
  if (!_cachedKey) _cachedKey = await deriveKey(RAW_KEY);
  return _cachedKey;
}

Deno.serve(async (req) => {
  console.log(`Incoming request: ${req.method}`);
  
  // Handle CORS OPTIONS preflight
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // 1. التحقق من التوكيل (JWT) - اختبارنا إذا أمكن
    let authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      authHeader = req.headers.get("apikey"); // محاولة احتياطية
    }

    // 2. معالجة الطلب
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, data, batch } = body;
    console.log(`Action requested: ${action}`);

    if (action === "encrypt") {
      if (!data) throw new Error("بيانات التشفير مفقودة");
      const key = await getKey();
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const enc = new TextEncoder();
      const ciphertext = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        enc.encode(data)
      );
      const combined = new Uint8Array(iv.length + new Uint8Array(ciphertext).length);
      combined.set(iv);
      combined.set(new Uint8Array(ciphertext), iv.length);
      const result = btoa(String.fromCharCode(...combined));
      return new Response(JSON.stringify({ result }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } 
    
    else if (action === "decrypt") {
      if (!data && !batch) throw new Error("بيانات فك التشفير مفقودة");
      const key = await getKey();

      const decrypt = async (encryptedValue: string) => {
        try {
          if (!encryptedValue) return "";
          const combined = Uint8Array.from(atob(encryptedValue), (c) => c.charCodeAt(0));
          const iv = combined.slice(0, 12);
          const ciphertext = combined.slice(12);
          const decrypted = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            key,
            ciphertext
          );
          return new TextDecoder().decode(decrypted);
        } catch {
          return encryptedValue; // Return as-is if decryption fails
        }
      };

      if (batch && Array.isArray(batch)) {
        const results = await Promise.all(batch.map((v) => v ? decrypt(v) : ""));
        return new Response(JSON.stringify({ results }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        const result = await decrypt(data);
        return new Response(JSON.stringify({ result }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ error: "إجراء غير صالح" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ 
      error: error?.message || "خطأ غير متوقع",
      stack: error?.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
