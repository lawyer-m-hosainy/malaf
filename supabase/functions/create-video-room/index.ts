import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const dailyApiKey = Deno.env.get('DAILY_API_KEY');
    if (!dailyApiKey) {
      return new Response(
        JSON.stringify({ error: 'Daily.co API key not configured. Please add DAILY_API_KEY to Supabase secrets.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const { roomName } = await req.json();

    // Create a Daily.co room with 1-hour expiry
    const res = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${dailyApiKey}`,
      },
      body: JSON.stringify({
        name: roomName || `malaf-${Date.now()}`,
        properties: {
          exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
          enable_chat: true,
          enable_screenshare: true,
          max_participants: 10,
          enable_recording: false,
          lang: "ar",
        },
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error('Daily.co API Error:', errorData);
      return new Response(
        JSON.stringify({ error: `Daily.co Error: ${errorData.info || errorData.error || 'Unknown error'}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const room = await res.json();

    return new Response(
      JSON.stringify({ 
        url: room.url, 
        name: room.name,
        expiresAt: room.config?.exp 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Edge Function Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
