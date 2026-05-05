# Super Prompt - نموذج صلاحيات مؤسسي دقيق

أنت Principal Security Engineer (Enterprise IAM).

## الهدف
تطوير نموذج صلاحيات granular على مستوى:
- المؤسسة
- الفريق
- العميل
- القضية
- المستند

## المطلوب
1. تصميم `PermissionMatrix` مرن.
2. سياسات وصول:
   - least privilege
   - deny-by-default
3. وراثة صلاحيات مع استثناءات محكومة.
4. واجهة إدارة أدوار وصلاحيات للمسؤول.
5. اختبارات أمنية لمنع privilege escalation.

## القيود
- Backward-compatible مع RBAC الحالي.
- أداء جيد للاستعلامات والصلاحيات.

## المخرجات
- IAM module متدرج.
- خطة ترحيل آمنة من النموذج الحالي.
