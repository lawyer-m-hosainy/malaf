import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── مفتاح التشفير من الأسرار ──────────────────────────────────
const RAW_KEY = Deno.env.get("ENCRYPTION_KEY") || "malaf-default-fallback-key-2024-prod";
const SALT = "malaf-salt-v1";
const ITERATIONS = 100000;

/** Derive a 256-bit AES key from a passphrase */
async function deriveKey(passphrase: string): Promise<CryptoKey> {
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
}

let _cachedKey: CryptoKey | null = null;
async function getKey(): Promise<CryptoKey> {
  if (!_cachedKey) _cachedKey = await deriveKey(RAW_KEY);
  return _cachedKey;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. التحقق من التوكيل (JWT)
    const authHeader = req.headers.get("Authorization")!;
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "غير مصرح لك بالوصول" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. معالجة الطلب
    const { action, data, batch } = await req.json();

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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } 
    
    else if (action === "decrypt") {
      if (!data && !batch) throw new Error("بيانات فك التشفير مفقودة");
      const key = await getKey();

      const decrypt = async (encryptedValue: string) => {
        try {
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
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        const result = await decrypt(data);
        return new Response(JSON.stringify({ result }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ error: "إجراء غير صالح" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error?.message || "خطأ غير متوقع" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
