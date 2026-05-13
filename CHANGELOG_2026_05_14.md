# Changelog - 2026-05-14

## [1.2.1] - 2026-05-14

### Fixed
- **Case & Invoice Persistence**: Resolved "Unexpected Error" when saving/updating cases and invoices by implementing robust field mapping between frontend (camelCase) and backend (snake_case).
- **Critical UI Restoration**: Fixed an issue where the main application (`App.tsx`) was returning a "HELLO WORLD" test message, restoring the full routing and module system.
- **Schema Compatibility**: Added a filtering layer in `legalDataService.ts` to strip out extra frontend-only fields (like specialized workflow flags) before sending data to Supabase, preventing 400 Bad Request errors.
- **Entity Synchronization**: Improved sync for Tasks, Sessions, POAs, and Expenses by ensuring correct column names are used in `upsert` operations.
- **Audit Logging**: Ensured that audit logs are correctly triggered for Case and Invoice updates.

### Improved
- **Data Fetching**: Updated `fetchCases`, `fetchSessions`, and `fetchExpenses` to automatically map database snake_case columns back to the frontend's expected camelCase properties.
- **Reliability**: Strengthened the `try-catch` blocks in data services to provide more specific error context in the console while maintaining a user-friendly UI.

### Technical Details
- Added `mapCaseToDB`, `mapDBToCase`, `mapInvoiceToDB`, and similar helpers to `legalDataService.ts`.
- Switched `fetchCases` from specific column selection to `*` selection with manual mapping to ensure future-proofing.
- Fixed a bug where `clientRole` was being sent as camelCase instead of `client_role` in the database.
