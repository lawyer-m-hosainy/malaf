-- R5: Supabase Schema Fixes & Performance Optimization

-- 1. Missing Module: Video Consulting (Daily.co)
CREATE TABLE IF NOT EXISTS video_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  room_name TEXT UNIQUE NOT NULL,
  room_url TEXT NOT NULL,
  lawyer_id UUID REFERENCES profiles(id),
  client_id UUID REFERENCES clients(id),
  status TEXT DEFAULT 'active', -- 'active', 'finished', 'expired'
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE video_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "video_rooms_isolation" ON video_rooms FOR ALL USING (org_id = get_user_org_id() OR is_super_admin());

-- 2. Performance Indexes (R3 Localization & RTL Performance)
-- Focus on: office_id, case_id, created_at
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON cases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_date_desc ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_expert_missions_org ON expert_missions(case_id); -- case_id is proxy for org
CREATE INDEX IF NOT EXISTS idx_real_estate_org ON real_estate_registry(org_id);
CREATE INDEX IF NOT EXISTS idx_video_rooms_org ON video_rooms(org_id);
CREATE INDEX IF NOT EXISTS idx_video_rooms_case ON video_rooms(case_id);

-- 3. Storage Buckets Setup (SQL for Supabase Storage)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false), 
       ('poas', 'poas', false), 
       ('contracts', 'contracts', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies (Per-Office Isolation)
CREATE POLICY "Office Isolation for Documents"
ON storage.objects FOR ALL
USING (
  bucket_id = 'documents' 
  AND (auth.jwt() -> 'raw_user_meta_data' ->> 'org_id')::text = (storage.foldername(name))[1]
);

-- 4. RLS Optimization (Avoiding subqueries where possible)
-- We will use the direct metadata check for faster performance
DROP POLICY IF EXISTS "cases_select" ON cases;
CREATE POLICY "cases_select_opt" ON cases FOR SELECT USING (
  deleted_at IS NULL AND (
    (auth.jwt() -> 'raw_user_meta_data' ->> 'role') = 'super_admin'
    OR ((auth.jwt() -> 'raw_user_meta_data' ->> 'role') != 'client' AND org_id = (auth.jwt() -> 'raw_user_meta_data' ->> 'org_id')::UUID)
    OR ((auth.jwt() -> 'raw_user_meta_data' ->> 'role') = 'client' AND client_id = (SELECT linked_client_id FROM profiles WHERE id = auth.uid()))
  )
);

-- 5. Data Integrity: Default Statuses
ALTER TABLE cases ALTER COLUMN status SET DEFAULT 'متداولة';
ALTER TABLE tasks ALTER COLUMN status SET DEFAULT 'قيد الانتظار';

-- 6. Trigger for Video Rooms
CREATE TRIGGER update_video_rooms_modtime BEFORE UPDATE ON video_rooms FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- 7. Add Index on created_at for all audit logs to speed up analytics
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at_desc ON audit_logs(created_at DESC);
