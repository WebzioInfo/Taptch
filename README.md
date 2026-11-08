# Taptch — Production-Grade NFC Digital Identity SaaS

**Taptch** (brand spelling: **T A P T C H**) is an intelligent digital identity, networking, and smart-hardware SaaS engineered by Webzio Technology. Taptch replaces traditional paper business cards with studio-grade digital profiles that convert physical NFC taps and dynamic QR scans into qualified sales leads and actionable business relationships.

---

## 1. Prerequisites (Windows Development)

- **Node.js**: v22 LTS or v24 (Verified with v24.15.0 on Windows x64).
- **npm**: v10+ (Exclusive mandatory package manager for Taptch).
- **Supabase PostgreSQL**: Sole application database across development, staging, and production (`DATABASE_URL` with SSL required).
- **Docker Desktop**: Recommended for local auxiliary services (Redis 7.2, MinIO S3, Mailpit SMTP).
  *(Note: Testing uses an isolated in-process embedded PostgreSQL instance via `@electric-sql/pglite` for running automated unit and integration tests without external database dependencies).*
- **PowerShell 7+** or Windows PowerShell 5.1.

---

## 2. Quickstart on Windows (Step-by-Step)

### Step 1: Clone & Install Dependencies
Open PowerShell in the project directory:
```powershell
git clone https://github.com/WebzioInfo/taptch.git
cd taptch
npm install
```

### Step 2: Configure Environment
Copy the example environment configuration and supply your Supabase credentials:
```powershell
Copy-Item .env.example .env.local
```
Ensure `DATABASE_URL` and `DATABASE_URL_DIRECT` point to your Supabase PostgreSQL instance with `?sslmode=require`.

### Step 3: Start Auxiliary Infrastructure Services (Docker Compose)
Launch local supporting services (Redis caching, MinIO media emulator, Mailpit test inbox):
```powershell
docker compose up -d
```
This provisions:
- **Redis 7.2**: Port `6379` (In-memory cache & BullMQ queues)
- **MinIO**: Port `9000` (S3 API) & Port `9001` (Web Console: `minioadmin` / `minioadmin`)
- **Mailpit**: Port `1025` (SMTP) & Port `8025` (Web UI for viewing outgoing test emails)
*(Note: Local PostgreSQL and PgBouncer containers have been deprecated and removed in favor of Supabase PostgreSQL).*

### Step 4: Run Migrations & Seed Essential Data
Execute Drizzle migrations and populate Supabase with essential seed data and development accounts:
```powershell
npm run db:migrate
npm run db:seed
```
This applies all 13 Drizzle schema migrations to Supabase and seeds functional development accounts (`admin@taptch.local`, `manager@taptch.local`, `user@taptch.local`) with randomly generated secure passwords recorded locally in `DEV_LOGIN_CREDENTIALS.md` (gitignored).

### Step 5: Start Development Servers
Start the Next.js App Router server:
```powershell
npm run dev
```
In a second terminal window, start the persistent BullMQ background worker:
```powershell
npm run worker
```

Open your browser to:
- **Main App & Dashboard**: `http://localhost:3000`
- **Component & Design Gallery**: `http://localhost:3000/dev/gallery`
- **Mailpit Test Mailbox**: `http://localhost:8025`
- **MinIO S3 Storage Console**: `http://localhost:9001`

---

## 3. Testing & Verification Commands

All scripts are configured cross-platform and work natively on Windows PowerShell:

```powershell
# Run full unit and integration test suite
npm test

# Run TypeScript strict typecheck
npm run typecheck

# Run ESLint analysis
npm run lint

# Run production build
npm run build
```

---

## 4. Default Seeded Credentials for Testing

| Persona / Role | Email | Password | Role Details |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@taptch.com` | `TaptchAdmin@2026!` | Global platform admin (TOTP 2FA enabled) |
| **Support Admin**| `support@taptch.com` | `TaptchAdmin@2026!`| Customer support admin |
| **Org Owner** | `rajesh@apexcap.in` | `ApexCapital@2026!` | Managing Partner, Apex Capital Partners |
| **Org Admin** | `priya@apexcap.in` | `ApexCapital@2026!` | HR & Operations Director |
| **Employee** | `arjun@apexcap.in` | `ApexCapital@2026!` | Investment Associate |
| **Individual** | `dr.ananya@apollo.in` | `ApolloDoc@2026!` | Cardiologist (Ivory Minimal Theme) |
| **Individual** | `kabir@pulse.ai` | `PulseFounder@2026!` | Tech Founder (Aurora Glass Theme) |

---

## 5. Architectural Invariants
- **No Dynamic Profile Hot Path**: Public routes (`/p/[slug]`) must never import `cookies()` or `headers()` from `next/headers`.
- **PgBouncer RLS Safety**: In pooled connections, tenant isolation is set per transaction via `SELECT set_config('app.current_user_id', $1, true)`.
- **Worker Decoupling**: Web routes only push to Redis via `queue.add()`; BullMQ worker processes jobs in a dedicated container.
- **Brand from Config**: Copy and branding derive from `src/config/brand.ts` and `system_settings`; hardcoding brand literals in UI components is strictly prohibited.
