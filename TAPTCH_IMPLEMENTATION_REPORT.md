# Taptch Product Expansion: Implementation Report

**Author:** Principal Software Architect  
**Architecture:** Decoupled React 19 (Vite) Frontend + NestJS 11 Backend  
**Database:** PostgreSQL with Drizzle ORM  
**Date:** November 2026  

---

## 1. Architectural Strategy

The implementation strictly followed the architectural boundaries:
- **No Shared Package / No Workspaces:** Frontend and backend remain 100% independent Node projects with isolated `package.json`, dependencies, and build pipelines.
- **Incremental Safe Migrations:** Database schema enhancements were applied via DDL ALTER TABLE statements preserving existing user profiles, cards, and tenant data.
- **Zero Next.js Artifacts:** Standard Vite single-page application with client routing via React Router DOM v7 and server-side crawler routing in NestJS for SEO indexation.

---

## 2. Implemented Modules & File Changes

### A. Leads & Universal Contact Form
1. **Database Schema:** `backend/src/database/schema/leads.ts`
   - Added `owner_user_id` (foreign key to `users.id` with cascade).
   - Added `subject`, `message`, `status` (`NEW`, `CONTACTED`, `QUALIFIED`, `CONVERTED`, `LOST`, `ARCHIVED`), and `updated_at`.
2. **Backend Service:** `backend/src/modules/leads/leads.service.ts`
   - Automated `ownerUserId` discovery from target `profileId`.
   - Honeypot bot detection: Discards submissions containing text in hidden trap inputs (`website`, `company_url`).
   - Rapid submission rate-limiting: Discards identical email submissions within 60 seconds.
   - Status updates, internal notes, lead statistics aggregation, and deletion.
3. **Backend Controller:** `backend/src/modules/leads/leads.controller.ts`
   - `POST /api/v1/leads`: Public submission.
   - `GET /api/v1/leads`: User's captured leads.
   - `GET /api/v1/leads/stats`: Summary counts by status.
   - `PATCH /api/v1/leads/:id`: Status update & note updates.
   - `DELETE /api/v1/leads/:id`: Lead removal.
4. **Frontend Contact Component:** `frontend/src/components/templates/TemplateContactForm.tsx`
   - Theme-aware inputs, submit state, validation, error/success messaging, and honeypot field.
   - Embedded into all 9 templates (`frontend/src/components/templates/*.tsx`).
5. **Frontend CRM View:** `frontend/src/pages/LeadsPage.tsx`
   - Pipeline filter tabs, KPI counter cards, interactive lead details modal, internal notes, WhatsApp direct dial, Tel, Mailto, and UTF-8 CSV export.

### B. Progressive Web Application (PWA)
1. **Web App Manifest:** `frontend/public/manifest.webmanifest`
   - Configured standalone display mode, orientation, brand icons (192x192, 512x512, maskable), theme color (`#0A0A0C`), and start URL (`/dashboard`).
2. **Service Worker:** `frontend/public/sw.js`
   - Cache versioning: `taptch-cache-v2`.
   - Stale-While-Revalidate caching strategy for immutable static assets (scripts, styles, fonts, images).
   - Strict bypass (Network Only / Never Cache) for `/api/*`, `/admin/*`, `/support/*`, and auth cookies.
3. **Smart Install Component:** `frontend/src/components/pwa/PwaInstallPrompt.tsx`
   - Intercepts `beforeinstallprompt` on Android & Chrome desktop.
   - Detects iOS Safari mobile devices and provides visual step-by-step instructions ("Tap Share -> Add to Home Screen").

### C. Automated SEO Engine
1. **Dynamic Metadata & JSON-LD:** `frontend/src/components/seo/MetaTags.tsx`
   - Dynamic document title, description, keywords, canonical link, Open Graph tags, and Twitter Cards.
   - Dynamic Schema.org injection: `Person` schema for personal visiting cards; `Organization` schema for business profiles.
2. **Server-Side Crawler Route:** `backend/src/modules/seo/seo.controller.ts`
   - `GET /p/:slug`: Delivers crawler-compatible SSR HTML with Open Graph cards and JSON-LD when crawlers (Googlebot, Twitterbot, LinkedInBot, etc.) request the URL.
   - `GET /sitemap.xml`: Generates XML sitemap of all public profiles and main marketing pages.
   - `GET /robots.txt`: Directs search engine crawlers with allow/disallow directives.
   - `GET /api/v1/seo/preview/:slug`: Provides live search snippet data to the builder.
3. **Live Search Preview in Builder:** `frontend/src/pages/BuilderPage.tsx`
   - Interactive SEO preview tab showing both Google Desktop Search snippet and Social Card preview.

### D. Dual Profile Architecture
1. **Builder Mode Switch:** `frontend/src/pages/BuilderPage.tsx`
   - Prominent toggle between **Personal Visiting Card** and **Business Profile**.
   - Personal profile mode hides business-only tabs (Products, Services, Catalogues, Business Hours) keeping the visiting card personal, fast, and clutter-free.
   - Business profile mode provides rich commercial features.

### E. Google OAuth 2.0
1. **Backend Integration:** `backend/src/modules/auth/auth.service.ts` & `auth.controller.ts`
   - `GET /api/auth/oauth/google`: Redirects to Google consent screen.
   - `GET /api/auth/oauth/google/callback`: Exchanges authorization code, fetches user info (`sub`, `email`, `name`, `picture`), creates/updates user record with `emailVerified = true`, issues secure session cookie and token.
   - `POST /api/auth/oauth/google/verify-token`: One-tap / credential token verification.
2. **Frontend UI:** `frontend/src/pages/LoginPage.tsx` & `RegisterPage.tsx`
   - Official Google button with official SVG logo and hover feedback.

### F. Three-Role Platform Governance
1. **Roles Matrix:**
   - `super_admin`: Full root access to all metrics, user governance, financial P&L, system settings.
   - `admin`: Platform administration, customer assistance, order fulfillment.
   - `support_admin`: Dedicated operational workspace at `/support`. Can search users, inspect card routing, view profile status, audit trails. Strict authorization gate prevents viewing financial P&L and editing payout settings.
   - `user`: Standard self-service digital identity workspace.
2. **Support Operational Dashboard:** `frontend/src/pages/SupportPage.tsx` & `backend/src/modules/support/`
   - Customer lookup by email/name/card ID.
   - Profile moderation and quick flag/activate actions.
   - Live audit trail logging all staff actions for compliance.

### G. Financial Management & P&L Engine
1. **Database Schema:** `backend/src/database/schema/finance.ts`
   - `expenses`: Category, description, amount, date, logged_by, receipt_url.
   - `financial_transactions`: Reference, type, amount, status, metadata.
2. **Financial Aggregation Service:** `backend/src/modules/admin/admin.service.ts`
   - Real-time aggregation of Gross Order Value and Settled Cash Revenue.
   - Cost of Goods Sold (COGS) model: ₹150 for PVC cards, ₹450 for Metal cards.
   - Operating expense aggregation by category (Raw Materials, Shipping, Software/Cloud, Marketing, Office).
   - Net Bottom-Line Profit and Margin computation.
3. **Admin Finance View:** `frontend/src/pages/AdminPage.tsx`
   - Metric cards: Settled Revenue, COGS, Total Expenses, Net Profit, Operating Margin %.
   - Interactive expense logging modal with instant P&L re-calculation.
