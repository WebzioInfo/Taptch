# Tappzio — Project Progress Tracking

| Milestone | Title | Status | Verified Capabilities | Mocks / Stubs | Deferred Items |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **M0** | Audit, Specs, Competitor Analysis & Design | **COMPLETE** | Comprehensive docs audit (`DOCS_AUDIT.md`), stack evaluation (`STACK_DECISIONS.md`), scale plan (`SCALE_PLAN.md`), working rules (`AGENTS.md`), ADR-007–012 logged, design directions corrected. | None | Fully verified |
| **M1** | Foundation & Core Infrastructure | **COMPLETE** | Next.js 15 App Router scaffold, Drizzle ORM dual-engine (`postgres.js` with `prepare: false` + persistent PGlite), 27 tables migrated with RLS enabled, Indian demo seed, Better Auth (org, 2FA, phone, email-OTP), `can()` permission engine, `withActor()` RLS transaction isolation, plan entitlement engine, Pino logger, Redis client with in-memory fallback, rate limiter, audit logger, `/api/health`, `/api/ready`, Direction 1 (Obsidian Luxury) UI kit, `/dev/gallery` design system studio, auth pages (`/login`, `/register`, `/verify`), GitHub Actions CI, k6 smoke harness. Repository audited, cleaned, and verified (`PROJECT_CLEANUP_REPORT.md`, ADR-016). | `MOCK` OTP Console Provider (`src/lib/auth/otp-provider.ts`), `MOCK` InMemoryRedis (`src/lib/redis/index.ts`) when Redis is unset. | Online payments & Razorpay deferred to Phase 2 per user approval. |
| **M2** | NFC / QR Core & Redirects | **COMPLETE** | Redis-cached token lookup (<50ms redirect), `/n/[token]` NFC tap redirect with daily anonymized IP telemetry, `/q/[token]` QR redirect, `/claim/[token]` card activation flow, deterministic SHA-256 activation hashes. | None | Fully verified |
| **M3** | Profile Engine, Public Rendering & RLS | **COMPLETE** | Zero Dynamic SSR hot path on `/p/[slug]`, pre-compiled `published_json` snapshot reads, multi-business switcher tabs, product/service showcase shelf, vCard 3.0 download, reciprocal contact exchange modal, QR modal, 6 luxury templates (Obsidian, Ivory, Aurora, Zenith, Catalyst, Apex). Controlled plan-filtered public snapshot compilation. | None | Fully verified |
| **M4** | Customer Dashboard & Profile Builder | **COMPLETE** | Executive Obsidian Luxury dashboard with real-time profile/card/lead metrics, 3-pane responsive live editor (`/builder/[id]`), new profile wizard (`/builder/new`), luxury template gallery (`/templates`) with dual-device preview modal. Unrestricted draft profile editing across personal info, multi-business, products, services, gallery, videos, and PDF brochures. | None | Fully verified |
| **M5** | Corporate & Organization Management | IN PROGRESS | Corporate org schema, departments, 12 seeded members, tenant subscriptions. | None | - |
| **M6** | Commerce, Hardware Orders & Billing | **COMPLETE** | Physical hardware order requests (`POST /api/v1/orders`), material selection (Matte PVC vs Brushed Stainless Metal), shipping address capture, manual payment status tracking (`unpaid`, `paid_offline`, `waived`), order history. | None | Live checkout / Razorpay deferred to Phase 2. |
| **M7** | Super Admin & Platform Control | **COMPLETE** | Super Admin control dashboard (`/admin`), platform metric counters (`/api/v1/admin/stats`), physical card production Kanban queue, courier tracking number injection, template status manager, Publication Requests review & plan assignment queue with WhatsApp & Phone commercial links, Cloudinary Media Asset Registry inspection. | None | Fully verified |
| **M8** | Cloudinary Media & Controlled Publishing | **COMPLETE** | Official Cloudinary SDK (`cloudinary`) integration, signed client direct upload endpoints (`/api/v1/media/signature`), server-side streaming uploads (`/api/v1/media/upload`), strict folder taxonomy (`tappzio/profiles/`, `tappzio/businesses/`, etc.), `media_assets` registry, publication review workflow (`submitPublicationRequest`, `reviewPublicationRequest`, `assignUserPlan`), plan-filtered snapshot generator (`filterProfileForPublicDisplay`), Scenarios A-H verified in Vitest. | None | Fully verified |
| **M9** | Reseller Portal, Domains & White-Label | PENDING | - | - | - |
| **M10** | Extras & Production Hardening | PENDING | - | - | - |
| **M11** | Project Rebranding (Tapzio → Tappzio) | **COMPLETE** | Complete repository-wide rebranding to Tappzio. Migrated brand constants (`src/config/brand.ts`), database defaults, migration ledger (`__tappzio_migrations`), transactional email templates, Cloudinary taxonomies (`tappzio/*`), logger singletons (`service: 'tappzio-api'`), architectural brand guards, ADR 009, and all 44 Antigravity skills. Workspace relocated to `D:\Webzio\Tappzio`. 69/69 tests passing. | None | Fully verified |

## Credentials & External Service Status
- **PostgreSQL / Supabase**: Successfully connected to hosted Supabase PostgreSQL 17 (`db.hwrgtzkhcdklizyfargh.supabase.co:5432/postgres`), all 6 migration batches (27 tables including `media_assets`, `publication_requests`, `plan_assignment_history`, RLS policies, Better Auth columns) applied via `npm run db:migrate`. Embedded PGlite fully migrated and synchronized for offline test isolation.
- **Cloudinary DAM Integration**: Cloudinary credentials configured in `.env.local` (`CLOUDINARY_CLOUD_NAME=dhydmxcq2`). Official SDK operational (`src/lib/cloudinary/index.ts`). Remote image patterns whitelisted in `next.config.mjs`. Full media uploader component suite (`src/components/media/MediaUploaders.tsx`).
- **Email & SMTP Communications**: Nodemailer SMTP integration operational (`src/lib/email/index.ts`). Supports standard SMTP transports, Mailpit (local port 1025), and dry-run console fallback. Responsive luxury email templates (`renderOtpEmailTemplate`, `renderWelcomeEmailTemplate`) derive styling and copy from `brandConfig`. Wired directly into Better Auth OTP flow (`src/lib/auth/otp-provider.ts`).
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
- **Vitest Test Suite**: **69/69 tests passing** across 12 test files (`save-draft-and-worker`, `publishing-scenarios`, `cloudinary`, `tenant-rls`, `entitlements`, `profiles`, `templates`, `cards-leads-orders`, `permissions`, `brand-literal`, `no-direct-db-in-pages`, `email-smtp`).
- **TypeScript Typecheck**: **0 errors** (`tsc --noEmit` clean exit code 0).
- **ESLint**: **0 warnings, 0 errors** (`✔ No ESLint warnings or errors`).
- **Next.js Production Build**: All 15 static and 33 dynamic routes compiled and optimized successfully (`next build` clean exit code 0).
- **Brand Literal Rule**: Verified zero hardcoded brand strings across UI components and pages outside config.
- **Zero Dynamic Hot Path**: Verified `/p/[slug]` imports zero dynamic request headers or cookies.
- **Runtime & Save Draft Reliability**: Verified crash-proof Pino logging (`safeLog`), Redis event listener safety, `.nullish()` Zod schema normalization, and two-way reactive state in profile builder. Fully documented in `docs/CRITICAL_RUNTIME_AND_SAVE_FIX_REPORT.md` and ADR 007.
- **Webpack Infrastructure & Build Cleanliness**: Configured `infrastructureLogging.level = 'error'` and `ignoreWarnings` in `next.config.mjs` to eliminate benign `PackFileCacheStrategy` dynamic import warnings originating from `next-intl/plugin` extractor internals (ADR 008). Zero build warnings.
