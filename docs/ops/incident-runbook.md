# Incident Runbook (Demo + Early Production)

## 1) اكتشاف الحادث
- راقب logs بعلامة `[OBS]`.
- افحص `healthcheck_failed` أو `window_error` أو `unhandled_rejection`.
- تحقق من `/api/health` للتأكد من سلامة الخدمة.

## 2) تصنيف الأولوية
- **P1**: توقف تسجيل الدخول/تعطل شامل/تسريب بيانات.
- **P2**: تعطل جزئي في وحدة أساسية (القضايا/المستندات).
- **P3**: أخطاء غير حرجة مع وجود workaround.

## 3) الاستجابة السريعة
1. ثبّت النسخة الحالية (وقف أي نشر جديد).
2. اجمع `requestId` ووقت الحادث.
3. تحقّق من اتصال Firebase/Auth/Storage.
4. نفّذ rollback لآخر نسخة مستقرة إذا كان الحادث P1.

## 4) التحقق بعد الإصلاح
- `npm run lint`
- `npm run build`
- اختبار تدفقات: login -> dashboard -> cases -> upload document
- تأكيد رجوع `/api/health` إلى `status: ok`

## 5) ما بعد الحادث
- تدوين السبب الجذري (RCA) خلال 24 ساعة.
- إضافة test أو guard يمنع تكرار الخطأ.
- تحديث checklist الأمن/الاستقرار.
