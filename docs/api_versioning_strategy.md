# API Versioning Strategy — malaf.pro

منصة **ملف** تتبنى معايير صارمة لإصدارات واجهة برمجة التطبيقات (API Versioning) لضمان عدم حدوث أي أعطال برمجية أو انقطاعات للعملاء (Clients/Integrators) عند تطوير أو تعديل المنصة.

---

## 1. استراتيجية الإصدارات المعتمدة (Versioning Strategy)

نحن نستخدم **URL Path Versioning** لكونه الخيار الأسهل في التطوير والتتبع والتسيير (Routing).

```bash
# الإصدار الحالي المستقر (Active Production Version)
https://malaf.pro/api/v1/cases

# الإصدارات المستقبلية
https://malaf.pro/api/v2/cases
```

### أسباب اختيار URL Path Versioning:
1. **سهولة تتبع الأخطاء (Easy Debugging)**: يمكن قراءة ومعرفة إصدار الطلب فوراً من خلال سجلات الخادم (Server Logs) أو أدوات تتبع الشبكة (Network Tab).
2. **التوجيه البسيط (Simple Routing)**: متوافق مع كافة أنظمة الـ Routers على مستوى خوادم Edge Functions أو بوابات الـ Gateway.
3. **وضوح التوثيق (Clear Documentation)**: يسهل فصل وثائق OpenAPI لكل إصدار على حدة.

---

## 2. تعريف التغييرات (Breaking vs Non-Breaking Changes)

لتجنب رفع رقم الإصدار (Major Version) بلا داعٍ، نلتزم بالتعريفات التالية للتفرقة بين التعديلات الآمنة والمدمرة:

### ✅ التغييرات الآمنة (Non-Breaking Changes — لا تحتاج إصدار جديد):
* إضافة مسار (Endpoint) جديد كلياً.
* إضافة حقل (Field) اختياري جديد في الـ JSON Response.
* إضافة معامل بحث اختياري (Optional Query Parameter).
* إضافة رمز حالة نجاح إضافي (مثال: دعم `201 Created` بجانب `200 OK`).
* تحسين الأداء الداخلي طالما لم يتغير الهيكل العام للمخرجات أو منطق العمل الأساسي.

### ❌ التغييرات المدمرة (Breaking Changes — تتطلب رفع الإصدار إلى v2):
* حذف أو إعادة تسمية مسار (Endpoint) موجود (مثال: تغيير `/cases` إلى `/lawsuits`).
* حذف حقل موجود من الـ JSON Response.
* تغيير اسم حقل موجود (مثال: تغيير `client_id` إلى `clientId`).
* تغيير نوع الحقل (مثال: تحويل معرف من نوع `number` إلى `string`).
* تغيير هيكلية استجابة الـ JSON (Response Structure) (مثال: تحويل مصفوفة مسطحة إلى كائن يحتوي على حقل `data`).
* جعل المعاملات الاختيارية (Query Parameters) إلزامية في الطلب.
* تغيير معنى أو سلوك أحد رموز الحالة (Status Codes) (مثال: إرجاع `400 Bad Request` بدلاً من `404 Not Found` لعمليات البحث الفارغة).

---

## 3. هيكل الـ Router وإدارة المسارات المتعددة

يتم تنظيم المسارات داخل Supabase Edge Functions أو خوادم التوجيه بطريقة تدعم تعدد الإصدارات في نفس الوقت:

```
supabase/functions/
├── api-v1/
│   ├── cases/
│   │   └── index.ts   # يحتوي على منطق الإصدار v1
│   └── clients/
│       └── index.ts
└── api-v2/
    ├── cases/
    │   └── index.ts   # يحتوي على منطق الإصدار v2 (مثال: دعم pagination متقدم)
    └── clients/
        └── index.ts
```

في حالة وجود تغييرات طفيفة بين الإصدارين، يتم تمرير منطق المعالجة الأساسي إلى خدمة مشتركة (Shared Service) مع استخدام محول استجابة (Response Adapter) لتنسيق مخرجات كل إصدار.
