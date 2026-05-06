-- ═══════════════════════════════════════════════════════
-- WhatsApp Bot Module — Supabase Migration
-- Platform: مَلَف (Malaf) Egyptian Law Firm SaaS
-- Date: 2026-05-07
-- ═══════════════════════════════════════════════════════
-- ملاحظة: هذا الملف يُضاف بشكل إضافي ولا يعدّل أي جدول قائم.
-- يعتمد على نفس نمط RLS الموجود: get_user_org_id() + is_super_admin()
-- ═══════════════════════════════════════════════════════


-- ─── 1. إعدادات البوت لكل مكتب ───────────────────────
CREATE TABLE IF NOT EXISTS whatsapp_settings (
  org_id UUID PRIMARY KEY REFERENCES organizations(id),
  wa_phone_number TEXT,
  api_token_encrypted TEXT,                -- مشفر بنفس ENCRYPTION_KEY في server.js عبر /api/crypto/encrypt
  welcome_message TEXT DEFAULT 'أهلاً بك في مكتبنا القانوني. أرسل رقم قضيتك للاستعلام.',
  away_message TEXT DEFAULT 'شكراً لتواصلك. سيرد عليك المكتب قريباً.',
  notifications JSONB DEFAULT '{
    "session_reminder_24h": true,
    "session_reminder_3h": true,
    "session_result": true,
    "invoice_due": true,
    "weekly_report": true
  }'::jsonb,
  is_active BOOLEAN DEFAULT false,
  provider TEXT DEFAULT '360dialog' CHECK (provider IN ('360dialog', 'twilio', 'meta_cloud')),
  webhook_secret TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 2. جهات اتصال الواتساب ──────────────────────────
CREATE TABLE IF NOT EXISTS whatsapp_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  phone_number TEXT NOT NULL,
  contact_type TEXT NOT NULL CHECK (contact_type IN ('client', 'lawyer', 'staff')),
  linked_id UUID,                          -- client_id من جدول clients أو user_id من profiles حسب contact_type
  display_name TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, phone_number)
);

-- ─── 3. سجل الرسائل ──────────────────────────────────
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'document', 'audio', 'template')),
  content TEXT,
  media_url TEXT,
  case_id UUID REFERENCES cases(id),       -- ربط اختياري بقضية
  client_id UUID REFERENCES clients(id),   -- ربط اختياري بموكل
  command_detected TEXT,                   -- الأمر اللي اكتشفه commandParser (جلسة، موعد، مصروف، إلخ)
  ai_handled BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'received' CHECK (status IN ('received', 'sent', 'delivered', 'read', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 4. التذكيرات المجدولة ────────────────────────────
CREATE TABLE IF NOT EXISTS whatsapp_scheduled (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  target_phone TEXT NOT NULL,
  message_template TEXT NOT NULL,
  template_data JSONB DEFAULT '{}'::jsonb,
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'session_reminder_24h', 'session_reminder_3h', 'session_result',
    'invoice_due', 'weekly_report', 'custom_reminder'
  )),
  related_case_id UUID REFERENCES cases(id),
  related_session_id UUID REFERENCES sessions(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ═══════════════════════════════════════════════════════
-- فهارس الأداء (Indexes)
-- ═══════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_wa_contacts_org ON whatsapp_contacts(org_id);
CREATE INDEX IF NOT EXISTS idx_wa_contacts_phone ON whatsapp_contacts(org_id, phone_number);
CREATE INDEX IF NOT EXISTS idx_wa_messages_org ON whatsapp_messages(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wa_messages_case ON whatsapp_messages(case_id) WHERE case_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wa_messages_client ON whatsapp_messages(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wa_scheduled_pending ON whatsapp_scheduled(scheduled_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_wa_scheduled_org ON whatsapp_scheduled(org_id);


-- ═══════════════════════════════════════════════════════
-- تفعيل RLS
-- ═══════════════════════════════════════════════════════

ALTER TABLE whatsapp_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_scheduled ENABLE ROW LEVEL SECURITY;


-- ═══════════════════════════════════════════════════════
-- سياسات RLS — عزل المكاتب
-- نمط موحّد مع باقي الجداول: get_user_org_id() + is_super_admin()
-- ═══════════════════════════════════════════════════════

-- whatsapp_settings: المدير يقرأ ويعدّل إعدادات مكتبه فقط
CREATE POLICY "wa_settings_select" ON whatsapp_settings
  FOR SELECT USING (org_id = get_user_org_id() OR is_super_admin());
CREATE POLICY "wa_settings_insert" ON whatsapp_settings
  FOR INSERT WITH CHECK (org_id = get_user_org_id() OR is_super_admin());
CREATE POLICY "wa_settings_update" ON whatsapp_settings
  FOR UPDATE USING (org_id = get_user_org_id() OR is_super_admin());

-- whatsapp_contacts: كل مكتب يرى جهات اتصاله فقط
CREATE POLICY "wa_contacts_select" ON whatsapp_contacts
  FOR SELECT USING (org_id = get_user_org_id() OR is_super_admin());
CREATE POLICY "wa_contacts_insert" ON whatsapp_contacts
  FOR INSERT WITH CHECK (org_id = get_user_org_id() OR is_super_admin());
CREATE POLICY "wa_contacts_update" ON whatsapp_contacts
  FOR UPDATE USING (org_id = get_user_org_id() OR is_super_admin());
CREATE POLICY "wa_contacts_delete" ON whatsapp_contacts
  FOR DELETE USING (org_id = get_user_org_id() OR is_super_admin());

-- whatsapp_messages: كل مكتب يرى رسائله فقط (لا حذف — سجل دائم)
CREATE POLICY "wa_messages_select" ON whatsapp_messages
  FOR SELECT USING (org_id = get_user_org_id() OR is_super_admin());
CREATE POLICY "wa_messages_insert" ON whatsapp_messages
  FOR INSERT WITH CHECK (org_id = get_user_org_id() OR is_super_admin());

-- whatsapp_scheduled: كل مكتب يرى جدولته فقط
CREATE POLICY "wa_scheduled_select" ON whatsapp_scheduled
  FOR SELECT USING (org_id = get_user_org_id() OR is_super_admin());
CREATE POLICY "wa_scheduled_insert" ON whatsapp_scheduled
  FOR INSERT WITH CHECK (org_id = get_user_org_id() OR is_super_admin());
CREATE POLICY "wa_scheduled_update" ON whatsapp_scheduled
  FOR UPDATE USING (org_id = get_user_org_id() OR is_super_admin());


-- ═══════════════════════════════════════════════════════
-- Triggers — تحديث updated_at تلقائياً
-- ═══════════════════════════════════════════════════════

-- نفس الدالة الموجودة في المشروع
-- CREATE OR REPLACE FUNCTION update_updated_at() ... (موجودة مسبقاً)

CREATE TRIGGER update_wa_settings_updated_at
  BEFORE UPDATE ON whatsapp_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_wa_contacts_updated_at
  BEFORE UPDATE ON whatsapp_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
