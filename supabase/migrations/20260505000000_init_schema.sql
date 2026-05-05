-- Supabase Schema Migration: Egyptian Law Firm SaaS (malaf-egypt)
-- Includes: 18 Tables, RLS Policies, Functions, Triggers

-- 1. Helper Function: Get User's Organization ID
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS uuid AS $$
BEGIN
  RETURN (current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'org_id')::uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Organizations
CREATE TABLE organizations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    subscription_plan uuid,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Orgs are viewable by members" ON organizations FOR SELECT USING (id = get_user_org_id());

-- 3. Profiles (Users)
CREATE TYPE user_role AS ENUM ('محامي_شريك', 'مدير_مكتب', 'محامي', 'محامي_متدرب', 'سكرتير', 'موكل');
CREATE TABLE profiles (
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

-- 4. Clients
CREATE TYPE client_type AS ENUM ('فرد', 'منشأة');
CREATE TABLE clients (
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

-- 5. Cases (With Multi-tier support)
CREATE TYPE case_tier AS ENUM ('ابتدائي', 'مستأنف', 'نقض', 'إعادة');
CREATE TABLE cases (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    type text NOT NULL,
    court text NOT NULL,
    status text NOT NULL DEFAULT 'تحت الدراسة',
    plaintiff text,
    defendant text,
    power_of_attorney_ref text,
    -- Multi-tier
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
    -- Criminal
    criminal_tier text,
    criminal_stage text,
    prosecution_ref text,
    -- Family
    family_case_type text,
    created_at timestamptz DEFAULT now(),
    deleted_at timestamptz
);
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org cases" ON cases FOR ALL USING (organization_id = get_user_org_id());

-- 6. Sessions
CREATE TABLE sessions (
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

-- 7. Powers of Attorney
CREATE TYPE poa_type AS ENUM ('عام', 'خاص', 'قضايا', 'بنوك');
CREATE TABLE powers_of_attorney (
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

-- 8. Documents
CREATE TABLE documents (
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

-- 9. Invoices
CREATE TABLE invoices (
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

-- 10. Payments
CREATE TABLE payments (
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

-- 11. Expenses
CREATE TYPE expense_category AS ENUM ('دمغة محاماة', 'رسوم نقابة', 'أمانة خبير', 'رسم إعلان (محضر)', 'رسوم قضائية', 'مصروفات انتقال', 'مصروفات طباعة ونسخ', 'أمانة تنفيذ', 'رسوم شهر عقاري', 'أخرى');
CREATE TABLE expenses (
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

-- 12. Trust Accounts
CREATE TYPE trust_type AS ENUM ('أمانة', 'مقدم أتعاب', 'مبلغ تنفيذ');
CREATE TABLE trust_accounts (
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

-- 13. Timeline Events
CREATE TABLE timeline_events (
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

-- 14. Notifications
CREATE TABLE notifications (
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

-- 15. Tasks
CREATE TABLE tasks (
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

-- 16. Expert Missions
CREATE TABLE expert_missions (
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

-- 17. Enforcement Cases
CREATE TABLE enforcement_cases (
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

-- 18. Document Templates
CREATE TABLE document_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE, -- Null means global template
    title text NOT NULL,
    content text NOT NULL,
    category text,
    placeholders jsonb DEFAULT '[]'::jsonb,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org or Global Templates" ON document_templates FOR SELECT USING (organization_id IS NULL OR organization_id = get_user_org_id());

-- 19. Subscription Plans
CREATE TABLE subscription_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    max_lawyers integer DEFAULT 1,
    max_cases integer DEFAULT 10,
    max_storage_mb integer DEFAULT 100,
    price_monthly_egp numeric DEFAULT 0,
    features jsonb DEFAULT '[]'::jsonb,
    created_at timestamptz DEFAULT now()
);
-- Global Read
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone reads plans" ON subscription_plans FOR SELECT USING (true);

-- Indexes for performance
CREATE INDEX idx_cases_org ON cases(organization_id);
CREATE INDEX idx_clients_org ON clients(organization_id);
CREATE INDEX idx_sessions_org_case ON sessions(organization_id, case_id);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);

-- Trigger: auto-create timeline_event on case status change
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

CREATE TRIGGER case_status_trigger
AFTER UPDATE ON cases
FOR EACH ROW EXECUTE FUNCTION log_case_status_change();
