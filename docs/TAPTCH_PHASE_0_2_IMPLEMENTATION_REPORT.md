# TAPTCH — Phase 0.2: Final Integrity Hardening Implementation Report

**Date**: 2026-11-28  
**Scope**: Final backend integrity hardening prior to Phase 1 (Admin Module).

---

## 1. Files Changed
- `backend/src/modules/cards/cards.service.ts` — Added `assertPurchasedCardNotRevoked()` and blocked `REVOKED` / `CANCELLED` / `REFUNDED` purchased cards in `resolvePublicNfcToken()`, `attachProfileToPurchasedCard()`, and `setPurchasedCardDestination()`.
- `backend/src/modules/orders/orders.service.ts` — Added `SELECT ... FOR UPDATE` row-level locking (`query.for('update')`) + `totalAmount > 0` check in `verifyPayment()`; updated `cancelOrder()` to guard against already-`CANCELLED` / post-production statuses and revoke pre-fulfillment `purchased_cards` (`profileAssignmentStatus: 'REVOKED'`, `profileId: null`, `destinationType: null`) without deleting any records.
- `backend/src/modules/admin/admin.service.ts` — Updated `updateOrderPayment()` so marking an order `REFUNDED` pre-fulfillment revokes its `purchased_cards` (`profileAssignmentStatus: 'REVOKED'`), while post-fulfillment (`DISPATCHED`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`) physical cards are **not** auto-revoked.
- `backend/src/tests/phase02-integrity-hardening.test.ts` — Added 5 targeted unit/concurrency tests.

## 2. Database Migrations Introduced
- **None**. `purchased_cards.profile_assignment_status` is `varchar(64)`, so `'REVOKED'` is stored without altering schema or deleting/modifying historical rows.

## 3. Exact Implementation Details
1. **Cancelled & Refunded NFC Card Protection**:
   - `CardsService.resolvePublicNfcToken()` checks `purchasedCard.profileAssignmentStatus === 'REVOKED'` and the parent `orders` row (`orderStatus === 'CANCELLED' || paymentStatus === 'REFUNDED'`), returning `{ status: 'unavailable', destinationType: null, destinationUrl: null }`.
   - `CardsService.attachProfileToPurchasedCard()` and `setPurchasedCardDestination()` call `assertPurchasedCardNotRevoked()` and throw `BadRequestException` if revoked, cancelled, or refunded.
   - `OrdersService.cancelOrder()` and `AdminService.updateOrderPayment(..., 'REFUNDED')` (pre-fulfillment only) set `profileAssignmentStatus = 'REVOKED'`, `profileId = null`, `destinationType = null` on `purchased_cards`. Post-fulfillment refunds preserve physical card state for return/recovery.
2. **Concurrent Payment Verification**:
   - `OrdersService.verifyPayment()` acquires a `SELECT ... FOR UPDATE` row lock on `orders` inside `withActor()` before re-checking `CANCELLED`, `REFUNDED`, `PAID`, and `totalAmount > 0`.
3. **Production Rate-Limit Configuration Review**:
   - `@nestjs/throttler` (`^6.0.0`) uses process-local in-memory storage; no `@nest-lab/throttler-storage-redis` package is installed, and `.env.production.example` defaults `USE_IN_MEMORY_REDIS=true`. For multi-instance production deployments, a shared Redis `ThrottlerStorage` adapter and shared `REDIS_URL` are required.
4. **NFC Token Uniqueness**:
   - Live DB has `0` rows in `cards` and `1` row in `purchased_cards`. Left the 128-bit token + cross-table check unchanged for Phase 0.2; a shared `nfc_tokens` registry table is deferred to Phase 4 (physical card batch provisioning).

## 4. Tests Added & Verification Results
- `backend/src/tests/phase02-integrity-hardening.test.ts`: **5 tests passed** (cancelled/refunded NFC resolution, attach/destination rejection on revoked cards, pre-fulfillment cancel & refund revocation, post-fulfillment `DELIVERED` refund preservation, and concurrent `verifyPayment` mutex simulation).
- `npm --prefix backend run typecheck` → **Passed** (0 errors).
- `npm --prefix backend test` → **Passed** (**16 test files, 100 tests passed**).
- `npm --prefix backend run build` → **Passed**.
- `npm --prefix frontend test -- --run` → **Passed** (**23 test files, 149 tests passed**).
- `npm --prefix frontend run build` → **Passed**.

## 5. Remaining Known Risks & Deployment Notes
- **Rate Limiter**: Process-local unless a Redis `ThrottlerStorage` adapter is added for multi-instance deployments.
- **Cross-Table NFC Token Uniqueness**: Shared `nfc_tokens` registry table recommended when physical `cards` batch provisioning is implemented in Phase 4.
- **No Historical Records Deleted**: Confirmed zero order, payment, or NFC card rows were deleted.

Stopping after Phase 0.2 as requested; awaiting your review before starting Phase 1.
