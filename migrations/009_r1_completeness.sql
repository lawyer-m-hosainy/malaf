-- Migration 009: R1 System Completeness

-- 1. ETA Invoices Table
CREATE TABLE IF NOT EXISTS eta_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    client_tax_id TEXT,
    issuer_tax_reg TEXT,
    eta_code TEXT DEFAULT '8211',
    amount DECIMAL(12,2),
    vat_amount DECIMAL(12,2),
    schedule_tax DECIMAL(12,2) DEFAULT 0,
    stamp_duty DECIMAL(12,2) DEFAULT 20,
    total DECIMAL(12,2),
    status TEXT DEFAULT 'مسودة',
    uuid TEXT,
    description TEXT,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Conflict Checks Table
CREATE TABLE IF NOT EXISTS conflict_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    status TEXT NOT NULL,
    matches JSONB DEFAULT '[]'::jsonb,
    checked_at TIMESTAMPTZ DEFAULT NOW(),
    resolution_notes TEXT,
    resolution_date TIMESTAMPTZ,
    resolved_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Wiki Articles Table
CREATE TABLE IF NOT EXISTS wiki_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    author TEXT,
    tags TEXT[],
    last_updated DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. State Council Cases Table
CREATE TABLE IF NOT EXISTS state_council_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    court_branch TEXT NOT NULL,
    state_council_year_q TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Economic Court Cases Table
CREATE TABLE IF NOT EXISTS economic_court_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    dispute_type TEXT,
    amount_in_dispute DECIMAL(12,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Criminal Cases Table
CREATE TABLE IF NOT EXISTS criminal_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
    case_type TEXT NOT NULL,
    current_stage INTEGER DEFAULT 1,
    police_report JSONB NOT NULL DEFAULT '{}'::jsonb,
    prosecution JSONB,
    court_registration JSONB,
    trial JSONB,
    verdict_and_appeal JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Family Court Cases Table
CREATE TABLE IF NOT EXISTS family_court_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    dispute_type TEXT,
    settlement_office_status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Bar Association Services Table
CREATE TABLE IF NOT EXISTS bar_association_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    service_type TEXT NOT NULL,
    status TEXT NOT NULL,
    submission_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies & Triggers

-- 1. ETA Invoices
ALTER TABLE eta_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_eta_invoices" ON eta_invoices FOR ALL USING (org_id = get_user_org_id());
CREATE INDEX IF NOT EXISTS idx_eta_invoices_org_id ON eta_invoices(org_id);
CREATE TRIGGER update_eta_invoices_modtime BEFORE UPDATE ON eta_invoices FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- 2. Conflict Checks
ALTER TABLE conflict_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_conflict_checks" ON conflict_checks FOR ALL USING (org_id = get_user_org_id());
CREATE INDEX IF NOT EXISTS idx_conflict_checks_org_id ON conflict_checks(org_id);
CREATE TRIGGER update_conflict_checks_modtime BEFORE UPDATE ON conflict_checks FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- 3. Wiki Articles
ALTER TABLE wiki_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_wiki_articles" ON wiki_articles FOR ALL USING (org_id = get_user_org_id());
CREATE INDEX IF NOT EXISTS idx_wiki_articles_org_id ON wiki_articles(org_id);
CREATE TRIGGER update_wiki_articles_modtime BEFORE UPDATE ON wiki_articles FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- 4. State Council Cases
ALTER TABLE state_council_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_state_council_cases" ON state_council_cases FOR ALL USING (org_id = get_user_org_id());
CREATE INDEX IF NOT EXISTS idx_state_council_cases_org_id ON state_council_cases(org_id);
CREATE TRIGGER update_state_council_cases_modtime BEFORE UPDATE ON state_council_cases FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- 5. Economic Court Cases
ALTER TABLE economic_court_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_economic_court_cases" ON economic_court_cases FOR ALL USING (org_id = get_user_org_id());
CREATE INDEX IF NOT EXISTS idx_economic_court_cases_org_id ON economic_court_cases(org_id);
CREATE TRIGGER update_economic_court_cases_modtime BEFORE UPDATE ON economic_court_cases FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- 6. Criminal Cases
ALTER TABLE criminal_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_criminal_cases" ON criminal_cases FOR ALL USING (org_id = get_user_org_id());
CREATE INDEX IF NOT EXISTS idx_criminal_cases_org_id ON criminal_cases(org_id);
CREATE TRIGGER update_criminal_cases_modtime BEFORE UPDATE ON criminal_cases FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- 7. Family Court Cases
ALTER TABLE family_court_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_family_court_cases" ON family_court_cases FOR ALL USING (org_id = get_user_org_id());
CREATE INDEX IF NOT EXISTS idx_family_court_cases_org_id ON family_court_cases(org_id);
CREATE TRIGGER update_family_court_cases_modtime BEFORE UPDATE ON family_court_cases FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- 8. Bar Association Services
ALTER TABLE bar_association_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_bar_association_services" ON bar_association_services FOR ALL USING (org_id = get_user_org_id());
CREATE INDEX IF NOT EXISTS idx_bar_association_services_org_id ON bar_association_services(org_id);
CREATE TRIGGER update_bar_association_services_modtime BEFORE UPDATE ON bar_association_services FOR EACH ROW EXECUTE FUNCTION update_modified_column();
