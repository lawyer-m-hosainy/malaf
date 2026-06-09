-- Migration: 032_implement_double_entry_and_eta.sql

-- 1. Create Double-Entry Ledger Schema
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- asset | liability | equity | revenue | expense
    balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    reference TEXT,
    transaction_date DATE NOT NULL,
    document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.journal_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    trust_account_id UUID REFERENCES public.trust_accounts(id) ON DELETE SET NULL,
    type TEXT NOT NULL, -- debit | credit
    amount DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "accounts_select" ON public.accounts FOR SELECT USING (org_id = public.get_user_org_id() OR public.is_super_admin());
CREATE POLICY "accounts_insert" ON public.accounts FOR INSERT WITH CHECK (org_id = public.get_user_org_id() OR public.is_super_admin());
CREATE POLICY "accounts_update" ON public.accounts FOR UPDATE USING (org_id = public.get_user_org_id() OR public.is_super_admin());
CREATE POLICY "accounts_delete" ON public.accounts FOR DELETE USING (org_id = public.get_user_org_id() OR public.is_super_admin());

CREATE POLICY "journal_entries_select" ON public.journal_entries FOR SELECT USING (org_id = public.get_user_org_id() OR public.is_super_admin());
CREATE POLICY "journal_entries_insert" ON public.journal_entries FOR INSERT WITH CHECK (org_id = public.get_user_org_id() OR public.is_super_admin());
CREATE POLICY "journal_entries_update" ON public.journal_entries FOR UPDATE USING (org_id = public.get_user_org_id() OR public.is_super_admin());
CREATE POLICY "journal_entries_delete" ON public.journal_entries FOR DELETE USING (org_id = public.get_user_org_id() OR public.is_super_admin());

-- For journal_lines, it checks via the parent journal_entries
CREATE POLICY "journal_lines_select" ON public.journal_lines FOR SELECT USING (EXISTS (SELECT 1 FROM public.journal_entries WHERE id = entry_id AND (org_id = public.get_user_org_id() OR public.is_super_admin())));
CREATE POLICY "journal_lines_insert" ON public.journal_lines FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.journal_entries WHERE id = entry_id AND (org_id = public.get_user_org_id() OR public.is_super_admin())));
CREATE POLICY "journal_lines_update" ON public.journal_lines FOR UPDATE USING (EXISTS (SELECT 1 FROM public.journal_entries WHERE id = entry_id AND (org_id = public.get_user_org_id() OR public.is_super_admin())));
CREATE POLICY "journal_lines_delete" ON public.journal_lines FOR DELETE USING (EXISTS (SELECT 1 FROM public.journal_entries WHERE id = entry_id AND (org_id = public.get_user_org_id() OR public.is_super_admin())));

-- Trigger to handle updated_at
CREATE TRIGGER trg_accounts_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 2. Migrate existing data from trust_transactions
DO $$
DECLARE
    org RECORD;
    cash_acct_id UUID;
    trust_acct_id UUID;
    txn RECORD;
    new_entry_id UUID;
BEGIN
    FOR org IN SELECT id FROM public.organizations LOOP
        -- Ensure Cash account exists
        INSERT INTO public.accounts (org_id, name, type) VALUES (org.id, 'Cash/Bank', 'asset') RETURNING id INTO cash_acct_id;
        -- Ensure Trust Liability exists
        INSERT INTO public.accounts (org_id, name, type) VALUES (org.id, 'Client Trust Liability', 'liability') RETURNING id INTO trust_acct_id;

        -- Migrate transactions
        FOR txn IN SELECT * FROM public.trust_transactions WHERE org_id = org.id LOOP
            INSERT INTO public.journal_entries (org_id, description, reference, transaction_date, document_id, created_by, created_at)
            VALUES (org.id, txn.description, txn.reference, txn.transaction_date, txn.document_id, txn.created_by, txn.created_at)
            RETURNING id INTO new_entry_id;

            IF txn.type = 'deposit' THEN
                -- Debit Cash, Credit Trust
                INSERT INTO public.journal_lines (entry_id, account_id, trust_account_id, type, amount, created_at) VALUES (new_entry_id, cash_acct_id, NULL, 'debit', txn.amount, txn.created_at);
                INSERT INTO public.journal_lines (entry_id, account_id, trust_account_id, type, amount, created_at) VALUES (new_entry_id, trust_acct_id, txn.trust_account_id, 'credit', txn.amount, txn.created_at);
            ELSIF txn.type = 'withdrawal' THEN
                -- Debit Trust, Credit Cash
                INSERT INTO public.journal_lines (entry_id, account_id, trust_account_id, type, amount, created_at) VALUES (new_entry_id, trust_acct_id, txn.trust_account_id, 'debit', txn.amount, txn.created_at);
                INSERT INTO public.journal_lines (entry_id, account_id, trust_account_id, type, amount, created_at) VALUES (new_entry_id, cash_acct_id, NULL, 'credit', txn.amount, txn.created_at);
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- 3. Add ETA Audit Snapshots
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='eta_invoices' AND column_name='eta_payload_snapshot') THEN
        ALTER TABLE public.eta_invoices ADD COLUMN eta_payload_snapshot JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='eta_invoices' AND column_name='eta_response_snapshot') THEN
        ALTER TABLE public.eta_invoices ADD COLUMN eta_response_snapshot JSONB;
    END IF;
END $$;
