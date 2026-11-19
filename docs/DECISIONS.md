# Architectural Decision Records (ADRs)

## ADR-0015: NFC Card Ordering, Checkout, Payment Simulation & Design Preservation

### Context
Customers using the Live NFC Card Design Studio (`/studio`) need a frictionless way to order their customized physical smart cards with guaranteed vector artwork preservation, optional digital profile pairing, verified payment processing, real-time tracking, and administrative fulfillment controls.

### Decisions Made

1. **Durable Immutable Design Snapshots**:
   - Order items store a frozen vector snapshot (`orderItems.designSnapshotJson`) capturing front and back canvas JSON, dimensions, preview images, and material configuration at the moment of order placement.
   - Modifications to the draft design in `/studio` after placing an order will never mutate placed orders.

2. **Server-Side Pricing & Tax Enforcement**:
   - All financial math is strictly calculated on the backend to prevent client tampering.
   - Standard 18% GST applies to subtotal.
   - Standard shipping is ₹99; waived (Free Shipping) for orders with subtotal ₹2,000 or greater.

3. **Idempotency Protection**:
   - Each checkout session generates a unique client-side `idempotencyKey`. The backend checks this key before inserting an order to prevent duplicate orders and payments on double-clicks or unstable mobile networks.

4. **Payment Gateway & Simulation Architecture**:
   - **Razorpay Standard**: Supports online payment with server-side HMAC-SHA256 signature verification (`crypto.createHmac('sha256', secret)`).
   - **Interactive UPI Simulator**: Supports test mode QR display with instant `SUCCESS`, `FAILED`, and `CANCELLED` status triggers for staging and QA without real funds.
   - **Cash on Delivery (COD)**: Creates orders with `paymentStatus = 'COD_PENDING'` and `orderStatus = 'ORDER_CONFIRMED'`.

5. **Decoupled Order Fulfillment & Payment Statuses**:
   - Fulfillment stages (`ORDER_CONFIRMED` -> `DESIGN_REVIEW` -> `CARD_PRODUCTION` -> `CARD_READY` -> `DISPATCHED` -> `DELIVERED`) are strictly separated from payment statuses (`PENDING`, `COD_PENDING`, `PAID`, `FAILED`, `REFUNDED`). Admins can mark COD payments collected upon delivery without altering fulfillment status.

6. **Audit Trail Logging**:
   - Every status transition (customer-initiated, payment webhook, admin stage update) appends an immutable entry to `orderStatusHistory` with timestamp and actor ID.

## ADR-0016: Multi-Tier Canvas-to-Checkout Artwork Hydration & Order Freezing

### Context
When a customer designs a physical smart card in the Canvas Studio and proceeds to checkout, the live artwork preview must immediately reflect the custom design for both front and back sides without layout shift, loss of state on page refresh, or fallback to generic placeholder mockups.

### Decisions Made

1. **Dual-Sided Synchronous Draft Saving**:
   - `handleSaveDesign` in both desktop (`EditorTopBar.tsx`) and mobile (`MobileStudioTopBar.tsx`) captures the active side via `safeSerializeCanvas` and headless renders the opposite side via `renderSideToPreview()` to produce high-fidelity PNG data URLs for both sides.
   - Synchronizes Zustand store `setPreviews()`, persists a local fallback draft in `localStorage`, and posts `frontCanvasJson`, `backCanvasJson`, `previewUrl`, and `backPreviewUrl` to `/api/v1/designs/draft`.
   - Halts navigation if the draft save fails, preventing empty or corrupted checkout sessions.

2. **Multi-Tier Cascade Artwork Hydration**:
   - In `CheckoutPage.tsx`, artwork resolves through a 4-tier cascade:
     1. In-memory Zustand store (zero-latency transition from studio).
     2. React Query `/api/v1/designs/:id` (database-backed persistence).
     3. LocalStorage draft cache (survives tab close and browser refresh).
     4. On-the-fly headless rendering via `renderSideToPreview()` if JSON exists without preview URLs.

3. **In-Summary Quantity Stepper Controls**:
   - Integrated quantity adjustment steppers directly inside both the desktop sticky Order Summary and the mobile bottom drawer, ensuring customers can adjust card count from any step (Card, Profile, Delivery, Payment) without having to return to Step 1.

---

## ADR-0010: Design Studio Draft Save Hardening & RLS Isolation (2026-11-19)

### Context
Customers experienced HTTP 500 (`INTERNAL_ERROR`) when attempting to save drafts or proceed to checkout via "Order Now" from the NFC Design Studio (`POST /api/v1/designs/draft`).

### Root Causes
1. **RLS Missing Policy Lockout**: Table `card_designs` had Row-Level Security enabled in migration `0014`, but zero access policies were defined. When `withActor` injected `app.current_user_id`, non-superusers were blocked by PostgreSQL with error code `42501`.
2. **PostgreSQL Foreign Key Violations**: `card_designs` strictly references `card_products(id)` and `card_product_variants(id)`, which were previously served from in-memory arrays in `ProductsService` without physical database rows in `card_products`.
3. **Express Default 100kb Body Parser Limit**: Large dual-sided canvas vector JSON payloads accompanied by base64 PNG preview data URLs exceeded Express's 100kb payload ceiling, throwing `PayloadTooLargeError`.
4. **Client-Side Concurrency & Race Conditions**: Autosave intervals and click events on "Order Now" triggered overlapping asynchronous requests without in-flight promise coordination.

### Decisions & Architecture
1. **Database Migration `0018_design_studio_seeds_and_rls.sql`**:
   - Implemented transaction-scoped RLS policies for `card_designs` and `cart_items` bound to `customer_id = current_setting('app.current_user_id', true) OR current_setting('app.is_admin', true) = 'true'`.
   - Seeded all starter card products (`prod_classic_pvc`, `prod_matte_obsidian`, etc.) and default templates into Postgres.
2. **Payload Ceiling Expansion**:
   - Configured NestJS Express body parsers to 25MB (`json({ limit: '25mb' })`, `urlencoded({ limit: '25mb' })`) in `main.ts`.
3. **Defensive FK Resolution in `DesignsService`**:
   - Validates incoming `productId`, falls back to active database product, or creates a fallback row on-the-fly.
   - Sanitizes `templateId` (removes non-UUID or non-existent template slugs like `"custom"` to prevent FK violations).
   - Queries existing drafts by explicit `designId` first, then by customer draft conditions to prevent record duplication.
4. **In-Flight Save Coordination**:
   - Added `savingPromiseRef` in both `EditorTopBar.tsx` and `MobileStudioTopBar.tsx` to debounce requests and reuse active save promises.

---

## ADR-0011: Order Tracking Page Light & Orange Design System Harmonization (2026-11-19)

### Context
The Order Tracking interface (`/orders/:id/track`) still utilized the legacy Obsidian Luxury dark-and-gold styling, which clashed with the redesigned, premium Light & Orange checkout experience. The interface also suffered from visual clutter, including decorative pulsating badges, oversized cards, and hardcoded brand strings.

### Decisions
1. **Light & Orange Visual Language**:
   - Background set to clean `#F8F9FA`, card surfaces to white (`#FFFFFF`) with subtle dividers (`border-gray-200`).
   - Primary accent standardized to Taptch safety orange (`#FF6A00`), typography to deep charcoal (`#18181B`).
2. **Simplified, Unbroken 6-Stage Timeline**:
   - Implemented an uninterrupted vertical track with distinct node indicators for Completed (orange checkmark), Current (pulsing ring-accented orange circle with "In Progress" badge), and Upcoming stages.
   - Stage timestamps are rendered strictly when substantiated by `statusHistory` logs.
3. **Brand From Config Enforcement**:
   - Eliminated hardcoded "Taptch" string literals in favor of dynamic `defaultBrandConfig.name` and the official `BrandLogo` component.
4. **Clean Information Hierarchy**:
   - Grouped fulfillment data into a structured 2-column layout on desktop (`max-w-5xl`) and fluid single-column on mobile.
   - Suppressed Concierge Profile Setup when not applicable (`NOT_REQUIRED`).

---

## ADR-0012: Application-Wide Light + Orange Theme Migration (2026-11-19)

### Context
Following the successful redesign of the Checkout Wizard and Order Tracking interfaces into a clean Light + Orange aesthetic, the remainder of the application (Sidebar navigation, Dashboard, Orders, Leads, Admin Cockpit, Support Center, Profile Builder, NFC Design Studio controls, and Dialogs) retained legacy dark styling (`#0A0A0C`, `#121216`, gold accents), creating an inconsistent user experience.

### Decisions
1. **Global CSS Design Tokens Alignment**:
   - Unified CSS custom properties in `frontend/src/tokens.css` across `:root`, `[data-theme="light"]`, and `[data-theme="dark"]`:
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
2. **Application Shell & Sidebar Navigation**:
   - Updated `AppLayout.tsx` to mount with `data-theme="light"`.
   - Sidebar converted to pure white (`bg-white`) with subtle divider (`border-r border-[#E8E8E8]`).
   - Active navigation items styled with `#FFF3E9` background, `#FF6A00` text, and a crisp vertical indicator bar (`bg-[#FF6A00]`).
3. **NFC Card Studio & Canvas Independence**:
   - Switched studio shell, top bar, palette tabs, inspector sidebar, and production modals (`ExportModal`, `UnsavedChangesModal`, `CardMockupPreview`, `AutoRecoveryBanner`) to Light + Orange.
   - Preserved independent Fabric canvas element rendering so customer card designs (black PVC, titanium, wood textures) are never overridden by the application theme.
4. **Zero Brand Literals & Architecture Compliance**:
   - Eliminated hardcoded brand name literals across `SupportPage.tsx` and `PwaInstallPrompt.tsx` using `defaultBrandConfig.name`.
   - Maintained 100% test pass rate across all 18 test files (128/128 tests passing).
