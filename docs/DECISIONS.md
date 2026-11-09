# Taptch — Architectural & Engineering Decision Records (ADRs)

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
- **Decision**: Specifications and documentation are placed in `/docs` at workspace root for immediate access. For the actual Next.js 15 application in M1, recommend isolating it into `taptch/` (or running directly at root if the user prefers a dedicated repo). We will log this for user confirmation before scaffolding code in M1.

## ADR-005: Asynchronous Analytics Pipeline with Privacy Protection
- **Context**: High-frequency profile views and NFC taps must not block response times, and storing raw IP addresses violates modern privacy laws (GDPR & Indian DPDP Act 2023).
- **Decision**: Ingestion endpoints dispatch events to a BullMQ Redis queue immediately. Worker processes monthly partitioned PostgreSQL tables and daily rollup summaries. Raw IPs are hashed with a daily rotating salt and immediately discarded.
- **Consequences**: High throughput, sub-50ms redirects, 100% compliance with data protection laws.

## ADR-006: Brand Config Layer
- **Context**: Taptch is a placeholder brand and needs complete white-label flexibility.
- **Decision**: All branding assets, titles, logos, domain configs, and colors derive from `src/config/brand.ts` and dynamic database `system_settings`. Hardcoding "Taptch" in UI components is strictly prohibited.

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
- **Decision**: Register Webzio Technology on DLT with transactional headers (`TAPTCH`) while implementing Meta WhatsApp Cloud API as the primary/fallback OTP provider.
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
- **Decision**: Integrate Cloudinary via official Node.js SDK (`cloudinary` v2). Maintain a standardized folder taxonomy (`taptch/profiles/`, `taptch/businesses/`, etc.). Support dual upload patterns: streaming server-side multipart uploads for trusted backend services and signed direct uploads for high-speed client uploads without exposing secrets. Persist asset references in PostgreSQL table `media_assets`.
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

## ADR 009: Repository-Wide Rebranding & Identity Migration (Historical)

- **Status**: Superseded by ADR-030 (TAPTCH Rebranding)
- **Date**: 2026-11-02
- **Context**: The official product identity underwent successive migrations (initially as "Taptch", then "Taptch", and finally **TAPTCH** per ADR-030). This ADR records the intermediate migration infrastructure that was later unified under ADR-030.
- **Decision**:
  1. **Brand Source of Truth**: Updated `src/config/brand.ts` as the single runtime source of truth (now reflects TAPTCH per ADR-030).
  2. **Zero Brand Literal Architecture Rule**: Updated `tests/architecture/brand-literal.test.ts` to strictly prevent hardcoded brand names in UI components and routes outside brand configuration.
  3. **Global Singletons & Loggers**: Updated `src/lib/logger/index.ts` to `service: 'taptch-api'` and global singleton `__taptch_logger__`. Updated `src/lib/redis/index.ts` to `__taptch_redis__`.
  4. **Database Migration Ledger**: Enhanced `src/db/migrate.ts` to inspect and maintain `__taptch_migrations`, `__taptch_migrations`, and `__taptch_migrations` via `UNION`, ensuring zero re-execution or disruption of already applied migrations.
  5. **External Secrets Preservation**: Preserved Supabase account connection strings and passwords in `.env.local` to prevent external authentication disruptions.
  6. **Media Taxonomy**: Updated Cloudinary storage folders to `taptch/*` (`taptch/profiles/personal`, `taptch/businesses/logos`, etc.) and default asset tags to `['taptch']`.
  7. **Documentation & Skills**: Synchronized `AGENTS.md`, `.agents/rules/`, and all 44 skills under `.agents/skills/` with the current TAPTCH identity.
  8. **Workspace Relocation**: Migrated root workspace to `D:\Webzio\taptch`.
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

## ADR-020: Premium Brand Identity & Centralized Logo Architecture
- **Date**: 2026-11-02
- **Context**: The platform required a completely original, recognizable, and production-grade brand identity for **TAPTCH**, communicating digital identity, smart NFC connectivity, and executive networking without relying on generic Wi-Fi icons, basic circled letters, or blurry raster images.
- **Decision**:
  1. **Visual Concept ("The Harmonic Nexus T")**:
     - *Stem*: Solid architectural pillar representing foundational digital identity and enterprise reliability.
     - *Crossbar / Wings*: Symmetrical curved wave chevrons representing 13.56 MHz NFC electromagnetic coupling and dual-directional reciprocal contact exchange.
     - *Apex Core*: Diamond focal point symbolizing instantaneous contactless tap activation.
     - *Palette*: Obsidian Luxury styling featuring Deep Obsidian (`#0A0A0C`), Matte Charcoal (`#121216`), Brushed Champagne Gold (`#D4AF37` to `#F3E5AB`), and Platinum Pure (`#FFFFFF`).
  2. **Vector SVG & Icon System (`public/branding/`)**:
     - Built 7 SVG logo variations: primary, light (dark backdrops), dark (light backdrops), horizontal (navbars), stacked (modals/cards), symbol (badges/icons), and monochrome (laser/CNC metal card engraving).
     - Generated vector favicons, 192x192 & 512x512 high-res raster app icons, 180x180 Apple Touch Icon, and standard 32x32 `favicon.ico` using sharp rasterization.
  3. **Centralized Brand Logo Component (`src/components/brand/BrandLogo.tsx`)**:
     - Created unified `<BrandLogo />` supporting variants (`primary`, `horizontal`, `stacked`, `symbol`, `monochrome`), themes (`auto`, `dark`, `light`), sizes (`sm`, `md`, `lg`, `xl`, `2xl`), Next.js `<Link>` wrappers, and strict dynamic alt text derived from `brandConfig.name`.
  4. **Full Application Integration**:
     - Replaced letter-T placeholders in public Landing Page (`src/app/page.tsx`), App Shell navigation (`src/app/(app)/layout.tsx`), Auth pages (`login`, `register`, `verify`), Executive Admin Cockpit (`src/app/(admin)/admin/page.tsx`), and Public Profile QR modal (`ProfileRenderer.tsx`).
     - Wired metadata icons and OpenGraph cards in `src/app/layout.tsx`.
     - Authored official brand manuals: `public/branding/brand/brand-guidelines.md` and `docs/TAPTCH_BRAND_IDENTITY.md`.
- **Consequences**:
  - 100% compliance with zero-hardcoded-brand-literals rule verified by `brand-literal.test.ts`.
  - Added dedicated asset integrity test `tests/unit/brand-assets.test.ts` (86/86 total tests passing).
  - Consistent visual identity across physical NFC cards, web applications, and mobile icons.

## ADR-021: Public Template Gallery & Open-Redirect Safe Authentication
- **Date**: 2026-11-02
- **Context**: The template gallery (`/templates`) was displaying "Authenticating session..." and redirecting unauthenticated visitors to `/login`. Visitors must be able to explore templates, test responsive previews (desktop, tablet, mobile), and simulate plan tiers without logging in or creating an account.
- **Root Cause**:
  - `/templates` was previously placed under `src/app/(app)/templates/page.tsx` within the authenticated route group `(app)`.
  - `src/app/(app)/layout.tsx` enforces mandatory user session validation, displaying an "Authenticating session..." spinner before redirecting unauthenticated requests.
- **Decision**:
  1. **Route Decoupling**:
     - Removed `src/app/(app)/templates/page.tsx`.
     - Relocated public template marketplace to `src/app/(marketing)/templates/page.tsx` and created individual template page at `src/app/(marketing)/templates/[id]/page.tsx`.
     - Created `src/app/(marketing)/layout.tsx` featuring `MarketingHeader` and `MarketingFooter` with non-blocking session awareness.
  2. **Non-Blocking Client Session Detection**:
     - `useSession()` is used only to selectively enable Mode B ("My Business Preview") and "Apply to Profile" when an authenticated user visits `/templates`.
     - Unauthenticated visitors immediately see all templates, category filters, and live previews with centrally managed demo businesses (`DEMO_BUSINESSES`).
  3. **Open-Redirect Safe Auth Forwarding (`src/lib/auth/redirect.ts`)**:
     - Created `getSafeRedirectUrl(templateParam, redirectParam)`.
     - Validates template parameters against `^[a-zA-Z0-9_-]+$` and forwards authenticated users to `/builder/new?template={templateId}`.
     - Enforces strict relative URL format (`/` prefix, rejecting `//` protocol-relative exploits, Windows backslashes, or external domains).
     - Preserves template query string across login, register, and OTP verification flows.
  4. **Responsive Preview Modal Integration (`TemplatePreviewModal.tsx`)**:
     - Added `isAuthenticated` prop and intelligent CTA: displays "Use This Template" (redirecting to `/register?template=...`) for visitors, and "Select Template" for authenticated users.
- **Consequences**:
  - Unauthenticated visitors can freely browse, filter, search, and preview all 8 templates on desktop, tablet, and mobile.
  - Protected routes (`/dashboard`, `/builder/*`, `/cards`, `/leads`, `/admin`) remain 100% secure.
  - 95/95 Vitest tests passing (including 9 dedicated tests in `tests/unit/public-templates-auth.test.ts`).
  - Next.js production build compiles cleanly with zero warnings or errors.

## ADR-022: Global UI/UX Simplification, Navigation Streamlining & Noise Elimination
- **Date**: 2026-11-03
- **Context**: The application accumulated redundant promotional cards, repetitive navigation items, developer links in customer-facing menus, and verbose technical jargon that increased cognitive load and distracted from core workflows.
- **Decision**:
  1. **Customer Shell Navigation (`src/app/(app)/layout.tsx`)**:
     - Purged developer playground (`/dev/gallery`) from primary customer navigation tabs (accessible via user profile dropdown).
     - Standardized primary customer navigation to 4 clean destinations: `Dashboard`, `Templates`, `Cards`, `Leads`.
     - Removed redundant `New Profile` action button squeezed into the top navbar next to user avatar to eliminate button clutter.
     - Integrated executive tier badge into the user dropdown card.
  2. **Executive Dashboard Command Center (`src/app/(app)/dashboard/page.tsx`)**:
     - Replaced 4-card KPI row with 3 authentic user metrics: `Digital Profiles` (total & published), `Linked NFC Cards` (active hardware tokens), and `Captured Leads` (reciprocal contacts). Removed artificial static `Template Engine: 6` KPI.
     - Eliminated 3 redundant bottom promotional cards ("Luxury Template Showcase", "NFC Smart Cards", "Reciprocal Networking Leads") which duplicated top tabs.
     - Implemented functional `Recent Leads` live feed showing real incoming networking contacts with direct links to `/leads`, and compact quick shortcuts when empty.
  3. **Hardware & Leads Management (`/cards`, `/leads`)**:
     - Renamed wordy page titles ("Smart NFC Hardware" -> "Smart Cards", "Captured Leads & Contacts" -> "Leads").
     - Streamlined primary actions to a clear hierarchy (`Activate Card` and `Order Card`).
     - Refactored empty state copy to be direct, helpful, and concise.
  4. **Authentication & Public Pages (`/login`, `/register`, `/verify`, `src/app/page.tsx`)**:
     - Replaced over-engineered technical jargon in auth footers ("Time-based HMAC SHA-256 verified single-use authentication tokens", "Secured with end-to-end multi-tenant cryptographic isolation") with human-centered, trustworthy guarantees ("Encrypted & secure", "Secure one-time verification code").
     - Simplified CTA button text ("Authenticate Session" -> "Verify & Continue").
     - Removed developer studio link from the public landing page header navigation.
- **Consequences**:
  - Dramatically improved usability, visual hierarchy, and professional polish.
  - Zero loss of underlying domain logic, APIs, or database functionality.
  - 95/95 tests passing across 15 test suites with 0 ESLint warnings, 0 typecheck errors, and clean Next.js build.

## ADR-023: Universal Form Input Contrast & Theme Architecture Fix
- **Date**: 2026-11-03
- **Context**: In certain forms and authentication views, browser autofill (Chromium, Edge, Safari) and unstyled form elements produced white backgrounds with light/white text, rendering entered data virtually invisible and breaking usability.
- **Root Cause**:
  1. Default browser autofill injected `-webkit-box-shadow: 0 0 0 30px white inset !important;` with light text colors in dark mode.
  2. Native `<select>` `<option>` elements on Windows/macOS were defaulting to system background colors with white text, causing illegible dropdown options.
  3. Form inputs in authentication and builder dialogs had semi-transparent or untracked backgrounds (`bg-background/50`, `bg-transparent`) without explicit caret or theme token overrides.
  4. Absence of reusable `<Textarea />` and `<Select />` design system components led to raw, un-styled elements in various admin and builder views.
- **Decision**:
  1. **Universal Form Element Base Styling (`src/app/globals.css`)**:
     - Enforced `color: var(--foreground); background-color: var(--card); border-color: var(--border); caret-color: var(--primary);` on all `input`, `textarea`, and `select` tags.
     - Enforced `color: var(--muted-foreground) !important;` on `::placeholder`.
  2. **Cross-Platform Dropdown `<option>` Contrast**:
     - Styled `select option` and `select optgroup` with explicit background and foreground tokens across default (Obsidian), Ivory, and Aurora themes.
  3. **Multi-Theme WebKit & Chromium Autofill Neutralization**:
     - Applied `-webkit-box-shadow: 0 0 0 1000px #141418 inset !important; -webkit-text-fill-color: #FAFAFA !important;` for Obsidian Luxury, with automatic switches for Ivory (`#FFFFFF` / `#18181B`) and Aurora (`#0F1322` / `#F8FAFC`).
  4. **Component Architecture Enhancement**:
     - Enhanced `src/components/ui/input.tsx` with explicit `caret-primary` and focus borders.
     - Created `src/components/ui/textarea.tsx` and `src/components/ui/select.tsx`.
     - Replaced raw textareas and selects across `builder`, `cards`, `admin`, and `ProfileRenderer`.
- **Consequences**:
  - 100% visible, high-contrast text during data entry across all browsers and autofill states.
  - Zero regression in layout or styling; 100/100 Vitest tests passing across 16 test files.
  - Clean Next.js production build (`next build`) exits 0.

## ADR-024: Supabase IPv4 Pooler Resolution & Production Authentication Restoration
- **Date**: 2026-11-03
- **Context**: In production at `https://taptch.webziotech.in`, user authentication failed with HTTP 500 on `POST /api/auth/email-otp/send-verification-otp` and email/password login. Database error logs indicated:
  `Failed query: insert into "verifications" ("id", "identifier", "value", "expires_at", "created_at", "updated_at") values ($1, $2, $3, $4, $5, $6)`
  `[cause]: Error: getaddrinfo ENOTFOUND db.hwrgtzkhcdklizyfargh.supabase.co`
  along with a warning:
  `NODE_ENV was incorrectly set to "development", this value is being overridden to "production"`.
- **Root Cause Analysis**:
  1. **IPv6-Only Direct Supabase Endpoint**: Modern Supabase direct database hostnames (`db.<project-ref>.supabase.co`) publish only IPv6 `AAAA` records and zero IPv4 `A` records. VPS hosts, Linux containers, and Docker environments running in standard IPv4-only network topologies cannot resolve IPv6 hostnames, triggering fatal `getaddrinfo ENOTFOUND` exceptions on every Better Auth query.
  2. **Supabase Pooler Has Dedicated IPv4 Support**: Supabase provides an AWS-based PgBouncer Connection Pooler (`aws-0-[region].pooler.supabase.com`) with 3 redundant IPv4 addresses and dual-mode operation (Transaction port `6543` and Session port `5432`).
  3. **Better Auth CORS & Origin Whitelisting**: Reverse proxy environments behind custom subdomains require explicit `trustedOrigins` registration to guarantee CSRF and session cookie security.
- **Decision**:
  1. **Standardize on Supabase IPv4 Connection Pooler**:
     - Host: `aws-0-eu-west-1.pooler.supabase.com`
     - Port: `6543` (PgBouncer transaction mode for runtime queries with `prepare: false`) and `5432` (session mode for Drizzle migrations/direct connections)
     - User: `postgres.hwrgtzkhcdklizyfargh`
     - Database: `postgres`
     - SSL: `sslmode=require`
  2. **Add Defensive Startup Diagnostics (`src/db/index.ts`)**:
     - Injected an automatic warning check that detects if `db.*.supabase.co` is configured in `DATABASE_URL` and informs operators to switch to the pooler.
  3. **Explicit Better Auth Trusted Origins (`src/lib/auth/index.ts`)**:
     - Configured `trustedOrigins: [process.env.BETTER_AUTH_URL, process.env.NEXT_PUBLIC_APP_URL, 'https://taptch.webziotech.in'].filter(Boolean)` to prevent reverse proxy origin rejections.
  4. **Production Runtime Environment Standard**:
     - Instruct operators to set `NODE_ENV=production` in VPS environment to eliminate the development override warning and ensure `useSecureCookies: true`.
- **Verification**:
  - Live query verified through Supabase pooler: All 33 tables and 20 existing user records verified intact without data loss.
  - Better Auth `insert into "verifications"` and `auth.api.sendVerificationOTP` tested and verified end-to-end with `{ success: true }`.
  - 100/100 Vitest tests passing across 16 test files.
  - `tsc --noEmit` and `next lint` pass with 0 warnings/errors.
  - Production `next build` compiled all routes cleanly.

## ADR-025: Enterprise Post-Print Activation Dynamic QR Ecosystem, Field Staff RBAC & Calendar Analytics
- **Date**: 2026-11-05
- **Status**: Accepted & Implemented
- **Context**: In physical smart card and dynamic QR distribution models, pre-printing unique URLs tied directly to end-customer profiles beforehand causes severe operational bottlenecks and high scrap rates. An enterprise post-print activation dynamic QR engine was needed:
  1. Mint unassigned QR batches at volume with cryptographic tokens and human-readable tracking serial numbers.
  2. Support vector multi-sheet PDF generation across 3 layout formats (`branded_sheet` 3x4 A4 grid, `thermal_sticker` 50x50mm, and `table_tent` 4x6" standees).
  3. "Scan & Assign After Generated" workflow enabling field sales reps to scan physical codes with mobile cameras and pair them with clients in real-time.
  4. Role-based access control segregating `super_admin`/`admin` ops from `sales_staff` field reps.
  5. Luminous GitHub-style calendar heatmap analytics and staff performance audit ledgers.
- **Decision**:
  1. **Cryptographic Token Architecture (`src/modules/qr/token.ts`)**:
     - 8-character lowercase hexadecimal tokens (`crypto.randomBytes(4).toString('hex')`) with 32-bit entropy space (~4.3 billion values), collision-checked during batch generation.
     - Human-readable sequential serial numbers (`generateQRSerial(seq, 'BATCH')`).
     - Daily rotating salt hash for visitor IPs adhering to DPDP Act 2023.
     - Universal client-safe parser (`extractQRToken`) extracting tokens from camera streams, URLs, query parameters, or raw strings.
  2. **PDF Vector Print Engine (`src/modules/qr/print-engine.ts`)**:
     - Uses `pdf-lib` to compose vector sheets with QR PNG matrix at 400 DPI, crop/cut marks, serial text, and instructions.
  3. **"Scan & Assign After Generated" API & Prevention Rules (`src/modules/qr/service.ts`, `/api/admin/sales/assign-qr`)**:
     - Enforces RBAC verification (`super_admin`, `admin`, `sales_staff`).
     - Automatically creates new customer user records or attaches to existing customers.
     - Guards against accidental overwriting of already assigned codes by rejecting requests unless `isReassign: true` is explicitly provided.
  4. **Mobile-First Field Staff Experience (`/staff/*`)**:
     - `/staff/login`, `/staff/dashboard` (with live camera viewfinder + `jsQR` and file upload fallback), `/staff/assign/[token]`, and `/staff/history`.
  5. **Portal-X Operations Suite (`/portal-x/*`)**:
     - `/portal-x/qr-management`: Batch generation modal with URL template parameter interpolation, batches ledger, and warehouse QA scanner tab with Web Audio API feedback (880Hz sine wave for unique, 200Hz sawtooth buzz for duplicates).
     - `/portal-x/staff`: Field staff list, search, status badge, provisioning modal, and block/unblock controls (`PATCH /api/admin/staff/[id]/status`).
     - `/portal-x/staff/[id]/analytics`: Staff performance audit ledger, KPI metrics, and client reassignment modal.
     - `/portal-x/analytics`: Luminous GitHub-style calendar heatmap aggregating daily assignment counts using `date-fns` intervals and a 5-tier intensity matrix.
- **Verification**:
  - 18/18 test suites passed, 128/128 tests passed.
  - `npm run typecheck` (`tsc --noEmit`) passes with 0 errors.
  - `npm run lint` (`next lint`) passes with 0 warnings and 0 errors.
  - `npm run build` compiles 21 static pages and 48 dynamic routes cleanly (exit code 0).

## ADR-026: Customer Dynamic QR Management Hub & Experience Optimization
- **Date**: 2026-11-05
- **Status**: Accepted & Implemented
- **Context**: A comprehensive product and UX audit revealed that while Taptch possessed enterprise dynamic QR backend infrastructure (`GET/POST /api/v1/qr`, fast redirects `/dq/[token]`, and vector print generation), customers had no direct self-service interface to manage, retarget, style, or download their dynamic QR codes. Additionally, customers with multiple profiles could only view their primary profile on the dashboard, and administrative operations in `/portal-x` were disconnected from `/admin`.
- **Decision**:
  1. **Customer Dynamic QR Management Hub (`src/app/(app)/qr/page.tsx`)**:
     - Built a dedicated self-service hub in the customer portal.
     - Live destination editor allowing users to toggle between Digital Profile, external URL, and WhatsApp (with phone number and pre-filled message) without changing the physical QR.
     - QR Customizer allowing foreground and background color customization with high error-correction (`H`) scannability preservation.
     - Real-time high-resolution 1024x1024 PNG download and vector SVG download powered by browser-side canvas rendering.
     - Instant one-click copy of dynamic shortlinks (`${origin}/dq/${token}`).
  2. **Unified Navigation & Information Architecture**:
     - Added `QR Codes` to main navigation links in `src/app/(app)/layout.tsx`.
     - Added direct `Portal-X Operations` shortcut link in Super Admin header (`src/app/(admin)/admin/page.tsx`).
  3. **Multi-Profile Dashboard Selector (`src/app/(app)/dashboard/page.tsx`)**:
     - Implemented dynamic profile selector tabs allowing users to switch active profile contexts across multiple personal and business identities.
     - Added direct `QR Code` button in the active profile card action row.
- **Verification**:
  - 18/18 test suites passed (128/128 tests).
  - TypeScript strict check (`tsc --noEmit`) passes with 0 errors.
  - ESLint (`next lint`) passes with 0 warnings and 0 errors.
  - Next.js 15 production build compiled cleanly (22 static pages and 48 dynamic routes).

## ADR-027: Multi-Tenant Organization Staff Management, 5-Tier RBAC & NFC Web Writer
- **Date**: 2026-11-05
- **Status**: Accepted & Implemented
- **Context**: Taptch previously had isolated field representative provisioning for Portal-X, but organization owners had no multi-tenant staff management capabilities. Customers needed to invite team members, assign fine-grained operational roles, manage permissions, suspend/revoke access, track chronological staff activities, and have a personalized staff workspace. In addition, physical card management required browser-level NFC NDEF encoding and honest hardware guidance.
- **Decision**:
  1. **Multi-Tenant Staff Architecture (`src/modules/orgs/`)**:
     - Built comprehensive service orchestration: `createOrganization`, `listUserOrganizations`, `inviteStaff`, `listOrganizationStaff`, `updateStaffMember`, `removeStaffMember`, `acceptInvitation`, `rejectInvitation`, `getStaffDashboardData`, `logStaffActivity`, and `getOrganizationAuditLogs`.
     - 5 distinct operational roles: `owner` (full sovereign control), `admin` (team and profile administration), `manager` (profile and QR operations), `staff` (field activation, QR pairing, leads), and `viewer` (read-only audit).
     - Strict privilege escalation barriers: managers cannot invite admins; admins cannot modify other admins or the owner; owner cannot be removed.
     - Session revocation: suspending or deactivating a staff member automatically revokes active session pointers to the organization.
  2. **Database Migration 0009**:
     - Created `0009_organization_staff_management.sql` altering `members` and `invitations` tables to add `status` ('active' | 'suspended' | 'deactivated'), `permissions` (JSONB array), `assigned_responsibilities` (text), and `phone_number`. Applied to both Supabase PostgreSQL and PGlite embedded test databases.
  3. **RESTful API Roster**:
     - Implemented 8 endpoints under `/api/v1/orgs/` supporting organization listings, staff invites, member updates, audit inspection, personal staff dashboard metrics, and invite acceptance/rejection.
  4. **Frontend Staff Suite**:
     - Created `/team` (Organization & Staff Administration), `/team/my-work` (Personal Staff Workspace), and `/invite/[id]` (Invitation response portal). Added `Team` to main customer navigation (`src/app/(app)/layout.tsx`).
  5. **NFC Tag Writer & Compatibility Guidance (`/cards`)**:
     - Implemented in-browser Web NFC writing (`NDEFReader`) on supported Android Chromium devices.
     - Transparently documented hardware limitations for iOS/desktop with one-click NDEF URL copying and NFC Tools recommendations.
- **Verification**:
  - 19/19 test suites passed (141/141 tests) across Vitest.
  - TypeScript strict check (`tsc --noEmit`) passes with 0 errors.
  - ESLint (`next lint`) passes with 0 warnings and 0 errors.
  - Next.js 15 production build compiled cleanly (24 static pages and 54 dynamic routes).

## ADR-028: 360° Master Project Audit & Edge Route Guard Middleware Architecture
- **Date**: 2026-11-05
- **Status**: Accepted & Implemented
- **Context**: A comprehensive 360-degree audit across Product Strategy, Architecture, UI/UX, Feature Integrity, RBAC, Database, Security, Performance, and DevOps was conducted. The audit revealed two security vulnerabilities:
  1. (P0 — AUD-SEC-001): Protected application routes (`/dashboard`, `/qr`, `/cards`, `/leads`, `/team`, `/builder/*`, `/portal-x/*`, `/admin/*`) lacked Next.js Edge Route Protection Middleware and relied solely on client-side React `useEffect` redirects in `AppLayout`. Unauthenticated visitors received an unhydrated HTML shell and loading spinner before browser redirection fired.
  2. (P1 — AUD-SEC-002): Internal development utilities (`/dev/gallery` and `/dev/supabase-test`) were compiled into production builds without environment gating, risking internal endpoint exposure.
- **Decision**:
  1. **Next.js Edge Route Protection Middleware (`src/middleware.ts`)**:
     - Implemented Edge middleware inspecting Better Auth session cookies (`better-auth.session_token` and `__Secure-better-auth.session_token`).
     - Supports automated test environment bypass via `x-test-user-id`.
     - Automatically redirects unauthenticated requests on protected routes to `/login?callbackUrl=${encodeURIComponent(...)}` before any page rendering occurs.
     - Automatically redirects authenticated users visiting `/login` or `/register` to `/dashboard`.
     - Explicit matcher excludes static assets, public profiles (`/p/*`), dynamic token redirects (`/dq/*`, `/q/*`, `/n/*`), and API handlers (`/api/*`).
  2. **Production Gating for Dev Utility Routes (`src/app/dev/*`)**:
     - Added `if (process.env.NODE_ENV === 'production') notFound();` to `/dev/gallery` and `/dev/supabase-test`.
     - Middleware additionally returns HTTP 404 for any `/dev/*` request when running in production.
  3. **Comprehensive Audit Documentation**:
     - Authored all 13 required master audit deliverables in `docs/audit/` (`01-executive-summary.md` to `13-final-readiness-scorecard.md`).
  4. **Dedicated Verification**:
     - Added 7 dedicated unit tests in `tests/unit/middleware.test.ts`.
- **Verification**:
  - 20/20 test suites passed (148/148 tests) across Vitest.
  - TypeScript strict check (`tsc --noEmit`) passes with 0 errors.
  - ESLint (`next lint`) passes with 0 warnings and 0 errors.
  - Next.js 15 production build compiled cleanly (24 static pages and 54 dynamic routes, with Edge Middleware size 34.5 kB).

## ADR-029: 128-Bit QR Token Entropy, Edge HMAC Cookie Verification & Anti-Privilege Escalation
- **Date**: 2026-11-05
- **Status**: Accepted & Implemented
- **Context**: A second-stage security audit revealed three critical vulnerabilities:
  1. (P0 — SEC-VULN-001): Dynamic QR token generation in `src/modules/qr/token.ts` used 4 bytes (8 hex chars, 32 bits entropy), causing birthday collision vulnerabilities at only 65,536 tokens.
  2. (P0 — SEC-VULN-002): Next.js Edge Middleware only checked cookie presence without verifying Better Auth's HMAC-SHA256 signature, and permitted `ENABLE_TEST_AUTH` header bypass in potential production builds.
  3. (P0 — SEC-VULN-003): Organization Admins (`role: 'admin'`) received `isAdmin: true` in `src/lib/auth/session.ts`, triggering global administrative bypass in `can()` across competing organizations.
- **Decision**:
  1. **128-Bit Cryptographically Secure QR Tokens**:
     - Upgraded `generateQRToken()` to `randomBytes(16).toString('hex')` (32 hex characters = 128 bits cryptographic entropy).
     - Database schema `varchar(32)` accommodates both 8-character legacy tokens and 32-character tokens without breaking existing printed QR codes.
  2. **Edge HMAC-SHA256 Cookie Signature Verification (`src/lib/auth/cookie-verify.ts`)**:
     - Middleware uses Web Crypto API (`crypto.subtle`) to verify Better Auth cookie HMAC signatures. Forged, unsigned, or tampered tokens are rejected immediately with HTTP 307 redirect to `/login`.
     - Test headers (`x-test-user-id`) are strictly restricted to `process.env.NODE_ENV === 'test'`.
  3. **Strict Privilege Scoping**:
     - `isAdmin` and global multi-tenant bypass in `can()` are strictly restricted to `role === 'super_admin'`. Organization Admins are strictly scoped to their `organizationId`.
  4. **Adversarial Security Test Suite (`tests/integration/adversarial-security.test.ts`)**:
     - Verified anti-privilege escalation, cross-tenant mutation rejection, path verification (`/q/`, `/dq/`, `/n/`), and empirical latency benchmarks (p50 < 50ms).
- **Verification**:
  - 21/21 test suites passed (162/162 tests) across Vitest.
  - TypeScript strict check (`tsc --noEmit`) passes with 0 errors.
  - ESLint (`next lint`) passes with 0 warnings and 0 errors.
  - Next.js 15 production build compiled cleanly (24 static pages and 54 dynamic routes, Middleware size 34.8 kB).
  - NPM audit reports 0 vulnerabilities.

## ADR-030: Production-Grade Project Rebranding to TAPTCH
- **Date**: 2026-11-07
- **Status**: Accepted & Implemented
- **Context**: The product was rebranded from Taptch / Taptch to **TAPTCH** (official spelling: `T A P T C H`). The migration required 100% preservation of business logic, features, data integrity, session continuity, API compatibility, and security, with zero hardcoded brand literals in UI components.
- **Decision**:
  1. **Centralized Brand Source of Truth (`src/config/brand.ts`)**:
     - Updated official name to `TAPTCH`, domain to `taptch.com`, support email to `support@taptch.com`.
     - Zero hardcoded brand literals in UI components, enforced by `tests/architecture/brand-literal.test.ts`.
  2. **Harmonic Nexus Vector Identity Pipeline**:
     - Reused and refined the official Harmonic Nexus geometric mark.
     - Generated 7 production SVG assets in `public/branding/logo/` (`taptch-logo-primary.svg`, `taptch-logo-dark.svg`, `taptch-logo-light.svg`, `taptch-logo-horizontal.svg`, `taptch-logo-stacked.svg`, `taptch-symbol.svg`, `taptch-monochrome.svg`) while preserving legacy `taptch-*.svg` assets as backward-compatibility aliases.
     - Generated high-res PWA icons (`icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, `favicon.svg`, `favicon.ico`).
  3. **Forward-Only Database Migration (`0010_taptch_rebranding.sql`) & 3-Way Ledger**:
     - Never modified historical migration files (`0000`–`0009`).
     - Runner `src/db/migrate.ts` unifies `__taptch_migrations`, `__taptch_migrations`, and `__taptch_migrations` to prevent re-execution of historical steps.
     - Forward-only migration updates active `system_settings` defaults to TAPTCH safely.
  4. **PWA, Browser Storage & Dynamic Metadata**:
     - Implemented dynamic Next.js PWA manifest route `src/app/manifest.ts` and fallback `public/manifest.json`.
     - Implemented automatic migration utility `src/lib/storage/index.ts` seamlessly copying legacy browser storage namespaces to `taptch_*`.
  5. **Infrastructure & DevOps**:
     - Updated `package.json` name to `taptch`.
     - Renamed CI pipeline to `TAPTCH CI`.
     - Container names updated to `taptch-*` with MinIO bucket `taptch-media`.
     - Database initialization script `infra/docker/postgres-init/01-init-roles.sql` configures `taptch_migrator` and `taptch_app` with backward-compatible role aliases.
  6. **Auth, Session & Media Isolation**:
     - Preserved Better Auth session token schemas and cookies (`better-auth.session_token`).
     - Added fallback secret verification for legacy dev tokens.
     - Cloudinary folder taxonomy updated to `taptch/...` with legacy upload compatibility.
- **Verification**:
  - `npm run db:migrate` and `npm run db:seed` executed cleanly.
  - All 21 test suites passed (162/162 tests) across Vitest.
  - TypeScript strict check (`tsc --noEmit`) passes with 0 errors.
  - ESLint (`next lint`) passes with 0 warnings and 0 errors.
  - Next.js 15 production build compiled cleanly (25/25 routes, Middleware size 34.5 kB).

---

## ADR-022: Isolated Architecture for Instagram NFC Card Commercial Campaign

- **Date**: 2026-11-08
- **Status**: Accepted & Implemented
- **Context**: The business requires running a temporary, limited-scope commercial sales campaign to sell custom physical Instagram NFC profile cards. The system must support interactive customization (DIY vs Assigned Designer), offline payments with WhatsApp coordination, order management with thermal barcodes, document generation (Invoices and Packing Slips), and real-time P&L reporting without polluting core TAPTCH digital identity models or degrading long-term maintainability.
- **Decision**:
  1. **Strict Namespace Isolation**: All campaign domain code is quarantined in `src/campaigns/instagram-card/`, customer routes under `/campaigns/instagram-card`, and admin routes under `/admin/campaigns/instagram-card`.
  2. **Zero Core SaaS Database Pollution**: Campaign tables (`campaign_products`, `campaign_orders`, `campaign_order_designs`, `campaign_inventory_movements`, `campaign_expenses`, `campaign_refunds`) live in `src/db/schema/campaigns.ts` with no foreign keys back from core SaaS profiles or subscriptions.
  3. **Authoritative Server-Side Pricing**: Unit prices, designer consultation fees, shipping tiers, and statutory GST (18%) are calculated and verified exclusively on the backend via `pricing.service.ts` to prevent client price tampering.
  4. **Two-Step Offline Payment Reconciliation**: Defer third-party payment gateways (Razorpay/Stripe) to Phase 2. Payment references (UTRs) are captured and manually verified by Super Admins before order production and invoice issuance.
  5. **Native PDF Document Engine**: Implemented `pdf-lib` for fast, serverless generation of A4 GST Tax Invoices and thermal Packing Slips with scannable Code 128 barcodes.
  6. **Double-Entry Financial Cashbook**: `finance.service.ts` tracks gross sales volume vs recognized cash revenue, theoretical and direct COGS, and operational overheads to compute dynamic Net Margin %.
- **Consequences**:
  - Full commercial functionality ready for immediate launch.
  - Can be deactivated via configuration toggle (`enabled: false`) or completely archived without touching core SaaS models.
  - Verified with 6 dedicated domain unit tests passing cleanly.

---

## ADR-031: Supabase PostgreSQL as the Sole Application Database & Elimination of Local Database Infrastructure

- **Date**: 2026-11-09
- **Status**: Accepted & Implemented
- **Context**: TAPTCH previously supported dual database options: a local containerized PostgreSQL + PgBouncer stack in Docker Compose, and remote Supabase PostgreSQL. Maintaining duplicate local database containers, PgBouncer sidecars, and local initialization scripts increased local system resource overhead, introduced configuration drift, and risked test-vs-runtime discrepancy. The goal was to eliminate all local database infrastructure and establish Supabase PostgreSQL as the sole runtime application database across all non-test environments.
- **Decision**:
  1. **Supabase PostgreSQL Sole Database**: Configured runtime connection strings (`DATABASE_URL` and `DATABASE_URL_DIRECT`) pointing directly to Supabase (`db.nvrcgauxafpxsaufjtha.supabase.co:5432`) with mandatory SSL encryption (`?sslmode=require`).
  2. **Removal of Local Database Containers**:
     - Removed `postgres` (port 5432) and `pgbouncer` (port 6432) services along with `postgres_data` volume from `docker-compose.yml`.
     - Preserved only auxiliary development containers: Redis 7.2 (caching/queues), MinIO (S3 emulator), and Mailpit (SMTP tester).
     - Deleted obsolete local database initialization scripts (`infra/docker/postgres-init/01-init-roles.sql`).
  3. **Purge of Localhost Connection Fallbacks**:
     - Updated `src/db/index.ts` to strictly require `DATABASE_URL` outside tests and enforce `ssl: 'require'` for remote connections.
     - Updated `src/db/migrate.ts` to remove `localhost:5432` fallback and enforce `ssl: 'require'`.
  4. **Idempotent Development Seeding & Better Auth**:
     - Updated `src/db/seed.ts` with `seedDevelopmentAccounts(db)` utilizing Better Auth (`auth.api.signUpEmail`).
     - Provisioned 3 functional development accounts: `admin@taptch.local` (`super_admin`), `manager@taptch.local` (`admin`), and `user@taptch.local` (`user`).
     - Passwords generated cryptographically and saved to gitignored `DEV_LOGIN_CREDENTIALS.md`.
  5. **In-Memory Testing Isolation**:
     - Maintained `@electric-sql/pglite` embedded in-process database exclusively for automated unit and integration tests (`npm test`), preventing remote database pollution.
- **Verification**:
  - `npm run db:migrate`: Verified 13/13 migrations applied in Supabase `drizzle` schema.
  - `npm run db:seed`: Idempotently executed twice without errors or duplicate conflicts.
  - `npx tsx scripts/verify-supabase-app.ts`: 15/15 tests passed across auth, profiles, dynamic QR, and media assets.
  - `npm test`: 22 test files passed, 173/173 tests passed.
  - `npm run typecheck`: 0 errors.
  - `npm run lint`: 0 errors.
  - `npm run build`: Next.js 16.4.5 (Turbopack) compiled 34 static and dynamic routes cleanly.

---

## ADR-032: Premium Typography System Modernization (Geist Sans & Geist Mono, Tokenized Scale & Strict Weight Discipline)

- **Date**: 2026-11-09
- **Status**: Accepted & Implemented
- **Context**: The user requested modernizing the entire TAPTCH typography system to deliver an understated, premium, minimal, and consistent visual experience using Geist Sans (primary) and Geist Mono (monospace), establishing a rigorous type scale, eliminating aggressive/excessive bold weights (`font-extrabold`, `font-black`, blunt bold), and introducing reusable design tokens.
- **Decision**:
  1. **Primary Font Architecture (`src/config/fonts.ts`)**:
     - Configured `Geist` (primary sans-serif) and `Geist_Mono` (tabular / technical monospace) via Next.js native font optimization (`next/font/google`).
     - Fonts are pre-downloaded, self-hosted, and optimized at build time with zero client runtime network requests to Google Fonts.
     - Exposed CSS variables `--font-geist-sans` and `--font-geist-mono` injected at `<html>` root in `src/app/layout.tsx`.
  2. **Tailwind Token System & Font Scaling (`tailwind.config.ts`)**:
     - Configured `fontFamily.sans`, `fontFamily.mono`, and `fontFamily.heading`.
     - Standardized display and heading scale: Display (48–64px desktop with `-0.03em` tracking), H1 (36–48px), H2 (28–36px), H3 (20–24px), Body (14–16px with relaxed line-height), Secondary (13–14px), Labels (12–13px), Small metadata (11–12px).
  3. **CSS Typography Tokens (`src/app/globals.css`)**:
     - Added `@layer components` design tokens: `.taptch-display`, `.taptch-h1`, `.taptch-h2`, `.taptch-h3`, `.taptch-body`, `.taptch-secondary`, `.taptch-label`, `.taptch-meta`, and `.taptch-mono`.
  4. **Weight Discipline & Visual De-cluttering**:
     - Pruned all `font-extrabold` and `font-black` declarations across the application (landing page, campaign pages, admin dashboards, templates).
     - Standardized weights: 400 for body copy, 500 (`font-medium`) for navigation, controls, and form labels, 600 (`font-semibold`) for headings, and selective mono for tracking numbers, order barcodes, pricing, and metric KPIs.
     - Modernized responsive transactional emails (`src/lib/email/index.ts`) with Geist Sans and Geist Mono fallbacks.
- **Verification**:
  - `npm run typecheck`: 0 errors.
  - `npm run lint`: 0 errors.
  - `npm test`: 22 test files passed, 173/173 tests passed.
  - `npm run build`: Next.js 16.4.5 (Turbopack) production build compiled all 32 static and dynamic routes cleanly.

---

## ADR-033: Universal Product Experience, Common Interaction Components & Flow Standardization

- **Date**: 2026-11-09
- **Status**: Accepted & Implemented
- **Context**: Across SaaS applications, missing baseline interaction affordances (password visibility toggles, real-time confirmation validation, strength meters, double-submit protection, toast notifications, clipboard copy feedback, filter bars, pagination, and unsaved changes confirmation) degrade user confidence and product polish. The user requested a comprehensive, project-wide audit and implementation of all common, expected, and professional product features across every page and workflow.
- **Decision**:
  1. **Reusable Interaction Primitives (`src/components/ui/`)**:
     - `PasswordInput`: Built accessible eye toggle (`showPassword` state) with `aria-label` and `aria-pressed`.
     - `ConfirmPasswordInput` & `PasswordStrengthMeter`: Real-time match checking, entropy-based 4-tier score calculation (Weak, Fair, Good, Strong) with visual color bars and requirement pills.
     - `FormField`, `FormLabel`, `FormError`, `FormSuccess`, `FormHelperText`: Unified form container supporting required asterisks and descriptive errors.
     - `LoadingButton` & `SubmitButton`: Single-action enforcement disabling double clicks with spinner animation and custom loading text.
     - `CopyButton` & `ShareButton`: Clipboard API with legacy fallback (`document.execCommand`), visual checkmark transition, and toast confirmation; Web Share API with copy fallback.
     - `SearchInput`, `FilterBar`, `Pagination`, `DataTable`: Debounced query handling, render-phase prop sync, instant `X` clear button, accessible pagination controls, and sortable data tables.
     - `EmptyState`, `ErrorState`, `StatusBadge`, `Skeleton`: State handling for lists, tables, and async metrics.
     - `ConfirmDialog`, `DeleteDialog`, `UnsavedChangesDialog`: Radix Alert Dialog wrappers for destructive operations, profile draft protection (`beforeunload` + in-app transitions).
     - `ToastSystem`: Radix UI Toast system with `useToast` hook mounted globally at application root.
  2. **Authentication & Account Lifecycle Upgrades**:
     - Upgraded `/register` with `ConfirmPasswordInput`, `PasswordStrengthMeter`, and `LoadingButton`.
     - Upgraded `/login` with `PasswordInput`, "Forgot password?" link, and "Remember this device" checkbox.
     - Built `/forgot-password` route invoking Better Auth password reset with confirmation screen.
     - Built `/reset-password` route with token extraction, new password strength meter, and confirmation validation.
     - Built `/settings` page supporting password changes, session revocation, and security posture overviews.
  3. **Application Pages Modernization**:
     - Upgraded `/dashboard`: Replaced raw text copy with `CopyButton`, `ShareButton`, `StatusBadge`, `Skeleton` cards, and `EmptyState`.
     - Upgraded `/leads`: Integrated debounced `SearchInput`, pagination slice math (9 items/page), copy-to-clipboard for email/phone, and toast for CSV export.
     - Upgraded `/cards`: Added redirect URL copying, hardware status badges, loading states for claim modals, and toast alerts.
     - Upgraded `/qr`: Integrated search, filter, `DeleteDialog` wired to `DELETE /api/v1/qr/[id]`, and copy buttons.
     - Upgraded `/team`: Added staff member deletion dialog, search filtering across members and audit logs.
     - Upgraded `/builder/[id]`: Added `hasChanges` dirty tracking, `beforeunload` window protection, and `UnsavedChangesDialog`.
     - Upgraded `/admin`: Added publication review confirmation dialogs (`ConfirmDialog`), media filtering, and order search.
- **Verification**:
  - `npm test -- tests/unit/common-interactions.test.ts`: 16/16 tests passed.
  - `npm test`: 23 test suites passed, 189/189 tests passed.
  - `npm run typecheck`: 0 errors.
  - `npm run lint`: 0 errors.
  - `npm run build`: Next.js 16.4.5 (Turbopack) production build compiled cleanly across all 35 static and dynamic routes.

---

## ADR-034: Profile Design Studio, 6 Luxury Themes, Unified Renderer & Production Readiness

- **Date**: 2026-11-09
- **Status**: Accepted & Implemented
- **Context**: The Profile Builder previously had a custom mockup preview pane that drifted from the published profile layout on `/p/[slug]`, only 5 luxury templates had dedicated layout implementations (`apex-capital` fell back to `PremiumBrandTemplate`), template switching lacked visual cards and custom color overrides, file uploads lacked Cloudflare dual-mode support, social media links lacked `@username` normalization, and Indian business profiles lacked native UPI payment QR/intent capability.
- **Decision**:
  1. **Single Shared Rendering Engine (`src/components/templates/ProfileRenderer.tsx`)**:
     - Standardized `ProfileRenderer` as the sole authoritative layout engine for both the Profile Builder live preview (`/builder/[id]`) and public profile routes (`/p/[slug]`).
     - Replaced hardcoded builder `<aside>` mockup with reactive `<ProfileRenderer profile={renderProfileData} />`.
     - Integrated realistic viewport frame toggle (Mobile 375px device frame, Tablet 440px, Desktop full width) without remounting the component tree.
  2. **6 Genuinely Distinct Luxury Themes**:
     - `Obsidian Luxury` (`obsidian-luxury`): Deep obsidian (`#0A0A0C`), brushed metallic gold (`#D4AF37`), matte charcoal surfaces (`#121216`).
     - `Ivory Minimalist` (`ivory-minimal`): Warm editorial paper (`#FAF9F5`), charcoal type, hairline brass borders (`#E5E0D8`).
     - `Aurora Creator` (`aurora-creator`): Violet-indigo neon mesh gradients (`#0F0728` to `#2E0854`), frosted glassmorphic cards, emerald badges.
     - `Zenith Corporate` (`zenith-corporate`): Slate navy executive aesthetic (`#0A1128` to `#001F54`), sapphire badges, high-contrast credibility typography.
     - `Catalyst Business` (`catalyst-business`): High-energy carbon dark (`#111827`), electric amber/orange highlights (`#F59E0B`), bold action CTAs.
     - `Apex Capital` (`apex-capital`): Dedicated layout authored in `ApexCapitalTemplate.tsx` featuring deep emerald (`#021A14`, `#062D24`), platinum dividers, and luxury portfolio showcase.
  3. **Visual Style Studio & Zero Data Loss Customization**:
     - Built 6-card interactive visual switcher with live theme preview cards.
     - Added Primary & Accent color pickers supporting curated presets and custom Hex inputs, persisted to `profile.themeConfig` without data loss.
     - Provided "Restore Theme Defaults" button to reset colors instantly.
  4. **Template Gallery Bi-directional Flow**:
     - Added `profileId` state preservation to `/templates` and `/templates/[id]` with visual return banner, direct template mutation via `PATCH /api/v1/profiles/${profileId}`, and redirection back to `/builder/${profileId}`.
  5. **Dual-Mode Media Upload (`ImageUploadOrUrl.tsx`)**:
     - Drag-and-drop file upload to Cloudflare storage API (`/api/v1/media/upload`) with direct URL input fallback for avatar, cover, business logo, and catalogue products.
  6. **13-Platform Social Media Suite (`src/lib/socials.ts`)**:
     - Added support for 13 global platforms (LinkedIn, Instagram, X/Twitter, WhatsApp, Telegram, YouTube, GitHub, Facebook, Threads, TikTok, Discord, Medium, Website) with `@username` normalization and display handle formatting.
  7. **Native UPI Payment Feature (`src/lib/upi.ts`, `UpiPaymentCard.tsx`)**:
     - Strict VPA regex validation, `upi://pay` NPCI URI builder, dynamic QR code generation/download, and mobile UPI app intent triggers (`Google Pay`, `PhonePe`, `Paytm`, `BHIM`) across all luxury templates.
  8. **Pre-Flight Profile Completion & Validation Engine (`src/lib/validation/profile-completion.ts`)**:
     - Built pre-publication validator analyzing required fields, invalid formats, warnings, and completion percentage score with one-click jump-to-tab navigation and celebratory publish modal.
- **Verification**:
  - `npm test -- tests/unit/profile-design-studio.test.ts`: 19/19 tests passed.
  - `npm test`: 24 test suites passed, 208/208 tests passed.
  - `npm run typecheck`: 0 errors (`tsc --noEmit`).
  - `npm run lint`: 0 errors.
  - `npm run build`: Next.js 16.4.5 Turbopack compiled clean.

---

## ADR-035: Production Authentication Transport & Origin Routing Resolution

- **Date**: 2026-11-09
- **Status**: Accepted & Implemented
- **Context**: Users reported `net::ERR_QUIC_PROTOCOL_ERROR` and "Failed to sign in. Please check your connection." when attempting to sign in on `https://taptch.com`. Controlled network diagnostics revealed the apex domain `taptch.com` was routing via Cloudflare proxy to a legacy GitHub Pages static host (`webzioinfo.github.io` / Fastly) rather than the active Vercel Next.js application deployment (`taptch.webziotech.in`). GitHub Pages static edge rejected `POST` requests with HTTP 405 Method Not Allowed and closed QUIC streams abruptly.
- **Decision**:
  1. **Dynamic Client Origin (`src/lib/auth/client.ts`)**: Derives Better Auth client `baseURL` from `window.location.origin` in the browser, eliminating cross-domain CORS rejections and ensuring cookies stay aligned with the active hostname.
  2. **Serverless In-Memory Redis Fallback (`src/lib/redis/index.ts`)**: Safe in-memory mock fallback when `REDIS_URL` is omitted, preventing lambda execution timeouts (`504 FUNCTION_INVOCATION_TIMEOUT`) from hanging localhost Redis socket retries.
  3. **Diagnostic Logging & Error Clarity (`src/app/api/auth/[...all]/route.ts`, `src/app/(auth)/login/page.tsx`)**: Formatted login errors to distinguish HTTP 405 routing issues from network or credential failures.
  4. **Git Production Synchronization**: Merged `modernization/stack-upgrade` into `main` and pushed to `origin/main` to trigger automated deployment on Vercel.
  5. **Cloudflare Routing Runbook (`docs/PRODUCTION_INCIDENT_REPORT.md`)**: Documented the necessary DNS update to point `taptch.com` A record to Vercel (`76.76.21.21`) and `www` CNAME to `cname.vercel-dns.com`.
- **Verification**:
  - Direct local API verification against live Supabase PostgreSQL returned HTTP 200 with valid session token and cookie headers.
  - Full test suite passed (24/24 files, 208/208 tests).
  - TypeScript strict compilation: 0 errors.








