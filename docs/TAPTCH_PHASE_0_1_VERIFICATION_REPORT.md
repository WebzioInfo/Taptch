# TAPTCH — Phase 0.1: Independent Security & Integrity Verification Report

**Date**: 2026-11-28  
**Reviewer Role**: Independent Security & Architecture Verification  
**Files Changed in Phase 0.1**: None (verification-only pass; `docs/TAPTCH_PHASE_0_1_VERIFICATION_REPORT.md` created).

---

## 1. Verification Results by Area

### 1.1 Payment Verification (`backend/src/modules/orders/orders.service.ts`)
- **Tests Performed**: Code inspection of `OrdersService.verifyPayment` + `phase0-security-and-integrity.test.ts` + `orders-flow.test.ts` + `journey-and-entitlements.test.ts`.
- **Actual Results**:
  - Production UPI simulator blocked (`NODE_ENV !== 'production' && ALLOW_UPI_TEST_SIMULATOR === 'true'`).
  - Missing `RAZORPAY_KEY_SECRET`, missing `razorpay_order_id`/`razorpay_signature`, and invalid HMAC signatures are rejected (`ServiceUnavailableException` / `BadRequestException` using `crypto.timingSafeEqual`).
  - `CANCELLED` orders and `REFUNDED` payments are rejected before any mutation.
  - Repeated `verifyPayment` calls on `PAID` orders return idempotently without duplicating `payments` or `order_status_history`.
- **Remaining Risk**: `verifyPayment` checks `order.paymentStatus === 'PAID'` inside `withActor` without `SELECT ... FOR UPDATE` row locking; under extreme simultaneous callbacks, two concurrent transactions could both read `PENDING` before the first commits.

### 1.2 NFC Lifecycle & Token Uniqueness (`cards.service.ts`, `orders.service.ts`, `profiles.service.ts`)
- **Tests Performed**: Code inspection + `nfc-destinations.test.ts` (6 tests) + `phase0-security-and-integrity.test.ts` + `profiles.service.test.ts` (17 tests).
- **Actual Results**:
  - `ProfilesService.update()` no longer overwrites `purchasedCards.nfcUrl` on slug rename.
  - `allocatePurchasedCards()` generates 128-bit (`32`-char hex) tokens, checks both `cards` and `purchased_cards`, retries up to 5 times on `23505` collision, and throws `InternalServerErrorException` instead of silently dropping cards.
  - `linkCardToProfile()` requires `activationCode` for unowned `cards`, hashes with SHA-256 + `crypto.timingSafeEqual`, locks out after 5 failures/hour in `activation_attempts`, and performs an atomic `isNull(ownerUserId)` claim.
- **Remaining Cross-Table Uniqueness Risk**: PostgreSQL cannot enforce a single `UNIQUE` constraint across two separate tables (`cards.redirect_token` and `purchased_cards.redirect_token`). While `allocatePurchasedCards` checks both tables, a concurrent physical batch insert into `cards` could theoretically collide between `SELECT` and `INSERT`. A shared `nfc_tokens` registry table is the long-term fix.

### 1.3 User Suspension & Public Access (`admin.service.ts`, `auth.service.ts`, `profiles.service.ts`, `cards.service.ts`)
- **Tests Performed**: Code inspection + `phase0-security-and-integrity.test.ts`.
- **Actual Results**:
  - Suspending a user deletes `sessions` rows, invalidates Redis `profile:slug:*` and `profile:notfound:*` keys, and leaves `profiles.status` untouched so reactivation restores only previously published profiles.
  - `AuthService.getSession()` returns `null` and `signIn()` rejects suspended/deactivated users.
  - `ProfilesService.findBySlug()` and `CardsService.resolvePublicNfcToken()` check `users.status` and block public/NFC access while suspended.
- **Remaining Risk**: `RedisService` falls back to a per-process `Map` when `USE_IN_MEMORY_REDIS=true` or Redis is unreachable; multi-instance cache invalidation requires a shared Redis instance.

### 1.4 Upload Security (`uploads.service.ts`)
- **Tests Performed**: Code inspection + `uploads.service.test.ts` (6 tests) + `phase0-security-and-integrity.test.ts`.
- **Actual Results**:
  - `UploadsService.delete()` enforces `existing.ownerId === actor.userId || actor.isAdmin`, rejecting unauthorized users with `ForbiddenException`.
  - `CloudinaryStorageService.deleteByPublicId()` is best-effort so Cloudinary network errors do not leave orphaned DB rows.

### 1.5 Financial Data (`admin.service.ts`, `finance.ts`)
- **Tests Performed**: Code inspection + `phase0-security-and-integrity.test.ts`.
- **Actual Results**:
  - Hardcoded `₹999`/`₹2499` unit prices and legacy `'paid_offline'`/`'unpaid'` checks are removed from `getFinancialSummary()`.
  - `CANCELLED` orders are excluded from active sales; `grossSales`, `refundedAmount`, `collectedRevenue` (`PAID`/`COD_COLLECTED`), and `outstandingRevenue` (`COD_PENDING`/`PENDING`) are separated.
  - Note: `UNIT_COGS_BY_MATERIAL` (`metal: 450, wood: 250, pvc/matte: 150`) remains an explicit unit-cost assumption in `admin.service.ts`.

### 1.6 Rate Limiting (`app.module.ts`, `auth.controller.ts`, `leads.controller.ts`, `profiles.controller.ts`, `health.controller.ts`)
- **Tests Performed**: Code inspection of `ThrottlerModule` configuration.
- **Actual Results**:
  - Global `ThrottlerGuard` (`120 req/min`) is active, with strict `10 req/min` on auth, OAuth exchange/verify, and public lead/exchange endpoints, and `@SkipThrottle()` on `by-slug/:slug` and `/api/health`.
- **Limitation**: `ThrottlerModule.forRoot(...)` uses NestJS's default **process-local in-memory storage**. Across multiple backend instances, rate-limit counters are per-instance unless a Redis `ThrottlerStorage` adapter is configured.

### 1.7 Authorization (`ProtectedRoute.tsx`, `routes/index.tsx`, `admin.controller.ts`, `support.controller.ts`)
- **Tests Performed**: Code inspection + `protected-route.test.tsx` (2 tests) + `phase0-security-and-integrity.test.ts`.
- **Actual Results**:
  - `/admin` (`super_admin`, `admin`) and `/support` (`support_admin`, `super_admin`, `admin`) are wrapped in `<ProtectedRoute allowedRoles={...} />`.
  - Backend `AuthGuard` + `RolesGuard` remain the authoritative boundary, and `AdminService.updateUserStatus()` blocks self-suspension and suspending the last active `super_admin`.

### 1.8 Database Schema (`finance.ts`)
- **Tests Performed**: Live PostgreSQL `information_schema.columns` check + Drizzle schema inspection.
- **Actual Results**: `financial_transactions.reference_number` (`character varying`) matches the fixed Drizzle mapping `varchar('reference_number', { length: 128 })`. No existing records were deleted or corrupted.

### 1.9 Regression Suite
- **Backend (`npm --prefix backend test`)**: **15 test files, 95 tests passed** (covering auth/OAuth, profiles, publishing, NFC resolution, card attachment, products, studio, orders, addresses, uploads, and Phase 0 security).
- **Frontend (`npm --prefix frontend test -- --run`)**: **23 test files, 149 tests passed** (covering builder, templates, public profile, studio, checkout, orders, and protected routes).

---

## 2. Special Attention: Safest Minimum Fix for Cancelled / Refunded Card Revocation

**Confirmed Gap**: Cancelling a COD order (`OrdersService.cancelOrder`) or marking an order `REFUNDED` (`AdminService.updateOrderPayment`) currently leaves `purchased_cards` rows attachable and resolvable via `resolvePublicNfcToken`.

**Safest Minimum Fix (Zero History Deletion)**:
1. In `CardsService.resolvePublicNfcToken()` (`cards.service.ts` `purchasedCard` branch): query the parent `orders` row (`orderStatus`, `paymentStatus`); if `orderStatus === 'CANCELLED' || paymentStatus === 'REFUNDED'`, return `{ status: 'unavailable', destinationType: null, destinationUrl: null }`.
2. In `CardsService.attachProfileToPurchasedCard()` & `setPurchasedCardDestination()`: reject configuration (`BadRequestException`) if the parent order is `CANCELLED` or `REFUNDED`.
3. In `OrdersService.cancelOrder()` and `AdminService.updateOrderPayment(..., 'REFUNDED')`: unlink `purchased_cards` (`profileId: null, profileAssignmentStatus: 'AWAITING_PROFILE'`) without deleting `purchased_cards` or `orders` rows.

---

## 3. Verdict: Is Phase 0 Safe to Approve?

**YES — Conditional Approval**: All 10 Phase 0 security and data-integrity hotfixes are verified and passing all 95 backend tests and 149 frontend tests. Before or alongside Phase 1, apply the 3-point minimum fix above for cancelled/refunded `purchased_cards` revocation, and note the process-local throttler and `SELECT ... FOR UPDATE` concurrency hardening for production scale.
