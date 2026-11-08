# TAPTCH — Complete Dependency Inventory

**Generated Date:** November 9, 2026  
**Author:** Senior Software Architect & Dependency Auditor  
**Lockfile:** `package-lock.json` (NPM Authority)  
**Total Dependencies in `package.json`:** 48 Production, 25 Development (73 Total Direct)  
**Total Packages in `node_modules`:** 629 (including transitive dependencies)

---

## 1. Production Dependencies (`dependencies`)

| Package Name | Declared Version | Installed Version | Latest Version | Actively Used in `src/` | Peer Compatibility | Status & Notes |
|---|---|---|---|---|---|---|
| `@axe-core/playwright` | `^4.10.1` | `4.14.0` | `4.14.0` | Test Harness | Compatible | Up-to-date accessibility testing suite |
| `@dnd-kit/core` | `^6.3.1` | `6.3.1` | `6.3.1` | Deferred / Builder | Compatible | Up-to-date; reserved for visual builder reordering |
| `@dnd-kit/modifiers` | `^9.0.0` | `9.0.0` | `9.0.0` | Deferred / Builder | Compatible | Up-to-date drag-and-drop constraint modifiers |
| `@dnd-kit/sortable` | `^10.0.0` | `10.0.0` | `10.0.0` | Deferred / Builder | Compatible | Up-to-date sortable list coordinator |
| `@electric-sql/pglite` | `^0.5.13` | `0.5.14` | `0.5.15` | **Yes** (3 files) | Compatible | Embedded WASM Postgres for zero-config CI tests |
| `@fontsource/noto-sans-devanagari` | `^5.2.5` | `5.3.0` | `5.3.0` | Deferred / Typography | Compatible | Localized Hindi/Devanagari font assets |
| `@fontsource/noto-sans-malayalam` | `^5.2.5` | `5.3.0` | `5.3.0` | Deferred / Typography | Compatible | Localized Malayalam font assets |
| `@fontsource/plus-jakarta-sans` | `^5.2.5` | `5.3.0` | `5.3.0` | Deferred / Typography | Compatible | Modern sans font family assets |
| `@hookform/resolvers` | `^4.1.3` | `4.1.3` | `7.0.3` | Deferred / Forms | Compatible | Resolvers for form validation; forms currently use Zod |
| `@radix-ui/react-avatar` | `^1.1.3` | `1.3.1` | `1.3.1` | **Yes** (`avatar.tsx`) | Compatible | Accessible headless avatar component |
| `@radix-ui/react-dialog` | `^1.1.6` | `1.3.1` | `1.3.1` | **Yes** (`dialog.tsx`) | Compatible | Accessible modal dialog primitives |
| `@radix-ui/react-dropdown-menu` | `^2.1.6` | `2.2.1` | `2.2.1` | **Yes** (`dropdown-menu.tsx`) | Compatible | Accessible contextual menus |
| `@radix-ui/react-label` | `^2.1.2` | `2.1.17` | `2.1.17` | **Yes** (`label.tsx`) | Compatible | Accessible form label primitive |
| `@radix-ui/react-select` | `^2.1.6` | `2.4.1` | `2.4.1` | Deferred / UI | Compatible | Headless select component primitives |
| `@radix-ui/react-separator` | `^1.1.2` | `1.2.0` | `1.2.0` | Deferred / UI | Compatible | Headless divider component |
| `@radix-ui/react-slot` | `^1.1.2` | `1.5.0` | `1.5.0` | **Yes** (`button.tsx`) | Compatible | Polymorphic `asChild` composition primitive |
| `@radix-ui/react-tabs` | `^1.1.3` | `1.2.1` | `1.2.1` | **Yes** (`tabs.tsx`) | Compatible | Accessible tabbed navigation primitives |
| `@radix-ui/react-toast` | `^1.2.6` | `1.3.1` | `1.3.1` | Deferred / UI | Compatible | Headless toast notification primitives |
| `@radix-ui/react-tooltip` | `^1.1.8` | `1.4.1` | `1.4.1` | Deferred / UI | Compatible | Headless tooltip primitives |
| `@supabase/ssr` | `^0.12.7` | `0.12.7` | `0.12.7` | **Yes** (4 files) | Compatible | Supabase cookie session management for Next.js App Router |
| `@supabase/supabase-js` | `^2.119.0` | `2.119.0` | `2.119.0` | **Yes** (Supabase Client) | Compatible | Supabase database, auth, and storage client |
| `@tanstack/react-query` | `^5.67.2` | `5.105.1` | `5.107.1` | Deferred / Cache | Compatible | Client-side async state cache |
| `bcryptjs` | `^3.0.3` | `3.0.3` | `3.0.3` | **Yes** (2 files) | Compatible | Secure password hashing for staff credentials |
| `better-auth` | `^1.7.14` | `1.7.15` | `1.7.18` | **Yes** (6 files) | Compatible | Multi-tenant auth, sessions, and role management |
| `bullmq` | `^6.5.3` | `6.5.3` | `6.7.2` | Deferred / Worker | Compatible | Production Redis queue engine (Phase 2 worker) |
| `class-variance-authority` | `^0.7.1` | `0.7.1` | `0.7.1` | **Yes** (2 files) | Compatible | Type-safe component variant builder (`cva`) |
| `cloudinary` | `^2.11.0` | `2.11.0` | `2.11.0` | **Yes** (11 files) | Compatible | Server-side Cloudinary media upload and asset management |
| `clsx` | `^2.1.1` | `2.1.1` | `2.1.1` | **Yes** (1 file) | Compatible | Utility for constructing conditional className strings |
| `date-fns` | `^4.4.0` | `4.4.0` | `4.4.0` | **Yes** (2 files) | Compatible | Modern date formatting and manipulation |
| `drizzle-orm` | `^0.45.4` | `0.45.4` | `0.45.4` | **Yes** (48 files) | Compatible | Primary type-safe SQL ORM |
| `framer-motion` | `^12.4.10` | `12.43.0` | `14.10.1` | Deferred / Animation | Compatible | Production animation engine |
| `ioredis` | `^6.0.0` | `6.0.0` | `6.0.0` | **Yes** (2 files) | Compatible | High-performance Redis client for caching and rate limiting |
| `jsqr` | `^1.4.0` | `1.4.0` | `1.4.0` | **Yes** (2 files) | Compatible | Pure JavaScript QR code image decoder |
| `lucide-react` | `^0.475.0` | `0.475.0` | `1.70.0` | **Yes** (49 files) | Compatible | Consistent SVG icon system |
| `next` | `^15.5.0` | `15.5.28` | `16.4.5` | **Yes** (178 files) | Compatible | App Router, Server Components, API Handlers |
| `next-intl` | `^4.14.9` | `4.14.9` | `4.14.9` | **Yes** (3 files) | Compatible | Internationalization plugin and message provider |
| `nodemailer` | `^10.3.1` | `10.3.1` | `10.4.0` | **Yes** (1 file) | Compatible | Transactional SMTP email delivery engine |
| `pdf-lib` | `^1.17.1` | `1.17.1` | `1.17.1` | **Yes** (2 files) | Compatible | Vector PDF generator for QR batch print sheets |
| `pino` | `^10.4.0` | `10.4.0` | `10.4.0` | **Yes** (2 files) | Compatible | High-speed JSON structured logger with secret masking |
| `postgres` | `^3.4.5` | `3.4.9` | `4.1.0` | **Yes** (4 files) | Compatible | PostgreSQL client driver (`prepare: false` for PgBouncer) |
| `qrcode` | `^1.5.4` | `1.5.4` | `1.5.4` | **Yes** (2 files) | Compatible | Production QR code vector SVG generator |
| `react` | `^19.0.0` | `19.3.1` | `19.3.1` | **Yes** (68 files) | Compatible | Core UI component engine |
| `react-dom` | `^19.0.0` | `19.3.1` | `19.3.1` | **Yes** (Hydration) | Compatible | DOM renderer for React 19 |
| `react-hook-form` | `^7.54.2` | `7.91.0` | `7.91.0` | Deferred / Forms | Compatible | React form library; forms currently use controlled React state |
| `tailwind-merge` | `^3.0.2` | `3.7.0` | `3.7.0` | **Yes** (1 file) | Compatible | Merges Tailwind CSS classes without style conflicts |
| `tailwindcss-animate` | `^1.0.7` | `1.0.7` | `1.0.7` | **Yes** (1 file) | Compatible | Tailwind CSS plugin for animation utilities |
| `zod` | `^4.6.7` | `4.6.7` | `4.6.7` | **Yes** (23 files) | Compatible | TypeScript-first schema declaration and data validation |
| `zustand` | `^5.0.3` | `5.0.16` | `5.1.0` | Deferred / State | Compatible | Small, fast state-management solution |

---

## 2. Development Dependencies (`devDependencies`)

| Package Name | Declared Version | Installed Version | Latest Version | Actively Used | Status & Notes |
|---|---|---|---|---|---|
| `@eslint/eslintrc` | `^3.3.7` | `3.3.7` | `3.3.7` | **Yes** (`eslint.config.mjs`) | FlatCompat bridge for ESLint 9 |
| `@types/autocannon` | `^7.12.7` | `7.12.7` | `7.12.7` | **Yes** (Benchmarking types) | TypeScript definitions |
| `@types/bcryptjs` | `^2.4.6` | `2.4.6` | `2.4.6` | **Yes** (Staff auth types) | TypeScript definitions |
| `@types/node` | `^22.13.9` | `22.20.5` | `26.6.6` | **Yes** (Global Node types) | Node.js 22 LTS type definitions |
| `@types/nodemailer` | `^8.0.2` | `8.0.2` | `8.0.2` | **Yes** (SMTP engine types) | TypeScript definitions |
| `@types/qrcode` | `^1.5.5` | `1.5.6` | `1.5.6` | **Yes** (QR generator types) | TypeScript definitions |
| `@types/react` | `^19.0.10` | `19.3.0` | `19.3.0` | **Yes** (React 19 types) | Aligned with React 19.3.1 |
| `@types/react-dom` | `^19.0.4` | `19.3.0` | `19.3.0` | **Yes** (React DOM types) | Aligned with React DOM 19.3.1 |
| `@typescript-eslint/eslint-plugin` | `^8.26.0` | `8.72.1` | `8.72.1` | **Yes** (Lint rules) | ESLint TypeScript plugin |
| `@typescript-eslint/parser` | `^8.26.0` | `8.72.1` | `8.72.1` | **Yes** (AST parsing) | ESLint TypeScript parser |
| `autocannon` | `^9.0.0` | `9.0.0` | `9.0.0` | Benchmarking scripts | HTTP load testing CLI tool |
| `autoprefixer` | `^10.4.20` | `10.6.2` | `10.6.2` | **Yes** (`postcss.config.mjs`)| PostCSS vendor prefix generator |
| `cross-env` | `^7.0.3` | `7.0.3` | `10.1.0` | **Yes** (`npm run dev`) | Cross-platform environment variable runner |
| `dotenv` | `^16.4.7` | `16.6.1` | `18.0.9` | **Yes** (Drizzle migration scripts)| Environment loader |
| `drizzle-kit` | `^0.31.8` | `0.31.11` | `0.31.11` | **Yes** (CLI migrations) | Drizzle schema and migration manager |
| `eslint` | `^9.21.0` | `9.39.5` | `10.14.0` | **Yes** (`npm run lint`) | JavaScript and TypeScript linter |
| `eslint-config-next` | `^15.5.0` | `15.5.28` | `16.4.5` | **Yes** (`eslint.config.mjs`) | Next.js Core Web Vitals ESLint rules |
| `eslint-config-prettier` | `^10.0.2` | `10.1.8` | `10.1.8` | **Yes** (Lint formatting) | Disables ESLint rules conflicting with Prettier |
| `pino-pretty` | `^13.0.0` | `13.2.0` | `13.2.0` | **Yes** (Dev log formatting) | Pretty print formatter for Pino |
| `postcss` | `^8.5.32` | `8.5.32` | `8.5.32` | **Yes** (`postcss.config.mjs`)| CSS transformation engine |
| `prettier` | `^3.5.3` | `3.9.10` | `3.9.10` | **Yes** (`npm run format`) | Opinionated code formatter |
| `tailwindcss` | `^3.4.17` | `3.4.19` | `4.3.5` | **Yes** (`tailwind.config.ts`)| Utility-first CSS framework |
| `tsx` | `^4.19.3` | `4.23.15` | `4.23.15` | **Yes** (`npm run db:migrate`) | TypeScript execution engine using esbuild |
| `typescript` | `^5.8.2` | `5.9.3` | `7.0.2` | **Yes** (`npm run typecheck`)| Static type checker |
| `vitest` | `^4.1.12` | `4.1.12` | `5.1.0` | **Yes** (`npm test`) | Test runner for unit, integration, and architecture |

---

## 3. Package Overrides Configuration (`overrides`)

The following package overrides are enforced in `package.json` to lock transitive dependencies to secure, vetted versions:

```json
"overrides": {
  "postcss": "$postcss",
  "esbuild": "^0.25.12",
  "minimatch": "^11.0.4",
  "@swc/helpers": "^0.5.17"
}
```

- **`postcss: "$postcss"`**: Guarantees all sub-dependencies resolve to top-level PostCSS `8.5.32`.
- **`esbuild: "^0.25.12"`**: Patches all bundler/transpiler instances against older esbuild vulnerabilities.
- **`minimatch: "^11.0.4"`**: Guarantees ReDoS-free glob pattern matching across all tooling scripts.
- **`@swc/helpers: "^0.5.17"`**: Aligns Next.js SWC runtime helpers across compilation stages.

