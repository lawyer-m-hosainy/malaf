CREATE TABLE video_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id UUID NOT NULL,
  case_id UUID NOT NULL,
  room_name TEXT NOT NULL UNIQUE,
  room_url TEXT,
  lawyer_id UUID NOT NULL,
  client_phone TEXT,
  client_name TEXT,
  status TEXT CHECK (status IN ('waiting','active','ended')) DEFAULT 'waiting',
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  notes TEXT,
  chat_log JSONB DEFAULT '[]',
  recording_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE video_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "video_sessions_isolation_policy" ON video_sessions
    FOR ALL
    USING (office_id = get_user_org_id());
