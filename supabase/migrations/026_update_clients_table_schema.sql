-- ═══════════════════════════════════════════════════════════════════
-- تحديث بنية جدول clients لتناسب الكود الحديث
-- يُحل مشكلة "حدث خطأ أثناء حفظ البيانات" عند إضافة موكل جديد
-- ═══════════════════════════════════════════════════════════════════

-- 1. إضافة الأعمدة المفقودة أو التأكد من وجودها
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS national_id_encrypted TEXT,
ADD COLUMN IF NOT EXISTS commercial_registration_encrypted TEXT,
ADD COLUMN IF NOT EXISTS vat_number TEXT,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 2. نسخ البيانات من الأعمدة القديمة إلى الجديدة (للحفظ البيانات الموجودة)
UPDATE public.clients 
SET 
  organization_id = org_id,
  national_id_encrypted = national_id,
  commercial_registration_encrypted = company_reg_number,
  vat_number = tax_id
WHERE organization_id IS NULL;

-- 3. جعل created_by قابلًا للقيمة NULL (لأن الكود لا يضعه حاليًا)
ALTER TABLE public.clients ALTER COLUMN created_by DROP NOT NULL;
