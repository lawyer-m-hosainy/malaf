# 🏛️ تقرير المراجعة الشاملة — منصة مَلَف (الجزء الثالث: R9–R12 + التقرير النهائي)

---

## المرحلة R9 — مراجعة Deployment

### render.yaml

| العنصر | الحالة | التفاصيل |
|--------|--------|----------|
| Runtime | ✅ | node |
| Plan | ✅ | free |
| Region | ✅ | frankfurt (الأقرب لمصر) |
| Build Command | ✅ | `npm install && npm run build` |
| Start Command | ✅ | `node server.js` |
| Health Check | ✅ | `/api/health` |
| Auto Deploy | ✅ | true |

### Environment Variables في render.yaml

| المتغير | الحالة |
|---------|--------|
| NODE_ENV=production | ✅ |
| PORT=10000 | ✅ |
| SUPABASE_URL | ✅ |
| VITE_SUPABASE_URL | ✅ |
| SUPABASE_ANON_KEY | ⚠️ **hardcoded في render.yaml — يجب أن يكون sync: false** |
| VITE_SUPABASE_ANON_KEY | ⚠️ نفس المشكلة |
| SUPABASE_SERVICE_ROLE_KEY | ✅ sync: false |
| GEMINI_API_KEY | ✅ sync: false |
| GROQ_API_KEY | ✅ sync: false |
| ENCRYPTION_KEY | ✅ sync: false |
| DAILY_API_KEY | ✅ sync: false |
| VITE_ENABLE_DEMO | ❌ **`true` في production!** |

### package.json

| العنصر | الحالة |
|--------|--------|
| `build:all` script | ⚠️ يشير فقط لـ `npm run build` — لا يبني الـ server |
| `engines` field | ❌ **غير موجود** — يجب تحديد Node version |
| `type: module` | ✅ ESM |
| Dependencies conflicts | ⚠️ `@google/genai` و `@google/generative-ai` — مكتبتين مختلفتين |

---

## المرحلة R10 — مراجعة واتساب بوت

### ✅ الموجود
- Webhook GET/POST handlers (Meta-compatible)
- Webhook signature verification (HMAC SHA-256 + timing-safe compare)
- 7 أوامر للمحامي في `commandParser.js` (19KB — شامل)
- AI handler للرسائل غير المعروفة
- Message formatter مع templates مصرية
- Notification scheduler مع node-cron
- إرسال يدوي من لوحة التحكم
- إحصائيات شهرية
- سجل رسائل مع pagination
- دعم 360dialog + Meta Cloud API

### ❌ المفقود
1. **جداول Supabase غير موجودة**: `whatsapp_settings`, `whatsapp_messages`, `whatsapp_contacts` — **الموديول لن يعمل بالكامل**
2. **لا auth على routes**: `/send`, `/settings/:orgId`, `/stats/:orgId`, `/messages/:orgId` — مفتوحة
3. **فك تشفير API token**: `TODO: decrypt via getTenantKey` — غير مُنفّذ
4. **RLS غير موجود** على جداول الواتساب

---

## المرحلة R11 — سجل الأخطاء الكامل

### 🔴 حرجة (3 أخطاء)

| ID | الخطأ | الموقع | الإصلاح |
|----|-------|--------|---------|
| BUG-001 | Auth middleware لا يتحقق من JWT signature — demo mode مفعّل في production | middleware/auth.js:14 + render.yaml:37 | إزالة `VITE_ENABLE_DEMO` من production + استخدام `firebase-admin` أو Supabase JWT verify |
| BUG-002 | WhatsApp routes بدون أي authentication | server.js:103 + routes/whatsapp.js | إضافة `authMiddleware` للـ routes غير webhook |
| BUG-003 | جداول واتساب مفقودة من schema | supabase-schema.sql | إنشاء `whatsapp_settings`, `whatsapp_messages`, `whatsapp_contacts` |

### 🟡 عالية (5 أخطاء)

| ID | الخطأ | الموقع | الإصلاح |
|----|-------|--------|---------|
| BUG-004 | CORS يسمح بكل الأصول في production | server.js:73-74 | إزالة fallback `callback(null, true)` |
| BUG-005 | Video routes بدون tenant isolation | routes/video.js:101-113 | إضافة `org_id` filter من `req.tenantId` |
| BUG-006 | video.js يستخدم `video_sessions` لكن الجدول اسمه `video_rooms` | routes/video.js:48-58 | توحيد اسم الجدول |
| BUG-007 | `SUPABASE_SERVICE_ROLE_KEY` مكشوف في `.env` على Git | .env:18 | نقله إلى `.env.local` وإضافته لـ `.gitignore` |
| BUG-008 | `SUPABASE_ANON_KEY` hardcoded في render.yaml | render.yaml:21-23 | تغييره لـ `sync: false` |

### 🟠 متوسطة (4 أخطاء)

| ID | الخطأ | الموقع |
|----|-------|--------|
| BUG-009 | CSP يسمح بـ `unsafe-inline` و `unsafe-eval` | server.js:50 |
| BUG-010 | Google AI مكتبتين مختلفتين في dependencies | package.json:24-25 |
| BUG-011 | `engines` field مفقود في package.json | package.json |
| BUG-012 | 6 وحدات بواجهات placeholder (3-5KB) | views/ELitigation, StateCouncil, etc. |

### 🔵 منخفضة (2)

| ID | الخطأ | الموقع |
|----|-------|--------|
| BUG-013 | تكرار indexes في schema | supabase-schema.sql |
| BUG-014 | seedDemoData يعمل في كل تحميل إذا clients فارغ | App.tsx:92 |

### ملخص

| الخطورة | العدد | الإطار الزمني |
|---------|-------|--------------|
| 🔴 حرجة | 3 | 24 ساعة |
| 🟡 عالية | 5 | قبل أي عرض |
| 🟠 متوسطة | 4 | هذا الأسبوع |
| 🔵 منخفضة | 2 | لاحقاً |
| **الإجمالي** | **14** | |

---

## المرحلة R12 — جاهزية المستثمرين

### ① فرصة السوق
- 150,000+ محامٍ مصري مسجل بنقابة المحامين
- 50,000+ مكتب محاماة
- الحل الحالي: Excel + WhatsApp + ورق → **فرصة رقمنة ضخمة**
- TAM (مصر): ~50,000 مكتب × 200-500 ج.م/شهر = **120-300 مليون ج.م/سنة**

### ② التميز التنافسي

| الميزة | مَلَف | Clio | MyCase | محلي |
|--------|------|------|--------|------|
| عربي أصيل RTL | ✅ | ❌ | ❌ | ⚠️ |
| قانون مصري | ✅ | ❌ | ❌ | ⚠️ |
| AI بالعربية القانونية | ✅ | ❌ | ❌ | ❌ |
| واتساب بوت | ✅ | ❌ | ❌ | ❌ |
| Video Room مدمج | ✅ | ✅ | ✅ | ❌ |
| سعر بالجنيه | ✅ | ❌ | ❌ | ✅ |
| 28+ وحدة | ✅ | ✅ | ✅ | ❌ |

### ③ ميزات ناقصة سيسأل عنها المستثمر

| الميزة | الحالة | الأولوية |
|--------|--------|----------|
| تطبيق موبايل | ❌ غير موجود (لكن responsive) | عالية |
| OCR لمسح المستندات | ❌ | متوسطة |
| استيراد من Excel | ❌ | عالية |
| دفع Vodafone Cash / Fawry | ❌ | عالية |
| E-signature | ❌ | متوسطة |
| تكامل فعلي مع بوابة التقاضي | ❌ (واجهة فقط) | عالية |

### ④ مستوى الاستعداد للعرض: **65%**

**يمكن عرضه الآن**: Dashboard, Clients, Cases, Finance, Documents, AI Analyzer, Team
**يحتاج إصلاح قبل العرض**: Auth security, WhatsApp (جداول مفقودة), Video (tenant isolation)

---

## 📋 فهرس السوبر برومبتات (12 برومبت جاهز)

> [!TIP]
> كل سوبر برومبت أدناه جاهز للنسخ والاستخدام مباشرة لإصلاح المشاكل المذكورة في التقرير.

### سوبر برومبت R1

```
You are a senior React 19 + Supabase architect. Review the Malaf platform and:
1. Create missing WhatsApp tables: whatsapp_settings, whatsapp_messages, whatsapp_contacts
2. Fix video.js table name mismatch (video_sessions vs video_rooms)
3. Flesh out the 6 placeholder pages (ETAInvoicing, ELitigation, StateCouncil, EconomicCourt, FamilyCourts, BarAssociation) — each should have at least a data table, filters, and add/edit dialog
4. Remove duplicate Google AI dependency — keep only @google/generative-ai
5. Add engines field to package.json: {"node": ">=20.0.0"}
Write your full response in Arabic.
```

### سوبر برومبت R2

```
You are a Supabase RLS + security expert. Fix ALL tenant isolation issues in Malaf:
1. CRITICAL: Remove VITE_ENABLE_DEMO=true from render.yaml
2. CRITICAL: Replace JWT decode-without-verify in middleware/auth.js with proper Supabase JWT verification using jsonwebtoken + SUPABASE_JWT_SECRET
3. CRITICAL: Add authMiddleware to WhatsApp routes (except webhook GET/POST)
4. Fix CORS: remove the fallback callback(null, true) in server.js line 73-74
5. Add org_id/tenantId filter to ALL video.js routes
6. Create RLS policies for whatsapp_settings, whatsapp_messages, whatsapp_contacts
7. Move SUPABASE_SERVICE_ROLE_KEY from .env to .env.local
8. Change SUPABASE_ANON_KEY in render.yaml to sync: false
Do not break existing functionality. Write your full response in Arabic.
```

### سوبر برومبت R3

```
You are an Arabic RTL UI specialist. Fix ALL RTL and Arabic issues in Malaf (React 19 + Tailwind CSS 4):
1. Ensure all dates use Egyptian format (DD/MM/YYYY) consistently across all views
2. Ensure all currency displays use ج.م consistently
3. Check all 6 placeholder pages for any English text visible to users
4. Verify dark mode text readability on all pages
5. Standardize number format (English numerals only)
6. Check form placeholders and error messages are all in Arabic
File by file, component by component. Write your full response in Arabic.
```

### سوبر برومبت R4

```
You are a senior Node.js security engineer. Fix the Malaf server.js backend:
1. Replace JWT decode-without-verify with proper verification (use jsonwebtoken + Supabase JWT secret)
2. Add authMiddleware to WhatsApp non-webhook routes (/send, /settings, /stats, /messages)
3. Add Zod input validation to video.js routes
4. Fix CORS: remove fallback callback(null, true), only allow listed origins
5. Add tenant isolation (req.tenantId filter) to all video.js queries
6. Remove VITE_ENABLE_DEMO from production config
7. Add request logging for security-sensitive operations
Write your full response in Arabic.
```

### سوبر برومبت R5

```
You are a Supabase PostgreSQL expert. Fix the Malaf database schema:
1. Create missing tables: whatsapp_settings (org_id, wa_phone_number, api_token_encrypted, webhook_secret, welcome_message, away_message, notifications JSONB, is_active, provider), whatsapp_messages (org_id, direction, from_number, to_number, content, message_type, case_id, client_id, command_detected, ai_handled, status, media_url), whatsapp_contacts (org_id, phone_number, contact_type, linked_id, name)
2. Add RLS to all 3 new tables with org_id isolation
3. Fix profiles CREATE TABLE order (move linked_client_id to ALTER TABLE)
4. Unify video table name to video_rooms (fix video.js references)
5. Add missing org_id to expert_missions table
6. Remove duplicate indexes
Output: complete SQL migration file. Write your full response in Arabic.
```

### سوبر برومبت R6

```
You are a web application security expert. Fix ALL security issues in Malaf:
1. CRITICAL: Implement proper JWT verification in middleware/auth.js
2. Remove unsafe-inline and unsafe-eval from CSP where possible (use nonce-based)
3. Add .env.local to .gitignore and move sensitive keys there
4. Run npm audit and fix critical/high vulnerabilities
5. Remove @google/genai duplicate dependency
6. Add security headers: X-Content-Type-Options, X-Frame-Options, Referrer-Policy
7. Implement ENCRYPTION_KEY rotation strategy
Write your full response in Arabic.
```

### سوبر برومبت R7

```
You are an Egyptian legal-tech domain expert. Fix all legal workflow issues in Malaf:
1. Add missing case types: عمالي, إيجارات, ضرائب, تأديبي
2. Add missing case statuses: محكوم فيها, طعن, تنفيذ, مستأنفة
3. Add missing POA types: إداري, بنكي
4. ETA invoice: add tax_registration_number field, ETA code, QR code generation
5. Add legal deadline calculations (appeal periods: 40 days civil, 10 days criminal)
6. Ensure all session outcomes use official Egyptian legal terminology
All legal terms must be authentic Egyptian Arabic. Write your full response in Arabic.
```

### سوبر برومبت R8

```
You are a performance optimization engineer. Optimize Malaf platform:
1. Add UptimeRobot ping configuration to prevent Render cold start
2. Fix seedDemoData: only seed in demo mode, not on every load
3. Add direct org_id to sessions table to avoid JOIN performance hit
4. Optimize batchDecryptFields: add client-side caching for already-decrypted values
5. Add React.memo to expensive list components
6. Configure Vite for optimal tree-shaking
Write your full response in Arabic.
```

### سوبر برومبت R9

```
You are a DevOps engineer for Render.com. Fix deployment issues:
1. Remove VITE_ENABLE_DEMO=true from render.yaml production config
2. Change SUPABASE_ANON_KEY and VITE_SUPABASE_ANON_KEY to sync: false
3. Add engines field to package.json: {"node": ">=20.0.0"}
4. Add UptimeRobot setup guide for /api/health endpoint
5. Fix build:all script to properly build both frontend and prepare server
6. Add NODE_ENV detection for dev vs prod configurations
Write your full response in Arabic.
```

### سوبر برومبت R10

```
You are a WhatsApp Business API engineer. Complete the Malaf WhatsApp bot:
1. Create SQL migration for whatsapp_settings, whatsapp_messages, whatsapp_contacts tables
2. Add authMiddleware to /send, /settings, /stats, /messages routes
3. Implement API token decryption in sendWhatsAppMessage (use getTenantKey pattern from crypto.js)
4. Add RLS policies for all 3 WhatsApp tables
5. Verify all 7 lawyer commands work end-to-end
6. Add Zod validation to /send and /settings endpoints
7. Add input sanitization for WhatsApp message content
Write your full response in Arabic.
```

### سوبر برومبت R11

```
Fix ALL 14 bugs found in Malaf platform in order: Critical → High → Medium → Low.

CRITICAL (fix NOW):
BUG-001: Auth middleware — remove demo mode from production, add JWT verification
BUG-002: WhatsApp routes — add authMiddleware
BUG-003: WhatsApp tables — create in Supabase

HIGH (fix before demo):
BUG-004: CORS — restrict to production domain only
BUG-005: Video tenant isolation — add org_id filter
BUG-006: Video table name — unify to video_rooms
BUG-007: SERVICE_ROLE_KEY in .env — move to .env.local
BUG-008: ANON_KEY hardcoded — use sync: false

Each fix must not break other features. Test after every fix. Write your full response in Arabic.
```

### سوبر برومبت R12

```
Create complete investor readiness plan for Malaf — Egyptian law firm SaaS:
1. Investor pitch narrative in Arabic (problem → solution → market → traction)
2. Demo script: exactly what pages to show, in what order, what to say
3. Top 5 questions investors will ask + prepared answers
4. Egyptian legal market sizing (TAM/SAM/SOM in EGP)
5. Competitive positioning matrix vs Clio/MyCase/local alternatives
6. 12-month roadmap: mobile app, OCR, payment integration, e-litigation API
7. Pricing tiers: starter (200 ج.م), pro (500 ج.م), enterprise (custom)
8. WhatsApp Bot + AI as killer differentiators
Write your full response in Arabic.
```

---

## خطة الإصلاح المرحلية

### 🔴 الـ 24 ساعة الأولى (حرجي)
1. إزالة `VITE_ENABLE_DEMO=true` من render.yaml
2. تفعيل JWT verification حقيقي في auth middleware
3. إضافة authMiddleware لـ WhatsApp routes
4. إنشاء جداول واتساب في Supabase

### 🟡 الأسبوع الأول (عالي)
5. إصلاح CORS في production
6. إضافة tenant isolation لـ Video routes
7. توحيد اسم جدول الفيديو
8. نقل المفاتيح الحساسة من .env
9. تغيير ANON_KEY لـ sync: false

### 🟢 الشهر الأول (متوسط)
10. تحسين CSP headers
11. إزالة مكتبة Google AI المكررة
12. إضافة engines field
13. تطوير الـ 6 صفحات الأساسية

### ⚪ لاحقاً (منخفض)
14. تنظيف indexes مكررة
15. تحسين seedDemoData logic
