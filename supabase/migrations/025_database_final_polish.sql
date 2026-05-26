-- ═══════════════════════════════════════════════════════════════════ 
 -- Migration 025: Database Final Polish — منصة مَلَف (Malaf) 
 -- ═══════════════════════════════════════════════════════════════════ 
 -- التاريخ: 2026-05-25 
 -- الوصف: سد الفجوات التقنية (التدقيق الآلي، فرض الحصص، توحيد الحذف الناعم) 
 
 BEGIN; 
 
 -- ╔═══════════════════════════════════════════════════════════════╗ 
 -- ║  0. ضمان وجود عمود org_id للمزامنة (Sync Columns)             ║ 
 -- ╚═══════════════════════════════════════════════════════════════ ╝ 
  -- نضمن وجود العمود في كافة الجداول الأساسية لتجنب أخطاء الاستعلام
  ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
  ALTER TABLE public.trust_transactions ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
  ALTER TABLE public.payment_plans ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
  ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS case_number TEXT; -- إضافة حقل رقم القضية المفقود
  ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ; -- إضافة تاريخ الإغلاق للمزامنة مع القيود أدناه

  -- مزامنة البيانات لو كانت موجودة في organization_id
  UPDATE public.clients SET org_id = organization_id WHERE org_id IS NULL AND organization_id IS NOT NULL;
  UPDATE public.trust_transactions SET org_id = organization_id WHERE org_id IS NULL AND organization_id IS NOT NULL;
  UPDATE public.payment_plans SET org_id = organization_id WHERE org_id IS NULL AND organization_id IS NOT NULL;
  
  -- محاولة ملء case_number من الأرقام المتاحة لو كان فارغاً
  UPDATE public.cases SET case_number = first_instance_number WHERE case_number IS NULL AND first_instance_number IS NOT NULL;

 -- ╔═══════════════════════════════════════════════════════════════╗ 
 -- ║  1. نظام التدقيق التلقائي (Automated Audit Triggers)         ║ 
 -- ╚═══════════════════════════════════════════════════════════════╝ 
 
 -- دالة معالجة سجلات التدقيق 
 CREATE OR REPLACE FUNCTION public.process_audit_log() 
 RETURNS TRIGGER AS $$ 
 DECLARE 
   _org_id UUID; 
   _user_id UUID; 
   _action TEXT; 
 BEGIN 
   -- تحديد نوع العملية 
   IF (TG_OP = 'INSERT') THEN _action := 'إنشاء'; 
   ELSIF (TG_OP = 'UPDATE') THEN _action := 'تعديل'; 
   ELSIF (TG_OP = 'DELETE') THEN _action := 'حذف'; 
   END IF; 
 
   -- محاولة الحصول على المعرفات من السجل الجديد أو القديم 
   IF TG_TABLE_NAME = 'organizations' THEN
     _org_id := COALESCE(NEW.id, OLD.id);
   ELSE
     _org_id := COALESCE(NEW.organization_id, NEW.org_id, OLD.organization_id, OLD.org_id); 
   END IF;
   _user_id := auth.uid(); 
 
   -- إدراج في جدول التدقيق 
   INSERT INTO public.audit_logs ( 
     organization_id, user_id, action, entity_type, entity_id, details 
   ) VALUES ( 
     _org_id, 
     _user_id, 
     _action, 
     TG_TABLE_NAME, 
     COALESCE(NEW.id, OLD.id), 
     jsonb_build_object( 
       'old_data', CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) ELSE NULL END, 
       'new_data', CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END 
     ) 
   ); 
 
   IF (TG_OP = 'DELETE') THEN RETURN OLD; ELSE RETURN NEW; END IF; 
 END; 
 $$ LANGUAGE plpgsql SECURITY DEFINER; 
 
 -- ربط التدقيق بالجداول الحساسة 
 DO $$ 
 DECLARE 
   t TEXT; 
 BEGIN 
   FOR t IN SELECT unnest(ARRAY['cases', 'clients', 'invoices', 'trust_transactions', 'payment_plans']) 
   LOOP 
     EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_%I ON public.%I', t, t); 
     EXECUTE format('CREATE TRIGGER trg_audit_%I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.process_audit_log()', t, t); 
   END LOOP; 
 END $$; 
 
 
 -- ╔═══════════════════════════════════════════════════════════════╗ 
 -- ║  2. فرض حصص الواتساب (WhatsApp Quota Enforcement)           ║ 
 -- ╚═══════════════════════════════════════════════════════════════╝ 
 
 CREATE OR REPLACE FUNCTION check_whatsapp_quota() 
 RETURNS TRIGGER AS $$ 
 DECLARE 
   current_month_count INTEGER; 
   max_allowed INTEGER; 
 BEGIN 
   -- الحصول على الحد الأقصى من الباقة 
   max_allowed := get_org_plan_limit(NEW.org_id, 'whatsapp_messages_per_month'); 
   
   -- -1 يعني بلا حدود 
   IF max_allowed = -1 THEN RETURN NEW; END IF; 
 
   -- عد الرسائل المرسلة في الشهر الحالي 
   SELECT COUNT(*)::INTEGER INTO current_month_count 
   FROM whatsapp_messages 
   WHERE org_id = NEW.org_id 
     AND direction = 'outbound' 
     AND created_at >= date_trunc('month', now()); 
 
   IF current_month_count >= max_allowed THEN 
     RAISE EXCEPTION 'لقد تجاوزت الحد الشهري لرسائل الواتساب (%). يرجى ترقية الباقة.', max_allowed; 
   END IF; 
 
   RETURN NEW; 
 END; 
 $$ LANGUAGE plpgsql SECURITY DEFINER; 
 
 DROP TRIGGER IF EXISTS trg_enforce_wa_quota ON whatsapp_messages; 
 CREATE TRIGGER trg_enforce_wa_quota 
   BEFORE INSERT ON whatsapp_messages 
   FOR EACH ROW 
   WHEN (NEW.direction = 'outbound') 
   EXECUTE FUNCTION check_whatsapp_quota(); 
 
 
 -- ╔═══════════════════════════════════════════════════════════════╗ 
 -- ║  3. توحيد الحذف الناعم (Soft Delete Consistency)            ║ 
 -- ╚═══════════════════════════════════════════════════════════════╝ 
 
 DO $$ 
 BEGIN 
   -- إضافة عمود deleted_at للجداول التي تفتقر إليه 
   ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ; 
   ALTER TABLE public.payment_plans ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ; 
   ALTER TABLE public.expert_missions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ; 
   ALTER TABLE public.enforcement_cases ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ; 
   ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ; 
 END $$; 
 
 -- تحديث فهارس الحذف الناعم لتحسين الأداء 
 CREATE INDEX IF NOT EXISTS idx_tasks_deleted_at ON tasks(deleted_at) WHERE deleted_at IS NULL; 
 CREATE INDEX IF NOT EXISTS idx_docs_deleted_at ON documents(deleted_at) WHERE deleted_at IS NULL; 
 
 
 -- ╔═══════════════════════════════════════════════════════════════╗ 
 -- ║  4. قيود السلامة المرجعية (Data Integrity Constraints)      ║ 
 -- ╚═══════════════════════════════════════════════════════════════╝ 
 
 -- قيود المبالغ المالية (يجب أن تكون موجبة) 
 DO $$ BEGIN 
   ALTER TABLE invoices ADD CONSTRAINT check_invoice_amount_positive CHECK (base_amount >= 0); 
   ALTER TABLE expenses ADD CONSTRAINT check_expense_amount_positive CHECK (amount >= 0); 
 EXCEPTION WHEN OTHERS THEN NULL; END $$; 
 
 -- قيود التواريخ (تاريخ الإغلاق لا يسبق تاريخ الفتح) 
 DO $$ BEGIN 
   ALTER TABLE cases ADD CONSTRAINT check_case_dates CHECK (closed_at IS NULL OR closed_at >= created_at); 
 EXCEPTION WHEN OTHERS THEN NULL; END $$; 
 
 
 -- ╔═══════════════════════════════════════════════════════════════╗ 
 -- ║  5. تحسينات الأداء النهائية (Final Performance Polish)        ║ 
 -- ╚═══════════════════════════════════════════════════════════════╝ 
 
 -- فهرس البحث عن الموكلين بالهاتف أو الرقم القومي 
 CREATE INDEX IF NOT EXISTS idx_clients_search ON clients(org_id, phone, national_id_encrypted); 
 
 -- فهرس للبحث عن القضايا برقم القضية 
 CREATE INDEX IF NOT EXISTS idx_cases_number ON cases(org_id, case_number); 
 
 
 -- ╔═══════════════════════════════════════════════════════════════╗ 
 -- ║  6. تأمين الدالات (Security Polish)                           ║ 
 -- ╚═══════════════════════════════════════════════════════════════╝ 
 
 -- التأكد من أن جميع الدالات تستخدم SECURITY DEFINER فقط عند الضرورة القصوى 
 REVOKE ALL ON FUNCTION public.get_user_org_id() FROM public; 
 GRANT EXECUTE ON FUNCTION public.get_user_org_id() TO authenticated, service_role; 
 
 COMMIT; 
 
 -- ═══════════════════════════════════════════════════════ 
 -- ✅ تم الانتهاء من الصقل النهائي لقاعدة البيانات 
 -- ═══════════════════════════════════════════════════════
