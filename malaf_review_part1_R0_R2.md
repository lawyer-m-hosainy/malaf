# ⚖️ تقرير المراجعة الشاملة — منصة مَلَف (الجزء ١: R0–R2)

---

## المرحلة R0 — التحقق الأولي (Pre-Review Verification)

### ① تأكيد التقنيات المستخدمة (Tech Stack)

| الفحص | النتيجة | التفاصيل |
|---|---|---|
| React 19 | ✅ | `"react": "^19.0.0"` في `package.json` |
| Vite | ✅ | `"vite": "^6.2.0"` + `vite.config.ts` موجود |
| TypeScript | ✅ | `tsconfig.json` مع `strict: true` |
| Tailwind CSS 4 | ✅ | `"tailwindcss": "^4.1.14"` + `@tailwindcss/vite` |
| shadcn/ui | ✅ | `"shadcn": "^4.2.0"` + `components.json` |
| Zustand | ✅ | `"zustand": "^5.0.12"` — 19 store ملف |
| Supabase JS | ✅ | `"@supabase/supabase-js": "^2.105.3"` |
| Firebase Auth | ✅ | `"firebase": "^12.11.0"` |
| Crypto-JS | ⚠️ | `"crypto-js": "^4.2.0"` مثبت لكن **غير مستخدم في الكود** — التشفير انتقل لـ `server.js` |
| Zod | ✅ | `"zod": "^4.3.6"` — schemas في `domain/schemas.ts` و `lib/schemas.ts` |

### ② أمان متغيرات البيئة (Environment Variables)

| المتغير | الحالة | التقييم |
|---|---|---|
| `VITE_SUPABASE_URL` | ✅ مستخدم في `supabase.ts` | آمن — مفتاح عام بالتصميم |
| `VITE_SUPABASE_ANON_KEY` | ✅ مستخدم في `supabase.ts` | آمن — مفتاح عام بالتصميم |
| `VITE_APP_URL` | ✅ مستخدم في `encryption.ts` | آمن — عنوان URL فقط |
| `VITE_ENABLE_DEMO` | ✅ في `.env` | آمن — علم تشغيل فقط |
| `VITE_FIREBASE_*` | ❌ **غير موجود** | Firebase config محفوظ في `firebase-applet-config.json` مباشرة — **ليس `.env`** |
| `GEMINI_API_KEY` | ✅ في `.env` بدون `VITE_` | ✅ آمن — server-side فقط |
| `GROQ_API_KEY` | ✅ في `.env` بدون `VITE_` | ✅ آمن — server-side فقط |
| `ENCRYPTION_KEY` | ✅ في `server.js` بدون `VITE_` | ✅ آمن — server-side فقط |
| `VITE_ENCRYPTION_KEY` | ⚠️ مذكور في `README.md` سطر 67 | ❌ **خطير في التوثيق** — التنفيذ الفعلي آمن لكن README يوجه للخطأ |

> [!IMPORTANT]
> **نتيجة حاسمة:** مفتاح التشفير (ENCRYPTION_KEY) انتقل بنجاح إلى `server.js` واستُبدل `CryptoJS` في المتصفح بنداءات API إلى `/api/crypto/encrypt` و `/api/crypto/decrypt`. هذا **تحسين أمني ممتاز**. لكن `README.md` لا يزال يذكر `VITE_ENCRYPTION_KEY` — يجب تحديثه فوراً.

### ③ Firebase Config المكشوف

> [!CAUTION]
> ملف `firebase-applet-config.json` محفوظ في جذر المشروع وليس في `.env`. القيم الحالية placeholders (`YOUR_API_KEY`). **لكن:**
> - الملف **ليس** في `.gitignore` (فقط `firebase-applet-config.json` مضاف حديثاً)
> - مفاتيح Firebase عامة بالتصميم، لكن يُفضل استخدام `.env` + `VITE_FIREBASE_*`

### ④ ملف `.gitignore`

```
✅ .env* مستبعد (ما عدا .env.example)
✅ node_modules/ مستبعد
✅ dist/ مستبعد
⚠️ firebase-applet-config.json مستبعد — لكن قد يحتوي على مفاتيح
```

### نتيجة R0 الإجمالية

| البند | الحالة |
|---|---|
| التقنيات مثبتة وصحيحة | ✅ |
| التشفير آمن (server-side) | ✅ |
| Gemini API آمن (server-side) | ✅ |
| Supabase service_role غير مكشوف | ✅ |
| README يذكر VITE_ENCRYPTION_KEY | ❌ يجب تصحيحه |
| Supabase env vars مفقودة من `.env` | ⚠️ لا توجد في `.env` الحالي |

```
╔═════════════════════════════════════════════════════════╗
║ [سوبر برومبت إصلاح R0 — التحقق الأولي]               ║
╚═════════════════════════════════════════════════════════╝
```

```text
You are a senior DevOps and security engineer.
Fix the following pre-review issues for مَلَف Egyptian law firm SaaS platform.
Stack: React 19 + Vite + Supabase + Firebase Auth.

Issues to fix:
1. README.md line 67 mentions VITE_ENCRYPTION_KEY — remove it and
   document that encryption is handled server-side via /api/crypto/*
2. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env file
   (currently they exist only in code as fallbacks)
3. Verify firebase-applet-config.json is in .gitignore (it is) but
   document why Firebase config keys are safe to be public
4. Add .env.local to .env.example with all required variable names
5. Verify npm audit has no critical vulnerabilities

For each fix: provide exact code/file changes.

Write your full response in Arabic.
```

---

## المرحلة R1 — فهم النظام واكتمال الوحدات

### هيكل المشروع (Project Architecture)

```
src/
├── App.tsx              ← Router + Lazy loading (46 route)
├── main.tsx             ← Entry + Error handlers
├── index.css            ← Tailwind 4 + shadcn theme
├── components/          ← AuthProvider, ProtectedRoute, layout, ui, ai
├── config/              ← Feature flags
├── domain/              ← Zod schemas + business logic
├── hooks/               ← useClientsLogic
├── lib/                 ← firebase, supabase, encryption, tenant, validation
├── mocks/               ← Demo data (30KB)
├── modules/             ← admin, onboarding, subscriptions
├── observability/       ← health, logger
├── repositories/        ← casesRepository
├── security/            ← RBAC
├── services/            ← AI service, legalDataService, fileService, seedData
├── store/               ← 19 Zustand stores
├── types/               ← 10 type files
└── views/               ← 40 view components
```

**تقييم المعمارية:** Feature-based مع فصل جيد بين الطبقات (Domain → Service → Store → View). استخدام `React.lazy` لكل الصفحات ممتاز للأداء.

### مصفوفة اكتمال الوحدات الـ 18

| الوحدة | الواجهة UI | جدول Supabase | سياسة RLS | التشفير |
|---|---|---|---|---|
| M01 المصادقة | ✅ Login + Register + Google + Demo | ✅ profiles + organizations | ✅ | N/A |
| M02 الموكلون | ✅ Clients.tsx (24KB) | ✅ clients | ✅ | ✅ national_id, commercial_reg |
| M03 القضايا | ✅ Cases.tsx (18KB) | ✅ cases | ✅ | ⚠️ بيانات غير مشفرة |
| M04 الجلسات | ✅ SessionsRoll.tsx | ✅ sessions | ✅ | ❌ |
| M05 المستندات | ✅ Documents.tsx | ✅ documents | ✅ | ⚠️ Firebase Storage |
| M06 المالية | ✅ Finance.tsx + Expenses.tsx | ✅ invoices + expenses + trust_accounts | ✅ | ⚠️ amounts غير مشفرة |
| M07 التقويم | ✅ Calendar.tsx (14KB) | ⚠️ لا يوجد جدول calendar_events | ⚠️ | ❌ |
| M08 التوكيلات | ✅ POA.tsx | ✅ poas | ✅ | ❌ |
| M09 بوابة الموكل | ✅ ClientPortal.tsx (18KB) | ✅ profiles (linked_client_id) | ⚠️ | ❌ |
| M10 التقارير | ✅ Analytics.tsx (13KB) | ❌ لا يوجد جدول مخصص | ⚠️ | N/A |
| M11 الفريق | ✅ Team.tsx (19KB) | ✅ profiles | ✅ | ❌ |
| M12 المستشار الذكي | ✅ ChatAssistant component | ✅ server.js /api/ai/* | ✅ auth middleware | N/A |
| M13 صانع العقود | ✅ Contracts.tsx | ✅ ai_documents | ✅ | ❌ |
| M14 محلل الوثائق | ✅ AIDocumentAnalyzer.tsx | ✅ server.js /api/ai/analyze | ✅ | ❌ |
| M15 الفاتورة ETA | ✅ ETAInvoicing.tsx | ✅ invoices | ✅ | ⚠️ |
| M16 سجلات التدقيق | ✅ AuditLogs.tsx | ✅ audit_logs | ✅ immutable | N/A |
| M17 السوبر أدمن | ✅ GlobalAdmin.tsx | ✅ عبر is_super_admin() | ✅ | N/A |
| M18 الاشتراكات | ✅ subscriptionService.ts | ✅ subscriptions | ✅ | N/A |

**وحدات إضافية غير مذكورة في القائمة الأصلية (مبنية فعلياً):**
- التنفيذ القضائي (Enforcement) ✅
- التحصيلات (Collections) ✅
- الملكية الفكرية (IPManagement + IPOperations) ✅
- تتبع الوقت (TimeTracking) ✅
- فحص تعارض المصالح (ConflictCheck) ✅
- المسارات المتخصصة (SpecializedTracks) ✅
- المحاكم الاقتصادية / مجلس الدولة / الأسرة / الجنائية ✅
- الشهر العقاري (RealEstateRegistry) ✅
- مأموريات الخبراء (ExpertMissions) ✅
- بوابة التقاضي الإلكتروني (ELitigation) ✅
- نقابة المحامين (BarAssociation) ✅
- ويكي داخلي (InternalWiki) ✅
- CLM (إدارة دورة حياة العقود) ✅

**الخلاصة:** المنصة تحتوي على **40+ شاشة** وتتجاوز الـ 18 وحدة المطلوبة بكثير.

### فجوات حرجة (Gaps)

1. **❌ لا يوجد ربط Firebase JWT مع Supabase RLS** — `supabase.auth` لم يُستخدم أبداً. الـ RLS تعتمد على `raw_user_meta_data` التي لا تُملأ تلقائياً من Firebase
2. **⚠️ بيانات Zustand stores تحتوي mock data ثابتة** — `useCasesStore` و `useFinanceStore` يبدآن ببيانات وهمية مدمجة
3. **⚠️ `fetchCases` يرسل org_id يدوياً** بدلاً من الاعتماد على RLS

```
╔═════════════════════════════════════════════════════════╗
║ [سوبر برومبت إصلاح R1 — فهم النظام]                  ║
╚═════════════════════════════════════════════════════════╝
```

```text
You are a senior system architect reviewing a multi-tenant
Egyptian law firm SaaS platform مَلَف.
Stack: React 19 + Vite + Supabase (PostgreSQL + RLS)
       + Firebase Auth + Zustand + AES-256 (server-side).

Fix the following issues found in Phase R1:

1. Zustand stores (useCasesStore, useFinanceStore, useClientsStore)
   contain hardcoded mock data as initial state. These should start
   empty and load from Supabase on demand.
2. Calendar module has no dedicated Supabase table — create
   calendar_events table with org_id and RLS policies.
3. Reports/Analytics module reads from Zustand only — should
   aggregate from Supabase with proper org_id filtering.
4. Remove stale mock imports from App.tsx (mockTasks, mockTeamMembers
   are imported but seedDemoData() handles seeding).
5. Verify all 40+ views have proper error boundaries and loading states.

Rules:
- All fixes must preserve existing functionality
- All Supabase queries must include org_id filtering
- Do not weaken any RLS policies
- All UI text must remain in Arabic RTL

Write your full response in Arabic.
```

---

## المرحلة R2 — تدقيق أمان Multi-Tenant

### ❗ الاكتشاف الأخطر: عدم ربط Firebase JWT مع Supabase

> [!CAUTION]
> **ثغرة معمارية حرجة (CRITICAL ARCHITECTURAL GAP)**
>
> كود `supabase.ts` يُنشئ عميل Supabase بـ `anon key` فقط — **بدون تمرير Firebase JWT**:
> ```typescript
> export const supabase = createClient(supabaseUrl, supabaseAnonKey);
> ```
>
> هذا يعني أن **`auth.uid()` في سياسات RLS ستكون `null` دائماً** لأن Supabase لا يعرف هوية المستخدم.
>
> **لكن المنصة تعمل لأن:**
> - كل استعلام يُرسل `org_id` يدوياً عبر `.eq("org_id", orgId)`
> - دالة `get_user_org_id()` في RLS تقرأ من `raw_user_meta_data` — التي **لم تُملأ أبداً**
>
> **النتيجة:** سياسات RLS **غير فعّالة فعلياً**. البيانات محمية فقط بالفلترة اليدوية في الكود.

### تقييم عزل كل جدول

| الجدول | RLS مفعّل | السياسة صحيحة | العزل الفعلي | التقييم |
|---|---|---|---|---|
| organizations | ✅ | ❌ `get_user_org_id()` لا تعمل | ❌ | ❌ مكشوف |
| profiles | ✅ | ❌ نفس المشكلة | ⚠️ فلتر يدوي | ⚠️ جزئي |
| clients | ✅ | ❌ نفس المشكلة | ⚠️ فلتر يدوي | ⚠️ جزئي |
| cases | ✅ | ❌ نفس المشكلة | ⚠️ فلتر يدوي | ⚠️ جزئي |
| sessions | ✅ | ❌ عبر cases join | ⚠️ فلتر يدوي | ⚠️ جزئي |
| documents | ✅ | ❌ عبر cases join | ⚠️ فلتر يدوي | ⚠️ جزئي |
| invoices | ✅ | ❌ نفس المشكلة | ⚠️ فلتر يدوي | ⚠️ جزئي |
| poas | ✅ | ❌ عبر clients join | ⚠️ فلتر يدوي | ⚠️ جزئي |
| audit_logs | ✅ | ❌ نفس المشكلة | ⚠️ فلتر يدوي | ⚠️ جزئي |
| counters | ✅ | ❌ `USING (true)` | ❌ مكشوف للجميع | ❌ خطير |
| notifications | ✅ | ❌ `auth.uid()` = null | ❌ مكشوف | ❌ خطير |

### التشفير — تقييم إيجابي

| البند | الحالة | التفاصيل |
|---|---|---|
| التشفير server-side | ✅ ممتاز | `server.js` سطر 332-385 — Node.js `crypto` |
| مفتاح خاص لكل مستأجر | ✅ ممتاز | `getTenantKey()` يستخدم PBKDF2 مع tenantId كـ salt |
| IV عشوائي | ✅ | `crypto.randomBytes(16)` لكل عملية |
| المفتاح الرئيسي server-only | ✅ | `ENCRYPTION_KEY` بدون `VITE_` |
| Auth middleware على التشفير | ✅ | `/api/crypto/*` محمي بـ `authMiddleware` |
| عزل بين المكاتب | ✅ | مفتاح مشتق مختلف لكل tenantId |

### Zustand — تنظيف عند الخروج

| البند | الحالة |
|---|---|
| `resetAllStores()` عند logout | ✅ يمسح 16 store |
| `setTenantIdCache(null)` عند logout | ✅ |
| `auth.signOut()` يُستدعى | ✅ |
| لا تسرب بيانات بين المستأجرين | ⚠️ stores تبدأ ببيانات mock |

### بوابة الموكل — تقييم العزل

| البند | الحالة |
|---|---|
| تسجيل دخول منفصل | ✅ `ClientPortal.tsx` بـ Firebase Auth |
| فحص role === "client" | ✅ سطر 62 |
| ربط بـ linked_client_id | ✅ |
| فلترة القضايا بـ client_id + org_id | ✅ سطر 93-97 |
| ملاحظات المحامي الخاصة مخفية | ⚠️ لا يوجد حقل `is_private` |
| لا يرى فواتير | ❌ غير مطبق |
| لا يرى مستندات مشتركة فقط | ❌ غير مطبق |

### محاكاة هجوم (Attack Simulation)

**السيناريو:** مكتب A يحاول الوصول لبيانات مكتب B

**الوضع الحالي:**
1. Supabase client بدون JWT → `auth.uid() = null` → RLS دالة `get_user_org_id()` ترجع `null`
2. الاستعلام يُرسل `org_id` يدوياً من `getCurrentTenantId()`
3. **لكن:** مستخدم خبيث يمكنه استدعاء Supabase مباشرة بـ anon key + أي org_id

> [!WARNING]
> **هذا يعني أن أي شخص يعرف الـ anon key (وهو عام) يمكنه قراءة بيانات أي مكتب عبر Supabase REST API مباشرة — لأن RLS لا تعمل فعلياً.**

### الإصلاح المطلوب (ملخص)

1. **ربط Firebase JWT مع Supabase** عبر `supabase.auth.setSession()` أو استخدام Supabase Auth مباشرة
2. **تعديل `get_user_org_id()`** لتقرأ من JWT claims الصحيحة
3. **إزالة الفلترة اليدوية** والاعتماد على RLS بالكامل
4. **إصلاح سياسة counters** — إزالة `USING (true)`

```
╔═════════════════════════════════════════════════════════╗
║ [سوبر برومبت إصلاح R2 — أمان Multi-Tenant]           ║
╚═════════════════════════════════════════════════════════╝
```

```text
You are a Supabase RLS security expert. Fix ALL multi-tenant
isolation issues for Egyptian law firm SaaS platform مَلَف.
Stack: React 19 + Supabase PostgreSQL + Firebase Auth.

CRITICAL ISSUE: Firebase JWTs are NOT being passed to Supabase.
The Supabase client is created with only the anon key:
  createClient(url, anonKey)
This means auth.uid() is always NULL in RLS policies.
The function get_user_org_id() reads from raw_user_meta_data
which is never populated from Firebase.

Fix plan (implement ALL):
1. Option A (Recommended): Use Supabase Auth directly instead of
   Firebase Auth. Create users in Supabase with org_id in
   raw_user_meta_data. This eliminates the JWT bridge problem.
   
   OR Option B: Configure Supabase to accept Firebase JWTs:
   - Set Supabase JWT secret to match Firebase project
   - After Firebase login, call supabase.auth.setSession()
     with the Firebase ID token
   - Update get_user_org_id() to read from the correct JWT claim

2. Fix get_user_org_id() SQL function to correctly extract org_id
   from whatever auth mechanism is chosen

3. Fix counters table RLS — remove "USING (true)" and add
   proper org-scoped policy

4. Fix notifications table RLS — currently uses auth.uid()
   which is null

5. Add client-role RLS policies:
   - Client can only SELECT their own linked cases
   - Client cannot see private lawyer notes
   - Client can see only shared documents

6. Keep the manual org_id filtering in legalDataService.ts as
   defense-in-depth, but RLS must be the primary security layer

7. Test: After fixes, verify that calling Supabase REST API
   directly with anon key + random org_id returns empty results

For each fix: provide exact SQL and TypeScript code.
All changes must be additive and safe (no data loss).

Write your full response in Arabic.
```
