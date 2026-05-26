# ERD & Database Schema Documentation - malaf.pro
**Date:** May 26, 2026

## 1. Core Entities & Relationships

### `organizations`
- **PK:** `id` (UUID v4)
- **Fields:** `name` (TEXT), `plan` (TEXT), `created_at` (TIMESTAMPTZ)
- **Constraints:** `name` NOT NULL

### `profiles` (Users)
- **PK:** `id` (UUID v4) -> References `auth.users`
- **FK:** `org_id` -> References `organizations.id`
- **Fields:** `full_name` (TEXT), `role` (user_role), `is_active` (BOOLEAN)
- **Constraints:** `org_id` NOT NULL, `full_name` NOT NULL

### `clients`
- **PK:** `id` (UUID v4)
- **FK:** `org_id` -> References `organizations.id`
- **Fields:** `name` (TEXT), `phone` (TEXT), `national_id_encrypted` (TEXT), `deleted_at` (TIMESTAMPTZ)
- **Constraints:** `org_id` NOT NULL, `name` NOT NULL

### `cases`
- **PK:** `id` (UUID v4)
- **FK:** `org_id` -> References `organizations.id`
- **FK:** `client_id` -> References `clients.id`
- **Fields:** `case_number` (TEXT), `title` (TEXT), `status` (TEXT), `closed_at` (TIMESTAMPTZ), `deleted_at` (TIMESTAMPTZ)
- **Constraints:** `org_id` NOT NULL, `client_id` NOT NULL, `check_case_dates` (closed_at >= created_at)

### `sessions`
- **PK:** `id` (UUID v4)
- **FK:** `org_id` -> References `organizations.id`
- **FK:** `case_id` -> References `cases.id`
- **Fields:** `date` (DATE), `time` (TIME), `court` (TEXT), `status` (TEXT)
- **Constraints:** `org_id` NOT NULL, `case_id` NOT NULL

### `invoices`
- **PK:** `id` (UUID v4)
- **FK:** `org_id` -> References `organizations.id`
- **FK:** `client_id` -> References `clients.id`
- **Fields:** `base_amount` (NUMERIC), `vat_amount` (NUMERIC), `total` (NUMERIC), `status` (TEXT)
- **Constraints:** `base_amount >= 0`, `org_id` NOT NULL

## 2. RLS Policies Audit

| Table | SELECT | INSERT | UPDATE | DELETE | Coverage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `organizations` | `id = get_user_org_id()` | SuperAdmin Only | SuperAdmin Only | SuperAdmin Only | ✅ Full |
| `profiles` | `org_id = get_user_org_id()` | `org_admin` or `super_admin` | Self or `org_admin` | `org_admin` Only | ✅ Full |
| `clients` | `org_id = get_user_org_id()` | `role != 'client'` | `role != 'client'` | `org_admin` Only | ✅ Full |
| `cases` | `org_id = get_user_org_id()` | `role != 'client'` | `role != 'client'` | `senior_lawyer`+ | ✅ Full |
| `sessions` | `org_id = get_user_org_id()` | `role != 'client'` | `role != 'client'` | `role != 'client'` | ✅ Full |
| `documents` | `org_id = get_user_org_id()` | `role != 'client'` | `role != 'client'` | `org_admin` Only | ✅ Full |
| `invoices` | `org_id = get_user_org_id()` | `role != 'client'` | `org_admin` Only | `org_admin` Only | ✅ Full |

## 3. Schema Issues & Fixes

### Issue 1: Primary Keys - UUID v4 vs v7
**Problem:** Most tables use `gen_random_uuid()` (v4) which causes index fragmentation.
**Fix:** Migrate to UUID v7 (or sequential UUIDs) for better write performance.
```sql
-- Example for future tables or migration
-- Using a custom function for UUID v7 if available or pg_uuidv7 extension
ALTER TABLE public.cases ALTER COLUMN id SET DEFAULT uuid_generate_v7(); 
```

### Issue 2: Inconsistent Naming (`org_id` vs `organization_id`)
**Problem:** Some older migrations used `organization_id` while newer ones use `org_id`.
**Fix:** Standardize on `org_id` across all tables.
```sql
ALTER TABLE invoices RENAME COLUMN organization_id TO org_id;
-- Repeat for all tables
```

### Issue 3: Missing Soft Delete in `sessions`
**Problem:** `sessions` lacks a `deleted_at` column unlike `cases` and `clients`.
**Fix:**
```sql
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX idx_sessions_deleted_at ON sessions(deleted_at) WHERE deleted_at IS NULL;
```
