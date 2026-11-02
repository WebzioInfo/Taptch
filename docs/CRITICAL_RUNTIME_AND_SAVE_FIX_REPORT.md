# Tapzio — Critical Runtime, Save Draft & Worker Crash Fix Report

**Report Date:** November 2, 2026  
**Engineering Discipline:** Principal Next.js Architect, Production Reliability Engineer, Systems Runtime Specialist  
**Project:** Tapzio (`D:\Webzio\Tapzio`)  
**Target Environments:** Node.js v24.15.0 / Next.js 15.5.28 / React 19.0.0 / PostgreSQL 17 / Redis / Drizzle ORM

---

## 1. Executive Summary

During profile draft editing, saving, and publishing, three critical failure modes were diagnosed and repaired:
1. **Issue A (Save Draft 400 Client Rejection)**: `PATCH /api/v1/profiles/[id]` returned HTTP 400 (`"The submitted payload did not match the required schema"`) due to strict Zod schema constraints rejecting `null` values on nullable database columns (`headline`, `bio`, `avatarUrl`, `coverUrl`) and missing contact/social field definitions in the route validator.
2. **Issue B (Next.js Worker Thread MODULE_NOT_FOUND)**: Next.js Webpack server bundling relocated thread worker dependencies (`thread-stream`/`pino-pretty`) into `.next/server/vendor-chunks/`, triggering `Cannot find module '.next/server/vendor-chunks/lib/worker.js'`.
3. **Issue C (Logger Worker Crash & Redis Resiliency)**: When worker threads crashed, subsequent logging calls inside Redis `client.on('error')` threw `Error: the worker thread exited` as an uncaught exception, abruptly terminating the Node.js process.

All three issues have been resolved at the architectural and runtime levels. All 69 automated tests pass with 100% success, ESLint reports zero errors or warnings, and the Next.js 15 production build compiles without errors.

---

## 2. Deep Root-Cause Analysis & Concrete Solutions

### Issue A: Save Draft 400 Payload Mismatch
- **Observed Behavior**:
  ```text
  PATCH /api/v1/profiles/prof_1793621970525_fmk5n7k 400
  The submitted payload did not match the required schema
  ```
- **Root Cause**:
  1. In PostgreSQL, optional fields (`headline`, `bio`, `avatarUrl`, `coverUrl`, `phone`, `email`, `whatsapp`, `website`, `address`, `location`) are nullable (`NULL`). When an existing draft was fetched and edited in `src/app/(app)/builder/[id]/page.tsx`, state variables contained `null` for unpopulated fields.
  2. The backend route schema in `src/app/api/v1/profiles/[id]/route.ts` defined fields using `z.string().optional()`. In Zod, `.optional()` accepts `undefined` but rejects `null` (`Expected string, received null`).
  3. Furthermore, newly introduced contact fields (`phone`, `whatsapp`, `email`, `website`, `address`, `location`, `socialLinks`, `customFields`) were completely absent from the route schema.
  4. In `src/app/(app)/builder/[id]/page.tsx`, Contact and Social inputs lacked two-way state bindings (`value` and `onChange`), rendering them non-functional.
- **Architectural Solution**:
  1. Extracted and normalized validation schemas into `src/modules/profiles/validation.ts`.
  2. Applied `.nullish()` (equivalent to `.nullable().optional()`) to all optional text, URL, and object fields across `updateProfileSchema`.
  3. Expanded `socialLinks` to accept both structured record maps (`Record<string, string>`) and array lists (`{ platform, url }[]`).
  4. Updated `src/lib/api/response.ts` to transform `ZodError` into structured, human-readable field messages with full error path details.
  5. Implemented complete two-way reactive bindings, partial section saves (`handleSaveSection`), and an instantaneous "Reset Changes" revert handler in `src/app/(app)/builder/[id]/page.tsx`.

### Issue B: Next.js Worker Module Resolution Failure
- **Observed Behavior**:
  ```text
  Cannot find module 'D:\Webzio\Tapzio\.next\server\vendor-chunks\lib\worker.js' code: MODULE_NOT_FOUND
  ```
- **Root Cause**:
  - Next.js Webpack bundler bundled `pino-pretty` and `thread-stream` into `.next/server/vendor-chunks/`.
  - At runtime, `thread-stream` dynamically evaluated its worker script relative to `__dirname`, resolving to `.next/server/vendor-chunks/lib/worker.js` instead of the physical `node_modules/thread-stream/lib/worker.js`.
- **Architectural Solution**:
  1. Added `serverExternalPackages: ['pino', 'pino-pretty', 'thread-stream', 'ioredis']` to `next.config.mjs`, ensuring Node.js native runtime resolution directly from `node_modules`.
  2. Eliminated multithreaded worker transport in favor of standard, zero-overhead stdout buffered Pino logging in Next.js runtime.

### Issue C: Pino Logger Worker Crash & Redis Resiliency
- **Observed Behavior**:
  ```text
  Error: the worker thread exited
    at ... node_modules/thread-stream/index.js
    at ... src/lib/redis/index.ts:126
  ```
- **Root Cause**:
  - In Node.js, throwing an exception inside an EventEmitter `'error'` listener (such as `client.on('error', ...)`) causes Node.js to trigger `uncaughtException`, immediately killing the process.
  - When the logger transport stream failed, calling `logger.warn(...)` inside Redis's error handler threw an unhandled error.
- **Architectural Solution**:
  1. **Crash-Proof Logging Dispatcher (`safeLog`)**: In `src/lib/logger/index.ts`, all logger methods (`info`, `warn`, `error`, `debug`) are wrapped with an isolated try-catch fallback that redirects directly to `console[method]` if any stream or worker issue arises.
  2. **Singleton Resilience**: Bound logger to `globalThis.__tapzio_logger__` and Redis client to `globalThis.__tapzio_redis__`, preventing thread proliferation during Next.js Hot Module Replacement.
  3. **Event Listener Protection**: Wrapped Redis event listeners in defensive try-catch handlers to guarantee Redis network connection dropouts or restarts never crash API endpoints or publishing flows.
  4. **Recoverable Secondary Operations**: In `publishProfile`, database persistence is strictly completed and verified first. Redis cache invalidation/sync runs in an isolated, non-blocking try-catch block.

---

## 3. Node.js Version Compatibility Assessment

- **Node.js Environment**: Node.js `v24.15.0` (Current Active LTS/Current).
- **Next.js Version**: Next.js `15.5.28` (React 19.0.0).
- **Evaluation & Findings**:
  - Node.js v24 introduces stricter unhandled promise and worker thread lifecycle controls.
  - Next.js 15.5.x runs stably on Node.js v24 when server-external packages (`ioredis`, `pino`, `thread-stream`) are declared in `serverExternalPackages`.
  - No deprecated Node.js APIs or native ABI incompatibilities were identified.
  - All standard npm scripts (`npm run build`, `npm test`, `npm run typecheck`, `npm run lint`) execute cross-platform in PowerShell and Linux CI without warnings.

---

## 4. Test Verification & Empirical Results

All verification gates were executed directly via npm CLI:

| Verification Gate | Command | Result | Evidence |
|:---|:---|:---|:---|
| **TypeScript Typecheck** | `npm run typecheck` | **PASS (0 errors)** | Exit Code: 0 |
| **ESLint Quality Check** | `npm run lint` | **PASS (0 warnings, 0 errors)** | Exit Code: 0 |
| **New Test Suite** | `npm test tests/unit/save-draft-and-worker.test.ts` | **PASS (9/9 passed)** | Exit Code: 0 (426ms) |
| **Complete Unit & Integration Suite** | `npm test` | **PASS (69/69 passed across 12 test files)** | Exit Code: 0 (33.63s) |
| **Next.js 15 Production Build** | `npm run build` | **PASS (15/15 static pages, 48 routes)** | Exit Code: 0 |

### Specific Scenarios Verified in `tests/unit/save-draft-and-worker.test.ts`:
1. `accepts null, undefined, and empty strings for optional fields without 400 rejection` (Passed)
2. `accepts complete profile payloads with all sections` (Passed)
3. `rejects invalid email formats with field-specific validation message` (Passed)
4. `rejects headlines exceeding 255 characters with clear message` (Passed)
5. `preserves untouched fields during partial section updates` (Passed)
6. `clears nullable fields when explicitly set to null` (Passed)
7. `never throws unhandled exceptions when logger methods are invoked` (Passed)
8. `safely handles circular or malformed data in logger calls without crashing` (Passed)
9. `publishes profile successfully even if Redis cache operations fail or Redis is offline` (Passed)

---

## 5. Files Modified

| File | Change Description |
|:---|:---|
| `next.config.mjs` | Added `serverExternalPackages: ['pino', 'pino-pretty', 'thread-stream', 'ioredis']`. |
| `src/lib/logger/index.ts` | Implemented crash-proof logger wrapper (`safeLog`), singleton caching on `globalThis`, and stdout Pino logging. |
| `src/lib/redis/index.ts` | Added try-catch error resilience to Redis event listeners and singleton pattern on `globalThis`. |
| `src/lib/api/response.ts` | Enhanced `handleApiError` for `ZodError` to format field-specific error messages. |
| `src/modules/profiles/validation.ts` | Created authoritative Zod validation schema with `.nullish()` support across all profile sections. |
| `src/modules/profiles/index.ts` | Exported validation schema, expanded `UpdateProfileInput` to allow `null`, preserved unsubmitted fields on partial saves, and isolated Redis cache sync. |
| `src/app/api/v1/profiles/[id]/route.ts` | Removed conflicting schema export to satisfy Next.js 15 route module typing, consuming schema from domain module. |
| `src/app/(app)/builder/[id]/page.tsx` | Added full two-way state bindings for Contacts and Socials, section-specific save buttons, Reset Changes action, and live reactive phone preview. |
| `tests/unit/save-draft-and-worker.test.ts` | Authored 9 unit and resilience tests covering schemas, partial saves, Redis failures, and logger crash-proofing. |
| `tests/unit/profiles.test.ts` | Updated status assertion to match case-insensitive canonical enum. |
| `docs/DECISIONS.md` | Recorded ADR 007 detailing runtime crash fix and schema normalization. |
| `docs/PROGRESS.md` | Recorded verified milestone completion. |

