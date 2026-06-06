# ✅ قائمة تحقق النشر — منصة مَلَف

> استخدم هذه القائمة قبل وبعد كل نشر لضمان جاهزية المنصة.

---

## 🔧 قبل النشر (Pre-deploy)

### الكود
- [ ] `npm run build` يمر بدون errors
- [ ] `npm test` يمر بدون failures
- [ ] لا يوجد `console.log` زائد في كود production
- [ ] لا يوجد مفاتيح مكشوفة (hardcoded secrets)

### قاعدة البيانات
- [ ] `node scripts/check-migrations.mjs` — كل migrations مُسجّلة
- [ ] Migration الأخير مطبّق على Supabase SQL Editor
- [ ] RLS مفعّل على كل الجداول

### متغيرات البيئة في Render.com
| المتغير | الحالة | ملاحظات |
|---------|--------|---------|
| `SUPABASE_URL` | ✅ مطلوب | رابط مشروع Supabase |
| `VITE_SUPABASE_URL` | ✅ مطلوب | نفس القيمة (للـ frontend) |
| `SUPABASE_ANON_KEY` | ✅ مطلوب | Public anon key |
| `VITE_SUPABASE_ANON_KEY` | ✅ مطلوب | نفس القيمة (للـ frontend) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ مطلوب | ⚠️ سري — backend فقط |
| `SUPABASE_JWT_SECRET` | ✅ مطلوب | JWT secret |
| `ENCRYPTION_KEY` | ✅ مطلوب | 32 hex chars — تشفير البيانات |
| `VITE_ENCRYPTION_KEY` | ✅ مطلوب | نفس القيمة (للـ frontend) |
| `NODE_ENV` | ✅ مطلوب | `production` |
| `PORT` | ✅ مطلوب | `3005` |
| `VITE_SENTRY_DSN` | 🔴 يجب إضافته | من Sentry Dashboard → DSN |
| `SENTRY_AUTH_TOKEN` | 🔴 يجب إضافته | من Sentry → Auth Tokens |
| `SENTRY_ORG` | 🟡 اختياري | `malaf-pro` |
| `SENTRY_PROJECT` | 🟡 اختياري | `malaf-frontend` |
| `VITE_APP_VERSION` | 🟡 اختياري | `1.0.0` |
| `RESEND_API_KEY` | 🔴 يجب إضافته | من resend.com → API Keys |
| `SUPABASE_HOOK_SECRET` | 🔴 يجب إضافته | `openssl rand -hex 32` |

---

## 🚀 بعد النشر (Post-deploy)

### التحقق الأساسي
- [ ] افتح `https://malaf.pro` وتحقق أن الصفحة تُحمَّل
- [ ] الشعار والنصوص العربية تظهر بشكل سليم
- [ ] لا توجد أخطاء في Console

### المصادقة (Authentication)
- [ ] تسجيل دخول بـ Google OAuth يعمل
- [ ] تسجيل دخول بالبريد الإلكتروني يعمل
- [ ] تسجيل حساب جديد ينشئ مكتب تلقائياً
- [ ] نسيان كلمة المرور يرسل email

### الوظائف الأساسية
- [ ] لوحة القيادة (Dashboard) تُحمَّل بالبيانات
- [ ] إضافة موكل جديد تعمل
- [ ] إضافة قضية جديدة تعمل
- [ ] البحث يعمل

### المراقبة (Monitoring)
- [ ] تحقق من Sentry Dashboard أن events تصل
- [ ] لا يوجد أخطاء 500 في Render logs

---

## 🔄 إعدادات خارجية (تحتاج تحديث عند تغيير النطاق)

### Supabase Dashboard
- **Authentication → URL Configuration**
  - Site URL: `https://malaf.pro`
  - Redirect URLs: `https://malaf.pro/**`, `https://www.malaf.pro/**`, `https://malaf.onrender.com/**`

### Google Cloud Console
- **OAuth 2.0 Client**
  - Authorized JS origins: `https://malaf.pro`, `https://www.malaf.pro`
  - Authorized redirect URIs: `https://malaf.pro/login`, `https://www.malaf.pro/login`

### Hostinger (DNS)
- A record: `@` → `216.24.57.1`
- CNAME record: `www` → `malaf.onrender.com`

---

*آخر تحديث: يونيو 2026*
