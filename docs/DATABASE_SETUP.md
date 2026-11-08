# TAPTCH — Supabase Database Architecture & Setup Guide

This guide details the single-database architecture for TAPTCH, connecting directly to **Supabase PostgreSQL** for runtime operations, migrations, and development seeding.

---

## 1. Architecture Overview

TAPTCH has eliminated local PostgreSQL containers and PgBouncer instances. All environments (development, staging, production) utilize **Supabase PostgreSQL** as the sole application database:

```
+-------------------------------------------------------------+
|                      TAPTCH Application                     |
|          Next.js 16 App Router (Node.js 22+ / 24+)          |
+-------------------------------------------------------------+
                               |
               Drizzle ORM (postgres.js driver)
                  SSL mode required (TLS 1.3)
                               |
                               v
+-------------------------------------------------------------+
|                  Supabase PostgreSQL Cloud                  |
|               Host: db.<ref>.supabase.co:5432               |
|                                                             |
|  - 47 Tables across public schema                           |
|  - 13 Applied Drizzle Migrations (`drizzle` schema)         |
|  - Better Auth Tables (users, sessions, accounts, etc.)     |
|  - Multi-Tenant Row Level Security (RLS) with FORCE RLS     |
+-------------------------------------------------------------+
```

---

## 2. Configuration & Environment Variables

Add the following configuration to your `.env.local`:

```env
# Supabase PostgreSQL Connection String (Port 5432 with SSL required)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.nvrcgauxafpxsaufjtha.supabase.co:5432/postgres?sslmode=require
DATABASE_URL_DIRECT=postgresql://postgres:[PASSWORD]@db.nvrcgauxafpxsaufjtha.supabase.co:5432/postgres?sslmode=require

# Supabase Client & API Keys
NEXT_PUBLIC_SUPABASE_URL=https://nvrcgauxafpxsaufjtha.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_bnnLxVjJ-o9guCQQeDDz2w_pwUQrk5b
```

> **Security Note:** Never commit database passwords or `.env.local` to Git. The connection string must always enforce `?sslmode=require`.

---

## 3. Database Commands

### Running Migrations
Applies all unapplied SQL migrations from `src/db/migrations/` using Drizzle ORM:
```powershell
npm run db:migrate
```

### Seeding Essential Data & Development Accounts
Idempotently inserts default plans, templates, settings, and provisions 3 functional development login accounts:
```powershell
npm run db:seed
```
- **Super Admin**: `admin@taptch.local` (`super_admin`)
- **Admin**: `manager@taptch.local` (`admin`)
- **Demo User**: `user@taptch.local` (`user`)

*Development account passwords are automatically generated and saved to `DEV_LOGIN_CREDENTIALS.md` (which is gitignored).*

### Direct Verification Script
Verifies table schemas, migration status, Better Auth sign-up/sign-in flows, draft creation, snapshot publishing, dynamic QR token resolution, and Cloudflare media persistence against live Supabase:
```powershell
npx tsx scripts/verify-supabase-app.ts
```

---

## 4. Testing Database (Isolated PGlite)

In-memory unit and integration tests run against an isolated embedded PostgreSQL engine via `@electric-sql/pglite`. Tests never mutate or leak into the live Supabase database:
```powershell
npm test
```
- 22 test suites, 173 tests, 0 failures.

