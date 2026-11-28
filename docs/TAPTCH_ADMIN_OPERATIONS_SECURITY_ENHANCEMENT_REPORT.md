# TAPTCH — ADMIN OPERATIONS, REPORTS, ALERTS & SECURITY ENHANCEMENT REPORT

**Date:** 2026-11-28  
**Status:** COMPLETED & VERIFIED

---

## 1. NFC Lifecycle Implementation

- **Backend (`AdminOperationsService.getNfcLifecycleCards`, `updateNfcCardLifecycle`):**
  - Lists `purchasedCards` with search (`id`, `orderId`) and `profileAssignmentStatus` filtering without exposing `permanentToken` in list views.
  - Supports `activate`, `damage`, `revoke`, and `replace` inside `this.dbService.db.transaction(...)` with `SELECT ... FOR UPDATE`, preserving permanent `/p/{token}` URLs and recording `ActivityLogService.record(..., tx)`.
- **Frontend (`AdminNfcLifecyclePage.tsx`):** Tabbed NFC Lifecycle & Inventory Movements view with confirmation modal and required reason.

---

## 2. Inventory Management Implementation

- **Schema & Migration (`0028_admin_operations_security.sql`):** Added `inventory_items` and `inventory_movements` (with unique `idx_inventory_movements_idempotency`).
- **Backend (`getInventoryOverview`, `recordInventoryMovement`):** Transactional `SELECT ... FOR UPDATE`, negative-stock rejection, duplicate `idempotencyKey` rejection (`409 Conflict`), damaged/lost tracking, and `ActivityLogService.record(..., tx)`.

---

## 3. Reports & Export Implementation

- **Backend (`generateReport`, `buildCsvExport`, `sanitizeCsvCell`):**
  - Supports `orders`, `sales`, `customers`, and `inventory` reports with date-range and status filters.
  - Excludes `SIM_TEST_*` simulated orders from real revenue by default (`includeSimulated=true` optional).
  - Protects CSV/XLSX exports against formula injection (`=`, `+`, `-`, `@`, `\t`, `\r` prefixed with `'`) and excludes sensitive fields.
- **Frontend (`AdminReportsPage.tsx`):** Report selector, date filters, summary metrics, results table, and CSV/XLSX export buttons gated by `reports.export`.

---

## 4. Alerts & Notifications Implementation

- **Schema (`admin_alerts`):** Deduplicated by `(dedupe_key, status)` index.
- **Backend (`evaluateAndListAlerts`, `updateAlertStatus`):** Evaluates low-stock inventory and failed admin logins, deduplicates active alerts, and supports `read`, `resolve`, and `dismiss` with `ActivityLogService.record(..., tx)`.
- **Frontend (`AdminAlertsPage.tsx`):** Displays severity (`CRITICAL`, `WARNING`, `INFO`), summary counts, and resolve actions.

---

## 5. Login History & Session Management

- **Schema (`admin_login_history`):** Records `userId`, `email`, `ipAddress`, `userAgent`, `success`, `failureReason`, and `createdAt`.
- **Backend (`recordLoginAttempt`, `getLoginHistory`, `getActiveSessions`, `revokeSession`):** Lists active sessions without exposing raw tokens, revokes sessions transactionally with `ActivityLogService.record(..., tx)`, and generates `FAILED_ADMIN_LOGIN` alerts on failed logins.
- **Frontend (`AdminSecurityPage.tsx`):** Active sessions table with force-logout confirmation modal and searchable login history table.

---

## 6. Permissions Added & Role Matrix Changes

Added 10 granular permissions in `backend/src/common/rbac/permissions.ts`:
- `inventory.view`, `inventory.manage`
- `reports.view`, `reports.export`
- `notifications.view`, `notifications.manage`
- `security.login_history.view`, `security.sessions.view`, `security.sessions.manage`, `security.alerts.view`

---

## 7. Database Migrations & Indexes

- `backend/src/database/migrations/0028_admin_operations_security.sql`
- `backend/src/database/schema/operations.ts`

---

## 8. Exact Files Modified

- `backend/src/common/rbac/permissions.ts`
- `backend/src/database/schema/operations.ts` (new)
- `backend/src/database/schema/index.ts`
- `backend/src/database/migrations/0028_admin_operations_security.sql` (new)
- `backend/src/modules/admin/admin-operations.service.ts` (new)
- `backend/src/modules/admin/admin.module.ts`
- `backend/src/modules/admin/admin.controller.ts`
- `backend/src/tests/phase5-operations-security.test.ts` (new)
- `frontend/src/pages/admin/AdminNfcLifecyclePage.tsx` (new)
- `frontend/src/pages/admin/AdminReportsPage.tsx` (new)
- `frontend/src/pages/admin/AdminAlertsPage.tsx` (new)
- `frontend/src/pages/admin/AdminSecurityPage.tsx` (new)
- `frontend/src/layouts/AdminLayout.tsx`
- `frontend/src/routes/index.tsx`

---

## 9. Test & Build Results

- `npm --prefix backend run typecheck`: **PASSED** (exit code 0)
- `npm --prefix backend test`: **PASSED** — **23 test files, 132 tests passed** (`phase5-operations-security.test.ts`: 4/4 passed)
- `npm --prefix backend run build`: **PASSED** (`nest build`, exit code 0)
- `npm --prefix frontend test -- --run`: **PASSED** (exit code 0)
- `npm --prefix frontend run build`: **PASSED** (`tsc && vite build`, exit code 0)

---

## 10. Known Limitations

- Multi-connection PostgreSQL concurrency testing remains on the staging deployment-readiness checklist (PGlite runs in-process).
