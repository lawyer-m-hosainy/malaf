-- ═══════════════════════════════════════════════════════════════════
-- Migration 014: Storage Bucket Policies for Documents
-- ═══════════════════════════════════════════════════════════════════
-- التاريخ: 2026-05-12
-- الوصف: إضافة سياسات عزل Tenants لملفات الـ Storage (documents)

BEGIN;

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- السماح بالرفع فقط للمجلد الخاص بالمنظمة (org_id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'org_isolation_insert'
    ) THEN
        CREATE POLICY "org_isolation_insert" ON storage.objects
            FOR INSERT WITH CHECK (
            bucket_id = 'documents' AND
            (storage.foldername(name))[1] = get_user_org_id()::text
            );
    END IF;
END $$;

-- السماح بالقراءة فقط للمجلد الخاص بالمنظمة (org_id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'org_isolation_select'
    ) THEN
        CREATE POLICY "org_isolation_select" ON storage.objects
            FOR SELECT USING (
            bucket_id = 'documents' AND
            (storage.foldername(name))[1] = get_user_org_id()::text
            );
    END IF;
END $$;

-- السماح بالحذف فقط للمجلد الخاص بالمنظمة (org_id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'org_isolation_delete'
    ) THEN
        CREATE POLICY "org_isolation_delete" ON storage.objects
            FOR DELETE USING (
            bucket_id = 'documents' AND
            (storage.foldername(name))[1] = get_user_org_id()::text
            );
    END IF;
END $$;

COMMIT;
