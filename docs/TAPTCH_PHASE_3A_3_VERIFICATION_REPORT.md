# TAPTCH — PHASE 3A.3 VERIFICATION REPORT

**Mode:** Read-Only Payment Eligibility Edge-Case Verification  
**Date:** 2026-11-28  
**Target:** `assertPaymentEligibleForOrderProgression()` (`backend/src/modules/admin/admin.service.ts:52-63`)

---

## 1. Edge-Case Verification Matrix

| # | Case | Actual Behavior | Expected Behavior | Code Location | Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Online + `PENDING` | Throws `BadRequestException` | Must not progress | `admin.service.ts:56-62` | **PASS** |
| 2 | Online + `PAID` | Allowed | May progress | `admin.service.ts:58` | **PASS** |
| 3 | COD + `COD_PENDING` | Allowed | May progress | `admin.service.ts:58` | **PASS** |
| 4 | COD + `PAID` | Allowed | May progress | `admin.service.ts:58` | **PASS** |
| 5 | COD + `REFUNDED` | **Allowed** (`method === 'cod'` bypasses check) | Must not progress | `admin.service.ts:58` | **FAIL** |
| 6 | Offline + `PENDING` | **Allowed** (`method === 'offline'` bypasses check) | Should require verification (`PAID`/`WAIVED`) | `admin.service.ts:58` | **FAIL** |
| 7 | Any method + `REFUNDED` / `FAILED` | **Allowed** for `cod` and `offline` | Must not progress | `admin.service.ts:58` | **FAIL** |
| 8 | `WAIVED` | Only assignable via `PATCH /admin/orders/:id/payment` (`finance.manage`) | Restricted to `finance.manage` | `admin.controller.ts:346-359` | **PASS** |

---

## 2. Persisted-Value & Bypass Check

- Both `updateOrderStatus()` (`admin.service.ts:1079-1081`) and `updateOrderFulfillment()` (`admin.service.ts:798-800`) pass the persisted `existing` / `order` row loaded inside `tx` with `.for('update')` to `assertPaymentEligibleForOrderProgression()`. Neither endpoint accepts `paymentStatus` or `paymentMethod` from the request body.

---

## 3. Smallest Safe Correction (Not Implemented)

In `assertPaymentEligibleForOrderProgression()` (`backend/src/modules/admin/admin.service.ts:52-63`):
1. Reject `REFUNDED` and `FAILED` unconditionally for **all** payment methods:
   ```ts
   if (status === 'REFUNDED' || status === 'FAILED') {
     throw new BadRequestException(`Cannot advance order with paymentStatus=${status}.`);
   }
   ```
2. Restrict the unpaid-progression exemption to `method === 'cod'` (with `COD_PENDING` / `PENDING` / `COD_COLLECTED` / `PAID` / `WAIVED`) rather than exempting `offline + PENDING`.

---

## 4. Final Verdict

**NOT APPROVED** — Fix Cases 5, 6, and 7 (`REFUNDED`/`FAILED` across all payment methods and `offline + PENDING`) before approving Phase 3A.
