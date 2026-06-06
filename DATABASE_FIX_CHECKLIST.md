# ✅ DATABASE FIX CHECKLIST — منصة مَلَف
# قائمة التحقق من نجاح إصلاح قاعدة البيانات

## الخطوة 1: تشغيل ملف الإصلاح
- [ ] انسخ محتوى `supabase/migrations/029_complete_database_fix.sql`
- [ ] افتح [Supabase Dashboard](https://supabase.com/dashboard) → مشروع مَلَف
- [ ] اذهب إلى **SQL Editor**
- [ ] الصق الكود وشغّله
- [ ] **يجب أن يكتمل بدون أي أخطاء** (تحذيرات NOTICE عن جداول غير موجودة طبيعية)

## الخطوة 2: التحقق من الجداول
- [ ] افتح **Table Editor** وتأكد من وجود جدول `subscriptions`
- [ ] تأكد من وجود جدول `usage_limits`
- [ ] تأكد من وجود عمود `organization_id` في جدول `profiles`
- [ ] تأكد من وجود عمود `onboarding_completed` في جدول `organizations`

## الخطوة 3: اختبار تسجيل مستخدم جديد
- [ ] سجّل خروج من أي حساب موجود
- [ ] سجّل دخول بحساب Google OAuth **جديد** (لم يُستخدم من قبل)
- [ ] تحقق في **Table Editor → profiles** أن المستخدم الجديد لديه `org_id` و `organization_id`
- [ ] تحقق في **Table Editor → organizations** أن هناك مكتب جديد تم إنشاؤه
- [ ] تحقق في **Table Editor → subscriptions** أن هناك اشتراك تجريبي

## الخطوة 4: اختبار API
- [ ] `GET /rest/v1/profiles?id=eq.{user_id}` → يرجع 200 مع بيانات المستخدم
- [ ] `GET /rest/v1/organizations` → يرجع المكتب الخاص بالمستخدم
- [ ] `POST /rest/v1/organizations` → يرجع 201 (لو حاولت إنشاء مكتب ثانٍ)
- [ ] `GET /rest/v1/subscriptions` → يرجع الاشتراك التجريبي
- [ ] `GET /rest/v1/usage_limits` → يرجع حدود الاستخدام

## الخطوة 5: اختبار الواجهة
- [ ] Dashboard يفتح بدون أخطاء في الـ Console
- [ ] لا توجد أخطاء `PGRST205` (table not in schema cache)
- [ ] لا توجد أخطاء `42501` (RLS violation)
- [ ] لا توجد أخطاء `PGRST204` (table not found)

## الخطوة 6: التأكد من عدم كسر المستخدمين الحاليين
- [ ] سجّل دخول بحساب مستخدم قديم (موجود مسبقاً)
- [ ] تأكد أن Dashboard يفتح بشكل طبيعي
- [ ] تأكد أن القضايا والموكلين يظهرون بشكل صحيح

---

## ⚠️ ملاحظات مهمة

1. **الملف آمن للتشغيل عدة مرات** (idempotent) — يستخدم `DROP IF EXISTS` و `CREATE ... IF NOT EXISTS`
2. **لا يحذف أي بيانات** — فقط يضيف جداول وسياسات جديدة
3. **لا يغيّر بنية الجداول الموجودة** — فقط يضيف أعمدة مفقودة بـ `ADD COLUMN IF NOT EXISTS`
4. **بعد تشغيل الملف**: تأكد أن Render.com أعاد النشر (أو أعد النشر يدوياً)
