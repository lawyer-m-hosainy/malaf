-- ============================================================
-- منصة "ملف" (Malaf Egypt SaaS) - قاعدة البيانات الكاملة
-- Supabase PostgreSQL + Row Level Security
-- ============================================================

-- ============================================================
-- 1. الإضافات (Extensions)
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- للبحث النصي
CREATE EXTENSION IF NOT EXISTS "unaccent"; -- للبحث العربي

-- ============================================================
-- 2. الجداول الأساسية
-- ============================================================

-- 2.1 المكاتب / المنظمات
CREATE TABLE IF NOT EXISTS public.organizations (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL,
    slug        TEXT UNIQUE,
    plan        TEXT NOT NULL DEFAULT 'free', -- free | pro | enterprise
    logo_url    TEXT,
    phone       TEXT,
    email       TEXT,
    address     TEXT,
    tax_id      TEXT,
    bar_number  TEXT,   -- رقم نقابة المحامين
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.2 الملفات الشخصية للمستخدمين
CREATE TABLE IF NOT EXISTS public.profiles (
    id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id           UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    full_name        TEXT,
    role             TEXT NOT NULL DEFAULT 'محامي',
    -- roles: محامي | مدير_مكتب | مساعد_محامي | محاسب | super_admin | عميل_بوابة
    email            TEXT,
    phone            TEXT,
    avatar_url       TEXT,
    bar_number       TEXT,   -- رقم النقابة للمحامي
    linked_client_id UUID,   -- يُحدَّث لاحقاً (FK إلى clients)
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at    TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. العملاء ووكلاء النيابة
-- ============================================================

-- 3.1 العملاء
CREATE TABLE IF NOT EXISTS public.clients (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id             UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    type               TEXT NOT NULL DEFAULT 'individual', -- individual | company
    name               TEXT NOT NULL,
    national_id        TEXT,
    company_reg_number TEXT,
    tax_id             TEXT,
    address            TEXT,
    phone              TEXT,
    email              TEXT,
    nationality        TEXT,
    date_of_birth      DATE,
    notes              TEXT,
    tags               TEXT[],
    is_active          BOOLEAN NOT NULL DEFAULT TRUE,
    portal_access      BOOLEAN NOT NULL DEFAULT FALSE,
    created_by         UUID NOT NULL REFERENCES public.profiles(id),
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FK المؤجل: ربط profiles.linked_client_id
ALTER TABLE public.profiles
    ADD CONSTRAINT fk_profiles_linked_client
    FOREIGN KEY (linked_client_id) REFERENCES public.clients(id) ON DELETE SET NULL;

-- ============================================================
-- 4. المستندات (مبكراً لأن جداول أخرى تعتمد عليها)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.documents (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id       UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    case_id      UUID,  -- FK يُضاف لاحقاً
    client_id    UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    name         TEXT NOT NULL,
    file_path    TEXT NOT NULL,  -- Supabase Storage path
    file_type    TEXT NOT NULL,  -- pdf | docx | jpg | ...
    file_size    BIGINT NOT NULL DEFAULT 0,
    description  TEXT,
    is_template  BOOLEAN NOT NULL DEFAULT FALSE,
    tags         TEXT[],
    ai_summary   TEXT,   -- ملخص الذكاء الاصطناعي
    uploaded_by  UUID NOT NULL REFERENCES public.profiles(id),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. وكلاء النيابة (POA)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.poa (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id       UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id    UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    poa_number   TEXT NOT NULL,
    issue_date   DATE,
    expiry_date  DATE,
    type         TEXT,  -- عامة | خاصة | قضائية
    description  TEXT,
    document_id  UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_by   UUID NOT NULL REFERENCES public.profiles(id),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 6. القضايا والجلسات
-- ============================================================

-- 6.1 القضايا
CREATE TABLE IF NOT EXISTS public.cases (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id           UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id        UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
    case_number      TEXT NOT NULL,
    title            TEXT NOT NULL,
    type             TEXT NOT NULL,
    -- civil | criminal | family | commercial | labor | administrative | constitutional | real_estate | intellectual_property | enforcement
    status           TEXT NOT NULL DEFAULT 'open',
    -- open | closed | pending | on_hold | appealed | settled
    court            TEXT,
    court_circuit    TEXT,   -- الدائرة
    judge            TEXT,
    opposing_party   TEXT,
    opposing_lawyer  TEXT,
    description      TEXT,
    priority         TEXT NOT NULL DEFAULT 'medium', -- low | medium | high | urgent
    start_date       DATE,
    end_date         DATE,
    estimated_value  DECIMAL(15,2),  -- قيمة النزاع
    fee_arrangement  TEXT,  -- fixed | hourly | contingency
    agreed_fee       DECIMAL(15,2),
    notes            TEXT,
    created_by       UUID NOT NULL REFERENCES public.profiles(id),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FK المؤجل في documents
ALTER TABLE public.documents
    ADD CONSTRAINT fk_documents_case
    FOREIGN KEY (case_id) REFERENCES public.cases(id) ON DELETE SET NULL;

-- 6.2 جلسات القضايا
CREATE TABLE IF NOT EXISTS public.case_sessions (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id            UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    case_id           UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    session_date      TIMESTAMPTZ NOT NULL,
    location          TEXT,
    notes             TEXT,
    outcome           TEXT,
    next_session_date TIMESTAMPTZ,
    session_type      TEXT,  -- hearing | judgment | postponement | settlement
    judge             TEXT,
    attendees         TEXT[], -- أسماء الحاضرين
    created_by        UUID NOT NULL REFERENCES public.profiles(id),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6.3 محامو القضية (multi-lawyer support)
CREATE TABLE IF NOT EXISTS public.case_lawyers (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    case_id    UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role       TEXT NOT NULL DEFAULT 'lawyer', -- lead_lawyer | assisting_lawyer | trainee
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (case_id, profile_id)
);

-- ============================================================
-- 7. المالية
-- ============================================================

-- 7.1 الفواتير
CREATE TABLE IF NOT EXISTS public.invoices (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id         UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id      UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
    case_id        UUID REFERENCES public.cases(id) ON DELETE SET NULL,
    invoice_number TEXT NOT NULL,
    issue_date     DATE NOT NULL,
    due_date       DATE,
    total_amount   DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_amount     DECIMAL(15,2) NOT NULL DEFAULT 0,
    discount       DECIMAL(15,2) NOT NULL DEFAULT 0,
    paid_amount    DECIMAL(15,2) NOT NULL DEFAULT 0,
    status         TEXT NOT NULL DEFAULT 'draft',
    -- draft | sent | paid | partially_paid | overdue | cancelled
    currency       TEXT NOT NULL DEFAULT 'EGP',
    notes          TEXT,
    eta_invoice_id TEXT,  -- رقم الفاتورة الإلكترونية في منظومة ETA
    created_by     UUID NOT NULL REFERENCES public.profiles(id),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (org_id, invoice_number)
);

-- 7.2 بنود الفواتير
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id  UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity    INT NOT NULL DEFAULT 1,
    unit_price  DECIMAL(15,2) NOT NULL,
    total       DECIMAL(15,2) NOT NULL,
    tax_rate    DECIMAL(5,2) NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7.3 المصاريف
CREATE TABLE IF NOT EXISTS public.expenses (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id              UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    case_id             UUID REFERENCES public.cases(id) ON DELETE SET NULL,
    client_id           UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    date                DATE NOT NULL,
    category            TEXT NOT NULL,
    description         TEXT NOT NULL,
    amount              DECIMAL(15,2) NOT NULL,
    is_billable         BOOLEAN NOT NULL DEFAULT TRUE,
    is_reimbursed       BOOLEAN NOT NULL DEFAULT FALSE,
    receipt_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    created_by          UUID NOT NULL REFERENCES public.profiles(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7.4 حسابات الثقة (Trust Accounts)
CREATE TABLE IF NOT EXISTS public.trust_accounts (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id       UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id    UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
    account_name TEXT NOT NULL,
    balance      DECIMAL(15,2) NOT NULL DEFAULT 0,
    currency     TEXT NOT NULL DEFAULT 'EGP',
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    notes        TEXT,
    created_by   UUID NOT NULL REFERENCES public.profiles(id),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7.5 حركات حسابات الثقة
CREATE TABLE IF NOT EXISTS public.trust_transactions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    trust_account_id UUID NOT NULL REFERENCES public.trust_accounts(id) ON DELETE CASCADE,
    type            TEXT NOT NULL, -- deposit | withdrawal | transfer
    amount          DECIMAL(15,2) NOT NULL,
    description     TEXT NOT NULL,
    reference       TEXT,
    transaction_date DATE NOT NULL,
    document_id     UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    created_by      UUID NOT NULL REFERENCES public.profiles(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7.6 خطط الدفع
CREATE TABLE IF NOT EXISTS public.payment_plans (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id         UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    invoice_id     UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    client_id      UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
    total_amount   DECIMAL(15,2) NOT NULL,
    installments   INT NOT NULL DEFAULT 1,
    status         TEXT NOT NULL DEFAULT 'active', -- active | completed | defaulted
    notes          TEXT,
    created_by     UUID NOT NULL REFERENCES public.profiles(id),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7.7 أقساط خطط الدفع
CREATE TABLE IF NOT EXISTS public.payment_installments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    payment_plan_id UUID NOT NULL REFERENCES public.payment_plans(id) ON DELETE CASCADE,
    due_date        DATE NOT NULL,
    amount          DECIMAL(15,2) NOT NULL,
    paid_amount     DECIMAL(15,2) NOT NULL DEFAULT 0,
    paid_date       DATE,
    status          TEXT NOT NULL DEFAULT 'pending', -- pending | paid | overdue | partial
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7.8 التحصيل (Collections)
CREATE TABLE IF NOT EXISTS public.collections (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    invoice_id  UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    client_id   UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
    amount      DECIMAL(15,2) NOT NULL,
    method      TEXT NOT NULL, -- cash | bank_transfer | check | online
    reference   TEXT,
    payment_date DATE NOT NULL,
    notes       TEXT,
    document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    created_by  UUID NOT NULL REFERENCES public.profiles(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 8. المهام وتتبع الوقت
-- ============================================================

-- 8.1 المهام
CREATE TABLE IF NOT EXISTS public.tasks (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    case_id     UUID REFERENCES public.cases(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title       TEXT NOT NULL,
    description TEXT,
    status      TEXT NOT NULL DEFAULT 'todo', -- todo | in_progress | done | cancelled
    priority    TEXT NOT NULL DEFAULT 'medium', -- low | medium | high | urgent
    due_date    TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    tags        TEXT[],
    created_by  UUID NOT NULL REFERENCES public.profiles(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8.2 تتبع الوقت
CREATE TABLE IF NOT EXISTS public.time_entries (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id           UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    case_id          UUID REFERENCES public.cases(id) ON DELETE SET NULL,
    task_id          UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    description      TEXT NOT NULL,
    duration_minutes INT NOT NULL,
    date             DATE NOT NULL,
    billable         BOOLEAN NOT NULL DEFAULT TRUE,
    hourly_rate      DECIMAL(10,2),
    invoiced         BOOLEAN NOT NULL DEFAULT FALSE,
    invoice_id       UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 9. العقود وإدارة دورة حياة العقود (CLM)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contracts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id       UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
    title           TEXT NOT NULL,
    contract_number TEXT NOT NULL,
    type            TEXT, -- service | employment | lease | sale | partnership | nda | ...
    status          TEXT NOT NULL DEFAULT 'draft',
    -- draft | under_review | active | expired | terminated | renewed
    start_date      DATE,
    end_date        DATE,
    auto_renew      BOOLEAN NOT NULL DEFAULT FALSE,
    value           DECIMAL(15,2),
    document_id     UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    description     TEXT,
    parties         JSONB,  -- أطراف العقد
    milestones      JSONB,  -- مراحل العقد
    renewal_notice_days INT DEFAULT 30,
    created_by      UUID NOT NULL REFERENCES public.profiles(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (org_id, contract_number)
);

-- 9.1 مراحل مراجعة العقد (CLM Workflow)
CREATE TABLE IF NOT EXISTS public.contract_reviews (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES public.profiles(id),
    status      TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected | changes_requested
    comments    TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 10. الملكية الفكرية (IP Management)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ip_assets (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id           UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id        UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
    type             TEXT NOT NULL, -- trademark | patent | copyright | trade_secret | domain
    title            TEXT NOT NULL,
    registration_no  TEXT,
    application_date DATE,
    registration_date DATE,
    expiry_date      DATE,
    status           TEXT NOT NULL DEFAULT 'pending',
    -- pending | registered | expired | opposed | cancelled | renewed
    jurisdiction     TEXT DEFAULT 'EG',
    classes          TEXT[], -- فئات التسجيل
    description      TEXT,
    document_id      UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    renewal_reminder_days INT DEFAULT 90,
    created_by       UUID NOT NULL REFERENCES public.profiles(id),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10.1 عمليات الملكية الفكرية
CREATE TABLE IF NOT EXISTS public.ip_operations (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    ip_asset_id UUID NOT NULL REFERENCES public.ip_assets(id) ON DELETE CASCADE,
    type        TEXT NOT NULL, -- renewal | opposition | assignment | license | watch
    date        DATE NOT NULL,
    status      TEXT NOT NULL DEFAULT 'pending',
    description TEXT,
    fees        DECIMAL(15,2),
    document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    created_by  UUID NOT NULL REFERENCES public.profiles(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 11. التقويم
-- ============================================================
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    case_id     UUID REFERENCES public.cases(id) ON DELETE SET NULL,
    session_id  UUID REFERENCES public.case_sessions(id) ON DELETE SET NULL,
    created_by  UUID NOT NULL REFERENCES public.profiles(id),
    title       TEXT NOT NULL,
    description TEXT,
    event_type  TEXT NOT NULL DEFAULT 'general',
    -- general | court_session | deadline | meeting | reminder | task
    start_time  TIMESTAMPTZ NOT NULL,
    end_time    TIMESTAMPTZ NOT NULL,
    location    TEXT,
    all_day     BOOLEAN NOT NULL DEFAULT FALSE,
    reminder_minutes INT,
    attendees   UUID[], -- profile IDs
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    recurrence_rule TEXT,  -- RRULE string
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 12. أعضاء الفريق
-- ============================================================
CREATE TABLE IF NOT EXISTS public.team_members (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    profile_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role        TEXT NOT NULL,
    permissions TEXT[],
    joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (org_id, profile_id)
);

-- ============================================================
-- 13. التنفيذ القضائي (Enforcement)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.enforcement_cases (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id           UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    case_id          UUID REFERENCES public.cases(id) ON DELETE SET NULL,
    client_id        UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
    enforcement_no   TEXT NOT NULL,
    enforcement_type TEXT NOT NULL, -- judgment | arbitral_award | deed
    debtor_name      TEXT NOT NULL,
    debt_amount      DECIMAL(15,2) NOT NULL,
    collected_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    status           TEXT NOT NULL DEFAULT 'open',
    court            TEXT,
    filing_date      DATE,
    description      TEXT,
    created_by       UUID NOT NULL REFERENCES public.profiles(id),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 14. التحقق من التعارض (Conflict Check)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.conflict_checks (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id        UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    checked_by    UUID NOT NULL REFERENCES public.profiles(id),
    search_term   TEXT NOT NULL,
    check_type    TEXT NOT NULL DEFAULT 'client', -- client | opposing_party | lawyer
    results       JSONB,
    has_conflict  BOOLEAN NOT NULL DEFAULT FALSE,
    notes         TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 15. المكتبة القانونية
-- ============================================================
CREATE TABLE IF NOT EXISTS public.legal_library (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    type        TEXT NOT NULL,
    -- law | regulation | ministerial_decree | precedent | template | article | form
    category    TEXT,
    content     TEXT,
    document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    tags        TEXT[],
    is_public   BOOLEAN NOT NULL DEFAULT FALSE, -- مشاركة مع جميع مستخدمي المنصة
    views_count INT NOT NULL DEFAULT 0,
    created_by  UUID NOT NULL REFERENCES public.profiles(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 16. الويكي الداخلي (Internal Wiki)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wiki_pages (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    slug        TEXT NOT NULL,
    content     TEXT,
    parent_id   UUID REFERENCES public.wiki_pages(id) ON DELETE SET NULL,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    tags        TEXT[],
    created_by  UUID NOT NULL REFERENCES public.profiles(id),
    updated_by  UUID REFERENCES public.profiles(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (org_id, slug)
);

-- ============================================================
-- 17. بوابة العملاء (Client Portal)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.client_portal_settings (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id       UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    is_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
    welcome_msg  TEXT,
    logo_url     TEXT,
    primary_color TEXT DEFAULT '#1a56db',
    features     JSONB, -- الميزات المفعّلة في البوابة
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (org_id)
);

-- 17.1 رسائل بوابة العملاء
CREATE TABLE IF NOT EXISTS public.portal_messages (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id   UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    sender_id   UUID NOT NULL REFERENCES public.profiles(id),
    content     TEXT NOT NULL,
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    direction   TEXT NOT NULL DEFAULT 'outbound', -- inbound | outbound
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 18. الوحدات المصرية المتخصصة
-- ============================================================

-- 18.1 محاكم الأسرة
CREATE TABLE IF NOT EXISTS public.family_court_cases (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    case_id         UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    case_subtype    TEXT NOT NULL,
    -- divorce | alimony | custody | guardianship | inheritance | khol | reconciliation
    personal_status TEXT,
    party_a         JSONB,  -- بيانات الطرف الأول
    party_b         JSONB,  -- بيانات الطرف الثاني
    children        JSONB,  -- بيانات الأطفال
    alimony_amount  DECIMAL(15,2),
    custody_details TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18.2 القضايا الجنائية
CREATE TABLE IF NOT EXISTS public.criminal_cases (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    case_id         UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    crime_type      TEXT NOT NULL,
    accusation      TEXT,
    penalty_code    TEXT,   -- مادة قانون العقوبات
    detention_status TEXT,  -- detained | released | bail
    bail_amount     DECIMAL(15,2),
    victims         JSONB,
    witnesses       JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18.3 المحاكم الاقتصادية
CREATE TABLE IF NOT EXISTS public.economic_court_cases (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    case_id         UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    case_subtype    TEXT NOT NULL,
    -- bankruptcy | commercial_dispute | capital_market | competition | intellectual_property
    commercial_reg  TEXT,
    disputed_amount DECIMAL(15,2),
    liquidator      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18.4 مجلس الدولة (القضاء الإداري)
CREATE TABLE IF NOT EXISTS public.state_council_cases (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    case_id         UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    case_subtype    TEXT NOT NULL,
    -- annulment | compensation | disciplinary | contracts | tax
    respondent_authority TEXT,
    disputed_decision    TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18.5 شهر العقاري (Real Estate Registry)
CREATE TABLE IF NOT EXISTS public.real_estate_transactions (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id            UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id         UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
    case_id           UUID REFERENCES public.cases(id) ON DELETE SET NULL,
    transaction_type  TEXT NOT NULL,
    -- registration | mortgage | cancellation | transfer | annotation
    property_description TEXT NOT NULL,
    property_area     DECIMAL(10,2),
    property_location TEXT,
    plot_number       TEXT,
    district_number   TEXT,
    transaction_date  DATE,
    registry_no       TEXT,
    fees_paid         DECIMAL(15,2),
    status            TEXT NOT NULL DEFAULT 'pending',
    created_by        UUID NOT NULL REFERENCES public.profiles(id),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18.6 الفواتير الإلكترونية (ETA - منظومة الضرائب)
CREATE TABLE IF NOT EXISTS public.eta_invoices (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    invoice_id      UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    eta_uuid        TEXT,         -- UUID من منظومة ETA
    eta_submission_id TEXT,
    eta_long_id     TEXT,
    issuer_tin      TEXT NOT NULL, -- رقم التسجيل الضريبي للمُصدر
    receiver_tin    TEXT,          -- رقم التسجيل الضريبي للمستقبل
    eta_status      TEXT NOT NULL DEFAULT 'pending',
    -- pending | submitted | valid | invalid | cancelled
    submission_date TIMESTAMPTZ,
    response_data   JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18.7 التقاضي الإلكتروني (eLitigation)
CREATE TABLE IF NOT EXISTS public.elitigation_submissions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    case_id         UUID REFERENCES public.cases(id) ON DELETE SET NULL,
    submission_type TEXT NOT NULL, -- lawsuit | memorandum | appeal | response
    document_id     UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    platform_ref    TEXT,          -- رقم مرجعي من المنصة الإلكترونية
    status          TEXT NOT NULL DEFAULT 'draft',
    submitted_at    TIMESTAMPTZ,
    response_data   JSONB,
    created_by      UUID NOT NULL REFERENCES public.profiles(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18.8 مهام الخبراء القضائيين
CREATE TABLE IF NOT EXISTS public.expert_missions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    case_id         UUID REFERENCES public.cases(id) ON DELETE SET NULL,
    client_id       UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
    expert_name     TEXT NOT NULL,
    expert_type     TEXT NOT NULL, -- accounting | engineering | medical | handwriting
    mission_date    DATE,
    report_date     DATE,
    status          TEXT NOT NULL DEFAULT 'pending',
    -- pending | in_progress | report_submitted | contested | final
    fees            DECIMAL(15,2),
    notes           TEXT,
    document_id     UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    created_by      UUID NOT NULL REFERENCES public.profiles(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 19. نقابة المحامين (Bar Association)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bar_association_records (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    profile_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    bar_number      TEXT NOT NULL,
    enrollment_date DATE,
    bar_section     TEXT,  -- القسم أو النقابة الفرعية
    certificate_url TEXT,
    renewal_date    DATE,
    status          TEXT NOT NULL DEFAULT 'active', -- active | suspended | expelled
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 20. سجلات التدقيق (Audit Logs)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES public.profiles(id),
    action      TEXT NOT NULL, -- create | update | delete | login | logout | view | export
    entity_type TEXT NOT NULL, -- case | client | invoice | document | ...
    entity_id   UUID,
    old_values  JSONB,
    new_values  JSONB,
    ip_address  TEXT,
    user_agent  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 21. إعدادات النظام والفوترة
-- ============================================================
CREATE TABLE IF NOT EXISTS public.billing (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    plan            TEXT NOT NULL DEFAULT 'free',
    status          TEXT NOT NULL DEFAULT 'active',
    trial_ends_at   TIMESTAMPTZ,
    current_period_start TIMESTAMPTZ,
    current_period_end   TIMESTAMPTZ,
    stripe_customer_id   TEXT,
    stripe_sub_id        TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (org_id)
);

CREATE TABLE IF NOT EXISTS public.org_settings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    key             TEXT NOT NULL,
    value           JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (org_id, key)
);

-- ============================================================
-- 22. المؤشرات (Indexes) - لتحسين الأداء
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_org_id ON public.profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_clients_org_id ON public.clients(org_id);
CREATE INDEX IF NOT EXISTS idx_clients_type ON public.clients(type);
CREATE INDEX IF NOT EXISTS idx_cases_org_id ON public.cases(org_id);
CREATE INDEX IF NOT EXISTS idx_cases_client_id ON public.cases(client_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON public.cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_type ON public.cases(type);
CREATE INDEX IF NOT EXISTS idx_case_sessions_case_id ON public.case_sessions(case_id);
CREATE INDEX IF NOT EXISTS idx_case_sessions_session_date ON public.case_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_documents_org_id ON public.documents(org_id);
CREATE INDEX IF NOT EXISTS idx_documents_case_id ON public.documents(case_id);
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON public.documents(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_org_id ON public.invoices(org_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_expenses_org_id ON public.expenses(org_id);
CREATE INDEX IF NOT EXISTS idx_tasks_org_id ON public.tasks(org_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_time_entries_org_id ON public.time_entries(org_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_case_id ON public.time_entries(case_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON public.time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_org_id ON public.calendar_events(org_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON public.calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id ON public.audit_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_contracts_org_id ON public.contracts(org_id);
CREATE INDEX IF NOT EXISTS idx_ip_assets_org_id ON public.ip_assets(org_id);
CREATE INDEX IF NOT EXISTS idx_ip_assets_expiry ON public.ip_assets(expiry_date);
-- البحث النصي بالعربية
CREATE INDEX IF NOT EXISTS idx_cases_title_gin ON public.cases USING GIN(to_tsvector('arabic', title));
CREATE INDEX IF NOT EXISTS idx_clients_name_gin ON public.clients USING GIN(to_tsvector('arabic', name));

-- ============================================================
-- 23. الدوال (Functions)
-- ============================================================

-- 23.1 دالة للحصول على org_id للمستخدم الحالي
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID
LANGUAGE sql STABLE
SECURITY DEFINER
AS $$
    SELECT org_id FROM public.profiles WHERE id = auth.uid();
$$;

-- 23.2 دالة التحقق من super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'super_admin'
    );
$$;

-- 23.3 دالة التحقق من دور المستخدم
CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND (role = required_role OR role = 'super_admin' OR role = 'مدير_مكتب')
    );
$$;

-- 23.4 دالة تحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 23.5 دالة إنشاء profile تلقائياً عند التسجيل
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'محامي')
    );
    RETURN NEW;
END;
$$;

-- 23.6 دالة حساب رصيد حساب الثقة
CREATE OR REPLACE FUNCTION public.calculate_trust_balance(account_id UUID)
RETURNS DECIMAL(15,2)
LANGUAGE sql STABLE
AS $$
    SELECT COALESCE(
        SUM(CASE WHEN type = 'deposit' THEN amount ELSE -amount END),
        0
    )
    FROM public.trust_transactions
    WHERE trust_account_id = account_id;
$$;

-- ============================================================
-- 24. المشغّلات (Triggers)
-- ============================================================

-- Trigger إنشاء profile تلقائياً
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers تحديث updated_at
DO $$
DECLARE
    t TEXT;
    tables TEXT[] := ARRAY[
        'organizations','profiles','clients','poa','cases','case_sessions',
        'documents','invoices','expenses','trust_accounts','payment_plans',
        'payment_installments','tasks','contracts','ip_assets','ip_operations',
        'calendar_events','legal_library','wiki_pages','client_portal_settings',
        'family_court_cases','criminal_cases','economic_court_cases',
        'state_council_cases','real_estate_transactions','eta_invoices',
        'elitigation_submissions','expert_missions','bar_association_records',
        'enforcement_cases','billing','org_settings','time_entries','contract_reviews'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        EXECUTE format(
            'CREATE OR REPLACE TRIGGER trg_%s_updated_at
             BEFORE UPDATE ON public.%s
             FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at()',
            t, t
        );
    END LOOP;
END;
$$;

-- Trigger تحديث رصيد حساب الثقة بعد كل معاملة
CREATE OR REPLACE FUNCTION public.sync_trust_balance()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    UPDATE public.trust_accounts
    SET balance = public.calculate_trust_balance(
        COALESCE(NEW.trust_account_id, OLD.trust_account_id)
    )
    WHERE id = COALESCE(NEW.trust_account_id, OLD.trust_account_id);
    RETURN NULL;
END;
$$;

CREATE OR REPLACE TRIGGER trg_sync_trust_balance
    AFTER INSERT OR UPDATE OR DELETE ON public.trust_transactions
    FOR EACH ROW EXECUTE FUNCTION public.sync_trust_balance();

-- ============================================================
-- 25. Row Level Security (RLS)
-- ============================================================

-- تفعيل RLS على جميع الجداول
DO $$
DECLARE
    t TEXT;
    all_tables TEXT[] := ARRAY[
        'organizations','profiles','clients','poa','cases','case_sessions',
        'case_lawyers','documents','invoices','invoice_items','expenses',
        'trust_accounts','trust_transactions','payment_plans','payment_installments',
        'collections','tasks','time_entries','contracts','contract_reviews',
        'ip_assets','ip_operations','enforcement_cases','conflict_checks',
        'legal_library','calendar_events','team_members','wiki_pages',
        'client_portal_settings','portal_messages','family_court_cases',
        'criminal_cases','economic_court_cases','state_council_cases',
        'real_estate_transactions','eta_invoices','elitigation_submissions',
        'expert_missions','bar_association_records','audit_logs','billing',
        'org_settings'
    ];
BEGIN
    FOREACH t IN ARRAY all_tables LOOP
        EXECUTE format('ALTER TABLE public.%s ENABLE ROW LEVEL SECURITY', t);
    END LOOP;
END;
$$;

-- ========== سياسات organizations ==========
CREATE POLICY "organizations_select"
    ON public.organizations FOR SELECT
    USING (
        id = public.get_user_org_id()
        OR public.is_super_admin()
    );

CREATE POLICY "organizations_insert"
    ON public.organizations FOR INSERT
    WITH CHECK (public.is_super_admin());

CREATE POLICY "organizations_update"
    ON public.organizations FOR UPDATE
    USING (
        id = public.get_user_org_id()
        OR public.is_super_admin()
    );

-- ========== سياسات profiles ==========
CREATE POLICY "profiles_select"
    ON public.profiles FOR SELECT
    USING (
        id = auth.uid()
        OR org_id = public.get_user_org_id()
        OR public.is_super_admin()
    );

CREATE POLICY "profiles_insert"
    ON public.profiles FOR INSERT
    WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update"
    ON public.profiles FOR UPDATE
    USING (
        id = auth.uid()
        OR public.has_role('مدير_مكتب')
        OR public.is_super_admin()
    );

-- ========== قالب عام للجداول (org_id) ==========
-- يُستخدم هذا القالب لجميع الجداول التي تحتوي على org_id

DO $$
DECLARE
    t TEXT;
    org_tables TEXT[] := ARRAY[
        'clients','poa','cases','case_sessions','case_lawyers',
        'documents','invoices','expenses',
        'trust_accounts','trust_transactions','payment_plans','payment_installments',
        'collections','tasks','time_entries','contracts','contract_reviews',
        'ip_assets','ip_operations','enforcement_cases','conflict_checks',
        'legal_library','calendar_events','team_members','wiki_pages',
        'portal_messages','family_court_cases','criminal_cases',
        'economic_court_cases','state_council_cases','real_estate_transactions',
        'eta_invoices','elitigation_submissions','expert_missions',
        'bar_association_records','audit_logs','billing','org_settings'
    ];
BEGIN
    FOREACH t IN ARRAY org_tables LOOP
        -- سياسة SELECT
        EXECUTE format(
            'CREATE POLICY "%s_select" ON public.%s FOR SELECT
             USING (org_id = public.get_user_org_id() OR public.is_super_admin())',
            t, t
        );
        -- سياسة INSERT
        EXECUTE format(
            'CREATE POLICY "%s_insert" ON public.%s FOR INSERT
             WITH CHECK (org_id = public.get_user_org_id() OR public.is_super_admin())',
            t, t
        );
        -- سياسة UPDATE
        EXECUTE format(
            'CREATE POLICY "%s_update" ON public.%s FOR UPDATE
             USING (org_id = public.get_user_org_id() OR public.is_super_admin())',
            t, t
        );
        -- سياسة DELETE
        EXECUTE format(
            'CREATE POLICY "%s_delete" ON public.%s FOR DELETE
             USING (org_id = public.get_user_org_id() OR public.is_super_admin())',
            t, t
        );
    END LOOP;
END;
$$;

-- سياسة client_portal_settings المتخصصة (بوابة العملاء)
CREATE POLICY "client_portal_settings_select_public"
    ON public.client_portal_settings FOR SELECT
    USING (is_enabled = TRUE OR org_id = public.get_user_org_id() OR public.is_super_admin());

-- ========== سياسة invoice_items (لا تحتوي org_id مباشرة) ==========
DROP POLICY IF EXISTS "invoice_items_select" ON public.invoice_items;
DROP POLICY IF EXISTS "invoice_items_insert" ON public.invoice_items;
DROP POLICY IF EXISTS "invoice_items_update" ON public.invoice_items;
DROP POLICY IF EXISTS "invoice_items_delete" ON public.invoice_items;

CREATE POLICY "invoice_items_select" ON public.invoice_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.invoices
        WHERE invoices.id = invoice_items.invoice_id
          AND (invoices.org_id = public.get_user_org_id() OR public.is_super_admin())
    ));

CREATE POLICY "invoice_items_insert" ON public.invoice_items FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.invoices
        WHERE invoices.id = invoice_id
          AND (invoices.org_id = public.get_user_org_id() OR public.is_super_admin())
    ));

CREATE POLICY "invoice_items_update" ON public.invoice_items FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.invoices
        WHERE invoices.id = invoice_items.invoice_id
          AND (invoices.org_id = public.get_user_org_id() OR public.is_super_admin())
    ));

CREATE POLICY "invoice_items_delete" ON public.invoice_items FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.invoices
        WHERE invoices.id = invoice_items.invoice_id
          AND (invoices.org_id = public.get_user_org_id() OR public.is_super_admin())
    ));

-- ============================================================
-- 26. الصلاحيات (Grants)
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON public.organizations TO authenticated;
GRANT ALL ON public.profiles TO authenticated;

-- منح صلاحيات SELECT و INSERT و UPDATE و DELETE على جميع الجداول
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- منح صلاحيات محدودة للمجهولين (لبوابة العملاء)
GRANT SELECT ON public.client_portal_settings TO anon;

-- ============================================================
-- FIN
-- ============================================================
