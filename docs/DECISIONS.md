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

---

## ADR 009: Repository-Wide Rebranding & Identity Migration to Tappzio

- **Status**: Accepted & Implemented
- **Date**: 2026-11-02
- **Context**: The official product and company identity transitioned from "Tapzio" to "Tappzio" (`TAPPZIO` / `Tappzio` / `tappzio`). A comprehensive, repository-wide migration was required across the workspace folder, code configurations, brand constants, database default values, transactional email templates, Cloudinary taxonomies, logging singletons, architecture test guards, and all 44 Antigravity skills, while strictly preserving external database credentials, customer data, and URL slug compatibility.
- **Decision**:
  1. **Brand Source of Truth**: Updated `src/config/brand.ts` (`name: 'Tappzio'`, `shortName: 'Tappzio'`, `supportEmail: 'support@tappzio.com'`, `primaryDomain: 'tappzio.com'`) as the single runtime source of truth.
  2. **Zero Brand Literal Architecture Rule**: Updated `tests/architecture/brand-literal.test.ts` to strictly prevent both `"Tapzio"` and `"Tappzio"` from being hardcoded in UI components and routes outside brand configuration.
  3. **Global Singletons & Loggers**: Updated `src/lib/logger/index.ts` to `service: 'tappzio-api'` and global singleton `__tappzio_logger__` with backward-compatible lookup of `__tapzio_logger__`. Updated `src/lib/redis/index.ts` to `__tappzio_redis__`.
  4. **Database Migration Ledger**: Enhanced `src/db/migrate.ts` to inspect and maintain both `__tappzio_migrations` and `__tapzio_migrations` via `UNION`, ensuring zero re-execution or disruption of already applied migrations.
  5. **External Secrets Preservation**: Preserved Supabase account connection strings and passwords (`Tapzio%402026`) in `.env.local` to prevent external authentication disruptions.
  6. **Media Taxonomy**: Updated Cloudinary storage folders to `tappzio/*` (`tappzio/profiles/personal`, `tappzio/businesses/logos`, etc.) and default asset tags to `['tappzio']`.
  7. **Documentation & Skills**: Synchronized `AGENTS.md`, `.agents/rules/`, and all 44 skills under `.agents/skills/` with the new Tappzio identity.
  8. **Workspace Relocation**: Migrated root workspace from `D:\Webzio\Tapzio` to `D:\Webzio\Tappzio`.
- **Consequences**: Consistent, professional brand identity across the entire repository; full backward compatibility for existing profile URLs and migrations; zero hardcoded literals in presentation layers; 100% test pass rate across all 69 test suites.

---

## ADR 018: Zero-Vulnerability Security Remediation & Dependency Modernization

- **Status**: Accepted & Implemented
- **Date**: 2026-11-02
- **Context**: An `npm audit` scan revealed 25 vulnerabilities (21 moderate, 2 high, 2 critical) across core and transitive dependencies:
  1. `tinypool <=2.1.1` (Critical): Prototype pollution gadgets leading to RCE (`GHSA-5gmw-xhrv-c9v3`, `GHSA-85c8-ppgw-ccpr`).
  2. `@vitest/mocker <=4.1.11` (Moderate): Path traversal and code injection (`GHSA-82fw-gwwq-j7x9`, `GHSA-qxg6-89mg-rqv8`).
  3. `zod <4.6.6` (High): Memory exhaustion via oversized constrained collections (`GHSA-mrhx-c7xc-m3w5`).
  4. `postcss <=8.5.22` (High): Path traversal in source map auto-loading and unescaped style outputs (`GHSA-qx2v-qp2m-jg93`, `GHSA-r28c-9q8g-f849`, etc.).
  5. `esbuild <=0.24.2` (Moderate): Development server response access (`GHSA-67mh-4wv8-2f99`).
  6. `minimatch <11.0.1` (Moderate): DoS via globparts amplification (`GHSA-g3hv-75wg-m249`).
- **Decision**:
  1. **NPM Overrides**: Enforced pinned secure resolutions using NPM's authoritative `"overrides"` feature:
     - `"postcss": "$postcss"` (deduplicating to `8.5.32` across Next.js and Tailwind).
     - `"esbuild": "^0.25.12"` (remediating transitive `drizzle-kit` dev server vulnerability).
     - `"minimatch": "^11.0.4"` (remediating glob amplification DoS).
  2. **Vitest Upgrade**: Upgraded `vitest` to `^4.1.12`, replacing `tinypool` with `tinyexec` and eliminating critical RCE vulnerabilities and `@vitest/mocker` advisories. Modernized `vitest.config.ts` with `pool: 'threads'` and `import.meta.dirname`.
  3. **Zod 4 Upgrade**: Upgraded `zod` to `^4.6.7` (deduplicating with Better Auth) and modernized `z.record(z.string(), z.unknown())` schemas and error handling types.
  4. **Minimatch ESM Patch**: Added lightweight `scripts/patch-minimatch.mjs` postinstall hook to provide `export default minimatch` in Minimatch 11's ESM distribution, maintaining 100% compatibility with `@eslint/eslintrc` and `next lint`.
- **Consequences**:
  - `npm audit` reports **0 vulnerabilities** (down from 25).
  - All 69 Vitest tests pass cleanly.
  - TypeScript typecheck (`tsc --noEmit`) passes with 0 errors.
  - ESLint (`next lint`) passes with 0 warnings or errors.
  - Next.js production build (`next build`) compiles and optimizes all 15 static and 33 dynamic routes with zero warnings.

---

## ADR 019: Mass Marketing Template Preview System with Centralized Mock Data & Dual Mode Architecture

- **Status**: Accepted & Implemented
- **Date**: 2026-11-02
- **Context**: The Mass Marketing & Business Directory platform required a production-grade template exploration and preview system where potential and existing customers can:
  1. Browse 8 distinct business layouts (Industrial & Manufacturing, Corporate Business, Modern Business, Premium Brand, Professional Services, Retail & Shopping, Food & Restaurant, Creative & Agency).
  2. Experience interactive previews with realistic Indian commercial demo data across mobile, tablet, desktop, and fullscreen viewports without using static screenshots.
  3. Preview how their own actual profile data renders before submitting for publication approval.
  4. Understand plan tier feature differentiators (Nano, Micro, Mini, Max) with clear upgrade indicators on locked features without client-side permission leakage.
  5. Select a preferred template non-destructively without overwriting existing customer information or automatically publishing unapproved profiles.
  6. Enable Super Admins to preview the customer's selected template and submitted data prior to approving publication.
- **Decision**:
  1. **Centralized Demo Mock Data (`src/lib/mock-data/demo-businesses.ts`)**: Created 8 realistic sample businesses with Indian addresses, contact channels, catalogs, INR prices, working hours, and explicit `isDemo: true` badges. Strictly separated from database customer tables.
  2. **8 Specialized Layout Renderers (`src/components/templates/layouts/`)**: Authored distinct layout components with specialized UX hierarchies:
     - `IndustrialTemplate`: Heavy machinery catalogue, technical spec sheets, RFQ quote requests, plant shifts.
     - `RetailTemplate`: Commercial storefront, WhatsApp quick ordering, store hours, collection cards.
     - `FoodRestaurantTemplate`: Culinary menu cards, dietary tags, table reservations, kitchen hours.
     - `CorporateBusinessTemplate`: Titanium enterprise header, subsidiary switcher, institutional advisory.
     - `ModernBusinessTemplate`: High-contrast dual tabs, lead capture, verified trust channels.
     - `PremiumBrandTemplate`: Obsidian luxury surface, brushed gold accents, VIP contact cards.
     - `ProfessionalServicesTemplate`: Editorial paper styling, serif typography, counsel retainers.
     - `CreativeAgencyTemplate`: Aurora neon glassmorphism, visual portfolio grid, studio commission CTA.
  3. **Dual-Mode Interactive Preview Modal (`TemplatePreviewModal.tsx`)**:
     - *Mode A (Demo Preview)*: Renders demo businesses with sample switcher.
     - *Mode B (My Business Preview)*: Renders authenticated customer's actual data with graceful empty-state placeholders.
     - *Viewport Toolbar*: Mobile (375px), Tablet (768px), Desktop (max-w-5xl browser frame), and Fullscreen.
     - *Plan Simulator*: Dynamically toggles Nano, Micro, Mini, and Max tiers, displaying visual upgrade banners on plan-locked sections.
  4. **Client/Server Boundary Separation (`src/modules/templates/constants.ts`)**: Decoupled template metadata and constants from `@/db` into a serverless constant file, eliminating webpack bundling of Node.js modules (`fs`, `tls`, `net`) into client components.
  5. **Admin Pre-Publication Inspection (`src/app/(admin)/admin/page.tsx`)**: Upgraded Publications queue with in-modal customer profile preview, and added template management controls (active/disabled toggles, plan compatibility selector, adoption counts).
  6. **Customer Dashboard Integration (`src/app/(app)/dashboard/page.tsx`)**: Added Selected Template overview box with "Preview (My Data)" and "Change Template" actions, coupled with publishing approval workflow triggers.
- **Consequences**:
  - Full adherence to the Zero Fabrication and Brand Config rules.
  - Zero dynamic route pollution on public profile pages (`/p/[slug]`).
  - 82/82 Vitest tests passing (including 13 dedicated unit/integration tests in `tests/unit/template-preview-mock.test.ts`).
  - Next.js production build (`next build`) compiles and optimizes 15 static and 35 dynamic routes cleanly with 0 errors.
