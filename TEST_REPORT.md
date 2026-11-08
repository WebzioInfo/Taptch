# TAPTCH — Automated Test & Verification Report

**Execution Date:** 2026-11-08  
**Test Runner:** Vitest v4.1.12  
**Node.js Runtime:** v24.15.0 (Windows x64)  
**Total Test Files:** 22  
**Total Executed Tests:** 172  
**Passed Tests:** 172 (100%)  
**Failed Tests:** 0 (0%)  

---

## 1. Test Execution Commands & Verification Output

```bash
# 1. Full Vitest Test Suite Execution
npm test
> taptch@0.1.0 test
> vitest run

 ✓ tests/unit/post-print-activation.test.ts (15 tests)
 ✓ tests/unit/publishing-scenarios.test.ts (8 tests)
 ✓ tests/unit/profiles.test.ts (7 tests)
 ✓ tests/unit/cloudinary.test.ts (5 tests)
 ✓ tests/integration/tenant-rls.test.ts (5 tests)
 ✓ tests/unit/public-templates-auth.test.ts (9 tests)
 ✓ tests/unit/templates.test.ts (11 tests)
 ✓ tests/unit/cards-leads-orders.test.ts (5 tests)
 ✓ tests/integration/adversarial-security.test.ts (7 tests)
 ✓ tests/unit/entitlements.test.ts (6 tests)
 ✓ tests/unit/template-preview-mock.test.ts (13 tests)
 ✓ tests/unit/dynamic-qr-engine.test.ts (14 tests)
 ✓ tests/unit/staff-management.test.ts (13 tests)
 ✓ tests/unit/instagram-card-campaign.test.ts (10 tests)
 ✓ tests/unit/save-draft-and-worker.test.ts (9 tests)
 ✓ tests/unit/middleware.test.ts (10 tests)
 ✓ tests/architecture/no-direct-db-in-pages.test.ts (1 test)
 ✓ tests/architecture/brand-literal.test.ts (1 test)
 ✓ tests/unit/brand-assets.test.ts (4 tests)
 ✓ tests/unit/email-smtp.test.ts (5 tests)
 ✓ tests/unit/permissions.test.ts (9 tests)
 ✓ tests/unit/input-contrast-theme.test.ts (5 tests)

 Test Files  22 passed (22)
      Tests  172 passed (172)
   Duration  89.77s
```

---

## 2. Compilation, Lint & Build Verification Commands

```bash
# 2. TypeScript Strict Mode Compilation
npm run typecheck
> tsc --noEmit
# Exit code: 0

# 3. Next.js ESLint Code Quality Inspection
npm run lint
> next lint
✔ No ESLint warnings or errors
# Exit code: 0

# 4. Next.js Production Build & Static Prerendering
npm run build
> next build
✓ Compiled successfully in 41s
✓ Generating static pages (34/34)
# Exit code: 0
```

---

## 3. Verified Security Assertions
- `tests/integration/adversarial-security.test.ts`:
  - Validates rejection of malicious redirect URLs and open-redirect vulnerabilities.
  - Validates rejection of expired or manipulated HMAC signatures.
  - Validates authorization perimeter on administrative endpoints.
- `tests/architecture/brand-literal.test.ts`:
  - Scans JSX and UI code to ensure zero hardcoded brand literals exist outside configuration files.
- `tests/architecture/no-direct-db-in-pages.test.ts`:
  - Enforces Clean Architecture: Route handlers and page components must not directly import raw database clients.
