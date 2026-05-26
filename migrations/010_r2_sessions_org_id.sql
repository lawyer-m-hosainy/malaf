-- Migration 010: R2 Multi-Tenant Security Fixes

-- 1. Add org_id to sessions table
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- 2. Backfill existing data
UPDATE sessions 
SET org_id = (SELECT org_id FROM cases WHERE cases.id = sessions.case_id)
WHERE org_id IS NULL;

-- 3. Update RLS policy to use direct org_id instead of EXISTS subquery
DROP POLICY IF EXISTS "tenant_isolation_sessions" ON sessions;
CREATE POLICY "tenant_isolation_sessions" ON sessions FOR ALL USING (org_id = get_user_org_id());

-- 4. Create Index for performance
CREATE INDEX IF NOT EXISTS idx_sessions_org_id ON sessions(org_id);
