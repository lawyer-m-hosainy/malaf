# Phase 12 - Investor Demo Readiness

## 1) Target Free Hosting Stack
- **Frontend + API proxy:** Vercel (free tier).
- **Primary data/auth/storage:** Firebase (already integrated).
- **Optional error tracking:** Sentry free.
- **Optional uptime:** UptimeRobot free monitor on `/api/health`.

## 2) Secrets & Environment Baseline
Configure in hosting/CI only:
- `GEMINI_API_KEY`
- `DEMO_ADMIN_EMAIL`
- `DEMO_ADMIN_PASSWORD`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## 3) Demo Data Operations (One-Click Equivalent)
- Seed demo data:
  - `npm run demo:seed`
- Reset demo tenant data:
  - `npm run demo:reset`
- Tenant used for demo isolation:
  - `demo-tenant`

> السكربتات تتطلب حساب أدمن ديمو صالح عبر Firebase Auth.

## 4) Demo Accounts Strategy
- حساب Admin Demo وحيد لإدارة العرض.
- حسابات عميل/موظف تجريبية للسيناريوهات.
- جميع الحسابات تحمل disclaimer واضح أنها بيانات تجريبية.

## 5) SSL / Branding
- تفعيل نطاق احترافي على Vercel (CNAME).
- إجبار HTTPS فقط.
- إعداد رابط قصير مخصص للعرض (اختياري).

## 6) Stability Checklist Before Investor Call
- [ ] `npm run lint` ناجح.
- [ ] `npm run build` ناجح.
- [ ] `/api/health` يرجع `status: ok`.
- [ ] login -> dashboard -> cases -> upload يعمل.
- [ ] AI endpoint يعمل بدون كشف أي secret للعميل.

## 7) Rollback & Backup
- Rollback: Promote previous stable deployment in Vercel.
- Backup:
  - Snapshot يدوي قبل العرض (Firestore export أو JSON dump حسب البيئة).
  - الاحتفاظ بنسخة بيانات ديمو baseline لإعادة التحميل السريع.

## 8) Non-Technical Founder Run Steps (5 دقائق)
1. افتح GitHub -> Actions -> `Deploy Demo` -> Run.
2. بعد النجاح، افتح الرابط المنشور.
3. شغل `npm run demo:reset` ثم `npm run demo:seed`.
4. تحقق من `/api/health`.
5. ابدأ العرض بالسيناريو المعد مسبقًا.
