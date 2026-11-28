# TAPTCH — PHASE 3A.4 IMPLEMENTATION REPORT

**Phase:** 3A.4 — Payment Eligibility State Validation Fix  
**Date:** 2026-11-28  
**Status:** COMPLETED & VERIFIED

---

## 1. Exact Files Modified

- `backend/src/modules/admin/admin.service.ts` (`assertPaymentEligibleForOrderProgression`)
- `backend/src/tests/phase3a-orders-db.test.ts` (18-case payment eligibility matrix across `updateOrderStatus` and `updateOrderFulfillment`)

---

## 2. Final Payment Eligibility Matrix

| Payment Method | Payment Status | Result |
| :--- | :--- | :--- |
| `cod` | `COD_PENDING`, `COD_COLLECTED`, `PAID`, `WAIVED` | **Allow** |
| `cod` | `PENDING`, `FAILED`, `REFUNDED`, unknown | **Reject** (`400 Bad Request`) |
| `razorpay` / `upi` (online) | `PAID`, `WAIVED` | **Allow** |
| `razorpay` / `upi` (online) | `PENDING`, `COD_PENDING`, `COD_COLLECTED`, `FAILED`, `REFUNDED`, unknown | **Reject** (`400 Bad Request`) |
| `offline` | `PAID`, `WAIVED` | **Allow** |
| `offline` | `PENDING`, `FAILED`, `REFUNDED`, unknown | **Reject** (`400 Bad Request`) |
| Unknown / missing | Any | **Reject** (fail closed) |

---

## 3. Persisted-Field & Security Confirmation

- Both `updateOrderStatus()` and `updateOrderFulfillment()` load the persisted order row inside `this.dbService.db.transaction(...)` with `.for('update')` and pass it to `assertPaymentEligibleForOrderProgression()`.
- Neither endpoint accepts `paymentStatus` or `paymentMethod` from request bodies.
- `WAIVED` remains restricted to `PATCH /api/v1/admin/orders/:id/payment` (`finance.manage`).

---

## 4. Tests Added & Exact Results

- `backend/src/tests/phase3a-orders-db.test.ts` (**5/5 passed**, PGlite):
  - Tested all 18 `(paymentMethod, paymentStatus)` combinations against both `updateOrderStatus()` and `updateOrderFulfillment()`.
  - Confirmed `paymentStatus` remains unchanged after allowed progressions, and rejected progressions leave `orders.orderStatus` unchanged.

---

## 5. Build & Typecheck Results

- `npm --prefix backend run typecheck`: **PASSED** (exit code 0)
- `npm --prefix backend test`: **PASSED** — **20 test files, 123 tests passed**
- `npm --prefix backend run build`: **PASSED** (`nest build`, exit code 0)
- `npm --prefix frontend test -- --run`: **PASSED** (exit code 0)
- `npm --prefix frontend run build`: **PASSED** (`tsc && vite build`, exit code 0)

---

## 6. Remaining Risks

- Independent multi-connection PostgreSQL concurrency tests remain on the staging deployment-readiness checklist (PGlite runs in-process).
