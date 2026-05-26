-- ═══════════════════════════════════════════════════════════════════ 
 -- مَلَف: إضافة الجداول الأساسية الناقصة (سجلات الوقت والفواتير الإلكترونية) 
 -- ═══════════════════════════════════════════════════════════════════ 
 
 -- 1. جدول سجلات الوقت (time_entries) 
 CREATE TABLE IF NOT EXISTS public.time_entries ( 
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
     created_at TIMESTAMPTZ DEFAULT NOW() 
 ); 
 
 -- التأكد من وجود الأعمدة المطلوبة (في حال كان الجدول موجوداً مسبقاً بنية مختلفة) 
 ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE; 
 ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE; 
 ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE; 
 ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS lawyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL; 
 ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS description TEXT; 
 ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS duration_minutes INTEGER; 
 ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE; 
 ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS billable BOOLEAN DEFAULT TRUE; 
 ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS is_billed BOOLEAN DEFAULT FALSE; 
 ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ; 
 
 -- 2. جدول الفواتير الإلكترونية (eta_invoices) 
 CREATE TABLE IF NOT EXISTS public.eta_invoices ( 
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
     created_at TIMESTAMPTZ DEFAULT NOW() 
 ); 
 
 ALTER TABLE public.eta_invoices ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE; 
 ALTER TABLE public.eta_invoices ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE; 
 ALTER TABLE public.eta_invoices ADD COLUMN IF NOT EXISTS client_name TEXT; 
 ALTER TABLE public.eta_invoices ADD COLUMN IF NOT EXISTS client_tax_id TEXT; 
 ALTER TABLE public.eta_invoices ADD COLUMN IF NOT EXISTS issuer_tax_reg TEXT; 
 ALTER TABLE public.eta_invoices ADD COLUMN IF NOT EXISTS eta_code TEXT DEFAULT '8211'; 
 ALTER TABLE public.eta_invoices ADD COLUMN IF NOT EXISTS amount DECIMAL(12,2); 
 ALTER TABLE public.eta_invoices ADD COLUMN IF NOT EXISTS vat_amount DECIMAL(12,2); 
 ALTER TABLE public.eta_invoices ADD COLUMN IF NOT EXISTS schedule_tax DECIMAL(12,2) DEFAULT 0; 
 ALTER TABLE public.eta_invoices ADD COLUMN IF NOT EXISTS stamp_duty DECIMAL(12,2) DEFAULT 20; 
 ALTER TABLE public.eta_invoices ADD COLUMN IF NOT EXISTS total DECIMAL(12,2); 
 ALTER TABLE public.eta_invoices ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'مسودة'; 
 ALTER TABLE public.eta_invoices ADD COLUMN IF NOT EXISTS uuid TEXT; 
 ALTER TABLE public.eta_invoices ADD COLUMN IF NOT EXISTS description TEXT; 
 ALTER TABLE public.eta_invoices ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE; 
 ALTER TABLE public.eta_invoices ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(); 
 
 -- 3. جدول المقبوضات (receivables) 
 CREATE TABLE IF NOT EXISTS public.receivables ( 
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
     created_at TIMESTAMPTZ DEFAULT NOW() 
 ); 
 
 ALTER TABLE public.receivables ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE; 
 ALTER TABLE public.receivables ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE; 
 ALTER TABLE public.receivables ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE; 
 ALTER TABLE public.receivables ADD COLUMN IF NOT EXISTS client_name TEXT; 
 ALTER TABLE public.receivables ADD COLUMN IF NOT EXISTS case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE; 
 ALTER TABLE public.receivables ADD COLUMN IF NOT EXISTS total_amount DECIMAL(12,2); 
 ALTER TABLE public.receivables ADD COLUMN IF NOT EXISTS collected_amount DECIMAL(12,2) DEFAULT 0; 
 ALTER TABLE public.receivables ADD COLUMN IF NOT EXISTS outstanding_amount DECIMAL(12,2); 
 ALTER TABLE public.receivables ADD COLUMN IF NOT EXISTS due_date DATE; 
 ALTER TABLE public.receivables ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'مفتوح'; 
 ALTER TABLE public.receivables ADD COLUMN IF NOT EXISTS is_reconciled BOOLEAN DEFAULT FALSE; 
 ALTER TABLE public.receivables ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ; 
 
 -- 4. جدول إجراءات التحصيل (collection_actions) 
 CREATE TABLE IF NOT EXISTS public.collection_actions ( 
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
     created_at TIMESTAMPTZ DEFAULT NOW() 
 ); 
 
 ALTER TABLE public.collection_actions ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE; 
 ALTER TABLE public.collection_actions ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE; 
 ALTER TABLE public.collection_actions ADD COLUMN IF NOT EXISTS receivable_id UUID REFERENCES public.receivables(id) ON DELETE CASCADE; 
 ALTER TABLE public.collection_actions ADD COLUMN IF NOT EXISTS type TEXT; 
 ALTER TABLE public.collection_actions ADD COLUMN IF NOT EXISTS notes TEXT; 
 ALTER TABLE public.collection_actions ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id); 
 
 -- تفعيل RLS 
 ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY; 
 ALTER TABLE public.eta_invoices ENABLE ROW LEVEL SECURITY; 
 ALTER TABLE public.receivables ENABLE ROW LEVEL SECURITY; 
 ALTER TABLE public.collection_actions ENABLE ROW LEVEL SECURITY; 
 
 -- سياسات الوصول (بناءً على organization_id و org_id لضمان التوافق) 
 DO $$ 
 BEGIN 
     IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'time_entries' AND policyname = 'tenant_isolation_time_entries') THEN 
         CREATE POLICY "tenant_isolation_time_entries" ON public.time_entries 
             FOR ALL USING (organization_id = get_user_org_id() OR org_id = get_user_org_id()); 
     END IF; 
 
     IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'eta_invoices' AND policyname = 'tenant_isolation_eta_invoices') THEN 
         CREATE POLICY "tenant_isolation_eta_invoices" ON public.eta_invoices 
             FOR ALL USING (organization_id = get_user_org_id() OR org_id = get_user_org_id()); 
     END IF; 
 
     IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'receivables' AND policyname = 'tenant_isolation_receivables') THEN 
         CREATE POLICY "tenant_isolation_receivables" ON public.receivables 
             FOR ALL USING (organization_id = get_user_org_id() OR org_id = get_user_org_id()); 
     END IF; 
 
     IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'collection_actions' AND policyname = 'tenant_isolation_collection_actions') THEN 
         CREATE POLICY "tenant_isolation_collection_actions" ON public.collection_actions 
             FOR ALL USING (organization_id = get_user_org_id() OR org_id = get_user_org_id()); 
     END IF; 
 END $$; 
 
 -- الفهارس 
 CREATE INDEX IF NOT EXISTS idx_time_entries_org ON public.time_entries(organization_id); 
 CREATE INDEX IF NOT EXISTS idx_eta_invoices_org ON public.eta_invoices(organization_id); 
 CREATE INDEX IF NOT EXISTS idx_receivables_org ON public.receivables(organization_id); 
 CREATE INDEX IF NOT EXISTS idx_collection_actions_org ON public.collection_actions(organization_id);
