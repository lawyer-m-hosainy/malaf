-- Performance Indexes Migration
-- Adds indexes to foreign keys and sorting columns to prevent N+1 and slow queries

-- Indexes on organization_id for tenant isolation performance
CREATE INDEX IF NOT EXISTS idx_tasks_org ON tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_expenses_org ON expenses(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_trust_org ON trust_accounts(organization_id);
CREATE INDEX IF NOT EXISTS idx_poas_org ON powers_of_attorney(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_org ON documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_enforcement_org ON enforcement_cases(organization_id);
CREATE INDEX IF NOT EXISTS idx_expert_org ON expert_missions(organization_id);

-- Indexes for sorting by created_at / date
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON cases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);

-- Composite indexes for frequent queries
CREATE INDEX IF NOT EXISTS idx_cases_org_status ON cases(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_sessions_org_date ON sessions(organization_id, date);
