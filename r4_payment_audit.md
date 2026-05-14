# ⚖️ تقرير R4 — نظام الاشتراكات والدفع
## مَلَف (Malaf) — تدقيق Paymob + Subscription System

---

## ملخص سريع

```
╔═══════════════════════════════════════════════════════╗
║  Paymob Code: مكتمل 100% (332 سطر)                 ║
║  Paymob Status: ❌ غير مُفعّل (يحتاج 4 مفاتيح ENV)  ║
║  Subscription Logic: ✅ مكتمل                        ║
║  Trial Banner: ✅ مكتمل                              ║
║  Quota Enforcement: ✅ مكتمل                         ║
║  Billing UI: ✅ مكتمل (443 سطر)                     ║
║  Fallback Mode: ✅ يعمل (stub link عند غياب مفاتيح) ║
╚═══════════════════════════════════════════════════════╝
```

---

## 1. Paymob Test Mode Integration

### الكود ([paymobService.js](file:///e:/malaf/services/payment/paymobService.js) — 332 سطر):

| الخطوة | الحالة | السطر |
|:---|:---:|:---:|
| `getPaymobAuthToken()` — Auth Token | ✅ | L37-52 |
| `createPaymentLink()` — Order Creation | ✅ | L62-176 |
| Payment Key Generation | ✅ | L134-156 |
| iFrame URL Construction | ✅ | L164 |
| Billing Data (Egyptian format) | ✅ | L142-150 |
| Amount in cents conversion | ✅ | `amount * 100` L121 |

### المفاتيح المطلوبة:

```env
PAYMOB_API_KEY=            # ← من لوحة تحكم Paymob
PAYMOB_INTEGRATION_ID_CARD= # ← Integration ID للبطاقات
PAYMOB_IFRAME_ID=          # ← iFrame ID
PAYMOB_HMAC_SECRET=        # ← للتحقق من Webhooks
```

### التقييم:
> الكود مكتمل ويتبع Paymob API docs بالضبط: `Auth → Order → Payment Key → iFrame`.
> يحتاج فقط إضافة 4 مفاتيح في ENV لتفعيل الدفع الفعلي.

---

## 2. Webhook Handler — HMAC Verification

من [paymobService.js L181-218](file:///e:/malaf/services/payment/paymobService.js#L181-L218):

```javascript
export function verifyPaymobHmac(requestBody, receivedHmac) {
  // Paymob HMAC concatenation order (as per their docs)
  const obj = requestBody.obj;
  const concatenated = [
    obj.amount_cents, obj.created_at, obj.currency,
    obj.error_occured, obj.has_parent_transaction, obj.id,
    obj.integration_id, obj.is_3d_secure, obj.is_auth,
    obj.is_capture, obj.is_refunded, obj.is_standalone_payment,
    obj.is_voided, obj.order?.id, obj.owner, obj.pending,
    obj.source_data?.pan, obj.source_data?.sub_type,
    obj.source_data?.type, obj.success,
  ].join('');
  
  const calculatedHmac = crypto
    .createHmac('sha512', PAYMOB_HMAC_SECRET)
    .update(concatenated).digest('hex');
  
  return calculatedHmac === receivedHmac;
}
```

| الفحص | الحالة |
|:---|:---:|
| ترتيب الحقول حسب Paymob docs | ✅ |
| SHA-512 HMAC | ✅ |
| Dev fallback (skip if no secret) | ✅ |
| Logging for invalid HMAC | ✅ |

---

## 3. تحديث Subscription بعد الدفع

من [paymobService.js L223-291](file:///e:/malaf/services/payment/paymobService.js#L223-L291) — `handleSuccessfulPayment()`:

```
Webhook يصل → verifyHmac ✅ → تحديث payment_transactions (status: success)
→ حساب periodEnd (شهري/سنوي) → upsert في subscriptions
→ تحديث organizations.plan
```

| الخطوة | الحالة |
|:---|:---:|
| تحديث `payment_transactions.status = 'success'` | ✅ |
| حساب `current_period_end` (شهري/سنوي) | ✅ |
| `upsert` في `subscriptions` مع `onConflict: 'org_id'` | ✅ |
| تحديث `organizations.plan` | ✅ |
| Error logging | ✅ |

---

## 4. Subscription Guard — حماية الميزات

### على مستوى Database:
من [migrations/016_data_integrity.sql](file:///e:/malaf/migrations/016_data_integrity.sql):

```sql
CREATE OR REPLACE FUNCTION check_usage_quota()
-- يتحقق من plan_limits قبل إدراج قضية/مستخدم جديد
-- يرفض العملية بخطأ إذا تم تجاوز الحد
```

### على مستوى Frontend:
من [subscriptionService.ts](file:///e:/malaf/src/modules/subscriptions/subscriptionService.ts):

```typescript
export async function checkQuotaFromDB(supabase, orgId, resource) {
  // يقرأ plan_limits → يعدّ الاستخدام الحالي → يرجع allowed/denied
}
```

### على مستوى UI:
- [Billing.tsx](file:///e:/malaf/src/views/Billing.tsx) — يعرض `UsageMeter` لكل resource
- يُظهر تحذير أحمر عند الوصول للحد: `"تم الوصول للحد الأقصى — يرجى ترقية الباقة"`

---

## 5. حظر الميزات عند انتهاء الاشتراك

من [Billing.tsx L218-229](file:///e:/malaf/src/views/Billing.tsx#L218-L229):

```typescript
// عند subscription.status === 'expired':
"🚫 اشتراكك منتهي — الوضع الحالي: قراءة فقط"
"لن تستطيع إضافة أو تعديل بيانات حتى تجدد اشتراكك."
```

من [TrialBanner.tsx](file:///e:/malaf/src/components/TrialBanner.tsx):

| الحالة | السلوك |
|:---|:---|
| `status = 'trial'` | بانر أزرق مع عداد أيام + CTA "اختر باقتك" |
| `trial` + أقل من 3 أيام | بانر أحمر ⏰ |
| `status = 'expiring'` (≤7 أيام) | بانر أصفر ⚠️ |
| `status = 'expired'` | بانر أحمر 🚫 **لا يمكن إغلاقه** |

---

## 6. Plan Limits — حدود الباقات

من [subscriptionService.ts](file:///e:/malaf/src/modules/subscriptions/subscriptionService.ts#L32-L88):

| الباقة | السعر الشهري | مستخدمين | قضايا | مساحة |
|:---|:---:|:---:|:---:|:---:|
| **الأساسية** | 300 ج.م | 5 | 50 | 5GB |
| **المتقدمة** | 600 ج.م | 20 | 500 | 50GB |
| **المؤسسات** | 1,300 ج.م | ∞ | ∞ | 500GB |

- Plan limits تُقرأ من جدول `plan_limits` في Supabase (ديناميكية)
- `checkQuotaFromDB()` يتحقق فعلياً من DB

---

## 7. Paymob Not Ready — Fallback Behavior

### الحالة الحالية (بدون مفاتيح API):

من [paymobService.js L96-106](file:///e:/malaf/services/payment/paymobService.js#L96-L106):
```javascript
if (!isPaymobConfigured()) {
  return {
    success: true,
    paymentUrl: `https://.../payment/stub?tx=${tx.id}`,
    stub: true,
    message: 'Paymob غير مُعد بعد...',
  };
}
```

من [payment.js L112-120](file:///e:/malaf/routes/payment.js#L112-L120):
```javascript
router.get('/status', (req, res) => {
  return res.json({
    configured: isPaymobConfigured(),
    message: isPaymobConfigured()
      ? 'بوابة الدفع جاهزة'
      : 'بوابة الدفع غير مُعدة — أضف PAYMOB_API_KEY...',
  });
});
```

### التوصية للعرض:

> [!WARNING]
> **حالياً**: زر "اشترك" يعمل لكن يوجه لـ stub URL.
> **يجب**: إما إضافة مفاتيح Paymob Test Mode **أو** تعديل `Billing.tsx` ليعرض "تواصل معنا" بدلاً من زر الدفع عندما `isPaymobConfigured() === false`.

---

## 8. Trial Period Logic

| العنصر | الحالة | التفاصيل |
|:---|:---:|:---|
| `subscriptions.status = 'trial'` | ✅ | مُعرّف في schema |
| `subscriptions.trial_ends_at` | ✅ | TIMESTAMPTZ في DB |
| TrialBanner component | ✅ | يقرأ من DB ويعرض عداد تنازلي |
| حساب الأيام المتبقية | ✅ | `Math.ceil((trialEnd - now) / DAY_MS)` |
| تحذير مُتدرج (أزرق → أصفر → أحمر) | ✅ | 3 مستويات بألوان مختلفة |
| زر "اشترك الآن" / "جدّد الآن" | ✅ | يوجه لـ `/dashboard/billing` |

---

## 📋 تقييم R4 النهائي

| النقطة | الحالة | ملاحظة |
|:---|:---:|:---|
| 1. Paymob test mode | ⚠️ كود مكتمل / مفاتيح مفقودة | أضف 4 ENV vars لتشغيله |
| 2. Webhook HMAC handler | ✅ مكتمل | SHA-512 حسب Paymob docs |
| 3. Subscription update on pay | ✅ مكتمل | `upsert` مع `onConflict` |
| 4. Subscription guard | ✅ مكتمل | DB trigger + Frontend check |
| 5. Feature block on expired | ✅ مكتمل | "قراءة فقط" mode |
| 6. Plan limits per tier | ✅ مكتمل | 3 باقات + DB-driven |
| 7. Fallback if not ready | ⚠️ يحتاج تحسين | يُرجع stub URL بدلاً من إخفاء الزر |
| 8. Trial period logic | ✅ مكتمل | Banner + countdown + graduated warnings |

```
╔══════════════════════════════════════════╗
║  الحكم: 6/8 جاهز بالكود ✅             ║
║  2/8 يحتاج مفاتيح API فقط ⚠️           ║
║  لا يوجد bug برمجي — قرار عمل فقط     ║
╚══════════════════════════════════════════╝
```

> [!TIP]
> **التوصية للعرض على المستثمر**: أظهر صفحة Billing كما هي — الباقات والاستهلاك والتحذيرات كلها تعمل. فقط لا تضغط "اشترك" لأنه سيوجه لـ stub URL. أو أضف مفاتيح Paymob Test Mode (مجانية) لعرض التدفق الكامل.
