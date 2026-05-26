import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const dailyApiKey = Deno.env.get('DAILY_API_KEY');
    if (!dailyApiKey || dailyApiKey === 'your_daily_api_key_here') {
      console.error('DAILY_API_KEY is not set or still has placeholder value');
      return new Response(
        JSON.stringify({ 
          error: 'Daily.co API key not configured. Please add DAILY_API_KEY to Supabase secrets.',
          code: 'MISSING_API_KEY'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { roomName } = body;
    
    // Sanitize room name: only alphanumeric, hyphens, and underscores allowed
    const sanitizedName = (roomName || 'call')
      .toString()
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .substring(0, 30);

    // Ensure unique room name to avoid "already exists" errors
    const uniqueRoomName = `${sanitizedName}-${Math.random().toString(36).substring(7)}`;

    console.log(`Creating Daily.co room: ${uniqueRoomName}`);

    // Create a Daily.co room with 1-hour expiry
    const res = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${dailyApiKey}`,
      },
      body: JSON.stringify({
        name: uniqueRoomName,
        properties: {
          exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
          enable_chat: true,
          enable_screenshare: true,
          max_participants: 10,
          enable_recording: false,
          lang: "ar",
          // Add some UI customizations for better experience
          active_speaker_view: true,
          enable_network_stats: false,
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
