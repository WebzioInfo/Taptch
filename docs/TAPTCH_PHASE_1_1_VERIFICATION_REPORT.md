# TAPTCH — Phase 1.1: Admin Foundation Security & Architecture Verification Report

**Date**: 2026-11-28  
**Scope**: Independent read-only security & architecture verification of Phase 1.  
**Files Modified**: None (verification-only pass).

---

## 1. Exact Files & Functions Inspected
- `backend/src/common/rbac/permissions.ts` (`ADMIN_ROLES`, `ALL_PERMISSIONS`, `ROLE_PERMISSION_MATRIX`, `getPermissionsForRole`, `hasRolePermission`)
- `backend/src/common/guards/auth.guard.ts` (`AuthGuard.canActivate`)
- `backend/src/common/guards/roles.guard.ts` (`RolesGuard.canActivate`)
- `backend/src/common/guards/permissions.guard.ts` (`PermissionsGuard.canActivate`, `RequirePermissions`)
- `backend/src/modules/admin/admin.controller.ts` (`AdminController`)
- `backend/src/modules/admin/admin.service.ts` (`AdminService.getAdminAccounts`, `updateAdminRole`, `updateUserStatus`, `updateOrderStatus`, `recordExpense`, `assignSubscription`)
- `backend/src/modules/admin/activity-log.service.ts` (`ActivityLogService.record`, `queryLogs`, `sanitizeMetadata`)
- `backend/src/modules/support/support.controller.ts` (`SupportController`)
- `frontend/src/layouts/AdminLayout.tsx`, `frontend/src/hooks/useAdminPermissions.ts`, `frontend/src/components/auth/ProtectedRoute.tsx`, `frontend/src/routes/index.tsx`

---

## 2. Endpoint-to-Permission Matrix (`AdminController` & `SupportController`)

| Endpoint | Current `@RequirePermissions` | Intended Permission | Status |
|---|---|---|---|
| `GET /api/v1/admin/rbac/me` | None (any admin/staff) | Authenticated admin/staff | **OK** |
| `GET /api/v1/admin/rbac/matrix` | `roles.view` | `roles.view` | **OK** |
| `GET /api/v1/admin/activity-logs` | `activity_logs.view` | `activity_logs.view` | **OK** |
| `GET /api/v1/admin/admins` | `staff.view` | `staff.view` | **OK** |
| `PATCH /api/v1/admin/admins/:id/role` | `staff.manage` | `staff.manage` | **OK** |
| `GET /api/v1/admin/stats` | `dashboard.view` | `dashboard.view` | **OK** |
| `GET /api/v1/admin/finance` | **MISSING** | `finance.view` | **VULNERABLE** |
| `POST /api/v1/admin/finance/expenses` | **MISSING** | `finance.manage` | **VULNERABLE** |
| `GET /api/v1/admin/users` | **MISSING** | `users.view` | **VULNERABLE** |
| `PATCH /api/v1/admin/users/:id/status` | **MISSING** | `users.suspend` | **VULNERABLE** |
| `GET /api/v1/admin/orders` | **MISSING** | `orders.view` | **VULNERABLE** |
| `GET /api/v1/admin/orders/:id` | **MISSING** | `orders.view` | **VULNERABLE** |
| `PATCH /api/v1/admin/orders/:id` | **MISSING** | `orders.manage` | **VULNERABLE** |
| `PATCH /api/v1/admin/orders/:id/fulfillment` | **MISSING** | `orders.manage` | **VULNERABLE** |
| `PATCH /api/v1/admin/orders/:id/profile-assistance` | **MISSING** | `orders.manage` | **VULNERABLE** |
| `PATCH /api/v1/admin/orders/:id/payment` | **MISSING** | `finance.manage` | **VULNERABLE** |
| `POST /api/v1/admin/subscriptions/assign` | **MISSING** | `users.edit` | **VULNERABLE** |
| `GET/PATCH /api/v1/support/*` | `RolesGuard('support_admin','super_admin','admin')` | Support operations | **OK** |

---

## 3. Role-Permission Matrix Integrity
- All 21 permissions in `ALL_PERMISSIONS` are accounted for.
- `super_admin` has all 21; `admin` has 20 (excludes `roles.manage`); `support_admin` has 6 (`dashboard.view`, `users.view`, `profiles.view`, `profiles.edit`, `orders.view`, `activity_logs.view`); `staff` has 4 (`dashboard.view`, `orders.view`, `products.view`, `cards.view`).
- Unknown roles return `[]` and fail closed.

---

## 4. Confirmed Authorization Bypass & Findings

1. **CRITICAL — Missing `@RequirePermissions` on 11 Legacy `AdminController` Endpoints**:
   - Class-level `@Roles` was widened to `('super_admin', 'admin', 'support_admin', 'staff')` while `PermissionsGuard` returns `true` when `@RequirePermissions` is omitted.
   - **Impact**: `support_admin` and `staff` can currently call `GET /admin/finance`, `POST /admin/finance/expenses`, `PATCH /admin/users/:id/status`, `PATCH /admin/orders/:id/payment`, and `POST /admin/subscriptions/assign`.
   - **Minimal Fix**: Add `@RequirePermissions(...)` to all 11 endpoints per the matrix above.
2. **HIGH — Last-`super_admin` Race Condition & Non-Atomic Role Update (`AdminService.updateAdminRole`)**:
   - `updateAdminRole()` runs `select` + `update` + `activityLogService.record()` outside a `db.transaction(...)` and without `SELECT ... FOR UPDATE`. Two concurrent requests could demote the last two `super_admin`s simultaneously, or leave a role change committed if audit logging fails.
   - **Minimal Fix**: Wrap `updateAdminRole()` in `this.dbService.db.transaction(async (tx) => ...)` with `.for('update')` on active `super_admin` rows.
3. **MEDIUM — `ActivityLogService.sanitizeMetadata()` Skips Arrays**:
   - Nested objects inside arrays (e.g., `[{ token: 'abc' }]`) are not recursively sanitized.
   - **Minimal Fix**: Recursively map arrays in `sanitizeMetadata()`.
4. **LOW — Missing Audit Events on Legacy `AdminService` Mutations**:
   - `recordExpense()` and `assignSubscription()` do not call `ActivityLogService.record()`.

---

## 5. Frontend Protection Findings
- `AdminLayout.tsx` hides unauthorized nav items using `useAdminPermissions()`.
- `/admin` (`AdminPage`) is gated by `allowedRoles={['super_admin', 'admin']}`; `/support` by `['support_admin', 'super_admin', 'admin']`; `/admin/admins`, `/admin/roles`, `/admin/activity-logs` by `['super_admin', 'admin', 'support_admin', 'staff']`.
- Direct URL access by `staff` to `/admin/roles` renders the page shell, which receives `403` from `GET /api/v1/admin/rbac/matrix` (backend authoritative).

---

## 6. Test & Build Verification Results
*(Verified from the latest Phase 1 test & build runs; no code was modified in Phase 1.1)*
- **Backend**: `tsc --noEmit` (0 errors), `vitest run` (**17 test files, 104 tests passed**), `nest build` (passed).
- **Frontend**: `vitest run --run` (**24 test files, 151 tests passed**), `tsc && vite build` (passed).
- **Test Quality Note**: `phase1-admin-foundation.test.ts` genuinely verifies `PermissionsGuard`, `ROLE_PERMISSION_MATRIX`, `updateAdminRole` escalation/last-super-admin guards, and `ActivityLogService` redaction; `admin-layout.test.tsx` verifies rendered navigation hiding with mocked `useAdminPermissions`.

---

## 7. Final Verdict

**NOT APPROVED FOR PHASE 2** — Fix the **Critical** missing `@RequirePermissions(...)` decorators on the 11 legacy `AdminController` endpoints (and wrap `updateAdminRole()` in a transaction) before starting Phase 2.
