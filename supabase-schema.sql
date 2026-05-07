-- Mizan Egypt Supabase Schema

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Organizations Table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'free', -- 'free', 'basic', 'pro'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Profiles Table (Lawyers/Staff)
CREATE TABLE profiles (
  id UUID PRIMARY KEY, -- Linked to auth.users.id
  org_id UUID REFERENCES organizations(id),
  full_name TEXT NOT NULL,
  role TEXT NOT NULL, -- 'super_admin', 'org_admin', 'senior_lawyer', 'junior_lawyer', 'trainee', 'secretary', 'client'
  email TEXT UNIQUE NOT NULL,
  linked_client_id UUID REFERENCES clients(id), -- For client portal users
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 6. Sessions Table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME,
  court_room TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 7. Documents Table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 8. Invoices Table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id),
  client_id UUID REFERENCES clients(id),
  amount DECIMAL(12, 2) NOT NULL,
  status TEXT DEFAULT 'unpaid', -- 'paid', 'unpaid', 'partial'
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 9. POAs Table (Power of Attorney)
CREATE TABLE poas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  year TEXT NOT NULL,
  office TEXT,
  type TEXT,
  status TEXT DEFAULT 'active',
  expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 12. Trust Accounts (الأمانات)
CREATE TABLE trust_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id),
  client_id UUID REFERENCES clients(id),
  amount DECIMAL(12, 2) NOT NULL,
  type TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 13. Enforcement Cases (التنفيذ القضائي)
CREATE TABLE enforcement (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id),
  case_id UUID REFERENCES cases(id),
  amount_claimed DECIMAL(12, 2),
  amount_collected DECIMAL(12, 2) DEFAULT 0,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Real Estate Registry (الشهر العقاري)
CREATE TABLE real_estate_registry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id),
  client_id UUID REFERENCES clients(id),
  request_number TEXT,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Specialized Tracks (المسارات المتخصصة)
CREATE TABLE specialized_tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  org_id UUID REFERENCES organizations(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. Counters Table
CREATE TABLE counters (
  type TEXT PRIMARY KEY,
  last_value INTEGER DEFAULT 0
);

-- 20. Subscriptions Table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id),
  plan TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. AI Documents Table
CREATE TABLE ai_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id),
  case_id UUID REFERENCES cases(id),
  title TEXT NOT NULL,
  content TEXT,
  template_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22. Timeline Events Table
CREATE TABLE timeline_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id),
  case_id UUID REFERENCES cases(id),
  event_type TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
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
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;

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

CREATE OR REPLACE FUNCTION get_user_linked_client_id()
RETURNS UUID AS $$
  SELECT linked_client_id FROM profiles WHERE id = auth.uid() LIMIT 1;
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
CREATE POLICY "profiles_delete" ON profiles FOR DELETE USING (org_id = get_user_org_id() OR is_super_admin());

-- Clients (with soft delete check)
CREATE POLICY "clients_select" ON clients FOR SELECT USING ((org_id = get_user_org_id() OR is_super_admin()) AND deleted_at IS NULL);
CREATE POLICY "clients_insert" ON clients FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "clients_update" ON clients FOR UPDATE USING (org_id = get_user_org_id() AND deleted_at IS NULL);
CREATE POLICY "clients_delete" ON clients FOR DELETE USING (org_id = get_user_org_id());

-- Cases (with soft delete check)
CREATE POLICY "cases_select" ON cases FOR SELECT USING (
  deleted_at IS NULL AND (
    is_super_admin() 
    OR (get_user_role() != 'client' AND org_id = get_user_org_id())
    OR (get_user_role() = 'client' AND client_id = get_user_linked_client_id())
  )
);
CREATE POLICY "cases_insert" ON cases FOR INSERT WITH CHECK (get_user_role() != 'client' AND org_id = get_user_org_id());
CREATE POLICY "cases_update" ON cases FOR UPDATE USING (get_user_role() != 'client' AND org_id = get_user_org_id() AND deleted_at IS NULL);
CREATE POLICY "cases_delete" ON cases FOR DELETE USING (get_user_role() != 'client' AND org_id = get_user_org_id());

-- Sessions: accessible via case's org
CREATE POLICY "sessions_select" ON sessions FOR SELECT USING (
  deleted_at IS NULL AND (
    is_super_admin()
    OR (
      get_user_role() != 'client' 
      AND EXISTS (SELECT 1 FROM cases WHERE cases.id = sessions.case_id AND cases.org_id = get_user_org_id())
    )
    OR (
      get_user_role() = 'client' 
      AND EXISTS (SELECT 1 FROM cases WHERE cases.id = sessions.case_id AND cases.client_id = get_user_linked_client_id())
    )
  )
);
CREATE POLICY "sessions_insert" ON sessions FOR INSERT WITH CHECK (
  get_user_role() != 'client' AND EXISTS (SELECT 1 FROM cases WHERE cases.id = sessions.case_id AND cases.org_id = get_user_org_id())
);
CREATE POLICY "sessions_update" ON sessions FOR UPDATE USING (
  get_user_role() != 'client' AND EXISTS (SELECT 1 FROM cases WHERE cases.id = sessions.case_id AND cases.org_id = get_user_org_id())
);
CREATE POLICY "sessions_delete" ON sessions FOR DELETE USING (
  get_user_role() != 'client' AND EXISTS (SELECT 1 FROM cases WHERE cases.id = sessions.case_id AND cases.org_id = get_user_org_id())
);

-- Invoices
CREATE POLICY "invoices_select" ON invoices FOR SELECT USING ((org_id = get_user_org_id() OR is_super_admin()) AND deleted_at IS NULL);
CREATE POLICY "invoices_insert" ON invoices FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "invoices_update" ON invoices FOR UPDATE USING (org_id = get_user_org_id());
CREATE POLICY "invoices_delete" ON invoices FOR DELETE USING (org_id = get_user_org_id());

-- ═══════════════════════════════════════════════════════
-- Indexes for Performance (Stage R4 Optimization)
-- ═══════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_sessions_case_date ON sessions(case_id, date);
CREATE INDEX IF NOT EXISTS idx_invoices_org_status_due ON invoices(org_id, status, due_date);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_created ON audit_logs(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cases_org_status ON cases(org_id, status);
CREATE INDEX IF NOT EXISTS idx_clients_org_name ON clients(org_id, name);

-- Documents
CREATE POLICY "documents_select" ON documents FOR SELECT USING (
  deleted_at IS NULL AND (
    is_super_admin()
    OR (
      get_user_role() != 'client' 
      AND EXISTS (SELECT 1 FROM cases WHERE cases.id = documents.case_id AND cases.org_id = get_user_org_id())
    )
    OR (
      get_user_role() = 'client' 
      AND documents.is_shared = true
      AND EXISTS (SELECT 1 FROM cases WHERE cases.id = documents.case_id AND cases.client_id = get_user_linked_client_id())
    )
  )
);
CREATE POLICY "documents_insert" ON documents FOR INSERT WITH CHECK (
  get_user_role() != 'client' AND EXISTS (SELECT 1 FROM cases WHERE cases.id = documents.case_id AND cases.org_id = get_user_org_id())
);
CREATE POLICY "documents_update" ON documents FOR UPDATE USING (
  get_user_role() != 'client' AND EXISTS (SELECT 1 FROM cases WHERE cases.id = documents.case_id AND cases.org_id = get_user_org_id())
);
CREATE POLICY "documents_delete" ON documents FOR DELETE USING (
  get_user_role() != 'client' AND org_id = get_user_org_id()
);

-- (Invoices RLS defined above — duplicate block removed)

-- POAs
CREATE POLICY "poas_select" ON poas FOR SELECT USING (
  EXISTS (SELECT 1 FROM clients WHERE clients.id = poas.client_id AND clients.org_id = get_user_org_id())
  OR is_super_admin()
);
CREATE POLICY "poas_insert" ON poas FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM clients WHERE clients.id = poas.client_id AND clients.org_id = get_user_org_id())
);
CREATE POLICY "poas_update" ON poas FOR UPDATE USING (
  EXISTS (SELECT 1 FROM clients WHERE clients.id = poas.client_id AND clients.org_id = get_user_org_id())
);
CREATE POLICY "poas_delete" ON poas FOR DELETE USING (
  EXISTS (SELECT 1 FROM clients WHERE clients.id = poas.client_id AND clients.org_id = get_user_org_id())
);

-- Tasks
CREATE POLICY "tasks_select" ON tasks FOR SELECT USING (
  deleted_at IS NULL AND (
    is_super_admin() 
    OR (get_user_role() != 'client' AND org_id = get_user_org_id())
  )
);
CREATE POLICY "tasks_insert" ON tasks FOR INSERT WITH CHECK (get_user_role() != 'client' AND org_id = get_user_org_id());
CREATE POLICY "tasks_update" ON tasks FOR UPDATE USING (get_user_role() != 'client' AND org_id = get_user_org_id());
CREATE POLICY "tasks_delete" ON tasks FOR DELETE USING (is_super_admin());

-- Expenses
CREATE POLICY "expenses_select" ON expenses FOR SELECT USING (org_id = get_user_org_id() OR is_super_admin());
CREATE POLICY "expenses_insert" ON expenses FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "expenses_update" ON expenses FOR UPDATE USING (org_id = get_user_org_id());
CREATE POLICY "expenses_delete" ON expenses FOR DELETE USING (org_id = get_user_org_id());

-- Trust Accounts
CREATE POLICY "trust_select" ON trust_accounts FOR SELECT USING (org_id = get_user_org_id() OR is_super_admin());
CREATE POLICY "trust_insert" ON trust_accounts FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "trust_update" ON trust_accounts FOR UPDATE USING (org_id = get_user_org_id());
CREATE POLICY "trust_delete" ON trust_accounts FOR DELETE USING (org_id = get_user_org_id());

-- Enforcement
CREATE POLICY "enforcement_select" ON enforcement FOR SELECT USING (org_id = get_user_org_id() OR is_super_admin());
CREATE POLICY "enforcement_insert" ON enforcement FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "enforcement_update" ON enforcement FOR UPDATE USING (org_id = get_user_org_id());
CREATE POLICY "enforcement_delete" ON enforcement FOR DELETE USING (org_id = get_user_org_id());

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
CREATE POLICY "counters_all" ON counters FOR ALL USING (
  type LIKE '%' || get_user_org_id()::text 
  OR is_super_admin()
);

-- Subscriptions
CREATE POLICY "subscriptions_select" ON subscriptions FOR SELECT USING (org_id = get_user_org_id() OR is_super_admin());
CREATE POLICY "subscriptions_insert" ON subscriptions FOR INSERT WITH CHECK (is_super_admin()); -- Only super admins can insert subs
CREATE POLICY "subscriptions_update" ON subscriptions FOR UPDATE USING (is_super_admin());

-- AI Documents
CREATE POLICY "ai_docs_select" ON ai_documents FOR SELECT USING (org_id = get_user_org_id() OR is_super_admin());
CREATE POLICY "ai_docs_insert" ON ai_documents FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "ai_docs_update" ON ai_documents FOR UPDATE USING (org_id = get_user_org_id());
CREATE POLICY "ai_docs_delete" ON ai_documents FOR DELETE USING (org_id = get_user_org_id());

-- Timeline Events
CREATE POLICY "timeline_select" ON timeline_events FOR SELECT USING (org_id = get_user_org_id() OR is_super_admin());
CREATE POLICY "timeline_insert" ON timeline_events FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "timeline_update" ON timeline_events FOR UPDATE USING (org_id = get_user_org_id());
CREATE POLICY "timeline_delete" ON timeline_events FOR DELETE USING (org_id = get_user_org_id());

-- ═══════════════════════════════════════════════════════
-- Indexes for Performance
-- ═══════════════════════════════════════════════════════
CREATE INDEX idx_clients_org ON clients(org_id);
CREATE INDEX idx_cases_org ON cases(org_id);
CREATE INDEX idx_cases_client ON cases(client_id);
CREATE INDEX idx_sessions_case ON sessions(case_id);
CREATE INDEX idx_sessions_date ON sessions(date);
CREATE INDEX idx_sessions_composite ON sessions(date, case_id);
CREATE INDEX idx_documents_case ON documents(case_id);
CREATE INDEX idx_invoices_org ON invoices(org_id);
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_composite ON invoices(org_id, status, due_date);
CREATE INDEX idx_tasks_org ON tasks(org_id);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_expenses_org ON expenses(org_id);
CREATE INDEX idx_expenses_case ON expenses(case_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_audit_org ON audit_logs(org_id);
CREATE INDEX idx_audit_composite ON audit_logs(org_id, created_at DESC);
CREATE INDEX idx_enforcement_org ON enforcement(org_id);
CREATE INDEX idx_poas_client ON poas(client_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_modtime BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_clients_modtime BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_cases_modtime BEFORE UPDATE ON cases FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_sessions_modtime BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_documents_modtime BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_invoices_modtime BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_poas_modtime BEFORE UPDATE ON poas FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_tasks_modtime BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_expenses_modtime BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_trust_accounts_modtime BEFORE UPDATE ON trust_accounts FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_enforcement_modtime BEFORE UPDATE ON enforcement FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_expert_missions_modtime BEFORE UPDATE ON expert_missions FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_real_estate_registry_modtime BEFORE UPDATE ON real_estate_registry FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_specialized_tracks_modtime BEFORE UPDATE ON specialized_tracks FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_notifications_modtime BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_subscriptions_modtime BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_ai_documents_modtime BEFORE UPDATE ON ai_documents FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_timeline_events_modtime BEFORE UPDATE ON timeline_events FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- 23. Calendar Events Table
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id),
  title TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  type TEXT,
  case_id UUID REFERENCES cases(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "calendar_select" ON calendar_events FOR SELECT USING ((org_id = get_user_org_id() OR is_super_admin()) AND deleted_at IS NULL);
CREATE POLICY "calendar_insert" ON calendar_events FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "calendar_update" ON calendar_events FOR UPDATE USING (org_id = get_user_org_id() AND deleted_at IS NULL);
CREATE POLICY "calendar_delete" ON calendar_events FOR DELETE USING (org_id = get_user_org_id());

CREATE INDEX idx_calendar_events_org ON calendar_events(org_id);
CREATE TRIGGER update_calendar_events_modtime BEFORE UPDATE ON calendar_events FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ═══════════════════════════════════════════════════════
-- R4 Migration: Missing columns (additive — safe)
-- ═══════════════════════════════════════════════════════

-- documents.is_shared — controls client portal visibility
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT FALSE;

-- invoices — missing fields for ETA compliance
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS vat_amount DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_number TEXT;

-- Missing index for documents direct queries
CREATE INDEX IF NOT EXISTS idx_documents_org ON documents(org_id);
-- Missing index for calendar events date range queries
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(org_id, start_date);

-- ═══════════════════════════════════════════════════════
-- 24. Case Notes Table (lawyer private notes vs shared)
-- ═══════════════════════════════════════════════════════
CREATE TABLE case_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  is_private BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE case_notes ENABLE ROW LEVEL SECURITY;

-- Lawyers see all notes in their org; clients see only non-private notes on their cases
CREATE POLICY "case_notes_select" ON case_notes FOR SELECT USING (
  deleted_at IS NULL AND (
    is_super_admin()
    OR (get_user_role() != 'client' AND org_id = get_user_org_id())
    OR (get_user_role() = 'client' AND is_private = false
        AND EXISTS (SELECT 1 FROM cases WHERE cases.id = case_notes.case_id AND cases.client_id = get_user_linked_client_id()))
  )
);
CREATE POLICY "case_notes_insert" ON case_notes FOR INSERT WITH CHECK (get_user_role() != 'client' AND org_id = get_user_org_id());
CREATE POLICY "case_notes_update" ON case_notes FOR UPDATE USING (get_user_role() != 'client' AND org_id = get_user_org_id() AND deleted_at IS NULL);
CREATE POLICY "case_notes_delete" ON case_notes FOR DELETE USING (get_user_role() != 'client' AND org_id = get_user_org_id());

CREATE INDEX idx_case_notes_case ON case_notes(case_id);
CREATE INDEX idx_case_notes_org ON case_notes(org_id);
CREATE TRIGGER update_case_notes_modtime BEFORE UPDATE ON case_notes FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ═══════════════════════════════════════════════════════
-- 25. Payments Table (records partial/full payments on invoices)
-- ═══════════════════════════════════════════════════════
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  method TEXT,
  date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_select" ON payments FOR SELECT USING (org_id = get_user_org_id() OR is_super_admin());
CREATE POLICY "payments_insert" ON payments FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "payments_update" ON payments FOR UPDATE USING (org_id = get_user_org_id());
CREATE POLICY "payments_delete" ON payments FOR DELETE USING (org_id = get_user_org_id());

CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_org ON payments(org_id);
CREATE TRIGGER update_payments_modtime BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ═══════════════════════════════════════════════════════
-- 26. Time Entries Table (تتبع الوقت — M17)
-- ═══════════════════════════════════════════════════════
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id),
  lawyer_id UUID REFERENCES profiles(id),
  case_id UUID REFERENCES cases(id),
  description TEXT,
  duration INTEGER NOT NULL, -- in minutes
  hourly_rate DECIMAL(10, 2),
  billable BOOLEAN DEFAULT TRUE,
  is_billed BOOLEAN DEFAULT FALSE,
  date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "time_entries_select" ON time_entries FOR SELECT USING (org_id = get_user_org_id() OR is_super_admin());
CREATE POLICY "time_entries_insert" ON time_entries FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "time_entries_update" ON time_entries FOR UPDATE USING (org_id = get_user_org_id());
CREATE POLICY "time_entries_delete" ON time_entries FOR DELETE USING (org_id = get_user_org_id());
CREATE INDEX idx_time_entries_org ON time_entries(org_id);
CREATE INDEX idx_time_entries_lawyer ON time_entries(lawyer_id);
CREATE INDEX idx_time_entries_case ON time_entries(case_id);
CREATE TRIGGER update_time_entries_modtime BEFORE UPDATE ON time_entries FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ═══════════════════════════════════════════════════════
-- 27. Contracts Table (إدارة العقود CLM — M22)
-- ═══════════════════════════════════════════════════════
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id),
  client_id UUID REFERENCES clients(id),
  title TEXT NOT NULL,
  type TEXT, -- 'اتفاقية أتعاب', 'عقد تأسيس', 'عقد إيجار', etc.
  status TEXT DEFAULT 'مسودة', -- 'مسودة', 'قيد المراجعة', 'نشط', 'منتهي', 'ملغي'
  start_date DATE,
  end_date DATE,
  value DECIMAL(12, 2),
  content TEXT,
  signed_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contracts_select" ON contracts FOR SELECT USING ((org_id = get_user_org_id() OR is_super_admin()) AND deleted_at IS NULL);
CREATE POLICY "contracts_insert" ON contracts FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "contracts_update" ON contracts FOR UPDATE USING (org_id = get_user_org_id() AND deleted_at IS NULL);
CREATE POLICY "contracts_delete" ON contracts FOR DELETE USING (org_id = get_user_org_id());
CREATE INDEX idx_contracts_org ON contracts(org_id);
CREATE INDEX idx_contracts_client ON contracts(client_id);
CREATE TRIGGER update_contracts_modtime BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ═══════════════════════════════════════════════════════
-- 28. Receivables Table (التحصيل — M21)
-- ═══════════════════════════════════════════════════════
CREATE TABLE receivables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id),
  client_id UUID REFERENCES clients(id),
  case_id UUID REFERENCES cases(id),
  total_amount DECIMAL(12, 2) NOT NULL,
  collected_amount DECIMAL(12, 2) DEFAULT 0,
  outstanding_amount DECIMAL(12, 2) GENERATED ALWAYS AS (total_amount - collected_amount) STORED,
  due_date DATE,
  status TEXT DEFAULT 'مفتوح', -- 'مفتوح', 'متأخر', 'تحت التحصيل', 'مسوى', 'مغلق'
  is_reconciled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE receivables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "receivables_select" ON receivables FOR SELECT USING ((org_id = get_user_org_id() OR is_super_admin()) AND deleted_at IS NULL);
CREATE POLICY "receivables_insert" ON receivables FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "receivables_update" ON receivables FOR UPDATE USING (org_id = get_user_org_id() AND deleted_at IS NULL);
CREATE POLICY "receivables_delete" ON receivables FOR DELETE USING (org_id = get_user_org_id());
CREATE INDEX idx_receivables_org ON receivables(org_id);
CREATE INDEX idx_receivables_client ON receivables(client_id);
CREATE TRIGGER update_receivables_modtime BEFORE UPDATE ON receivables FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ═══════════════════════════════════════════════════════
-- 29. IP Records Table (الملكية الفكرية — M16)
-- ═══════════════════════════════════════════════════════
CREATE TABLE ip_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id),
  client_id UUID REFERENCES clients(id),
  title TEXT NOT NULL,
  type TEXT, -- 'علامة تجارية', 'براءة اختراع', 'نموذج صناعي', 'حق مؤلف'
  registration_number TEXT,
  filing_date DATE,
  expiry_date DATE,
  status TEXT DEFAULT 'قيد التسجيل', -- 'قيد التسجيل', 'مسجل', 'منتهي', 'مرفوض'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE ip_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ip_records_select" ON ip_records FOR SELECT USING ((org_id = get_user_org_id() OR is_super_admin()) AND deleted_at IS NULL);
CREATE POLICY "ip_records_insert" ON ip_records FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "ip_records_update" ON ip_records FOR UPDATE USING (org_id = get_user_org_id() AND deleted_at IS NULL);
CREATE POLICY "ip_records_delete" ON ip_records FOR DELETE USING (org_id = get_user_org_id());
CREATE INDEX idx_ip_records_org ON ip_records(org_id);
CREATE INDEX idx_ip_records_client ON ip_records(client_id);
-- ═══════════════════════════════════════════════════════
-- 30. Video Rooms Table (Daily.co)
-- ═══════════════════════════════════════════════════════
CREATE TABLE video_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  room_name TEXT UNIQUE NOT NULL,
  room_url TEXT NOT NULL,
  lawyer_id UUID REFERENCES profiles(id),
  client_id UUID REFERENCES clients(id),
  status TEXT DEFAULT 'active',
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE video_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "video_rooms_isolation" ON video_rooms FOR ALL USING (org_id = get_user_org_id() OR is_super_admin());
CREATE INDEX idx_video_rooms_org ON video_rooms(org_id);
CREATE INDEX idx_video_rooms_case ON video_rooms(case_id);
CREATE TRIGGER update_video_rooms_modtime BEFORE UPDATE ON video_rooms FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ═══════════════════════════════════════════════════════
-- Additional Performance Indexes (R5 Optimization)
-- ═══════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON cases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_date_desc ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at_desc ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_expert_missions_org ON expert_missions(case_id);
CREATE INDEX IF NOT EXISTS idx_real_estate_org ON real_estate_registry(org_id);

