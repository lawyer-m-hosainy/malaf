# ⚖️ تقرير المراجعة الشاملة — منصة مَلَف للإدارة القانونية (الجزء ١)

## 📊 نتيجة الصحة العامة للمنصة: 38/100
### الويب: 45/100 | Firebase/Supabase: 30/100 | الأمان: 25/100

---

## 1. الملخص التنفيذي

> [!CAUTION]
> المنصة تعاني من **تناقض معماري جوهري**: الكود يستخدم **Supabase** كقاعدة بيانات رئيسية بينما التوثيق والـ README يدّعي استخدام **Firebase Firestore**. هذا التناقض يُضعف مصداقية المنصة أمام المستثمرين بشكل حرج.

### الاكتشافات الحرجة (Critical Findings):
1. **ازدواجية قواعد البيانات** — `legalDataService.ts` يستخدم Supabase بينما `AuthProvider.tsx` يستخدم Firebase Auth + Firestore
2. **مفتاح API مكشوف في `.env`** — مفتاح Groq API مكشوف بقيمة حقيقية في ملف `.env` الملتزم بـ Git
3. **بقايا سعودية (Saudi remnants)** — `validation.ts` يحتوي على `formatSaudiPhone` ورقم هاتف سعودي `+966`
4. **مفتاح التشفير مكشوف في المتصفح** — `VITE_ENCRYPTION_KEY` يُنشر في bundle العميل
5. **قواعد Firestore ناقصة** — فقط 4 collections مغطاة من أصل 18+
6. **لا توجد فهارس كافية** — 4 فهارس فقط

---

## 2. المرحلة R1 — فهم النظام (System Understanding)

### هيكل المشروع
```
malaf/
├── src/
│   ├── App.tsx              ← Router رئيسي (39 مسار)
│   ├── views/               ← 39 شاشة + مجلدين فرعيين
│   ├── store/               ← 18 Zustand store
│   ├── services/            ← خدمات البيانات + AI
│   ├── components/          ← مكونات مشتركة + UI
│   ├── types/               ← 10 ملفات أنواع TypeScript
│   ├── domain/              ← منطق أعمال + schemas
│   ├── security/            ← RBAC
│   └── lib/                 ← أدوات مساعدة
├── server.js                ← خادم AI (Express + Gemini)
├── firestore.rules          ← قواعد أمان Firestore (ناقصة)
├── storage.rules            ← قواعد تخزين Firebase
└── supabase-schema.sql      ← مخطط Supabase (المستخدم فعلياً)
```

### مصفوفة اكتمال الوحدات

| الوحدة | الكود | قاعدة البيانات | التشفير | الملاحظات |
|--------|-------|----------------|---------|-----------|
| M01 Auth | ⚠️ | ✅ Firebase Auth | — | يعمل مع Firebase Auth لكن الملف الشخصي في Firestore |
| M02 Clients | ⚠️ | ⚠️ Supabase | ⚠️ | التشفير مطبق جزئياً (nationalId + commercialReg فقط) |
| M03 Cases | ⚠️ | ⚠️ Supabase | ❌ | لا يوجد تشفير على بيانات القضايا الحساسة |
| M04 Sessions | ⚠️ | ⚠️ Supabase | ❌ | بيانات وهمية مدمجة في الكود |
| M05 Documents | ⚠️ | ⚠️ Firebase Storage | ❌ | رفع الملفات موجود لكن غير مختبر |
| M06 Finance | ⚠️ | ⚠️ Supabase | ❌ | المبالغ المالية غير مشفرة |
| M07 Calendar | ✅ | ❌ محلي فقط | — | يعمل محلياً بدون حفظ |
| M08 POA | ✅ | ❌ محلي فقط | ❌ | تنبيهات الانتهاء موجودة |
| M09 Client Portal | ⚠️ | ⚠️ Firestore | ❌ | يستخدم Firestore مباشرة (ليس Supabase) |
| M10 Analytics | ✅ | ❌ محلي | — | واجهة عرض فقط |
| M11 Team | ⚠️ | ❌ محلي | — | بيانات وهمية فقط |
| M12 AI Assistant | ⚠️ | — | — | Groq مكشوف في العميل! |
| M13 AI Contracts | ⚠️ | — | — | قوالب مصرية موجودة |
| M14 AI Analyzer | ⚠️ | — | — | يعمل مع fallback |
| M15 ETA Invoice | ⚠️ | ❌ | — | واجهة فقط بدون تكامل حقيقي |
| M16 Audit Logs | ⚠️ | ⚠️ Supabase | ❌ | سجلات موجودة لكن ناقصة |
| M17 Super Admin | ⚠️ | ❌ | — | واجهة أولية |
| M18 Subscriptions | ⚠️ | ❌ | — | مرجع Moyasar (سعودي!) |

### فجوات حرجة مكتشفة:
- **React 19** مستخدم (ليس React 18 كما يُدّعى) — `"react": "^19.0.0"`
- **Supabase هو الـ backend الفعلي** لكن التوثيق يذكر Firebase Firestore
- **البيانات الوهمية مدمجة** مباشرة في Zustand stores بدلاً من جلبها من قاعدة البيانات

---

## 3. المرحلة R2 — أمان Multi-Tenant

> [!CAUTION]
> **عزل المستأجرين معطّل فعلياً** في معظم عمليات القراءة/الكتابة

### تحليل العزل:

| المكوّن | الحالة | التفاصيل |
|---------|--------|----------|
| Firestore Rules | ❌ ناقصة | فقط `clients`, `cases`, `invoices`, `audit_logs` مغطاة |
| Supabase RLS | ⚠️ معرّفة | RLS policies موجودة في SQL لكن `legalDataService.ts` لا يمرر `org_id` |
| Zustand Reset on Logout | ❌ | لا يوجد `reset()` لأي store عند تسجيل الخروج |
| office_id in queries | ❌ | `fetchClients()` و `fetchCases()` لا تستخدم أي فلتر tenant |
| Client Portal isolation | ⚠️ | يستخدم `tenantId` في Firestore queries لكن بدون التحقق الكافي |
| Encryption key isolation | ❌ | مفتاح واحد مشترك لجميع المكاتب |

### مشاكل حرجة:
1. **`fetchClients()`** في `legalDataService.ts` سطر 23: `supabase.from("clients").select("*").limit(20)` — **بدون فلتر org_id!**
2. **`fetchCases()`** سطر 98: نفس المشكلة — **يجلب قضايا جميع المكاتب**
3. **لا يوجد reset للـ stores** عند تسجيل الخروج — بيانات المكتب الأول تظل مخزنة مؤقتاً

---

## 4. المرحلة R3 — تدقيق الواجهة الوظيفية

### حالة الشاشات الرئيسية:

| الشاشة | الحالة | المشاكل | الأولوية |
|--------|--------|---------|----------|
| Landing | ✅ | — | — |
| Login | ⚠️ | يعمل مع Firebase Auth | متوسطة |
| Dashboard | ⚠️ | بيانات وهمية مدمجة | عالية |
| Clients | ⚠️ | أرقام هواتف سعودية +966 في البيانات الوهمية | حرجة |
| Cases | ⚠️ | يعمل لكن بدون حفظ حقيقي في DB | عالية |
| Sessions Roll | ⚠️ | بيانات وهمية | متوسطة |
| Finance | ⚠️ | بيانات وهمية + عدم تشفير المبالغ | عالية |
| Calendar | ✅ | يعمل محلياً | منخفضة |
| POA | ✅ | تنبيهات الانتهاء تعمل | منخفضة |
| Client Portal | ⚠️ | أرقام سعودية في البيانات | حرجة |
| AI Assistant | ⚠️ | مفتاح Groq مكشوف في bundle | حرجة |
| ETA Invoicing | ⚠️ | واجهة فقط | متوسطة |
| Audit Logs | ⚠️ | ناقصة التغطية | عالية |

---

## 5. المرحلة R4 — تدقيق قاعدة البيانات

### مخطط Supabase (المستخدم فعلياً):
- ✅ `organizations` — موجود مع RLS
- ✅ `profiles` — مع `org_id`
- ✅ `clients` — مع `org_id` + `national_id` مشفر
- ✅ `cases` — مع `org_id`
- ✅ `sessions` — مربوط بـ cases
- ✅ `documents` — مربوط بـ cases
- ✅ `invoices` — مع `org_id`
- ✅ `poas` — مربوط بـ clients
- ✅ `tasks` — مع `org_id`
- ✅ `expenses` — مع `org_id`
- ✅ `trust_accounts` — مع `org_id`
- ✅ `enforcement` — مع `org_id`
- ✅ `audit_logs` — مع `org_id`
- ✅ `expert_missions` — مربوط بـ cases
- ✅ `notifications` — مربوط بـ user
- ❌ `subscriptions` — غير موجود في SQL
- ❌ `ai_documents` — غير موجود
- ❌ `timeline_events` — غير موجود

### Firestore Rules — تقييم:
```
❌ sessions — غير مغطاة
❌ documents — غير مغطاة  
❌ poas — غير مغطاة
❌ tasks — غير مغطاة
❌ expenses — غير مغطاة
❌ trust_accounts — غير مغطاة
❌ users — غير مغطاة (يمكن لأي مستخدم مصادق قراءة أي ملف شخصي!)
❌ notifications — غير مغطاة
```

### الفهارس (Indexes):
- فقط 4 فهارس معرّفة (users, cases×2, clients)
- ❌ لا يوجد فهرس لـ `sessions(case_id, date)`
- ❌ لا يوجد فهرس لـ `invoices(org_id, status)`
- ❌ لا يوجد فهرس لـ `audit_logs(org_id, created_at)`

---

## 6. المرحلة R5 — تدقيق الأمان العميق

### 🔴 حرجة (CRITICAL):

| # | المشكلة | الموقع | التأثير |
|---|---------|--------|---------|
| S1 | **مفتاح Groq API مكشوف بقيمة حقيقية** | `.env` سطر 5 | أي شخص يرى الـ repo يمكنه استخدام المفتاح |
| S2 | **VITE_ENCRYPTION_KEY في bundle العميل** | `encryption.ts` سطر 3-6 | مفتاح التشفير مكشوف في JavaScript المنشور |
| S3 | **VITE_GEMINI_API_KEY في العميل** | `gemini.ts` سطر 3 | مفتاح Gemini API يُرسل للمتصفح |
| S4 | **VITE_GROQ_API_KEY في العميل** | `groq.ts` سطر 5 | مفتاح Groq يُستدعى مباشرة من المتصفح |
| S5 | **مفتاح تشفير احتياطي ضعيف** | `encryption.ts` سطر 10 | `"dev-only-" + hostname + "-unsafe"` |

### 🟠 عالية (HIGH):

| # | المشكلة | الموقع |
|---|---------|--------|
| S6 | لا يوجد tenant filtering في data fetching | `legalDataService.ts` |
| S7 | Zustand stores لا تُمسح عند الخروج | جميع stores |
| S8 | `users` collection بدون security rules | `firestore.rules` |
| S9 | `CryptoJS.AES.encrypt` بدون IV عشوائي صريح | `encryption.ts` |
| S10 | `.env` ملتزم في Git (ليس فقط `.env.example`) | جذر المشروع |

### 🟡 متوسطة (MEDIUM):

| # | المشكلة |
|---|---------|
| S11 | CSP يسمح بـ `'unsafe-inline'` و `'unsafe-eval'` |
| S12 | `authMiddleware` يقبل `x-tenant-id` من headers (يمكن تزويره) |
| S13 | لا يوجد email verification مطلوب |
| S14 | `console.log` في ملفات الإنتاج |

---

## 7. المرحلة R6 — صحة سير العمل القانوني المصري

### أنواع القضايا:
- ✅ مدني، تجاري، جنائي، أحوال شخصية، عمالي، إداري ← موجودة في `CaseSchema`
- ✅ دستوري ← موجود
- ⚠️ تنفيذ ← وحدة منفصلة (Enforcement)

### المحاكم المصرية:
- ✅ 14 نوع محكمة في `domain/schemas.ts` ← ممتاز

### مشاكل مكتشفة:
1. **`validation.ts`** — دالة `formatSaudiPhone` ← **سعودية بالكامل!**
2. **بيانات وهمية سعودية** — أرقام `+966` في `useClientsStore.ts` (سطور 75, 83, 90)
3. **`InvoiceSchema`** — يمنع VAT (يفرض `vatAmount === 0`) بينما `seedData.ts` يحسب 14% VAT ← **تناقض!**
4. **عملة غير محددة** — لا يوجد تحديد صريح لعملة EGP في أي schema
5. **`subscriptionService.ts`** — يذكر Moyasar (بوابة دفع سعودية!)

```

