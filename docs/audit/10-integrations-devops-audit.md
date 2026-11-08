# Taptch 360° Master Project Audit — 10: Integrations & DevOps Audit

**Focus:** Containerization, Decoupled BullMQ Worker, Cloudinary Media Pipelines, Email Delivery, CI/CD  
**Auditor:** DevOps & Infrastructure Engineer  
**Deployment Target:** Linux VPS (Docker Compose / Dokploy / Coolify) with Persistent Containers  

---

## 1. Containerization & Production Topologies

Taptch is configured for deterministic container deployment via Docker and Docker Compose:

```
┌────────────────────────────────────────────────────────┐
│                   Reverse Proxy / Nginx                │
│                 (SSL / Port 443 -> 3000)               │
└───────────┬────────────────────────────────┬───────────┘
            │                                │
┌───────────▼────────────┐       ┌───────────▼───────────┐
│  Taptch-web (Next.js) │       │  Taptch-worker       │
│  Port 3000 (Stateless) │       │  (BullMQ Processor)   │
└───────────┬────────────┘       └───────────┬───────────┘
            │                                │
            ├────────────────────────────────┤
            │                                │
┌───────────▼────────────┐       ┌───────────▼───────────┐
│     PostgreSQL 16      │       │        Redis 7        │
│   (PgBouncer Pooler)   │       │   (Cache & Queue)     │
└────────────────────────┘       └───────────────────────┘
```

### Key Architectural Discipline:
- **Decoupled Worker Container**: High-load background tasks (profile snapshot compilation, bulk QR vector PDF rendering, analytics batching) run in `Taptch-worker`, completely isolated from user-facing Next.js web processes.
- **Next.js Web Route Safety**: Web requests merely execute `queue.add()` (<5ms) and return immediately. The web server never blocks on image transformations or PDF compilation.

---

## 2. External Service Integrations

1. **Media & Image Storage (Cloudinary)**:
   - Configured in `src/lib/media/cloudinary.ts`.
   - Supports avatar and cover photo uploads with WebP/AVIF optimization.
   - Includes graceful test fallback (`[MOCK]`) when API keys are not supplied in CI or local developer machines.
2. **Transactional Email (Resend / SMTP / Console)**:
   - Configured in `src/lib/email/index.ts`.
   - Supports corporate SMTP (AWS SES, SendGrid, Postmark) with console fallback for local verification and automated testing.
3. **Authentication (Better Auth)**:
   - Drizzle PostgreSQL adapter with two-factor authentication, email OTP, and phone SMS hooks.

---

## 3. DevOps Audit Score

- **Score: 8.9 / 10**
- **Assessment**: Robust, clean infrastructure configuration supporting zero-downtime containerized releases.

