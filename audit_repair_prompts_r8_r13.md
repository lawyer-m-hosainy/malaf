# سوبر برومبتات الإصلاح — الجزء الثاني (R8 → R13)

---

## R8 — سوبر برومبت إصلاح واجهة Arabic RTL

```
You are an Arabic RTL UI/UX specialist reviewing an Egyptian
law firm SaaS platform built with Tailwind CSS + shadcn/ui.

ISSUES FOUND IN AUDIT:

1. [HIGH] FONT: Using Geist (Latin font) instead of Arabic font
   File: package.json has "@fontsource-variable/geist"
   Fix: Replace with Google Fonts Cairo or Tajawal
   - Install: @fontsource-variable/cairo
   - Update index.css to use font-family: 'Cairo Variable'
   - Ensure weights 400, 600, 700 available

2. [MEDIUM] DATE FORMAT: Using date-fns without Arabic locale
   Fix: Import and use ar-EG locale consistently:
   import { ar } from 'date-fns/locale'
   format(date, 'EEEE d MMMM yyyy', { locale: ar })

3. [MEDIUM] CURRENCY INCONSISTENCY:
   Some files use "ج.م" ✅, others still use "ر.س" ❌
   Complete sweep needed across ALL 48 view files.

4. [LOW] NUMBER FORMAT:
   Consider using Arabic-Indic numerals (٠١٢٣٤٥٦٧٨٩)
   for legal documents, but Western numerals for UI.

5. [LOW] PHONE FORMAT:
   Egyptian phone validation: /^\+201[0-9]{9}$/
   Display format: 01XX-XXX-XXXX
   Ensure all phone inputs accept this format.

ALSO CHECK:
- All shadcn/ui components render RTL correctly
- Dialog/Sheet components open from correct side
- Sidebar scroll direction correct
- Table header alignment (text-start not text-left)
- Badge text direction
- Toast notifications position (top-center is fine)
- Calendar component RTL

DO NOT CHANGE:
- Color scheme
- Spacing
- Border radius
- Animation durations
- Component structure

Write your full response in Arabic.
```

---

## R9 — سوبر برومبت تحسين الأداء

```
You are a performance engineer optimizing an Egyptian law firm
SaaS platform for free-tier hosting (Vercel + Supabase).

CURRENT ARCHITECTURE:
- React 19 + Vite SPA (will migrate to Next.js 14)
- 48 lazy-loaded pages
- Zustand stores (will migrate to Supabase)
- Firebase Firestore

PERFORMANCE ISSUES FOUND:

1. [HIGH] BOOTSTRAP LOADS EVERYTHING AT ONCE
   File: src/App.tsx lines 81-115
   Problem: Fetches ALL clients, cases, trust accounts,
   enforcement, tasks, team on app load.
   Fix: Fetch only dashboard data initially.
   Load other data when user navigates to that page.

2. [HIGH] NO DATA CACHING STRATEGY
   Every page navigation re-fetches from Firestore.
   Fix: Implement stale-while-revalidate pattern.
   In Next.js: use React Query or SWR.

3. [MEDIUM] LARGE BUNDLE SIZE (48 pages)
   Fix: In Next.js, automatic code splitting per route.
   Remove unused pages (17 orphan pages).

4. [MEDIUM] IMAGES NOT OPTIMIZED
   Fix: In Next.js, use next/image component.
   In current app: lazy load images.

5. [LOW] HEALTH CHECK POLLING EVERY 60 SECONDS
   File: App.tsx lines 117-134
   Fix: Use Vercel Analytics instead of custom polling.

FREE TIER PLANNING:

Supabase Free Tier Limits:
- 500MB database → Plan for ~50 orgs × 100 cases = safe
- 1GB storage → Plan for ~1000 documents × 1MB = safe
- 50,000 MAU → Plan for ~500 users = safe
- 500MB bandwidth → Monitor closely
- 2 Edge Functions → Use wisely

Vercel Free Tier Limits:
- 100GB bandwidth/month → Monitor
- 10-second serverless timeout → Keep queries fast
- No cron jobs → Use Supabase cron instead

SCALING TRIGGERS (when to upgrade):
1. >200 active organizations → Upgrade Supabase ($25/mo)
2. >5GB storage → Upgrade Supabase storage
3. >50GB bandwidth → Upgrade Vercel ($20/mo)

OPTIMIZATION PRIORITIES:
1. Database indexes on all WHERE clauses
2. Pagination on all list queries (limit 20)
3. Select only needed columns (no SELECT *)
4. Cache static data (courts list, expense categories)
5. Lazy load heavy components (charts, PDF viewer)

Write your full response in Arabic.
```

---

## R10 — سوبر برومبت إصلاح مولد المستندات AI

```
You are an AI/ML engineer building a legal document generator
for Egyptian lawyers. The system uses Gemini Flash for demo
and will use Claude Haiku in production.

CURRENT STATE:
- File: src/services/ai/mockResponses.ts
- Returns hardcoded responses (no real AI call)
- 3 mock assistant responses
- 1 mock draft template (contract)
- 1 mock document analysis response

REQUIRED IMPROVEMENTS:

1. [HIGH] CREATE 10 EGYPTIAN LEGAL TEMPLATES:
   a. صحيفة دعوى مدنية (Civil Lawsuit Filing)
   b. مذكرة دفاع (Defense Memorandum)
   c. صحيفة استئناف (Appeal Filing)
   d. صحيفة طعن بالنقض (Cassation Filing)
   e. إنذار رسمي على يد محضر (Official Notice)
   f. عقد أتعاب محاماة (Attorney Fee Agreement)
   g. توكيل رسمي عام/خاص (Power of Attorney)
   h. طلب تنفيذ حكم (Judgment Execution Request)
   i. مذكرة طعن أمام مجلس الدولة (Admin Court Appeal)
   j. محضر صلح (Settlement Agreement)

2. [HIGH] IMPLEMENT AUTO-FILL FROM CASE DATA:
   Each template should auto-fill:
   - client.name → اسم الموكل
   - client.nationalId → الرقم القومي
   - case.plaintiff → المدعي
   - case.defendant → المدعى عليه
   - case.court → المحكمة المختصة
   - case.first_instance_number → رقم القضية
   - poa.number + poa.year → رقم التوكيل

3. [MEDIUM] CONNECT TO GEMINI FLASH API:
   - Use @google/generative-ai package (already installed)
   - Strategy: 80% template + 15% DB auto-fill + 5% AI
   - AI generates ONLY the "facts" and "legal arguments"
   - Template structure is FIXED (not AI-generated)
   - Add disclaimer: "تم إنشاء هذا المستند بمساعدة AI
     ويجب مراجعته من محامٍ مختص قبل الاستخدام"

4. [MEDIUM] PDF EXPORT:
   - Use jspdf (already installed) + html2canvas
   - RTL Arabic text in PDF
   - Law firm letterhead (from org settings)
   - Court-appropriate formatting
   - Page numbers in Arabic

5. [LOW] USAGE TRACKING:
   - Track AI document count per org per month
   - Free plan: 5 AI docs/month
   - Basic plan: 20/month
   - Pro plan: unlimited

LEGAL ACCURACY RULES:
- All Egyptian law references must be real and current
- Court names must match Egyptian judiciary
- Legal terminology must be formal Arabic (فصحى)
- Document structure must follow Egyptian court standards

Write your full response in Arabic.
```

---

## R11 — سوبر برومبت جاهزية النشر

```
You are a DevOps engineer preparing an Egyptian law firm SaaS
platform for investor demo deployment.

TARGET: Vercel (web) + Supabase (backend) — both free tier.

DEPLOYMENT CHECKLIST:

1. VERCEL DEPLOYMENT:
   - [ ] Create Vercel project linked to GitHub repo
   - [ ] Set all environment variables:
     NEXT_PUBLIC_SUPABASE_URL=xxx
     NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
     SUPABASE_SERVICE_ROLE_KEY=xxx (server only)
     GEMINI_API_KEY=xxx (server only)
     RESEND_API_KEY=xxx (server only)
   - [ ] Configure custom domain (if available)
   - [ ] Verify build succeeds with zero errors
   - [ ] Test all routes load correctly
   - [ ] Configure redirects for old routes

2. SUPABASE SETUP:
   - [ ] Create production project (free tier)
   - [ ] Run all migration SQL scripts
   - [ ] Enable RLS on ALL tables
   - [ ] Create storage buckets (documents, avatars)
   - [ ] Configure Auth (email + phone providers)
   - [ ] Configure SMTP (Resend integration)
   - [ ] Deploy Edge Functions (if any)
   - [ ] Enable Realtime on needed tables

3. DEMO DATA SEEDING:
   Create script that seeds:
   - 3 demo organizations (مكتب النيل, مكتب الأهرام, مكتب الدلتا)
   - 5 lawyers per org (different roles)
   - 50 clients per org (mix of فرد and منشأة)
   - 100 cases per org (all types: مدني, جنائي, أسرة, إداري)
   - 200 sessions (past + upcoming)
   - 50 documents (with placeholder PDFs)
   - 30 invoices (mix of paid/unpaid)
   - 20 POAs (some expiring soon)
   - Timeline events for each case

4. DEMO ACCOUNTS:
   admin@mizan.app / Admin123! → super_admin
   nile@demo.app / Demo123! → org_admin (مكتب النيل)
   lawyer@demo.app / Demo123! → senior_lawyer
   trainee@demo.app / Demo123! → محامي_متدرب
   client@demo.app / Demo123! → client portal

5. MONITORING:
   - [ ] Vercel Analytics enabled
   - [ ] Supabase dashboard bookmarked
   - [ ] Error tracking (Sentry free tier optional)
   - [ ] Uptime monitoring (UptimeRobot free)

6. ONE-CLICK RESET:
   - [ ] Create /api/demo/reset endpoint (super_admin only)
   - [ ] Deletes all data and re-seeds demo data
   - [ ] Completes in <30 seconds
   - [ ] Protected by secret token

Write your full response in Arabic.
```

---

## R12 — سوبر برومبت إصلاح جميع الأخطاء

```
You are a senior QA engineer. Fix ALL 18 bugs found in the
comprehensive audit of this Egyptian law firm SaaS platform.

FIX IN THIS EXACT ORDER:

CRITICAL (fix in 24 hours):
BUG-001: No Multi-Tenant isolation (Firestore has no rules)
→ Fix: Migrate to Supabase with RLS on every table

BUG-002: Firebase config exposed in source code
→ Fix: Move to .env, add firebase-applet-config.json to .gitignore

BUG-003: 13 database tables missing
→ Fix: Create Supabase migration with all 18 tables

BUG-004: No multi-tier case numbering system
→ Fix: Add first_instance/appeal/cassation fields to Case type

HIGH (fix before demo):
BUG-005 to BUG-012: Currency "ر.س" in 8 files
→ Fix: Global find-replace "ر.س" with "ج.م" in ALL files

BUG-013 to BUG-015: "ناجز" references in 3 files
→ Fix: Replace with Egyptian equivalents

MEDIUM (fix this week):
BUG-016: zatca.ts still exists
→ Fix: Delete file, remove imports, check for broken references

BUG-017: 17 orphan pages not in sidebar
→ Fix: Either add useful ones to sidebar or remove unused ones

BUG-018: التوكيلات is not a separate page
→ Fix: Create /dashboard/poa route with dedicated POA page

RULES:
- Fix one bug at a time
- Test after each fix (no regressions)
- Do NOT change any UI styling
- Document what was changed for each fix
- If a fix requires multiple file changes, list all files

Write your full response in Arabic.
```

---

## R13 — سوبر برومبت التحضير للمستثمرين

```
You are a Product Manager preparing an Egyptian law firm SaaS
platform for investor presentation.

PLATFORM: ميزان مصر (Mizan Egypt)
TARGET MARKET: 150,000+ registered Egyptian lawyers
PRICING: Freemium model in Egyptian Pounds (EGP)

DELIVER THESE 8 ITEMS:

1. INVESTOR PITCH NARRATIVE (Arabic + English):
   - Problem: Egyptian lawyers use Excel + WhatsApp
   - Solution: All-in-one Arabic-first platform
   - Market size: 150K lawyers, 50K+ firms
   - Revenue model: SaaS subscriptions
   - Competitive advantage: Egyptian legal workflow + AI

2. DEMO SCRIPT (exactly what to show, 15 minutes):
   Minute 0-2: Login → Dashboard overview
   Minute 2-4: Add client → Create POA
   Minute 4-7: Create case → Add session → Timeline
   Minute 7-9: Financial module → Invoice → Payment
   Minute 9-11: AI document generator (wow factor)
   Minute 11-13: Mobile app preview (if available)
   Minute 13-15: Admin dashboard → Multi-tenant → Pricing

3. TOP 5 INVESTOR QUESTIONS AND ANSWERS:
   Q1: "How do you handle data security for legal data?"
   Q2: "What's your go-to-market strategy?"
   Q3: "Who are your competitors?"
   Q4: "What's your tech stack and why?"
   Q5: "What's your 12-month roadmap?"

4. MARKET SIZE NUMBERS:
   - TAM: All Egyptian lawyers (150K × $10/mo = $18M/yr)
   - SAM: Firms with 3+ lawyers (est. 15K × $30/mo = $5.4M/yr)
   - SOM: Year 1 target (500 firms × $20/mo = $120K/yr)

5. COMPETITIVE POSITIONING:
   vs Clio: Too expensive ($49+/user), English only
   vs MyCase: No Arabic, no Egyptian courts
   vs Local Excel: No automation, no collaboration
   vs WhatsApp groups: No organization, no records
   Mizan: Arabic-first, Egyptian courts, AI, affordable

6. 12-MONTH ROADMAP:
   Month 1-3: Core platform + 100 beta users
   Month 4-6: Mobile app + AI features + 500 users
   Month 7-9: Payment integration + 1000 users
   Month 10-12: Court API integration + 2000 users

7. PRICING JUSTIFICATION:
   Free: 1 lawyer, 10 cases, 100MB storage
   Basic (199 EGP/mo): 3 lawyers, 100 cases, 1GB, AI docs
   Pro (499 EGP/mo): 10 lawyers, unlimited, 10GB, priority
   Enterprise (999 EGP/mo): unlimited, API, white-label

8. RISK MITIGATION:
   Risk: Lawyers resist technology
   → Mitigation: Free tier + WhatsApp onboarding
   Risk: Data security concerns
   → Mitigation: Supabase RLS + encryption + audit logs
   Risk: Low willingness to pay
   → Mitigation: Start free, prove value, then upsell

Write your full response in Arabic.
```

---

# ✅ اكتمل التقرير الشامل

## الملفات المنشأة:
1. `audit_report_part1.md` — التقرير الرئيسي (R1-R13)
2. `audit_repair_prompts_r1_r7.md` — سوبر برومبتات R1-R7
3. `audit_repair_prompts_r8_r13.md` — سوبر برومبتات R8-R13 (هذا الملف)

## ترتيب التنفيذ الموصى به:
1. **R3** أولاً — تنظيف المراجع السعودية (أسرع إصلاح)
2. **R7** ثانياً — إصلاح سير العمل القانوني
3. **R5** ثالثاً — بناء قاعدة البيانات في Supabase
4. **R2** رابعاً — تطبيق أمان Multi-Tenant
5. **R1** خامساً — الترحيل إلى Next.js 14
