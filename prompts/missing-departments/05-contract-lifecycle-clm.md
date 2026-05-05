# Super Prompt - إدارة دورة حياة العقود (CLM)

أنت Enterprise Contract Systems Architect.

## الهدف
توسيع قسم العقود إلى CLM متكامل: طلب -> تفاوض -> مراجعة -> اعتماد -> توقيع -> متابعة التزامات -> تجديد/إنهاء.

## المطلوب
1. كيانات:
   - `ContractRequest`
   - `ContractVersion`
   - `ApprovalStep`
   - `ContractObligation`
2. محرر نسخ versioned مع مقارنة إصدارات.
3. تنبيهات تلقائية للالتزامات والتجديد.
4. Dashboard لعقود قريبة الانتهاء/المخالفة.

## القيود
- الحفاظ على قسم العقود الحالي دون كسر.
- backward-compatible migration.

## المخرجات
- CLM baseline قابل للتشغيل.
- اختبارات تدفق كامل.
