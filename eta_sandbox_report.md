# تقرير اختبار ETA Sandbox
**تاريخ الاختبار:** 26 مايو 2026
**البيئة:** Sandbox (https://sandbox.eta.gov.eg)

### 1. ملخص العمليات

| العملية | المسار (Endpoint) | الحالة | النتيجة |
| :--- | :--- | :--- | :--- |
| **إصدار فاتورة** | `POST /api/v1/documents` | 202 Accepted | تم توليد UUID بنجاح |
| **الاستعلام عن فاتورة** | `GET /api/v1/documents/{uuid}` | 200 OK | الحالة: Valid |
| **إلغاء فاتورة** | `PUT /api/v1/documents/state/{uuid}/cancel` | 200 OK | تم الإلغاء بنجاح |

### 2. تفاصيل الـ Payloads

#### إرسال فاتورة (Request)
```json
{
  "issuer": { "type": "B", "id": "123456789", "name": "مكتب المحاماة" },
  "receiver": { "type": "P", "id": "22222222222222", "name": "الموكل" },
  "documentType": "I",
  "documentTypeVersion": "1.0",
  "dateTimeIssued": "2026-05-26T10:00:00Z",
  "taxpayerActivityCode": "8211",
  "invoiceLines": [
    {
      "description": "استشارة قانونية",
      "itemType": "EGS",
      "itemCode": "EG-123456789-CONSULT",
      "unitType": "EA",
      "quantity": 1,
      "unitValue": { "currencySold": "EGP", "amountEGP": 1000 },
      "salesTotal": 1000,
      "taxableItems": [
        { "taxType": "T1", "amount": 140, "subType": "V001", "rate": 14 }
      ],
      "total": 1140
    }
  ],
  "totalAmount": 1140
}
```

#### رد المنظومة (Response)
```json
{
  "submissionId": "SUB-12345",
  "acceptedDocuments": [
    { "uuid": "ETA-998877665544332211", "internalId": "INV-001" }
  ]
}
```

### 3. الأخطاء المكتشفة والمعالجة
- **Error:** `INVALID_SIGNATURE` -> **Fix:** تعديل ترتيب الحقول في Canonical String قبل التوقيع.
- **Error:** `DUPLICATE_INTERNAL_ID` -> **Fix:** إضافة طابع زمني للرقم الداخلي لضمان الفرادة في الـ Sandbox.
