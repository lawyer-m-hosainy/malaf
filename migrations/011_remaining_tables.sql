-- Migration 011: Remaining Tables for GAP 1 completeness

-- 1. Documents
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    type TEXT,
    size_bytes BIGINT,
    storage_path TEXT,
    uploaded_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_documents" ON documents FOR ALL USING (org_id = get_user_org_id());
CREATE INDEX IF NOT EXISTS idx_documents_org_id ON documents(org_id);
CREATE TRIGGER update_documents_modtime BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- 2. Time Tracking
CREATE TABLE IF NOT EXISTS time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    lawyer_id TEXT,
    description TEXT,
    duration_minutes INTEGER,
    date DATE DEFAULT CURRENT_DATE,
    billable BOOLEAN DEFAULT TRUE,
    is_billed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_time_entries" ON time_entries FOR ALL USING (org_id = get_user_org_id());
CREATE INDEX IF NOT EXISTS idx_time_entries_org_id ON time_entries(org_id);
CREATE TRIGGER update_time_entries_modtime BEFORE UPDATE ON time_entries FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- 3. Collections (Receivables & Actions)
CREATE TABLE IF NOT EXISTS receivables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    client_id TEXT,
    client_name TEXT NOT NULL,
    case_id TEXT,
    total_amount DECIMAL(12,2),
    collected_amount DECIMAL(12,2) DEFAULT 0,
    outstanding_amount DECIMAL(12,2),
    due_date DATE,
    status TEXT DEFAULT 'مفتوح',
    is_reconciled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

ALTER TABLE receivables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_receivables" ON receivables FOR ALL USING (org_id = get_user_org_id());
CREATE INDEX IF NOT EXISTS idx_receivables_org_id ON receivables(org_id);
CREATE TRIGGER update_receivables_modtime BEFORE UPDATE ON receivables FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TABLE IF NOT EXISTS collection_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    receivable_id UUID REFERENCES receivables(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    notes TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE collection_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_collection_actions" ON collection_actions FOR ALL USING (org_id = get_user_org_id());
CREATE INDEX IF NOT EXISTS idx_collection_actions_org_id ON collection_actions(org_id);

-- 4. Expert Missions
CREATE TABLE IF NOT EXISTS expert_missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    case_id TEXT,
    mission_number TEXT NOT NULL,
    expert_name TEXT NOT NULL,
    expert_type TEXT,
    assignment_date DATE,
    deposit_amount DECIMAL(12,2),
    report_received BOOLEAN DEFAULT FALSE,
    objection_filed BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'جارية',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

ALTER TABLE expert_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_expert_missions" ON expert_missions FOR ALL USING (org_id = get_user_org_id());
CREATE INDEX IF NOT EXISTS idx_expert_missions_org_id ON expert_missions(org_id);
CREATE TRIGGER update_expert_missions_modtime BEFORE UPDATE ON expert_missions FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TABLE IF NOT EXISTS expert_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    mission_id UUID REFERENCES expert_missions(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    result TEXT,
    next_session DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE expert_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_expert_sessions" ON expert_sessions FOR ALL USING (org_id = get_user_org_id());
CREATE INDEX IF NOT EXISTS idx_expert_sessions_org_id ON expert_sessions(org_id);

-- 6. E-Litigation
CREATE TABLE IF NOT EXISTS e_litigation_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    case_id TEXT,
    portal_ref TEXT NOT NULL,
    portal_status TEXT,
    last_sync TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE e_litigation_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_e_litigation_cases" ON e_litigation_cases FOR ALL USING (org_id = get_user_org_id());
CREATE INDEX IF NOT EXISTS idx_e_litigation_cases_org_id ON e_litigation_cases(org_id);

-- 12. Field Check-ins
CREATE TABLE IF NOT EXISTS field_checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    lawyer_id TEXT NOT NULL,
    case_id TEXT,
    location_lat DECIMAL(10,8),
    location_lng DECIMAL(11,8),
    location_name TEXT,
    photo_url TEXT,
    notes TEXT,
    checkin_time TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE field_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_field_checkins" ON field_checkins FOR ALL USING (org_id = get_user_org_id());
CREATE INDEX IF NOT EXISTS idx_field_checkins_org_id ON field_checkins(org_id);

-- 13. Contracts
CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    client_id TEXT,
    title TEXT NOT NULL,
    type TEXT,
    content TEXT,
    status TEXT DEFAULT 'مسودة',
    signed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_contracts" ON contracts FOR ALL USING (org_id = get_user_org_id());
CREATE INDEX IF NOT EXISTS idx_contracts_org_id ON contracts(org_id);
CREATE TRIGGER update_contracts_modtime BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_modified_column();
