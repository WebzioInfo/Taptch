# Tapzio — Implementation Roadmap & Execution Plan

## 1. Roadmap Architecture
Development progresses through 10 gated milestones (M0 through M9). Each milestone delivers a small, verified slice of functionality verified with automated tests and visual inspections before proceeding.

```mermaid
flowchart LR
    M0["M0: Specs & Design"] --> M1["M1: Foundation"]
    M1 --> M2["M2: NFC & QR Core"]
    M2 --> M3["M3: Profile Engine & RLS"]
    M3 --> M4["M4: Builder & App"]
    M4 --> M5["M5: Corporate Orgs"]
    M5 --> M6["M6: Commerce & Ops"]
    M6 --> M7["M7: Super Admin"]
    M7 --> M8["M8: Reseller & Domains"]
    M8 --> M9["M9: Production Hardening"]
```

---

## 2. Milestone Breakdown & Verification Gates

### Milestone 0: Audit, Specs & Design (CURRENT)
- **Deliverables**:
  - Audit existing repo state (`d:\Webzio`), identify risks, confirm workspace structure.
  - Save master spec files into `/docs/spec/`.
  - Author foundational docs: `PRODUCT_REQUIREMENTS.md`, `SYSTEM_ARCHITECTURE.md`, `DATABASE_SCHEMA.md`, `API_SPECIFICATION.md`, `SECURITY_REQUIREMENTS.md`, `DESIGN_SYSTEM.md`, `IMPLEMENTATION_ROADMAP.md`, `competitor-matrix.md`.
  - Author `/docs/PROGRESS.md` and `/docs/DECISIONS.md`.
  - Produce 3 mobile-first visual directions for the public profile (390px hero mockups).
  - Explicit log of decisions made vs. awaiting approval.
- **Verification Gate**: Stop and await user approval on visual direction and workspace structure.

### Milestone 1: Foundation & Core Infrastructure
- **Deliverables**:
  - Scaffolding Next.js 15 App Router with TypeScript strict mode.
  - `docker-compose.yml` for local dependencies: PostgreSQL, Redis, MinIO, Mailpit.
  - Brand config layer (`src/config/brand.ts`).
  - Prisma schema, initial migrations, and seed scripts.
  - Auth.js setup: Magic Link / Email OTP, Google OAuth, phone OTP interface.
  - Mandatory TOTP MFA for admin roles.
  - Centralized permission engine (`can()`) with comprehensive unit tests.
  - Tenant-scoped Data Access Layer (DAL).
  - shadcn/ui primitive library with component gallery route.
- **Verification Gate**: `npm run dev` boots clean; tests pass; login works across distinct roles; permission matrix verified.

### Milestone 2: NFC / QR Core & Edge Redirects
- **Deliverables**:
  - Card batch and card inventory models.
  - High-speed `/n/{token}` and `/q/{token}` edge redirect handlers (< 50ms latency).
  - Redis cache-first lookup with resilient DB fallback.
  - Asynchronous event logging to BullMQ `analytics-ingest` queue.
  - Card activation flow (Argon2id activation code hash validation, rate limiting).
  - Lost card deactivation (HTTP 410 Gone) and instant card reassignment.
  - Vector QR code generator with automated decode test in CI.
  - RFC-compliant vCard 3.0/4.0 generator with embedded photo.
  - `tools/nfc-encoder` CLI with simulation mode.
- **Verification Gate**: Simulated tap redirects to profile; reassigning card updates destination without rewriting chip; brute-force lockout verified.

### Milestone 3: Profile Engine, Public Rendering & RLS
- **Deliverables**:
  - Zod schemas for all 22 profile section types.
  - Draft vs. published content pipeline with version history and rollback.
  - Template engine supporting JSON-based configuration tokens.
  - Implementation of first 3 studio launch templates: *Obsidian*, *Ivory*, *Aurora*.
  - Public profile rendering with ISR on-demand cache revalidation.
  - 1-tap Save Contact and Exchange Contact modal with explicit DPDP consent.
  - Dynamic OpenGraph (OG) image generation and JSON-LD structured data.
  - PostgreSQL Row-Level Security (RLS) policies on sensitive tables.
  - Automated IDOR and cross-tenant leakage test suite.
- **Verification Gate**: Mobile Lighthouse score ≥ 95; LCP < 1.2s; zero cross-tenant access in automated security tests.

### Milestone 4: Customer Dashboard & Profile Builder
- **Deliverables**:
  - Interactive onboarding wizard (< 3 minutes).
  - Three-pane desktop profile builder with live 390px phone-frame simulator.
  - Autosave with backend persistence confirmation and retry banner.
  - Remaining 3 studio templates: *Mono*, *Counsel*, *Studio*.
  - Multi-business switcher integration.
  - Media library with client-side image cropping and direct presigned S3 upload.
  - Leads CRM inbox with status stages, quick actions (Call, WhatsApp, Email), and CSV export.
  - Personal analytics dashboard.
- **Verification Gate**: End-to-end Playwright test: register → build profile → publish → scan QR → save contact → exchange contact → lead visible in inbox.

### Milestone 5: Corporate / Organization Management
- **Deliverables**:
  - Corporate organization workspaces, departments, designations.
  - CSV bulk employee import engine with pre-validation and downloadable error report.
  - BullMQ background jobs for bulk profile provisioning and card allocation.
  - Corporate Brand Lock enforcing immutable fields across employee cards.
  - Optional edit-approval workflow for corporate admins.
  - Offboarding workflow: card unlinking, profile archival, corporate lead retention.
  - Corporate directory page (`/org/[slug]/directory`) and aggregate team analytics.
- **Verification Gate**: Successful bulk import of 200 mock employees; offboarding test preserves leads and frees card token.

### Milestone 6: Entitlements, Hardware Orders & Production Kanban
- **Deliverables**:
  - Entitlement engine checking quotas dynamically across all write operations.
  - Plan administration (Free, Pro, Business, Enterprise) assigned manually by Super Admin.
  - Marketing site physical card configurator with live 2D/3D card preview.
  - Card order requests and production Kanban (`requested` → `design_review` → `approved` → `in_production` → `encoding` → `qc` → `shipped` → `delivered` → `cancelled`) with manual `payment_status` (`unpaid` | `paid_offline` | `waived`).
  - Print-ready 300 DPI PDF artwork generator with bleed, crop marks, and individual card QR codes.
- **Verification Gate**: Order request created, advances through production Kanban, creates encoded card, and delivers active card to customer without online payment gateway dependencies.
- **DEFERRED (Phase 2)**: Razorpay/Stripe checkout, recurring subscriptions, payment webhooks, automated GST PDF tax invoices.

### Milestone 7: Super Admin & Platform Control
- **Deliverables**:
  - Super-admin cockpit dashboard with live business KPIs (MRR, active users, orders, queue health).
  - User and organization management, subscription overrides, account suspension.
  - Production Kanban control board with courier tracking webhook integrations.
  - Template manager (create, edit, and publish JSON templates without code deploys).
  - Feature flag management console.
  - Super-admin impersonation mode with mandatory reason, 60-min TTL, persistent banner, and full audit logging.
- **Verification Gate**: Super admin performs complete operational maintenance without direct database access.

### Milestone 8: Reseller Portal, Custom Domains & White-Label
- **Deliverables**:
  - Dedicated Reseller Portal with client workspace creation.
  - Wholesale pricing engine and monthly commission statements.
  - Centralized White-Label settings (custom logos, favicons, brand colors, email footers).
  - Custom domain management: DNS TXT and CNAME verification worker.
  - Host-header security middleware routing verified domains to corresponding profiles and rejecting unknown hosts.
- **Verification Gate**: Reseller accesses only their clients; custom domain resolves safely to assigned profile.

### Milestone 9: Ecosystem Extras & Production Hardening
- **Deliverables**:
  - Digital Wallet Pass generator for Apple Wallet & Google Wallet (mock in dev, certificate-ready).
  - Branded HTML email signature generator.
  - Video call virtual background generator (1920×1080 PNG with QR).
  - Event mode for high-speed conference lead capture.
  - AI Profile Assistant interface (bio writer, tone rewriter, translator).
  - End-to-end performance and load testing (10,000 req/sec redirect benchmarks).
  - WCAG 2.2 AA accessibility audit.
  - Disaster recovery runbook and backup/restore verification.
- **Verification Gate**: Full system walkthrough with realistic Indian seed datasets across all roles; zero audit failures.

