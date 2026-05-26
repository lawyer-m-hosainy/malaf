# API Migration Guide — From v1 to v2

هذا المستند يوفر دليلاً للمطورين والشركاء للترقية من الإصدار الأول `v1` إلى الإصدار الثاني `v2` من واجهة برمجة التطبيقات (API) لمنصة **ملف**.

---

## 1. التغييرات الرئيسية (Key Differences)

يركز الإصدار `v2` على تحسين أداء استرجاع القوائم الكبيرة ودعم الترقيم القائم على المؤشر (Cursor-based Pagination) بدلاً من الترقيم القائم على الإزاحة والصفحات (Offset-based Pagination).

| الميزة | الإصدار الأول `v1` | الإصدار الثاني `v2` |
|---|---|---|
| **مسار استعلام القضايا** | `/api/v1/cases` | `/api/v2/cases` |
| **آلية تقسيم الصفحات** | Offset & Page (`?page=2&per_page=20`) | Cursor-based (`?cursor=eyJpZCI6NDU2fQ&limit=20`) |
| **هيكل الاستجابة** | مصفوفة مباشرة أو كائن يحتوي على `meta` | كائن موحد ببيانات الاستجابة ومعلومات المؤشر |
| **تنسيق التاريخ والوقت** | `YYYY-MM-DD HH:mm:ss` | ISO 8601 UTC (`YYYY-MM-DDTHH:mm:ss.sssZ`) |

---

## 2. مقارنة الهيكل البرمجي (Payload Diffs)

### 🔴 طلب القضايا في الإصدار v1:
`GET /api/v1/cases?page=1&per_page=2`

**الاستجابة (Response):**
```json
{
  "data": [
    {
      "id": "7649-abc",
      "title": "دعوى صحة توقيع عقد بيع",
      "status": "متداولة",
      "created_at": "2026-05-01 12:30:00"
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "per_page": 2
  }
}
```

---

### 🟢 طلب القضايا في الإصدار v2:
`GET /api/v2/cases?limit=2`

**الاستجابة (Response):**
```json
{
  "cases": [
    {
      "id": "7649-abc",
      "case_title": "دعوى صحة توقيع عقد بيع",
      "case_status": "متداولة",
      "created_timestamp": "2026-05-01T12:30:00.000Z"
    }
  ],
  "pagination": {
    "next_cursor": "eyJpZCI6IjIifQ==",
    "has_more": true,
    "total_count": 150
  }
}
```

---

## 3. تعديل كود العميل (Client Code Migration Example)

### الكود القديم (v1 - Axios Example):
```javascript
async function getCases(page = 1) {
  const response = await axios.get(`/api/v1/cases`, {
    params: { page, per_page: 20 }
  });
  return response.data.data; // مصفوفة القضايا
}
```

### الكود الجديد (v2 - Axios Example):
```javascript
async function getCases(cursor = null) {
  const response = await axios.get(`/api/v2/cases`, {
    params: { 
      cursor: cursor,
      limit: 20 
    }
  });
  
  return {
    cases: response.data.cases,
    nextCursor: response.data.pagination.next_cursor,
    hasMore: response.data.pagination.has_more
  };
}
```
