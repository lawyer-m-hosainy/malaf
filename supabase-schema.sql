-- Mizan Egypt Supabase Schema

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Organizations Table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'free', -- 'free', 'basic', 'pro'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Profiles Table (Lawyers/Staff)
CREATE TABLE profiles (
  id UUID PRIMARY KEY, -- Linked to auth.users.id
  org_id UUID REFERENCES organizations(id),
  full_name TEXT NOT NULL,
  role TEXT NOT NULL, -- 'super_admin', 'org_admin', 'senior_lawyer', 'junior_lawyer', 'trainee', 'secretary'
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Clients Table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'فرد', 'منشأة'
  national_id TEXT, -- Encrypted in app
  commercial_reg TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Cases Table
CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id),
  client_id UUID REFERENCES clients(id),
  title TEXT NOT NULL,
  case_number TEXT,
  first_instance_number TEXT,
  first_instance_year TEXT,
  appeal_number TEXT,
  appeal_year TEXT,
  cassation_number TEXT,
  cassation_year TEXT,
  court TEXT,
  type TEXT, -- 'مدني', 'جنائي', 'أسرة', 'إداري', 'تجاري'
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Sessions Table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME,
  court_room TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Documents Table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Invoices Table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id),
  client_id UUID REFERENCES clients(id),
  amount DECIMAL(12, 2) NOT NULL,
  status TEXT DEFAULT 'unpaid', -- 'paid', 'unpaid', 'partial'
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. POAs Table (Power of Attorney)
CREATE TABLE poas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  year TEXT NOT NULL,
  office TEXT,
  expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Tasks Table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  priority TEXT,
  assigned_to UUID REFERENCES profiles(id),
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Expenses Table
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id),
  case_id UUID REFERENCES cases(id),
  amount DECIMAL(12, 2) NOT NULL,
  category TEXT,
  description TEXT,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Trust Accounts (الأمانات)
CREATE TABLE trust_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id),
  client_id UUID REFERENCES clients(id),
  amount DECIMAL(12, 2) NOT NULL,
  type TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Enforcement Cases (التنفيذ القضائي)
CREATE TABLE enforcement (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id),
  case_id UUID REFERENCES cases(id),
  amount_claimed DECIMAL(12, 2),
  amount_collected DECIMAL(12, 2) DEFAULT 0,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Expert Missions (مأموريات الخبراء)
CREATE TABLE expert_missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  expert_name TEXT,
  mission_date DATE,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Real Estate Registry (الشهر العقاري)
CREATE TABLE real_estate_registry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id),
  client_id UUID REFERENCES clients(id),
  request_number TEXT,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Specialized Tracks (المسارات المتخصصة)
CREATE TABLE specialized_tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  org_id UUID REFERENCES organizations(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. Counters Table
CREATE TABLE counters (
  type TEXT PRIMARY KEY,
  last_value INTEGER DEFAULT 0
);

-- Enable RLS for all new tables
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE enforcement ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE real_estate_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialized_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE counters ENABLE ROW LEVEL SECURITY;

-- Enable RLS for the first 8 tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE poas ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════
-- Helper Functions
-- ═══════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
  SELECT (auth.jwt() -> 'raw_user_meta_data' ->> 'org_id')::UUID;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT auth.jwt() -> 'raw_user_meta_data' ->> 'role';
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT get_user_role() = 'super_admin';
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════
-- RLS Policies — Multi-Tenant Isolation
-- ═══════════════════════════════════════════════════════

-- Organizations: users see only their own org, super_admin sees all
CREATE POLICY "org_select" ON organizations FOR SELECT USING (id = get_user_org_id() OR is_super_admin());

-- Profiles: users see members of their org
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (org_id = get_user_org_id() OR is_super_admin());
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (org_id = get_user_org_id() OR is_super_admin());
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (org_id = get_user_org_id() OR is_super_admin());

-- Clients
CREATE POLICY "clients_select" ON clients FOR SELECT USING (org_id = get_user_org_id() OR is_super_admin());
CREATE POLICY "clients_insert" ON clients FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "clients_update" ON clients FOR UPDATE USING (org_id = get_user_org_id());

-- Cases
CREATE POLICY "cases_select" ON cases FOR SELECT USING (org_id = get_user_org_id() OR is_super_admin());
CREATE POLICY "cases_insert" ON cases FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "cases_update" ON cases FOR UPDATE USING (org_id = get_user_org_id());

-- Sessions: accessible via case's org
CREATE POLICY "sessions_select" ON sessions FOR SELECT USING (
  EXISTS (SELECT 1 FROM cases WHERE cases.id = sessions.case_id AND cases.org_id = get_user_org_id())
  OR is_super_admin()
);
CREATE POLICY "sessions_insert" ON sessions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM cases WHERE cases.id = sessions.case_id AND cases.org_id = get_user_org_id())
);

-- Documents
CREATE POLICY "documents_select" ON documents FOR SELECT USING (
  EXISTS (SELECT 1 FROM cases WHERE cases.id = documents.case_id AND cases.org_id = get_user_org_id())
  OR is_super_admin()
);
CREATE POLICY "documents_insert" ON documents FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM cases WHERE cases.id = documents.case_id AND cases.org_id = get_user_org_id())
);

-- Invoices
CREATE POLICY "invoices_select" ON invoices FOR SELECT USING (org_id = get_user_org_id() OR is_super_admin());
CREATE POLICY "invoices_insert" ON invoices FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "invoices_update" ON invoices FOR UPDATE USING (org_id = get_user_org_id());

-- POAs
CREATE POLICY "poas_select" ON poas FOR SELECT USING (
  EXISTS (SELECT 1 FROM clients WHERE clients.id = poas.client_id AND clients.org_id = get_user_org_id())
  OR is_super_admin()
);
CREATE POLICY "poas_insert" ON poas FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM clients WHERE clients.id = poas.client_id AND clients.org_id = get_user_org_id())
);

-- Tasks
CREATE POLICY "tasks_select" ON tasks FOR SELECT USING (org_id = get_user_org_id() OR is_super_admin());
CREATE POLICY "tasks_insert" ON tasks FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "tasks_update" ON tasks FOR UPDATE USING (org_id = get_user_org_id());

-- Expenses
CREATE POLICY "expenses_select" ON expenses FOR SELECT USING (org_id = get_user_org_id() OR is_super_admin());
CREATE POLICY "expenses_insert" ON expenses FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "expenses_update" ON expenses FOR UPDATE USING (org_id = get_user_org_id());

-- Trust Accounts
CREATE POLICY "trust_select" ON trust_accounts FOR SELECT USING (org_id = get_user_org_id() OR is_super_admin());
CREATE POLICY "trust_insert" ON trust_accounts FOR INSERT WITH CHECK (org_id = get_user_org_id());

-- Enforcement
CREATE POLICY "enforcement_select" ON enforcement FOR SELECT USING (org_id = get_user_org_id() OR is_super_admin());
CREATE POLICY "enforcement_insert" ON enforcement FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "enforcement_update" ON enforcement FOR UPDATE USING (org_id = get_user_org_id());

-- Audit Logs (immutable — insert only, read by own org)
CREATE POLICY "audit_select" ON audit_logs FOR SELECT USING (org_id = get_user_org_id() OR is_super_admin());
CREATE POLICY "audit_insert" ON audit_logs FOR INSERT WITH CHECK (org_id = get_user_org_id());

-- Expert Missions
CREATE POLICY "expert_select" ON expert_missions FOR SELECT USING (
  EXISTS (SELECT 1 FROM cases WHERE cases.id = expert_missions.case_id AND cases.org_id = get_user_org_id())
  OR is_super_admin()
);
CREATE POLICY "expert_insert" ON expert_missions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM cases WHERE cases.id = expert_missions.case_id AND cases.org_id = get_user_org_id())
);

-- Real Estate Registry
CREATE POLICY "registry_select" ON real_estate_registry FOR SELECT USING (org_id = get_user_org_id() OR is_super_admin());
CREATE POLICY "registry_insert" ON real_estate_registry FOR INSERT WITH CHECK (org_id = get_user_org_id());

-- Specialized Tracks
CREATE POLICY "tracks_select" ON specialized_tracks FOR SELECT USING (org_id = get_user_org_id() OR is_super_admin());
CREATE POLICY "tracks_insert" ON specialized_tracks FOR INSERT WITH CHECK (org_id = get_user_org_id());

-- Notifications (user sees only their own)
CREATE POLICY "notif_select" ON notifications FOR SELECT USING (user_id = auth.uid() OR is_super_admin());
CREATE POLICY "notif_insert" ON notifications FOR INSERT WITH CHECK (true); -- system can notify any user
CREATE POLICY "notif_update" ON notifications FOR UPDATE USING (user_id = auth.uid()); -- user marks own as read

-- Counters (org-scoped via type prefix)
CREATE POLICY "counters_all" ON counters FOR ALL USING (true); -- shared counters

-- ═══════════════════════════════════════════════════════
-- Indexes for Performance
-- ═══════════════════════════════════════════════════════
CREATE INDEX idx_clients_org ON clients(org_id);
CREATE INDEX idx_cases_org ON cases(org_id);
CREATE INDEX idx_cases_client ON cases(client_id);
CREATE INDEX idx_sessions_case ON sessions(case_id);
CREATE INDEX idx_sessions_date ON sessions(date);
CREATE INDEX idx_documents_case ON documents(case_id);
CREATE INDEX idx_invoices_org ON invoices(org_id);
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_tasks_org ON tasks(org_id);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_expenses_org ON expenses(org_id);
CREATE INDEX idx_expenses_case ON expenses(case_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_audit_org ON audit_logs(org_id);
CREATE INDEX idx_enforcement_org ON enforcement(org_id);
CREATE INDEX idx_poas_client ON poas(client_id);
