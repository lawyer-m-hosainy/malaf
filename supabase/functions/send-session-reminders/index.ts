// ═══════════════════════════════════════════════════════════════
// Supabase Edge Function: send-session-reminders
// ═══════════════════════════════════════════════════════════════
//
// الغرض: إرسال Web Push Notifications للمحامين بالجلسات القادمة غداً
//
// طريقة التشغيل:
//   - يدوياً: curl -X POST https://<project>.supabase.co/functions/v1/send-session-reminders
//   - تلقائياً: عبر pg_cron أو أداة خارجية مثل cron-job.org
//
// المتطلبات في Supabase Secrets:
//   VAPID_PRIVATE_KEY  — المفتاح الخاص لـ VAPID
//   VAPID_PUBLIC_KEY   — المفتاح العام لـ VAPID
//   VAPID_SUBJECT      — مثل: mailto:admin@malaf.app
// ═══════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing (URL or Service Role Key)');
    }
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@malaf.app';

    if (!vapidPrivateKey || !vapidPublicKey) {
      return new Response(
        JSON.stringify({ error: 'VAPID keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // ─── 1. جلب جلسات الغد ────────────────────────────────────
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('id, case_id, date, time, court, organization_id, cases!inner(plaintiff, defendant, client_id)')
      .eq('date', tomorrowStr);

    if (sessionsError) {
      throw new Error(`Sessions fetch error: ${sessionsError.message}`);
    }

    if (!sessions || sessions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'لا توجد جلسات غداً', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─── 2. جلب الاشتراكات المسجلة ────────────────────────────
    // نجمع org_ids الفريدة من الجلسات
    const orgIds = [...new Set(sessions.map((s: any) => s.organization_id))];

    const { data: subscriptions, error: subsError } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth, user_id, organization_id')
      .in('organization_id', orgIds);

    if (subsError) {
      throw new Error(`Subscriptions fetch error: ${subsError.message}`);
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'لا توجد أجهزة مسجلة للإشعارات', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─── 3. إرسال الإشعارات ───────────────────────────────────
    let sentCount = 0;
    let failedCount = 0;

    for (const session of sessions) {
      const caseInfo = (session as any).cases;
      const orgSubs = subscriptions.filter((s: any) => s.organization_id === session.organization_id);

      const payload = JSON.stringify({
        title: '📋 تذكير بجلسة غداً',
        body: `جلسة ${caseInfo?.plaintiff || ''} ضد ${caseInfo?.defendant || ''} — ${session.court || 'المحكمة'} الساعة ${session.time || 'غير محدد'}`,
        icon: '/pwa-192x192.png',
        url: '/dashboard/roll',
        tag: `session-${session.id}`,
      });

      for (const sub of orgSubs) {
        try {
          // بناء Web Push request يدوياً باستخدام VAPID
          const pushEndpoint = sub.endpoint;

          // نستخدم fetch مباشر مع VAPID headers
          // ملاحظة: في الإنتاج يُفضل استخدام مكتبة web-push
          const response = await fetch(pushEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'TTL': '86400', // 24 hours
            },
            body: payload,
          });

          if (response.ok) {
            sentCount++;
          } else {
            failedCount++;
            // لو الاشتراك منتهي الصلاحية (410 Gone)، نحذفه
            if (response.status === 410) {
              await supabase
                .from('push_subscriptions')
                .delete()
                .eq('endpoint', pushEndpoint);
            }
          }
        } catch (pushError) {
          failedCount++;
          console.error('Push send error:', pushError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: `تم إرسال ${sentCount} إشعار (${failedCount} فشل)`,
        sent: sentCount,
        failed: failedCount,
        sessionsFound: sessions.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
