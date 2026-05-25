-- ═══════════════════════════════════════════════════════════════════ 
 -- Migration 013: R1 Completeness Final — الجداول والأعمدة المتبقية 
 -- ═══════════════════════════════════════════════════════════════════ 
 -- التاريخ: 2026-05-12 
 -- الوصف: إضافة الجداول والأعمدة التي يستدعيها الكود لكنها غير موجودة. 
 -- 
 -- ⚠️ هذا الملف idempotent — آمن للتشغيل أكثر من مرة. 
 -- 
 -- الجداول الموجودة بالفعل في migrations سابقة: 
 --   ✅ eta_invoices       → 009_r1_completeness.sql 
 --   ✅ conflict_checks    → 009_r1_completeness.sql 
 --   ✅ wiki_articles      → 009_r1_completeness.sql 
 --   ✅ collection_actions → 011_remaining_tables.sql 
 --   ✅ field_checkins     → 011_remaining_tables.sql 
 -- 
 -- الناقص (هذا الملف): 
 --   🔴 known_locations    → commandParser.js:397 
 --   🔴 whatsapp_scheduled → commandParser.js:295 + notificationScheduler.js:47 
 --   🔴 cases.plaintiff    → legalDataService.ts + Dashboard.tsx 
 --   🔴 cases.defendant    → legalDataService.ts + Dashboard.tsx 
 --   🔴 invoices.total     → legalDataService.ts:211 
 --   🔴 invoices.date      → legalDataService.ts:211 
 -- ═══════════════════════════════════════════════════════════════════ 
 
 BEGIN; 
 
 -- ═══════════════════════════════════════════════════════ 
 -- 1. جدول known_locations (المواقع المعروفة للمحاكم والمكاتب) 
 -- ═══════════════════════════════════════════════════════ 
 -- يُستخدم في commandParser.js:397-401 لمطابقة "وصلت [مكان]" 
 -- مع إحداثيات GPS المعروفة. 
 
 CREATE TABLE IF NOT EXISTS known_locations ( 
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), 
     org_id UUID REFERENCES organizations(id) ON DELETE CASCADE, 
     name TEXT NOT NULL,                           -- اسم المكان (مثال: "محكمة القاهرة الجديدة") 
     type TEXT DEFAULT 'محكمة',                    -- محكمة / شهر عقاري / مكتب / أخرى 
     latitude DECIMAL(10,8), 
     longitude DECIMAL(11,8), 
     address TEXT, 
     radius_meters INTEGER DEFAULT 200,            -- نطاق المطابقة بالأمتار 
     is_active BOOLEAN DEFAULT TRUE, 
     created_at TIMESTAMPTZ DEFAULT NOW(), 
     updated_at TIMESTAMPTZ DEFAULT NOW() 
 ); 
 
 ALTER TABLE known_locations ENABLE ROW LEVEL SECURITY; 
 
 DO $$ 
 BEGIN 
     IF NOT EXISTS ( 
         SELECT 1 FROM pg_policies WHERE tablename = 'known_locations' AND policyname = 'tenant_isolation_known_locations' 
     ) THEN 
         CREATE POLICY "tenant_isolation_known_locations" ON known_locations 
             FOR ALL USING (org_id::text = get_user_org_id()::text); 
     END IF; 
 END $$; 
 
 CREATE INDEX IF NOT EXISTS idx_known_locations_org_id ON known_locations(org_id); 
 CREATE INDEX IF NOT EXISTS idx_known_locations_active ON known_locations(org_id, is_active) WHERE is_active = TRUE; 
 
 -- Trigger: تحديث updated_at تلقائياً 
 DO $$ 
 BEGIN 
     IF NOT EXISTS ( 
         SELECT 1 FROM pg_trigger WHERE tgname = 'update_known_locations_modtime' 
     ) THEN 
         CREATE TRIGGER update_known_locations_modtime 
             BEFORE UPDATE ON known_locations 
             FOR EACH ROW EXECUTE FUNCTION update_modified_column(); 
     END IF; 
 END $$; 
 
 
 -- ═══════════════════════════════════════════════════════ 
 -- 2. جدول whatsapp_scheduled (الرسائل المجدولة) 
 -- ═══════════════════════════════════════════════════════ 
 -- يُستخدم في: 
 --   commandParser.js:295 — أمر "ذكرني [نص] [تاريخ]" 
 --   notificationScheduler.js:47 — معالجة الرسائل المجدولة 
 
 CREATE TABLE IF NOT EXISTS whatsapp_scheduled ( 
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), 
     org_id UUID REFERENCES organizations(id) ON DELETE CASCADE, 
     phone TEXT NOT NULL,                          -- رقم الهاتف المستلم 
     message TEXT NOT NULL,                        -- نص الرسالة 
     scheduled_at TIMESTAMPTZ NOT NULL,            -- موعد الإرسال 
     status TEXT DEFAULT 'pending',                -- pending / sent / failed / cancelled 
     type TEXT DEFAULT 'reminder',                 -- reminder / notification / follow_up 
     related_case_id TEXT,                         -- ربط اختياري بقضية 
     related_client_id TEXT,                       -- ربط اختياري بموكل 
     error_message TEXT,                           -- رسالة الخطأ عند الفشل 
     sent_at TIMESTAMPTZ,                          -- وقت الإرسال الفعلي 
     retry_count INTEGER DEFAULT 0, 
     max_retries INTEGER DEFAULT 3, 
     created_by TEXT,                              -- من أنشأ التذكير 
     created_at TIMESTAMPTZ DEFAULT NOW(), 
     updated_at TIMESTAMPTZ DEFAULT NOW() 
 ); 
 
 ALTER TABLE whatsapp_scheduled ENABLE ROW LEVEL SECURITY; 
 
 DO $$ 
 BEGIN 
     IF NOT EXISTS ( 
         SELECT 1 FROM pg_policies WHERE tablename = 'whatsapp_scheduled' AND policyname = 'tenant_isolation_whatsapp_scheduled' 
     ) THEN 
         CREATE POLICY "tenant_isolation_whatsapp_scheduled" ON whatsapp_scheduled 
             FOR ALL USING (org_id::text = get_user_org_id()::text); 
     END IF; 
 END $$; 
 
 CREATE INDEX IF NOT EXISTS idx_whatsapp_scheduled_org_id ON whatsapp_scheduled(org_id); 
 CREATE INDEX IF NOT EXISTS idx_whatsapp_scheduled_pending ON whatsapp_scheduled(scheduled_at, status) 
     WHERE status = 'pending'; 
 CREATE INDEX IF NOT EXISTS idx_whatsapp_scheduled_phone ON whatsapp_scheduled(org_id, phone); 
 
 DO $$ 
 BEGIN 
     IF NOT EXISTS ( 
         SELECT 1 FROM pg_trigger WHERE tgname = 'update_whatsapp_scheduled_modtime' 
     ) THEN 
         CREATE TRIGGER update_whatsapp_scheduled_modtime 
             BEFORE UPDATE ON whatsapp_scheduled 
             FOR EACH ROW EXECUTE FUNCTION update_modified_column(); 
     END IF; 
 END $$; 
 
 
 -- ═══════════════════════════════════════════════════════ 
 -- 3. أعمدة ناقصة في cases 
 -- ═══════════════════════════════════════════════════════ 
 -- يُستخدم في: 
 --   Dashboard.tsx:306 — عرض c.plaintiff 
 --   Dashboard.tsx:132 — selectedCase?.defendant 
 --   legalDataService.ts — استعلامات مباشرة 
 
 ALTER TABLE cases ADD COLUMN IF NOT EXISTS plaintiff TEXT; 
 ALTER TABLE cases ADD COLUMN IF NOT EXISTS defendant TEXT; 
 ALTER TABLE cases ADD COLUMN IF NOT EXISTS client_role TEXT DEFAULT 'مدعي'; 
 
 COMMENT ON COLUMN cases.plaintiff IS 'R1-FIX: اسم المدعي — يُستخدم في Dashboard والصياغة الذكية'; 
 COMMENT ON COLUMN cases.defendant IS 'R1-FIX: اسم المدعى عليه — يُستخدم في Dashboard والصياغة الذكية'; 
 COMMENT ON COLUMN cases.client_role IS 'R1-FIX: صفة الموكل (مدعي/مدعى عليه) — يُستخدم في القوالب القانونية'; 
 
 
 -- ═══════════════════════════════════════════════════════ 
 -- 4. أعمدة ناقصة في invoices 
 -- ═══════════════════════════════════════════════════════ 
 -- يُستخدم في legalDataService.ts:211 
 
 ALTER TABLE invoices ADD COLUMN IF NOT EXISTS total DECIMAL(12,2); 
 ALTER TABLE invoices ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE; 
 
 COMMENT ON COLUMN invoices.total IS 'R1-FIX: إجمالي الفاتورة — يُستخدم في legalDataService والتقارير المالية'; 
 COMMENT ON COLUMN invoices.date IS 'R1-FIX: تاريخ الفاتورة — يُستخدم في legalDataService والتقارير المالية'; 
 
 -- Trigger: حساب total تلقائياً عند عدم تحديده 
CREATE OR REPLACE FUNCTION auto_calc_invoice_total() 
RETURNS TRIGGER AS $$ 
BEGIN 
    IF NEW.total IS NULL AND NEW.base_amount IS NOT NULL THEN 
        NEW.total := NEW.base_amount + COALESCE(NEW.vat_amount, 0); 
    END IF; 
    RETURN NEW; 
END; 
$$ LANGUAGE plpgsql; 
 
 DROP TRIGGER IF EXISTS trg_invoices_auto_total ON invoices; 
 CREATE TRIGGER trg_invoices_auto_total 
     BEFORE INSERT OR UPDATE ON invoices 
     FOR EACH ROW 
     EXECUTE FUNCTION auto_calc_invoice_total(); 
 
 
 -- ═══════════════════════════════════════════════════════ 
 -- 5. التحقق من sessions.org_id (migration 010 + R5) 
 -- ═══════════════════════════════════════════════════════ 
 -- نضمن وجود العمود أولاً قبل الفهرس لتفادي أخطاء (Column does not exist) 
 ALTER TABLE sessions ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE; 
 CREATE INDEX IF NOT EXISTS idx_sessions_org_id ON sessions(org_id); 
 
 
 -- ═══════════════════════════════════════════════════════ 
 -- 6. فهارس أداء إضافية 
 -- ═══════════════════════════════════════════════════════ 
 
 -- نضمن وجود org_id لتفادي أي أخطاء Column does not exist إذا كان هناك أي نقص في الـ schema 
 ALTER TABLE cases ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE; 
 ALTER TABLE invoices ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE; 
 
 -- فهرس للبحث بالاسم في cases 
 CREATE INDEX IF NOT EXISTS idx_cases_plaintiff ON cases(org_id, plaintiff) WHERE plaintiff IS NOT NULL; 
 CREATE INDEX IF NOT EXISTS idx_cases_defendant ON cases(org_id, defendant) WHERE defendant IS NOT NULL; 
 
 -- فهرس للفواتير بالتاريخ 
 CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(org_id, date DESC) WHERE date IS NOT NULL; 
 
 
 COMMIT; 
 
 -- ═══════════════════════════════════════════════════════ 
 -- ✅ ملخص Migration 013: 
 -- ═══════════════════════════════════════════════════════ 
 -- [1] known_locations:       ✅ جدول جديد + RLS + فهارس + trigger 
 -- [2] whatsapp_scheduled:    ✅ جدول جديد + RLS + فهارس + trigger 
 -- [3] cases.plaintiff:       ✅ عمود جديد 
 -- [4] cases.defendant:       ✅ عمود جديد 
 -- [5] cases.client_role:     ✅ عمود جديد 
 -- [6] invoices.total:        ✅ عمود جديد + auto-calc trigger 
 -- [7] invoices.date:         ✅ عمود جديد 
 -- [8] sessions.org_id index: ✅ تأكيد 
 -- [9] فهارس أداء إضافية:    ✅ plaintiff, defendant, invoices.date 
 -- ═══════════════════════════════════════════════════════
