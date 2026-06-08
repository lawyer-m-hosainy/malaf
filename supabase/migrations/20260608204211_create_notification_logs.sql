CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL,
  reference_id UUID,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  channel TEXT DEFAULT 'email',
  UNIQUE(user_id, type, reference_id, channel)
);

-- RLS: المستخدم يرى سجلاته فقط
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_logs" ON notification_logs
  FOR ALL USING (auth.uid() = user_id);
