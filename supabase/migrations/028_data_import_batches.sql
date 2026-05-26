-- ═══════════════════════════════════════════════════════════════
-- MIGRATION 028: Data Import Batches Setup
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS import_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('dry_run', 'completed', 'rolled_back')),
    record_type TEXT NOT NULL CHECK (record_type IN ('clients', 'cases', 'sessions', 'all')),
    imported_records JSONB DEFAULT '{"clients": 0, "cases": 0, "sessions": 0}'::jsonb,
    imported_ids JSONB DEFAULT '{"clients": [], "cases": [], "sessions": []}'::jsonb,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE import_batches ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies using get_user_org_id()
CREATE POLICY "Org import batches read" ON import_batches 
    FOR SELECT USING (organization_id = get_user_org_id());

CREATE POLICY "Org import batches insert" ON import_batches 
    FOR INSERT WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "Org import batches update" ON import_batches 
    FOR UPDATE USING (organization_id = get_user_org_id());

CREATE POLICY "Org import batches delete" ON import_batches 
    FOR DELETE USING (organization_id = get_user_org_id());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_import_batches_org ON import_batches(organization_id);
CREATE INDEX IF NOT EXISTS idx_import_batches_created ON import_batches(created_at DESC);
