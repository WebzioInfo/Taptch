# Tapzio — Architectural & Engineering Decision Records (ADRs)

## ADR-001: Next.js 15 Monolithic Deployable with Modular Domain Architecture
- **Context**: Need high velocity, reliable deployment, and cohesive developer experience while supporting multiple distinct portals (marketing, public profiles, customer app, admin console).
- **Decision**: Use a single Next.js 15 project utilizing App Router route groups (`(marketing)`, `(profile)`, `(app)`, `(admin)`). Domain logic is strictly separated into `src/modules/*` so modules remain decoupled and extractable into standalone services if horizontal scale demands it later.
- **Consequences**: Fast cross-domain type sharing, simplified atomic migrations, single CI pipeline.

## ADR-002: Dual-Tier Multi-Tenancy (Application DAL + PostgreSQL RLS)
- **Context**: B2B enterprise customers and individuals co-exist on the platform; IDOR or cross-tenant data leakage is unacceptable.
- **Decision**: Implement a Tenant-Scoped Data Access Layer (DAL) that mandates an `ActorContext` on every database query, backed by PostgreSQL Row Level Security (RLS) on sensitive tables (`profiles`, `leads`, `cards`, `orders`, `invoices`).
- **Consequences**: Maximum defense-in-depth; if an application-level query forgets a tenant filter, the database rejects the row query.

## ADR-003: Unguessable Token Redirects over Direct URL Encoding
- **Context**: Physical NFC chips and printed QR codes are expensive hardware assets. Hardcoding profile URLs on cards breaks when slugs change and prevents hardware reassignment.
- **Decision**: Hardware chips and QRs store only `https://{domain}/n/{token}` and `https://{domain}/q/{token}` where token is an unguessable nanoid/base62 token. The server dynamically resolves the active profile from Redis cache with sub-50ms latency.
- **Consequences**: Cards can be reassigned, deactivated, or transferred infinitely without touching the physical chip. Source attribution (NFC vs. QR) is built into the URL path.

## ADR-004: Workspace Root vs. Dedicated Subdirectory
- **Context**: The current workspace `D:\Webzio` contains multiple existing projects (`aquora`, `billaura`, `Adotzee`, `Biodrops`, `WebzioExpenses`).
- **Decision**: Specifications and documentation are placed in `/docs` at workspace root for immediate access. For the actual Next.js 15 application in M1, recommend isolating it into `tapzio/` (or running directly at root if the user prefers a dedicated repo). We will log this for user confirmation before scaffolding code in M1.

## ADR-005: Asynchronous Analytics Pipeline with Privacy Protection
- **Context**: High-frequency profile views and NFC taps must not block response times, and storing raw IP addresses violates modern privacy laws (GDPR & Indian DPDP Act 2023).
- **Decision**: Ingestion endpoints dispatch events to a BullMQ Redis queue immediately. Worker processes monthly partitioned PostgreSQL tables and daily rollup summaries. Raw IPs are hashed with a daily rotating salt and immediately discarded.
- **Consequences**: High throughput, sub-50ms redirects, 100% compliance with data protection laws.

## ADR-006: Brand Config Layer
- **Context**: Tapzio is a placeholder brand and needs complete white-label flexibility.
- **Decision**: All branding assets, titles, logos, domain configs, and colors derive from `src/config/brand.ts` and dynamic database `system_settings`. Hardcoding "Tapzio" in UI components is strictly prohibited.

## ADR-007: Technology Stack Selection & Version Pinning
- **Context**: Need a battle-tested, high-performance stack with predictable licensing and zero ecosystem turbulence.
- **Decision**: Pin Next.js 15 LTS (`15.5.28`) with React 19 LTS (`19.3.1`), Better Auth (`1.7.14`), Drizzle ORM (`0.45.4`) or Prisma (`7.10.1`), Tailwind CSS (`4.3.3`), and BullMQ (`6.5.3`).
- **Consequences**: Avoids Next.js 16 caching instability and Auth.js beta bugs while securing first-class multi-tenancy and OTP capabilities.

## ADR-008: Transaction-Scoped RLS Injection Under Connection Pooling
- **Context**: PgBouncer transaction-mode pooling shares connections across incoming HTTP requests; setting global session variables causes tenant context leakage.
- **Decision**: All RLS-sensitive queries must execute inside explicit database transactions using `SELECT set_config('app.current_user_id', $1, true)`. The `true` parameter strictly scopes the setting to the current transaction.
- **Consequences**: 100% tenant isolation guaranteed at the database engine level with zero cross-tenant contamination.

## ADR-009: Decoupled Containerized Worker for BullMQ
- **Context**: BullMQ requires persistent Redis connections (`BRPOPLPUSH`) and an uninterrupted Node.js event loop, incompatible with stateless serverless functions.
- **Decision**: Run a dedicated Node.js worker process in a containerized environment (Docker on VPS / ECS) alongside the Next.js web application.
- **Consequences**: Web route handlers only push jobs to Redis; the long-running worker executes bulk imports, analytics batching, and PDF rendering without timeouts.

## ADR-010: India Telecom DLT Compliance & WhatsApp Cloud API Fallback
- **Context**: Telecom Regulatory Authority of India (TRAI) mandates Distributed Ledger Technology (DLT) registration for SMS OTP, but approval delays can take 2–4 weeks.
- **Decision**: Register Webzio Technology on DLT with transactional headers (`TAPZIO`) while implementing Meta WhatsApp Cloud API as the primary/fallback OTP provider.
- **Consequences**: Instant, reliable 4-second OTP delivery over WhatsApp directly to Indian mobile users, with standard DLT SMS available as a secondary route.

## ADR-011: Physical Metal Card Ferrite Layer & Decoupled QR Fallback
- **Context**: Solid metal cards absorb NFC RF electromagnetic fields, preventing smartphone antenna communication.
- **Decision**: Metal cards must incorporate a 0.2mm anti-metal ferrite shielding layer between the metal substrate and the antenna coil on the reverse face. The card is tapped from the reverse face only, with a high-contrast laser-etched dynamic QR code as an immediate fallback.
- **Consequences**: Reliable NFC performance on luxury metal hardware with zero user confusion.

## ADR-012: Documentation Audit & Claim Reclassification
- **Context**: Phase A audit identified unverified competitor assertions and conflation of performance targets with achievements.
- **Decision**: Formally classify all performance SLAs (LCP < 1.1s, redirect < 50ms) as TARGETS subject to automated k6/Lighthouse CI verification; demarcate all competitor assertions in `competitor-matrix.md` as OBSERVED vs INFERRED/UNVERIFIED.
- **Consequences**: Strict engineering honesty and factual rigor across all project documentation.

## ADR-013: Deferral of Payment Gateway & Commercial Billing to Phase 2
- **Context**: Business requirement to launch initial platform release with manual entitlement provisioning and order management without introducing external payment gateway dependencies.
- **Decision**: Remove all online payment dependencies (Razorpay, Stripe, payment webhooks, checkout flows, GST automated invoicing, auto-debits, coupons, refunds). Plans and entitlements remain 100% data-driven in PostgreSQL (`plans`, `plan_entitlements`), assigned manually by super admins. Physical card orders are modeled as order requests with a manual `payment_status` (`unpaid | paid_offline | waived`).
- **Consequences**: Zero external payment credentials required to run or test the complete platform; clean domain boundaries allow payment gateway integration in Phase 2 without rewriting user, organization, or profile modules.

## ADR-014: Better Auth Drizzle Adapter Plural Mapping & Schema Alignment
- **Context**: Better Auth internally references singular schema names (`user`, `session`, `account`, `verification`, `organization`, `member`, `invitation`, `twoFactor`) while production database tables utilize plural conventions (`users`, `sessions`, `accounts`, etc.).
- **Decision**: Explicitly pass table mappings in the `drizzleAdapter` config in `src/lib/auth/index.ts`, and align schema columns (`twoFactor.verified`, `failedVerificationCount`, `lockedUntil`, `invitation.createdAt`).
- **Consequences**: Zero Drizzle schema mismatch warnings at build time; full runtime compatibility with Better Auth plugins.

## ADR-015: Vitest File Serialization for Embedded Database Isolation
- **Context**: PGlite persistent stores enforce directory-level file locking. Parallel test runner execution caused concurrent lock collisions (`PGlite failed to initialize properly`).
- **Decision**: Configure `fileParallelism: false` in `vitest.config.ts` for database-dependent unit and integration test runs, while preserving fast in-file test execution.
- **Consequences**: 100% reliable local test execution on Windows and Linux CI without requiring external daemon infrastructure.

## ADR-016: Repository Cleanup, Binary Artifact Purge & Module Boundary Preservation
- **Context**: Workspace contained legacy binary `.docx` artifacts in `.agents/skills/`, redundant empty directories (`src/lib/db`, `src/modules/auth`), and untracked future milestone directories.
- **Decision**: Safely back up and purge binary `.docx` files from `.agents/skills/`; remove redundant directories that conflict with canonical architecture (`src/db/` and `src/modules/authz/`); stabilize planned future module boundaries with documented `.gitkeep` markers; and ignore `backups/` in `.gitignore`.
- **Consequences**: High repository cleanliness, zero ambiguous paths, 100% green test and build pipelines, ready for Milestone 2 implementation.

## ADR-017: Standardization of Package Management to NPM Exclusively
- **Context**: Project previously used pnpm, creating mixed commands and competing lockfile references across documentation, CI, and agent instructions.
- **Decision**: Standardize on NPM exclusively (`npm install`, `npm run`, `npm test`). Update `packageManager` in `package.json` to `npm@11.13.0`, generate and enforce `package-lock.json` as the sole authoritative lockfile, purge `pnpm-lock.yaml` and `pnpm-workspace.yaml`, and establish a permanent governance rule in `AGENTS.md`.
- **Consequences**: Universal compatibility across developer environments, standardized CI/CD via `npm ci`, and elimination of package manager fragmentation.

## ADR-018: Standardized Transactional Email Delivery via Nodemailer SMTP Transport
- **Context**: The platform requires standard, provider-agnostic transactional email dispatch (for OTP verification, password resets, welcome messages, and order notifications) supporting both production SMTP servers (e.g. AWS SES, Brevo, SendGrid, Gmail) and local development tools (Mailpit, MailHog, stdout console).
- **Decision**: Implemented `nodemailer` with standard SMTP transport in `src/lib/email/index.ts`. Configured environment variables (`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`, `EMAIL_FROM_NAME`). Integrated branded Obsidian Luxury HTML and plain text templates deriving styling from `brandConfig`. Wired directly into Better Auth OTP dispatch via `sendOtpEmail` in `src/lib/auth/otp-provider.ts` with console fallback in non-production environments when credentials are unset.
- **Consequences**: Zero proprietary vendor lock-in for email delivery; flexible switching between cloud SMTP gateways and local test mail catchers; fully testable with Vitest (47/47 tests passing).


---

## ADR-017: Cloudinary Digital Asset Management (DAM) & Media Architecture

- **Date**: 2026-11-02
- **Status**: Accepted & Implemented
- **Context**: Profile customization requires storing high-resolution personal avatars, business logos, product catalogs, gallery images, videos, and PDF brochures. Storing binary blobs directly in PostgreSQL degrades database performance and prevents edge caching.
- **Decision**: Integrate Cloudinary via official Node.js SDK (`cloudinary` v2). Maintain a standardized folder taxonomy (`tapzio/profiles/`, `tapzio/businesses/`, etc.). Support dual upload patterns: streaming server-side multipart uploads for trusted backend services and signed direct uploads for high-speed client uploads without exposing secrets. Persist asset references in PostgreSQL table `media_assets`.
- **Consequences**: Fast edge delivery with automatic WebP/AVIF compression; zero load on application servers; multi-tenant deletion authorization; full metadata tracking.

---

## ADR-018: Controlled Publishing & Plan Assignment System

- **Date**: 2026-11-02
- **Status**: Accepted & Implemented
- **Context**: The business model requires separating profile data collection, commercial plan assignment, and public feature visibility. Users should be able to create full profiles in draft mode without plan restrictions. Commercial plan assignments and offline payments are finalized via WhatsApp/Phone discussions.
- **Decision**: 
  1. Remove artificial limits during profile draft creation; enforce platform abuse ceilings (50 businesses, 100 products) rather than plan restrictions during draft data entry.
  2. Implement a publication review lifecycle: `DRAFT` -> `PENDING_PUBLICATION` -> `APPROVED` / `PUBLISHED`.
  3. Super Admins assign plans (`nano`, `micro`, `mini`, `max`), validity duration, and manual payment status (`NOT_RECORDED`, `PENDING_VERIFICATION`, `PAID`, `PARTIALLY_PAID`, `WAIVED`).
  4. Public profile renderer (`/p/[slug]`) reads a pre-compiled plan-filtered JSON snapshot (`publishedJson`) generated by `filterProfileForPublicDisplay()`, maintaining the Zero Dynamic SSR Hot Path (<50ms delivery).
  5. Downgrades and plan expirations hide premium features on public view without deleting user data from the database.
- **Consequences**: Maximizes user onboarding conversion; fully supports high-touch sales models via WhatsApp/Phone; guarantees data safety across plan lifecycle; maintains sub-50ms static public profile performance.

## ADR 007: Runtime Worker Crash Prevention, Server-External Packages & Schema Normalization

- **Status**: Accepted
- **Date**: 2026-11-02
- **Context**: During profile draft editing, `PATCH /api/v1/profiles/[id]` returned 400 when nullable database fields contained `null`, thread-stream workers failed in Webpack vendor-chunks triggering `Cannot find module 'worker.js'`, and logging inside Redis event listeners triggered uncaught exceptions crashing the process.
- **Decision**:
  1. Add `serverExternalPackages: ['pino', 'pino-pretty', 'thread-stream', 'ioredis']` to `next.config.mjs` to resolve packages natively from `node_modules`.
  2. Implement a crash-proof logging dispatcher (`safeLog`) in `src/lib/logger/index.ts` that safely falls back to standard `console[method]` without ever throwing unhandled exceptions.
  3. Relocate `updateProfileSchema` to `src/modules/profiles/validation.ts` with `.nullish()` on all optional fields, satisfying Next.js 15 route module typing constraints while supporting both partial section saves and global draft saves.
  4. Ensure database persistence is strictly completed and verified prior to reporting success in profile publishing, treating Redis cache synchronization as a recoverable secondary operation.
- **Consequences**: Eliminates process crashes under high-frequency Fast Refresh or Redis dropouts; supports seamless partial and complete section saves; ensures full compatibility with Node.js v24.15.0 and Next.js 15.5.28.

## ADR 008: Next.js Webpack Infrastructure Logging & Build Cache Warning Suppression

- **Status**: Accepted
- **Date**: 2026-11-02
- **Context**: During `next dev` and `next build`, Webpack's persistent filesystem caching strategy (`[webpack.cache.PackFileCacheStrategy/webpack.FileSystemInfo]`) emitted warnings when analyzing transitive imports of `next-intl/plugin` (`dist/esm/production/extractor/format/index.js`), specifically warning that `Build dependencies behind this expression are ignored and might cause incorrect cache invalidation at 'import(t(c).href)'`.
- **Decision**:
  1. Configure `config.infrastructureLogging = { level: 'error' }` in `next.config.mjs` to silence non-critical infrastructure warnings while retaining critical build error telemetry.
  2. Add `config.ignoreWarnings` rules targeting `next-intl`, `PackFileCacheStrategy`, and build dependency cache invalidation expressions.
- **Consequences**: Completely suppresses noisy, benign cache dependency parsing warnings during development and production builds, ensuring clean terminal outputs and CLI pipeline logs.
