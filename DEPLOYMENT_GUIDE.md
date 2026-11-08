# TAPTCH — Production Deployment & DevOps Runbook

## 1. Production Architecture Overview
TAPTCH is deployed as containerized services orchestrated via Docker Compose, Coolify, Dokploy, or Kubernetes on VPS infrastructure.

### Services Topology
1. **Web Container:** Next.js 15 App Router production standalone server.
2. **Worker Container:** Node.js BullMQ background processor for async draft saves, PDF invoice rendering, and email dispatch.
3. **Database Cluster:** PostgreSQL 16 with PgBouncer connection pooler in transaction mode.
4. **Cache & Queue:** Redis 7.2 with persistent AOF/RDB volume.
5. **Object Storage:** AWS S3 / Cloudinary / MinIO S3-compatible bucket.

---

## 2. Environment Configuration

Ensure the following production environment variables are configured:

```ini
# Core Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://taptch.com
PORT=3000

# PostgreSQL 16 (PgBouncer Pooled)
DATABASE_URL=postgres://taptch_user:SECRET_PASSWORD@pgbouncer:6432/taptch?sslmode=disable
DIRECT_DATABASE_URL=postgres://taptch_user:SECRET_PASSWORD@postgres:5432/taptch?sslmode=disable

# Redis 7.2
REDIS_URL=redis://:REDIS_SECRET_PASSWORD@redis:6379/0

# Authentication & Session
BETTER_AUTH_SECRET=LONG_RANDOM_HEX_SECRET_STRING_MIN_32_BYTES
BETTER_AUTH_URL=https://taptch.com

# Cloudinary / S3 Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Campaign Configuration (Optional overrides)
NEXT_PUBLIC_CAMPAIGN_BRAND_NAME="Smart NFC Profile Card"
CAMPAIGN_SUPPORT_WHATSAPP="+919876543210"
```

---

## 3. Production Deployment Commands

```bash
# 1. Build and migrate database
npm install --omit=dev
npm run db:migrate

# 2. Build Next.js application
npm run build

# 3. Start web process
npm start

# 4. Start async background worker (in separate process/container)
npm run worker
```

---

## 4. Health Checks & Monitoring
- **Liveness Probe:** `GET /api/health` — returns HTTP 200 `{ status: "ok" }`.
- **Readiness Probe:** `GET /api/ready` — verifies database and Redis connectivity.

