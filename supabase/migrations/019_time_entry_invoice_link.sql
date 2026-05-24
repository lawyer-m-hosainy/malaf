-- ═══════════════════════════════════════════════════════════════════
-- مَلَف: ربط سجل الوقت بالفاتورة الإلكترونية
-- ═══════════════════════════════════════════════════════════════════

-- 1) إضافة عمود time_entry_id إلى جدول الفواتير (invoices) وجدول (eta_invoices)
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS time_entry_id UUID REFERENCES public.time_entries(id) ON DELETE SET NULL;

ALTER TABLE public.eta_invoices 
ADD COLUMN IF NOT EXISTS time_entry_id UUID REFERENCES public.time_entries(id) ON DELETE SET NULL;

-- 2) إضافة عمود invoice_id إلى جدول سجلات الوقت (time_entries) لتسهيل الربط الاتجاهي
-- ملاحظة: تم استخدام TEXT لدعم الربط مع أنواع مختلفة من الفواتير (داخلي أو إلكتروني)
ALTER TABLE public.time_entries 
ADD COLUMN IF NOT EXISTS invoice_id UUID;

-- 3) إضافة فهرس لتحسين أداء البحث عن السجلات المرتبطة
CREATE INDEX IF NOT EXISTS idx_invoices_time_entry ON public.invoices(time_entry_id);
CREATE INDEX IF NOT EXISTS idx_eta_invoices_time_entry ON public.eta_invoices(time_entry_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_invoice ON public.time_entries(invoice_id);
