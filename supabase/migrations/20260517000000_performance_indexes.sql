-- Add Performance Indexes

CREATE INDEX IF NOT EXISTS idx_cases_tenant_status_date 
ON public.cases (organization_id, status, court_date);

CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_tenant_number 
ON public.invoices (organization_id, invoice_number);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_created 
ON public.audit_logs (organization_id, created_at DESC);
