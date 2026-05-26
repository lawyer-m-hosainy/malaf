# Database Conventions & Standards - malaf.pro

## 1. Naming Conventions

### Tables
- **Plural:** Use plural nouns (e.g., `cases`, `invoices`, `clients`).
- **Snake Case:** Use lowercase with underscores (e.g., `trust_transactions`).

### Columns
- **Standard Columns:**
  - `id`: Primary Key (UUID).
  - `org_id`: Organization identifier (Foreign Key).
  - `created_at`: Timestamp of creation (DEFAULT NOW()).
  - `updated_at`: Timestamp of last update.
  - `deleted_at`: Timestamp for soft deletes (nullable).
- **Foreign Keys:** Use `table_singular_id` (e.g., `client_id`, `case_id`).

## 2. Patterns & Best Practices

### Soft Delete
- Never use `DELETE` for core entities (Cases, Clients, Invoices).
- Update `deleted_at = NOW()`.
- Always include `WHERE deleted_at IS NULL` in indexes and queries.

### Multi-Tenancy (RLS)
- Every table MUST have an `org_id` column.
- RLS must be enabled on every table.
- Policies must use `get_user_org_id()` to ensure tenant isolation.

### Financial Data
- Use `NUMERIC` or `DECIMAL` for amounts. NEVER use `FLOAT` or `REAL`.
- Use `CHECK` constraints to ensure amounts are non-negative.

### Migrations
- Each migration must be idempotent (use `IF NOT EXISTS`).
- Number migrations sequentially (e.g., `027_...`, `028_...`).
- Include a `Down` section (or comment) describing how to rollback.

## 3. Indexing Strategy
- Index all Foreign Keys.
- Use `CONCURRENTLY` for production index creation.
- Use `GIN` indexes for Arabic full-text search.
- Use partial indexes for active records: `WHERE deleted_at IS NULL`.
