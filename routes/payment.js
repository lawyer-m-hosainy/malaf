// ═══════════════════════════════════════════════════════
// Payment Routes — مَلَف (Malaf)
// ═══════════════════════════════════════════════════════
// يستقبل callbacks من Paymob ويعالج الدفعات
// ═══════════════════════════════════════════════════════

import express from 'express';
import pino from 'pino';
import {
  createPaymentLink,
  verifyPaymobHmac,
  handleSuccessfulPayment,
  getAllPlans,
  isPaymobConfigured,
} from '../services/payment/paymobService.js';

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
router.post('/create', async (req, res) => {
  try {
    const orgId = req.tenantId; // R2-FIX: لا نقبل org_id من body — فقط من JWT
    const { plan, billing_cycle, name, email, phone } = req.body;

    if (!orgId || !plan) {
      return res.status(400).json({ success: false, error: 'معرف المكتب والباقة مطلوبان' });
    }

    if (!['standard', 'premium'].includes(plan)) {
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

export default router;
