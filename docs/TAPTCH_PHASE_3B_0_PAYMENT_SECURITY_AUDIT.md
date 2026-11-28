# TAPTCH — PHASE 3B.0 PAYMENT SECURITY & ARCHITECTURE AUDIT

**Mode:** Read-Only Security & Architecture Audit  
**Date:** 2026-11-28

---

## 1. Exact Files & Functions Inspected

- `backend/src/modules/orders/orders.controller.ts`: `verifyPayment`
- `backend/src/modules/orders/orders.service.ts`: `verifyPayment` (lines 629-720+)
- `backend/src/modules/admin/admin.controller.ts`: `updateOrderPayment`, `updateOrderPaymentSchema`
- `backend/src/modules/admin/admin.service.ts`: `updateOrderPayment` (lines 961-1025)
- `backend/src/database/schema/orders.ts`: `orders`, `orderStatusHistory`, `payments`
- `frontend/src/pages/CheckoutPage.tsx`: checkout & payment method selection

---

## 2. Existing Payment Architecture & Lifecycle

- Orders are created with `orderStatus = 'ORDER_PLACED'` (or `'PAYMENT_PENDING'`), `paymentStatus = 'PENDING'` (or `'COD_PENDING'`), and a `payments` row.
- Online verification (`POST /api/v1/orders/:id/verify-payment`) verifies Razorpay HMAC-SHA256 signatures (`razorpay_order_id|razorpay_payment_id`) inside `withActor()` with `SELECT ... FOR UPDATE`.
- Manual admin overrides (`PATCH /api/v1/admin/orders/:id/payment`) require `finance.manage`.

---

## 3. Endpoint & Permission Matrix

| Method & Route | Handler | Guards / Permission |
| :--- | :--- | :--- |
| `POST /api/v1/orders/:id/verify-payment` | `OrdersController.verifyPayment` | `AuthGuard` (owner or `admin`/`super_admin`) |
| `PATCH /api/v1/admin/orders/:id/payment` | `AdminController.updateOrderPayment` | `AuthGuard`, `RolesGuard`, `PermissionsGuard` (`finance.manage`) |

---

## 4. Payment Gateway Verification Findings

- **VERIFIED:** `OrdersService.verifyPayment()` (`orders.service.ts:629-720`) uses `withActor()` + `.for('update')`, rejects `CANCELLED`/`REFUNDED`, is idempotent on `PAID`, and uses `crypto.timingSafeEqual` for HMAC-SHA256.
- **HIGH:** No backend Razorpay order-creation API or webhook endpoint exists; `verifyPayment()` does not verify `razorpay_order_id` against a persisted `gatewayOrderId` or fetch the captured payment amount/currency from Razorpay's API.

---

## 5. Refund Lifecycle Findings

- **MEDIUM (by design / deferred):** No automated Razorpay refund API integration exists; `REFUNDED` is set manually via `PATCH /api/v1/admin/orders/:id/payment`.

---

## 6. Database Integrity Findings

- **HIGH:** `AdminService.updateOrderPayment()` (`admin.service.ts:961-1025`) does **not** use `this.dbService.db.transaction(...)` or `.for('update')`, and does **not** record an `auditLogs` entry via `ActivityLogService.record(..., tx)`.

---

## 7. Frontend Payment-Flow Findings

- `CheckoutPage.tsx` supports `razorpay`, `upi`, and `cod`, and relies on backend `verifyPayment` for online confirmation.

---

## 8. Classified Security Findings

- **HIGH:** `verifyPayment()` does not verify `razorpay_order_id` against a persisted `gatewayOrderId` or validate captured amount/currency via Razorpay's API (`orders.service.ts:670-700`).
- **HIGH:** `AdminService.updateOrderPayment()` is non-transactional, lacks `.for('update')`, and lacks `ActivityLogService.record(..., tx)` (`admin.service.ts:961-1025`).
- **MEDIUM:** No Razorpay webhook endpoint (`POST /webhooks/razorpay`) for asynchronous payment/refund reconciliation.
- **VERIFIED:** `verifyPayment()` HMAC timing-safe check, `CANCELLED`/`REFUNDED` rejection, `PAID` idempotency, and `finance.manage` RBAC on `PATCH /api/v1/admin/orders/:id/payment`.

---

## 9. Recommended Implementation Sequence

1. **Phase 3B.1 (Immediate Hardening):** Wrap `AdminService.updateOrderPayment()` in `this.dbService.db.transaction(...)` with `.for('update')`, `ActivityLogService.record(..., tx)`, and `REFUNDED` transition guards.
2. **Phase 3B.2 (Gateway & Webhooks):** Add Razorpay order creation (`gatewayOrderId` persistence), server-side Razorpay payment fetch/amount verification, and signed webhook handling.

---

## 10. Final Verdict

**CONDITIONALLY APPROVED** — Existing `verifyPayment()` signature/idempotency controls and `finance.manage` RBAC are sound, but `AdminService.updateOrderPayment()` must be made transactional with audit logging before Phase 3B financial operations.
