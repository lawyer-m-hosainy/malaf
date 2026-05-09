-- ═══════════════════════════════════════════════════════
-- R8: Performance Migration — sessions org_id direct column
-- ═══════════════════════════════════════════════════════
-- Problem: sessions table requires JOIN to cases to get org_id for tenant isolation
-- Solution: Add direct org_id column + auto-fill trigger to avoid the expensive JOIN

-- 1. Add org_id to sessions (direct, no JOIN needed)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);

-- 2. Backfill from cases
UPDATE sessions s
SET org_id = c.org_id
FROM cases c
WHERE s.case_id = c.id AND s.org_id IS NULL;

-- 3. Auto-fill trigger: set org_id from the parent case on INSERT
CREATE OR REPLACE FUNCTION fill_session_org_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.org_id IS NULL AND NEW.case_id IS NOT NULL THEN
    SELECT org_id INTO NEW.org_id FROM cases WHERE id = NEW.case_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_fill_session_org_id ON sessions;
CREATE TRIGGER trg_fill_session_org_id
  BEFORE INSERT ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION fill_session_org_id();

-- 4. Performance index
CREATE INDEX IF NOT EXISTS idx_sessions_org_id ON sessions(org_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date_org ON sessions(date, org_id);

-- 5. Update RLS to use direct org_id (no JOIN)
DROP POLICY IF EXISTS "sessions_isolation" ON sessions;
CREATE POLICY "sessions_isolation" ON sessions FOR ALL USING (
  org_id = get_user_org_id() OR is_super_admin()
);
