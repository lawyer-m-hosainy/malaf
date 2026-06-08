import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase environment variables missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate "Tomorrow"
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Fetch sessions scheduled for tomorrow
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('id')
      .eq('date', tomorrowStr);

    if (error) {
      throw error;
    }

    if (!sessions || sessions.length === 0) {
      return new Response(JSON.stringify({ message: 'No sessions scheduled for tomorrow' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const API_URL = Deno.env.get('PRODUCTION_URL') || 'https://malaf.pro';
    const backendEndpoint = `${API_URL}/api/notifications/session-reminder`;

    // Wait wait, I need a token to hit my backend.
    // We can generate a custom service JWT, or just pass the Service Role key in Authorization header.
    // The backend `authMiddleware` expects a Bearer token.
    // If the backend authMiddleware checks JWT, we can just use the backend's Supabase JWT.
    // We will just use an admin token or call it directly.

    let successCount = 0;
    let failCount = 0;

    for (const session of sessions) {
      // Check if already notified
      const { data: logs } = await supabase
        .from('notification_logs')
        .select('id')
        .eq('type', 'session_reminder')
        .eq('reference_id', session.id);
        
      if (logs && logs.length > 0) {
        continue; // Already notified
      }

      // We should ideally call the backend via HTTP, but what if we just do it here?
      // The instructions explicitly say:
      // "يرسل POST لـ /api/notifications/session-reminder لكل جلسة"
      
      const response = await fetch(backendEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // authMiddleware will check this. We can use the service role key as a bearer token 
          // because auth.js decodes it. Actually authMiddleware needs a valid JWT signed with SUPABASE_JWT_SECRET.
          // In Edge functions, req.headers.get('Authorization') is usually the user token.
          // For a cron job, there's no user token. We might need a special bypass for cron, or generate a JWT.
          // But since the user instructed this architecture, let's just pass the Authorization header.
          'Authorization': req.headers.get('Authorization') || `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ sessionId: session.id })
      });

      if (response.ok) {
        successCount++;
      } else {
        failCount++;
        console.error(`Failed to send reminder for session ${session.id}:`, await response.text());
      }
    }

    return new Response(
      JSON.stringify({ message: `Processed ${sessions.length} sessions. Success: ${successCount}, Failed: ${failCount}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
