-- ═══════════════════════════════════════════════════════
-- جداول واتساب — مَلَف (Malaf)
-- Migration: إضافة الجداول المفقودة المطلوبة من routes/whatsapp.js
-- ═══════════════════════════════════════════════════════

-- 31. WhatsApp Settings (إعدادات واتساب لكل مكتب)
CREATE TABLE IF NOT EXISTS whatsapp_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  wa_phone_number TEXT, -- رقم واتساب الأعمال
  api_token_encrypted TEXT, -- توكن API مشفّر
  webhook_secret TEXT, -- سر التحقق من الـ Webhook
  welcome_message TEXT DEFAULT 'مرحباً بك في مكتبنا! كيف يمكننا مساعدتك؟ أرسل رقم القضية للاستعلام.',
  away_message TEXT DEFAULT 'شكراً لتواصلك. سنرد عليك في أقرب وقت خلال ساعات العمل.',
  notifications JSONB DEFAULT '{"session_reminder": true, "invoice_due": true, "case_update": true}'::jsonb,
  is_active BOOLEAN DEFAULT FALSE,
  provider TEXT DEFAULT '360dialog', -- '360dialog' أو 'meta_cloud'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 32. WhatsApp Messages (سجل رسائل واتساب)
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  content TEXT,
  message_type TEXT DEFAULT 'text', -- 'text', 'image', 'document', 'audio'
  case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  command_detected TEXT, -- الأمر المُكتَشف (مثل: 'جلسة', 'موعد', 'مصروف')
  ai_handled BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'received', -- 'received', 'sent', 'delivered', 'read', 'failed'
  media_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 33. WhatsApp Contacts (جهات اتصال واتساب)
CREATE TABLE IF NOT EXISTS whatsapp_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  contact_type TEXT NOT NULL CHECK (contact_type IN ('lawyer', 'staff', 'client', 'unknown')),
  linked_id UUID, -- مرجع إلى profiles.id (محامي/موظف) أو clients.id (موكل)
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, phone_number) -- رقم واحد لكل مكتب
);

-- ═══════════════════════════════════════════════════════
-- تفعيل RLS
-- ═══════════════════════════════════════════════════════
ALTER TABLE whatsapp_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_contacts ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════
-- سياسات العزل (RLS Policies)
-- ═══════════════════════════════════════════════════════

-- WhatsApp Settings: المكتب يرى إعداداته فقط
CREATE POLICY "wa_settings_select" ON whatsapp_settings FOR SELECT USING (org_id = get_user_org_id() OR is_super_admin());
CREATE POLICY "wa_settings_insert" ON whatsapp_settings FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "wa_settings_update" ON whatsapp_settings FOR UPDATE USING (org_id = get_user_org_id());
CREATE POLICY "wa_settings_delete" ON whatsapp_settings FOR DELETE USING (org_id = get_user_org_id());

-- WhatsApp Messages: المكتب يرى رسائله فقط
CREATE POLICY "wa_messages_select" ON whatsapp_messages FOR SELECT USING (org_id = get_user_org_id() OR is_super_admin());
CREATE POLICY "wa_messages_insert" ON whatsapp_messages FOR INSERT WITH CHECK (org_id = get_user_org_id() OR is_super_admin());

-- WhatsApp Contacts: المكتب يرى جهات اتصاله فقط
CREATE POLICY "wa_contacts_select" ON whatsapp_contacts FOR SELECT USING (org_id = get_user_org_id() OR is_super_admin());
CREATE POLICY "wa_contacts_insert" ON whatsapp_contacts FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "wa_contacts_update" ON whatsapp_contacts FOR UPDATE USING (org_id = get_user_org_id());
CREATE POLICY "wa_contacts_delete" ON whatsapp_contacts FOR DELETE USING (org_id = get_user_org_id());

-- ═══════════════════════════════════════════════════════
-- Indexes
-- ═══════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_wa_settings_org ON whatsapp_settings(org_id);
CREATE INDEX IF NOT EXISTS idx_wa_messages_org ON whatsapp_messages(org_id);
CREATE INDEX IF NOT EXISTS idx_wa_messages_created ON whatsapp_messages(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wa_messages_direction ON whatsapp_messages(org_id, direction);
CREATE INDEX IF NOT EXISTS idx_wa_contacts_org ON whatsapp_contacts(org_id);
CREATE INDEX IF NOT EXISTS idx_wa_contacts_phone ON whatsapp_contacts(org_id, phone_number);

-- ═══════════════════════════════════════════════════════
-- Triggers
-- ═══════════════════════════════════════════════════════
CREATE TRIGGER update_wa_settings_modtime BEFORE UPDATE ON whatsapp_settings FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_wa_contacts_modtime BEFORE UPDATE ON whatsapp_contacts FOR EACH ROW EXECUTE FUNCTION update_modified_column();
