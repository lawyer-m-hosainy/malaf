# Demo Deployment Guide (Non-Technical Friendly)

## 1) المتطلبات
- حساب GitHub.
- حساب Vercel مجاني.
- مشروع Git مربوط بهذا المستودع.

## 2) إعداد Secrets في GitHub
اذهب إلى: `Settings -> Secrets and variables -> Actions` وأضف:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `GEMINI_API_KEY`

> لا تضع أي secrets داخل الكود أو `.env` في المستودع.

## 3) تشغيل النشر
1. افتح تبويب **Actions**.
2. اختر Workflow باسم **Deploy Demo**.
3. اضغط **Run workflow**.
4. انتظر نجاح job `deploy-vercel`.

## 4) التحقق بعد النشر
- افتح رابط Vercel.
- تحقق من:
  - تسجيل الدخول.
  - عرض لوحة التحكم.
  - صفحة القضايا.
  - رفع مستند تجريبي.
  - Endpoint الصحة: `/api/health`.

## 5) Rollback سريع
1. افتح Vercel Dashboard -> Deployments.
2. اختر آخر نسخة مستقرة.
3. اضغط **Promote to Production**.
4. أعد التحقق من `/api/health`.

## 6) خطة آمنة لبيانات الديمو
- استخدم tenant ديمو مستقل (`demo-tenant`).
- لا تستخدم بيانات عملاء حقيقية.
- قم بإعادة seed قبل العرض.
