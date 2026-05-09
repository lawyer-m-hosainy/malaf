# 🏛️ تقرير المراجعة الشاملة — منصة مَلَف (الجزء الأول: R1–R4)

## 📊 نتيجة الصحة العامة: 62/100
| المحور | الدرجة |
|--------|--------|
| الفرونت إند | 72/100 |
| الباك إند | 58/100 |
| قاعدة البيانات | 68/100 |
| الأمان | 45/100 |

---

## المرحلة R1 — فهم النظام والاكتمال

### خريطة النظام

**الهيكل العام:**
- `src/views/` — 41 ملف عرض (صفحة)
- `src/components/` — 5 مجلدات فرعية (ai, cases, layout, ui, whatsapp)
- `src/store/` — 19 Zustand store
- `src/hooks/` — 2 hooks فقط (useClientsLogic, usePOALogic)
- `src/domain/` — 5 ملفات (schemas, caseDomain, clientDomain, financeDomain, legalWorkflow)
- `src/lib/` — 9 ملفات (encryption, schemas, supabase, tenant, utils, etc.)
- `src/services/` — 4 ملفات + مجلد ai
- `routes/` (backend) — 5 routes (health, ai, crypto, whatsapp, video)
- `middleware/` — 2 ملفات (auth, aiSecurity)
- `services/whatsapp/` — 4 ملفات (commandParser, aiHandler, messageFormatter, notificationScheduler)

**React Router:** ✅ كل الـ 28+ module عندها routes في App.tsx مع lazy loading.

**Zustand:** ✅ 19 store منفصل مع `persist` middleware للـ auth. كل store عنده `reset()`.

**Zod:** ✅ schemas شاملة في `src/lib/schemas.ts` و `src/domain/schemas.ts` تغطي: clients, cases, invoices, POA, expenses, sessions, tasks, enforcement, time entries, calendar events.

### مصفوفة اكتمال الوحدات

| # | الوحدة | React UI | API Route | Supabase Table | RLS | الحالة |
|---|--------|----------|-----------|----------------|-----|--------|
| M01 | الرئيسية (Dashboard) | ✅ Dashboard.tsx (29KB) | — | — | — | ✅ مكتمل |
| M02 | الموكلين | ✅ Clients.tsx (24KB) | — (Supabase مباشر) | ✅ clients | ✅ | ✅ مكتمل |
| M03 | التوكيلات | ✅ POA.tsx (12KB) | — | ✅ poas | ✅ | ✅ مكتمل |
| M04 | القضايا | ✅ Cases.tsx (19KB) | — | ✅ cases | ✅ | ✅ مكتمل |
| M05 | أجندة الجلسات | ✅ SessionsRoll.tsx (9KB) | — | ✅ sessions | ✅ | ✅ مكتمل |
| M06 | التقويم | ✅ Calendar.tsx (14KB) | — | ✅ calendar_events | ✅ | ✅ مكتمل |
| M07 | الشغل الإداري | ✅ Tasks.tsx (12KB) | — | ✅ tasks | ✅ | ✅ مكتمل |
| M08 | التنفيذ القضائي | ✅ Enforcement.tsx (19KB) | — | ✅ enforcement | ✅ | ✅ مكتمل |
| M09 | المالية | ✅ Finance.tsx (19KB) | — | ✅ invoices + trust_accounts | ✅ | ✅ مكتمل |
| M10 | المستندات | ✅ Documents.tsx (15KB) | — | ✅ documents | ✅ | ✅ مكتمل |
| M11 | الفاتورة الإلكترونية | ✅ ETAInvoicing.tsx (4KB) | — | ✅ invoices (vat_amount) | ✅ | ⚠️ واجهة أساسية فقط |
| M12 | مأموريات الخبراء | ✅ ExpertMissions.tsx (11KB) | — | ✅ expert_missions | ✅ | ✅ مكتمل |
| M13 | الشهر العقاري | ✅ RealEstateRegistry.tsx (7KB) | — | ✅ real_estate_registry | ✅ | ✅ مكتمل |
| M14 | المسارات المتخصصة | ✅ SpecializedTracks.tsx (11KB) | — | ✅ specialized_tracks | ✅ | ✅ مكتمل |
| M15 | فحص تعارض المصالح | ✅ ConflictCheck.tsx (19KB) | — | — (محلي) | — | ✅ مكتمل |
| M16 | تتبع الوقت | ✅ TimeTracking.tsx (18KB) | — | ✅ time_entries | ✅ | ✅ مكتمل |
| M17 | التحصيل | ✅ Collections.tsx (11KB) | — | ✅ receivables | ✅ | ✅ مكتمل |
| M18 | المحلل الذكي | ✅ AIDocumentAnalyzer.tsx (13KB) | ✅ /api/ai/analyze | — | — | ✅ مكتمل |
| M19 | إحصائيات الأداء | ✅ Analytics.tsx (13KB) | — | — (محسوب) | — | ✅ مكتمل |
| M20 | فريق العمل | ✅ Team.tsx (19KB) | — | ✅ profiles | ✅ | ✅ مكتمل |
| M21 | المعرفة القانونية | ✅ InternalWiki.tsx (12KB) | — | — | — | ⚠️ محتوى ثابت |
| M22 | واتساب بوت | ✅ WhatsAppSettings.tsx (7KB) | ✅ /api/whatsapp/* | ⚠️ جداول مفقودة | ⚠️ | ⚠️ يحتاج إضافة جداول |
| M23 | بوابة التقاضي | ✅ ELitigation.tsx (4KB) | — | — | — | ⚠️ واجهة أساسية |
| M24 | مجلس الدولة | ✅ StateCouncil.tsx (4KB) | — | — | — | ⚠️ واجهة أساسية |
| M25 | المحكمة الاقتصادية | ✅ EconomicCourt.tsx (3KB) | — | — | — | ⚠️ واجهة أساسية |
| M26 | القضايا الجنائية | ✅ CriminalCases.tsx (15KB) | — | — | — | ✅ مكتمل |
| M27 | محاكم الأسرة | ✅ FamilyCourts.tsx (3KB) | — | — | — | ⚠️ واجهة أساسية |
| M28 | نقابة المحامين | ✅ BarAssociation.tsx (5KB) | — | — | — | ⚠️ واجهة أساسية |
| — | غرف الفيديو | ✅ VideoRoom + Manager | ✅ /api/video/* | ✅ video_rooms | ✅ | ✅ مكتمل |
| — | CLM (إدارة العقود) | ✅ CLM.tsx (15KB) | — | ✅ contracts | ✅ | ✅ مكتمل |
| — | الملكية الفكرية | ✅ IPManagement + IPOperations | — | ✅ ip_records | ✅ | ✅ مكتمل |
| — | المصروفات | ✅ Expenses.tsx (13KB) | — | ✅ expenses | ✅ | ✅ مكتمل |

### ملخص الفجوات (R1)

> [!WARNING]
> **6 وحدات بواجهات أساسية فقط** (ETA, ELitigation, StateCouncil, EconomicCourt, FamilyCourts, BarAssociation) — حجم الملفات 3-5KB يشير إلى placeholder pages.

> [!IMPORTANT]
> **جداول واتساب مفقودة من الـ schema**: `whatsapp_settings`, `whatsapp_messages`, `whatsapp_contacts` — الـ backend code يستخدمها لكنها غير معرّفة في `supabase-schema.sql`.

---

## المرحلة R2 — تدقيق أمان Multi-Tenant

### ❌ ثغرة حرجة #1: Auth Middleware لا يتحقق فعلياً من التوكن

```javascript
// middleware/auth.js — السطر 14
if (process.env.VITE_ENABLE_DEMO === 'true' || !authHeader) {
    req.user = { uid: 'demo-user', tenantId: 'demo-org', role: 'admin' };
    return next();
}
```

**المشكلة:** في الإنتاج، `VITE_ENABLE_DEMO=true` في render.yaml! هذا يعني أن **كل الـ API routes مفتوحة بدون أي مصادقة**.

**الأخطر:** حتى لو أُزيل demo mode، التوكن يُفك بدون تحقق:
```javascript
// السطر 37 — JWT decoded WITHOUT verification!
const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
```
أي شخص يستطيع صنع JWT مزيف وتمريره!

### ❌ ثغرة حرجة #2: WhatsApp Routes بدون أي auth

```javascript
// server.js — السطر 103
app.use('/api/whatsapp', whatsappRouter); // "has its own internal auth"
```

لكن عملياً، `/api/whatsapp/send`, `/api/whatsapp/settings/:orgId`, `/api/whatsapp/stats/:orgId`, `/api/whatsapp/messages/:orgId` كلها **مفتوحة بالكامل** — أي شخص يعرف orgId يقدر يرسل رسائل أو يقرأ السجلات.

### ❌ ثغرة حرجة #3: Video Routes — لا يوجد tenant filtering

```javascript
// routes/video.js — السطر 101-113
router.get('/sessions/:caseId', async (req, res) => {
    const { data } = await supabase
        .from('video_sessions')
        .select('*')
        .eq('case_id', req.params.caseId) // ❌ لا يوجد org_id filter!
```

### ⚠️ مشكلة عالية: CORS يسمح بكل الأصول

```javascript
// server.js — السطر 73-74
// In production, allow all origins for now
callback(null, true); // ❌ يسمح بكل الطلبات
```

### تقييم عزل الجداول

| الجدول | RLS | org_id filter في الكود | التقييم |
|--------|-----|----------------------|---------|
| organizations | ✅ | ✅ | ✅ معزول |
| profiles | ✅ | ✅ | ✅ معزول |
| clients | ✅ | ✅ | ✅ معزول |
| cases | ✅ | ✅ | ✅ معزول |
| sessions | ✅ | ✅ (via cases join) | ✅ معزول |
| documents | ✅ | ✅ (via cases join) | ✅ معزول |
| invoices | ✅ | ✅ | ✅ معزول |
| poas | ✅ | ✅ (via clients join) | ✅ معزول |
| tasks | ✅ | ✅ | ✅ معزول |
| expenses | ✅ | ✅ | ✅ معزول |
| trust_accounts | ✅ | ✅ | ✅ معزول |
| enforcement | ✅ | ✅ | ✅ معزول |
| audit_logs | ✅ | ✅ | ✅ معزول |
| video_rooms | ✅ | ❌ (backend bypasses) | ⚠️ جزئي |
| whatsapp_settings | ❌ غير موجود | ❌ | ❌ مكشوف |
| whatsapp_messages | ❌ غير موجود | ❌ | ❌ مكشوف |

### ✅ نقاط إيجابية في الأمان
- التشفير: AES-256-GCM مع tenant-specific key derivation (PBKDF2) — ممتاز
- ENCRYPTION_KEY لا يظهر في client bundle — server-side فقط
- IV عشوائي لكل عملية تشفير
- كل Zustand store عنده `reset()` ويتم مسحه عند logout
- Supabase RLS مُفعّل على كل الجداول الموجودة

---

## المرحلة R3 — مراجعة واجهة المستخدم العربية RTL

### ✅ نقاط ممتازة
- `dir="rtl"` مضبوط في RootLayout.tsx
- خط Cairo العربي مُستخدم (`@fontsource-variable/cairo`)
- Sidebar في الجهة اليمنى (صح)
- كل رسائل الخطأ بالعربي في Zod schemas
- Empty states/loading messages بالعربي
- العملة: ج.م — صح
- Toaster position: `top-center` — مناسب

### ⚠️ مشاكل محتملة
1. **أرقام مختلطة**: بعض الأرقام بالعربي وبعضها بالإنجليزي — المطلوب إنجليزي فقط (للاتساق في المحاكم)
2. **الصفحات الأساسية** (ELitigation, StateCouncil, etc.) — حجمها صغير (3-4KB) ممكن يكون فيها نصوص placeholder
3. **Dark mode**: التحقق يحتاج تشغيل فعلي للتطبيق — لكن الكود يستخدم `dark:` classes بشكل واسع
4. **التواريخ**: لا يوجد تنسيق موحد (يوم/شهر/سنة) — date-fns موجودة لكن التطبيق غير واضح

### ⚠️ Auth permissions بأسماء عربية + إنجليزية مختلطة

```typescript
// useAuthStore.ts
'محامي شريك': ['*'],
'محامي': ['view_cases', 'edit_cases', ...], // ← أسماء الأدوار عربي، الصلاحيات إنجليزي
```
هذا مقبول تقنياً لكن يُصعّب الصيانة.

---

## المرحلة R4 — مراجعة server.js والـ Backend

### الهيكل: ✅ ممتاز

server.js = **176 سطر فقط** — مُنظّم بشكل ممتاز:
- Routes مفصولة في مجلد `routes/`
- Middleware في مجلد `middleware/`
- Services في مجلد `services/`

### Routes Coverage

| Route | الملف | الحجم | Auth | Rate Limit | Zod |
|-------|------|-------|------|------------|-----|
| /api/health | health.js | 17 سطر | ❌ (عام) | ✅ skip | — |
| /api/ai/* | ai.js | 152 سطر | ✅ authMiddleware | ✅ aiRateLimiter | ✅ |
| /api/crypto/* | crypto.js | 142 سطر | ✅ authMiddleware | ✅ cryptoRateLimiter | ✅ |
| /api/video/* | video.js | 117 سطر | ✅ authMiddleware | ❌ | ❌ |
| /api/whatsapp/* | whatsapp.js | 406 سطر | ❌ | ❌ | ❌ |

### ✅ نقاط إيجابية
- Helmet.js مع CSP مخصّص
- Compression middleware
- Global rate limiter (100 req/min)
- Structured logging مع Pino
- Global error handler مع رسائل عربية
- Code splitting في Vite config

### ❌ مشاكل حرجة

1. **WhatsApp routes بدون auth** — أي شخص يقدر يرسل رسائل
2. **Video routes بدون input validation** — لا Zod schemas
3. **Video routes بدون tenant isolation** — `GET /sessions/:caseId` يرجع كل البيانات
4. **CORS مفتوح** في production (السطر 74)
5. **Demo mode مفعّل في production** — `VITE_ENABLE_DEMO=true` في render.yaml

### Gemini AI: ✅ جيد
- System instruction بالعربية القانونية المصرية
- Fallback إلى Groq (llama-3.3-70b) لو Gemini فشل
- Rate limiting (10 req/min) + input sanitization
- 3 endpoints: legal-assistant, draft, analyze
