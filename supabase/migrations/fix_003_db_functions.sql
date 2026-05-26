-- ═══════════════════════════════════════════════════════════════════════
-- Fix 003: Database Functions Repair — إصلاح دوال قاعدة البيانات
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- 0. تأكد أن audit_logs يقبل organization_id nullable (للسماح بالعمليات العامة أو حذف المنظمات)
ALTER TABLE public.audit_logs 
  ALTER COLUMN organization_id DROP NOT NULL;

-- 1. إصلاح دالة التدقيق لتشمل جدول المنظمات بشكل صحيح
CREATE OR REPLACE FUNCTION public.process_audit_log() 
RETURNS TRIGGER AS $$ 
DECLARE 
  _org_id UUID; 
  _user_id UUID; 
  _action TEXT; 
BEGIN 
  IF (TG_OP = 'INSERT') THEN _action := 'إنشاء'; 
  ELSIF (TG_OP = 'UPDATE') THEN _action := 'تعديل'; 
  ELSIF (TG_OP = 'DELETE') THEN _action := 'حذف'; 
  END IF; 

  -- تصحيح: التعامل مع جدول المنظمات بشكل خاص لأن العمود organization_id غير موجود فيه
  IF TG_TABLE_NAME = 'organizations' THEN
    _org_id := COALESCE(NEW.id, OLD.id);
  ELSE
    _org_id := COALESCE(NEW.organization_id, NEW.org_id, OLD.organization_id, OLD.org_id); 
  END IF;

  _user_id := auth.uid(); 

  -- إدراج في جدول التدقيق
  INSERT INTO public.audit_logs (
    organization_id, 
    user_id, 
    action, 
    entity_type, 
    entity_id, 
    details
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

-- 2. إصلاح دالة حساب إجمالي الفواتير لاستخدام base_amount
CREATE OR REPLACE FUNCTION public.auto_calc_invoice_total() 
RETURNS TRIGGER AS $$ 
BEGIN 
    -- تصحيح: استخدام base_amount بدلاً من amount (الاسم الحالي في الـ schema)
    IF NEW.total IS NULL AND NEW.base_amount IS NOT NULL THEN 
        NEW.total := NEW.base_amount + COALESCE(NEW.vat_amount, 0); 
    END IF; 
    RETURN NEW; 
END; 
$$ LANGUAGE plpgsql;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════
-- 🔍 قسم التحقق (Verification Query)
-- ═══════════════════════════════════════════════════════════════════════
/*
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name IN ('process_audit_log', 'auto_calc_invoice_total') 
AND routine_schema = 'public';
*/
