# TAPTCH — PHASE 3A.2 IMPLEMENTATION REPORT

**Phase:** 3A.2 — Order Payment Isolation & Transition Safety Fix  
**Date:** 2026-11-28  
**Status:** COMPLETED & VERIFIED

---

## 1. Exact Files Modified

- `backend/src/modules/admin/admin.controller.ts`
- `backend/src/modules/admin/admin.service.ts`
- `backend/src/tests/phase3a-orders-db.test.ts`

---

## 2. Before / After Behavior

| Finding | Before | After |
| :--- | :--- | :--- |
| **HIGH:** `PATCH /api/v1/admin/orders/:id` payment mutation | `updateOrderLegacySchema` accepted optional `paymentStatus`, and `updateOrderStatus()` wrote `paymentStatus` to `schema.orders`. | `paymentStatus` removed from `updateOrderLegacySchema` (now `.strict()`) and `updateOrderStatus()`. Unexpected properties are rejected with `400 Bad Request`. |
| **MEDIUM:** Unpaid online order progression | `ORDER_STATUS_TRANSITIONS` allowed `PAYMENT_PENDING -> ORDER_CONFIRMED / CARD_PRODUCTION` regardless of payment method/status. | Added `assertPaymentEligibleForOrderProgression(order)` in both `updateOrderStatus()` and `updateOrderFulfillment()`, blocking unpaid online orders (`paymentMethod` not `cod`/`offline` and `paymentStatus` not `PAID`/`WAIVED`) from entering production/fulfillment. |
| **LOW:** `trackingUrl` scheme validation | `updateOrderFulfillmentSchema` only checked `max(500)`. | Added `new URL(val)` validation requiring `http:` or `https:` protocol when `trackingUrl` is provided. |

---

## 3. Payment Isolation Verification

- `PATCH /api/v1/admin/orders/:id` (`updateOrderLegacySchema.strict()`) accepts only `{ status }` and rejects `paymentStatus` or any unexpected property.
- `PATCH /api/v1/admin/orders/:id/fulfillment` (`updateOrderFulfillmentSchema`) accepts only fulfillment/shipping fields and never writes `paymentStatus`.
- `PATCH /api/v1/admin/orders/:id/payment` remains the sole endpoint for manual payment updates, protected by `@RequirePermissions('finance.manage')`.

---

## 4. COD vs. Online-Payment Transition Rules

- **Online orders** (`razorpay`, `upi`, etc.): Must have `paymentStatus` in `['PAID', 'WAIVED']` before transitioning to `ORDER_CONFIRMED`, `DESIGN_REVIEW`, `CARD_PRODUCTION`, `CARD_READY`, `DISPATCHED`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, or `DELIVERED`.
- **COD / Offline orders** (`paymentMethod === 'cod' | 'offline'`): Remain eligible for production and fulfillment even while `paymentStatus === 'COD_PENDING'` or `'PENDING'`.

---

## 5. Tests Added & Exact Results

- `backend/src/tests/phase3a-orders-db.test.ts` (**4/4 passed**, PGlite + controller unit/integration):
  - Rejects `paymentStatus` on `AdminController.updateOrder`.
  - Verifies `AdminController.updateOrderPayment` retains `finance.manage`.
  - Rejects `javascript:` tracking URLs and accepts `https://` tracking URLs.
  - Blocks unpaid online order (`razorpay` + `PENDING`) from advancing into `ORDER_CONFIRMED`.
  - Allows eligible COD order (`cod` + `COD_PENDING`) to advance into `CARD_PRODUCTION` while preserving `COD_PENDING`.
  - Verifies audit-failure rollback on `updateOrderStatus()`.

---

## 6. Build & Typecheck Results

- `npm --prefix backend run typecheck`: **PASSED** (exit code 0)
- `npm --prefix backend test`: **PASSED** — **20 test files, 122 tests passed**
- `npm --prefix backend run build`: **PASSED** (`nest build`, exit code 0)
- `npm --prefix frontend test -- --run`: **PASSED** (exit code 0)
- `npm --prefix frontend run build`: **PASSED** (`tsc && vite build`, exit code 0)

---

## 7. Remaining Risks & Unverified Claims

- Concurrent multi-connection PostgreSQL locking tests (for `updateAdminRole`, `updateOrderStatus`, `updateOrderFulfillment`) still require staging verification against independent PostgreSQL connections (PGlite runs in-process).
