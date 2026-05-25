import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `أنت مستشار قانوني مصري متخصص وذو خبرة واسعة في القانون المصري. اسمك "مَلَف AI".

القواعد الأساسية:
1. أجب باللغة العربية الفصحى القانونية.
2. استند دائماً للقوانين المصرية الحقيقية (القانون المدني، قانون المرافعات، قانون العمل، قانون الأحوال الشخصية، إلخ).
3. اذكر أرقام المواد القانونية عند الإمكان.
4. قدم إجابات عملية وقابلة للتنفيذ.
5. لا تقدم نفسك كبديل عن المحامي الحقيقي — وضّح أن هذه استشارة أولية.
6. نسّق إجابتك بعناوين واضحة ونقاط مرقمة.
7. إذا لم تكن متأكداً من معلومة، قل ذلك صراحةً.
8. لا تختلق قوانين أو مواد غير موجودة.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration missing');
    }

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { action, userMessage, history, content } = body;

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      // Fallback: return structured response without Gemini
      return new Response(
        JSON.stringify({ text: '', isFallback: true, provider: 'none' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let prompt = '';
    let systemInstruction = SYSTEM_PROMPT;

    if (action === 'analyze') {
      systemInstruction += '\n\nالمهمة: حلل الوثيقة القانونية التالية بالتفصيل. حدد نقاط القوة والضعف والمخاطر القانونية والتوصيات.';
      prompt = `حلل الوثيقة القانونية التالية:\n\n${content}`;
    } else if (action === 'draft') {
      systemInstruction += '\n\nالمهمة: صِغ وثيقة قانونية احترافية بناءً على الوقائع المقدمة.';
      prompt = userMessage || content;
    } else {
      // legal-assistant (chat)
      prompt = userMessage;
    }

    // Build messages for Gemini
    const messages: any[] = [];
    
    // Add history if available
    if (history && Array.isArray(history)) {
      for (const msg of history.slice(-10)) { // Last 10 messages max
        messages.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        });
      }
    }
    
    // Add current message
    messages.push({
      role: 'user',
      parts: [{ text: prompt }]
    });

    // Call Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstruction }]
        },
        contents: messages,
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 4096,
          topP: 0.95,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        ],
      }),
    });

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text();
      console.error('Gemini API Error:', geminiResponse.status, errorBody);
      return new Response(
        JSON.stringify({ text: '', isFallback: true, provider: 'gemini-error', error: errorBody }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiData = await geminiResponse.json();
    const responseText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return new Response(
      JSON.stringify({ text: responseText, isFallback: false, provider: 'gemini' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Edge Function Error:', error);
    return new Response(
      JSON.stringify({ error: error.message, text: '', isFallback: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
