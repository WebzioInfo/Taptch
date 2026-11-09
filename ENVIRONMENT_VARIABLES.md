# TAPTCH — Complete Environment Variables Specification

This document provides a comprehensive, variable-by-variable specification for all environment variables used by the TAPTCH platform across local development, staging, CI/CD, and production environments.

---

## 1. Environment Architecture & Safety Principles

1. **Client vs. Server Isolation**:
   - Variables prefixed with `NEXT_PUBLIC_` are bundled into the client-side JavaScript. **Never place secrets, database passwords, or private API keys in `NEXT_PUBLIC_` variables.**
   - All non-prefixed variables are strictly server-side and inaccessible to the client runtime.
2. **Zero Hardcoded Fallbacks for Secrets**:
   - In production, mandatory secrets (e.g. `DATABASE_URL`, `BETTER_AUTH_SECRET`) throw immediate startup errors if missing.
3. **Redaction in Logs**:
   - The Pino logging engine (`src/lib/logger.ts`) automatically redacts passwords, tokens, API keys, and session cookies from application logs.

---

## 2. Master Variable Catalog

| Variable Name | Required | Environment | Subsystem | Description & Purpose | Security Classification |
|---|---|---|---|---|---|
| `DATABASE_URL` | **Yes** | Dev, Staging, Prod | Database (Drizzle) | Authoritative Supabase PostgreSQL pooled connection URL with SSL enabled (`sslmode=require`). | **Critical Secret** |
| `DATABASE_URL_DIRECT` | **Yes** | Dev, Staging, Prod | Database (Migrations) | Direct Supabase PostgreSQL connection URL for Drizzle migrations and DDL operations. | **Critical Secret** |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | All | Client & Backend | Canonical Supabase project HTTPS URL (`https://<project-ref>.supabase.co`). | Public / Safe |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | **Yes** | All | Client & Backend | Supabase public anonymous / publishable key for client SDK initialization. | Public / Safe |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Staging, Prod | Backend Admin | Supabase Service Role key for administrative operations bypassing RLS (used only in backend services). | **Critical Secret** |
| `CLOUDFLARE_ACCOUNT_ID` | Optional | Staging, Prod | Cloudflare Media | Cloudflare Account ID for Cloudflare Images and R2 API operations. | Server Secret |
| `CLOUDFLARE_IMAGES_API_TOKEN` | Optional | Staging, Prod | Cloudflare Images | Cloudflare Images API Bearer token with upload and transformation privileges. | **Critical Secret** |
| `CLOUDFLARE_IMAGES_ACCOUNT_HASH` | Optional | Staging, Prod | Cloudflare Images | Cloudflare Images customer account hash for constructing public image delivery URLs. | Server Secret |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | Optional | Staging, Prod | Cloudflare R2 | S3-compatible R2 storage Access Key ID for profile avatar, cover, and catalogue uploads. | Server Secret |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | Optional | Staging, Prod | Cloudflare R2 | S3-compatible R2 storage Secret Access Key. | **Critical Secret** |
| `CLOUDFLARE_R2_BUCKET_NAME` | Optional | Staging, Prod | Cloudflare R2 | Name of the primary Cloudflare R2 media storage bucket (`taptch-media`). | Internal Config |
| `CLOUDFLARE_R2_ENDPOINT` | Optional | Staging, Prod | Cloudflare R2 | S3-compatible API endpoint URL for Cloudflare R2 bucket. | Server Secret |
| `CLOUDFLARE_R2_PUBLIC_BASE_URL` | Optional | Staging, Prod | Cloudflare CDN | Custom CDN domain or public Cloudflare R2 worker base URL (`https://assets.taptch.com`). | Public / Safe |
| `EMAIL_PROVIDER` | Optional | All | Transactional Email | Email delivery provider (`smtp`, `resend`, `console`). Default: `smtp`. | Internal Config |
| `SMTP_HOST` | Optional | Staging, Prod | Email | Outbound SMTP server hostname (e.g. `smtp.gmail.com` or `smtp.sendgrid.net`). | Server Config |
| `SMTP_PORT` | Optional | Staging, Prod | Email | Outbound SMTP server port (`587` for STARTTLS, `465` for SSL). | Server Config |
| `SMTP_SECURE` | Optional | Staging, Prod | Email | Boolean flag (`true` or `false`) indicating explicit TLS on initial connection. | Server Config |
| `SMTP_USER` | Optional | Staging, Prod | Email | SMTP authentication username or email account. | Server Secret |
| `SMTP_PASS` | Optional | Staging, Prod | Email | SMTP authentication password or application-specific password. | **Critical Secret** |
| `EMAIL_FROM` | Optional | All | Email | Sender email address for system emails (`noreply@taptch.com`). | Public / Safe |
| `EMAIL_FROM_NAME` | Optional | All | Email | Display name for outbound transactional emails (`TAPTCH`). | Public / Safe |
| `NEXT_PUBLIC_APP_URL` | **Yes** | All | Frontend & Client | Canonical application base URL (`https://taptch.com` or `http://localhost:3000`). Used for absolute links and QR generation. | Public / Safe |
| `BETTER_AUTH_URL` | **Yes** | All | Authentication | Base URL for Better Auth authentication endpoints and cookie domain validation. | Server Secret |
| `BETTER_AUTH_SECRET` | **Yes** | All | Authentication | High-entropy cryptographic secret (>= 32 characters) used to sign sessions and tokens. | **Critical Secret** |
| `REDIS_URL` | Optional | Staging, Prod | Cache & Queues | Redis connection string (`redis://user:pass@host:6379`) for BullMQ workers and distributed rate limiting. | Server Secret |
| `USE_IN_MEMORY_REDIS` | Optional | Dev, Test | Cache & Queues | Set to `true` in local development or test suites to use in-memory fallback without requiring Redis. | Internal Config |
| `ADMIN_API_KEY` | Optional | Staging, Prod | Internal Admin API | Secret authorization bearer token for internal orchestration and monitoring webhooks. | **Critical Secret** |
| `VISITOR_SALT_SECRET` | **Yes** | Staging, Prod | Privacy Analytics | 24-hour rotating cryptographic salt for hashing visitor IP addresses under DPDP Act compliance. | **Critical Secret** |
| `OTP_PROVIDER` | Optional | All | Auth & 2FA | OTP dispatch provider (`console`, `twilio`, `fast2sms`). Default: `console` in development. | Internal Config |

---

## 3. Environment-Specific Profiles

### Development (`.env.local`)
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=local-development-secret-key-minimum-32-chars-long
USE_IN_MEMORY_REDIS=true
OTP_PROVIDER=console
EMAIL_PROVIDER=console
VISITOR_SALT_SECRET=local-dev-salt-1234567890
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.nvrcgauxafpxsaufjtha.supabase.co:5432/postgres?sslmode=require
DATABASE_URL_DIRECT=postgresql://postgres:[PASSWORD]@db.nvrcgauxafpxsaufjtha.supabase.co:5432/postgres?sslmode=require
NEXT_PUBLIC_SUPABASE_URL=https://nvrcgauxafpxsaufjtha.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_bnnLxVjJ-o9guCQQeDDz2w_pwUQrk5b
```

### Production (`Coolify / Dokploy / VPS Environment`)
```bash
NEXT_PUBLIC_APP_URL=https://taptch.com
BETTER_AUTH_URL=https://taptch.com
BETTER_AUTH_SECRET=[64-CHAR-CRYPTOGRAPHICALLY-SECURE-ENTROPY]
USE_IN_MEMORY_REDIS=false
REDIS_URL=redis://default:[REDIS-PASSWORD]@redis:6379
OTP_PROVIDER=fast2sms
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=[SENDGRID-API-KEY]
VISITOR_SALT_SECRET=[32-CHAR-ROTATING-ENTROPY]
DATABASE_URL=postgresql://postgres:[SUPABASE-PASSWORD]@db.nvrcgauxafpxsaufjtha.supabase.co:5432/postgres?sslmode=require
DATABASE_URL_DIRECT=postgresql://postgres:[SUPABASE-PASSWORD]@db.nvrcgauxafpxsaufjtha.supabase.co:5432/postgres?sslmode=require
NEXT_PUBLIC_SUPABASE_URL=https://nvrcgauxafpxsaufjtha.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_bnnLxVjJ-o9guCQQeDDz2w_pwUQrk5b
CLOUDFLARE_ACCOUNT_ID=[CF-ACCOUNT-ID]
CLOUDFLARE_R2_ACCESS_KEY_ID=[R2-KEY-ID]
CLOUDFLARE_R2_SECRET_ACCESS_KEY=[R2-SECRET]
CLOUDFLARE_R2_BUCKET_NAME=taptch-media
CLOUDFLARE_R2_ENDPOINT=https://[CF-ACCOUNT-ID].r2.cloudflarestorage.com
CLOUDFLARE_R2_PUBLIC_BASE_URL=https://assets.taptch.com
```

