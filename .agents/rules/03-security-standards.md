---
trigger: always_on
---

# Security & Data Privacy Standards

## 1. Backend-Enforced Authorization & Zero Trust
- Never rely on frontend UI hiding for authorization.
- Every API endpoint, server action, and database query must verify actor identity, organization tenancy, and `can(actor, action, resource)` permission.
- Prevent IDOR: Never accept user-supplied organization IDs or actor IDs without validating active membership in the database session.

## 2. Multi-Tenant Isolation & Transaction-Scoped RLS
- All tenant-sensitive PostgreSQL queries must execute through the Data Access Layer using `withActor(actor, fn)`.
- Mandate transaction-scoped session variable injection: `SELECT set_config('app.current_user_id', $1, true)`. The `is_local = true` parameter strictly guarantees zero leakage across pooled PgBouncer connections.
- Ensure all sensitive tables enforce PostgreSQL Row-Level Security with `FORCE ROW LEVEL SECURITY`.

## 3. Data Protection, Privacy & Secret Management
- Privacy-Safe Analytics: Never store raw IP addresses. Hash visitor IPs using a 24-hour rotating salt and discard the raw value.
- Sensitive Data Redaction: Passwords, OTP codes, activation tokens, and API secrets must be masked in Pino logger outputs.
- Never hardcode secrets, API keys, or private tokens in code or commit history. Use environment variables strictly.

