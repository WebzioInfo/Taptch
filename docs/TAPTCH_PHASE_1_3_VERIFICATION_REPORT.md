# TAPTCH — PHASE 1.3 INDEPENDENT VERIFICATION REPORT

**Mode:** Read-Only Security Audit  
**Date:** 2026-11-28  
**Target:** Phase 1.2 RBAC & Audit Integrity Fixes

---

## 1. Executive Verdict

**VERDICT: CONDITIONALLY APPROVED**

- **Authorization:** **PASS** — Every endpoint in `AdminController` (`backend/src/modules/admin/admin.controller.ts`) is protected by `@UseGuards(AuthGuard, RolesGuard, PermissionsGuard)` and declares either explicit `@RequirePermissions(...)` or `@RoleOnlyAccess()`. `PermissionsGuard` fails closed (`403 Forbidden`) when permission metadata is missing.
- **Transactional Audit Integrity:** **PASS (by code inspection)** — `AdminService.recordExpense()`, `AdminService.assignSubscription()`, and `AdminService.updateAdminRole()` execute inside `this.dbService.db.transaction(async (tx) => ...)` and pass `tx` to `ActivityLogService.record(entry, tx)`, which uses `const executor = tx || this.dbService.db`.
- **Recursive Metadata Redaction:** **PASS** — `ActivityLogService.sanitizeMetadata()` recursively redacts sensitive keys across nested objects, arrays, and objects inside arrays using case-insensitive regex matching.
- **Last-Super-Admin Concurrency & Rollback Integration:** **UNVERIFIED** — Code inspection confirms `SELECT ... FOR UPDATE` on both the target user and active `super_admin` rows inside a database transaction, which prevents concurrent demotion of the last active `super_admin` in PostgreSQL. However, **no real PostgreSQL/PGlite concurrency or rollback integration test exists** in `backend/src/tests/` (existing tests use mocked `tx` objects).

---

## 2. Complete Endpoint Authorization Matrix

### 2.1 `AdminController` (`backend/src/modules/admin/admin.controller.ts`)
Class-level guards: `@UseGuards(AuthGuard, RolesGuard, PermissionsGuard)`  
Class-level roles: `@Roles('super_admin', 'admin', 'support_admin', 'staff')`

| Method & Route | Handler | Permission / Exception | In `ALL_PERMISSIONS`? | Intended Role Access |
| :--- | :--- | :--- | :--- | :--- |
| `GET /api/v1/admin/rbac/me` | `getMyRbac` | `@RoleOnlyAccess()` | N/A (role-only) | `super_admin`, `admin`, `support_admin`, `staff` |
| `GET /api/v1/admin/rbac/matrix` | `getRbacMatrix` | `roles.view` | Yes | `super_admin`, `admin` |
| `GET /api/v1/admin/activity-logs` | `getActivityLogs` | `activity_logs.view` | Yes | `super_admin`, `admin`, `support_admin` |
| `GET /api/v1/admin/admins` | `getAdmins` | `staff.view` | Yes | `super_admin`, `admin` |
| `PATCH /api/v1/admin/admins/:id/role` | `updateAdminRole` | `staff.manage` | Yes | `super_admin`, `admin` (super_admin-only for `super_admin` role) |
| `GET /api/v1/admin/stats` | `getStats` | `dashboard.view` | Yes | `super_admin`, `admin`, `support_admin`, `staff` |
| `GET /api/v1/admin/finance` | `getFinance` | `finance.view` | Yes | `super_admin`, `admin` |
| `POST /api/v1/admin/finance/expenses` | `recordExpense` | `finance.manage` | Yes | `super_admin`, `admin` |
| `GET /api/v1/admin/users` | `getUsers` | `users.view` | Yes | `super_admin`, `admin`, `support_admin` |
| `PATCH /api/v1/admin/users/:id/status` | `updateUserStatus` | `users.suspend` | Yes | `super_admin`, `admin` |
| `GET /api/v1/admin/orders` | `getOrders` | `orders.view` | Yes | `super_admin`, `admin`, `support_admin`, `staff` |
| `GET /api/v1/admin/orders/:id` | `getOrderById` | `orders.view` | Yes | `super_admin`, `admin`, `support_admin`, `staff` |
| `PATCH /api/v1/admin/orders/:id` | `updateOrder` | `orders.manage` | Yes | `super_admin`, `admin` |
| `PATCH /api/v1/admin/orders/:id/fulfillment` | `updateOrderFulfillment` | `orders.manage` | Yes | `super_admin`, `admin` |
| `PATCH /api/v1/admin/orders/:id/profile-assistance` | `updateOrderProfileAssistance` | `orders.manage` | Yes | `super_admin`, `admin` |
| `PATCH /api/v1/admin/orders/:id/payment` | `updateOrderPayment` | `finance.manage` | Yes | `super_admin`, `admin` |
| `POST /api/v1/admin/subscriptions/assign` | `assignSubscription` | `users.edit` | Yes | `super_admin`, `admin` |

### 2.2 `SupportController` (`backend/src/modules/support/support.controller.ts`)
Class-level guards: `@UseGuards(AuthGuard, RolesGuard)`  
Class-level roles: `@Roles('support_admin', 'super_admin', 'admin')` (excludes `staff` and `user`)

| Method & Route | Handler | Guards | Role Access |
| :--- | :--- | :--- | :--- |
| `GET /api/v1/support/dashboard` | `getDashboard` | `AuthGuard`, `RolesGuard` | `support_admin`, `admin`, `super_admin` |
| `GET /api/v1/support/users` | `searchUsers` | `AuthGuard`, `RolesGuard` | `support_admin`, `admin`, `super_admin` |
| `GET /api/v1/support/profiles` | `getProfiles` | `AuthGuard`, `RolesGuard` | `support_admin`, `admin`, `super_admin` |
| `PATCH /api/v1/support/profiles/:id/review` | `reviewProfile` | `AuthGuard`, `RolesGuard` | `support_admin`, `admin`, `super_admin` |
| `GET /api/v1/support/audit-trail` | `getAuditTrail` | `AuthGuard`, `RolesGuard` | `support_admin`, `admin`, `super_admin` |

---

## 3. Guard Coverage & Role-Only Exception Verification

- `AdminController` applies `@UseGuards(AuthGuard, RolesGuard, PermissionsGuard)` at the class level, ensuring authentication runs first, role membership second, and granular permission checking third.
- `PermissionsGuard.canActivate()` (`backend/src/common/guards/permissions.guard.ts`) checks `PERMISSIONS_KEY` first; if absent/empty, it checks `ROLE_ONLY_ACCESS_KEY`. If neither is set, it throws `ForbiddenException('Access denied: Endpoint missing permission metadata.')` (fail-closed).
- `@RoleOnlyAccess()` is applied only to `AdminController.getMyRbac()` (`GET /api/v1/admin/rbac/me`).
- `SupportController` intentionally uses `@UseGuards(AuthGuard, RolesGuard)` with `@Roles('support_admin', 'super_admin', 'admin')` and is not broken by `PermissionsGuard` changes.

---

## 4. Last-Super-Admin Concurrency Analysis

- **Status:** **UNVERIFIED** (no real PostgreSQL concurrency test exists).
- **Code Inspection (`AdminService.updateAdminRole`):**
  - Executes inside `this.dbService.db.transaction(async (tx: any) => ...)`.
  - Locks the target user row with `.for('update')`.
  - When demoting a `super_admin`, locks all active `super_admin` rows with `.for('update')` and rejects if `activeSuperAdmins.length <= 1 && target.status === 'active'`.
  - Self-demotion (`targetUserId === actor.userId`) and non-`super_admin` modification of `super_admin` remain blocked.
- **Required Integration Test:** A real PostgreSQL/PGlite integration test spawning two concurrent `Promise.all` calls to `updateAdminRole()` against two remaining active `super_admin` accounts to verify that at least one active `super_admin` always remains committed.

---

## 5. Transactional Audit Integrity Analysis

- `ActivityLogService.record(entry, tx?)` uses `const executor = tx || this.dbService.db;`, ensuring all inserts run on the caller's transaction when `tx` is provided.
- `AdminService.recordExpense()`, `AdminService.assignSubscription()`, and `AdminService.updateAdminRole()` all wrap both the business write and `this.activityLogService.record(..., tx)` inside `this.dbService.db.transaction(async (tx: any) => ...)`.
- **Note:** Real PostgreSQL rollback-on-audit-failure behavior is **UNVERIFIED** by a database integration test (currently verified by code inspection and mocked `tx` unit tests).

---

## 6. Recursive Redaction Verification

- `ActivityLogService.sanitizeMetadata()` (`backend/src/modules/admin/activity-log.service.ts`) handles `null`, `undefined`, primitives, arrays (`input.map(...)`), and objects (`Object.entries(...)`) recursively.
- `SENSITIVE_KEY_PATTERN` uses `/i` (case-insensitive) matching: `password|pass|token|access_token|refresh_token|secret|apikey|api_key|signature|cookie|authorization|cvv|cardnumber|card_number`.
- Verified by unit test in `phase1-admin-foundation.test.ts` against `Password`, `apiKey`, `Refresh_Token`, and `Authorization` nested inside arrays and objects.

---

## 7. Test Coverage Distinctions

- **Unit Tests (Mocked DB/Reflector):**
  - `phase1-admin-foundation.test.ts` (9 tests):
    - `ROLE_PERMISSION_MATRIX` & `PermissionsGuard` (including fail-closed and `@RoleOnlyAccess()`).
    - `ActivityLogService.record()` redaction (including recursive array/object/case-insensitive keys).
    - `AdminController` metadata reflection check across all handler methods.
    - `AdminService.updateAdminRole()`, `recordExpense()`, and `assignSubscription()` using mocked `tx` objects.
- **Controller / Guard Integration Tests:** None (tested via unit-level `Reflector` + `PermissionsGuard` mocks and prototype metadata reflection).
- **Database Integration Tests (Real PostgreSQL / PGlite):** None for `AdminService` concurrency or audit rollback.

---

## 8. Build & Test Results

Executed without modifying any source files:
- `npm --prefix backend run typecheck`: **PASSED** (exit code 0)
- `npm --prefix backend test`: **PASSED** — 17 test files, 109 tests passed (`phase1-admin-foundation.test.ts`: 9/9)
- `npm --prefix backend run build`: **PASSED** (`nest build`, exit code 0)
- `npm --prefix frontend test -- --run`: **PASSED** (exit code 0)
- `npm --prefix frontend run build`: **PASSED** (`vite build`, exit code 0)

---

## 9. Remaining Risks & Recommended Fixes

1. **Missing Real-DB Concurrency & Rollback Integration Tests (Medium):** Add a PGlite/PostgreSQL integration test in `backend/src/tests/` verifying:
   - Concurrent `updateAdminRole()` calls cannot demote the last two active `super_admin` accounts.
   - An audit insert failure inside `recordExpense()`, `assignSubscription()`, or `updateAdminRole()` rolls back the business mutation.

---

## 10. Files Inspected

- `backend/src/common/rbac/permissions.ts`
- `backend/src/common/guards/permissions.guard.ts`
- `backend/src/common/guards/roles.guard.ts`
- `backend/src/modules/admin/admin.controller.ts`
- `backend/src/modules/admin/admin.service.ts`
- `backend/src/modules/admin/activity-log.service.ts`
- `backend/src/modules/support/support.controller.ts`
- `backend/src/tests/phase1-admin-foundation.test.ts`
