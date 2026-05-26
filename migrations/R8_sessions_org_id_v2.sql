-- ═══════════════════════════════════════════════════════
-- R8 v2: Performance Migration — sessions org_id direct column
-- ═══════════════════════════════════════════════════════
-- Fix: cases table may use office_id instead of org_id
-- This version auto-detects which column exists.

-- 1. Add org_id to sessions
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);

-- 2. Backfill: try org_id first, fall back to office_id
DO $$
BEGIN
  -- Check if cases has org_id column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cases' AND column_name = 'org_id'
  ) THEN
    UPDATE sessions s
    SET org_id = c.org_id
    FROM cases c
    WHERE s.case_id = c.id AND s.org_id IS NULL;
    RAISE NOTICE 'Backfilled sessions.org_id from cases.org_id';
  -- Check if cases has office_id column  
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cases' AND column_name = 'office_id'
  ) THEN
    UPDATE sessions s
    SET org_id = c.office_id
    FROM cases c
    WHERE s.case_id = c.id AND s.org_id IS NULL;
    RAISE NOTICE 'Backfilled sessions.org_id from cases.office_id';
  ELSE
    RAISE NOTICE 'WARNING: cases table has neither org_id nor office_id — skipping backfill';
  END IF;
END $$;

-- 3. Auto-fill trigger: set org_id from the parent case on INSERT
CREATE OR REPLACE FUNCTION fill_session_org_id()
RETURNS TRIGGER AS $$
DECLARE
  parent_org UUID;
BEGIN
  IF NEW.org_id IS NULL AND NEW.case_id IS NOT NULL THEN
    -- Try org_id first, then office_id
    SELECT COALESCE(
      (SELECT org_id FROM cases WHERE id = NEW.case_id),
      (SELECT office_id FROM cases WHERE id = NEW.case_id)
    ) INTO parent_org;
    NEW.org_id := parent_org;
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
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sessions_isolation" ON sessions;
CREATE POLICY "sessions_isolation" ON sessions FOR ALL USING (
  org_id = get_user_org_id()
);
