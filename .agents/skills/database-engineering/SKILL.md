---
name: database-engineering
description: PostgreSQL 16, Drizzle ORM, schema design, RLS multi-tenant isolation, transaction-mode PgBouncer pooling safety, migrations, and query indexing. Activate when modifying schemas, migrations, or database queries.
---

# Database Engineering Skill

## 1. Stack & Driver Standards
- **Engine**: PostgreSQL 16+.
- **ORM**: Drizzle ORM (`drizzle-orm`) with `drizzle-kit` for declarative migration generation.
- **Driver**: `postgres.js` with `prepare: false` strictly enforced. This setting is mandatory to avoid prepared statement collisions when operating behind PgBouncer in transaction pooling mode.
- **Local Dev / Testing Engine**: Embedded persistent PGlite (`@electric-sql/pglite`) configured in `src/db/index.ts` to allow instant, zero-dependency offline runs without requiring WSL or Docker daemons.

## 2. PostgreSQL Row-Level Security (RLS) & Tenant Isolation
- Every multi-tenant table (`profiles`, `cards`, `card_events`, `card_assignments`, `activation_attempts`, `audit_logs`) must have RLS enabled with `FORCE ROW LEVEL SECURITY`.
- **Pooled Connection Rule**: In PgBouncer transaction pooling mode, tenant context MUST be injected per transaction:
  ```sql
  SELECT 
    set_config('app.current_user_id', $1, true),
    set_config('app.current_org_id', $2, true),
    set_config('app.current_role', $3, true),
    set_config('app.is_admin', $4, true);
  ```
  The third parameter (`is_local = true`) guarantees the session variable is automatically cleared upon `COMMIT` or `ROLLBACK`, preventing tenant context leakage across pooled transactions.
- Always execute tenant-scoped queries through `withActor(actor, operation)` defined in `src/db/index.ts`.

## 3. Migration Architecture & Idempotence
- Migrations are versioned SQL files located in `src/db/migrations/`.
- The migration runner `src/db/migrate.ts` tracks executed migrations in the `__Tappzio_migrations` ledger table to guarantee strict idempotence.
- Never manually edit applied migrations. Generate fresh migrations via `pnpm db:generate`.

## 4. Indexing & Query Performance
- Foreign keys must always have supporting b-tree indexes to optimize `JOIN` operations and cascade checks.
- Unique constraints must be declared at the database level (`UNIQUE("slug")`, `UNIQUE("serial_number")`, `UNIQUE("redirect_token")`).
- High-frequency query paths (e.g. card token lookup, public profile slug lookup) must use dedicated indexes and negative caching in Redis.

