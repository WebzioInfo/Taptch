# Tappzio — Production-Grade NFC Digital Identity SaaS

**Tappzio** is an intelligent digital identity, networking, and smart-hardware SaaS engineered by Webzio Technology. Tappzio replaces traditional paper business cards with studio-grade digital profiles that convert physical NFC taps and dynamic QR scans into qualified sales leads and actionable business relationships.

---

## 1. Prerequisites (Windows Development)

- **Node.js**: v22 LTS or v24 (Verified with v24.15.0 on Windows x64).
- **npm**: v10+ (Exclusive mandatory package manager for Tappzio).
- **Docker Desktop**: Recommended for local PostgreSQL 16, PgBouncer, Redis, MinIO, and Mailpit.
  *(Note: When Docker is not running, Tappzio automatically supports in-process embedded PostgreSQL via `@electric-sql/pglite` for running automated tests and local verification without external dependencies).*
- **PowerShell 7+** or Windows PowerShell 5.1.

---

## 2. Quickstart on Windows (Step-by-Step)

### Step 1: Clone & Install Dependencies
Open PowerShell in the project directory:
```powershell
cd D:\Webzio\Tappzio
npm install
```

### Step 2: Configure Environment
Copy the example environment configuration:
```powershell
Copy-Item .env.example .env.local
```

### Step 3: Start Infrastructure Services (Docker Compose)
Launch the local containerized stack:
```powershell
docker compose up -d
```
This provisions:
- **PostgreSQL 16**: Port `5432` (Direct migration access)
- **PgBouncer** (Transaction Mode): Port `6432` (Application pooled access)
- **Redis 7.2**: Port `6379` (In-memory cache & BullMQ queues)
- **MinIO**: Port `9000` (S3 API) & Port `9001` (Web Console: `minioadmin` / `minioadmin`)
- **Mailpit**: Port `1025` (SMTP) & Port `8025` (Web UI for viewing outgoing test emails)

### Step 4: Run Migrations & Seed Indian Demo Data
Execute Drizzle migrations and populate the database with realistic demo accounts:
```powershell
npm run db:migrate
npm run db:seed
```

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
| **Super Admin** | `superadmin@tappzio.com` | `TappzioAdmin@2026!` | Global platform admin (TOTP 2FA enabled) |
| **Support Admin**| `support@tappzio.com` | `TappzioSupport@2026!`| Customer support admin |
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
- **Brand from Config**: Copy and branding derive from `src/config/brand.ts` and `system_settings`; hardcoding "Tappzio" in UI components is strictly prohibited.
