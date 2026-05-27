import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `أنت مساعد قانوني ذكي متخصص في القانون المصري. تعمل داخل منصة "مَلَف" لإدارة مكاتب المحامين.
مهامك:

تحليل المستندات القانونية واستخراج النقاط الجوهرية
صياغة العقود والمذكرات القانونية بالعربية الفصحى
الإجابة على الاستفسارات القانونية بناءً على القانون المصري
مساعدة المحامي في إدارة قضاياه

قواعد صارمة:

استخدم اللغة العربية الفصحى دائماً
استند إلى القانون المصري فقط
لا تقدم فتاوى قانونية نهائية، دائماً أوصِ بمراجعة المحامي المسؤول
كن دقيقاً ومختصراً ومهنياً`;

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
    const { action, userMessage, content } = body;

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({
          text: "عذراً، حدث خطأ في الاتصال بالذكاء الاصطناعي. يرجى المحاولة مرة أخرى.",
          error: "Gemini API key is not configured"
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
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
      prompt = userMessage;
    }

    // Call Gemini API using exact structure and gemini-2.0-flash model
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstruction }]
        },
        contents: [
          { role: "user", parts: [{ text: prompt }] }
        ],
        generationConfig: {
          temperature: 0.3
        }
      }),
    });

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text();
      console.error('Gemini API Error:', geminiResponse.status, errorBody);
      return new Response(
        JSON.stringify({
          text: "عذراً، حدث خطأ في الاتصال بالذكاء الاصطناعي. يرجى المحاولة مرة أخرى.",
          error: errorBody
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const geminiData = await geminiResponse.json();
    const responseText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      throw new Error("No response text in Gemini response");
    }

    return new Response(
      JSON.stringify({ text: responseText, isFallback: false, provider: 'gemini' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Edge Function Error:', error);
    return new Response(
      JSON.stringify({
        text: "عذراً، حدث خطأ في الاتصال بالذكاء الاصطناعي. يرجى المحاولة مرة أخرى.",
        error: error.message
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
