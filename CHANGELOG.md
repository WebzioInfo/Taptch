# TAPTCH — Engineering Changelog

All notable changes to the TAPTCH platform are documented here.

---

## [Unreleased] — 2026-11-09

### Added
- **Cloudflare Infrastructure Integration:** Replaced Cloudinary with native Cloudflare Images (Direct Creator Upload v2 and delivery variants) and Cloudflare R2 (S3 SigV4 direct uploads for PDFs and documents).
- **Unified Storage Architecture:** Implemented provider-neutral storage service in `src/lib/storage/` with offline test mock fallback.
- **Cloudflare Schema Migration:** Applied database migration `0012_cloudflare_storage.sql` to live Supabase and local test database, adding provider-neutral metadata columns (`storage_provider`, `storage_key`, `storage_object_id`, `asset_url`).
- **Cloudinary-to-Cloudflare Migration Script:** Created automated migration utility `scripts/migrate-cloudinary-to-cloudflare.ts` with `--dry-run`, exponential retry, and audit logging.
- **Native ESLint Flat Config Execution:** Modernized `package.json` linting script to native `eslint src` using `eslint.config.mjs`, eliminating deprecated `next lint` CLI invocation.

### Removed
- **Cloudinary SDK Purged:** Completely removed `cloudinary@2.11.0` dependency and removed legacy client wrappers.
- **Dependency Pruning:** Removed 12 unused/redundant packages (`@dnd-kit/core`, `@dnd-kit/modifiers`, `@dnd-kit/sortable`, `@tanstack/react-query`, `zustand`, `framer-motion`, `react-hook-form`, `@hookform/resolvers`, `@fontsource/noto-sans-devanagari`, `@fontsource/noto-sans-malayalam`, `@fontsource/plus-jakarta-sans`, `bullmq`), trimming shared First Load JS to 103 kB.

### Verified
- **100% Test Pass Rate:** Verified 173/173 tests passing across 22 test files in Vitest.
- **Production Build:** Verified Next.js 15.5.28 production build successfully compiles all 35 routes.
- **Zero Vulnerabilities:** Verified `npm audit` reports 0 vulnerabilities.

---

## [0.1.0] — 2026-11-08

### Added
- **Apple-Inspired Instagram NFC Campaign Redesign:** Completely redesigned the public storefront (`/campaigns/instagram-card`) into a minimalist, product-focused experience with interactive 3D card hardware visualizer, asymmetric collection layout, and phone tap simulator.
- **Dynamic Idempotency Engine:** Added unique `idempotency_key` database constraint and validation in campaign orders to eliminate duplicate submissions under network lag.
- **Direct Upload Security:** Added strict file size (10MB max) and MIME type validation for image uploads in `storage.service.ts`.
- **Background Worker Engine:** Created decoupled background job processor (`job.service.ts`) for asynchronous invoice generation and tracking emails.
- **Architectural Documentation:** Authored `DESIGN_SYSTEM.md`, `DESIGN_QA_REPORT.md`, `AUDIT_REPORT.md`, `PROJECT_HEALTH_REPORT.md`, `ARCHITECTURE.md`, `SECURITY_AUDIT.md`, `DEPLOYMENT_GUIDE.md`, and `FINAL_PROJECT_REPORT.md`.

### Fixed
- **Universal Input Contrast:** Restored `bg-card` and `caret-primary` design tokens in `Input` and `Textarea` components, bringing full compatibility with both Corporate Light and Obsidian Luxury Dark themes and resolving all 5 assertion failures in `input-contrast-theme.test.ts`.
- **Next.js Tracing Root Warning:** Fixed workspace root lockfile warning by configuring `outputFileTracingRoot: path.resolve(__dirname)` in `next.config.mjs`.
- **Bundling Optimization:** Safely externalized `@electric-sql/pglite` and `postgres` via `serverExternalPackages` to guarantee smooth serverless and production compilation.
- **IDOR Protection on Order Tracking:** Enforced 10-digit phone minimum validation in `trackCampaignOrder` to prevent phone-enumeration IDOR attacks.
- **Admin Document Authorization:** Restricted campaign packing slip downloads to authenticated administrators.
- **Rate Limiter Garbage Collection:** Added automated pruning of expired sliding-window entries to prevent memory growth under burst traffic.

### Security
- Purged all legacy brand variations from application code and documentation.
- Verified 0 brand literal leaks with automated architecture tests.
- Re-verified zero vulnerabilities across all dependencies (`npm audit`).

