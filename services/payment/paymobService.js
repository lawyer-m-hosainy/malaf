// ═══════════════════════════════════════════════════════
// خدمة الدفع — مَلَف (Malaf)
// ═══════════════════════════════════════════════════════
// تدعم Paymob كبوابة دفع أساسية
// مُجهزة للربط — أضف API Keys في Environment Variables
// ═══════════════════════════════════════════════════════

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import pino from 'pino';

const logger = pino();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

// ── Paymob Configuration ──
const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
const PAYMOB_INTEGRATION_ID_CARD = process.env.PAYMOB_INTEGRATION_ID_CARD;
const PAYMOB_INTEGRATION_ID_WALLET = process.env.PAYMOB_INTEGRATION_ID_WALLET;
const PAYMOB_IFRAME_ID = process.env.PAYMOB_IFRAME_ID;
const PAYMOB_HMAC_SECRET = process.env.PAYMOB_HMAC_SECRET;

const PAYMOB_BASE_URL = 'https://accept.paymob.com/api';

/**
 * التحقق مما إذا كانت بوابة Paymob مُعدّة
 */
export function isPaymobConfigured() {
  return !!(PAYMOB_API_KEY && PAYMOB_INTEGRATION_ID_CARD && PAYMOB_IFRAME_ID);
}

/**
 * الحصول على Auth Token من Paymob
 */
async function getPaymobAuthToken() {
  if (!PAYMOB_API_KEY) return null;
  try {
    const resp = await fetch(`${PAYMOB_BASE_URL}/auth/tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: PAYMOB_API_KEY }),
    });
    if (!resp.ok) throw new Error(`Paymob auth failed: ${resp.status}`);
    const data = await resp.json();
    return data.token;
  } catch (err) {
    logger.error({ err: err.message }, 'Paymob auth error');
    return null;
  }
}

/**
 * إنشاء رابط دفع لمكتب محاماة
 * @param {string} orgId - معرف المكتب
 * @param {string} planKey - 'standard' أو 'premium'
 * @param {string} billingCycle - 'monthly' أو 'yearly'
 * @param {object} buyerInfo - { name, email, phone }
 * @returns {object} { success, paymentUrl, transactionId } أو { success: false, error }
 */
export async function createPaymentLink(orgId, planKey, billingCycle, buyerInfo = {}) {
  try {
    // 1. جلب تفاصيل الباقة
    const planDetails = await getPlanDetails(planKey);
    if (!planDetails) {
      return { success: false, error: 'الباقة غير موجودة' };
    }

    const amount = billingCycle === 'yearly' ? planDetails.price_yearly : planDetails.price_monthly;
    if (amount <= 0) {
      return { success: false, error: 'لا يمكن إنشاء رابط دفع لباقة مجانية' };
    }

    // 2. تسجيل المعاملة في قاعدة البيانات (pending)
    const { data: tx, error: txError } = await supabase
      .from('payment_transactions')
      .insert({
        org_id: orgId,
        gateway: 'paymob',
        amount,
        currency: 'EGP',
        status: 'pending',
        payer_phone: buyerInfo.phone || null,
        payer_name: buyerInfo.name || null,
        metadata: { plan_key: planKey, billing_cycle: billingCycle },
      })
      .select('id')
      .single();

    if (txError) {
        logger.error({ err: txError.message }, 'Payment link creation error');
      return { success: false, error: 'فشل في تسجيل المعاملة' };
    }

    // 3. إذا Paymob غير مُعد — نرجع رابط وهمي (للتطوير)
    if (!isPaymobConfigured()) {
      logger.warn('Paymob not configured — returning stub payment link');
      return {
        success: true,
        paymentUrl: `https://malaf-platform.onrender.com/payment/stub?tx=${tx.id}&amount=${amount}&plan=${planKey}`,
        transactionId: tx.id,
        stub: true,
        message: 'Paymob غير مُعد بعد. أضف PAYMOB_API_KEY في Environment Variables.',
      };
    }

    // 4. Paymob Flow: Auth → Order → Payment Key → iframe URL
    const authToken = await getPaymobAuthToken();
    if (!authToken) {
      return { success: false, error: 'فشل الاتصال ببوابة الدفع' };
    }

    // Create Order
    const orderResp = await fetch(`${PAYMOB_BASE_URL}/ecommerce/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_token: authToken,
        delivery_needed: false,
        amount_cents: amount * 100, // Paymob uses cents
        currency: 'EGP',
        merchant_order_id: tx.id,
        items: [{
          name: `اشتراك ${planDetails.display_name_ar} - ${billingCycle === 'yearly' ? 'سنوي' : 'شهري'}`,
          amount_cents: amount * 100,
          quantity: 1,
        }],
      }),
    });
    const orderData = await orderResp.json();

    // Create Payment Key
    const paymentKeyResp = await fetch(`${PAYMOB_BASE_URL}/acceptance/payment_keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_token: authToken,
        amount_cents: amount * 100,
        expiration: 3600, // 1 hour
        order_id: orderData.id,
        billing_data: {
          first_name: buyerInfo.name?.split(' ')[0] || 'مستخدم',
          last_name: buyerInfo.name?.split(' ').slice(1).join(' ') || 'ملف',
          email: buyerInfo.email || 'user@malaf.app',
          phone_number: buyerInfo.phone || '+201000000000',
          apartment: 'N/A', street: 'N/A', building: 'N/A',
          floor: 'N/A', city: 'Cairo', state: 'Cairo',
          country: 'EG', postal_code: '11511',
          shipping_method: 'N/A',
        },
        currency: 'EGP',
        integration_id: parseInt(PAYMOB_INTEGRATION_ID_CARD),
      }),
    });
    const paymentKeyData = await paymentKeyResp.json();

    // Update transaction with gateway order ID
    await supabase
      .from('payment_transactions')
      .update({ gateway_transaction_id: String(orderData.id) })
      .eq('id', tx.id);

    const paymentUrl = `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${paymentKeyData.token}`;

    return {
      success: true,
      paymentUrl,
      transactionId: tx.id,
      orderId: orderData.id,
    };
  } catch (err) {
    logger.error({ err: err.message }, 'Payment link creation error');
    return { success: false, error: 'حدث خطأ أثناء إنشاء رابط الدفع' };
  }
}

/**
 * التحقق من صحة Paymob Webhook (HMAC)
 */
export function verifyPaymobHmac(requestBody, receivedHmac) {
  if (!PAYMOB_HMAC_SECRET) {
    logger.warn('PAYMOB_HMAC_SECRET not set — skipping verification');
    return true; // Skip in dev
  }

  // Paymob HMAC concatenation order (as per their docs)
  const obj = requestBody.obj;
  const concatenated = [
    obj.amount_cents,
    obj.created_at,
    obj.currency,
    obj.error_occured,
    obj.has_parent_transaction,
    obj.id,
    obj.integration_id,
    obj.is_3d_secure,
    obj.is_auth,
    obj.is_capture,
    obj.is_refunded,
    obj.is_standalone_payment,
    obj.is_voided,
    obj.order?.id || obj.order,
    obj.owner,
    obj.pending,
    obj.source_data?.pan || '',
    obj.source_data?.sub_type || '',
    obj.source_data?.type || '',
    obj.success,
  ].join('');

  const calculatedHmac = crypto
    .createHmac('sha512', PAYMOB_HMAC_SECRET)
    .update(concatenated)
    .digest('hex');

  return calculatedHmac === receivedHmac;
}

/**
 * معالجة Callback ناجح من Paymob
 */
export async function handleSuccessfulPayment(transactionData) {
  if (!supabase) return { success: false, error: 'Database not configured' };

  try {
    const merchantOrderId = transactionData.order?.merchant_order_id || transactionData.merchant_order_id;

    // 1. تحديث المعاملة
    const { data: tx } = await supabase
      .from('payment_transactions')
      .update({
        status: 'success',
        gateway_transaction_id: String(transactionData.id),
        payment_method: transactionData.source_data?.type || 'card',
      })
      .eq('id', merchantOrderId)
      .select('*')
      .single();

    if (!tx) {
      logger.error({ merchantOrderId }, 'Transaction not found');
      return { success: false, error: 'المعاملة غير موجودة' };
    }

    const { plan_key, billing_cycle } = tx.metadata || {};

    // 2. حساب تاريخ الانتهاء
    const now = new Date();
    const periodEnd = new Date(now);
    if (billing_cycle === 'yearly') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    // 3. إضافة/تحديث الاشتراك
    const { error: subError } = await supabase
      .from('subscriptions')
      .upsert({
        org_id: tx.org_id,
        plan: plan_key,
        status: 'active',
        billing_cycle: billing_cycle || 'monthly',
        current_period_end: periodEnd.toISOString(),
        auto_renew: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'org_id' });

    if (subError) {
      logger.error({ err: subError.message }, 'Subscription upsert error');
    }

    // 4. تحديث المكتب
    await supabase
      .from('organizations')
      .update({ plan: plan_key, updated_at: new Date().toISOString() })
      .eq('id', tx.org_id);

    return {
      success: true,
      orgId: tx.org_id,
      plan: plan_key,
      expiresAt: periodEnd.toISOString(),
      amount: tx.amount,
    };
  } catch (err) {
    logger.error({ err: err.message }, 'Payment processing error');
    return { success: false, error: 'فشل في معالجة الدفع' };
  }
}

/**
 * جلب تفاصيل باقة معينة
 */
export async function getPlanDetails(planKey) {
  if (!supabase) return null;
  const { data } = await supabase
    .from('plan_limits')
    .select('*')
    .eq('plan_key', planKey)
    .eq('is_active', true)
    .single();
  return data;
}

/**
 * جلب كل الباقات المتاحة
 */
export async function getAllPlans() {
  if (!supabase) return [];
  const { data } = await supabase
    .from('plan_limits')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  return data || [];
}

/**
 * التحقق من حالة اشتراك مكتب
 */
export async function getOrgSubscription(orgId) {
  if (!supabase || !orgId) return null;
  const { data } = await supabase
    .from('subscriptions')
    .select('*, organizations!inner(name, slug)')
    .eq('org_id', orgId)
    .single();
  return data;
}
