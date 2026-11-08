# TAPTCH — Engineering Changelog

All notable changes to the TAPTCH platform are documented here.

---

## [Unreleased] — 2026-11-08

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

