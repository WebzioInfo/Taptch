# Taptch Engineering Progress Tracker

## Milestone: NFC Card Ordering, Checkout, Payments & Fulfillment System
- **Status**: Complete & Verified (Backend + Frontend)
- **Date**: 2026-11-18

### 1. Database & Schema Architecture
- **Orders Table Extensions**:
  - `orderNumber`: User-facing format (`TAP-YYYY-XXXX`).
  - `paymentMethod`: `razorpay` | `upi` | `cod` | `offline`.
  - `paymentReference`: Gateway transaction ID / UPI reference.
  - `profileAssistanceStatus`: `NOT_REQUIRED` | `REQUESTED` | `ASSIGNED` | `IN_PROGRESS` | `COMPLETED`.
  - `profileAssistanceNotes`: Customer or admin support notes.
  - `subtotal`, `shippingCost`, `taxAmount`, `totalAmount`, `currency`.
  - `courierName`, `trackingNumber`, `trackingUrl`, `internalNotes`, `idempotencyKey`.
- **Order Status History Table (`orderStatusHistory`)**:
  - Audit trail of all fulfillment status changes with `orderId`, `status`, `title`, `description`, `updatedBy`, `createdAt`.
- **Payments Table (`payments`)**:
  - Audit trail for financial transactions with gateway IDs, signatures, amounts, and statuses.
- **Migration SQL**: Authored in `backend/src/database/migrations/0015_nfc_ordering_and_payments.sql`.

### 2. Backend Domain Services & Endpoints
- **Orders Service (`backend/src/modules/orders/orders.service.ts`)**:
  - `createOrder`: Server-side pricing (18% GST, free shipping >= ₹2000 else ₹99), idempotency duplicate prevention, profile ownership verification, immutable vector design snapshot serialization.
  - `verifyPayment`: Razorpay HMAC-SHA256 signature verification & interactive UPI test simulation (`SUCCESS`, `FAILED`, `CANCELLED`).
  - `findAllForActor` & `findOneForActor`: Detailed order queries with frozen snapshots, attached profile, and status history timeline.
  - `cancelOrder`: Customer cancellation with manufacturing guard.
- **Orders Controller (`backend/src/modules/orders/orders.controller.ts`)**:
  - `GET /api/v1/orders`: List orders.
  - `GET /api/v1/orders/:id`: Detailed order lookup.
  - `POST /api/v1/orders`: Create order request.
  - `POST /api/v1/orders/:id/verify-payment`: Payment verification.
  - `POST /api/v1/orders/:id/cancel`: Pre-production cancellation.
- **Admin Management (`backend/src/modules/admin/admin.controller.ts` & `admin.service.ts`)**:
  - `GET /api/v1/admin/orders`: Filterable list by `q`, `orderStatus`, `paymentStatus`, `paymentMethod`, `profileAssistanceStatus`.
  - `GET /api/v1/admin/orders/:id`: Full inspection details.
  - `PATCH /api/v1/admin/orders/:id/fulfillment`: Stage updater (`ORDER_CONFIRMED` -> `DELIVERED`), courier tracking.
  - `PATCH /api/v1/admin/orders/:id/profile-assistance`: Concierge assistance manager.
  - `PATCH /api/v1/admin/orders/:id/payment`: Mark COD payments collected.

### 3. Frontend Pages & Luxury UI
- **Design Studio (`/studio`)**:
  - Desktop `EditorTopBar.tsx`: Prominent, luxury gold "Order Now" button and "Add to Cart".
  - Mobile `MobileStudioTopBar.tsx`: Header "Order" button and Action Sheet "Order Now" (preserves editor state, saves draft, navigates to `/checkout`).
- **Checkout Flow (`/checkout` — `CheckoutPage.tsx`)**:
  - Re-architected into a modern, mobile-first 4-step progressive wizard:
    - Step 1: **Your NFC Card** (material switch, quantity counter, unit price, important features, expandable technical specifications).
    - Step 2: **Choose Your Digital Profile** (pair existing published profile OR free concierge assistance with custom instructions).
    - Step 3: **Delivery Address** (validated Indian address format, inline error feedback, autofill).
    - Step 4: **Review Your Order & Payment** (itemized breakdown, individual [Edit] links jumping back to respective steps, Razorpay, UPI test simulation, COD).
  - Step Navigation: Desktop horizontal stepper (Card -> Profile -> Delivery -> Payment) with checkmarks & jump-back; Mobile compact progress bar (`Step X of 4`) with percentage.
  - Mobile Enhancements: Expandable/collapsible order summary at the top, full-width inputs $\ge 44$px, fixed/sticky bottom action bar (`Total ₹X` + `Continue` / `Place My Order`), safe-area-inset padding.
  - Brand Alignment: Switched from excessive gold/dark styling to Taptch's primary blue (`#166df5`), crisp high-contrast surfaces, readable text, zero jargon.
- **Order Confirmation (`/orders/:id/confirmation` — `OrderConfirmationPage.tsx`)**:
  - Complete receipt, itemized invoice breakdown, frozen snapshot info, real-time tracking link.
- **Customer Order History (`/orders` — `OrdersPage.tsx`)**:
  - Responsive cards with status badges, thumbnail specs, and direct shipment tracking links.
- **Real-Time Order Tracking (`/orders/:id/track` — `OrderTrackingPage.tsx`)**:
  - Vertical timeline backed by `orderStatusHistory`, auto-refresh polling (6s), courier tracking link, concierge assistance card.
- **Admin Orders Cockpit (`/admin` Orders Tab)**:
  - Fulfillment pipeline controls, status badges, and address inspection.

### 4. Checkout Stabilization & Canvas-to-Checkout Live Preview Integration (2026-11-19)
- **Root Cause Resolution**:
  - Eliminated malformed nested JSX blocks in `CheckoutPage.tsx` caused by overlapping edit operations in the live preview container.
  - Resolved duplicate `designId` assignment in `orderPayload` (TS1117).
  - Resolved `brandName` reference error by enforcing single source of truth `defaultBrandConfig.name`.
  - Added missing container closing tags in Step 1 live card artwork preview.
- **Canvas-to-Checkout Pipeline**:
  - Implemented dual-sided synchronous canvas capture in `EditorTopBar.tsx` and `MobileStudioTopBar.tsx`.
  - Integrated `renderSideToPreview()` headless fabric renderer for inactive side preview generation.
  - Multi-tier artwork hydration in `CheckoutPage.tsx`: Zustand store -> React Query `/api/v1/designs/:id` -> `localStorage` draft -> dynamic on-the-fly rendering.
  - Added interactive Quantity Adjustment directly inside the right-side Order Summary (desktop sticky card + mobile drawer).
  - Production build passing with 0 errors (`tsc && vite build`).
  - Vitest test suite passing 100% (18 test files, 124 tests across backend and frontend).
  - Search toolbar, multi-filter pills, inspection modal with vector design snapshot viewer, stage transitions, and COD payment collection.

### 5. Design Studio Draft Save & Checkout Persistence Permanent Stabilization (2026-11-19)
- **Root Cause Resolution for HTTP 500 (`POST /api/v1/designs/draft`)**:
  - *Database RLS Policy Gap*: `card_designs` had Row-Level Security enabled in migration `0014`, but zero access policies were created. Added migration `0018_design_studio_seeds_and_rls.sql` providing transaction-scoped RLS policies for `card_designs` and `cart_items` for authenticated customers (`current_setting('app.current_user_id', true)`) and admins.
  - *Foreign Key Integrity & Table Seeding*: Seeded production starter card products (`prod_classic_pvc`, `prod_matte_obsidian`, `prod_matte_pvc_01`, `prod_brushed_metal`, `prod_handcrafted_wood`), variants, and starter templates into PostgreSQL to satisfy foreign key constraints.
  - *Express Body Limit Overflow*: Set NestJS `json({ limit: '25mb' })` and `urlencoded({ limit: '25mb' })` in `backend/src/main.ts` to allow large multi-megabyte canvas vectors and high-res base64 artwork previews.
  - *Defensive FK Validation in `DesignsService.upsertDraft`*: Added proactive product/variant verification, fallback active product resolution, and sanitized template handling (`templateId: "custom"` mapped safely to `null`).
- **Race Condition Prevention in Studio**:
  - Implemented `savingPromiseRef` in both `EditorTopBar.tsx` and `MobileStudioTopBar.tsx` to debounce and coordinate concurrent autosave requests and "Order Now" checkout transitions.
- **Verification & Testing**:
  - Backend unit tests (`backend/src/tests/studio.service.test.ts`): Added 4 new tests for `DesignsService` (draft creation, draft updates, defensive fallback, and customer authorization isolation).
  - All test suites passing 100%: 18 test files, 128 tests passing (`npm test -- --run`).
  - Frontend production build: 0 errors (`npm run build --prefix frontend`).

### 6. Order Tracking Page — Premium Light & Orange Theme Redesign (2026-11-19)
- **Visual & UI/UX Transformation**:
  - Re-architected `/orders/:id/track` from legacy dark gold theme into a modern, minimal Light + Orange design language matching the redesigned checkout wizard.
  - Primary canvas: Clean white / subtle off-white background (`#F8F9FA`), pure white card surfaces, Taptch safety orange accents (`#FF6A00`), deep charcoal typography (`#18181B`), and crisp dividers (`border-gray-200`).
  - Removed dark styling (`bg-[#0A0A0C]`, `bg-[#121216]`), fake pulsating live tracking badges, and decorative clutter.
- **Page Header & Priority Status Hero**:
  - Compact sticky navigation header with back button, dynamic brand symbol/name from `defaultBrandConfig`, and monospace order reference badge (`#TAP-YYYY-XXXX`).
  - Priority Hero Banner showcasing prominent current fulfillment status, contextual stage description, last updated timestamp, and courier dispatch pill with external waybill tracking link when dispatched.
- **Production Timeline & Information Hierarchy**:
  - Continuous 6-stage vertical timeline with connected line segments, distinct visual indicators for completed (orange checkmark), in-progress (pulsing ring-accented orange circle with "In Progress" pill), and upcoming stages with verified database history timestamps.
  - Structured 2-column desktop layout (`max-w-5xl`) and fluid single-column mobile layout:
    - Left column: 6-stage Production & Dispatch Timeline.
    - Right column: Itemized Order Summary, Delivery Address destination, conditional Concierge Profile Setup / Linked Profile card, and ISO 7810 Hardware Guarantee with direct Tax Invoice link.
- **Verification & Testing**:
  - Vitest test suites passing 100% (18 test files, 128 tests passing).
  - Frontend production build passing with 0 errors (`tsc && vite build`).

### 7. Complete Application-Wide Light + Orange Theme Migration (2026-11-19)
- **Design System Tokens (`frontend/src/tokens.css`)**:
  - Standardized unified CSS variable tokens across `:root`, `[data-theme="light"]`, and `[data-theme="dark"]`:
    - `--bg-page`: `#F8F9FB`
    - `--bg-surface`: `#FFFFFF`
    - `--bg-raised`: `#FFFFFF`
    - `--bg-accent-light` / `--accent-tint`: `#FFF3E9`
    - `--ink`: `#171717`
    - `--ink-muted`: `#666666`
    - `--ink-subtle`: `#929292`
    - `--border`: `#E8E8E8`
    - `--accent`: `#FF6A00`
    - `--accent-hover`: `#E85D00`
    - `--success`: `#16A36A`
    - `--warning`: `#E5A000`
    - `--danger`: `#DC4545`
- **Application Shell & Navigation (`AppLayout.tsx`)**:
  - Switched default app container from `data-theme="dark"` to `data-theme="light"`.
  - Redesigned Desktop Sidebar: pure white background (`bg-white`), right divider (`border-r border-[#E8E8E8]`), brand logo, navigation items with `#666666` text, active navigation state with `#FFF3E9` background, `#FF6A00` text, and vertical orange indicator bar (`w-1 rounded-r bg-[#FF6A00]`).
  - Added user initials avatar in `#FFF3E9` with `#FF6A00` text, `#171717` user name, and clean sign-out button.
  - Mobile header, mobile drawer, and bottom navigation bar fully styled in Light + Orange.
- **Pages Migrated**:
  - **Orders Page (`OrdersPage.tsx`)**: White cards, `#E8E8E8` borders, `#FF6A00` CTAs, emerald/amber/orange status pills, clear pricing in `font-mono text-[#FF6A00]`.
  - **Order Tracking Page (`OrderTrackingPage.tsx`)**: `#F8F9FB` canvas, white cards, sticky header, 6-stage vertical progress timeline with connecting tracks, itemized order summary, shipping address, concierge card, and hardware guarantee.
  - **Leads Page (`LeadsPage.tsx`)**: Table header `bg-[#F8F9FB] text-[#666666] border-b border-[#E8E8E8]`, table rows `hover:bg-orange-50/40 text-[#171717]`, modal redesigned with `bg-white border-[#E8E8E8] shadow-2xl`, status buttons, and orange save CTA.
  - **Admin Cockpit (`AdminPage.tsx` & `VerifyQRTab.tsx`)**: Container set to `data-theme="light" text-[#171717]`. Metric cards, financial breakdown, expense form, user governance table, orders table, and QR scanner cards completely converted from `#121216` to `bg-white border-[#E8E8E8] shadow-xs text-[#171717]`.
  - **Support Cockpit (`SupportPage.tsx`)**: Converted from `#121216` to `bg-white border-[#E8E8E8] shadow-xs text-[#171717]`, sub-tabs with active `#FFF3E9` and `#FF6A00` border, dynamic brand config email subject.
  - **Profile Builder (`BuilderPage.tsx`)**: Removed `data-theme="dark"` and switched to `data-theme="light"`, seamlessly adopting the unified design tokens.
  - **Card Templates (`TemplatesPage.tsx`)**: Light theme token integration.
- **NFC Design Studio Shell & Modals**:
  - **Studio Page (`DesignStudioPage.tsx`)**: Switched `data-theme="dark"` to `data-theme="light"` on all studio shells while preserving independent Fabric canvas artwork rendering.
  - **Studio Palette (`EditorLeftSidebar.tsx`)**: Removed dark color scheme; redesigned Templates, Text, Uploads, Background, Elements, Artwork, and Layers panels with `bg-[var(--bg-raised)]`, `border-[var(--border)]`, active `#FF6A00` highlights, and light search inputs.
  - **Canvas Workspace (`CanvasStudio.tsx`)**: Orange selection outline (`#FF6A00`), orange circular handles, and crisp card border (`border-[var(--border)]`).
  - **Modals (`ExportModal.tsx`, `UnsavedChangesModal.tsx`, `CardMockupPreview.tsx`, `AutoRecoveryBanner.tsx`)**: Converted from `#0A0A0C` to `bg-white border-[#E8E8E8] text-[#171717]`, orange primary action buttons (`#FF6A00`), and subtle light overlays.
  - **Studio Error Boundary (`StudioErrorBoundary.tsx`)**: Converted fallback UI from `#0A0A0C` to `bg-[#F8F9FB]`, white cards, and orange retry buttons.
  - **PWA Prompt (`PwaInstallPrompt.tsx`)**: Converted to `bg-white/95 border-[#E8E8E8] text-[#171717]`, orange install button, dynamic brand config.
- **Verification & Integrity**:
  - `npm test -- --run`: All 18 test files (backend + frontend), 128 tests passed (100%).
  - `npm run build --prefix frontend`: Production TypeScript compilation and Vite bundling passed with 0 errors.
  - `npm run build --prefix backend`: Production NestJS build passed with 0 errors.
