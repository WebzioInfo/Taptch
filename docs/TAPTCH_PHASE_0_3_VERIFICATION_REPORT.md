# TAPTCH — Phase 0.3: Payment Security & Production Readiness Verification Report

**Date**: 2026-11-28  
**Scope**: Read-only verification of transaction integrity, gateway authenticity, refund/fulfillment state, and production deployment readiness prior to Phase 1.  
**Files Modified**: None (verification-only pass).

---

## 1. Payment Transaction Integrity
- **Inspected**: `DatabaseService.withActor()` (`backend/src/database/database.service.ts:70-79`), `OrdersService.verifyPayment()` (`backend/src/modules/orders/orders.service.ts:629-745`).
- **Evidence**:
  - `withActor()` wraps all queries in `this.db.transaction(async (tx) => ...)`.
  - `verifyPayment()` executes `tx.select().from(schema.orders).where(eq(schema.orders.id, orderId)).for('update').limit(1)` inside `tx`.
  - `orders`, `payments`, `orderStatusHistory`, and `purchasedCards` writes all execute on the same `tx` handle; any thrown exception rolls back the entire transaction.
- **Result**: **PROVEN** for PostgreSQL (`drizzle-orm/postgres-js`).

## 2. Gateway Payment Authenticity
- **Inspected**: `OrdersService.verifyPayment()` (`backend/src/modules/orders/orders.service.ts:670-698`).
- **Verified**:
  - Requires `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`, and `RAZORPAY_KEY_SECRET`.
  - Verifies HMAC-SHA256(`${razorpay_order_id}|${razorpay_payment_id}`) using `crypto.timingSafeEqual`.
- **Confirmed Gaps**:
  1. **High — Missing Gateway Order ID Binding**: `verifyPayment()` does **not** verify that `data.razorpay_order_id` matches the persisted `payments.gatewayOrderId` for `orderId`. A valid signature from a lower-value Razorpay order could be replayed against a higher-value order.
  2. **High — No Gateway Capture / Amount / Currency Verification**: `verifyPayment()` does **not** fetch `GET https://api.razorpay.com/v1/payments/{razorpay_payment_id}` (or verify a Razorpay webhook) to confirm `status === 'captured'`, `amount === order.totalAmount * 100`, and `currency === order.currency`. (Note: Razorpay SDK integration is currently deferred, so this must be enforced before enabling live Razorpay payments.)

## 3. Refund & Fulfillment Integrity
- **Inspected**: `AdminService.updateOrderPayment()`, `AdminService.updateOrderStatus()` (`backend/src/modules/admin/admin.service.ts`), `CardsService` (`backend/src/modules/cards/cards.service.ts`).
- **Verified**:
  - Pre-fulfillment `REFUNDED` and `cancelOrder()` set `purchased_cards.profileAssignmentStatus = 'REVOKED'`, `profileId = null`, `destinationType = null` without deleting historical records.
  - `CardsService` blocks `REVOKED`, `CANCELLED`, and `REFUNDED` cards in `resolvePublicNfcToken()`, `attachProfileToPurchasedCard()`, and `setPurchasedCardDestination()`.
  - Post-fulfillment (`DISPATCHED`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`) refunds preserve physical card history.
- **Confirmed Gaps**:
  1. **Medium — Admin Status Reversal**: `AdminService.updateOrderPayment()` does not block `REFUNDED -> PAID`, and `AdminService.updateOrderStatus()` (`PATCH /api/v1/admin/orders/:id`) does not block transitioning a `CANCELLED` or `REFUNDED` order back to `ORDER_CONFIRMED` / `PAID`.
  2. **Low — Return/Recovery Tracking**: Post-fulfillment refunded cards have no explicit `returnRequired` / `recoveryStatus` flag yet (only `orderStatusHistory`).

## 4. Production Deployment Readiness
- **Inspected**: `backend/.env.production.example`, `backend/Dockerfile`, `backend/src/app.module.ts`, `backend/src/database/redis.service.ts`.
- **Findings**:
  - **Instance Count**: Repo targets a single Docker container (`PORT=4000`); actual live replica count in production is **unknown** from source code.
  - **Shared Redis**: `.env.production.example:34-35` sets `REDIS_URL=redis://localhost:6379` and `USE_IN_MEMORY_REDIS=true`.
  - **Throttler**: `@nestjs/throttler` uses process-local memory.
  - **`USE_IN_MEMORY_REDIS=true` in Production**: **Not appropriate** for multi-instance deployments (causes per-instance cache drift for user suspension invalidation, OAuth exchange tickets, and profile snapshots).
- **Required Before Horizontal Scaling**:
  1. Provision a shared Redis instance, set `REDIS_URL`, and set `USE_IN_MEMORY_REDIS=false`.
  2. Configure a Redis-backed `ThrottlerStorage` adapter for `@nestjs/throttler`.

## 5. Recommended Minimal Fixes & Verdict
1. **Before Live Razorpay**: Bind `razorpay_order_id` to `payments.gatewayOrderId` and verify captured `amount`, `currency`, and `status === 'captured'` via Razorpay API/webhook.
2. **In Phase 1 / 3**: Block `CANCELLED`/`REFUNDED` state reversals in `AdminService.updateOrderStatus()` and `updateOrderPayment()`, and add a `recoveryStatus` flag for post-fulfillment refunds.

**Verdict**: **READY WITH DEPLOYMENT CONDITIONS** — Phase 0.2 transaction locking, card revocation, and auth/upload/financial hardening are solid for starting **Phase 1 (Admin Module)**, provided `USE_IN_MEMORY_REDIS=false` + shared Redis is used in multi-instance production and live Razorpay capture/order-binding checks are added before enabling real online payments.
