# Security Checklist After Each Change

## A) Access Control
- [ ] لا يوجد bypass مبني على email hardcoded.
- [ ] صلاحيات Firestore تعتمد على role/claims فقط.
- [ ] أي Route حساس يستخدم `ProtectedRoute` مع roles عند الحاجة.

## B) Secrets & AI
- [ ] لا يوجد تعريض لـ `GEMINI_API_KEY` في الكود العميل.
- [ ] كل طلبات AI تمر عبر endpoint خادمي.
- [ ] الردود الخطأ من AI لا تكشف تفاصيل مزود الخدمة.

## C) Data Protection
- [ ] لا يتم تسجيل بيانات قانونية حساسة في logs.
- [ ] لا يتم إرجاع تفاصيل داخلية للمستخدم النهائي.
- [ ] رفع الملفات مقيّد بقواعد storage وصلاحيات واضحة.

## D) Verification Commands
- [ ] `npm run lint` ينجح.
- [ ] `npm run build` ينجح.
- [ ] مراجعة سريعة لمسارات Firestore rules المتأثرة.

## E) Demo Backward Compatibility
- [ ] حساب الديمو ما زال قادرًا على الوصول المتوقع.
- [ ] الصلاحيات الجديدة لا تكسر تدفقات العرض.
