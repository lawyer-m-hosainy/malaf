-- ═══════════════════════════════════════════════════════════════════
-- مَلَف: جدول حركات الأمانات
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.trust_transactions (
    id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id  UUID          NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    case_id          UUID          REFERENCES public.cases(id) ON DELETE SET NULL,
    client_id        UUID          NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    transaction_type TEXT          NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal')),
    amount           NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    description      TEXT,
    receipt_number   TEXT,
    transaction_date DATE          NOT NULL DEFAULT CURRENT_DATE,
    created_by       UUID          REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at       TIMESTAMPTZ   DEFAULT now()
);

-- RLS
ALTER TABLE public.trust_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Org Trust Transactions" ON public.trust_transactions;
CREATE POLICY "Org Trust Transactions" ON public.trust_transactions
    FOR ALL USING (organization_id = public.get_user_org_id());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trust_tx_org    ON public.trust_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_trust_tx_client ON public.trust_transactions(organization_id, client_id);
CREATE INDEX IF NOT EXISTS idx_trust_tx_case   ON public.trust_transactions(organization_id, case_id);
CREATE INDEX IF NOT EXISTS idx_trust_tx_date   ON public.trust_transactions(organization_id, transaction_date DESC);

-- View: رصيد كل موكل
CREATE OR REPLACE VIEW public.trust_balances AS
SELECT
    organization_id,
    client_id,
    COALESCE(SUM(CASE WHEN transaction_type = 'deposit'    THEN amount ELSE 0 END), 0) AS total_deposits,
    COALESCE(SUM(CASE WHEN transaction_type = 'withdrawal' THEN amount ELSE 0 END), 0) AS total_withdrawals,
    COALESCE(SUM(CASE WHEN transaction_type = 'deposit'    THEN amount ELSE 0 END), 0)
  - COALESCE(SUM(CASE WHEN transaction_type = 'withdrawal' THEN amount ELSE 0 END), 0) AS available_balance
FROM public.trust_transactions
GROUP BY organization_id, client_id;

-- View: رصيد كل قضية
CREATE OR REPLACE VIEW public.trust_balances_by_case AS
SELECT
    organization_id,
    client_id,
    case_id,
    COALESCE(SUM(CASE WHEN transaction_type = 'deposit'    THEN amount ELSE 0 END), 0) AS total_deposits,
    COALESCE(SUM(CASE WHEN transaction_type = 'withdrawal' THEN amount ELSE 0 END), 0) AS total_withdrawals,
    COALESCE(SUM(CASE WHEN transaction_type = 'deposit'    THEN amount ELSE 0 END), 0)
  - COALESCE(SUM(CASE WHEN transaction_type = 'withdrawal' THEN amount ELSE 0 END), 0) AS available_balance
FROM public.trust_transactions
GROUP BY organization_id, client_id, case_id;
