# TAPTCH — Complete Technology Stack & Version Audit

**Audit Date:** November 9, 2026  
**Auditor:** Senior Software Architect, Principal Full-Stack Engineer, Dependency Auditor  
**Repository:** `https://github.com/WebzioInfo/Taptch.git`  
**Working Directory:** `D:\Webzio\taptch`  
**Audit Scope:** Full codebase discovery, runtime verification, live build, typecheck, lint, test suite execution, and dependency compatibility analysis.

---

## 1. Executive Summary

A comprehensive, read-only architectural audit was conducted on the Taptch codebase. Every technology, framework, runtime, library, tool, and dependency was inspected and verified against physical disk assets, configuration files, and live command outputs.

### Key Health Verification Indicators
- **Type Checking (`tsc --noEmit`):** ✅ Passed (0 TypeScript errors)
- **Linting (`next lint`):** ✅ Passed (0 warnings, 0 errors)
- **Unit, Integration & Architecture Tests (`vitest run`):** ✅ Passed (22/22 test files, 172/172 tests passed)
- **Production Build (`next build`):** ✅ Passed (35/35 routes compiled and prerendered cleanly)
- **Security Vulnerabilities (`npm audit`):** ✅ 0 vulnerabilities detected across 629 total packages
- **Dependency Tree Health (`npm ls`):** ✅ Exit code 0, 0 unmet peer dependency errors

---

## 2. Technology Stack Overview

| Category | Technology / Library | Declared Version | Installed Version | Latest Version | Verification & Source Usage |
|---|---|---|---|---|---|
| **Core Framework** | Next.js (App Router) | `^15.5.0` | `15.5.28` | `16.4.5` | Production App Router in `src/app/`, Server Components, Route Handlers |
| **Frontend Runtime** | React | `^19.0.0` | `19.3.1` | `19.3.1` | Production React 19 Server/Client components, hooks (`useActionState`, etc.) |
| **DOM Renderer** | React DOM | `^19.0.0` | `19.3.1` | `19.3.1` | React 19 hydration and server rendering |
| **Language** | TypeScript | `^5.8.2` | `5.9.3` | `7.0.2` | Strict mode enabled, `ES2022` target, bundler module resolution |
| **Local Runtime** | Node.js | `>=20.0.0` | `v24.15.0` | `v24.15.0` | Local development host runtime (Windows 11) |
| **CI/Production Runtime** | Node.js LTS | `22.x` | `22.x` | `22.x` | Verified in `.github/workflows/ci.yml` (`actions/setup-node@v4`) |
| **Package Manager** | NPM | `11.13.0` | `11.12.1` | `11.13.0` | Single authoritative lockfile (`package-lock.json`) |
| **Styling & CSS** | Tailwind CSS | `^3.4.17` | `3.4.19` | `4.3.5` | Utility classes, CSS variables design system in `src/app/globals.css` |
| **CSS Processing** | PostCSS | `^8.5.32` | `8.5.32` | `8.5.32` | Configured via `postcss.config.mjs`, overridden via npm override |
| **CSS Vendor Prefixes** | Autoprefixer | `^10.4.20` | `10.6.2` | `10.6.2` | PostCSS plugin for cross-browser CSS prefixing |
| **CSS Animations** | tailwindcss-animate | `^1.0.7` | `1.0.7` | `1.0.7` | Keyframe and entrance animation utilities |
| **UI Primitive Library** | Radix UI Primitives | Various | `1.1.x`–`2.4.x` | Latest | Accessible headless components (Dialog, Dropdown, Tabs, Avatar, Slot) |
| **UI Component Variant** | class-variance-authority | `^0.7.1` | `0.7.1` | `0.7.1` | Type-safe UI variant management in `src/components/ui/` |
| **CSS Class Merging** | clsx & tailwind-merge | `^2.1.1` / `^3.0.2` | `2.1.1` / `3.7.0` | Latest | Resolves conditional class names and Tailwind collisions in `src/lib/utils.ts` |
| **Icon System** | Lucide React | `^0.475.0` | `0.475.0` | `1.70.0` | 49+ icon usages across admin, builder, cards, and campaign layouts |
| **Database ORM** | Drizzle ORM | `^0.45.4` | `0.45.4` | `0.45.4` | Schema definitions in `src/db/schema/`, type-safe migrations and queries |
| **Database Migrations** | Drizzle Kit | `^0.31.8` | `0.31.11` | `0.31.11` | Migration generator and studio tooling (`drizzle.config.ts`) |
| **PostgreSQL Driver** | postgres (postgres.js) | `^3.4.5` | `3.4.9` | `4.1.0` | High-performance PostgreSQL driver configured with `prepare: false` |
| **Embedded DB Driver** | @electric-sql/pglite | `^0.5.13` | `0.5.14` | `0.5.15` | Zero-dependency WASM PostgreSQL for local CI, unit, and integration testing |
| **Cloud Database** | Supabase PostgreSQL | `17.11` | `17.11` | `17.11` | Live hosted PostgreSQL instance at `db.nvrcgauxafpxsaufjtha.supabase.co` |
| **Cloud Database SDK** | @supabase/supabase-js | `^2.119.0` | `2.119.0` | `2.119.0` | Supabase API client for storage and database operations |
| **Cloud Database SSR** | @supabase/ssr | `^0.12.7` | `0.12.7` | `0.12.7` | Next.js Server Components and middleware cookie session synchronization |
| **Authentication** | Better Auth | `^1.7.14` | `1.7.15` | `1.7.18` | Unified auth engine with multi-tenant sessions, roles, and password hashing |
| **Password Hashing** | bcryptjs | `^3.0.3` | `3.0.3` | `3.0.3` | Secure password hashing (12 salt rounds) for staff and credentials |
| **Cache & Queue Broker** | ioredis | `^6.0.0` | `6.0.0` | `6.0.0` | Redis 7.2 client for sub-50ms QR/NFC cache-aside resolution |
| **Job Queue (Planned)** | bullmq | `^6.5.3` | `6.5.3` | `6.7.2` | Background queue dependency installed; worker container planned for Phase 2 |
| **Schema Validation** | Zod | `^4.6.7` | `4.6.7` | `4.6.7` | Runtime type validation on all route parameters, API bodies, and form inputs |
| **Media Cloud Storage** | Cloudinary SDK | `^2.11.0` | `2.11.0` | `2.11.0` | Direct server SDK for signed uploads, avatar optimization, and deletion |
| **QR Code Generation** | qrcode | `^1.5.4` | `1.5.4` | `1.5.4` | High-density vector SVG and PNG QR generation for NFC cards |
| **QR Code Scanning** | jsqr | `^1.4.0` | `1.4.0` | `1.4.0` | Camera feed QR token decoding for warehouse card activation |
| **PDF Generation** | pdf-lib | `^1.17.1` | `1.17.1` | `1.17.1` | Vector PDF generation for batch QR print sheets and order receipts |
| **Transactional Email** | Nodemailer | `^10.3.1` | `10.3.1` | `10.4.0` | SMTP client supporting TLS/STARTTLS and local dry-run console fallback |
| **Logging & Tracing** | Pino & Pino-Pretty | `^10.4.0` / `^13.0.0` | `10.4.0` / `13.2.0` | Latest | High-performance JSON logger with automatic secret redaction |
| **Internationalization** | next-intl | `^4.14.9` | `4.14.9` | `4.14.9` | Route translation and locale messages (`src/i18n/request.ts`) |
| **Unit Testing** | Vitest | `^4.1.12` | `4.1.12` | `5.1.0` | Lightning-fast test runner with native ESM and TypeScript support |
| **Accessibility Testing** | @axe-core/playwright | `^4.10.1` | `4.14.0` | `4.14.0` | Automated WCAG accessibility audit harness for Playwright |
| **Performance Testing** | Autocannon | `^9.0.0` | `9.0.0` | `9.0.0` | HTTP benchmarking tool for load testing API endpoints |
| **Linter** | ESLint | `^9.21.0` | `9.39.5` | `10.14.0` | Flat configuration with `@eslint/eslintrc` FlatCompat |
| **Code Formatter** | Prettier | `^3.5.3` | `3.9.10` | `3.9.10` | Strict code formatting across `.ts`, `.tsx`, `.css`, and `.json` |
| **Container Engine** | Docker Compose | Compose v2 | Local Docker | N/A | Multi-container setup (Postgres 16, PgBouncer, Redis 7.2, MinIO, Mailpit) |

---

## 3. Architecture Overview

```
                                  +------------------------------------+
                                  |         User & Tap Clients         |
                                  |   (Mobile Safari, Chrome, Tap NFC) |
                                  +-----------------+------------------+
                                                    |
                                                    v
                                  +------------------------------------+
                                  |      Next.js 15 App Router         |
                                  |    (Edge Middleware + Node RSC)    |
                                  +--------+-----------------+---------+
                                           |                 |
                   +-----------------------+                 +------------------------+
                   |                                                                  |
                   v                                                                  v
+--------------------------------------+                            +--------------------------------------+
|        Presentation Layer            |                            |         API & Webhook Layer          |
|  - Obsidian Luxury Design System     |                            |  - /api/v1/profiles, /api/auth       |
|  - Public Profile Route: /p/[slug]   |                            |  - /api/qr/dynamic/[token]/resolve   |
|    (Zero Dynamic Hot Path)           |                            |  - Zod Input & Mutation Validation   |
+------------------+-------------------+                            +------------------+-------------------+
                   |                                                                  |
                   +-----------------------+                 +------------------------+
                                           |                 |
                                           v                 v
                                  +------------------------------------+
                                  |        Domain Service Layer        |
                                  |   - Profile Engine & Snapshots     |
                                  |   - Entitlement Enforcement        |
                                  |   - Post-Print Card Activation     |
                                  |   - QR/NFC Resolution Engine       |
                                  +-----------------+------------------+
                                                    |
                                                    v
                                  +------------------------------------+
                                  |       Infrastructure Layer         |
                                  |  - Better Auth Session Engine      |
                                  |  - Cloudinary Media Handler        |
                                  |  - Nodemailer SMTP Dispatcher      |
                                  |  - Pino Structured Logging         |
                                  +--------+-----------------+---------+
                                           |                 |
                   +-----------------------+                 +------------------------+
                   |                                                                  |
                   v                                                                  v
+--------------------------------------+                            +--------------------------------------+
|       Cache & Message Broker         |                            |       Persistence Layer              |
|  - Redis 7.2 (ioredis client)        |                            |  - PostgreSQL 16 / Supabase 17.11    |
|  - Dynamic Token In-Memory Cache     |                            |  - Drizzle ORM (prepare: false)      |
|  - BullMQ Queue Broker (Phase 2)     |                            |  - PgBouncer Pooled Transactions     |
|                                      |                            |  - Row-Level Security (RLS) Isolation|
+--------------------------------------+                            +--------------------------------------+
```

### Key Architectural Boundaries
1. **Zero Dynamic Hot Path on Public Profiles (`/p/[slug]`):** Public profile pages render directly without importing `cookies()`, `headers()`, or `connection()`, maximizing CDN edge cacheability.
2. **PgBouncer Pooling Safety:** All queries via `drizzle-orm` execute with `prepare: false` to prevent duplicate prepared-statement collisions across pooled transactions.
3. **Multi-Tenant RLS Isolation:** Sensitive PostgreSQL queries execute through `withActor(actor, fn)` injecting transaction-scoped session variable `SELECT set_config('app.current_user_id', $1, true)`.
4. **Cloudinary Direct Integration:** Avoids `next-cloudinary` peer dependency friction while maintaining signed upload security and automatic WebP/AVIF transformations.

---

## 4. Technical Risks & Identified Issues

### A. Next.js 16 Upgrade Deprecation Notices
- `next lint` is deprecated in Next.js 15.5.28 and scheduled for removal in Next.js 16.
- The Next.js ESLint plugin is using `@eslint/eslintrc` FlatCompat rather than native Flat Config plugins.
- **Risk Level:** Low (Currently passing with 0 warnings, but should be modernized before Next.js 16).

### B. Direct Supabase Host IPv6 Warning
- Next.js build and runtime detect `DATABASE_URL` pointing to `db.nvrcgauxafpxsaufjtha.supabase.co:5432`.
- Direct Supabase endpoints are IPv6-only. While local Windows development resolves IPv6 cleanly, deployment on an IPv4-only VPS host will fail with `getaddrinfo ENOTFOUND`.
- **Mitigation:** Documented in `DEPLOYMENT_GUIDE.md` and `.env.local` to switch to Supabase Connection Pooler (`aws-0-[region].pooler.supabase.com:6543`) for IPv4 environments.

### C. Unused/Deferred Dependencies in package.json
Several packages are installed in `node_modules` and declared in `package.json`, but currently have 0 active import statements in `src/`:
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/modifiers` (builder drag-and-drop)
- `@tanstack/react-query` (data fetching uses React 19 RSC & Server Actions)
- `zustand` (state management uses React 19 native state and URL params)
- `framer-motion` (animations use Tailwind CSS and CSS transitions)
- `react-hook-form` & `@hookform/resolvers` (forms use controlled inputs and Server Actions)
- `bullmq` (worker container scheduled for Phase 2)
- `@fontsource/*` (fonts use system sans stack)
- **Risk Level:** Low (No build failure, but increases `node_modules` disk footprint).

### D. Extraneous Packages in node_modules
`npm ls` reports two extraneous packages:
- `@emnapi/runtime@1.11.3`
- `@img/sharp-wasm32@0.35.5`
These are transitive build artifacts from PGlite / Sharp WASM builds and do not affect runtime stability.

---

## 5. Prioritized Recommendations

### Priority 1: High (Pre-Production Deployment)
1. **Use Supabase Connection Pooler for Production Deployments:** When deploying to Linux VPS or Docker environments without IPv6 egress, configure `DATABASE_URL` with Supavisor pooler port `6543`.
2. **Configure Production SMTP Credentials:** Replace placeholder credentials in `.env.local` with authenticated transactional email credentials (SendGrid, Resend, or Google App Password).

### Priority 2: Medium (Codebase Cleanliness & Maintenance)
1. **Migrate ESLint to Native Flat Config:** Replace `next lint` and `@eslint/eslintrc` `FlatCompat` with `@next/eslint-plugin` in `eslint.config.mjs` using `npx @next/codemod@canary next-lint-to-eslint-cli .`.
2. **Implement BullMQ Worker Container (`src/worker/index.ts`):** Complete the background worker script to process async draft saves and email dispatches as outlined in the Phase 2 roadmap.
3. **Audit Unused Dependencies:** Either integrate `@dnd-kit`, `zustand`, and `@tanstack/react-query` into upcoming features or prune them from `package.json` to reduce bundle and installation size.

### Priority 3: Low (Future Technology Upgrades)
1. **Tailwind CSS v4 Evaluation:** Tailwind CSS v4.3.5 is available. Retain Tailwind v3.4.19 until third-party plugins (`tailwindcss-animate`) offer full v4 CSS theme compatibility.
2. **Next.js 16 Evaluation:** When Next.js 16 LTS stabilizes, evaluate migration with React 19.

