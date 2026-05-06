// ═══════════════════════════════════════════════════════
// WhatsApp Bot Routes — مَلَف (Malaf)
// ═══════════════════════════════════════════════════════
// كل الـ endpoints الخاصة بموديول الواتساب
// يتم استيراد هذا الراوتر في server.js
// ═══════════════════════════════════════════════════════

import express from 'express';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { parseCommand } from '../services/whatsapp/commandParser.js';
import { handleWithAI } from '../services/whatsapp/aiHandler.js';
import { formatMessage } from '../services/whatsapp/messageFormatter.js';

const router = express.Router();

// ── Supabase Admin Client (server-side with service_role) ──
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// ── مساعد: التحقق من Webhook Signature ──
function verifyWebhookSignature(req, secret) {
  if (!secret) return true; // تخطي إذا لم يُعدّ
  const signature = req.headers['x-hub-signature-256'] || '';
  const expectedSig = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSig)
  );
}

// ── مساعد: إرسال رسالة واتساب عبر 360dialog API ──
async function sendWhatsAppMessage(phone, message, settings) {
  if (!settings?.api_token_encrypted) {
    console.error('WhatsApp API token not configured');
    return false;
  }

  // فك تشفير التوكن (نفس نمط /api/crypto/decrypt)
  const apiToken = settings.api_token_encrypted; // TODO: decrypt via getTenantKey

  const provider = settings.provider || '360dialog';
  let apiUrl, headers, body;

  if (provider === '360dialog') {
    apiUrl = 'https://waba.360dialog.io/v1/messages';
    headers = { 'D360-API-KEY': apiToken, 'Content-Type': 'application/json' };
    body = {
      messaging_product: 'whatsapp',
      to: phone.replace('+', ''),
      type: 'text',
      text: { body: message }
    };
  } else if (provider === 'meta_cloud') {
    apiUrl = `https://graph.facebook.com/v18.0/${settings.wa_phone_number}/messages`;
    headers = { 'Authorization': `Bearer ${apiToken}`, 'Content-Type': 'application/json' };
    body = {
      messaging_product: 'whatsapp',
      to: phone.replace('+', ''),
      type: 'text',
      text: { body: message }
    };
  }

  try {
    const resp = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    return resp.ok;
  } catch (err) {
    console.error('WhatsApp send failed:', err.message);
    return false;
  }
}

// ── مساعد: البحث عن جهة الاتصال ──
async function findContact(orgId, phone) {
  if (!supabase) return null;
  const { data } = await supabase
    .from('whatsapp_contacts')
    .select('*')
    .eq('org_id', orgId)
    .eq('phone_number', phone)
    .single();
  return data;
}

// ── مساعد: تسجيل رسالة في السجل ──
async function logMessage(orgId, direction, from, to, content, extra = {}) {
  if (!supabase) return;
  await supabase.from('whatsapp_messages').insert({
    org_id: orgId,
    direction,
    from_number: from,
    to_number: to,
    content,
    message_type: extra.message_type || 'text',
    case_id: extra.case_id || null,
    client_id: extra.client_id || null,
    command_detected: extra.command_detected || null,
    ai_handled: extra.ai_handled || false,
    status: direction === 'outbound' ? 'sent' : 'received',
    media_url: extra.media_url || null,
  });
}


// ═══════════════════════════════════════════════════════
// API Endpoints
// ═══════════════════════════════════════════════════════

// ── 1. Webhook Verification (GET) — مطلوب من Meta/360dialog ──
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // التحقق: نقارن التوكن مع المحفوظ في env
  if (mode === 'subscribe' && token === process.env.WA_VERIFY_TOKEN) {
    console.log('WhatsApp webhook verified');
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});


// ── 2. Webhook Receiver (POST) — استقبال الرسائل الواردة ──
router.post('/webhook', async (req, res) => {
  // الرد فوراً بـ 200 (مطلوب من Meta خلال 5 ثوانٍ)
  res.sendStatus(200);

  try {
    if (!supabase) {
      console.error('Supabase not configured for WhatsApp module');
      return;
    }

    const entry = req.body?.entry?.[0];
    const change = entry?.changes?.[0]?.value;
    if (!change?.messages?.[0]) return; // ليست رسالة

    const msg = change.messages[0];
    const senderPhone = '+' + msg.from;
    const waNumber = change.metadata?.display_phone_number;
    const messageText = msg.text?.body || '';
    const messageType = msg.type || 'text';

    // البحث عن المكتب صاحب هذا الرقم
    const { data: settings } = await supabase
      .from('whatsapp_settings')
      .select('*')
      .eq('wa_phone_number', waNumber)
      .eq('is_active', true)
      .single();

    if (!settings) return; // رقم غير مسجّل في أي مكتب

    // التحقق من التوقيع
    if (!verifyWebhookSignature(req, settings.webhook_secret)) {
      console.warn('Invalid webhook signature');
      return;
    }

    const orgId = settings.org_id;
    const contact = await findContact(orgId, senderPhone);

    // تسجيل الرسالة الواردة
    await logMessage(orgId, 'inbound', senderPhone, waNumber, messageText, {
      message_type: messageType,
      client_id: contact?.linked_id,
      media_url: msg.image?.id || msg.document?.id || null,
    });

    let replyText = '';

    // ── محامي: تنفيذ أوامر ──
    if (contact?.contact_type === 'lawyer' || contact?.contact_type === 'staff') {
      const commandResult = await parseCommand(messageText, orgId, supabase);

      if (commandResult.recognized) {
        replyText = commandResult.response;
        await logMessage(orgId, 'outbound', waNumber, senderPhone, replyText, {
          command_detected: commandResult.command,
        });
      } else {
        replyText = 'لم أتعرف على الأمر. الأوامر المتاحة:\n• جلسة [رقم] [النتيجة]\n• موعد [رقم] [التاريخ]\n• مصروف [المبلغ] [الوصف]\n• اليوم\n• ذكرني [الرسالة]';
        await logMessage(orgId, 'outbound', waNumber, senderPhone, replyText);
      }
    }

    // ── موكل: استعلام أو رد ذكي ──
    else if (contact?.contact_type === 'client') {
      // هل أرسل رقم قضية؟
      const caseNumberMatch = messageText.match(/^\d{1,6}$/);
      if (caseNumberMatch) {
        const { data: caseData } = await supabase
          .from('cases')
          .select('id, case_number, status, court, plaintiff, defendant')
          .eq('org_id', orgId)
          .eq('client_id', contact.linked_id)
          .eq('case_number', caseNumberMatch[0])
          .single();

        if (caseData) {
          // جلب آخر جلسة
          const { data: lastSession } = await supabase
            .from('sessions')
            .select('date, notes')
            .eq('case_id', caseData.id)
            .order('date', { ascending: false })
            .limit(1)
            .single();

          replyText = formatMessage('caseStatus', {
            caseNumber: caseData.case_number,
            court: caseData.court,
            status: caseData.status,
            lastSession: lastSession,
          });
        } else {
          replyText = `عذراً، لم أجد قضية برقم ${caseNumberMatch[0]} مرتبطة بحسابك.`;
        }
      }
      // هل طلب فاتورة؟
      else if (messageText.includes('فاتورة') || messageText.includes('مستحق')) {
        const { data: invoices } = await supabase
          .from('invoices')
          .select('amount, status, due_date')
          .eq('org_id', orgId)
          .eq('client_id', contact.linked_id)
          .eq('status', 'unpaid')
          .order('due_date')
          .limit(5);

        replyText = formatMessage('invoiceStatus', { invoices });
      }
      // أي شيء آخر → Gemini AI
      else {
        replyText = await handleWithAI(messageText, orgId, contact, supabase);
        await logMessage(orgId, 'outbound', waNumber, senderPhone, replyText, {
          ai_handled: true,
          client_id: contact.linked_id,
        });
      }

      if (replyText && !messageText.includes('فاتورة')) {
        await logMessage(orgId, 'outbound', waNumber, senderPhone, replyText, {
          client_id: contact.linked_id,
        });
      }
    }

    // ── رقم غير مسجّل: رسالة ترحيب ──
    else {
      replyText = settings.welcome_message;
      await logMessage(orgId, 'outbound', waNumber, senderPhone, replyText);
    }

    // إرسال الرد
    if (replyText) {
      await sendWhatsAppMessage(senderPhone, replyText, settings);
    }

  } catch (err) {
    console.error('WhatsApp webhook error:', err);
  }
});


// ── 3. إرسال رسالة يدوية (من لوحة التحكم) ──
router.post('/send', async (req, res) => {
  try {
    const { orgId, phone, message } = req.body;
    if (!orgId || !phone || !message) {
      return res.status(400).json({ error: 'orgId, phone, message مطلوبين' });
    }

    const { data: settings } = await supabase
      .from('whatsapp_settings')
      .select('*')
      .eq('org_id', orgId)
      .single();

    if (!settings?.is_active) {
      return res.status(400).json({ error: 'واتساب غير مفعّل لهذا المكتب' });
    }

    const sent = await sendWhatsAppMessage(phone, message, settings);
    if (sent) {
      await logMessage(orgId, 'outbound', settings.wa_phone_number, phone, message);
      return res.json({ success: true });
    }
    return res.status(500).json({ error: 'فشل إرسال الرسالة' });
  } catch (err) {
    console.error('Manual send error:', err);
    return res.status(500).json({ error: 'خطأ في إرسال الرسالة' });
  }
});


// ── 4. إعدادات المكتب (CRUD) ──
router.get('/settings/:orgId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('whatsapp_settings')
      .select('org_id, wa_phone_number, welcome_message, away_message, notifications, is_active, provider')
      .eq('org_id', req.params.orgId)
      .single();

    if (error && error.code === 'PGRST116') {
      // لا توجد إعدادات بعد — أرجع القيم الافتراضية
      return res.json({ org_id: req.params.orgId, is_active: false, notifications: {} });
    }
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'خطأ في جلب الإعدادات' });
  }
});

router.put('/settings/:orgId', async (req, res) => {
  try {
    const { wa_phone_number, welcome_message, away_message, notifications, is_active, provider } = req.body;
    const { error } = await supabase
      .from('whatsapp_settings')
      .upsert({
        org_id: req.params.orgId,
        wa_phone_number,
        welcome_message,
        away_message,
        notifications,
        is_active,
        provider,
      });

    if (error) throw error;
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'خطأ في حفظ الإعدادات' });
  }
});


// ── 5. إحصائيات الشهر ──
router.get('/stats/:orgId', async (req, res) => {
  try {
    const orgId = req.params.orgId;
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: messages, count } = await supabase
      .from('whatsapp_messages')
      .select('id, direction, ai_handled, command_detected', { count: 'exact' })
      .eq('org_id', orgId)
      .gte('created_at', startOfMonth.toISOString());

    const total = count || 0;
    const inbound = messages?.filter(m => m.direction === 'inbound').length || 0;
    const outbound = messages?.filter(m => m.direction === 'outbound').length || 0;
    const commands = messages?.filter(m => m.command_detected).length || 0;
    const aiHandled = messages?.filter(m => m.ai_handled).length || 0;

    return res.json({
      totalMessages: total,
      inbound,
      outbound,
      commandsExecuted: commands,
      aiResponses: aiHandled,
      responseRate: inbound > 0 ? Math.round((outbound / inbound) * 100) : 0,
    });
  } catch (err) {
    return res.status(500).json({ error: 'خطأ في جلب الإحصائيات' });
  }
});


// ── 6. سجل الرسائل (مع pagination) ──
router.get('/messages/:orgId', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 50;

    const { data, count } = await supabase
      .from('whatsapp_messages')
      .select('*', { count: 'exact' })
      .eq('org_id', req.params.orgId)
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    return res.json({ data, total: count, page, limit });
  } catch (err) {
    return res.status(500).json({ error: 'خطأ في جلب الرسائل' });
  }
});


export default router;
