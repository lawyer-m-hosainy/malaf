# سوبر برومبتات الإصلاح — الجزء الأول (R1 → R7)

---

## R1 — سوبر برومبت فهم النظام وإعادة الهيكلة

```
You are a senior system architect migrating an Egyptian law firm
SaaS platform from React 19 + Vite + Firebase to Next.js 14 +
Supabase.

CURRENT STATE (what exists):
- Framework: React 19 + Vite (SPA) with react-router-dom v7
- State: Zustand (client-side stores)
- DB: Firebase Firestore (5 collections only)
- Auth: Firebase Auth
- 48 view files in src/views/
- 17 Zustand stores in src/store/
- UI: Tailwind CSS + shadcn/ui + Lucide icons + Framer Motion

TARGET STATE (what we need):
- Framework: Next.js 14 App Router + TypeScript
- DB: Supabase PostgreSQL (18+ tables with RLS)
- Auth: Supabase Auth (email + phone)
- Storage: Supabase Storage
- Hosting: Vercel (free tier)

TASK:
1. Create a detailed migration plan document
2. Map every existing React component to its Next.js equivalent
3. Map every Zustand store to Supabase table + server action
4. Identify which pages become Server Components vs Client
5. Plan the routing migration (react-router → App Router)
6. List all environment variables needed
7. Create a dependency migration matrix (what stays, what goes)

CONSTRAINTS:
- Zero UI/UX changes — all styles, animations, colors FROZEN
- Arabic RTL must be preserved
- All 48 existing views must have equivalents
- Incremental migration preferred (not big bang)

Output a detailed migration roadmap with phases and timelines.

Write your full response in Arabic.
```

---

## R2 — سوبر برومبت أمان Multi-Tenant

```
You are a Supabase RLS security expert. Design and implement
complete multi-tenant isolation for an Egyptian law firm SaaS.

CONTEXT:
- Platform serves multiple law firms (organizations)
- Each org has: lawyers, secretaries, trainees, clients
- Client portal allows clients to see only their own cases
- Super admin can see all organizations

REQUIRED TABLES (create RLS for each):
1. organizations
2. profiles (users linked to orgs)
3. clients
4. cases
5. sessions (court hearings)
6. documents
7. powers_of_attorney
8. invoices
9. payments
10. expenses
11. timeline_events
12. notifications
13. case_notes
14. tasks
15. document_templates
16. ai_documents
17. subscription_plans
18. expert_missions

FOR EACH TABLE, provide:
1. CREATE TABLE SQL with organization_id column
2. RLS ENABLE statement
3. SELECT policy (users see only their org's data)
4. INSERT policy (users insert only to their org)
5. UPDATE policy (users update only their org's data)
6. DELETE policy (soft delete preferred)
7. Client portal policy (clients see only their cases)
8. Super admin bypass policy

ALSO provide:
- auth.users metadata structure (org_id, role)
- Helper function: get_user_org_id()
- Helper function: get_user_role()
- Storage bucket policies (per-org folders)
- Realtime subscription filters

Security rules:
- organization_id NEVER from user input
- Always from auth.jwt() -> raw_user_meta_data
- Client role cannot access lawyer routes
- Trainee cannot delete anything

Write your full response in Arabic.
```

---

## R3 — سوبر برومبت إصلاح واجهة الويب

```
You are a Next.js 14 + Arabic RTL expert. Fix all broken web UI
elements for an Egyptian law firm SaaS platform.

CURRENT BUGS TO FIX:

1. CURRENCY BUG — Files still showing "ر.س" instead of "ج.م":
   - src/views/TrustAccounting.tsx (lines 106, 127, 137, 190)
   - src/views/TimeTracking.tsx (line 275)
   - src/views/PartnerReporting.tsx (lines 61, 62, 107, 203)
   - src/views/BDDashboard.tsx (lines 44, 45, 153, 218)
   - src/views/Analytics.tsx (lines 92, 94)
   - src/views/IPOperations.tsx (lines 152, 169, 208)
   - src/modules/onboarding/OnboardingFlow.tsx (line 148)
   - src/modules/admin/GlobalAdmin.tsx (lines 64, 105)

2. SAUDI REFERENCE BUG — Files still mentioning "ناجز":
   - src/views/TrainingPortal.tsx (line 261)
   - src/views/LegalQA.tsx (lines 102, 368)
   - src/views/InternalWiki.tsx (line 107)

3. ORPHAN FILE — Must delete:
   - src/lib/zatca.ts (Saudi ZATCA QR code module)

4. VAT RATE BUG — Files showing 15% instead of 14%:
   - src/views/PartnerReporting.tsx (line 62)
   - src/views/Finance.tsx (check all VAT references)

5. SIDEBAR NOT MATCHING ROUTES:
   - "التوكيلات" href points to /dashboard/clients (same as
     الموكلين) — needs its own route /dashboard/poa

RULES:
- Fix ONLY the bugs listed above
- Do NOT change any CSS, colors, spacing, animations
- Replace "ر.س" with "ج.م" everywhere
- Replace "ناجز" with Egyptian equivalent
- Replace 15% VAT with 14% where applicable
- Delete zatca.ts and remove any imports of it

Write your full response in Arabic.
```

---

## R4 — سوبر برومبت Flutter (ملاحظة: غير متاح)

```
NOTICE: No Flutter mobile app exists yet for this platform.
This prompt is reserved for when Flutter development begins.

When Flutter development starts, use this template:

You are a Flutter 3.x expert building a mobile app for an
Egyptian law firm SaaS platform.

Stack: Flutter 3.x + Riverpod + go_router + Supabase Flutter SDK
+ Hive (offline-first) + Google Fonts (Cairo)

Design requirements:
- Full Arabic RTL support (Directionality.rtl)
- Cairo font from Google Fonts
- Match web UI color scheme exactly
- Offline-first with Hive cache
- Push notifications for session reminders

Screens to build (matching web):
1. Splash + Onboarding (3 slides)
2. Login (email + phone)
3. Dashboard Home
4. Cases List + Detail (5 tabs)
5. Clients List + Detail
6. Sessions List + Add Session
7. Documents Grid + Upload (camera)
8. Finances + Invoices
9. Calendar
10. Notifications
11. Settings + Profile

Write your full response in Arabic.
```

---

## R5 — سوبر برومبت إصلاح قاعدة البيانات

```
You are a Supabase PostgreSQL expert. Create the complete
database schema for an Egyptian law firm SaaS platform.

REQUIREMENTS:
- Multi-tenant: every table has organization_id
- Soft delete: deleted_at column on main tables
- Audit trail: created_at, updated_at, created_by
- Arabic enum values for status fields
- Egyptian legal domain accuracy

CREATE THESE 18 TABLES:

1. organizations (id, name, subscription_plan, created_at)

2. profiles (id, organization_id, email, full_name, role,
   phone, bar_number, is_active)
   Roles: 'محامي_شريك' | 'مدير_مكتب' | 'محامي' | 'محامي_متدرب'
          | 'سكرتير' | 'موكل'

3. clients (id, organization_id, type ['فرد'|'منشأة'], name,
   national_id_encrypted, phone, governorate, religion,
   marital_status, commercial_registration_encrypted)

4. cases (id, organization_id, client_id, type, court,
   status, plaintiff, defendant, power_of_attorney_ref,
   -- Multi-tier numbering:
   first_instance_number, first_instance_year, first_instance_court,
   appeal_number, appeal_year, appeal_court,
   cassation_number, cassation_year,
   state_council_number, state_council_year_q,
   -- Criminal fields:
   criminal_tier, criminal_stage, prosecution_ref,
   -- Family fields:
   family_case_type,
   current_tier ['ابتدائي'|'مستأنف'|'نقض'|'إعادة'])

5. sessions (id, organization_id, case_id, date, time,
   court, circuit, status, previous_decision,
   postponement_reason, next_session_date, lawyer_id, notes)

6. powers_of_attorney (id, organization_id, client_id,
   poa_number, poa_letter, poa_year, notary_office,
   type ['عام'|'خاص'|'قضايا'|'بنوك'], status, expiry_date)

7. documents (id, organization_id, case_id, client_id,
   file_name, file_url, category, shared_with_client, size)

8. invoices (id, organization_id, client_id, invoice_number,
   base_amount, vat_amount, stamp_duty, total, status, date)

9. payments (id, organization_id, invoice_id, amount,
   method, date, notes)

10. expenses (id, organization_id, case_id, client_id,
    category, amount, date, status, description,
    requires_partner_approval)
    Categories: 'دمغة محاماة'|'رسوم نقابة'|'أمانة خبير'|
    'رسم إعلان (محضر)'|'رسوم قضائية'|'مصروفات انتقال'|
    'مصروفات طباعة ونسخ'|'أمانة تنفيذ'|'رسوم شهر عقاري'|'أخرى'

11. trust_accounts (id, organization_id, client_id,
    case_id, amount, type, status, description, date)

12. timeline_events (id, organization_id, case_id,
    event_type, description, event_date, created_by)

13. notifications (id, organization_id, user_id,
    title, body, type, is_read, case_id, created_at)

14. tasks (id, organization_id, case_id, assigned_to,
    title, description, due_date, status, priority)

15. expert_missions (id, organization_id, case_id,
    expert_name, mission_type, deposit_amount,
    hearing_date, report_status, notes)

16. enforcement_cases (id, organization_id, case_id,
    judgment_date, enforcement_number, execution_court,
    status, collected_amount, remaining_amount)

17. document_templates (id, organization_id, title,
    content, category, placeholders)

18. subscription_plans (id, name, max_lawyers, max_cases,
    max_storage_mb, price_monthly_egp, features)

ALSO CREATE:
- All necessary indexes for performance
- Trigger: auto-create timeline_event on case status change
- Trigger: auto-create timeline_event on session creation
- Trigger: auto-update invoice remaining on payment
- Function: calculate_deadline(case_type, judgment_date)
  Returns: appeal_deadline, cassation_deadline
- Egyptian deadline constants:
  Civil appeal: 40 days
  Cassation: 60 days
  Admin appeal: 60 days
  Criminal opposition: 10 days
  Criminal appeal: 10 days

Output: Complete SQL migration file ready to paste in Supabase
SQL Editor.

Write your full response in Arabic.
```

---

## R6 — سوبر برومبت إصلاح الأمان الشامل

```
You are a security engineer auditing an Egyptian law firm SaaS
platform being migrated from Firebase to Supabase.

CRITICAL ISSUES TO FIX (from audit):

1. [CRITICAL] Firebase config exposed in source code
   File: firebase-applet-config.json
   Fix: Move to environment variables, add to .gitignore

2. [CRITICAL] No Firestore Security Rules
   Fix: Create proper rules OR migrate to Supabase RLS

3. [CRITICAL] Encryption key hardcoded
   File: src/lib/encryption.ts
   Fix: Move key to env variable, use proper key management

4. [CRITICAL] DEMO_TENANT_ID fallback exposes demo data
   File: src/lib/tenant.ts
   Fix: Return null instead of demo fallback, handle in UI

5. [HIGH] No session expiry configuration
   Fix: Configure Supabase Auth session lifetime

6. [HIGH] No rate limiting on client-side
   Fix: Implement in Next.js middleware

7. [HIGH] console.error leaks internal info
   File: src/lib/firebase.ts
   Fix: Use structured logging, hide details in production

8. [MEDIUM] zatca.ts still exists (Saudi reference)
   Fix: Delete file and all imports

ALSO IMPLEMENT:
- Content Security Policy headers
- CORS configuration for production
- Input sanitization for AI prompts
- File upload validation (type + size)
- Signed URLs for document downloads (expire in 1 hour)
- Audit log for all data access (who viewed what)

RULES:
- Every fix must include exact code changes
- Never expose service_role key client-side
- All fixes must be backward compatible
- Test each fix independently

Write your full response in Arabic.
```

---

## R7 — سوبر برومبت تصحيح سير العمل القانوني المصري

```
You are an Egyptian legal-tech expert. Fix all legal workflow
gaps in this law firm management platform.

CRITICAL GAPS TO FIX:

1. [CRITICAL] MULTI-TIER CASE NUMBERING
   Current: Case has single id field
   Required: Support 3 separate numbers in ONE case record:
   - First instance: رقم / سنة / محكمة (e.g., "123 لسنة 2025 كلي")
   - Appeal: رقم / سنة / محكمة استئناف
   - Cassation: رقم / سنة / محكمة النقض
   - State Council format: "75 لسنة 77 ق" (ق = قضائية)

   Implementation:
   - Add fields to Case type: first_instance_number,
     first_instance_year, appeal_number, appeal_year,
     cassation_number, cassation_year, state_council_year_q
   - Update NewCaseDialog to show tier-specific fields
   - Add "إضافة درجة طعن" button in case detail
   - current_tier field tracks which tier is active

2. [CRITICAL] AUTOMATIC DEADLINE CALCULATOR
   When a judgment is recorded, auto-calculate:
   - Civil appeal deadline: judgment_date + 40 days
   - Cassation deadline: judgment_date + 60 days
   - Criminal opposition: judgment_date + 10 days
   - Criminal appeal: judgment_date + 10 days
   - Admin appeal: notification_date + 60 days
   Skip Fridays (Egyptian weekend) in calculation.
   Skip judicial recess (July 1 - October 1).
   Create notification 7 days before each deadline.

3. [CRITICAL] AUTO-TRANSITION TO ENFORCEMENT
   When case status changes to "حكم نهائي":
   - Auto-create entry in enforcement_cases table
   - First task: "استخراج صيغة تنفيذية"
   - Show case in التنفيذ القضائي section
   - Calculate enforcement deadline

4. [HIGH] SEPARATE POA PAGE
   Create /dashboard/poa route with:
   - All POAs across all clients
   - Filter by: status, type, expiry
   - Alert badges for expiring in 30 days
   - Alert badges for cancellation requests
   - Quick link to associated client and cases

5. [HIGH] NOTIFICATION ENGINE
   Implement notifications for:
   - Session reminder: 48h + 24h + day-of
   - POA expiry: 30 days before
   - Deadline approaching: 7 days before
   - Invoice overdue: on due date + weekly
   - Expert mission hearing: 48h before

6. [MEDIUM] CASE TYPE DETERMINES UI
   When creating a case, selected type should:
   - "جنائي" → show criminal tier + stage fields
   - "أحوال شخصية" → show family case type dropdown
   - "إداري" → show State Council number format
   - "اقتصادي" → show commercial reg + tax ID fields
   - Default → standard civil case fields

RULES:
- All Arabic legal terminology must be accurate
- Court names must match Egyptian judiciary structure
- Deadline calculations must account for Egyptian calendar
- UI changes must use existing design system (no new CSS)

Write your full response in Arabic.
```
