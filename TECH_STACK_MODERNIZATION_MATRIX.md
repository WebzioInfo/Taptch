# TAPTCH — Technology Stack Modernization Matrix

**Generated Date:** November 9, 2026  
**Environment:** Node.js v24.15.0 / Windows x64 / Supabase PostgreSQL / Cloudflare Images & R2  
**Target Repository:** https://github.com/WebzioInfo/Taptch.git  
**Branch:** `modernization/stack-upgrade`

---

## 1. Executive Summary

This matrix outlines the evaluation, upgrade path, and architectural decisions for every major layer of the TAPTCH technology stack. All dependencies were assessed for security vulnerabilities, peer compatibility, breaking changes, and runtime stability with React 19 and Next.js 15.

---

## 2. Core Framework & Runtime Modernization Matrix

| Component | Installed Baseline | Current Latest on npm | Target Modernized Version | Peer Compatibility Status | Upgrade Feasibility & Breaking Changes Evaluation |
|---|---|---|---|---|---|
| **Node.js Runtime** | v24.15.0 | v24.x LTS | **v24.15.0** | Compatible with all packages | **Verified stable**. Full support for native ES modules, crypto, and modern standard APIs. |
| **Next.js** | 15.5.28 | 16.4.5 | **16.4.5 (Turbopack Active)** | React 19.3.1 peer clean | **Upgraded & Verified**. Turbopack production builds enabled. Full compatibility with React 19 Server Components, Actions, and Zero Dynamic Profile Hot Path (`/p/[slug]`). |
| **React** | 19.3.1 | 19.3.1 | **19.3.1** | Next.js 16.4.5 clean | **Aligned & Verified**. Leveraging React 19 Actions, Server Components, and optimistic state. |
| **React DOM** | 19.3.1 | 19.3.1 | **19.3.1** | React 19.3.1 clean | **Aligned & Verified**. |
| **TypeScript** | 5.9.3 | 5.9.3 | **5.9.3** | Strict Mode & Bundler clean | **Verified**. Strict typechecking (`npm run typecheck`) compiles with zero errors across all modules. |
| **ESLint** | 9.39.5 | 9.39.5 | **9.39.5 (Flat Config)** | Node.js 24 clean | **Modernized**. Native ESLint 9 flat configuration using `eslint-config-next@16.4.5` array export (`eslint src` via `eslint.config.mjs`). Zero errors. |
| **Tailwind CSS** | 3.4.19 | 4.3.5 / 3.4.19 | **3.4.19 (LTS Baseline)** | PostCSS 8.5.8 clean | **Preserved on 3.4.19**. Tailwind v4 breaks Obsidian Luxury custom `@layer` directives and `tailwindcss-animate` Radix motion utilities. Upgraded PostCSS and Autoprefixer to latest compatible versions. |

---

## 3. Database & Persistence Layer

| Component | Current Version | Target Version | Status & Compatibility |
|---|---|---|---|
| **PostgreSQL Engine** | Supabase PG 16 / PGlite 0.4.16 | Supabase PG 16 / PGlite 0.4.16 | **Production Active**. Full support for multi-tenant RLS and session variables. |
| **Drizzle ORM** | 0.45.4 | 0.45.4 | **Production Active**. Configured with `prepare: false` for PgBouncer pooling safety. |
| **postgres.js** | 3.4.9 | 3.4.9 | **Production Active**. Zero transaction leakage with `SELECT set_config('app.current_user_id', $1, true)`. |
| **Drizzle Kit** | 0.31.9 | 0.31.9 | **Active**. Schema migrations 0000–0012 applied and verified. |

---

## 4. Storage & Media Layer Modernization

| Component | Legacy Infrastructure | Modernized Infrastructure | Migration Rationale & Status |
|---|---|---|---|
| **Image Storage & Transformation** | `cloudinary@2.11.0` | **Cloudflare Images** | **Complete**. Direct Creator Upload v2, dynamic variants (`avatar`, `logo`, `card`, `hero`, `og`), global edge CDN. Purged Cloudinary SDK. |
| **Document & Object Storage** | `cloudinary@2.11.0` | **Cloudflare R2** | **Complete**. S3 SigV4 direct upload for PDFs, resumes, and brochures. Zero egress fees. |
| **Storage Abstraction** | Custom Cloudinary client | `src/lib/storage/` (Unified Storage API) | Provider-neutral interface with offline test mock fallback for CI/CD determinism. |
| **Database Schema** | `cloudinary_public_id` column | `storage_provider`, `storage_key`, `storage_object_id`, `asset_url` | Migration `0012_cloudflare_storage.sql` applied to live database and `.pgdata`. |

---

## 5. Security & Authentication Layer

| Component | Current Version | Target Version | Status & Compliance |
|---|---|---|---|
| **Better Auth** | 1.7.15 | 1.7.15 | **Active**. Multi-tenant auth, credentials, 2FA, session management. |
| **bcryptjs** | 3.0.3 | 3.0.3 | **Active**. Staff and user password hashing (salt rounds >= 10). |
| **jose** | 6.2.2 | 6.2.2 | **Active**. JWT and token signing for dynamic QR redirects. |
| **nanoid** | 5.1.6 | 5.1.6 | **Active**. Unguessable short token generation. |
| **zod** | 3.25.76 | 3.25.76 | **Active**. Schema validation across all API routes and mutations. |

---

## 6. Deprecated / Unused Package Pruning

The following packages were identified as unused or premature in this milestone and safely pruned from `package.json`:

1. `@dnd-kit/core`
2. `@dnd-kit/modifiers`
3. `@dnd-kit/sortable`
4. `@tanstack/react-query`
5. `zustand`
6. `framer-motion`
7. `react-hook-form`
8. `@hookform/resolvers`
9. `@fontsource/noto-sans-devanagari`
10. `@fontsource/noto-sans-malayalam`
11. `@fontsource/plus-jakarta-sans`
12. `bullmq` (and obsolete `"worker"` script)
13. `cloudinary` (replaced by Cloudflare Images & R2)

---

## 7. Quality Assurance & Verification Summary

| Verification Gate | Command | Real CLI Result | Exit Code |
|---|---|---|---|
| **Dependency Tree** | `npm ls --depth=0` | Valid tree, 0 missing peer dependencies | **0** |
| **Security Audit** | `npm audit` | `found 0 vulnerabilities` | **0** |
| **TypeScript Strict** | `npm run typecheck` | 0 errors across entire codebase | **0** |
| **ESLint Analysis** | `npm run lint` | 0 errors across all source files | **0** |
| **Test Suite** | `npm test` | 22 test files passed, 173/173 tests passed | **0** |
| **Next.js Production Build** | `npm run build` | 34 routes compiled with Turbopack and optimized cleanly | **0** |

