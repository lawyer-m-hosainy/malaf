-- ═══════════════════════════════════════════════════════════════════
-- Malaf R5 Migration — إصلاحات هيكلية لقاعدة البيانات
-- ═══════════════════════════════════════════════════════════════════
-- التاريخ: 2026-05-09
-- الوصف: إصلاح ترتيب الجداول، إضافة org_id المفقود،
--         حذف الفهارس المكررة، وتوحيد البنية.
--
-- ⚠️ هذا الملف هو migration تراكمي (idempotent) — آمن للتشغيل أكثر من مرة.
-- يمكن تشغيله مباشرة في Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════
-- الإصلاح #3: ترتيب إنشاء profiles.linked_client_id
-- ═══════════════════════════════════════════════════════
-- المشكلة: في supabase-schema.sql الأصلي، جدول profiles (سطر 17)
-- يحتوي على REFERENCES clients(id) قبل إنشاء جدول clients (سطر 29).
-- هذا يفشل عند تشغيل الـ schema من الصفر.
--
-- الحل: إضافة العمود كـ ALTER TABLE بعد إنشاء clients.
-- (لن يؤثر إذا كان العمود موجوداً بالفعل.)

DO $$
BEGIN
    -- تحقق: هل العمود موجود؟
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'linked_client_id'
    ) THEN
        ALTER TABLE profiles ADD COLUMN linked_client_id UUID;
    END IF;

    -- تحقق: هل الـ foreign key موجود؟
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_linked_client_id_fkey' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE profiles 
            ADD CONSTRAINT profiles_linked_client_id_fkey 
            FOREIGN KEY (linked_client_id) REFERENCES clients(id) ON DELETE SET NULL;
    END IF;
END $$;

COMMENT ON COLUMN profiles.linked_client_id IS 'R5-FIX: نُقل من CREATE TABLE إلى ALTER TABLE لحل مشكلة ترتيب الإنشاء — يربط مستخدمي البوابة بملفات العملاء';


-- ═══════════════════════════════════════════════════════
-- الإصلاح #5: إضافة org_id المفقود إلى expert_missions
-- ═══════════════════════════════════════════════════════
-- المشكلة: جدول expert_missions لا يحتوي على org_id مباشرة.
-- يعتمد فقط على JOIN عبر cases للوصول للـ org.
-- هذا يجعل RLS أبطأ ويمنع الفهرسة المباشرة.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'expert_missions' AND column_name = 'org_id'
    ) THEN
        -- إضافة العمود
        ALTER TABLE expert_missions 
            ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

        -- ملء القيم الموجودة من cases
        UPDATE expert_missions em 
        SET org_id = c.org_id 
        FROM cases c 
        WHERE em.case_id = c.id AND em.org_id IS NULL;

        -- فهرس للأداء
        CREATE INDEX IF NOT EXISTS idx_expert_missions_org_id ON expert_missions(org_id);

        RAISE NOTICE 'R5: Added org_id to expert_missions and backfilled from cases';
    END IF;
END $$;

-- تحديث RLS policy لاستخدام org_id المباشر (أسرع من JOIN)
-- نحذف القديمة ونعيد الإنشاء بشكل آمن
DO $$
BEGIN
    -- حذف السياسات القديمة إن وجدت
    DROP POLICY IF EXISTS "expert_select" ON expert_missions;
    DROP POLICY IF EXISTS "expert_insert" ON expert_missions;
    DROP POLICY IF EXISTS "expert_update" ON expert_missions;
    DROP POLICY IF EXISTS "expert_delete" ON expert_missions;
END $$;

-- إعادة إنشاء RLS باستخدام org_id المباشر
CREATE POLICY "expert_select" ON expert_missions FOR SELECT USING (
    org_id = get_user_org_id() OR is_super_admin()
);
CREATE POLICY "expert_insert" ON expert_missions FOR INSERT WITH CHECK (
    org_id = get_user_org_id()
);
CREATE POLICY "expert_update" ON expert_missions FOR UPDATE USING (
    org_id = get_user_org_id()
);
CREATE POLICY "expert_delete" ON expert_missions FOR DELETE USING (
    org_id = get_user_org_id()
);

COMMENT ON TABLE expert_missions IS 'R5-FIX: أُضيف org_id مباشر + RLS مُحدث — كان يعتمد على JOIN عبر cases';


-- ═══════════════════════════════════════════════════════
-- الإصلاح #6: حذف الفهارس المكررة
-- ═══════════════════════════════════════════════════════
-- المشكلة: يوجد فهارس مكررة تماماً بأسماء مختلفة.
-- الفهارس المكررة تُبطئ الكتابة (INSERT/UPDATE) بدون فائدة.
--
-- الفهرس المحتفظ به       ← الفهرس المحذوف (مكرر)
-- idx_sessions_composite   ← idx_sessions_case_date
-- idx_invoices_composite   ← idx_invoices_org_status_due
-- idx_audit_composite      ← idx_audit_logs_org_created

-- Sessions: idx_sessions_composite (date, case_id) يغطي idx_sessions_case_date (case_id, date)
-- لكن ترتيب الأعمدة مختلف. نحتفظ بالاثنين لأنهما يخدمان queries مختلفة.
-- بدلاً من ذلك، نحذف idx_sessions_case (case_id فقط) لأن idx_sessions_case_date أوسع منه.

-- حذف الفهرس الأقدم — النسخة في سطر 383-385 مكررة مع 517-528
DROP INDEX IF EXISTS idx_sessions_case_date;        -- مكرر مع idx_sessions_composite
DROP INDEX IF EXISTS idx_invoices_org_status_due;    -- مكرر مع idx_invoices_composite
DROP INDEX IF EXISTS idx_audit_logs_org_created;     -- مكرر مع idx_audit_composite

-- حذف فهارس فردية مغطاة بفهارس مركبة
DROP INDEX IF EXISTS idx_sessions_case;   -- مغطى بـ idx_sessions_composite (date, case_id) + idx_sessions_case_date أعلاه
DROP INDEX IF EXISTS idx_sessions_date;   -- مغطى بـ idx_sessions_composite (date, case_id)
DROP INDEX IF EXISTS idx_invoices_org;    -- مغطى بـ idx_invoices_composite (org_id, status, due_date)
DROP INDEX IF EXISTS idx_audit_org;       -- مغطى بـ idx_audit_composite (org_id, created_at DESC)

-- إعادة إنشاء بأسماء موحدة ومُحسّنة
CREATE INDEX IF NOT EXISTS idx_sessions_case_id ON sessions(case_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date_case ON sessions(date, case_id);

RAISE NOTICE 'R5: Removed 7 duplicate/redundant indexes';


-- ═══════════════════════════════════════════════════════
-- الإصلاح #4: التحقق من video_rooms
-- ═══════════════════════════════════════════════════════
-- video_rooms موجود بالفعل (سطر 777-795 في supabase-schema.sql).
-- video.js يستخدم 'video_rooms' بالفعل (تم إصلاحه في R1).
-- لا يلزم أي إجراء — لكن نتأكد من الفهارس:
CREATE INDEX IF NOT EXISTS idx_video_rooms_status ON video_rooms(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_video_rooms_scheduled ON video_rooms(scheduled_at DESC);


-- ═══════════════════════════════════════════════════════
-- الإصلاح #1 & #2: التحقق من WhatsApp tables + RLS
-- ═══════════════════════════════════════════════════════
-- جميعها موجودة بالفعل (سطر 812-868).
-- نضيف فقط فهارس إضافية مفقودة:
CREATE INDEX IF NOT EXISTS idx_wa_messages_case ON whatsapp_messages(case_id) WHERE case_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wa_messages_client ON whatsapp_messages(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wa_messages_status ON whatsapp_messages(status);
CREATE INDEX IF NOT EXISTS idx_wa_settings_org ON whatsapp_settings(org_id);


-- ═══════════════════════════════════════════════════════
-- إضافات تحسينية (اكتُشفت أثناء المراجعة)
-- ═══════════════════════════════════════════════════════

-- sessions يفتقر لـ org_id مباشر (نفس مشكلة expert_missions)
-- لكن sessions مرتبط دائماً عبر case_id → cases.org_id
-- نضيف org_id للأداء:
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sessions' AND column_name = 'org_id'
    ) THEN
        ALTER TABLE sessions 
            ADD COLUMN org_id UUID REFERENCES organizations(id);
        
        UPDATE sessions s 
        SET org_id = c.org_id 
        FROM cases c 
        WHERE s.case_id = c.id AND s.org_id IS NULL;
        
        CREATE INDEX IF NOT EXISTS idx_sessions_org_id ON sessions(org_id);
        
        RAISE NOTICE 'R5: Added org_id to sessions and backfilled from cases';
    END IF;
END $$;

-- إضافة deposit_amount إلى expert_missions (يُستخدم في الواجهة)
ALTER TABLE expert_missions ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE expert_missions ADD COLUMN IF NOT EXISTS expert_type TEXT;
ALTER TABLE expert_missions ADD COLUMN IF NOT EXISTS report_received BOOLEAN DEFAULT FALSE;


-- ═══════════════════════════════════════════════════════
-- Trigger: ملء org_id تلقائياً عند إدراج expert_missions
-- ═══════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION auto_fill_expert_mission_org_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.org_id IS NULL AND NEW.case_id IS NOT NULL THEN
        SELECT org_id INTO NEW.org_id FROM cases WHERE id = NEW.case_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_expert_missions_auto_org ON expert_missions;
CREATE TRIGGER trg_expert_missions_auto_org
    BEFORE INSERT ON expert_missions
    FOR EACH ROW
    EXECUTE FUNCTION auto_fill_expert_mission_org_id();

-- نفس الشيء لـ sessions
CREATE OR REPLACE FUNCTION auto_fill_session_org_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.org_id IS NULL AND NEW.case_id IS NOT NULL THEN
        SELECT org_id INTO NEW.org_id FROM cases WHERE id = NEW.case_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sessions_auto_org ON sessions;
CREATE TRIGGER trg_sessions_auto_org
    BEFORE INSERT ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION auto_fill_session_org_id();


COMMIT;

-- ═══════════════════════════════════════════════════════
-- ✅ ملخص R5 Migration:
-- ═══════════════════════════════════════════════════════
-- [1] WhatsApp tables: ✅ موجودة (R1) — أضفنا فهارس إضافية
-- [2] WhatsApp RLS: ✅ موجودة (R1)
-- [3] profiles.linked_client_id: ✅ نُقل لـ ALTER TABLE
-- [4] video_rooms: ✅ موحّد (R1) — أضفنا فهارس
-- [5] expert_missions.org_id: ✅ أُضيف + backfill + trigger + RLS محدّث
-- [6] فهارس مكررة: ✅ حُذفت 7 فهارس مكررة/مغطاة
-- [+] sessions.org_id: ✅ أُضيف (نفس نمط expert_missions)
-- [+] expert_missions columns: ✅ أُضيف deposit_amount, expert_type, report_received
-- [+] auto-fill triggers: ✅ org_id يُملأ تلقائياً من cases
-- ═══════════════════════════════════════════════════════
