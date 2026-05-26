-- ═══════════════════════════════════════════════════════════════════ 
 -- Migration 005: Audit Logs System 
 -- ═══════════════════════════════════════════════════════════════════ 
 -- التاريخ: 2026-05-25 
 -- الوصف: إنشاء نظام سجلات التدقيق لتتبع العمليات الهامة في المنصة 
 
 BEGIN; 
 
 -- 1. إنشاء جدول سجلات التدقيق (إذا لم يكن موجوداً) 
 CREATE TABLE IF NOT EXISTS public.audit_logs ( 
   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), 
   organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE, 
   user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, 
   action TEXT NOT NULL,                           -- نوع الإجراء (إنشاء، تعديل، حذف، تسجيل دخول) 
   entity_type TEXT,                               -- نوع الكيان (قضية، موكل، فاتورة) 
   entity_id UUID,                                 -- معرف الكيان المتأثر 
   details JSONB,                                  -- تفاصيل إضافية عن التغيير (قبل/بعد) 
   created_at TIMESTAMPTZ DEFAULT NOW() 
 ); 
 
 -- 2. تفعيل سياسات الأمان للجدول (RLS) 
 ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY; 
 
 -- حذف السياسات لو كانت موجودة لتجنب الخطأ 
 DO $$ BEGIN 
   DROP POLICY IF EXISTS "audit_select" ON public.audit_logs; 
   DROP POLICY IF EXISTS "audit_insert" ON public.audit_logs; 
 EXCEPTION WHEN OTHERS THEN NULL; 
 END $$; 
 
 CREATE POLICY "audit_select" ON public.audit_logs 
 FOR SELECT USING (organization_id = get_user_org_id() OR is_super_admin()); 
 
 CREATE POLICY "audit_insert" ON public.audit_logs 
 FOR INSERT WITH CHECK (organization_id = get_user_org_id()); 
 
 -- 3. إضافة فهارس الأداء 
 CREATE INDEX IF NOT EXISTS idx_audit_logs_org_created 
 ON public.audit_logs (organization_id, created_at DESC); 
 
 CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs (entity_type, entity_id); 
 
 COMMENT ON TABLE public.audit_logs IS 'سجل العمليات والتدقيق لجميع مكاتب المنصة'; 
 
 COMMIT;
