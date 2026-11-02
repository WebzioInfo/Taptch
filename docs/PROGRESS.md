# Tapzio — Project Progress Tracking

| Milestone | Title | Status | Verified Capabilities | Mocks / Stubs | Deferred Items |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **M0** | Audit, Specs, Competitor Analysis & Design | **COMPLETE** | Comprehensive docs audit (`DOCS_AUDIT.md`), stack evaluation (`STACK_DECISIONS.md`), scale plan (`SCALE_PLAN.md`), working rules (`AGENTS.md`), ADR-007–012 logged, design directions corrected. | None | Fully verified |
| **M1** | Foundation & Core Infrastructure | **COMPLETE** | Next.js 15 App Router scaffold, Drizzle ORM dual-engine (`postgres.js` with `prepare: false` + persistent PGlite), 23 tables migrated with RLS enabled, Indian demo seed, Better Auth (org, 2FA, phone, email-OTP), `can()` permission engine, `withActor()` RLS transaction isolation, plan entitlement engine, Pino logger, Redis client with in-memory fallback, rate limiter, audit logger, `/api/health`, `/api/ready`, Direction 1 (Obsidian Luxury) UI kit, `/dev/gallery` design system studio, auth pages (`/login`, `/register`, `/verify`), GitHub Actions CI, k6 smoke harness. Repository audited, cleaned, and verified (`PROJECT_CLEANUP_REPORT.md`, ADR-016). | `MOCK` OTP Console Provider (`src/lib/auth/otp-provider.ts`), `MOCK` InMemoryRedis (`src/lib/redis/index.ts`) when Redis is unset. | Online payments & Razorpay deferred to Phase 2 per user approval. |
| **M2** | NFC / QR Core & Redirects | **COMPLETE** | Redis-cached token lookup (<50ms redirect), `/n/[token]` NFC tap redirect with daily anonymized IP telemetry, `/q/[token]` QR redirect, `/claim/[token]` card activation flow, deterministic SHA-256 activation hashes. | None | Fully verified |
| **M3** | Profile Engine, Public Rendering & RLS | **COMPLETE** | Zero Dynamic SSR hot path on `/p/[slug]`, pre-compiled `published_json` snapshot reads, multi-business switcher tabs, product/service showcase shelf, vCard 3.0 download, reciprocal contact exchange modal, QR modal, 6 luxury templates (Obsidian, Ivory, Aurora, Zenith, Catalyst, Apex). | None | Fully verified |
| **M4** | Customer Dashboard & Profile Builder | **COMPLETE** | Executive Obsidian Luxury dashboard with real-time profile/card/lead metrics, 3-pane responsive live editor (`/builder/[id]`), new profile wizard (`/builder/new`), luxury template gallery (`/templates`) with dual-device preview modal. | None | Fully verified |
| **M5** | Corporate & Organization Management | IN PROGRESS | Corporate org schema, departments, 12 seeded members, tenant subscriptions. | None | - |
| **M6** | Commerce, Hardware Orders & Billing | **COMPLETE** | Physical hardware order requests (`POST /api/v1/orders`), material selection (Matte PVC vs Brushed Stainless Metal), shipping address capture, manual payment status tracking (`unpaid`, `paid_offline`, `waived`), order history. | None | Live checkout / Razorpay deferred to Phase 2. |
| **M7** | Super Admin & Platform Control | **COMPLETE** | Super Admin control dashboard (`/admin`), platform metric counters (`/api/v1/admin/stats`), physical card production Kanban queue, courier tracking number injection, template status manager. | None | Fully verified |
| **M8** | Reseller Portal, Domains & White-Label | PENDING | - | - | - |
| **M9** | Extras & Production Hardening | PENDING | - | - | - |

## Credentials & External Service Status
- **PostgreSQL / Supabase**: Successfully connected to hosted Supabase PostgreSQL 17 (`db.hwrgtzkhcdklizyfargh.supabase.co:5432/postgres`), all 5 migration batches (25 tables including `leads` and `orders`, RLS policies, Better Auth columns) applied via `npm run db:migrate`. Embedded PGlite fully migrated and synchronized for offline test isolation.
- **Redis / MinIO / Mailpit**: Docker Compose infrastructure ready, with in-memory Redis fallback for zero-dependency local development and CI.
- **Razorpay / Payments**: DEFERRED to Phase 2. Zero payment dependencies or credentials required for initial release. Plans and entitlements are data-driven, manually assigned by Super Admin. Order requests use manual `payment_status`.
- **Apple Wallet / Google Wallet**: Feature flagged disabled until developer certificates provided; mock pass renderer provided.
- **SMS / WhatsApp**: Console logging provider interface in dev mode (`MOCK`); production WhatsApp Cloud API and MSG91 stubs ready behind provider interface.

## Toolchain & Package Manager Standardization (Verified)
- **NPM Exclusively Standardized**:
  - *Status*: Complete & Authoritative.
  - *Package Manager*: Pinned `"packageManager": "npm@11.13.0"` in `package.json`.
  - *Lockfile*: Generated consistent `package-lock.json` as the sole authoritative lockfile.
  - *Competing Files Purged*: Safely deleted `pnpm-lock.yaml` and `pnpm-workspace.yaml`.
  - *CI/CD Workflow*: Updated `.github/workflows/ci.yml` to use `actions/setup-node` with `cache: 'npm'`, `npm ci`, `npm run`, and `npm test`.
  - *Permanent Governance*: Added mandatory NPM-exclusive rule to `AGENTS.md` and `.agents/rules/00-core-engineering.md`.

## Quality & Verification Benchmarks
- **Vitest Test Suite**: **42/42 tests passing** across 8 test files (`tenant-rls`, `entitlements`, `profiles`, `templates`, `cards-leads-orders`, `permissions`, `brand-literal`, `no-direct-db-in-pages`).
- **TypeScript Typecheck**: **0 errors** (`tsc --noEmit` clean exit code 0).
- **ESLint**: **0 warnings, 0 errors** (`✔ No ESLint warnings or errors`).
- **Next.js Production Build**: **40/40 routes compiled** successfully in 35.8s.
- **Brand Literal Rule**: Verified zero hardcoded "Tapzio" strings across UI components and pages outside config.
- **Zero Dynamic Hot Path**: Verified `/p/[slug]` imports zero dynamic request headers or cookies.
