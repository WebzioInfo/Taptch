import { describe, it, expect, beforeAll } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import * as schema from '../database/schema';
import { AdminService } from '../modules/admin/admin.service';
import { ActivityLogService } from '../modules/admin/activity-log.service';
import type { ActorContext } from '../common/types';

describe('Phase 2.2: Real PGlite Database Integration Tests', () => {
  let db: any;
  let dbService: any;
  let redisService: any;
  let deletedRedisKeys: string[];
  let activityLogService: ActivityLogService;
  let adminService: AdminService;

  const superAdmin1: ActorContext = { userId: 'sa_1', orgId: null, role: 'super_admin', isAdmin: true };
  const superAdmin2: ActorContext = { userId: 'sa_2', orgId: null, role: 'super_admin', isAdmin: true };
  const staffActor: ActorContext = { userId: 'stf_1', orgId: null, role: 'staff', isAdmin: false };

  beforeAll(async () => {
    const pglite = new PGlite();
    db = drizzle(pglite, { schema });

    const migrationsDir = path.resolve(__dirname, '../database/migrations');
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      await pglite.exec(sql);
    }

    dbService = { db };
    deletedRedisKeys = [];
    redisService = {
      del: async (key: string) => {
        deletedRedisKeys.push(key);
        return 1;
      },
    };
    activityLogService = new ActivityLogService(dbService);
    adminService = new AdminService(dbService, redisService, activityLogService);

    // Seed users
    await db.insert(schema.users).values([
      {
        id: 'sa_1',
        name: 'Super Admin One',
        email: 'sa1@taptch.test',
        systemRole: 'super_admin',
        status: 'active',
        emailVerified: true,
        createdAt: new Date('2026-01-10T10:00:00Z'),
        updatedAt: new Date('2026-01-10T10:00:00Z'),
      },
      {
        id: 'sa_2',
        name: 'Super Admin Two',
        email: 'sa2@taptch.test',
        systemRole: 'super_admin',
        status: 'active',
        emailVerified: true,
        createdAt: new Date('2026-01-11T10:00:00Z'),
        updatedAt: new Date('2026-01-11T10:00:00Z'),
      },
      {
        id: 'u_active',
        name: 'Alice Active',
        email: 'alice@taptch.test',
        phoneNumber: '+919876543210',
        systemRole: 'user',
        status: 'active',
        emailVerified: true,
        createdAt: new Date('2026-02-01T12:00:00Z'),
        updatedAt: new Date('2026-02-01T12:00:00Z'),
      },
      {
        id: 'u_deactivated',
        name: 'Bob Deactivated',
        email: 'bob@taptch.test',
        systemRole: 'user',
        status: 'deactivated',
        emailVerified: false,
        createdAt: new Date('2026-02-05T12:00:00Z'),
        updatedAt: new Date('2026-02-05T12:00:00Z'),
      },
      {
        id: 'stf_1',
        name: 'Staff Member',
        email: 'staff@taptch.test',
        systemRole: 'staff',
        status: 'active',
        emailVerified: true,
        createdAt: new Date('2026-02-06T12:00:00Z'),
        updatedAt: new Date('2026-02-06T12:00:00Z'),
      },
    ]);

    // Seed session for u_active
    await db.insert(schema.sessions).values({
      id: 'sess_alice_1',
      token: 'tok_alice_1',
      userId: 'u_active',
      expiresAt: new Date(Date.now() + 86400_000),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Seed profiles (2 profiles for u_active to test duplicate user prevention)
    await db.insert(schema.profiles).values([
      {
        id: 'prof_1',
        ownerId: 'u_active',
        slug: 'alice-one',
        displayName: 'Alice Studio',
        profileType: 'personal',
        status: 'PUBLISHED',
        templateId: 'obsidian-luxury',
        createdAt: new Date('2026-02-02T10:00:00Z'),
        updatedAt: new Date('2026-02-02T10:00:00Z'),
      },
      {
        id: 'prof_2',
        ownerId: 'u_active',
        slug: 'alice-two',
        displayName: 'Alice Ventures',
        profileType: 'business',
        status: 'DRAFT',
        templateId: 'obsidian-luxury',
        createdAt: new Date('2026-02-03T10:00:00Z'),
        updatedAt: new Date('2026-02-03T10:00:00Z'),
      },
    ]);

    // Seed venture in profile_businesses
    await db.insert(schema.profileBusinesses).values({
      id: 'biz_1',
      profileId: 'prof_1',
      name: 'Alice Design Co',
      tagline: 'Creative Agency',
      website: 'https://alicedesign.example',
    });
}, 30000);

it('prevents concurrent demotion of the last two active super_admin accounts', async () => {
  const results = await Promise.allSettled([
    adminService.updateAdminRole('sa_2', 'admin', superAdmin1),
    adminService.updateAdminRole('sa_1', 'admin', superAdmin2),
  ]);

  const activeSuperAdmins = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.systemRole, 'super_admin'));

  expect(activeSuperAdmins.length).toBeGreaterThanOrEqual(1);
  const fulfilled = results.filter((r) => r.status === 'fulfilled');
  expect(fulfilled.length).toBeLessThanOrEqual(1);
});

it('suspends and reactivates user, revokes sessions, and rolls back on audit failure', async () => {
  await adminService.updateUserStatus('u_active', 'suspended', superAdmin1);

  const [suspended] = await db.select().from(schema.users).where(eq(schema.users.id, 'u_active'));
  expect(suspended.status).toBe('suspended');

  const sessionsAfterSuspend = await db
    .select()
    .from(schema.sessions)
    .where(eq(schema.sessions.userId, 'u_active'));
  expect(sessionsAfterSuspend).toHaveLength(0);
  expect(deletedRedisKeys).toContain('profile:slug:alice-one');

  // Reactivate
  await adminService.updateUserStatus('u_active', 'active', superAdmin1);
  const [reactivated] = await db.select().from(schema.users).where(eq(schema.users.id, 'u_active'));
  expect(reactivated.status).toBe('active');

  // Force audit failure -> must roll back user status
  const failingAudit = {
    record: async () => {
      throw new Error('Simulated audit insert failure');
    },
  } as any;
  const failingAdminService = new AdminService(dbService, redisService, failingAudit);

  await expect(
    failingAdminService.updateUserStatus('u_active', 'suspended', superAdmin1),
  ).rejects.toThrow('Simulated audit insert failure');

  const [afterRollback] = await db.select().from(schema.users).where(eq(schema.users.id, 'u_active'));
  expect(afterRollback.status).toBe('active');
});

it('publishes/unpublishes profile and rolls back on audit failure', async () => {
  await adminService.updateProfileStatus('prof_1', 'DRAFT', superAdmin1);
  const [drafted] = await db.select().from(schema.profiles).where(eq(schema.profiles.id, 'prof_1'));
  expect(drafted.status).toBe('DRAFT');

  // Force audit failure -> must roll back profile status
  const failingAudit = {
    record: async () => {
      throw new Error('Simulated profile audit failure');
    },
  } as any;
  const failingAdminService = new AdminService(dbService, redisService, failingAudit);

  await expect(
    failingAdminService.updateProfileStatus('prof_1', 'PUBLISHED', superAdmin1),
  ).rejects.toThrow('Simulated profile audit failure');

  const [afterRollback] = await db.select().from(schema.profiles).where(eq(schema.profiles.id, 'prof_1'));
  expect(afterRollback.status).toBe('DRAFT');

  // Restore PUBLISHED
  await adminService.updateProfileStatus('prof_1', 'PUBLISHED', superAdmin1);
});

it('searches, filters, paginates users and profiles without duplicates', async () => {
  // Searching "alice" matches u_active who has 2 profiles -> must return 1 user, not 2
  const userSearch = await adminService.getAllUsers('alice', 'ALL', 'active', {
    fromDate: '2026-02-01',
    toDate: '2026-02-01',
    page: 1,
    pageSize: 10,
  });
  expect(userSearch.total).toBe(1);
  expect(userSearch.items).toHaveLength(1);
  expect(userSearch.items[0].id).toBe('u_active');

  // Invalid dates are safely ignored without crashing
  const invalidDateSearch = await adminService.getAllUsers(undefined, 'ALL', 'ALL', {
    fromDate: 'not-a-date',
    toDate: 'also-invalid',
    page: 0,
    pageSize: 500,
  });
  expect(invalidDateSearch.page).toBe(1);
  expect(invalidDateSearch.pageSize).toBe(100);
  expect(invalidDateSearch.total).toBeGreaterThanOrEqual(5);

  const profileSearch = await adminService.getAllProfiles({
    q: 'alice',
    status: 'PUBLISHED',
    page: 1,
    pageSize: 10,
  });
  expect(profileSearch.total).toBe(1);
  expect(profileSearch.items[0].slug).toBe('alice-one');
});

it('reconciles dashboard metrics and returns real ventures in getProfileDetails', async () => {
  const overview = await adminService.getDashboardOverview(superAdmin1);
  expect(overview.metrics.totalUsers).toBe(5);
  expect(overview.metrics.totalProfiles).toBe(2);
  expect(overview.metrics.publishedProfiles + overview.metrics.unpublishedProfiles).toBe(
    overview.metrics.totalProfiles,
  );

  const staffOverview = await adminService.getDashboardOverview(staffActor);
  expect(staffOverview.recentActivity).toEqual([]);

  const details = await adminService.getProfileDetails('prof_1');
  expect(details.businesses).toHaveLength(1);
  expect(details.businesses[0].name).toBe('Alice Design Co');
  expect(details.cards).toEqual([]);
});
});
