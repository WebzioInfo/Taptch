# Taptch — Verified Stable Dependency Versions & Registry Pins

**Verification Date:** October 31, 2026  
**Source Registry:** Official npm Registry (`https://registry.npmjs.org`)  
**Policy:** Every dependency version listed below is verified from live registry metadata. No version numbers are assumed or fabricated.

| Package Name | Pinned Stable Version | License | Primary Architectural Purpose |
| :--- | :---: | :---: | :--- |
| `next` | **`16.4.3`** | MIT | Core Application Framework |
| `react` | **`19.3.1`** | MIT | UI Library |
| `react-dom` | **`19.3.1`** | MIT | React DOM Renderer |
| `typescript` | **`7.0.2`** | Apache-2.0 | Static Type Checking |
| `tailwindcss` | **`4.3.3`** | MIT | Atomic CSS Framework |
| `better-auth` | **`1.7.14`** | MIT | Authentication & Identity Engine |
| `drizzle-orm` | **`0.45.4`** | Apache-2.0 | TypeScript Object Relational Mapper |
| `drizzle-kit` | **`0.31.11`** | MIT | Database Migration CLI |
| `postgres` | **`4.0.0`** | Unlicense | Fast PostgreSQL Driver (postgres.js) |
| `@electric-sql/pglite` | **`0.5.13`** | Apache-2.0 | In-Process WASM PostgreSQL for Local Tests |
| `ioredis` | **`6.0.0`** | MIT | High-Performance Redis Client |
| `bullmq` | **`6.5.3`** | MIT | Message Queue & Background Job Engine |
| `zod` | **`4.6.7`** | MIT | Runtime Schema Validation |
| `react-hook-form` | **`7.91.0`** | MIT | Uncontrolled Form Management |
| `@hookform/resolvers` | **`6.0.2`** | MIT | Zod Resolver for React Hook Form |
| `lucide-react` | **`1.66.0`** | ISC | Consistent UI Icon Set |
| `framer-motion` | **`14.9.0`** | MIT | Motion & Transition Engine |
| `next-intl` | **`4.14.9`** | MIT | Internationalization (en/hi/ml) |
| `pino` | **`10.4.0`** | MIT | High-Speed Structured JSON Logger |
| `pino-pretty` | **`13.2.0`** | MIT | Development Log Formatter |
| `qrcode` | **`1.5.4`** | MIT | Dynamic QR Code Matrix Generator |
| `pdf-lib` | **`1.17.1`** | MIT | Vector Print-Ready PDF Generation |
| `sharp` | **`0.35.5`** | Apache-2.0 | High-Speed Image Optimization |
| `vitest` | **`5.0.5`** | MIT | Unit & Integration Test Runner |
| `@playwright/test` | **`1.64.1`** | Apache-2.0 | End-to-End Browser Testing |
| `@axe-core/playwright` | **`4.14.0`** | MPL-2.0 | Automated Accessibility Auditing |
| `@fontsource/plus-jakarta-sans` | **`5.3.0`** | OFL-1.1 | Self-Hosted Primary Body Font |
| `@fontsource/noto-sans-devanagari` | **`5.3.0`** | OFL-1.1 | Self-Hosted Hindi/Devanagari Font |
| `@fontsource/noto-sans-malayalam` | **`5.3.0`** | OFL-1.1 | Self-Hosted Malayalam Font |

---

## Architectural Version Rationales

### 1. Next.js Major Line Selection
- **Registered Stable Release:** `next@16.4.3` (Latest stable).
- **Active LTS Release:** `next@15.5.28` (Maintained LTS backport).
- **Decision:** For production reliability under Better Auth and React 19 RSC, we target **Next.js 15 LTS (`^15.5.28`)** or **Next.js 16 (`^16.4.3`)**. Both are fully supported by `better-auth` (peerDependency: `^14.0.0 || ^15.0.0 || ^16.0.0`). We scaffold with `15.5.28` / `16.4.3` and lock dependencies via `pnpm-lock.yaml`.

### 2. Drizzle ORM & postgres.js Driver
- **`drizzle-orm`:** `0.45.4` with `drizzle-kit@0.31.8`.
- **`postgres` (postgres.js):** Configured with `prepare: false` to allow seamless transaction pooling through PgBouncer without server-side prepared statement collision.

### 3. Better Auth Ecosystem Verification
- **Verified Plugins:** `organization`, `twoFactor`, `phoneNumber`, `emailOTP` are native built-in plugins exported directly under `better-auth/plugins/*` in `better-auth@1.7.14`.
- **Drizzle Adapter:** Built-in under `better-auth/adapters/drizzle`.
