# TAPTCH — Production Deployment Guide
## Decoupled React Frontend + NestJS Backend Deployment

---

## 1. Architecture Overview

```text
[ Internet / Browser ]
         │
         ├───► HTTPS: taptch.com ────────► [ Frontend Container / CDN (Nginx / Vite dist) ]
         │
         └───► HTTPS: api.taptch.com ────► [ NestJS Backend Engine (Port 4000) ]
                                                    │
                                                    ├───► PostgreSQL 16 (Supabase)
                                                    └───► Redis 6 (Cache & Redirects)
```

---

## 2. Environment Variables Specification

### Backend Environment (`backend/.env` or Docker env)

```bash
# Node & Runtime
NODE_ENV=production
PORT=4000
BACKEND_PORT=4000

# CORS Whitelist (comma-separated)
ALLOWED_ORIGINS=https://taptch.com,https://taptch.webziotech.in,http://localhost:5173

# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:***@db.nvrcgauxafpxsaufjtha.supabase.co:5432/postgres?sslmode=require
DATABASE_URL_DIRECT=postgresql://postgres:***@db.nvrcgauxafpxsaufjtha.supabase.co:5432/postgres?sslmode=require

# Caching & Redirect Engine
REDIS_URL=redis://localhost:6379

# Privacy & Security
VISITOR_SALT_SECRET=taptch-visitor-salt-production-entropy-rotating-salt-2026
```

### Frontend Environment (`frontend/.env` or Docker env)

```bash
# Backend API Base URL (empty for same-origin reverse proxy)
VITE_API_URL=https://api.taptch.com
```

---

## 3. Docker Deployment Instructions

### Option A: Build and Run Backend via Docker

```bash
# Build NestJS Backend Image
docker build -f backend/Dockerfile -t taptch-backend:latest .

# Run Backend Container
docker run -d \
  --name taptch-backend \
  -p 4000:4000 \
  --env-file .env.local \
  --restart unless-stopped \
  taptch-backend:latest
```

### Option B: Build and Run Frontend via Docker

```bash
# Build React Vite Frontend Image
docker build -f frontend/Dockerfile -t taptch-frontend:latest .

# Run Frontend Container
docker run -d \
  --name taptch-frontend \
  -p 80:80 \
  --restart unless-stopped \
  taptch-frontend:latest
```

---

## 4. Bare Metal / VPS Systemd Deployment

### Build Commands:
```bash
# 1. Install dependencies
npm ci

# 2. Build Shared Contracts
npm run build --workspace=shared

# 3. Build NestJS Backend
npx tsc -p backend/tsconfig.json

# 4. Build React 19 Frontend
npx vite build --config frontend/vite.config.ts
```

### Startup Commands:
```bash
# Start Backend
node backend/dist/backend/src/main.js

# Preview / Serve Frontend
npx vite preview --config frontend/vite.config.ts --port 80
```

---

## 5. Health Check & Monitoring

- **Liveness Probe:** `GET /api/health`
- **Readiness Probe:** `GET /api/ready`
- **Swagger Documentation:** `GET /api/docs`
