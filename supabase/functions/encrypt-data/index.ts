import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SALT = "malaf-salt-v1";
const ITERATIONS = 100000;

async function deriveKey(rawKey: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(rawKey),
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

// Helper for large arrays since String.fromCharCode(...arr) can throw for >65k elements
function arrayBufferToBase64(buffer: Uint8Array): string {
  let binary = '';
  const len = buffer.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data, operation, iv, tag } = await req.json();

    if (!data) {
      return new Response(JSON.stringify({ error: 'Data is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Check size limit: max 1MB
    if (data.length > 1024 * 1024 * 2) { // 2MB base64 encoded approx 1MB raw
      return new Response(JSON.stringify({ error: 'Data exceeds size limits' }), {
        status: 413,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const rawKey = Deno.env.get('ENCRYPTION_KEY');
    if (!rawKey) {
      throw new Error('Server configuration error: ENCRYPTION_KEY missing');
    }

    const key = await deriveKey(rawKey);

    if (operation === 'encrypt') {
      const ivBytes = crypto.getRandomValues(new Uint8Array(12));
      const enc = new TextEncoder();
      const ciphertext = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: ivBytes },
        key,
        enc.encode(data)
      );
      
      const combined = new Uint8Array(ivBytes.length + ciphertext.byteLength);
      combined.set(ivBytes);
      combined.set(new Uint8Array(ciphertext), ivBytes.length);
      const result = arrayBufferToBase64(combined);
      
      return new Response(JSON.stringify({ result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else if (operation === 'decrypt') {
      // Decode base64 using atob safely
      const binaryStr = atob(data);
      const combined = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        combined[i] = binaryStr.charCodeAt(i);
      }
      
      const ivBytes = combined.slice(0, 12);
      const ciphertext = combined.slice(12);
      
      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: ivBytes },
        key,
        ciphertext
      );
      const result = new TextDecoder().decode(decrypted);
      
      return new Response(JSON.stringify({ result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ error: 'Invalid operation' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
