// ═══════════════════════════════════════════════════════
// Subscription Cron Jobs — مَلَف (Malaf)
// ═══════════════════════════════════════════════════════
// 3 وظائف تلقائية:
// 1. تذكير قبل 7 أيام من انتهاء الاشتراك
// 2. إيقاف الاشتراكات المنتهية
// 3. عرض خاص لمن انتهى اشتراكه ولم يجدد (بعد 3 أيام)
// + متابعة العملاء المترددين (conversation_states)
// ═══════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';
import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
let sendMessageFn = null;

/**
 * تهيئة Cron Jobs
 * @param {Function} sendFn - دالة إرسال واتساب: (phone, message, orgId) => boolean
 */
export function initSubscriptionCron(sendFn) {
  if (!supabaseUrl || !supabaseServiceKey) {
    logger.warn('Subscription Cron: Supabase not configured, skipping');
    return;
  }
  supabase = createClient(supabaseUrl, supabaseServiceKey);
  sendMessageFn = sendFn;

  // ── تذكير الاشتراكات — كل 6 ساعات ──
  setInterval(sendRenewalReminders, 6 * 60 * 60 * 1000);

  // ── إيقاف المنتهية — كل ساعة ──
  setInterval(deactivateExpiredSubscriptions, 60 * 60 * 1000);

  // ── عرض خاص لمن لم يجدد — كل 12 ساعة ──
  setInterval(sendWinBackOffers, 12 * 60 * 60 * 1000);

  // ── متابعة المترددين — كل 4 ساعات ──
  setInterval(followUpHesitant, 4 * 60 * 60 * 1000);

  // ── تشغيل فوري أول مرة (بعد 30 ثانية من البدء) ──
  setTimeout(() => {
    sendRenewalReminders().catch(err => logger.error({ err: err.message }, 'Initial renewal check failed'));
    deactivateExpiredSubscriptions().catch(err => logger.error({ err: err.message }, 'Initial deactivation check failed'));
  }, 30_000);

  logger.info('📅 Subscription Cron Jobs initialized');
}


// ═══════════════════════════════════════════════════════
// 1. تذكير قبل 7 أيام من الانتهاء
// ═══════════════════════════════════════════════════════

async function sendRenewalReminders() {
  if (!supabase || !sendMessageFn) return;
  try {
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // اشتراكات تنتهي خلال 7 أيام ولم يتم إرسال تذكير لها
    const { data: expiring } = await supabase
      .from('subscriptions')
      .select('id, org_id, plan, current_period_end, organizations!inner(name)')
      .eq('status', 'active')
      .lte('current_period_end', sevenDaysLater.toISOString())
      .gte('current_period_end', now.toISOString());

    if (!expiring?.length) return;

    logger.info(`Found ${expiring.length} subscriptions expiring within 7 days`);

    for (const sub of expiring) {
      try {
        // جلب رقم هاتف المالك
        const ownerPhone = await getOrgOwnerPhone(sub.org_id);
        if (!ownerPhone) continue;

        const expiryDate = new Date(sub.current_period_end).toLocaleDateString('ar-EG', {
          year: 'numeric', month: 'long', day: 'numeric',
        });

        const message = `⚠️ *تذكير — اشتراكك في منصة ملف*\n\nاشتراكك في باقة *${sub.plan}* ينتهي يوم *${expiryDate}*\n\nجدد الآن للحفاظ على كل بياناتك وقضاياك:\n🔗 https://malaf-platform.onrender.com/billing\n\nلو عندك أي استفسار، رد على هذه الرسالة وسنساعدك فوراً 💬`;

        await sendMessageFn(ownerPhone, message, sub.org_id);
        logger.info({ orgId: sub.org_id }, 'Renewal reminder sent');
      } catch (err) {
        logger.error({ err: err.message, orgId: sub.org_id }, 'Failed to send renewal reminder');
      }
    }
  } catch (err) {
    logger.error({ err: err.message }, 'Renewal reminders job error');
  }
}


// ═══════════════════════════════════════════════════════
// 2. إيقاف الاشتراكات المنتهية
// ═══════════════════════════════════════════════════════

async function deactivateExpiredSubscriptions() {
  if (!supabase) return;
  try {
    const now = new Date().toISOString();

    // جلب الاشتراكات المنتهية
    const { data: expired } = await supabase
      .from('subscriptions')
      .select('id, org_id, plan, current_period_end')
      .eq('status', 'active')
      .lt('current_period_end', now);

    if (!expired?.length) return;

    logger.info(`Deactivating ${expired.length} expired subscriptions`);

    for (const sub of expired) {
      // تحديث الاشتراك
      await supabase
        .from('subscriptions')
        .update({
          status: 'expired',
          updated_at: now,
        })
        .eq('id', sub.id);

      // تحديث المكتب للباقة المجانية
      await supabase
        .from('organizations')
        .update({ plan: 'free', updated_at: now })
        .eq('id', sub.org_id);

      // إرسال إشعار
      const ownerPhone = await getOrgOwnerPhone(sub.org_id);
      if (ownerPhone && sendMessageFn) {
        const message = `📢 *انتهى اشتراكك في منصة ملف*\n\nتم تحويل حسابك للباقة المجانية.\n\n⚠️ لن تفقد بياناتك، لكن بعض المميزات (مثل الذكاء الاصطناعي والواتساب التلقائي) لن تعمل.\n\nجدد الآن لاستعادة كل المميزات:\n🔗 https://malaf-platform.onrender.com/billing`;

        await sendMessageFn(ownerPhone, message, sub.org_id);
      }

      logger.info({ orgId: sub.org_id, plan: sub.plan }, 'Subscription deactivated');
    }
  } catch (err) {
    logger.error({ err: err.message }, 'Deactivation job error');
  }
}


// ═══════════════════════════════════════════════════════
// 3. عرض خاص لمن لم يجدد (بعد 3 أيام)
// ═══════════════════════════════════════════════════════

async function sendWinBackOffers() {
  if (!supabase || !sendMessageFn) return;
  try {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);

    // اشتراكات انتهت من 3 أيام ولم تُجدد
    const { data: lapsed } = await supabase
      .from('subscriptions')
      .select('id, org_id, plan, current_period_end')
      .eq('status', 'expired')
      .lte('current_period_end', threeDaysAgo.toISOString())
      .gte('current_period_end', fourDaysAgo.toISOString());

    if (!lapsed?.length) return;

    for (const sub of lapsed) {
      try {
        const ownerPhone = await getOrgOwnerPhone(sub.org_id);
        if (!ownerPhone) continue;

        const message = `🎁 *عرض خاص من منصة ملف!*\n\nوحشتنا! 😊\n\nلاحظنا إن اشتراكك انتهى. عندنا عرض حصري ليك:\n\n🔥 *خصم 20% على الاشتراك السنوي* لو جددت خلال 48 ساعة!\n\nقضاياك وبياناتك لسه محفوظة بأمان وجاهزة لما ترجع.\n\n🔗 https://malaf-platform.onrender.com/billing?promo=COMEBACK20\n\nرد بـ "أنا مهتم" وهنساعدك فوراً 💬`;

        await sendMessageFn(ownerPhone, message, sub.org_id);
        logger.info({ orgId: sub.org_id }, 'Win-back offer sent');
      } catch { /* skip individual failures */ }
    }
  } catch (err) {
    logger.error({ err: err.message }, 'Win-back offers job error');
  }
}


// ═══════════════════════════════════════════════════════
// 4. متابعة العملاء المترددين (Sales follow-up)
// ═══════════════════════════════════════════════════════

async function followUpHesitant() {
  if (!supabase || !sendMessageFn) return;
  try {
    const now = new Date().toISOString();

    // عملاء مترددون وموعد متابعتهم حل
    const { data: hesitant } = await supabase
      .from('conversation_states')
      .select('*')
      .eq('state', 'hesitant')
      .eq('follow_up_sent', false)
      .lte('follow_up_at', now)
      .limit(20);

    if (!hesitant?.length) return;

    for (const conv of hesitant) {
      try {
        const message = `مرحباً! 👋\n\nأنا من منصة ملف. تحدثنا من قبل عن المنصة.\n\nهل عندك أي أسئلة قدر أساعدك فيها؟ 😊\n\n💡 تذكر: الباقة المجانية متاحة دائماً — يمكنك تجربة المنصة بـ 5 قضايا من غير أي التزام!\n\n🔗 https://malaf-platform.onrender.com`;

        // نرسل بدون orgId لأنه عميل محتمل (ليس مشتركاً بعد)
        await sendMessageFn(conv.phone, message, conv.org_id);

        // تحديث الحالة
        await supabase
          .from('conversation_states')
          .update({ follow_up_sent: true, updated_at: now })
          .eq('id', conv.id);

        logger.info({ phone: conv.phone }, 'Follow-up sent to hesitant lead');
      } catch { /* skip individual failures */ }
    }
  } catch (err) {
    logger.error({ err: err.message }, 'Hesitant follow-up job error');
  }
}


// ═══════════════════════════════════════════════════════
// Helper: جلب رقم هاتف مالك المكتب
// ═══════════════════════════════════════════════════════

async function getOrgOwnerPhone(orgId) {
  if (!supabase) return null;
  try {
    // البحث في جهات اتصال الواتساب (محامي أو مدير)
    const { data: contact } = await supabase
      .from('whatsapp_contacts')
      .select('phone_number')
      .eq('org_id', orgId)
      .in('contact_type', ['lawyer', 'staff'])
      .limit(1)
      .single();

    if (contact?.phone_number) return contact.phone_number;

    // Fallback: البحث في profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('org_id', orgId)
      .in('role', ['org_admin', 'super_admin'])
      .limit(1)
      .single();

    // لا يمكن إرسال واتساب بالإيميل فقط
    return null;
  } catch {
    return null;
  }
}
