-- ════════════════════════════════════════════════════════════════
-- المرحلة R5: الجداول المفقودة لمنصة مَلَف (مكتملة 100%)
-- ════════════════════════════════════════════════════════════════

-- 1. جدول المستندات (Documents)
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  size_bytes BIGINT,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. جدول التوكيلات (Power of Attorney - POA)
CREATE TABLE IF NOT EXISTS poa_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  poa_number TEXT NOT NULL,
  poa_type TEXT NOT NULL,
  issued_date DATE,
  expiry_date DATE,
  registry_office TEXT,
  file_url TEXT,
  status TEXT DEFAULT 'ساري',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. جدول العقود (Contracts)
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  contract_type TEXT,
  parties JSONB,
  value_amount DECIMAL(15, 2),
  status TEXT DEFAULT 'مسودة',
  file_url TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. جدول تتبع الوقت (Time Entries)
CREATE TABLE IF NOT EXISTS time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lawyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  duration_minutes INTEGER NOT NULL,
  description TEXT,
  is_billable BOOLEAN DEFAULT true,
  billing_rate DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. جدول المعرفة القانونية (Wiki Articles)
CREATE TABLE IF NOT EXISTS wiki_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  author_id UUID REFERENCES profiles(id),
  last_updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. فحص تعارض المصالح (Conflict Checks)
CREATE TABLE IF NOT EXISTS conflict_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  searched_name TEXT NOT NULL,
  search_type TEXT,
  conducted_by UUID REFERENCES profiles(id),
  result_status TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. نقابة المحامين (Bar Association)
CREATE TABLE IF NOT EXISTS bar_association (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lawyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  membership_number TEXT NOT NULL,
  card_type TEXT,
  renewal_date DATE,
  insurance_status TEXT,
  pension_status TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. المحكمة الاقتصادية (Economic Court Cases)
CREATE TABLE IF NOT EXISTS economic_court_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  dispute_type TEXT,
  claim_amount DECIMAL(15, 2),
  mediation_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. محاكم الأسرة (Family Court Cases)
CREATE TABLE IF NOT EXISTS family_court_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  dispute_type TEXT,
  settlement_office_status TEXT,
  children_involved INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. مجلس الدولة (State Council Cases)
CREATE TABLE IF NOT EXISTS state_council_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  court_type TEXT,
  decision_challenged TEXT,
  commissioners_report_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. الشهر العقاري (Real Estate Registry)
CREATE TABLE IF NOT EXISTS real_estate_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL,
  property_address TEXT,
  registry_office TEXT NOT NULL,
  application_number TEXT,
  status TEXT DEFAULT 'قيد الإجراء',
  fees_paid DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. التحصيل (Collections)
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  amount DECIMAL(15, 2) NOT NULL,
  status TEXT DEFAULT 'معلق', -- معلق، محصل، متأخر
  due_date DATE,
  collected_date DATE,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. بوابة التقاضي (E-Litigation)
CREATE TABLE IF NOT EXISTS e_litigation_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  portal_case_number TEXT,
  filing_date DATE,
  last_sync_date TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'محدث', -- محدث، خطأ، قيد المزامنة
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. القضايا الجنائية (Criminal Cases)
CREATE TABLE IF NOT EXISTS criminal_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  police_station TEXT,
  prosecution_number TEXT,
  charges TEXT[],
  defendant_status TEXT, -- مخلى سبيله، محبوس، هارب
  bail_amount DECIMAL(15, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. المسارات المتخصصة (Specialized Tracks)
CREATE TABLE IF NOT EXISTS specialized_tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  track_name TEXT NOT NULL, -- ضرائب، شركات، جمارك، إلخ
  description TEXT,
  workflow_steps JSONB, -- خطوات مخصصة للمسار
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════════
-- Indexes for Tenant Isolation & Performance
-- ════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_documents_org ON documents(org_id);
CREATE INDEX IF NOT EXISTS idx_poa_records_org ON poa_records(org_id);
CREATE INDEX IF NOT EXISTS idx_contracts_org ON contracts(org_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_org ON time_entries(org_id);
CREATE INDEX IF NOT EXISTS idx_wiki_articles_org ON wiki_articles(org_id);
CREATE INDEX IF NOT EXISTS idx_conflict_checks_org ON conflict_checks(org_id);
CREATE INDEX IF NOT EXISTS idx_bar_association_org ON bar_association(org_id);
CREATE INDEX IF NOT EXISTS idx_real_estate_records_org ON real_estate_records(org_id);
CREATE INDEX IF NOT EXISTS idx_collections_org ON collections(org_id);
CREATE INDEX IF NOT EXISTS idx_e_litigation_org ON e_litigation_records(org_id);
CREATE INDEX IF NOT EXISTS idx_criminal_cases_org ON criminal_cases(org_id);
CREATE INDEX IF NOT EXISTS idx_specialized_tracks_org ON specialized_tracks(org_id);

-- ════════════════════════════════════════════════════════════════
-- Enable RLS
-- ════════════════════════════════════════════════════════════════
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE poa_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE wiki_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conflict_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE bar_association ENABLE ROW LEVEL SECURITY;
ALTER TABLE economic_court_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_court_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE state_council_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE real_estate_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE e_litigation_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE criminal_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialized_tracks ENABLE ROW LEVEL SECURITY;

-- ════════════════════════════════════════════════════════════════
-- Add RLS Policies for Tenant Isolation (org_id based)
-- ════════════════════════════════════════════════════════════════
CREATE POLICY "Tenant Isolation org_id" ON documents FOR ALL USING (org_id = get_user_org_id());
CREATE POLICY "Tenant Isolation org_id" ON poa_records FOR ALL USING (org_id = get_user_org_id());
CREATE POLICY "Tenant Isolation org_id" ON contracts FOR ALL USING (org_id = get_user_org_id());
CREATE POLICY "Tenant Isolation org_id" ON time_entries FOR ALL USING (org_id = get_user_org_id());
CREATE POLICY "Tenant Isolation org_id" ON wiki_articles FOR ALL USING (org_id = get_user_org_id());
CREATE POLICY "Tenant Isolation org_id" ON conflict_checks FOR ALL USING (org_id = get_user_org_id());
CREATE POLICY "Tenant Isolation org_id" ON bar_association FOR ALL USING (org_id = get_user_org_id());
CREATE POLICY "Tenant Isolation org_id" ON economic_court_cases FOR ALL USING (org_id = get_user_org_id());
CREATE POLICY "Tenant Isolation org_id" ON family_court_cases FOR ALL USING (org_id = get_user_org_id());
CREATE POLICY "Tenant Isolation org_id" ON state_council_cases FOR ALL USING (org_id = get_user_org_id());
CREATE POLICY "Tenant Isolation org_id" ON real_estate_records FOR ALL USING (org_id = get_user_org_id());
CREATE POLICY "Tenant Isolation org_id" ON collections FOR ALL USING (org_id = get_user_org_id());
CREATE POLICY "Tenant Isolation org_id" ON e_litigation_records FOR ALL USING (org_id = get_user_org_id());
CREATE POLICY "Tenant Isolation org_id" ON criminal_cases FOR ALL USING (org_id = get_user_org_id());
CREATE POLICY "Tenant Isolation org_id" ON specialized_tracks FOR ALL USING (org_id = get_user_org_id());
