# Remaining Phases (Numbered)

هذا الملف يحفظ المراحل المتبقية بصيغة مرقمة لتسهيل التنفيذ داخل المشروع.

## 03 - Architecture Refactor Lite
فصل منطق الأعمال عن الواجهات تدريجيًا إلى `application/use-cases` و`repositories` بدون كسر السلوك الحالي.

## 04 - Data Migration from Mock to Firestore
نقل الكيانات الأساسية (clients/cases/tasks/documents metadata) إلى CRUD فعلي مع fallback آمن.

## 05 - Multi-Tenant Isolation
فرض `tenantId` إلزامي بكل كيان واستعلام وتحديث قواعد Firestore لمنع أي cross-tenant leakage.
الحالة: تم تنفيذ الأساس (tenant-aware queries + tenantId writes + rules checks) ويُنصح بجولة تدقيق claims/seed للانتقال الكامل للإنتاج.

## 06 - Document & Upload Security
تقييد نوع/حجم الملفات، تنظيم المسارات حسب tenant/case، وإضافة تتبع تدقيق للرفع والتنزيل.
الحالة: تم تنفيذ أساس الحماية (validation + tenant-scoped path + upload audit + storage rules baseline).

## 07 - Legal Workflow Integrity
تثبيت دورة حياة القضية (open -> pleadings -> hearings -> judgment -> close) مع SLA للتنبيهات.
الحالة: تم تنفيذ أساس integrity (workflow stage mapping + transition guard + deadline date guard + overdue highlighting).

## 08 - Frontend Hardening & Performance
تحسين A11y، تقليل bundle، lazy routes، وتوحيد حالات loading/error/empty.
الحالة: تم تنفيذ baseline (lazy-loaded routes + suspense fallback + a11y aria labels أساسية).

## 09 - Observability & Reliability
إضافة Sentry وhealth checks وrunbook للحوادث لتقليل مخاطر الديمو.
الحالة: تم تنفيذ baseline (global error logging + health endpoint/check + incident runbook).

## 10 - CI/CD & Demo Infrastructure
Pipeline نشر تلقائي مع secrets management وrollback واضح.
الحالة: تم تنفيذ baseline (Dockerfile + deploy workflow + دليل نشر/rollback للديمو).

## 11 - Comprehensive QA & Stability
اختبارات smoke/regression/edge مع Bug matrix أولويات (Critical/High/Medium/Low).
الحالة: تم تنفيذ baseline (fixes حرجة + bug matrix موثق + remediation priorities).

## 12 - Investor Demo Readiness
تهيئة hosting مجاني احترافي، seed/reset demo data، ومراقبة الاستقرار أثناء العرض.
الحالة: تم تنفيذ baseline (demo seed/reset scripts + investor demo readiness guide + rollback/backup checklist).

## 13 - Strategic Product & Security Expansion
خطة 6-12 شهر: RBAC متقدم، امتثال، ميزات AI قانونية مدعومة بالمراجع، وتسعير SaaS.
الحالة: تم تنفيذ baseline (strategic roadmap مفصل 6-12 شهر + KPIs + GTM + risk mitigation).
