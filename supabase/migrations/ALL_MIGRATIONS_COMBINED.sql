-- ═══════════════════════════════════════════════════════════════
-- مَلَف (Malaf) — Full Database Setup
-- انسخ كل هذا الكود والصقه في Supabase SQL Editor واضغط Run
-- ═══════════════════════════════════════════════════════════════


-- ══════════════════════════════════════════
-- MIGRATION 001: Initial Schema (18 Tables)
-- ══════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS uuid AS $$
BEGIN
  RETURN (current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'org_id')::uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TABLE IF NOT EXISTS organizations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    subscription_plan uuid,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Orgs are viewable by members" ON organizations FOR SELECT USING (id = get_user_org_id());

CREATE TYPE user_role AS ENUM ('محامي_شريك', 'مدير_مكتب', 'محامي', 'محامي_متدرب', 'سكرتير', 'موكل');
CREATE TABLE IF NOT EXISTS profiles (
    id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
    email text UNIQUE NOT NULL,
    full_name text NOT NULL,
    role user_role DEFAULT 'محامي',
    phone text,
    bar_number text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view org members" ON profiles FOR SELECT USING (organization_id = get_user_org_id());

CREATE TYPE client_type AS ENUM ('فرد', 'منشأة');
CREATE TABLE IF NOT EXISTS clients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    type client_type NOT NULL,
    name text NOT NULL,
    national_id_encrypted text,
    phone text,
    governorate text,
    religion text,
    marital_status text,
    commercial_registration_encrypted text,
    created_at timestamptz DEFAULT now(),
    deleted_at timestamptz
);
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org clients" ON clients FOR ALL USING (organization_id = get_user_org_id());

CREATE TYPE case_tier AS ENUM ('ابتدائي', 'مستأنف', 'نقض', 'إعادة');
CREATE TABLE IF NOT EXISTS cases (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    type text NOT NULL,
    court text NOT NULL,
    status text NOT NULL DEFAULT 'تحت الدراسة',
    plaintiff text,
    defendant text,
    power_of_attorney_ref text,
    first_instance_number text,
    first_instance_year text,
    first_instance_court text,
    appeal_number text,
    appeal_year text,
    appeal_court text,
    cassation_number text,
    cassation_year text,
    state_council_number text,
    state_council_year_q text,
    current_tier case_tier DEFAULT 'ابتدائي',
    criminal_tier text,
    criminal_stage text,
    prosecution_ref text,
    family_case_type text,
    created_at timestamptz DEFAULT now(),
    deleted_at timestamptz
);
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org cases" ON cases FOR ALL USING (organization_id = get_user_org_id());

CREATE TABLE IF NOT EXISTS sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    date date NOT NULL,
    time time,
    court text,
    circuit text,
    status text DEFAULT 'قادمة',
    previous_decision text,
    postponement_reason text,
    next_session_date date,
    lawyer_id uuid REFERENCES profiles(id),
    notes text,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org sessions" ON sessions FOR ALL USING (organization_id = get_user_org_id());

CREATE TYPE poa_type AS ENUM ('عام', 'خاص', 'قضايا', 'بنوك');
CREATE TABLE IF NOT EXISTS powers_of_attorney (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    poa_number text NOT NULL,
    poa_letter text,
    poa_year text,
    notary_office text,
    type poa_type DEFAULT 'قضايا',
    status text DEFAULT 'ساري',
    expiry_date date,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE powers_of_attorney ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org POAs" ON powers_of_attorney FOR ALL USING (organization_id = get_user_org_id());

CREATE TABLE IF NOT EXISTS documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    case_id uuid REFERENCES cases(id) ON DELETE CASCADE,
    client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
    file_name text NOT NULL,
    file_url text NOT NULL,
    category text,
    shared_with_client boolean DEFAULT false,
    size integer,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org Documents" ON documents FOR ALL USING (organization_id = get_user_org_id());

CREATE TABLE IF NOT EXISTS invoices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    invoice_number text NOT NULL,
    base_amount numeric DEFAULT 0,
    vat_amount numeric DEFAULT 0,
    stamp_duty numeric DEFAULT 0,
    total numeric DEFAULT 0,
    status text DEFAULT 'مسودة',
    date date,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org Invoices" ON invoices FOR ALL USING (organization_id = get_user_org_id());

CREATE TABLE IF NOT EXISTS payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    amount numeric NOT NULL,
    method text,
    date date,
    notes text,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org Payments" ON payments FOR ALL USING (organization_id = get_user_org_id());

CREATE TYPE expense_category AS ENUM ('دمغة محاماة', 'رسوم نقابة', 'أمانة خبير', 'رسم إعلان (محضر)', 'رسوم قضائية', 'مصروفات انتقال', 'مصروفات طباعة ونسخ', 'أمانة تنفيذ', 'رسوم شهر عقاري', 'أخرى');
CREATE TABLE IF NOT EXISTS expenses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    case_id uuid REFERENCES cases(id),
    client_id uuid REFERENCES clients(id),
    category expense_category DEFAULT 'أخرى',
    amount numeric NOT NULL,
    date date,
    status text DEFAULT 'معلق',
    description text,
    requires_partner_approval boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org Expenses" ON expenses FOR ALL USING (organization_id = get_user_org_id());

CREATE TYPE trust_type AS ENUM ('أمانة', 'مقدم أتعاب', 'مبلغ تنفيذ');
CREATE TABLE IF NOT EXISTS trust_accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    case_id uuid REFERENCES cases(id),
    amount numeric NOT NULL,
    type trust_type DEFAULT 'أمانة',
    status text DEFAULT 'نشط',
    description text,
    date date,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE trust_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org Trust Accounts" ON trust_accounts FOR ALL USING (organization_id = get_user_org_id());

CREATE TABLE IF NOT EXISTS timeline_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    event_type text NOT NULL,
    description text NOT NULL,
    event_date timestamptz DEFAULT now(),
    created_by uuid REFERENCES profiles(id)
);
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org Timeline" ON timeline_events FOR ALL USING (organization_id = get_user_org_id());

CREATE TABLE IF NOT EXISTS notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    body text,
    type text,
    is_read boolean DEFAULT false,
    case_id uuid REFERENCES cases(id),
    created_at timestamptz DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User Notifications" ON notifications FOR ALL USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    case_id uuid REFERENCES cases(id) ON DELETE CASCADE,
    assigned_to uuid REFERENCES profiles(id),
    title text NOT NULL,
    description text,
    due_date date,
    status text DEFAULT 'جديد',
    priority text DEFAULT 'متوسط',
    created_at timestamptz DEFAULT now()
);
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org Tasks" ON tasks FOR ALL USING (organization_id = get_user_org_id());

CREATE TABLE IF NOT EXISTS expert_missions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    expert_name text NOT NULL,
    mission_type text,
    deposit_amount numeric DEFAULT 0,
    hearing_date date,
    report_status text DEFAULT 'قيد الدراسة',
    notes text,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE expert_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org Expert Missions" ON expert_missions FOR ALL USING (organization_id = get_user_org_id());

CREATE TABLE IF NOT EXISTS enforcement_cases (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    judgment_date date,
    enforcement_number text,
    execution_court text,
    status text DEFAULT 'قيد التحضير',
    collected_amount numeric DEFAULT 0,
    remaining_amount numeric,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE enforcement_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org Enforcement Cases" ON enforcement_cases FOR ALL USING (organization_id = get_user_org_id());

CREATE TABLE IF NOT EXISTS document_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
    title text NOT NULL,
    content text NOT NULL,
    category text,
    placeholders jsonb DEFAULT '[]'::jsonb,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org or Global Templates" ON document_templates FOR SELECT USING (organization_id IS NULL OR organization_id = get_user_org_id());

CREATE TABLE IF NOT EXISTS subscription_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    max_lawyers integer DEFAULT 1,
    max_cases integer DEFAULT 10,
    max_storage_mb integer DEFAULT 100,
    price_monthly_egp numeric DEFAULT 0,
    features jsonb DEFAULT '[]'::jsonb,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone reads plans" ON subscription_plans FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_cases_org ON cases(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_org ON clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_sessions_org_case ON sessions(organization_id, case_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);

CREATE OR REPLACE FUNCTION log_case_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO timeline_events (organization_id, case_id, event_type, description)
        VALUES (NEW.organization_id, NEW.id, 'STATUS_CHANGE', 'تم تغيير حالة القضية إلى: ' || NEW.status);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS case_status_trigger ON cases;
CREATE TRIGGER case_status_trigger
AFTER UPDATE ON cases
FOR EACH ROW EXECUTE FUNCTION log_case_status_change();


-- ══════════════════════════════════════════
-- MIGRATION 002: Video Sessions
-- ══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS video_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    case_id TEXT NOT NULL,
    org_id TEXT NOT NULL,
    room_name TEXT NOT NULL,
    room_url TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    started_at TIMESTAMPTZ DEFAULT now(),
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    notes TEXT,
    chat_log JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE video_sessions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_video_sessions_case ON video_sessions(case_id);
CREATE INDEX IF NOT EXISTS idx_video_sessions_org ON video_sessions(org_id);


-- ══════════════════════════════════════════
-- MIGRATION 003: Performance Indexes
-- ══════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_clients_org_id ON clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(organization_id, name);
CREATE INDEX IF NOT EXISTS idx_clients_deleted ON clients(organization_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_cases_org_id ON cases(organization_id);
CREATE INDEX IF NOT EXISTS idx_cases_client ON cases(organization_id, client_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_cases_court ON cases(organization_id, court);
CREATE INDEX IF NOT EXISTS idx_cases_type ON cases(organization_id, type);
CREATE INDEX IF NOT EXISTS idx_cases_created ON cases(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cases_deleted ON cases(organization_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_sessions_org_id ON sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_sessions_case ON sessions(organization_id, case_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(organization_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_sessions_lawyer ON sessions(organization_id, lawyer_id);
CREATE INDEX IF NOT EXISTS idx_sessions_upcoming ON sessions(organization_id, date) WHERE status = 'قادمة';

CREATE INDEX IF NOT EXISTS idx_invoices_org_id ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(organization_id, client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(organization_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_expenses_org_id ON expenses(organization_id);
CREATE INDEX IF NOT EXISTS idx_expenses_case ON expenses(organization_id, case_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(organization_id, category);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(organization_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_payments_org_id ON payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(organization_id, invoice_id);

CREATE INDEX IF NOT EXISTS idx_documents_org_id ON documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_case ON documents(organization_id, case_id);
CREATE INDEX IF NOT EXISTS idx_documents_client ON documents(organization_id, client_id);

CREATE INDEX IF NOT EXISTS idx_poa_org_id ON powers_of_attorney(organization_id);
CREATE INDEX IF NOT EXISTS idx_poa_client ON powers_of_attorney(organization_id, client_id);
CREATE INDEX IF NOT EXISTS idx_poa_status ON powers_of_attorney(organization_id, status);

CREATE INDEX IF NOT EXISTS idx_tasks_org_id ON tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_case ON tasks(organization_id, case_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(organization_id, assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(organization_id, due_date) WHERE status != 'مكتمل';

CREATE INDEX IF NOT EXISTS idx_trust_org_id ON trust_accounts(organization_id);
CREATE INDEX IF NOT EXISTS idx_trust_client ON trust_accounts(organization_id, client_id);

CREATE INDEX IF NOT EXISTS idx_timeline_org ON timeline_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_timeline_case ON timeline_events(organization_id, case_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id) WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_enforcement_org ON enforcement_cases(organization_id);
CREATE INDEX IF NOT EXISTS idx_enforcement_case ON enforcement_cases(organization_id, case_id);

CREATE INDEX IF NOT EXISTS idx_expert_org ON expert_missions(organization_id);
CREATE INDEX IF NOT EXISTS idx_expert_case ON expert_missions(organization_id, case_id);

CREATE INDEX IF NOT EXISTS idx_profiles_org ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);


-- ══════════════════════════════════════════
-- MIGRATION 004: Field Check-in System
-- ══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS known_locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'court',
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    radius_meters INTEGER NOT NULL DEFAULT 200,
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS field_checkins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_role TEXT DEFAULT 'lawyer',
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    accuracy_meters DOUBLE PRECISION,
    matched_location_id UUID REFERENCES known_locations(id),
    matched_location_name TEXT,
    distance_meters DOUBLE PRECISION,
    is_verified BOOLEAN DEFAULT false,
    checkin_type TEXT NOT NULL DEFAULT 'arrival',
    source TEXT NOT NULL DEFAULT 'app',
    task_id TEXT,
    task_description TEXT,
    notes TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_field_checkins_org_id ON field_checkins(org_id);
CREATE INDEX IF NOT EXISTS idx_field_checkins_user_id ON field_checkins(org_id, user_id);
CREATE INDEX IF NOT EXISTS idx_field_checkins_date ON field_checkins(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_known_locations_org ON known_locations(org_id) WHERE is_active = true;


-- ═══════════════════════════════════════════════════════════════
-- ✅ تم! — كل الجداول والـ Indexes والـ RLS Policies اتعملت
-- ═══════════════════════════════════════════════════════════════
