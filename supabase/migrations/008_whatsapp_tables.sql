-- ═══════════════════════════════════════════════════════ 
 -- Migration 008: WhatsApp Tables — مَلَف (Malaf) 
 -- ═══════════════════════════════════════════════════════ 
 -- المهمة 3 من خطة الاثنين 11/5: إنشاء جداول واتساب 
 -- يحل مشكلة "خطأ أثناء الحفظ" في صفحة إعدادات الواتساب 
 -- 
 -- التنفيذ: Supabase Dashboard → SQL Editor → New Query → لصق وتشغيل 
 -- ═══════════════════════════════════════════════════════ 
 
 -- 31. WhatsApp Settings (إعدادات واتساب لكل مكتب) 
 CREATE TABLE IF NOT EXISTS whatsapp_settings ( 
   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), 
   org_id UUID REFERENCES organizations(id) ON DELETE CASCADE UNIQUE, 
   wa_phone_number TEXT,                -- رقم واتساب الأعمال / Phone Number ID 
   api_token_encrypted TEXT,            -- توكن API مشفّر (AES-256-GCM) 
   webhook_secret TEXT,                 -- سر التحقق من الـ Webhook 
   welcome_message TEXT DEFAULT 'مرحباً بك في مكتبنا! كيف يمكننا مساعدتك؟ أرسل رقم القضية للاستعلام.', 
   away_message TEXT DEFAULT 'شكراً لتواصلك. سنرد عليك في أقرب وقت خلال ساعات العمل.', 
   notifications JSONB DEFAULT '{"session_reminder": true, "invoice_due": true, "case_update": true}'::jsonb, 
   is_active BOOLEAN DEFAULT FALSE, 
   provider TEXT DEFAULT 'meta_cloud',  -- 'meta_cloud' أو '360dialog' 
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
   message_type TEXT DEFAULT 'text',    -- 'text', 'image', 'document', 'audio' 
   case_id UUID REFERENCES cases(id) ON DELETE SET NULL, 
   client_id UUID REFERENCES clients(id) ON DELETE SET NULL, 
   command_detected TEXT,               -- الأمر المُكتَشف (مثل: 'جلسة', 'موعد', 'مصروف') 
   ai_handled BOOLEAN DEFAULT FALSE, 
   status TEXT DEFAULT 'received',      -- 'received', 'sent', 'delivered', 'read', 'failed' 
   media_url TEXT, 
   created_at TIMESTAMPTZ DEFAULT NOW() 
 ); 
 
 -- 33. WhatsApp Contacts (جهات اتصال واتساب) 
 CREATE TABLE IF NOT EXISTS whatsapp_contacts ( 
   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), 
   org_id UUID REFERENCES organizations(id) ON DELETE CASCADE, 
   phone_number TEXT NOT NULL, 
   contact_type TEXT NOT NULL CHECK (contact_type IN ('lawyer', 'staff', 'client', 'unknown')), 
   linked_id UUID,                      -- مرجع إلى profiles.id أو clients.id 
   name TEXT, 
   created_at TIMESTAMPTZ DEFAULT NOW(), 
   updated_at TIMESTAMPTZ DEFAULT NOW(), 
   UNIQUE(org_id, phone_number)         -- رقم واحد لكل مكتب 
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
 
 -- حذف السياسات لو كانت موجودة (لتجنب الخطأ عند إعادة التشغيل) 
 DO $$ BEGIN 
   DROP POLICY IF EXISTS "wa_settings_select" ON whatsapp_settings; 
   DROP POLICY IF EXISTS "wa_settings_insert" ON whatsapp_settings; 
   DROP POLICY IF EXISTS "wa_settings_update" ON whatsapp_settings; 
   DROP POLICY IF EXISTS "wa_settings_delete" ON whatsapp_settings; 
   DROP POLICY IF EXISTS "wa_messages_select" ON whatsapp_messages; 
   DROP POLICY IF EXISTS "wa_messages_insert" ON whatsapp_messages; 
   DROP POLICY IF EXISTS "wa_contacts_select" ON whatsapp_contacts; 
   DROP POLICY IF EXISTS "wa_contacts_insert" ON whatsapp_contacts; 
   DROP POLICY IF EXISTS "wa_contacts_update" ON whatsapp_contacts; 
   DROP POLICY IF EXISTS "wa_contacts_delete" ON whatsapp_contacts; 
 EXCEPTION WHEN OTHERS THEN NULL; 
 END $$; 
 
 -- WhatsApp Settings: المكتب يرى إعداداته فقط 
 CREATE POLICY "wa_settings_select" ON whatsapp_settings FOR SELECT 
   USING (org_id = get_user_org_id() OR is_super_admin()); 
 CREATE POLICY "wa_settings_insert" ON whatsapp_settings FOR INSERT 
   WITH CHECK (org_id = get_user_org_id()); 
 CREATE POLICY "wa_settings_update" ON whatsapp_settings FOR UPDATE 
   USING (org_id = get_user_org_id()); 
 CREATE POLICY "wa_settings_delete" ON whatsapp_settings FOR DELETE 
   USING (org_id = get_user_org_id()); 
 
 -- WhatsApp Messages: المكتب يرى رسائله فقط 
 CREATE POLICY "wa_messages_select" ON whatsapp_messages FOR SELECT 
   USING (org_id = get_user_org_id() OR is_super_admin()); 
 CREATE POLICY "wa_messages_insert" ON whatsapp_messages FOR INSERT 
   WITH CHECK (org_id = get_user_org_id() OR is_super_admin()); 
 
 -- WhatsApp Contacts: المكتب يرى جهات اتصاله فقط 
 CREATE POLICY "wa_contacts_select" ON whatsapp_contacts FOR SELECT 
   USING (org_id = get_user_org_id() OR is_super_admin()); 
 CREATE POLICY "wa_contacts_insert" ON whatsapp_contacts FOR INSERT 
   WITH CHECK (org_id = get_user_org_id()); 
 CREATE POLICY "wa_contacts_update" ON whatsapp_contacts FOR UPDATE 
   USING (org_id = get_user_org_id()); 
 CREATE POLICY "wa_contacts_delete" ON whatsapp_contacts FOR DELETE 
   USING (org_id = get_user_org_id()); 
 
 -- ═══════════════════════════════════════════════════════ 
 -- Indexes — أداء عالي لكل الاستعلامات 
 -- ═══════════════════════════════════════════════════════ 
 CREATE INDEX IF NOT EXISTS idx_wa_settings_org ON whatsapp_settings(org_id); 
 CREATE INDEX IF NOT EXISTS idx_wa_messages_org ON whatsapp_messages(org_id); 
 CREATE INDEX IF NOT EXISTS idx_wa_messages_created ON whatsapp_messages(org_id, created_at DESC); 
 CREATE INDEX IF NOT EXISTS idx_wa_messages_direction ON whatsapp_messages(org_id, direction); 
 CREATE INDEX IF NOT EXISTS idx_wa_contacts_org ON whatsapp_contacts(org_id); 
 CREATE INDEX IF NOT EXISTS idx_wa_contacts_phone ON whatsapp_contacts(org_id, phone_number); 
 
 -- ═══════════════════════════════════════════════════════ 
 -- Triggers — تحديث updated_at تلقائياً 
 -- ═══════════════════════════════════════════════════════ 
 DO $$ BEGIN 
   CREATE TRIGGER update_wa_settings_modtime 
     BEFORE UPDATE ON whatsapp_settings 
     FOR EACH ROW EXECUTE FUNCTION update_modified_column(); 
 EXCEPTION WHEN duplicate_object THEN NULL; 
 END $$; 
 
 DO $$ BEGIN 
   CREATE TRIGGER update_wa_contacts_modtime 
     BEFORE UPDATE ON whatsapp_contacts 
     FOR EACH ROW EXECUTE FUNCTION update_modified_column(); 
 EXCEPTION WHEN duplicate_object THEN NULL; 
 END $$; 
 
 -- ═══════════════════════════════════════════════════════ 
 -- ✅ انتهى Migration 008 — يمكن تشغيله مراراً بأمان (idempotent) 
 -- ═══════════════════════════════════════════════════════
