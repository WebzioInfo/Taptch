# TAPTCH — Architecture Migration Audit
## Next.js Monolith to Decoupled React (Vite) + NestJS Backend

**Audit Execution Date:** 2026-11-12  
**Target Architecture:** Decoupled Monorepo (`frontend/` React 19 + Vite 6 + TypeScript, `backend/` NestJS 11 + TypeScript, `shared/` Types)  
**Database:** PostgreSQL 16 (Supabase hosted + PgBouncer pooler), Drizzle ORM preserved  
**Cache/Workers:** Redis (ioredis), BullMQ persistent workers  
**Compliance Standard:** Mandatory All-Skills Policy (44 skills evaluated)

---

## 1. Executive Summary

TAPTCH is currently structured as a Next.js 16.4.5 full-stack application leveraging the App Router. The codebase encompasses both presentation (React 19 Server/Client Components, Tailwind CSS, Radix UI primitives, Lucide icons, Obsidian Luxury design system) and backend APIs (Next.js Route Handlers in `src/app/api/`, Drizzle ORM, Better Auth session cookies, and Redis cache-aside redirect engine).

The goal of this migration is to decouple the system into:
1. **Frontend (`frontend/`)**: React 19 + Vite + TypeScript + Tailwind CSS + React Router v7 + TanStack Query v5 + Lucide React + Radix UI.
2. **Backend (`backend/`)**: NestJS 11 + TypeScript + Drizzle ORM + PostgreSQL 16 + Redis + Better Auth / JWT Session Guard + Swagger / OpenAPI.
3. **Shared Contracts (`shared/`)**: Domain interfaces, DTO schemas, brand configuration tokens, and shared constants.

The production database (38 tables on Supabase), Redis redirect caching, and all business rules are 100% preserved.

---

## 2. Technical Stack Audit

| Dimension | Current Architecture | Target Architecture |
|---|---|---|
| **Frontend Framework** | Next.js 16.4.5 (App Router, Turbopack) | React 19.2.x + Vite 6.x |
| **Routing** | File-system App Router (`src/app/`) | React Router v7 (data routers, loaders) |
| **Styling & Design System** | Tailwind CSS 3.4.17 + Obsidian Luxury | Tailwind CSS 3.4.x / 4.x + Obsidian Luxury |
| **Component Primitives** | Radix UI (`@radix-ui/react-*`) | Radix UI (preserved 1:1) |
| **Icons** | `lucide-react` 0.475.0 | `lucide-react` 0.475.0 |
| **Server State Management** | Next.js Server Components + fetch | TanStack Query v5 (`@tanstack/react-query`) |
| **Form Handling** | React Hook Form + Zod | React Hook Form + Zod (preserved) |
| **Backend Framework** | Next.js Route Handlers (`src/app/api/`) | NestJS 11.x (Modular Architecture) |
| **HTTP Transport** | Node.js HTTP (Next.js runtime) | Express / Fastify HTTP engine |
| **Database & ORM** | Drizzle ORM 0.45.4 (`postgres` 3.4.9) | Drizzle ORM 0.45.4 (Preserved 1:1) |
| **Database Engine** | PostgreSQL 16 (Supabase hosted) | PostgreSQL 16 (Supabase hosted) |
| **Connection Pooling** | PgBouncer (`prepare: false`) | PgBouncer (`prepare: false`) |
| **Authentication** | Better Auth 1.7.14 (session cookies) | Better Auth / NestJS Session Auth Guard |
| **Caching Engine** | Redis (`ioredis` 6.0.0) | Redis (`ioredis` 6.0.0, NestJS CacheModule) |
| **Job Queues** | BullMQ (`bullmq` 5.x) | BullMQ (`@nestjs/bullmq` / BullMQ 5.x) |
| **File Storage** | Cloudflare R2 / Images / Local Mock | Cloudflare R2 / Images / S3-compatible service |
| **Email & SMS** | Nodemailer / Console / Fast2SMS | NestJS Mailer / Nodemailer / SMS Provider |
| **Logging** | Pino 9.6.0 | Pino via `nestjs-pino` |
| **Testing Engine** | Vitest 4.1.12 + Playwright 1.58.2 | Vitest / Jest + Playwright (preserved) |

---

## 3. Structural Comparison

### Current Structure
```text
taptch/
├── src/
│   ├── app/                 # Next.js App Router (Pages & API routes mixed)
│   │   ├── (admin)/
│   │   ├── (app)/
│   │   ├── (auth)/
│   │   ├── (marketing)/
│   │   ├── (profile)/
│   │   └── api/             # 42 API Route Handlers
│   ├── components/          # React components
│   ├── config/              # Brand & environment config
│   ├── db/                  # Drizzle ORM schema & migrations
│   ├── lib/                 # Auth, Redis, Logger, Storage, Email
│   └── modules/             # Domain business logic services
├── tests/                   # 24 test suites (unit, integration, architecture)
├── public/                  # Static assets
└── package.json             # Monolithic dependencies
```

### Target Structure
```text
taptch/
├── frontend/                # React 19 + Vite + Tailwind CSS
│   ├── index.html
│   ├── vite.config.ts
│   ├── package.json
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/      # UI, templates, preview studio
│       ├── layouts/         # MarketingLayout, AppLayout, AdminLayout
│       ├── pages/           # 36 migrated pages
│       ├── hooks/           # Auth, queries, mutations
│       ├── services/        # Axios/Fetch API client
│       └── routes/          # React Router v7 definition
│
├── backend/                 # NestJS 11 Modular Architecture
│   ├── nest-cli.json
│   ├── tsconfig.json
│   ├── package.json
│   ├── test/
│   └── src/
│       ├── config/          # Configuration service & validation
│       ├── database/        # Drizzle module & PgBouncer client
│       ├── common/          # Guards, interceptors, filters, decorators
│       ├── modules/         # Auth, Profiles, QR, Cards, Leads, Orders, Orgs
│       ├── jobs/            # Queue processors (BullMQ)
│       ├── app.module.ts
│       └── main.ts          # Bootstrap, Swagger, CORS, Helmet
│
├── shared/                  # Shared Domain Types & Contracts
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── types/
│       ├── schemas/
│       └── brand.ts
│
├── docs/                    # Architectural documents
└── package.json             # Root NPM Workspace Orchestrator
```

---

## 4. Key Forensic Observations

1. **Clean Domain Separation in Current Code**: `src/modules/` already contains clean business domain logic (`profiles`, `qr`, `cards`, `leads`, `orders`, `orgs`, `templates`, `entitlements`). These functions cleanly port into NestJS domain services with dependency injection.
2. **Zero Direct DB in Route Pages**: Enforced by architecture test `tests/architecture/no-direct-db-in-pages.test.ts`. This ensures frontend pages are not coupled to database access.
3. **Brand From Config**: Enforced by `src/config/brand.ts` and architecture test `tests/architecture/brand-literal.test.ts`. All customer-facing brand copy is already centralized.
4. **Public Profile Hot Path**: `/p/[slug]` requires sub-100ms response times. In the decoupled architecture, the NestJS profile controller serves pre-compiled JSON snapshots from Redis cache, while the React frontend renders them with full fidelity.
5. **Session-Cookie Auth**: Better Auth manages cookies with HTTP-only tokens. In the decoupled architecture, CORS credentials (`credentials: true`) and cookie forwarding allow the frontend and NestJS backend to share session validation seamlessly.
