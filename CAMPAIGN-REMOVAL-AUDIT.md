# TAPTCH — Complete Campaign Module Removal Audit

**Audit Status:** Completed  
**Execution Date:** November 2026  
**Target Scope:** Total purge of campaign functionality, database objects, backend APIs, frontend storefronts, admin screens, test files, and configuration.  
**Platform Architecture:** TAPTCH NFC Digital Identity & Profile Platform

---

## 1. Executive Summary

TAPTCH is exclusively a physical and digital identity platform (contactless NFC business cards, dynamic QR codes, digital profiles, and team workspaces). A legacy, isolated commercial sales module for "Instagram NFC Smart Cards" had previously been introduced under `campaigns`.

In accordance with architectural governance, a comprehensive 360-degree discovery was conducted across the entire codebase. All campaign-specific code, routes, schemas, database tables, and configuration have been completely identified, decoupled, and removed without affecting core digital identity, authentication, profile, card, lead, or QR functionality.

---

## 2. Identified Campaign Modules & Files

### 2.1. Backend Domain & Services (`src/campaigns/`)
All files in `src/campaigns/instagram-card/` were exclusively campaign-specific:
- `components/customization/CardCustomizerPreview.tsx`
- `config/brand.config.ts`
- `config/index.ts`
- `services/designer.service.ts`
- `services/document.service.ts`
- `services/finance.service.ts`
- `services/job.service.ts`
- `services/order.service.ts`
- `services/payment.service.ts`
- `services/pricing.service.ts`
- `services/storage.service.ts`
- `types/index.ts`
- `index.ts`

### 2.2. Frontend Routes & UI Pages
- Public Storefront: `src/app/campaigns/instagram-card/page.tsx` & `layout.tsx`
- Admin Operations Cockpit: `src/app/admin/campaigns/instagram-card/page.tsx`

### 2.3. Backend API Route Handlers (`src/app/api/v1/campaigns/`)
- Admin Operations: `src/app/api/v1/campaigns/instagram-card/admin/route.ts`
- Price Calculation: `src/app/api/v1/campaigns/instagram-card/calculate-price/route.ts`
- Document Generation: `src/app/api/v1/campaigns/instagram-card/documents/route.ts`
- Customer Orders: `src/app/api/v1/campaigns/instagram-card/orders/route.ts`
- Order Tracking: `src/app/api/v1/campaigns/instagram-card/orders/track/route.ts`
- Payment Reporting: `src/app/api/v1/campaigns/instagram-card/payments/report/route.ts`
- Products Catalog: `src/app/api/v1/campaigns/instagram-card/products/route.ts`

### 2.4. Database Schema & Tables (`src/db/schema/campaigns.ts`)
Nine confirmed campaign-only relational tables:
1. `campaign_settings`
2. `campaign_products`
3. `campaign_orders`
4. `campaign_designs`
5. `campaign_payments`
6. `campaign_refunds`
7. `campaign_expenses`
8. `campaign_inventory_movements`
9. `campaign_documents`

### 2.5. Test Suites & Benchmarks
- Unit Test: `tests/unit/instagram-card-campaign.test.ts`
- Load Test Suite: `load/campaign/` (all 6 k6 benchmark scenarios)

### 2.6. Infrastructure & Environment Configuration
- `.env.example`, `.env.local`, `.env.production.example`: Section 8 (`CAMPAIGN_*`, `NEXT_PUBLIC_CAMPAIGN_*`) and `CAMPAIGN_STORAGE_BUCKET`.
- `ENVIRONMENT_VARIABLES.md`: Section 3.
- `src/app/robots.ts` & `src/app/sitemap.ts`: Removal of `/campaigns/instagram-card`.
- `src/components/marketing/MarketingFooter.tsx`: Removal of link to `/campaigns/instagram-card`.

---

## 3. Dependency & Shared Resource Analysis

A thorough dependency audit verified:
1. **`pdf-lib`**: While used by campaign document generation, `pdf-lib` is also used by `src/modules/qr/print-engine.ts` for dynamic QR batch printing. It was therefore safely retained in `package.json`.
2. **`users` table foreign keys**: `campaign_orders`, `campaign_payments`, `campaign_refunds`, `campaign_expenses`, and `campaign_inventory_movements` maintained nullable foreign keys to `users.id`. Dropping the campaign tables severed no foreign keys that other core tables rely upon.
3. **Core modules (Profiles, Cards, Leads, Organizations, QR, Better Auth)**: Possess **zero** dependencies on any campaign schema or code.

