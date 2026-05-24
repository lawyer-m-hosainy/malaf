-- ═══════════════════════════════════════════════════════════════════
-- مَلَف: ربط سجل الوقت بالفاتورة الإلكترونية
-- ═══════════════════════════════════════════════════════════════════

-- 1) إضافة عمود time_entry_id إلى جدول الفواتير (invoices) وجدول (eta_invoices)
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS time_entry_id UUID REFERENCES public.time_entries(id) ON DELETE SET NULL;

ALTER TABLE public.eta_invoices 
ADD COLUMN IF NOT EXISTS time_entry_id UUID REFERENCES public.time_entries(id) ON DELETE SET NULL;

-- 2) إضافة عمود invoice_id إلى جدول سجلات الوقت (time_entries) لتسهيل الربط الاتجاهي
ALTER TABLE public.time_entries 
ADD COLUMN IF NOT EXISTS invoice_id TEXT;
