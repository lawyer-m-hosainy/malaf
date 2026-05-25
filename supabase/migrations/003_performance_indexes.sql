-- ═══════════════════════════════════════════════════════
-- Migration 003: Performance Indexes — مَلَف (Malaf)
-- ═══════════════════════════════════════════════════════
-- هذا الملف يضيف indexes لتسريع الاستعلامات الأساسية
-- شغّل هذا الملف في: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════

-- ── 1. Indexes على org_id (أساسي لعزل المستأجرين) ──
CREATE INDEX IF NOT EXISTS idx_cases_org_id ON cases(org_id);
CREATE INDEX IF NOT EXISTS idx_clients_org_id ON clients(org_id);
CREATE INDEX IF NOT EXISTS idx_invoices_org_id ON invoices(org_id);
CREATE INDEX IF NOT EXISTS idx_expenses_org_id ON expenses(org_id);
CREATE INDEX IF NOT EXISTS idx_documents_org_id ON documents(org_id);
CREATE INDEX IF NOT EXISTS idx_tasks_org_id ON tasks(org_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_org_id ON calendar_events(org_id);
CREATE INDEX IF NOT EXISTS idx_trust_accounts_org_id ON trust_accounts(org_id);
CREATE INDEX IF NOT EXISTS idx_enforcement_cases_org_id ON enforcement_cases(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id ON audit_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_org_id ON whatsapp_messages(org_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_org_id ON whatsapp_contacts(org_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_settings_org_id ON whatsapp_settings(org_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_scheduled_org_id ON whatsapp_scheduled(org_id);

-- Indexes على organization_id لضمان التوافق (Compatibility with older schemas)
CREATE INDEX IF NOT EXISTS idx_tasks_org_alt ON tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_expenses_org_alt ON expenses(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_org_alt ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_trust_org_alt ON trust_accounts(organization_id);
CREATE INDEX IF NOT EXISTS idx_poas_org_alt ON poas(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_org_alt ON documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_enforcement_org_alt ON enforcement_cases(organization_id);
CREATE INDEX IF NOT EXISTS idx_expert_org_alt ON expert_missions(organization_id);

-- ── 2. Indexes على case_id (جداول مرتبطة بالقضايا) ──
CREATE INDEX IF NOT EXISTS idx_sessions_case_id ON sessions(case_id);
CREATE INDEX IF NOT EXISTS idx_documents_case_id ON documents(case_id);
CREATE INDEX IF NOT EXISTS idx_expenses_case_id ON expenses(case_id);
CREATE INDEX IF NOT EXISTS idx_invoices_case_id ON invoices(case_id);

-- ── 3. Indexes على client_id ──
CREATE INDEX IF NOT EXISTS idx_cases_client_id ON cases(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_poas_client_id ON poas(client_id);

-- ── 4. Indexes على created_at (للترتيب الزمني والتقارير) ──
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON cases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created_at ON whatsapp_messages(created_at DESC);

-- ── 5. Indexes مركّبة (Composite) للاستعلامات الشائعة ──
CREATE INDEX IF NOT EXISTS idx_cases_org_status ON cases(org_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_org_status ON invoices(org_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_case_date ON sessions(case_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_org_phone ON whatsapp_contacts(org_id, phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_scheduled_status ON whatsapp_scheduled(status, scheduled_at) WHERE status = 'pending';

-- ── 6. Index على deleted_at (للـ Soft Delete) ──
CREATE INDEX IF NOT EXISTS idx_cases_deleted_at ON cases(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_clients_deleted_at ON clients(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_deleted_at ON invoices(deleted_at) WHERE deleted_at IS NULL;

-- ═══════════════════════════════════════════════════════
-- ✅ تم — شغّل هذا الملف مرة واحدة فقط
-- لو ظهر خطأ "relation does not exist" على جدول معين،
-- فده معناه إن الجدول مش موجود بعد — تجاهل الخطأ ده.
-- ═══════════════════════════════════════════════════════
