# TAPTCH — Phase 0: Security & Data Integrity Implementation Report

**Date**: 2026-11-28  
**Scope**: Phase 0 critical security & data-integrity hotfixes (Tasks 1–10) prior to Phase 1 Admin Module work.

---

## 1. Issues Addressed & Exact Files Modified

| Task | Issue Addressed | Files Modified / Created |
|---|---|---|
| **Task 1 — Upload Deletion IDOR** | `UploadsService.delete()` deleted `media_assets` by `id` without verifying `ownerId === actor.userId`. Added `ForbiddenException` ownership check (allowing `actor.isAdmin` override) before Cloudinary & DB deletion. | `backend/src/modules/uploads/uploads.service.ts` |
| **Task 2 — Secure Payment Verification** | `OrdersService.verifyPayment()` now rejects `CANCELLED` orders and `REFUNDED` payments; enforces mandatory `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`, and `RAZORPAY_KEY_SECRET` with `crypto.timingSafeEqual`; prevents duplicate payment/history writes on repeated `PAID` calls; gates UPI simulator behind `NODE_ENV !== 'production' && ALLOW_UPI_TEST_SIMULATOR === 'true'`. | `backend/src/modules/orders/orders.service.ts` |
| **Task 3 — Secure NFC Card Claiming** | `CardsService.linkCardToProfile()` now requires a valid `activationCode` for unowned (`ownerUserId = null`) physical `cards`, verifies against `activationCodeHash` via `crypto.timingSafeEqual`, logs attempts to `activation_attempts`, enforces a 5-failure/hour lockout, performs an atomic single-use `isNull(ownerUserId)` claim, and logs `card_assignments`. Existing `purchased_cards` attachment flow preserved. | `backend/src/modules/cards/cards.service.ts`, `backend/src/modules/cards/cards.controller.ts` |
| **Task 4 — Permanent NFC URL Integrity** | Stopped `ProfilesService.update()` from overwriting `purchasedCards.nfcUrl` on slug rename. Updated `OrdersService.allocatePurchasedCards()` to generate 128-bit (`crypto.randomBytes(16).toString('hex')`) tokens, check uniqueness across both `cards` and `purchased_cards`, retry up to 5 times on collision instead of `.onConflictDoNothing()`, set permanent `nfcUrl` (`/p/{token}`), and throw on allocation failure. | `backend/src/modules/profiles/profiles.service.ts`, `backend/src/modules/orders/orders.service.ts` |
| **Task 5 — User Suspension & Public Access** | `AdminService.updateUserStatus()` revokes all `sessions` rows and invalidates Redis `profile:slug:*` / `profile:notfound:*` keys without mutating `profiles.status`. `AuthService.getSession()` returns `null` for suspended/deactivated users. `ProfilesService.findBySlug()` and `CardsService.resolvePublicNfcToken()` check `users.status` and block public profile/NFC resolution while suspended, restoring visibility automatically on reactivation. | `backend/src/modules/admin/admin.service.ts`, `backend/src/modules/auth/auth.service.ts`, `backend/src/modules/profiles/profiles.service.ts`, `backend/src/modules/cards/cards.service.ts` |
| **Task 6 — Financial Summary** | Replaced hardcoded `₹999`/`₹2499` unit prices and legacy `'paid_offline'`/`'unpaid'` checks in `AdminService.getFinancialSummary()` with persisted `orders.totalAmount`, excluding `CANCELLED` orders from active sales and separating `grossSales`, `refundedAmount`, `collectedRevenue` (`PAID` / `COD_COLLECTED`), and `outstandingRevenue` (`COD_PENDING` / `PENDING`). | `backend/src/modules/admin/admin.service.ts` |
| **Task 7 — Drizzle Schema Bug** | Fixed `financialTransactions.referenceNumber` from `varchar('128')` to `varchar('reference_number', { length: 128 })`. Verified live PostgreSQL `financial_transactions` already has column `reference_number`, so no destructive migration was needed. | `backend/src/database/schema/finance.ts` |
| **Task 8 — API Rate Limiting** | Mounted `ThrottlerModule` + global `APP_GUARD` `ThrottlerGuard` in `AppModule`, applied strict `@Throttle({ default: { limit: 10, ttl: 60000 } })` to auth (`sign-in`, `sign-up`, `oauth/exchange-code`, `oauth/google/verify-token`) and public lead/exchange endpoints, and `@SkipThrottle()` to public profile viewing (`by-slug/:slug`) and `/api/health`. | `backend/src/app.module.ts`, `backend/src/modules/auth/auth.controller.ts`, `backend/src/modules/leads/leads.controller.ts`, `backend/src/modules/profiles/profiles.controller.ts`, `backend/src/modules/health/health.controller.ts` |
| **Task 9 — Admin & Support Input Validation** | Added Zod validation helper `parseWithZod` and schemas across `AdminController`, `SupportController`, and `ProfilesController`. Enforced allowed user/order status enums, prevented admin self-suspension, prevented suspending/deactivating the last active `super_admin`, and logged `admin:order_status_update` to `audit_logs`. | `backend/src/common/validation/zod-validate.ts`, `backend/src/modules/admin/admin.controller.ts`, `backend/src/modules/admin/admin.service.ts`, `backend/src/modules/support/support.controller.ts`, `backend/src/modules/profiles/profiles.controller.ts` |
| **Task 10 — Frontend Route Protection** | Extended `ProtectedRoute` with `allowedRoles?: string[]` and wrapped `/admin` (`super_admin`, `admin`) and `/support` (`support_admin`, `super_admin`, `admin`) in `frontend/src/routes/index.tsx`. Backend guards remain the authoritative boundary. | `frontend/src/components/auth/ProtectedRoute.tsx`, `frontend/src/routes/index.tsx` |

---

## 2. Database Changes & Migration Details
- **Live Schema Verification**: Inspected `information_schema.columns` on `financial_transactions` — column `reference_number` (`character varying`) already exists in PostgreSQL. Fixed the Drizzle mapping in `backend/src/database/schema/finance.ts` with zero table drops or destructive migrations.
- **No Existing Records Deleted or Modified**: All existing user profiles, orders, and NFC tokens (`cards`: 0 rows, `purchased_cards`: 1 row) were preserved intact.

---

## 3. Tests Added & Verification Results
- **New Backend Security & Integrity Suite**: `backend/src/tests/phase0-security-and-integrity.test.ts` (13 tests covering Tasks 1–6 & 9).
- **New Frontend Route Guard Suite**: `frontend/src/tests/protected-route.test.tsx` (2 tests covering Task 10).
- **Updated Existing Tests for New Security Rules**: `backend/src/tests/orders-flow.test.ts` (valid Razorpay HMAC & `ALLOW_UPI_TEST_SIMULATOR=true`), `backend/src/tests/journey-and-entitlements.test.ts` (`ALLOW_UPI_TEST_SIMULATOR=true`), `backend/src/tests/profiles.service.test.ts` (owner status mock).

### Executed Commands & Actual Results
1. `npm --prefix backend run typecheck` → **Passed** (0 errors).
2. `npm --prefix backend test` → **Passed** (**15 test files, 95 tests passed**).
3. `npm --prefix backend run build` → **Passed** (`nest build` succeeded).
4. `npm --prefix frontend test -- --run` → **Passed** (**23 test files, 149 tests passed**).
5. `npm --prefix frontend run build` → **Passed** (`tsc && vite build` succeeded).

---

## 4. Remaining Vulnerabilities & Deferred Items (For Phase 1+)
- **PostgreSQL Row-Level Security (RLS) Policies**: `withActor()` sets `app.current_user_id`, but database-level `ROW LEVEL SECURITY` policies are not yet defined in migrations (deferred to dedicated DB security migration).
- **Cross-Table DB Unique Constraint on NFC Tokens**: Application-level check + retry across `cards` and `purchased_cards` is active; a shared `nfc_tokens` registry table is recommended if physical batch provisioning scales.
- **Order Cancellation / Refund Card Revocation & Ledger**: Cancelling a COD order or marking an order `REFUNDED` still needs transactional `purchased_cards` revocation and `financial_transactions` ledger entries (planned for Phase 3).
- **Token Storage in `localStorage`**: `taptch_session_token` is still mirrored in `localStorage` alongside `HttpOnly` cookies for cross-domain bearer compatibility.
- **Lint Scripts**: Neither `backend/package.json` nor `frontend/package.json` defines a `lint` script; TypeScript strict checks (`tsc --noEmit` / `tsc`) were run instead.

Phase 0 is complete. Awaiting your approval before starting Phase 1.
