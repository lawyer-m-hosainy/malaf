// ═══════════════════════════════════════════════════════
// Facebook Messenger Webhook — مَلَف (Malaf)
// ═══════════════════════════════════════════════════════
// نفس منطق WhatsApp مع تكييف لـ Messenger API
// مُجهز للربط — أضف Facebook tokens في Environment Variables
// ═══════════════════════════════════════════════════════

import express from 'express';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { handleWithAI } from '../services/whatsapp/aiHandler.js';

const router = express.Router();

// ── Configuration ──
const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
const FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || 'malaf_messenger_verify';
const FB_APP_SECRET = process.env.FB_APP_SECRET;

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

/**
 * التحقق من صحة طلب Facebook (X-Hub-Signature-256)
 */
function verifyFacebookSignature(req) {
  if (!FB_APP_SECRET) return true; // Skip in dev
  const signature = req.headers['x-hub-signature-256'] || '';
  const expectedSig = 'sha256=' + crypto
    .createHmac('sha256', FB_APP_SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex');
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSig)
    );
  } catch {
    return false;
  }
}

/**
 * إرسال رسالة عبر Facebook Messenger
 */
async function sendMessengerMessage(recipientId, messageText) {
  if (!FB_PAGE_ACCESS_TOKEN) {
    console.warn('⚠️ FB_PAGE_ACCESS_TOKEN not set — message not sent');
    return false;
  }
  try {
    const resp = await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${FB_PAGE_ACCESS_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: messageText },
      }),
    });
    return resp.ok;
  } catch (err) {
    console.error('Messenger send error:', err.message);
    return false;
  }
}

/**
 * تسجيل رسالة في قاعدة البيانات
 */
async function logMessage(direction, from, to, content, extra = {}) {
  if (!supabase) return;
  try {
    await supabase.from('whatsapp_messages').insert({
      org_id: extra.org_id || null,
      direction,
      from_number: `fb:${from}`,
      to_number: `fb:${to}`,
      content,
      message_type: extra.message_type || 'text',
      ai_handled: extra.ai_handled || false,
      status: direction === 'outbound' ? 'sent' : 'received',
    });
  } catch (err) {
    console.error('Messenger log error:', err.message);
  }
}


// ═══════════════════════════════════════════════════════
// Routes
// ═══════════════════════════════════════════════════════

/**
 * GET /api/messenger/webhook — التحقق من Facebook (مطلوب لتفعيل الـ webhook)
 */
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === FB_VERIFY_TOKEN) {
    console.log('✅ Facebook Messenger webhook verified');
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

/**
 * POST /api/messenger/webhook — استقبال الرسائل من Messenger
 */
router.post('/webhook', async (req, res) => {
  // الرد فوراً بـ 200 (مطلوب من Facebook خلال 5 ثوانٍ)
  res.sendStatus(200);

  try {
    // التحقق من التوقيع
    if (!verifyFacebookSignature(req)) {
      console.warn('⚠️ Invalid Facebook webhook signature');
      return;
    }

    const body = req.body;
    if (body.object !== 'page') return;

    for (const entry of body.entry || []) {
      for (const event of entry.messaging || []) {
        // تجاهل أحداث غير الرسائل (مثل delivery, read)
        if (!event.message || event.message.is_echo) continue;

        const senderId = event.sender.id;
        const messageText = event.message.text || '';
        const messageType = event.message.attachments ? 'media' : 'text';

        if (!messageText) continue; // تجاهل الرسائل الفارغة أو الميديا فقط

        // تسجيل الرسالة الواردة
        await logMessage('inbound', senderId, 'page', messageText, {
          message_type: messageType,
        });

        // معالجة بالذكاء الاصطناعي (نفس aiHandler المستخدم للواتساب)
        const replyText = await handleWithAI(messageText, null, null, supabase, {
          source: 'facebook',
          senderPhone: `fb:${senderId}`,
        });

        if (replyText) {
          // إرسال الرد
          const sent = await sendMessengerMessage(senderId, replyText);

          // تسجيل الرد
          await logMessage('outbound', 'page', senderId, replyText, {
            ai_handled: true,
          });

          if (!sent) {
            console.warn(`Failed to send Messenger reply to ${senderId}`);
          }
        }
      }
    }
  } catch (err) {
    console.error('Messenger webhook error:', err.message);
  }
});

/**
 * GET /api/messenger/status — حالة الربط
 */
router.get('/status', (req, res) => {
  return res.json({
    configured: !!FB_PAGE_ACCESS_TOKEN,
    verifyToken: FB_VERIFY_TOKEN,
    message: FB_PAGE_ACCESS_TOKEN
      ? 'Facebook Messenger جاهز'
      : 'غير مُعد — أضف FB_PAGE_ACCESS_TOKEN في Environment Variables',
  });
});

export default router;
