import { describe, it, expect, beforeAll } from 'vitest';
import { getDatabase, withActor, ActorContext } from '@/db';
import * as schema from '@/db/schema';
import { sql } from 'drizzle-orm';

describe('Tenant-Scoped Data Layer & PostgreSQL Row-Level Security (RLS)', () => {
  const db = getDatabase();

  const orgA: ActorContext = {
    userId: 'user-tenant-a',
    orgId: 'org-alpha',
    role: 'owner',
    isAdmin: false,
  };

  const orgB: ActorContext = {
    userId: 'user-tenant-b',
    orgId: 'org-beta',
    role: 'owner',
    isAdmin: false,
  };

  beforeAll(async () => {
    // 1. Create non-superuser application role in DB if not present
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'taptch_app') THEN
          CREATE ROLE taptch_app WITH LOGIN NOBYPASSRLS;
        END IF;
      END $$;
    `);
    await db.execute(sql`GRANT USAGE ON SCHEMA public TO taptch_app;`);
    await db.execute(sql`GRANT ALL ON ALL TABLES IN SCHEMA public TO taptch_app;`);

    // 2. Setup test organizations and users
    await db.insert(schema.organizations).values([
      { id: 'org-alpha', name: 'Alpha Corporation', slug: 'alpha-corp' },
      { id: 'org-beta', name: 'Beta Industries', slug: 'beta-ind' },
    ]).onConflictDoNothing();

    await db.insert(schema.users).values([
      { id: 'user-tenant-a', name: 'Alice Alpha', email: 'alice@alpha.com', systemRole: 'user' },
      { id: 'user-tenant-b', name: 'Bob Beta', email: 'bob@beta.com', systemRole: 'user' },
    ]).onConflictDoNothing();

    // 3. Insert departments under both orgs
    await db.insert(schema.departments).values([
      { id: 'dept-alpha-eng', organizationId: 'org-alpha', name: 'Engineering' },
      { id: 'dept-alpha-sales', organizationId: 'org-alpha', name: 'Sales' },
      { id: 'dept-beta-legal', organizationId: 'org-beta', name: 'Legal' },
    ]).onConflictDoNothing();
  });

  // Helper to run query as taptch_app role (simulating PgBouncer connection)
  async function runAsAppRole<T>(actor: ActorContext, fn: (tx: any) => Promise<T>): Promise<T> {
    return withActor(actor, async (tx) => {
      await tx.execute(sql`SET ROLE taptch_app;`);
      return fn(tx);
    });
  }

  it('Actor from Org Alpha should only view Org Alpha departments', async () => {
    const results = await runAsAppRole(orgA, async (tx) => {
      return tx.select().from(schema.departments);
    });

    expect(results).toHaveLength(2);
    expect(results.every((d: any) => d.organizationId === 'org-alpha')).toBe(true);
    expect(results.some((d: any) => d.name === 'Engineering')).toBe(true);
    expect(results.some((d: any) => d.name === 'Legal')).toBe(false);
  });

  it('Actor from Org Beta should only view Org Beta departments (Zero Cross-Tenant Leakage)', async () => {
    const results = await runAsAppRole(orgB, async (tx) => {
      return tx.select().from(schema.departments);
    });

    expect(results).toHaveLength(1);
    expect(results[0].organizationId).toBe('org-beta');
    expect(results[0].name).toBe('Legal');
  });

  it('Unset tenant context should return zero rows due to RLS filter', async () => {
    // Query without setting tenant organization ID
    const rawResults = await db.transaction(async (tx: any) => {
      await tx.execute(sql`SET ROLE taptch_app;`);
      await tx.execute(sql`SELECT set_config('app.is_admin', 'false', true);`);
      await tx.execute(sql`SELECT set_config('app.current_org_id', '', true);`);
      return tx.select().from(schema.departments);
    });

    expect(rawResults).toHaveLength(0);
  });

  it('Context does NOT leak between two consecutive transactions on the same pooled connection', async () => {
    // Transaction 1: Org Alpha
    const t1 = await runAsAppRole(orgA, async (tx) => {
      return tx.select().from(schema.departments);
    });
    expect(t1.length).toBe(2);

    // Transaction 2: Org Beta immediately following
    const t2 = await runAsAppRole(orgB, async (tx) => {
      return tx.select().from(schema.departments);
    });
    expect(t2.length).toBe(1);
    expect(t2[0].name).toBe('Legal');

    // Transaction 3: Unauthenticated query immediately following
    const t3 = await db.transaction(async (tx: any) => {
      await tx.execute(sql`SET ROLE taptch_app;`);
      await tx.execute(sql`SELECT set_config('app.is_admin', 'false', true);`);
      await tx.execute(sql`SELECT set_config('app.current_org_id', '', true);`);
      return tx.select().from(schema.departments);
    });
    expect(t3).toHaveLength(0);
  });

  it('Super Admin with isAdmin=true bypasses tenant restriction and sees all departments', async () => {
    const adminActor: ActorContext = {
      userId: 'admin-super',
      role: 'super_admin',
      isAdmin: true,
    };

    const results = await runAsAppRole(adminActor, async (tx) => {
      return tx.select().from(schema.departments);
    });

    expect(results.length).toBeGreaterThanOrEqual(3);
  });
});
