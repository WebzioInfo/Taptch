# Tapzio — Next.js Reliability Analysis & Concurrency Protection Plan

**Document Version:** 1.0.0  
**Author:** Principal Engineer & Technical Architect  
**Date:** October 31, 2026  
**Status:** ACTIVE SPECIFICATION & ARCHITECTURAL MANDATE  

---

## 1. Executive Problem Statement: Why Next.js Apps Fail at Low Concurrency

Next.js is frequently blamed for collapsing at 50–100 concurrent users. In production reality, Next.js does not fail because of the Node.js V8 event loop; it fails because default conventions encourage antipatterns that trigger resource exhaustion cascades.

Below is the definitive technical autopsy of why Next.js applications choke under load, and how Tapzio architecturally prevents each failure condition:

| # | Low-Concurrency Failure Mode | Failure Mechanism | How Tapzio Avoids It in Architecture & Code |
| :-: | :--- | :--- | :--- |
| **1** | **Running `next dev` in Production / Benchmarks** | `next dev` performs just-in-time TypeScript transpilation, sourcemap generation, and file-watching per request. RAM explodes to 1.5GB+ and CPU reaches 100% at ~30 concurrent requests. | **Production-Only Testing**: All performance benchmarks and Docker containers strictly execute optimized production bundles (`next build` + `next start`). |
| **2** | **Unpooled Database Connections** | Every Server Component or Server Action instantiating a raw database client opens a new TCP connection. PostgreSQL hits `max_connections` (default 100), throws `FATAL: remaining connection slots are reserved`, and crashes all web processes. | **PgBouncer in Transaction Mode + postgres.js `prepare: false`**: PgBouncer multiplexes thousands of virtual client transactions over a fixed pool of 20–30 physical PostgreSQL connections. |
| **3** | **Uncached Dynamic Rendering on Public Profiles** | Calling `cookies()`, `headers()`, or `searchParams` in root layouts or server components marks the entire route as dynamically rendered per request (`force-dynamic`). Under 100 concurrent taps, the server executes 100 React SSR renders and 100 DB queries simultaneously. | **Static ISR with Tag Revalidation**: Public profiles (`/p/[slug]`) are pre-rendered HTML snapshots served from cache. Zero database queries execute on page load. Dynamic headers are forbidden by CI linters. |
| **4** | **Unbounded Database Queries in Server Components** | Unindexed `SELECT * FROM leads` or `profiles WHERE slug = ...` performs full sequential table scans, holding database worker locks and spiking p95 query times from 2ms to 4,000ms. | **Mandatory Unique Indexes & Bounded Pagination**: Every hot route query is indexed (`idx_cards_token`, `idx_profiles_slug`). All list endpoints strictly enforce `LIMIT` (maximum 50 items per query). |
| **5** | **Serverless Cold Starts & Connection Multiplying** | Deploying on serverless platforms (e.g., AWS Lambda) spins up 100 isolated function instances during a spike, each initiating its own database handshake and TLS negotiation (150ms–300ms overhead). | **Persistent Container Architecture**: Tapzio runs as long-running Docker containers on Node.js runtime, keeping connections warm and eliminating cold starts entirely. |
| **6** | **Unbounded On-Demand Image Optimization (`_next/image`)** | Hundreds of concurrent visitors requesting unoptimized 5MB profile avatars triggers hundreds of simultaneous libvips/sharp CPU-bound transformations on the web server, starving the Node.js event loop. | **Upload-Time Compression Pipeline**: Avatars and banners are resized and converted to WebP/AVIF statically upon upload via `sharp`. Public profiles serve pre-sized static assets directly from Cloudflare R2 / CDN. |
| **7** | **Synchronous Logging & Database Event Writes** | Writing page views or NFC taps directly to PostgreSQL inside the HTTP request handler blocks the response thread until the disk I/O flush completes. | **Asynchronous Queue Ingestion**: Inbound taps (`/n/*`) push a lightweight message to BullMQ Redis in < 1ms and immediately return HTTP 302. Workers batch writes to PostgreSQL in the background. |

---

## 2. Inviolable Architectural Rules Enforced in Code & CI

To ensure these protections cannot be bypassed by future feature development, the following rules are enforced programmatically:

### Rule 2.1: The Zero-Dynamic Public Route Rule
- In `src/app/(profile)/p/[slug]/page.tsx`:
  - Strictly **FORBIDDEN**: `cookies()` from `next/headers`.
  - Strictly **FORBIDDEN**: `headers()` from `next/headers`.
  - Strictly **FORBIDDEN**: `connection()` from `next/server`.
  - Strictly **FORBIDDEN**: `export const dynamic = 'force-dynamic'`.
- **CI AST Check**: An automated static analysis test in CI scans the AST of `src/app/(profile)` and fails the build if any of these tokens appear.

### Rule 2.2: The Happy-Path Zero-DB Redirect Rule
- In `/n/[token]` and `/q/[token]`:
  - Happy-path resolution reads strictly from **Redis cache** (`HGET card:{token}`).
  - Event recording is dispatched asynchronously to BullMQ (`analyticsQueue.add`).
  - No database reads or writes execute unless a Redis cache miss occurs.

### Rule 2.3: Bounded Query Guarantees
- Every database query returning a list must include an explicit `.limit()` capped at 100 items.
- Full table scans are prohibited; all foreign keys and filter columns (`token`, `slug`, `organization_id`, `status`) must possess explicit database indexes.

---

## 3. High-Concurrency Proof Harness (Milestone 2 Specification)

During Milestone 2, a complete load-testing harness will be deployed using **k6** against a production build container running on this Windows host.

### Test Scenarios
1. **Scenario 1 — Edge Redirect Throughput (`/n/{token}`)**:
   - 500 Virtual Users (VUs) continuously hitting active NFC redirect tokens for 60 seconds.
   - **Target**: p95 < 100ms, Error rate < 0.5%.
2. **Scenario 2 — Public Profile Serving (`/p/{slug}`)**:
   - 500 VUs hitting cached public profile pages for 60 seconds.
   - **Target**: p95 < 300ms, Error rate < 0.5%.
3. **Scenario 3 — Conference Spike Simulation**:
   - 1,000 requests to a single token within a 60-second window.
   - **Target**: Zero connection drops; DB active connections remain < 15.
4. **Scenario 4 — Mixed Traffic (70% Redirects / 30% Profile Reads)**:
   - Sustained multi-user networking simulation.

---

## 4. Formal Decision Gate: Standalone Micro-Engine Fallback

If the production Next.js build fails to achieve the Milestone 2 load targets (`p95 < 100ms` on `/n/*` and `p95 < 300ms` on `/p/*`) after eliminating obvious configuration bottlenecks:

- **The Fallback Plan**:
  Extract the hot redirect paths (`/n/:token`, `/q/:token`) and static profile HTML serving into a 150-line standalone **Hono** or **Fastify** Node.js service running on a separate port or sub-path.
- Both services will share the identical domain logic (`src/modules/*`), database client, and Redis cache.
- The Next.js application will continue serving the dashboard, visual builder, and administrative portals.
- **Requirement**: No framework transition will be executed without presenting empirical, measured k6 benchmark output.

