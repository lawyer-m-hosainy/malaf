// ═══════════════════════════════════════════════════════
// Payment Routes — مَلَف (Malaf)
// ═══════════════════════════════════════════════════════
// يستقبل callbacks من Paymob ويعالج الدفعات
// ═══════════════════════════════════════════════════════

import express from 'express';
import pino from 'pino';
import { createClient } from '@supabase/supabase-js';
import { authMiddleware } from '../middleware/auth.js';
import {
  createPaymentLink,
  verifyPaymobHmac,
  handleSuccessfulPayment,
  getAllPlans,
  isPaymobConfigured,
} from '../services/payment/paymobService.js';

// CRIT-001-FIX: supabase client للعمليات اليدوية
// نستخدم service_role_key لأن هذا كود سيرفر يحتاج وصول كامل لتحديث الاشتراكات
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const logger = pino();
const router = express.Router();

/**
 * GET /api/payment/plans — جلب الباقات المتاحة (عام)
 */
router.get('/plans', async (req, res) => {
  try {
    const plans = await getAllPlans();
    return res.json({ success: true, plans });
  } catch (err) {
    logger.error({ err: err.message }, 'Plans fetch error');
    return res.status(500).json({ success: false, error: 'فشل في جلب الباقات' });
  }
});

/**
 * POST /api/payment/create — إنشاء رابط دفع (محمي بـ auth)
 */
router.post('/create', authMiddleware, async (req, res) => { // CRIT-002-FIX: إضافة authMiddleware لملء req.tenantId من JWT
  try {
    const orgId = req.tenantId; // R2-FIX: لا نقبل org_id من body — فقط من JWT
    const { plan, billing_cycle, name, email, phone } = req.body;

    if (!orgId || !plan) {
      return res.status(400).json({ success: false, error: 'معرف المكتب والباقة مطلوبان' });
    }

    if (!['basic', 'advanced', 'enterprise'].includes(plan)) { // CRIT-003-FIX: توحيد أسماء الباقات مع Frontend
      return res.status(400).json({ success: false, error: 'باقة غير صالحة' });
    }

    const result = await createPaymentLink(orgId, plan, billing_cycle || 'monthly', {
      name, email, phone,
    });

    return res.json(result);
  } catch (err) {
    logger.error({ err: err.message }, 'Payment create error');
    return res.status(500).json({ success: false, error: 'فشل في إنشاء رابط الدفع' });
  }
});

/**
 * POST /api/payment/callback — Paymob Webhook (عام — بدون auth)
 * Paymob يرسل بيانات المعاملة هنا بعد الدفع
 */
router.post('/callback', async (req, res) => {
  try {
    // 1. التحقق من HMAC signature
    const hmac = req.query.hmac || req.body.hmac;
    if (!verifyPaymobHmac(req.body, hmac)) {
      logger.warn({ event: 'INVALID_HMAC', ip: req.ip }, 'Invalid Paymob HMAC signature');
      return res.status(403).json({ error: 'Invalid signature' });
    }

    const txData = req.body.obj || req.body;
    const isSuccess = txData.success === true || txData.success === 'true';

    logger.info({ event: 'PAYMENT_CALLBACK', success: isSuccess, gateway: 'paymob' }, 'Payment callback received');

    if (isSuccess) {
      const result = await handleSuccessfulPayment(txData);

      if (result.success) {
        logger.info({ event: 'SUBSCRIPTION_ACTIVATED', orgId: result.orgId, plan: result.plan }, 'Subscription activated');

        // TODO: إرسال رسالة واتساب تأكيدية (يتم ربطها في المرحلة التالية)
        // await sendWhatsAppConfirmation(result);
      }
    }

    // Paymob يتوقع 200 OK دائماً
    return res.status(200).json({ received: true });
  } catch (err) {
    logger.error({ err: err.message }, 'Payment callback error');
    return res.status(200).json({ received: true }); // لا نرجع error لـ Paymob
  }
});

/**
 * GET /api/payment/callback — Redirect بعد الدفع (للمستخدم)
 * Paymob يعيد توجيه المستخدم هنا بعد الدفع
 */
router.get('/callback', (req, res) => {
  const success = req.query.success === 'true';
  const redirectUrl = success
    ? '/dashboard?payment=success'
    : '/dashboard?payment=failed';
  return res.redirect(redirectUrl);
});

/**
 * GET /api/payment/status — حالة بوابة الدفع
 */
router.get('/status', (req, res) => {
  return res.json({
    configured: isPaymobConfigured(),
    gateway: 'paymob',
    message: isPaymobConfigured()
      ? 'بوابة الدفع جاهزة'
      : 'بوابة الدفع غير مُعدة بعد — أضف PAYMOB_API_KEY في Environment Variables',
  });
});

// ═══════════════════════════════════════════════
// MANUAL PAYMENTS (InstaPay/Wallets)
// ═══════════════════════════════════════════════
import { z } from 'zod';

const manualPaymentSchema = z.object({
  plan: z.enum(['basic', 'advanced', 'enterprise']),
  billingCycle: z.enum(['monthly', 'yearly']),
  amount: z.number().positive(),
  transferReference: z.string().min(4, 'رقم العملية يجب أن يكون 4 أحرف على الأقل').max(50),
  transferMethod: z.enum(['instapay', 'vodafone_cash', 'orange_cash', 'etisalat_cash']),
});

// POST /api/payment/manual — العميل يرسل طلب دفع
router.post('/manual', authMiddleware, async (req, res) => {
  try {
    const parsed = manualPaymentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ 
        success: false, 
        error: parsed.error.errors[0].message 
      });
    }

    const { plan, billingCycle, amount, transferReference, transferMethod } = parsed.data;
    const orgId = req.tenantId;

    // تحقق من عدم وجود طلب pending للمكتب
    const { data: existing } = await supabase
      .from('manual_payment_requests')
      .select('id')
      .eq('org_id', orgId)
      .eq('status', 'pending')
      .single();

    if (existing) {
      return res.status(400).json({ 
        success: false, 
        error: 'يوجد طلب دفع قيد المراجعة بالفعل. يرجى الانتظار.' 
      });
    }

    // تحقق من عدم تكرار رقم العملية
    const { data: duplicate } = await supabase
      .from('manual_payment_requests')
      .select('id')
      .eq('transfer_reference', transferReference)
      .single();

    if (duplicate) {
      return res.status(400).json({ 
        success: false, 
        error: 'رقم العملية هذا مُستخدم بالفعل.' 
      });
    }

    const { data, error } = await supabase
      .from('manual_payment_requests')
      .insert({
        org_id: orgId,
        plan,
        amount,
        billing_cycle: billingCycle,
        transfer_reference: transferReference,
        transfer_method: transferMethod,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    logger.info({ orgId, plan, amount, transferMethod }, 'MANUAL_PAYMENT_REQUEST_CREATED');

    return res.json({ 
      success: true, 
      requestId: data.id,
      message: 'تم استلام طلبك. سيتم التفعيل خلال 24 ساعة بعد التحقق.' 
    });

  } catch (err) {
    logger.error({ err }, 'MANUAL_PAYMENT_ERROR');
    return res.status(500).json({ success: false, error: 'حدث خطأ. يرجى المحاولة مرة أخرى.' });
  }
});

// GET /api/payment/manual/status — العميل يتابع حالة طلبه
router.get('/manual/status', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('manual_payment_requests')
      .select('id, plan, amount, billing_cycle, transfer_method, status, created_at, confirmed_at, notes')
      .eq('org_id', req.tenantId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;
    return res.json({ success: true, requests: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'حدث خطأ في جلب البيانات.' });
  }
});

// POST /api/payment/manual/confirm — super_admin يؤكد
router.post('/manual/confirm', authMiddleware, async (req, res) => {
  try {
    // تحقق إن المستخدم super_admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.userId)
      .single();

    if (!profile || profile.role !== 'super_admin') {
      return res.status(403).json({ success: false, error: 'غير مصرح.' });
    }

    const { requestId, action, notes } = req.body;
    if (!requestId || !['confirmed', 'rejected'].includes(action)) {
      return res.status(400).json({ success: false, error: 'بيانات غير صحيحة.' });
    }

    // جلب الطلب
    const { data: request, error: fetchErr } = await supabase
      .from('manual_payment_requests')
      .select('*')
      .eq('id', requestId)
      .eq('status', 'pending')
      .single();

    if (fetchErr || !request) {
      return res.status(404).json({ success: false, error: 'الطلب غير موجود أو تمت معالجته.' });
    }

    // تحديث الطلب
    await supabase
      .from('manual_payment_requests')
      .update({
        status: action,
        confirmed_by: req.userId,
        confirmed_at: new Date().toISOString(),
        notes: notes || null,
      })
      .eq('id', requestId);

    // لو confirmed → فعّل الاشتراك
    if (action === 'confirmed') {
      const isYearly = request.billing_cycle === 'yearly';
      const periodEnd = new Date();
      isYearly 
        ? periodEnd.setFullYear(periodEnd.getFullYear() + 1)
        : periodEnd.setMonth(periodEnd.getMonth() + 1);

      await supabase.from('subscriptions').upsert({
        org_id: request.org_id,
        plan: request.plan,
        status: 'active',
        current_period_end: periodEnd.toISOString(),
        billing_cycle: request.billing_cycle,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'org_id' });

      await supabase
        .from('organizations')
        .update({ plan: request.plan })
        .eq('id', request.org_id);

      logger.info({ requestId, orgId: request.org_id, plan: request.plan }, 'MANUAL_PAYMENT_CONFIRMED');
    }

    return res.json({ 
      success: true, 
      message: action === 'confirmed' ? 'تم تفعيل الاشتراك.' : 'تم رفض الطلب.' 
    });

  } catch (err) {
    logger.error({ err }, 'MANUAL_PAYMENT_CONFIRM_ERROR');
    return res.status(500).json({ success: false, error: 'حدث خطأ.' });
  }
});

export default router;
