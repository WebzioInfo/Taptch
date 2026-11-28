# TAPTCH — PHASE 3A.1 VERIFICATION REPORT

**Mode:** Independent Read-Only Security & Workflow Audit  
**Date:** 2026-11-28  
**Target:** Phase 3A — Order Management & Fulfillment

---

## 1. Exact Files & Functions Inspected

- `backend/src/modules/admin/admin.controller.ts`: `getOrders`, `getOrderById`, `updateOrder`, `updateOrderFulfillment`, `updateOrderLegacySchema`, `updateOrderFulfillmentSchema`
- `backend/src/modules/admin/admin.service.ts`: `ORDER_STATUS_TRANSITIONS`, `SHIPPING_REQUIRED_STATUSES`, `getAllOrders`, `getOrderById`, `updateOrderFulfillment`, `updateOrderStatus`
- `backend/src/tests/phase3a-orders-db.test.ts`
- `frontend/src/pages/admin/AdminOrdersPage.tsx`
- `frontend/src/tests/admin-orders-page.test.tsx`

---

## 2. Endpoint & Permission Verification Matrix

| Method & Route | Handler | Guards | Required Permission |
| :--- | :--- | :--- | :--- |
| `GET /api/v1/admin/orders` | `getOrders` | `AuthGuard`, `RolesGuard`, `PermissionsGuard` | `orders.view` |
| `GET /api/v1/admin/orders/:id` | `getOrderById` | `AuthGuard`, `RolesGuard`, `PermissionsGuard` | `orders.view` |
| `PATCH /api/v1/admin/orders/:id` | `updateOrder` | `AuthGuard`, `RolesGuard`, `PermissionsGuard` | `orders.manage` |
| `PATCH /api/v1/admin/orders/:id/fulfillment` | `updateOrderFulfillment` | `AuthGuard`, `RolesGuard`, `PermissionsGuard` | `orders.manage` |

---

## 3. Payment Isolation Findings

- **`updateOrderFulfillment()` (`PATCH /api/v1/admin/orders/:id/fulfillment`):** **VERIFIED** — `updateOrderFulfillmentSchema` and `updateFields` only permit `orderStatus`, `courierName`, `trackingNumber`, `trackingUrl`, `internalNotes`, `title`, and `description`. `paymentStatus` cannot be modified.
- **`updateOrderStatus()` (`PATCH /api/v1/admin/orders/:id`):** **HIGH** — `updateOrderLegacySchema` (`admin.controller.ts:35-53`) still accepts optional `paymentStatus`, and `AdminService.updateOrderStatus()` still writes `paymentStatus: (paymentStatus as any) || undefined`. While `AdminOrdersPage.tsx` does not call this endpoint, the backend route still permits `orders.manage` callers to alter `paymentStatus`.

---

## 4. Transition Matrix Assessment

- `CANCELLED` and `DELIVERED` map to `[]` (terminal; cannot be reopened).
- **MEDIUM:** `ORDER_STATUS_TRANSITIONS` allows `PAYMENT_PENDING -> ORDER_CONFIRMED / DESIGN_REVIEW / CARD_PRODUCTION`, which permits an admin to advance an unpaid `PAYMENT_PENDING` order without payment confirmation.

---

## 5. Transaction, Locking & Audit Rollback Findings

- Both `updateOrderFulfillment()` and `updateOrderStatus()` execute inside `this.dbService.db.transaction(async (tx: any) => ...)` with `.for('update')`, validate transitions against `existing.orderStatus`, insert `schema.orderStatusHistory`, and call `this.activityLogService.record(..., tx)`.
- `updateOrderFulfillment()` preserves existing `courierName`/`trackingNumber` when omitted (`data.courierName !== undefined ? data.courierName : order.courierName`) and enforces both for `DISPATCHED`, `IN_TRANSIT`, and `OUT_FOR_DELIVERY`.
- `trackingUrl` is length-validated (`z.string().max(500).optional()`) without URL scheme validation (**LOW**).

---

## 6. Test Coverage & Limitations

- **PGlite In-Process DB Integration (`phase3a-orders-db.test.ts`):** Covers `getAllOrders()` search/filter/pagination, `CANCELLED` & invalid transition rejection, `DISPATCHED` missing-shipping rejection, and `updateOrderFulfillment()` audit-failure rollback.
- **UNVERIFIED:** Independent multi-connection PostgreSQL concurrency tests for `updateOrderFulfillment()` / `updateOrderStatus()` and audit-failure rollback test for `updateOrderStatus()`.

---

## 7. Classified Findings

- **HIGH:** `PATCH /api/v1/admin/orders/:id` (`updateOrderStatus`) still accepts and persists `paymentStatus`.
- **MEDIUM:** `PAYMENT_PENDING` can transition directly to `ORDER_CONFIRMED` / `CARD_PRODUCTION` in `ORDER_STATUS_TRANSITIONS`.
- **LOW:** `trackingUrl` in `updateOrderFulfillmentSchema` lacks `http://`/`https://` scheme validation.
- **VERIFIED:** `updateOrderFulfillment()` payment isolation, terminal-state protection (`CANCELLED`/`DELIVERED`), shipping-info enforcement, and transactional `orderStatusHistory` + `auditLogs` persistence.

---

## 8. Final Verdict

**CONDITIONALLY APPROVED** — `AdminOrdersPage` and `updateOrderFulfillment()` are safe for Phase 3A, subject to removing `paymentStatus` from `updateOrderLegacySchema` / `updateOrderStatus()` before payment-reconciliation work in Phase 3B.
