# TAPTCH — PHASE 3A IMPLEMENTATION REPORT

**Phase:** 3A — Order Management & Fulfillment  
**Date:** 2026-11-28  
**Status:** COMPLETED & VERIFIED

---

## 1. Existing Order Lifecycle Discovered

- `schema.orders` (`backend/src/database/schema/orders.ts`) tracks `orderNumber`, `userId`, `profileId`, `material`, `quantity`, `shippingAddress`, `orderStatus`, `paymentStatus`, `paymentMethod`, `courierName`, `trackingNumber`, `trackingUrl`, `totalAmount`, `currency`, and timestamps.
- `schema.orderStatusHistory` records timeline events (`orderId`, `status`, `title`, `description`, `updatedBy`, `createdAt`).
- `schema.orderItems` and `schema.payments` store line items and payment records.

---

## 2. Features Implemented

1. **Admin Order Listing (`/admin/orders`):**
   - Search by order ID, order number, tracking number, payment reference, or customer name/email/phone.
   - Filters for `orderStatus` and date range (`fromDate`, `toDate`), with server-side pagination.
   - Displays order number, customer, quantity/material, persisted amount, read-only payment status, and order status.
2. **Order Details Modal:**
   - Displays persisted totals, read-only payment status, courier/tracking info, shipping address, and `orderStatusHistory`.
3. **Order Status & Fulfillment Management:**
   - Enforced `ORDER_STATUS_TRANSITIONS` on the backend.
   - Terminal states (`CANCELLED`, `DELIVERED`) cannot be transitioned.
   - `DISPATCHED`, `IN_TRANSIT`, and `OUT_FOR_DELIVERY` require `courierName` and `trackingNumber`.
   - `updateOrderFulfillment()` never alters `paymentStatus`.

---

## 3. API Endpoint & Permission Matrix

| Method & Route | Handler | Required Permission |
| :--- | :--- | :--- |
| `GET /api/v1/admin/orders` | `AdminController.getOrders` | `orders.view` |
| `GET /api/v1/admin/orders/:id` | `AdminController.getOrderById` | `orders.view` |
| `PATCH /api/v1/admin/orders/:id` | `AdminController.updateOrder` | `orders.manage` |
| `PATCH /api/v1/admin/orders/:id/fulfillment` | `AdminController.updateOrderFulfillment` | `orders.manage` |

---

## 4. Database / Schema Changes

- **Schema changes:** None.

---

## 5. Order Status Transition Rules

- `ORDER_PLACED` / `PAYMENT_PENDING` -> `ORDER_CONFIRMED`, `DESIGN_REVIEW`, `CARD_PRODUCTION`, `ON_HOLD`, `CANCELLED`
- `ON_HOLD` -> `ORDER_CONFIRMED`, `DESIGN_REVIEW`, `CARD_PRODUCTION`, `CARD_READY`, `CANCELLED`
- `ORDER_CONFIRMED` -> `DESIGN_REVIEW`, `CARD_PRODUCTION`, `CARD_READY`, `ON_HOLD`, `CANCELLED`
- `DESIGN_REVIEW` -> `CARD_PRODUCTION`, `CARD_READY`, `ON_HOLD`, `CANCELLED`
- `CARD_PRODUCTION` -> `CARD_READY`, `DISPATCHED`, `ON_HOLD`, `CANCELLED`
- `CARD_READY` -> `DISPATCHED`, `ON_HOLD`, `CANCELLED`
- `DISPATCHED` -> `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`
- `IN_TRANSIT` -> `OUT_FOR_DELIVERY`, `DELIVERED`
- `OUT_FOR_DELIVERY` -> `DELIVERED`
- `DELIVERED` / `CANCELLED` -> terminal (`[]`)

---

## 6. Fulfillment Workflow

- `updateOrderFulfillment()` locks the order row with `SELECT ... FOR UPDATE`, validates the transition and shipping requirements (`courierName` + `trackingNumber` for `DISPATCHED`/`IN_TRANSIT`/`OUT_FOR_DELIVERY`), updates `schema.orders`, appends `schema.orderStatusHistory`, and records `admin:order_fulfillment_update` via `ActivityLogService.record(..., tx)`.

---

## 7. Audit & Transaction Behavior

- `updateOrderFulfillment()` and `updateOrderStatus()` execute inside `this.dbService.db.transaction(...)`.
- Audit-insert failure rolls back both the `orders` update and `orderStatusHistory` insert.

---

## 8. Tests & Exact Results

- **PGlite DB Integration (`backend/src/tests/phase3a-orders-db.test.ts`):** 3/3 passed (listing/pagination/search/date-range, invalid/cancelled/missing-shipping rejection, transactional fulfillment + audit-failure rollback).
- **Backend Full Suite (`npm --prefix backend test`):** 20 test files, 121 tests passed.
- **Frontend Component Tests (`frontend/src/tests/admin-orders-page.test.tsx`):** 2/2 passed (order list + fulfillment modal mutation, error state).
- **Frontend Full Suite (`npm --prefix frontend test -- --run`):** All test files passed (exit code 0).

---

## 9. Build & Typecheck Results

- `npm --prefix backend run typecheck`: **PASSED** (exit code 0)
- `npm --prefix backend run build`: **PASSED** (`nest build`, exit code 0)
- `npm --prefix frontend run build`: **PASSED** (`tsc && vite build`, exit code 0)

---

## 10. Files Modified

- `backend/src/modules/admin/admin.service.ts`
- `backend/src/modules/admin/admin.controller.ts`
- `backend/src/tests/phase3a-orders-db.test.ts` (new)
- `frontend/src/pages/admin/AdminOrdersPage.tsx` (new)
- `frontend/src/tests/admin-orders-page.test.tsx` (new)
- `frontend/src/layouts/AdminLayout.tsx`
- `frontend/src/routes/index.tsx`

---

## 11. Remaining Risks & Deployment-Readiness Follow-ups

- PostgreSQL staging concurrency test for last-super-admin protection using independent connections.
- Audit-failure rollback test for `updateAdminRole()`.
- Consistent timezone semantics for user/profile/order date filters across client/server timezones.
