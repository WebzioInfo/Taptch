---
name: devops-and-deployment
description: Containerization with Docker Compose, India VPS deployment via Coolify/Dokploy, GitHub Actions CI/CD, persistent worker orchestration, health probes, and backup strategies. Activate when managing infrastructure, containers, or CI pipelines.
---

# DevOps & Deployment Skill

## 1. Container Infrastructure Standards
- **Local Compose Stack** (`docker-compose.yml`):
  - `postgres`: PostgreSQL 16 on port 5432 (direct migrator access).
  - `pgbouncer`: PgBouncer in transaction mode on port 6432 (app pooled access).
  - `redis`: Redis 7.2 on port 6379 for caching and BullMQ queues.
  - `minio`: MinIO S3-compatible storage on ports 9000/9001.
  - `mailpit`: Mailpit SMTP server on ports 1025/8025 for email inspection.
- **Production Target**: Docker Compose managed via Coolify or Dokploy on an India VPS (e.g. Hostinger, Hetzner, AWS Mumbai).

## 2. Decoupled Worker Deployment
- The BullMQ worker process runs as an independent container service (`pnpm worker`), not inside the Next.js serverless/web container.
- The web app only interacts with Redis via `queue.add(...)`, ensuring high web responsiveness and zero long-running timeouts.

## 3. Health & Readiness Probes
- `/api/health`: Probes database connectivity (`SELECT 1`) and Redis connectivity (`PING`). Returns HTTP 200 with `{ status: 'healthy', checks, uptime }` or HTTP 503 if primary DB is down.
- `/api/ready`: Readiness check for container orchestrators during zero-downtime rolling deployments.

## 4. Continuous Integration Pipeline
- GitHub Actions workflow defined in `.github/workflows/ci.yml`:
  1. Setup pnpm & Node 22.
  2. `pnpm install --frozen-lockfile`.
  3. `pnpm typecheck`.
  4. `pnpm lint`.
  5. `pnpm db:migrate` and `pnpm db:seed` against PGlite.
  6. `pnpm test`.
  7. `pnpm build`.

