-- ═══════════════════════════════════════════════════════════════════
-- مَلَف: جدول خطط الدفع والأقساط المجدولة للموكلين
-- ═══════════════════════════════════════════════════════════════════

-- 1. جدول خطط الدفع
CREATE TABLE IF NOT EXISTS public.payment_plans (
    id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id  UUID          NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    case_id          UUID          REFERENCES public.cases(id) ON DELETE SET NULL,
    client_id        UUID          NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    total_amount     NUMERIC(12,2) NOT NULL CHECK (total_amount > 0),
    paid_amount      NUMERIC(12,2) DEFAULT 0 CHECK (paid_amount >= 0),
    plan_description TEXT,
    status           TEXT          DEFAULT 'active' CHECK (status IN ('active', 'completed', 'defaulted')),
    created_at       TIMESTAMPTZ   DEFAULT now()
);

-- RLS لخطط الدفع
ALTER TABLE public.payment_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Org Payment Plans" ON public.payment_plans;
CREATE POLICY "Org Payment Plans" ON public.payment_plans
    FOR ALL USING (organization_id = public.get_user_org_id());

-- 2. جدول الأقساط المجدولة
CREATE TABLE IF NOT EXISTS public.payment_installments (
    id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id          UUID          NOT NULL REFERENCES public.payment_plans(id) ON DELETE CASCADE,
    organization_id  UUID          NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    due_date         DATE          NOT NULL,
    amount           NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    paid_date        DATE,
    status           TEXT          DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
    notes            TEXT,
    created_at       TIMESTAMPTZ   DEFAULT now()
);

-- RLS للأقساط
ALTER TABLE public.payment_installments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Org Payment Installments" ON public.payment_installments;
CREATE POLICY "Org Payment Installments" ON public.payment_installments
    FOR ALL USING (organization_id = public.get_user_org_id());

-- 3. الفهارس لتحسين سرعة الاستعلام
CREATE INDEX IF NOT EXISTS idx_pay_plans_org    ON public.payment_plans(organization_id);
CREATE INDEX IF NOT EXISTS idx_pay_plans_client ON public.payment_plans(organization_id, client_id);
CREATE INDEX IF NOT EXISTS idx_pay_plans_case   ON public.payment_plans(organization_id, case_id);

CREATE INDEX IF NOT EXISTS idx_pay_inst_org     ON public.payment_installments(organization_id);
CREATE INDEX IF NOT EXISTS idx_pay_inst_plan    ON public.payment_installments(plan_id);
CREATE INDEX IF NOT EXISTS idx_pay_inst_due     ON public.payment_installments(organization_id, due_date);
