// ═══════════════════════════════════════════════════════
// جدولة إشعارات الواتساب — مَلَف (Malaf)
// ═══════════════════════════════════════════════════════
// يستخدم setInterval بدلاً من node-cron لتجنب تبعية إضافية
// يفحص كل دقيقة الرسائل المجدولة والجلسات القادمة
// ═══════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';
import { formatMessage } from './messageFormatter.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
let sendMessageFn = null; // يتم تعيينها من الخارج

// ── تهيئة المجدول ──
export function initScheduler(sendFn) {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('WhatsApp Scheduler: Supabase not configured, skipping');
    return;
  }
  supabase = createClient(supabaseUrl, supabaseServiceKey);
  sendMessageFn = sendFn;

  // فحص كل دقيقة
  setInterval(processPendingScheduled, 60_000);

  // فحص تذكيرات الجلسات كل 15 دقيقة
  setInterval(checkSessionReminders, 15 * 60_000);

  // فحص الفواتير المستحقة كل ساعة
  setInterval(checkOverdueInvoices, 60 * 60_000);

  console.log('✅ WhatsApp Notification Scheduler initialized');
}


// ═══════════════════════════════════════════════════════
// 1. معالجة الرسائل المجدولة (التذكيرات الشخصية)
// ═══════════════════════════════════════════════════════

async function processPendingScheduled() {
  if (!supabase) return;
  try {
    const now = new Date().toISOString();
    const { data: pending } = await supabase
      .from('whatsapp_scheduled')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', now)
      .limit(20);

    if (!pending?.length) return;

    for (const item of pending) {
      if (!item.target_phone || !sendMessageFn) {
        await supabase.from('whatsapp_scheduled')
          .update({ status: 'failed' })
          .eq('id', item.id);
        continue;
      }

      const sent = await sendMessageFn(item.target_phone, item.message_template, item.org_id);
      await supabase.from('whatsapp_scheduled')
        .update({ status: sent ? 'sent' : 'failed', sent_at: sent ? now : null })
        .eq('id', item.id);
    }
  } catch (err) {
    console.error('Scheduled messages processing error:', err.message);
  }
}


// ═══════════════════════════════════════════════════════
// 2. تذكيرات الجلسات (24 ساعة و 3 ساعات)
// ═══════════════════════════════════════════════════════

async function checkSessionReminders() {
  if (!supabase || !sendMessageFn) return;
  try {
    // جلب كل المكاتب المفعّلة
    const { data: offices } = await supabase
      .from('whatsapp_settings')
      .select('org_id, wa_phone_number, notifications')
      .eq('is_active', true);

    if (!offices?.length) return;

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const threeHoursLater = new Date(now.getTime() + 3 * 60 * 60 * 1000);

    for (const office of offices) {
      const notifs = office.notifications || {};

      // تذكير 24 ساعة
      if (notifs.session_reminder_24h) {
        const tomorrowDate = tomorrow.toISOString().split('T')[0];
        const { data: sessions } = await supabase
          .from('sessions')
          .select('id, date, time, case_id, cases!inner(case_number, court, client_id, org_id)')
          .eq('cases.org_id', office.org_id)
          .eq('date', tomorrowDate)
          .limit(50);

        if (sessions?.length) {
          for (const session of sessions) {
            await sendSessionReminder(office, session, 'sessionReminder24h');
          }
        }
      }

      // تذكير 3 ساعات
      if (notifs.session_reminder_3h) {
        const todayDate = now.toISOString().split('T')[0];
        const { data: sessions } = await supabase
          .from('sessions')
          .select('id, date, time, case_id, cases!inner(case_number, court, client_id, org_id)')
          .eq('cases.org_id', office.org_id)
          .eq('date', todayDate)
          .limit(50);

        if (sessions?.length) {
          for (const session of sessions) {
            if (session.time) {
              const sessionHour = parseInt(session.time.split(':')[0]);
              const currentHour = now.getHours();
              // أرسل إذا الجلسة بعد ~3 ساعات
              if (sessionHour - currentHour >= 2 && sessionHour - currentHour <= 4) {
                await sendSessionReminder(office, session, 'sessionReminder3h');
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('Session reminders error:', err.message);
  }
}

async function sendSessionReminder(office, session, templateName) {
  try {
    const clientId = session.cases?.client_id;
    if (!clientId) return;

    // البحث عن رقم الموكل
    const { data: contact } = await supabase
      .from('whatsapp_contacts')
      .select('phone_number, display_name')
      .eq('org_id', office.org_id)
      .eq('linked_id', clientId)
      .eq('contact_type', 'client')
      .single();

    if (!contact?.phone_number) return;

    const msg = formatMessage(templateName, {
      caseNumber: session.cases?.case_number,
      court: session.cases?.court,
      date: session.date,
      time: session.time,
      clientName: contact.display_name || 'العميل',
    });

    await sendMessageFn(contact.phone_number, msg, office.org_id);
  } catch { /* non-blocking */ }
}


// ═══════════════════════════════════════════════════════
// 3. فواتير مستحقة
// ═══════════════════════════════════════════════════════

async function checkOverdueInvoices() {
  if (!supabase || !sendMessageFn) return;
  try {
    const { data: offices } = await supabase
      .from('whatsapp_settings')
      .select('org_id, notifications')
      .eq('is_active', true);

    if (!offices?.length) return;

    const today = new Date().toISOString().split('T')[0];

    for (const office of offices) {
      if (!office.notifications?.invoice_due) continue;

      const { data: invoices } = await supabase
        .from('invoices')
        .select('id, client_id, amount, due_date')
        .eq('org_id', office.org_id)
        .eq('status', 'unpaid')
        .lte('due_date', today)
        .is('deleted_at', null)
        .limit(20);

      if (!invoices?.length) continue;

      for (const inv of invoices) {
        const { data: contact } = await supabase
          .from('whatsapp_contacts')
          .select('phone_number, display_name')
          .eq('org_id', office.org_id)
          .eq('linked_id', inv.client_id)
          .eq('contact_type', 'client')
          .single();

        if (!contact?.phone_number) continue;

        const msg = formatMessage('invoiceDue', {
          clientName: contact.display_name || 'العميل',
          amount: inv.amount,
          dueDate: new Date(inv.due_date).toLocaleDateString('ar-EG'),
        });

        await sendMessageFn(contact.phone_number, msg, office.org_id);
      }
    }
  } catch (err) {
    console.error('Invoice due check error:', err.message);
  }
}
