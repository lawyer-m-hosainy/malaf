-- Migration: 031_fix_security_and_performance.sql

-- 1. إصلاح أمان Audit Logs (Append-Only)
-- إسقاط سياسات التحديث والحذف لضمان عدم التعديل
DROP POLICY IF EXISTS "audit_logs_update" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_delete" ON public.audit_logs;

-- إضافة عمود device_fingerprint (إذا لم يكن موجوداً)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='device_fingerprint') THEN
        ALTER TABLE public.audit_logs ADD COLUMN device_fingerprint TEXT;
    END IF;
END $$;

-- 2. دعم Multi-tenancy للإشعارات
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='notification_logs') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notification_logs' AND column_name='org_id') THEN
            ALTER TABLE public.notification_logs ADD COLUMN org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
            CREATE INDEX IF NOT EXISTS idx_notifications_org_id ON public.notification_logs(org_id);
        END IF;
    END IF;
END $$;

-- 3. تحسين أداء لوحة القيادة (Dashboard) (إنشاء فهارس)
CREATE INDEX IF NOT EXISTS idx_cases_org_created_at ON public.cases(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_org_created_at ON public.invoices(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_created_at ON public.audit_logs(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_org_created_at ON public.tasks(org_id, created_at DESC);

-- 4. تفعيل الإشعارات الفورية (Realtime)
-- إنشاء الـ publication إذا لم يكن موجوداً
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime FOR TABLE public.cases, public.tasks, public.invoices;
    ELSE
        -- محاولة إضافة الجداول، إذا كانت موجودة سيتم تخطيها
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.cases, public.tasks, public.invoices;
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END IF;
END $$;

-- تحديد REPLICA IDENTITY لضمان استلام البيانات كاملة عند التحديث والحذف
ALTER TABLE public.cases REPLICA IDENTITY FULL;
ALTER TABLE public.tasks REPLICA IDENTITY FULL;
ALTER TABLE public.invoices REPLICA IDENTITY FULL;
