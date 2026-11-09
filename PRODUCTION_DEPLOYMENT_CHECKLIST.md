# TAPTCH — Production Deployment Checklist & Runbook

This runbook guides devops engineers and software architects through pre-flight verification, deployment, smoke testing, and disaster recovery for the TAPTCH production environment.

---

## 1. Pre-Flight Verification Gate (Local / CI)

Before triggering any production build or deployment, all local gates must pass with exit code `0`.

- [ ] **Typecheck**:
  ```powershell
  npm run typecheck
  ```
  *Expected result: Zero TypeScript errors (`tsc --noEmit`).*

- [ ] **Linting & Code Standards**:
  ```powershell
  npm run lint
  ```
  *Expected result: Zero ESLint errors across `src/`.*

- [ ] **Automated Test Suite**:
  ```powershell
  npm test
  ```
  *Expected result: All 24 test suites pass (208+ tests).*

- [ ] **Architecture Tests**:
  ```powershell
  npx vitest run tests/architecture/brand-literal.test.ts
  ```
  *Expected result: 100% brand literal compliance (no unauthorized customer strings).*

- [ ] **Production Turbopack Build**:
  ```powershell
  npm run build
  ```
  *Expected result: Successful compilation of all static and dynamic routes.*

---

## 2. Infrastructure & Service Verification

- [ ] **Supabase PostgreSQL Database**:
  - Connection URL configured with `sslmode=require`.
  - Schema migrations applied:
    ```powershell
    npm run db:migrate
    ```
  - Verify tables exist: `profiles`, `businesses`, `catalogue_items`, `users`, `sessions`, `accounts`, `cards`, `orders`.
  - Verify Row-Level Security is active: `ALTER TABLE ... FORCE ROW LEVEL SECURITY`.

- [ ] **Cloudflare Storage & CDN**:
  - Cloudflare R2 bucket `taptch-media` exists and is accessible.
  - S3 credentials (`CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`) verified.
  - Custom CDN domain (`CLOUDFLARE_R2_PUBLIC_BASE_URL`) resolves to `https://assets.taptch.com`.

- [ ] **Redis & Background Worker Queue**:
  - Redis instance running and reachable on port `6379`.
  - BullMQ persistent worker container deployed alongside the web container:
    ```bash
    docker compose up -d worker
    ```

- [ ] **DNS & SSL Certificates**:
  - `taptch.com` → Production Host IP (A record / Cloudflare Proxy).
  - `www.taptch.com` → 301 Permanent Redirect to `https://taptch.com`.
  - Wildcard SSL certificate active and valid.

---

## 3. Server Deployment Procedure (Coolify / Dokploy / Docker Compose)

1. **Pull Latest Code**:
   ```bash
   git fetch origin
   git checkout main
   git pull origin main
   ```

2. **Verify Environment Variables**:
   Inspect production environment in container runner:
   - `DATABASE_URL` (Supabase pooled)
   - `DATABASE_URL_DIRECT` (Supabase direct)
   - `BETTER_AUTH_SECRET` (Cryptographic 64-char key)
   - `BETTER_AUTH_URL` (`https://taptch.com`)
   - `NEXT_PUBLIC_APP_URL` (`https://taptch.com`)
   - `VISITOR_SALT_SECRET` (Daily rotating secret)
   - `CLOUDFLARE_R2_*` (Media bucket credentials)

3. **Build & Start Containers**:
   ```bash
   docker compose build --no-cache
   docker compose up -d
   ```

4. **Verify Health Endpoint**:
   ```bash
   curl -I https://taptch.com/api/health
   ```
   *Expected result: `HTTP/2 200 OK` with JSON `{ status: "ok" }`.*

---

## 4. Post-Deployment Smoke Testing Runbook

- [ ] **Landing Page**: Verify `https://taptch.com` renders the Obsidian Luxury hero section, navigation links, and theme swatches.
- [ ] **Authentication Flow**:
  - Sign in with verified account.
  - Verify session cookie is set with `HttpOnly; Secure; SameSite=Lax`.
- [ ] **Profile Builder Studio**:
  - Navigate to `/builder/[id]`.
  - Test real-time template switching across all 6 themes (`Obsidian Luxury`, `Ivory Minimalist`, `Aurora Creator`, `Zenith Corporate`, `Catalyst Business`, `Apex Capital`).
  - Test custom primary and accent color swatches.
  - Upload avatar and cover images via dual-mode modal (verify CDN URL returned).
  - Add and save a UPI payment VPA (e.g. `merchant@okhdfcbank`).
  - Verify pre-flight validation modal displays score, blocking errors, and warnings accurately.
  - Publish profile and verify celebration modal.
- [ ] **Public Profile Hot Path**:
  - Open `/p/[slug]` in an incognito window.
  - Verify instant load (< 100ms TTFB) with no authentication prompts.
  - Verify UPI QR code renders and "Pay via UPI App" deep link works on mobile.
  - Verify social media links point to canonical platforms with handles formatted cleanly.
- [ ] **Template Showcase Flow**:
  - Visit `/templates` and select a template.
  - If `profileId` is provided, verify automatic template update and return redirect to `/builder/[profileId]`.

---

## 5. Rollback & Disaster Recovery Procedures

### Scenario A: Application Container Crash / Regressive Build
1. Instantly revert to previous stable Docker image tag:
   ```bash
   docker compose down
   docker compose up -d web:previous worker:previous
   ```
2. Verify `/api/health` returns HTTP 200.

### Scenario B: Database Migration Regression
1. Rollback migration using Drizzle migration down script:
   ```bash
   npm run db:rollback
   ```
2. Alternatively, restore latest automated daily Supabase Point-in-Time Recovery (PITR) snapshot via Supabase dashboard.

### Scenario C: Cloudflare Media Storage Outage
1. Enable fallback URL mode in `src/components/media/ImageUploadOrUrl.tsx` allowing direct image URLs while R2 API restores.
