# TAPTCH — PHASE 2.1 INDEPENDENT VERIFICATION REPORT

**Mode:** Read-Only Implementation & Security Audit  
**Date:** 2026-11-28  
**Target:** Phase 2 — Admin Dashboard, User Management & Profile Management

---

## 1. Executive Verdict

**VERDICT: CONDITIONALLY APPROVED**

- **Authorization & Data Exposure:** **PASS** — All 7 Phase 2 endpoints in `AdminController` are guarded by `AuthGuard`, `RolesGuard`, and `PermissionsGuard` (fail-closed), map to the exact permissions in `ROLE_PERMISSION_MATRIX`, and exclude password hashes, session tokens, and secrets.
- **Dashboard & Queries:** **PASS (by inspection)** — `getDashboardOverview()` uses single-pass `COUNT(*) FILTER (WHERE ...)` aggregates without join multiplication, limits `recentRegistrations` to 8 and `recentActivity` to 10, and enforces `activity_logs.view` server-side.
- **User & Profile Mutations:** **PASS (by inspection + unit tests)** — `updateUserStatus()` and `updateProfileStatus()` execute inside `this.dbService.db.transaction(...)` with `SELECT ... FOR UPDATE`, revoke sessions on suspension/deactivation, invalidate `profile:slug:<slug>` and `profile:notfound:<slug>` Redis keys, and record transactional audit logs via `ActivityLogService.record(..., tx)`.
- **Real-DB Integration & Frontend Component Tests:** **UNVERIFIED** — No real PostgreSQL/PGlite integration tests exist for Phase 2 queries, pagination, or audit-failure rollback, and no dedicated Vitest/RTL component tests exist for `AdminDashboardPage`, `AdminUsersPage`, or `AdminProfilesPage`.

---

## 2. Endpoint Authorization Matrix

Class-level guards on `AdminController` (`backend/src/modules/admin/admin.controller.ts`):  
`@UseGuards(AuthGuard, RolesGuard, PermissionsGuard)` + `@Roles('super_admin', 'admin', 'support_admin', 'staff')`

| Method & Route | Handler | Required Permission | Unauthorized Roles (403) | Sensitive Fields Excluded? |
| :--- | :--- | :--- | :--- | :--- |
| `GET /api/v1/admin/dashboard` | `getDashboard` | `dashboard.view` (+ `activity_logs.view` for `recentActivity`) | `user` (403 at `RolesGuard`); `staff` receives `recentActivity: []` | Yes |
| `GET /api/v1/admin/users` | `getUsers` | `users.view` | `staff`, `user` | Yes |
| `GET /api/v1/admin/users/:id` | `getUserById` | `users.view` | `staff`, `user` | Yes |
| `PATCH /api/v1/admin/users/:id/status` | `updateUserStatus` | `users.suspend` | `support_admin`, `staff`, `user` | Yes |
| `GET /api/v1/admin/profiles` | `getProfiles` | `profiles.view` | `staff`, `user` | Yes |
| `GET /api/v1/admin/profiles/:id` | `getProfileById` | `profiles.view` | `staff`, `user` | Yes |
| `PATCH /api/v1/admin/profiles/:id/status` | `updateProfileStatus` | `profiles.edit` | `staff`, `user` | Yes |

**Note on `GET /api/v1/admin/stats`:** Still exists in `AdminController` (`@RequirePermissions('dashboard.view')`) for backward compatibility with the legacy `/admin` cockpit (`AdminPage.tsx`). It is not duplicated by `/admin/dashboard` (which returns `metrics`, `recentRegistrations`, `recentActivity`, and `permissions`).

---

## 3. Dashboard Query & Metric Verification

- `totalUsers`, `activeUsers` (`status = 'active'`), `suspendedUsers` (`status = 'suspended'`): single-pass `COUNT(*) FILTER (WHERE ...)` on `schema.users`. Deactivated users are included in `totalUsers` and excluded from `activeUsers`/`suspendedUsers`.
- `totalProfiles`, `publishedProfiles` (`status = 'PUBLISHED'`), `unpublishedProfiles` (`status <> 'PUBLISHED'`): single-pass `COUNT(*) FILTER (WHERE ...)` on `schema.profiles`. `publishedProfiles + unpublishedProfiles === totalProfiles`.
- `recentRegistrations`: ordered by `desc(schema.users.createdAt)`, `limit(8)`.
- `recentActivity`: ordered by `desc(schema.auditLogs.createdAt)`, `limit(10)`, gated by `actor.role === 'super_admin' || hasRolePermission(actor.role, 'activity_logs.view')`.
- **N+1 Queries:** None.

---

## 4. User Management Verification

- **Search & Filters (`getAllUsers`):** Parameterized `ilike` across `name`, `email`, `phoneNumber`, and `EXISTS (SELECT 1 FROM profiles p WHERE p.owner_id = users.id AND p.slug ilike $q)` (prevents duplicate user rows from joins).
- **Date & Pagination:** `fromDate` / `toDate` parsed with `new Date()` and `Number.isNaN` guard; `page` clamped `>= 1`, `pageSize` clamped `1..100`; deterministic `orderBy(desc(schema.users.createdAt))`.
- **User Details (`getUserDetails`):** Returns `user`, `profiles`, `activityLogs`; throws `NotFoundException` (404) when user is missing.
- **Status Mutations (`updateUserStatus`):** Rejects self-suspension, protects last active `super_admin` with `SELECT ... FOR UPDATE`, revokes `schema.sessions`, invalidates Redis `profile:slug:<slug>` and `profile:notfound:<slug>`, and records `admin:user_status_<status>` inside the same transaction.

---

## 5. Profile Management Verification

- **List & Search (`getAllProfiles`):** Parameterized `ilike` on `displayName`, `slug`, `users.name`, `users.email` with `leftJoin(users)` (1:1 owner relationship, no row multiplication), `page`/`pageSize` clamped, deterministic `orderBy(desc(schema.profiles.createdAt))`.
- **Details (`getProfileDetails`):** Returns `profile`, `owner`, `businesses: []`, `cards` (`id, serialNumber, status, createdAt` — no `permanentToken`), and `activityLogs`.
- **Status Mutation (`updateProfileStatus`):** Zod-validated `{ status: 'PUBLISHED' | 'DRAFT' }`, transactional `SELECT ... FOR UPDATE`, records `admin:profile_status_update`, invalidates Redis `profile:slug:<slug>` and `profile:notfound:<slug>`, and leaves NFC tokens/cards untouched.

---

## 6. Cache Invalidation & Transaction Analysis

- Both `updateUserStatus` and `updateProfileStatus` wrap DB writes + `ActivityLogService.record(..., tx)` in `this.dbService.db.transaction(...)` and invalidate Redis keys (`profile:slug:<slug>`, `profile:notfound:<slug>`) after commit.
- Real PostgreSQL rollback-on-audit-failure behavior is **UNVERIFIED** by a database integration test.

---

## 7. Frontend Workflow Verification

- `AdminLayout.tsx` and `routes/index.tsx` mount `/admin/dashboard`, `/admin/users`, and `/admin/profiles` inside `ProtectedRoute` + `AdminLayout`, with nav items filtered by `can(item.permission)`.
- `AdminDashboardPage.tsx`, `AdminUsersPage.tsx`, and `AdminProfilesPage.tsx` implement loading skeletons/states, error + retry states, empty states, server-side search/filter/pagination (resetting `page` to 1 on filter changes), and confirmation modals for status mutations.
- **Dedicated Frontend Tests:** **UNVERIFIED** — No dedicated Vitest/RTL component tests were added for these 3 new pages.

---

## 8. Test Coverage by Category

- **Unit & Guard Tests:** `backend/src/tests/phase2-admin-dashboard-users-profiles.test.ts` (4 tests: `PermissionsGuard` 403s, `getDashboardOverview` activity gating, `updateUserStatus` session/cache/audit, `updateProfileStatus` cache/audit).
- **Controller / Guard Integration Tests:** Prototype metadata + `Reflector` + `PermissionsGuard` unit-level checks.
- **Database Integration Tests:** **None** for Phase 2 queries, pagination, or audit-failure rollback (**UNVERIFIED**).
- **Frontend Component Tests:** **None** for `AdminDashboardPage`, `AdminUsersPage`, or `AdminProfilesPage` (**UNVERIFIED**).

---

## 9. Build & Test Results

- `npm --prefix backend run typecheck`: **PASSED** (exit code 0)
- `npm --prefix backend test`: **PASSED** (18 test files, 113 tests passed)
- `npm --prefix backend run build`: **PASSED** (`nest build`, exit code 0)
- `npm --prefix frontend test -- --run`: **PASSED** (24 test files, 151 tests passed)
- `npm --prefix frontend run build`: **PASSED** (`tsc && vite build`, exit code 0)

---

## 10. Files Inspected

- `backend/src/modules/admin/admin.controller.ts`
- `backend/src/modules/admin/admin.service.ts`
- `backend/src/modules/admin/activity-log.service.ts`
- `backend/src/common/guards/permissions.guard.ts`
- `backend/src/common/rbac/permissions.ts`
- `backend/src/tests/phase2-admin-dashboard-users-profiles.test.ts`
- `frontend/src/pages/admin/AdminDashboardPage.tsx`
- `frontend/src/pages/admin/AdminUsersPage.tsx`
- `frontend/src/pages/admin/AdminProfilesPage.tsx`
- `frontend/src/layouts/AdminLayout.tsx`
- `frontend/src/routes/index.tsx`

---

## 11. Remaining Risks & Recommended Fixes

1. **Deployment-Readiness Checklist (Phase 1.3 + Phase 2.1):** Add real PostgreSQL/PGlite integration tests for:
   - `updateAdminRole()` concurrent last-super-admin protection.
   - Audit-failure transaction rollback in `updateAdminRole()`, `updateUserStatus()`, and `updateProfileStatus()`.
   - `getAllUsers()` / `getAllProfiles()` combined filters and pagination.
2. **Frontend Component Tests:** Add Vitest/RTL tests for `AdminDashboardPage`, `AdminUsersPage`, and `AdminProfilesPage` covering search, pagination reset, confirmation modals, and error states.
