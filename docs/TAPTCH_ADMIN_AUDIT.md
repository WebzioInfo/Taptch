# TAPTCH — Complete Application Audit & Admin Module Preparation

**Audit Date**: 2026-11-28  
**Scope**: Read-only full-stack architectural, feature, security, NFC, product, and financial audit in preparation for the complete Admin Module.  
**Rule**: Every finding below is verified directly against the current repository source code.

---

## A. Existing Application Architecture

### 1. Stack & Monorepo Structure
- **Monorepo**: NPM Workspaces (`package.json:5-8`) with `backend/`, `frontend/`, and `cloudflare/taptch-profile-proxy/`.
- **Frontend**: Vite 6 + React 19 + TypeScript + React Router v7 + TanStack Query + Zustand + Tailwind CSS + Radix UI + Fabric.js / Three.js (`frontend/package.json:13-55`, `frontend/src/App.tsx:1-27`).
  - API transport: `ApiClient` (`frontend/src/services/api.ts:6-121`) resolves `env.apiUrl` (`frontend/src/config/env.ts:3-18`: `VITE_API_URL`, or auto-detects `https://api.taptch.com` on `taptch.com` / `*.taptch.com` / `*.webziotech.in`, else `http://localhost:4000`). Sends `credentials: 'include'` (`api.ts:36`) and `Authorization: Bearer <token>` from `localStorage` (`taptch_session_token`).
- **Backend**: NestJS 11 (`@nestjs/platform-express`) + Drizzle ORM (`drizzle-orm` + `postgres` driver with `prepare: false` for PgBouncer) + Zod env validation (`backend/package.json:16-37`, `backend/src/app.module.ts:25-80`, `backend/src/database/database.service.ts:32-38`).
  - **Response & Error Envelopes**:
    - `TransformInterceptor` (`backend/src/common/interceptors/transform.interceptor.ts:12-35`) wraps responses as `{ success: true, data }`.
    - `AllExceptionsFilter` (`backend/src/common/filters/http-exception.filter.ts:13-88`) returns `{ success: false, error: { code, message, details, referenceId, path, timestamp } }`, redacting SQL details in production (`line 70`).
  - **CORS** (`backend/src/main.ts:58-120`): Allows `taptch.com`, `www.taptch.com`, `taptch.webziotech.in`, `shop.taptch.com`, `app.taptch.com`, `https://*.taptch.com`, `https://*.webziotech.in`, `ALLOWED_ORIGINS`, and `localhost` when `NODE_ENV !== 'production'`.
  - **Rate Limiting**: `@nestjs/throttler` (`^6.0.0`) is in `backend/package.json:23` **but is not imported or configured anywhere in `backend/src`**.
- **Database & Cache**:
  - **PostgreSQL 16+** (Supabase Pooler `DATABASE_URL` / `DATABASE_URL_DIRECT`, PGlite optional in dev).
  - **Redis** (`ioredis` in `backend/src/database/redis.service.ts:13-122`) with an automatic per-instance in-memory `Map` fallback if Redis is unreachable (`USE_IN_MEMORY_REDIS`).
  - **BullMQ**: Not installed or used in `backend/`.
- **Authentication & Authorization**:
  - Custom NestJS session auth (`backend/src/modules/auth/auth.controller.ts`, `auth.service.ts`) using Better Auth-compatible schema (`users`, `sessions`, `accounts`, `verifications` in `backend/src/database/schema/auth.ts:3-56`) and cookie `better-auth.session_token` (30-day random hex tokens, `bcryptjs` password hashing with `@better-auth/utils/password` scrypt auto-migration). `better-auth` (`^1.7.14`) is in `backend/package.json:25` but not mounted as a handler.
  - `AuthGuard` (`backend/src/common/guards/auth.guard.ts:15-121`) validates session cookies / Bearer tokens (with `x-test-user-id` / `x-test-role` bypass when `NODE_ENV` is `'test'` or `'development'`), rejects `suspended` / `deactivated` users (`lines 106-108`), and sets `request.actor`.
  - `RolesGuard` (`backend/src/common/guards/roles.guard.ts:11-41`) checks `@Roles(...)` (`actor.isAdmin` bypasses).
  - `DatabaseService.withActor` (`backend/src/database/database.service.ts:70-79`) sets transaction-local `app.current_user_id`, **but zero PostgreSQL `ROW LEVEL SECURITY` policies exist in `backend/src`**, and many services (`admin`, `support`, `entitlements`, `products`, `templates`, parts of `profiles` and `leads`) query `this.dbService.db` directly.
- **File & Image Storage**:
  - **Cloudinary** (`backend/src/modules/uploads/cloudinary-storage.service.ts`, `uploads.service.ts`, `uploads.controller.ts`): Primary storage for avatars, covers, venture logos, product images, and card studio previews (`taptch/{userId}/{category}` with `f_auto, q_auto`).
  - Legacy fallback `GET /api/v1/uploads/file/:filename` (`uploads.controller.ts:23-30`) serves old local files from `backend/uploads/profiles/`.
- **Hosting & Deployment**:
  - Frontend: Vercel (`vercel.json`, `frontend/vercel.json`) with SPA rewrites to `/index.html`.
  - Edge Proxy: Cloudflare Worker (`cloudflare/taptch-profile-proxy/src/worker.ts`, `wrangler.toml`) on `taptch.com/*` and `www.taptch.com/*`, proxying SPA assets, `/p/`, `/b/`, `/nfc/`, `/claim/`, and `/{username}` to `https://taptch.webziotech.in`.
  - Backend: Dockerized NestJS (`backend/Dockerfile`, Node 22 Alpine, port 4000, `HEALTHCHECK /api/health`).
- **Third-Party Integrations**:
  - Cloudinary (media storage), Google OAuth + One Tap (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`), Razorpay HMAC config (`RAZORPAY_KEY_SECRET`, no live SDK), SMTP env vars checked in `/api/health` (`health.controller.ts:31-36`, no mail library installed).

---

## B. Complete User-Side Feature Inventory

| Feature | Frontend Page / Component | Backend Endpoints | DB Tables | Status & Gaps |
|---|---|---|---|---|
| **Registration & Login** | `RegisterPage.tsx`, `LoginPage.tsx` | `POST /api/auth/sign-up/email`, `sign-in/email`, `sign-out`, `get-session` | `users`, `sessions`, `accounts`, `organizations`, `members` | Implemented. Business signup auto-creates `organizations` + `members`. No email verification/OTP/password-reset UI or rate limiting. |
| **Google OAuth & One Tap** | `frontend/src/lib/auth/client.ts:70-101` | `GET /api/auth/oauth/google`, `/callback`, `POST /oauth/exchange-code`, `/verify-token` | `users`, `accounts`, `sessions`, `verifications` | Implemented with 60s single-use `auth_code` via Redis + `verifications`. |
| **Profile Creation, Editing & Publishing** | `DashboardPage.tsx`, `BuilderPage.tsx` | `GET/POST /api/v1/profiles`, `PATCH /api/v1/profiles/:id`, `POST /:id/publish`, `PUT /:id/sections`, `DELETE /:id` | `profiles`, `profile_sections`, `username_aliases` | Implemented. `PATCH` updates `profiles` + replaces `profile_businesses` & `profile_catalogue_items`; `publish()` compiles `published_json` + Redis `profile:slug:{slug}`. |
| **Username / Slug Management** | `BuilderPage.tsx` | `GET /api/v1/profiles/check-username/:username`, `PATCH /api/v1/profiles/:id` | `profiles`, `username_aliases`, `purchased_cards` | Implemented. Locks after physical card link (`usernameLocked`). **Bug**: `profiles.service.ts:805-812` overwrites `purchasedCards.nfcUrl` with `/{nextSlug}` on rename. |
| **Profile & Venture Images** | `ImageUploadField.tsx`, `BuilderPage.tsx` | `POST /api/v1/uploads/image`, `/cleanup`, `GET /api/v1/uploads/file/:filename` | `media_assets`, `profiles`, `profile_businesses` | Avatar & Venture Logos use Cloudinary `ImageUploadField`. Cover & Catalogue `imageUrl` are plain URL inputs in `BuilderPage.tsx`. |
| **Contacts, Socials, Ventures & Catalogue** | `BuilderPage.tsx` | `PATCH /api/v1/profiles/:id` | `profiles`, `profile_businesses`, `profile_catalogue_items` | Implemented. Personal vs Business profiles; multi-venture switching; catalogue items (`product`/`service`). |
| **Location Management** | `BuilderPage.tsx` (`address`, Google Maps / Review URLs on ventures) | `PATCH /api/v1/profiles/:id` | `profiles.address`, `profiles.location`, `profile_businesses` | Implemented as text/URL fields; no geocoding or map picker. |
| **Public Profile Display** | `PublicProfilePage.tsx`, `ProfileRenderer.tsx` | `GET /api/v1/profiles/by-slug/:slug` | `profiles` (`published_json`), Redis `profile:slug:{slug}` | Implemented. **Bug**: returns `{ id, slug, status }` (HTTP 200) for unpublished/suspended profiles (`profiles.service.ts:326-332`); does not check `users.status`. |
| **Leads & Contact Exchange** | `LeadsPage.tsx`, `PublicProfilePage.tsx` | `POST /api/v1/leads`, `POST /api/v1/profiles/:id/exchange`, `GET/PATCH/DELETE /api/v1/leads` | `leads` | Implemented with CSV export & notes. **Gap**: `captureLead` does not check `profile.status === 'PUBLISHED'`; permanent duplicate lock when email is omitted (`leads.service.ts:152-162`). |
| **NFC Cards & Destination Mgmt** | `CardsPage.tsx`, `PostPurchaseProfileSetupPage.tsx` | `GET /api/v1/cards/purchased`, `POST /api/v1/cards/purchased/:id/attach-profile`, `disconnect-profile`, `destination`, `POST /api/v1/cards/:id/link` | `purchased_cards`, `cards` | Implemented for `purchased_cards`. **Missing**: lost/damaged reporting, card deactivation, tap analytics (`card_events` unused). |
| **NFC Scanning & Redirect** | `NfcResolvePage.tsx` | `GET /api/v1/nfc/:token/resolve`, `GET /nfc/:token` (302) | `cards`, `purchased_cards`, `profiles`, `username_aliases` | Implemented. **Gap**: zero scan logging (`card_events` unused); `expectedProfileType` ignored (`cards.service.ts:337`). |
| **Product Catalog & Design Studio** | `NfcCardsPage.tsx`, `NfcProductDetailPage.tsx`, `DesignStudioPage.tsx`, `TemplatesPage.tsx` | `GET /api/v1/products`, `GET /api/v1/products/:id/templates`, `POST /api/v1/designs/draft`, `GET/POST/PATCH/DELETE /api/v1/cart` | `card_products`, `card_product_variants`, `card_design_templates`, `card_designs`, `cart_items`, `templates` | Implemented. **Bugs**: `DesignStudioPage.tsx:207` calls `/api/v1/templates` instead of `/api/v1/products/:id/templates`; `CartService` ignores variant/discount prices & GST. |
| **Checkout, Orders & Tracking** | `JourneyPage.tsx`, `CheckoutPage.tsx`, `OrdersPage.tsx`, `OrderConfirmationPage.tsx`, `OrderTrackingPage.tsx` | `POST /api/v1/orders`, `POST /api/v1/orders/:id/verify-payment`, `POST /api/v1/orders/:id/cancel`, `GET /api/v1/orders/:id` | `orders`, `order_items`, `order_status_history`, `payments`, `addresses`, `purchase_journeys` | Implemented. **Missing UI**: Cancel Order button not wired; Refunds UI/API missing; UPI simulator & Razorpay verification bypassable. |
| **Dynamic QR** | `QrPage.tsx` | `GET/POST /api/v1/qr`, `GET /q/:token` | `qr_codes`, `qr_scan_events` | Backend + `QrPage.tsx` exist, **but `/qr` redirects to `/dashboard`** in `frontend/src/routes/index.tsx:131`. |
| **User Notifications** | None (only transient toast notifications in UI) | None | None | **Not implemented** (no `notifications` table, bell, or email/SMS service). |
| **Refund Information** | None | None (only `AdminService.updateOrderPayment(..., 'REFUNDED')`) | `orders.payment_status`, `payments.status` | **Not implemented** for customers. |

---

## C. NFC Architecture & Lifecycle

1. **Card Creation / Registration**: Two parallel tables exist — `cards` (`backend/src/database/schema/cards.ts:14-32`) for physical cards and `purchased_cards` (`backend/src/database/schema/studio.ts:220-270`) for order allocations. Physical batch provisioning (`card_batches`, `cards`, `card_assignments`, `activation_attempts`) has **no controller or service implementation**; only `purchased_cards` rows are created automatically via `OrdersService.allocatePurchasedCards` (`orders.service.ts:537-570`).
2. **Token Generation**: `crypto.randomBytes(6).toString('hex')` (48 bits, below the 64-bit comment in `cards.ts:18`) with `.onConflictDoNothing()` (`orders.service.ts:568`), which silently drops a card row on collision. No cross-table uniqueness check spans `cards` and `purchased_cards`.
3. **URL Generation**: `buildNfcUrl` (`cards.service.ts:34-43`) formats `${base}/p/${token}`. Contradiction: `ProfilesService.update` (`profiles.service.ts:805-812`) overwrites `purchasedCards.nfcUrl` with `${base}/${nextSlug}` on slug rename.
4. **Assignment & Reassignment**: `attachProfileToPurchasedCard` (`cards.service.ts:146-234`) and `disconnectProfileFromPurchasedCard` (`cards.service.ts:236-282`) verify ownership and update `purchased_cards.profileId`. `card_assignments` is never written.
5. **Destination Resolution & Redirect**: Cloudflare Worker (`cloudflare/taptch-profile-proxy/src/worker.ts:150-162`) proxies `/p/:key`, `/b/:key`, `/nfc/:token`, `/claim/:token`, and `/{username}` to `taptch.webziotech.in`. `NfcResolvePage.tsx` calls `GET /api/v1/nfc/:token/resolve` (`CardsService.resolvePublicNfcToken` at `cards.service.ts:335-488`), checking `cards` -> `purchased_cards` -> `profiles.slug` / `username_aliases`.
6. **Scanning**: Zero NFC tap analytics (`card_events` is never populated).
7. **Deactivation / Lost / Damaged**: No endpoint or UI exists to deactivate a card or mark it lost/damaged (`purchased_cards` lacks a `status` column).
8. **Suspended / Deleted User or Profile**:
   - **Suspended user**: `resolvePublicNfcToken` and `findBySlug` do **not** check `users.status`, and `updateUserStatus` does not clear Redis `profile:slug:*`. Suspended users' NFC cards stay live.
   - **Deleted profile**: `ProfilesService.remove` (`profiles.service.ts:905-913`) clears `purchasedCards.profileId` but leaves `profileAssignmentStatus = 'PROFILE_ATTACHED'` and never clears `cards.profileId`.

---

## D. Products, Templates & Inventory Architecture

- **Products & Variants** (`backend/src/database/schema/studio.ts:11-64`, `products.service.ts:44-368`): 6 seeded NFC products (`prod_pvc_black`, `prod_pvc_white`, `prod_metal_black`, `prod_metal_silver`, `prod_metal_gold`, `prod_metal_rose_gold`) with 1 variant each and dynamic categories (`Metal NFC Cards`, `PVC NFC Cards`).
- **Images**: Only single front `imageUrl` (`/products/*.svg`) exists on `card_products` and `card_product_variants` — **no `backImageUrl` column**. `NfcProductDetailPage.tsx:321-356` renders CSS placeholders for back/chip views.
- **Pricing**: Seeded prices are `₹1499` (PVC) and `₹2499` (Metal).
  - `CartService.getCart` (`cart.service.ts:47`) ignores `variant.price` and `discountPrice` and omits 18% GST.
  - `AdminService.getFinancialSummary` (`admin.service.ts:74-75`) hardcodes PVC price at `₹999`.
- **Inventory**: **No stock count, SKU inventory ledger, or low-stock threshold exists** (`inStock: product.isActive !== false`).
- **Templates**:
  - Card print templates (`card_design_templates` + `card_product_templates` junction) vs Digital profile templates (`templates`).
  - `DesignStudioPage.tsx:207` calls `/api/v1/templates` (digital profile templates) instead of `/api/v1/products/:id/templates` (card templates).
  - `TemplatesService.findAll` (`templates.service.ts:73`) returns 2 hardcoded templates instead of querying `templates`.
- **Management UIs**: Zero admin endpoints or UIs exist for products, variants, templates, or inventory (`NfcCardsPage.tsx:298` "Add New Product" links to `/admin` which has no product tab).

---

## E. Orders, Payments, Refunds & Staff Sales Architecture

- **Order Creation & Pricing** (`orders.service.ts:221-535`): Server-side pricing (`subtotal = unitPrice * qty`, `shipping = subtotal >= 2000 ? 0 : 99`, `tax = Math.round(subtotal * 0.18)`), idempotency via `(userId, idempotencyKey)`, and immutable `designSnapshotJson` on `order_items`.
- **Payments & Verification** (`orders.service.ts:575-755`): No live Razorpay SDK or webhooks. Synthetic `order_*` / `upi_*` IDs are generated locally.
  - **Razorpay bypass**: `verifyPayment` skips HMAC-SHA256 verification if `RAZORPAY_KEY_SECRET`, `razorpay_order_id`, or `razorpay_signature` is missing (`line 617`).
  - **UPI self-approval**: Trusts `simulationStatus === 'SUCCESS'` from client (`OrderConfirmationPage.tsx:81-99`).
- **Cancellations & Refunds**:
  - `POST /api/v1/orders/:id/cancel` (`orders.service.ts:760-804`) blocks `CARD_PRODUCTION`, `DISPATCHED`, `DELIVERED`, but does not block `CARD_READY`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, or already-`CANCELLED` orders, and is not wired in `OrdersPage.tsx` / `OrderTrackingPage.tsx`.
  - No refund endpoint or workflow exists (only manual `AdminService.updateOrderPayment(..., 'REFUNDED')`).
  - No void/delete order endpoint exists.
- **Staff Sales**: No staff-generated sales, attribution (`staffId`), or commission tracking exists anywhere in `orders` or `finance`.
- **Financial Synchronization Gaps**:
  - Cancelling a COD order leaves `purchased_cards` active (allocated at creation at `orders.service.ts:470-472`).
  - Marking an order `REFUNDED` leaves `purchased_cards` active and `orderStatus` unchanged.
  - `AdminService.getFinancialSummary` (`admin.service.ts:60-123`) checks legacy `'paid_offline'`/`'unpaid'` instead of `'PAID'`/`'COD_PENDING'`/`'REFUNDED'`, hardcodes `2499`/`999`, includes `CANCELLED` orders, and never queries `financial_transactions` (which is unused and has a column-name bug `varchar('128')` in `finance.ts:38`).

---

## F. Existing Admin & Staff Functionality

- **Admin (`backend/src/modules/admin/`, `frontend/src/pages/AdminPage.tsx`)**: Guarded by `@Roles('super_admin', 'admin')` on backend, **unguarded** route in `frontend/src/routes/index.tsx:116`.
  - Tabs: `finance` (P&L cards + Record Expense form; expense list returned by API is not rendered), `users` (search, role filter, Suspend/Reactivate), `orders` (table + broken `"Mark Shipped"` button sending legacy `{ status: 'shipped', paymentStatus: 'paid_offline' }` instead of using existing `/fulfillment`, `/payment`, `/profile-assistance` endpoints), `subscriptions` (manual userId + `nano|micro|mini|max` tier assignment), `qr-verify` (`VerifyQRTab.tsx` client-only webcam `jsQR` duplicate check with no backend verification).
- **Support (`backend/src/modules/support/`, `frontend/src/pages/SupportPage.tsx`)**: Guarded by `@Roles('support_admin', 'super_admin', 'admin')` on backend, **unguarded** route in `frontend/src/routes/index.tsx:117`.
  - Tabs: `users` (search + `mailto:` link), `profiles` (top 50 profiles with `Approve`/`Suspend`, missing `flag` UI and reason input), `audit` (last 50 `audit_logs`). Dead `'orders'` tab type in TS state (`SupportPage.tsx:27`).
- **Orphaned Admin Artifacts**: `PortalXHeader.tsx` and `/portal-x/*`, `/staff/*` routes redirect to `/admin` / `/support`.

---

## G. Confirmed Bugs & Incomplete Implementations

1. **Broken P&L & Legacy Order Statuses** (`admin.service.ts:73-90`, `AdminPage.tsx:498-503`): Hardcodes `2499`/`999` and checks `'paid_offline'`/`'unpaid'`, so real `PAID` orders yield ₹0 collected revenue.
2. **Support Pending Orders Always 0** (`support.service.ts:28-31`): Queries `orderStatus = 'requested'` instead of `'ORDER_PLACED'` / `'ORDER_CONFIRMED'`.
3. **Subscription Plan ID Mismatch** (`AdminPage.tsx:543-546` vs `schema/plans.ts:5`): Sends `nano|micro|mini|max` to `tenantSubscriptions.planId` FK (`plans.id` expects `'free'|'pro'|'business'|'enterprise'` unless seeded otherwise).
4. **Slug Rename Corrupts `nfcUrl`** (`profiles.service.ts:805-812`): Overwrites `purchasedCards.nfcUrl` with `/{nextSlug}` instead of permanent `/p/{redirectToken}`.
5. **Token Collision Silent Drop** (`orders.service.ts:568`): `.onConflictDoNothing()` silently skips card creation on `redirectToken` collision.
6. **Profile Soft-Delete Stale Card State** (`profiles.service.ts:905-913`): Leaves `purchasedCards.profileAssignmentStatus = 'PROFILE_ATTACHED'` and `cards.profileId` populated.
7. **Drizzle Schema Bug** (`backend/src/database/schema/finance.ts:38`): `referenceNumber: varchar('128')` uses `'128'` as the SQL column name.
8. **Cart Pricing Drift** (`cart.service.ts:47,60-61`): Ignores variant/discount prices, GST, and `>= 2000` free-shipping threshold.
9. **Design Studio Wrong Template Endpoint** (`DesignStudioPage.tsx:207`): Calls `/api/v1/templates` instead of `/api/v1/products/:id/templates`.
10. **Order Duplicate Response Missing `gatewayOrderId`** (`orders.service.ts:248`) & `orderNumber` 4-digit collision risk (`orders.service.ts:337-338`).
11. **OrdersPage Material Field Mismatch** (`OrdersPage.tsx:62-64`): Reads `ord.cardMaterial` instead of `ord.material`.
12. **Dead/Orphaned Features**: `AdminController` `/fulfillment`, `/payment`, `/profile-assistance` have no UI in `AdminPage.tsx`; `SupportPage` `'orders'` tab; `QrPage.tsx` (`/qr` redirects); `PortalXHeader.tsx`; `card_batches`/`cards`/`card_assignments`/`card_events`/`activation_attempts`/`financial_transactions` tables unused.

---

## H. Security Findings

### Confirmed Vulnerabilities
1. **IDOR in `UploadsService.delete`** (`backend/src/modules/uploads/uploads.service.ts:367-388`): Deletes `mediaAssets` by `id` without verifying `ownerId === actor.userId`.
2. **Payment Verification Bypass** (`backend/src/modules/orders/orders.service.ts:608-751`, `OrderConfirmationPage.tsx:81-99`): Razorpay HMAC skipped when secret or signature fields are absent; UPI `simulationStatus: 'SUCCESS'` callable by any order owner in production.
3. **Unclaimed Card Hijack** (`backend/src/modules/cards/cards.service.ts:614, 633-643`): `linkCardToProfile` allows any authenticated user to claim a `cards` row where `ownerUserId` is `null` without an activation token.
4. **Suspended User's Public Profile & NFC Card Stay Live** (`admin.service.ts:184-209`, `profiles.service.ts:261-356`, `cards.service.ts:335-488`): Suspending a user does not revoke `sessions` rows, suspend profiles, clear Redis `profile:slug:*`, or block `resolvePublicNfcToken`.
5. **Zero Rate Limiting**: `@nestjs/throttler` is uninstalled in `AppModule`; auth, OAuth exchange, and public lead capture have no throttling.
6. **Zero PostgreSQL RLS Policies**: `withActor` sets `app.current_user_id`, but no RLS policies exist in DB migrations/schema and multiple services query `this.dbService.db` directly.
7. **Missing Input Validation (Mass Assignment)**: `AdminController`, `SupportController`, `ProfilesController`, and `DesignsService` accept unvalidated `any` / inline-typed bodies (e.g., `AdminService.updateOrderStatus` accepts any arbitrary status string; `updateUserStatus` allows self-suspension and arbitrary status strings).

### Potential Risks Requiring Verification
1. **Production `NODE_ENV` Configuration**: If `NODE_ENV` is `'development'` or `'test'` on staging/prod, `AuthGuard` (`auth.guard.ts:52-63`) accepts `x-test-user-id` / `x-test-role` header spoofing.
2. **XSS Token Exposure**: Session tokens are mirrored in `localStorage` (`taptch_session_token` in `frontend/src/lib/auth/client.ts:39,106`), amplifying impact if any XSS vector exists.
3. **Support Role Over-Privilege on Leads** (`leads.service.ts:224, 264`): `support_admin` can edit/delete any user's leads without audit logging.
4. **Public Profile Metadata Leak** (`profiles.service.ts:326-332`): Returns `{ id, slug, status }` for `DRAFT`/`SUSPENDED` profiles instead of 404.
5. **Multi-Instance Cache Drift**: `RedisService` falls back to per-process `Map` if `REDIS_URL` fails or `USE_IN_MEMORY_REDIS=true`.

---

## I. Edge-Case Inventory

- **COD Cancel / Refund Card Leak**: Cancelling a COD order or refunding a paid order leaves `purchased_cards` active and assignable.
- **Verify Payment on Cancelled Order**: `OrdersService.verifyPayment` does not reject `CANCELLED` or `REFUNDED` orders.
- **Duplicate Cancellation History**: `cancelOrder` does not guard against already-`CANCELLED` or `CARD_READY` / `IN_TRANSIT` / `OUT_FOR_DELIVERY` orders.
- **Lead Capture on Unpublished Profiles & Nameless Duplicates**: `captureLead` accepts leads on `DRAFT`/`SUSPENDED` profiles and permanently blocks same-name leads when `email` is omitted.
- **N+1 Queries**: `AdminService.getAllOrders` (up to 401 queries/call) and `OrdersService.findAllForActor`.
- **OAuth Exchange Without Redis**: `auth.service.ts` logs warnings if `verifications` insert mock/fails; works only in single-instance memory fallback.
- **Missing `prod_pvc_black` Fallback**: `createOrder` defaults `productId` to `'prod_pvc_black'` when omitted, which is not in `SEEDED_CARD_PRODUCTS`.

---

## J. Proposed Complete Admin Module Structure (17 Modules)

1. **Dashboard**: Platform KPIs (users, profiles, active cards, orders by status, net revenue, pending support/concierge queue) + recent activity feed. *Reuses*: `GET /api/v1/admin/stats`, `finance`. *Permissions*: `admin:dashboard:read`. *Edge cases*: exclude `CANCELLED`/`REFUNDED` from active revenue; cache expensive aggregates.
2. **User Management**: Search/filter/paginate users, view detail drawer (profiles, cards, orders, sessions), suspend/reactivate with reason, force-revoke sessions, reset 2FA/password. *Reuses*: `users`, `sessions`, `AdminService.getAllUsers/updateUserStatus`. *Permissions*: `users:read`, `users:suspend`, `users:manage`. *Edge cases*: prevent self-suspension or suspending last `super_admin`; cascade profile/NFC suppression & Redis purge on suspend.
3. **Profile Management**: Paginated search/filter across all profiles, inspect snapshot vs draft, approve/flag/suspend/unpublish with mandatory reason, unlock/edit locked usernames, force-republish snapshot. *Reuses*: `profiles`, `username_aliases`, `SupportService.getProfilesForAudit/reviewProfile`. *Permissions*: `profiles:read`, `profiles:moderate`, `profiles:unlock_slug`. *Edge cases*: purge `profile:slug:*` Redis cache on moderation; handle soft-deleted profiles cleanly.
4. **NFC Card Management**: Manage `card_batches`, provision `cards` (64+ bit tokens, UID, activation code hashes), link `purchased_cards.physicalCardId`, inspect tap logs (`card_events`), reassign/deactivate/mark lost-or-damaged, issue replacement cards, wire `VerifyQRTab` to real backend DB check. *Reuses*: `cards`, `card_batches`, `card_assignments`, `card_events`, `purchased_cards`, `VerifyQRTab.tsx`. *Permissions*: `cards:read`, `cards:provision`, `cards:moderate`. *Edge cases*: cross-table token uniqueness (`cards` + `purchased_cards`), atomic replacement preserving/rotating token safely.
5. **Product Management**: Full CRUD for `card_products` (name, slug, material, category, base/discount price, front & new `backImageUrl` via Cloudinary, active flag, SEO/specs). *Reuses*: `card_products`, `ProductsService`, Cloudinary upload pipeline. *Permissions*: `products:read`, `products:write`. *Edge cases*: prevent hard-delete of products referenced by `order_items` / `card_designs` (archive via `isActive = false`).
6. **Product Variants & Templates**: CRUD for `card_product_variants` (color, finish, SKU, price, variant image) and `card_design_templates` / `card_product_templates` + digital `templates` (`templates.ts`). *Reuses*: `card_product_variants`, `card_design_templates`, `card_product_templates`, `templates`. *Permissions*: `products:write`, `templates:write`. *Edge cases*: unique SKU enforcement; preserve existing `order_items.designSnapshotJson` on template edit.
7. **Inventory Management**: Add `stock_quantity`, `reserved_quantity`, `low_stock_threshold`, and an `inventory_movements` ledger per `card_product_variants.id` / `card_batches`. *Reuses*: `card_product_variants`, `card_batches`. *Permissions*: `inventory:read`, `inventory:adjust`. *Edge cases*: atomic stock reservation on order confirmation, release on cancellation, low-stock alerts.
8. **Order Management**: Unified order cockpit wiring existing `GET /admin/orders`, `GET /admin/orders/:id`, `PATCH /fulfillment`, `PATCH /profile-assistance`, plus bulk status export, invoice view, and safe cancellation with `purchased_cards` revocation. *Reuses*: `orders`, `order_items`, `order_status_history`, `AdminController` order endpoints. *Permissions*: `orders:read`, `orders:fulfill`, `orders:cancel`. *Edge cases*: enforce valid state machine transitions; eliminate N+1 query in `getAllOrders`.
9. **Payments & Refunds**: View all `payments` + `financial_transactions` ledger, collect COD (`COD_COLLECTED`), record offline payments, initiate/confirm partial or full refunds with immutable ledger entries (`financial_transactions`), and sync `orders.paymentStatus` + revoke `purchased_cards` on full refund. *Reuses*: `payments`, `financial_transactions`, `expenses`, `AdminService.updateOrderPayment/recordExpense`. *Permissions*: `finance:read`, `finance:write`, `refunds:approve`. *Edge cases*: prevent duplicate/over-refunds via transactional row locking (`SELECT ... FOR UPDATE`); never hard-delete financial rows.
10. **Staff Management**: Manage internal staff accounts (`super_admin`, `admin`, `support_admin`, `sales_staff`), assign roles, suspend staff, and track staff operational activity. *Reuses*: `users`, `roles`, `user_roles`, `audit_logs`. *Permissions*: `staff:read`, `staff:manage`. *Edge cases*: prevent privilege escalation (`support_admin` cannot grant `super_admin`).
11. **Sales Management**: Staff-assisted / B2B offline order creation (`createdByStaffId`, `salesChannel`, `commissionAmount`), staff sales attribution leaderboard, and void/credit-note handling via `financial_transactions`. *Reuses*: `orders`, `order_items`, `financial_transactions`. *Permissions*: `sales:create`, `sales:read_all`, `sales:void`. *Edge cases*: voiding a staff sale creates a reversing ledger entry and revokes `purchased_cards` without deleting history.
12. **Support & Complaints**: Add `support_tickets` & `support_ticket_messages` tables; ticket inbox, status/priority triage, SLA timers, assignment to `support_admin`, linked user/order/card context, and profile moderation queue. *Reuses*: `SupportService`, `SupportPage.tsx`. *Permissions*: `support:read`, `support:respond`, `profiles:moderate`. *Edge cases*: restrict `support_admin` from modifying financial/lead records without audit trail.
13. **Notifications**: Add `notifications` & `notification_templates` tables + transactional email/WhatsApp/in-app dispatchers for order updates, card activation, refund confirmations, and admin alerts. *Reuses*: `system_settings`, `SMTP_*` config. *Permissions*: `notifications:read`, `notifications:send`. *Edge cases*: idempotent dispatch keys so retries never double-send.
14. **Analytics & Reports**: Accurate P&L (from `orders` + `financial_transactions` + `expenses`), funnel conversion, NFC/QR tap analytics (`card_events` + `qr_scan_events`), and CSV/PDF exports. *Reuses*: `orders`, `expenses`, `financial_transactions`, `qr_scan_events`, `card_events`. *Permissions*: `analytics:read`, `analytics:export`. *Edge cases*: timezone-consistent aggregation (`Asia/Kolkata`), exclude cancelled/refunded from net revenue.
15. **Roles & Permissions**: Wire `roles`, `permissions`, `role_permissions`, `user_roles` (`backend/src/database/schema/permissions.ts`) into `RolesGuard` / `PermissionsGuard` for granular RBAC instead of coarse `systemRole` strings. *Reuses*: `schema/permissions.ts`, `RolesGuard`. *Permissions*: `rbac:manage`. *Edge cases*: cache role-permission matrix in Redis with immediate invalidation on edit.
16. **Platform Settings**: UI & API for `system_settings` (brand config, contact email, CNAME, feature flags) and `feature_flags` (`backend/src/database/schema/settings.ts`). *Reuses*: `system_settings`, `feature_flags`. *Permissions*: `settings:read`, `settings:write`. *Edge cases*: audit every flag/setting change; validate URLs and colors.
17. **Activity Logs**: Unified, searchable, filterable, paginated viewer over `audit_logs` (filter by actor, action, resourceType, date range) + automatic audit middleware/interceptor on all admin/support mutations. *Reuses*: `audit_logs`, `SupportService.getAuditTrail`. *Permissions*: `audit:read`. *Edge cases*: append-only immutability (no update/delete endpoints), redact secrets/PII in metadata.

---

## K. Database Tables & Relationships Relevant to Administration

- **Auth & Tenancy** (`auth.ts`, `orgs.ts`, `permissions.ts`): `users` (1:N `sessions`, `accounts`, `profiles`, `orders`), `organizations` (1:N `members`, `invitations`, `tenant_subscriptions`), `roles`, `permissions`, `role_permissions`, `user_roles`.
- **Profiles & Leads** (`profiles.ts`, `leads.ts`, `publishing.ts`): `profiles` (1:N `profile_businesses`, `profile_catalogue_items`, `profile_sections`, `username_aliases`, `leads`, `publish_history`), `templates`.
- **NFC & QR** (`cards.ts`, `qr.ts`, `studio.ts`): `card_batches` (1:N `cards`), `cards` (N:1 `profiles`, `users`; 1:N `card_assignments`, `card_events`, `activation_attempts`), `purchased_cards` (N:1 `orders`, `order_items`, `profiles`, `cards`), `qr_codes` (1:N `qr_scan_events`).
- **Products & Studio** (`studio.ts`): `card_products` (1:N `card_product_variants`, `card_product_templates`), `card_design_templates`, `card_designs`, `cart_items`, `purchase_journeys`.
- **Orders & Finance** (`orders.ts`, `finance.ts`, `addresses.ts`): `addresses`, `orders` (1:N `order_items`, `order_status_history`, `payments`, `purchased_cards`), `expenses`, `financial_transactions`.
- **Platform, Media & Audit** (`plans.ts`, `settings.ts`, `media.ts`, `audit.ts`): `plans`, `tenant_subscriptions`, `system_settings`, `feature_flags`, `media_assets`, `audit_logs`.

---

## L. Cross-Module Dependencies

- **User Suspension (`User Mgmt`)** $\rightarrow$ must revoke `sessions`, suspend `profiles`, purge Redis `profile:slug:*`, and block `CardsService.resolvePublicNfcToken`.
- **Order Cancellation / Refund (`Orders` & `Payments`)** $\rightarrow$ must write `financial_transactions` + `order_status_history`, revoke/unlink `purchased_cards`, restore `inventory`, and update `Analytics`.
- **Physical Provisioning (`NFC Cards`)** $\rightarrow$ links `card_batches` / `cards` to `purchased_cards.physicalCardId` and triggers `Orders` fulfillment stage (`CARD_READY` / `DISPATCHED`).
- **RBAC (`Roles & Permissions`)** $\rightarrow$ gates all 17 Admin & Staff modules and writes to `Activity Logs` (`audit_logs`).
- **Product/Template Changes (`Products`)** $\rightarrow$ must preserve frozen `order_items.designSnapshotJson` and `card_designs` integrity.

---

## M. Recommended Implementation Phases & N. Pre-Admin Critical Fixes

### N. Critical Issues to Fix Before Building Admin UI
1. **Close Security Holes**: Fix `UploadsService.delete` IDOR (`uploads.service.ts:372`), enforce mandatory Razorpay HMAC & disable UPI self-approval in prod (`orders.service.ts:608-751`), lock down `CardsService.linkCardToProfile` (`cards.service.ts:614`), enable `@nestjs/throttler`, and wrap `/admin` & `/support` in frontend role-aware `<ProtectedRoute>`.
2. **Fix Financial & Order Integrity**: Fix `AdminService.getFinancialSummary` (`admin.service.ts:60-123`), fix `finance.ts:38` column name, fix `AdminPage.tsx` legacy lowercase status payload, revoke `purchased_cards` on cancel/refund, and prevent `verifyPayment` on cancelled orders.
3. **Fix NFC & Profile Consistency**: Stop `ProfilesService.update` from overwriting `purchasedCards.nfcUrl` (`profiles.service.ts:808`), fix `allocatePurchasedCards` token collision retry + 64-bit entropy, and enforce `users.status` check in `findBySlug` / `resolvePublicNfcToken`.
4. **Add Zod/DTO Validation**: Validate all `AdminController`, `SupportController`, `ProfilesController`, and `DesignsService` payloads.

---

## 10. Implementation Roadmap

1. **Phase 0 — Security, Validation & Data Integrity Hotfixes (Prerequisite)**
   - *Affected*: `uploads.service.ts`, `orders.service.ts`, `cards.service.ts`, `profiles.service.ts`, `admin.service.ts`, `finance.ts`, `app.module.ts`, `frontend/src/routes/index.tsx`.
   - *Expected Result*: Zero IDOR, zero payment bypass, accurate P&L, safe NFC token/URL permanence, throttler active.
   - *Tests*: Security unit/integration tests (IDOR rejection, HMAC required, cancel revokes cards, suspended user blocked on `/p/:token`).
2. **Phase 1 — Admin Auth, Granular RBAC & Activity Logs**
   - *Prerequisites*: Phase 0.
   - *Affected*: `permissions.ts`, `roles.guard.ts`, new `AuditInterceptor`, `AdminLayout` shell + `/admin/logs`, `/admin/roles`.
   - *Expected Result*: Permission-gated admin shell with immutable audit trail on every mutation.
   - *Tests*: RBAC guard tests, audit log insertion tests.
3. **Phase 2 — Dashboard, User Management & Profile Moderation**
   - *Prerequisites*: Phase 1.
   - *Affected*: `admin.service.ts`, `support.service.ts`, `AdminPage.tsx` (or modular admin pages).
   - *Expected Result*: Paginated users/profiles, suspension cascade, slug unlock, force-republish.
   - *Tests*: Suspension cascade test (sessions + Redis + NFC resolution).
4. **Phase 3 — Unified Orders, Fulfillment, Payments & Refunds**
   - *Prerequisites*: Phase 0, Phase 1.
   - *Affected*: `orders.service.ts`, `admin.service.ts`, `finance.ts`, `AdminOrders` & `AdminPayments` UI.
   - *Expected Result*: Wire existing `/fulfillment`, `/payment`, `/profile-assistance`; add transactional refund flow + `financial_transactions` ledger.
   - *Tests*: Refund/cancel synchronization tests, N+1 query benchmark/assertion.
5. **Phase 4 — NFC Card Lifecycle & QR Verification**
   - *Prerequisites*: Phase 2, Phase 3.
   - *Affected*: `cards.service.ts`, `cards.controller.ts`, `VerifyQRTab.tsx`, NFC batch/card admin UI.
   - *Expected Result*: Batch provisioning, physical-to-purchased linking, deactivate/lost/replace, tap analytics (`card_events`), DB-backed QR verification.
   - *Tests*: Card lifecycle state machine & replacement tests.
6. **Phase 5 — Products, Variants, Templates & Inventory**
   - *Prerequisites*: Phase 1.
   - *Affected*: `studio.ts`, `products.service.ts`, `cart.service.ts`, `templates.service.ts`, `DesignStudioPage.tsx:207`, Admin Catalog UI.
   - *Expected Result*: Product/variant/template CRUD, `backImageUrl`, stock ledger, fixed Cart & Studio template fetching.
   - *Tests*: Cart pricing parity test, inventory deduction/restoration tests.
7. **Phase 6 — Staff Sales, Support Ticketing, Notifications, Analytics & Settings**
   - *Prerequisites*: Phases 1–5.
   - *Affected*: New `support_tickets`, `notifications` schemas/modules, `system_settings` / `feature_flags` UI, Analytics exports.
   - *Expected Result*: Complete operational cockpit with staff sales attribution, ticketing, transactional alerts, and platform configuration.
   - *Tests*: Ticket workflow, notification idempotency, staff sales voiding tests.
