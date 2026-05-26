-- جدول طلبات الدفع اليدوي
CREATE TABLE IF NOT EXISTS manual_payment_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('basic', 'advanced', 'enterprise')),
  amount INTEGER NOT NULL,
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  transfer_reference TEXT NOT NULL,
  transfer_method TEXT NOT NULL DEFAULT 'instapay' 
    CHECK (transfer_method IN ('instapay', 'vodafone_cash', 'orange_cash', 'etisalat_cash')),
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'confirmed', 'rejected')),
  notes TEXT,
  confirmed_by UUID REFERENCES profiles(id),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE manual_payment_requests ENABLE ROW LEVEL SECURITY;

-- المكتب يشوف طلباته فقط
CREATE POLICY "org_select_own_requests" ON manual_payment_requests
  FOR SELECT USING (org_id = get_user_org_id());

CREATE POLICY "org_insert_own_requests" ON manual_payment_requests
  FOR INSERT WITH CHECK (org_id = get_user_org_id());

-- super_admin فقط يقدر يؤكد أو يرفض
CREATE POLICY "superadmin_update_requests" ON manual_payment_requests
  FOR UPDATE USING (is_super_admin());

-- Indexes
CREATE INDEX idx_manual_payments_org_id ON manual_payment_requests(org_id);
CREATE INDEX idx_manual_payments_status ON manual_payment_requests(status);
CREATE INDEX idx_manual_payments_created ON manual_payment_requests(created_at DESC);

-- Ensure the updated_at function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at trigger
CREATE TRIGGER update_manual_payment_requests_updated_at
  BEFORE UPDATE ON manual_payment_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
