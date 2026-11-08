import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { db } from '../src/db';
import * as schema from '../src/db/schema';
import { auth } from '../src/lib/auth';
import { eq, sql } from 'drizzle-orm';
import crypto from 'crypto';

interface TestResult {
  suite: string;
  test: string;
  status: 'PASS' | 'FAIL';
  details?: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function recordTest(suite: string, test: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    results.push({ suite, test, status: 'PASS', durationMs: Date.now() - start });
    console.log(`  ✓ [PASS] ${test} (${Date.now() - start}ms)`);
  } catch (err: any) {
    results.push({ suite, test, status: 'FAIL', details: err.message, durationMs: Date.now() - start });
    console.error(`  ✗ [FAIL] ${test}:`, err.message);
  }
}

async function runAllVerifications() {
  console.log('================================================================');
  console.log('TAPTCH — LIVE SUPABASE DATABASE & AUTH VERIFICATION SUITE');
  console.log('Target: ' + process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@'));
  console.log('================================================================\n');

  // Suite 1: Database Structure & Migrations
  console.log('--- SUITE 1: DATABASE STRUCTURE & MIGRATIONS ---');
  await recordTest('Database Structure', 'all 13 migrations recorded in __taptch_migrations', async () => {
    const res = await db.execute(sql`SELECT count(*)::int as count FROM __taptch_migrations;`);
    const count = (res as any)[0]?.count || 0;
    if (count < 13) throw new Error(`Expected at least 13 migrations, found ${count}`);
  });

  await recordTest('Database Structure', 'core tables exist in public schema', async () => {
    const tablesRes = await db.execute(sql`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
    `);
    const tableNames = new Set((tablesRes as any).map((r: any) => r.table_name));
    const required = ['users', 'sessions', 'accounts', 'organizations', 'profiles', 'qr_codes', 'plans', 'media_assets', 'system_settings'];
    for (const req of required) {
      if (!tableNames.has(req)) throw new Error(`Missing required table: ${req}`);
    }
  });

  // Suite 2: Better Auth Authentication & Session Lifecycle
  console.log('\n--- SUITE 2: BETTER AUTH & SESSION LIFECYCLE ---');
  const testUserEmail = `authtest_${Date.now()}@taptch.local`;
  const testUserPassword = `AuthTest!${crypto.randomBytes(6).toString('hex')}@2026`;
  let testUserId = '';

  await recordTest('Authentication', 'registers new user via Better Auth', async () => {
    const signUpRes = await auth.api.signUpEmail({
      body: {
        email: testUserEmail,
        password: testUserPassword,
        name: 'Automated Auth Tester',
      },
    });
    if (!signUpRes?.user?.id) throw new Error('Sign up did not return user ID');
    testUserId = signUpRes.user.id;
  });

  await recordTest('Authentication', 'authenticates with valid credentials and creates session', async () => {
    const signInRes = await auth.api.signInEmail({
      body: {
        email: testUserEmail,
        password: testUserPassword,
      },
    });
    if (!signInRes?.user?.id) throw new Error('Sign in failed for valid credentials');
    if (!signInRes?.token) throw new Error('Sign in did not return session token');
  });

  await recordTest('Authentication', 'rejects invalid password with authentication error', async () => {
    try {
      await auth.api.signInEmail({
        body: {
          email: testUserEmail,
          password: 'IncorrectPassword@999',
        },
      });
      throw new Error('Sign in unexpectedly succeeded with invalid password');
    } catch (err: any) {
      if (err.message.includes('unexpectedly succeeded')) throw err;
      // Rejection is expected
    }
  });

  await recordTest('Authentication', 'rejects nonexistent email address', async () => {
    try {
      await auth.api.signInEmail({
        body: {
          email: 'nonexistent_user_123456789@taptch.local',
          password: 'SomePassword@2026!',
        },
      });
      throw new Error('Sign in unexpectedly succeeded for nonexistent email');
    } catch (err: any) {
      if (err.message.includes('unexpectedly succeeded')) throw err;
      // Rejection is expected
    }
  });

  await recordTest('Authentication', 'persists active session in Supabase sessions table', async () => {
    const sessionInDb = await db.query.sessions.findFirst({
      where: eq(schema.sessions.userId, testUserId),
    });
    if (!sessionInDb) throw new Error('Session record not found in Supabase sessions table');
  });

  // Suite 3: Development Accounts & Roles
  console.log('\n--- SUITE 3: DEVELOPMENT ACCOUNTS & ROLES ---');
  await recordTest('Dev Accounts', 'verifies super_admin account exists with correct role', async () => {
    const admin = await db.query.users.findFirst({
      where: eq(schema.users.email, 'admin@taptch.local'),
    });
    if (!admin) throw new Error('admin@taptch.local not found in users table');
    if (admin.systemRole !== 'super_admin') throw new Error(`Expected role super_admin, got ${admin.systemRole}`);
  });

  await recordTest('Dev Accounts', 'verifies admin manager account exists with correct role', async () => {
    const manager = await db.query.users.findFirst({
      where: eq(schema.users.email, 'manager@taptch.local'),
    });
    if (!manager) throw new Error('manager@taptch.local not found in users table');
    if (manager.systemRole !== 'admin') throw new Error(`Expected role admin, got ${manager.systemRole}`);
  });

  await recordTest('Dev Accounts', 'verifies demo user account exists with correct role', async () => {
    const user = await db.query.users.findFirst({
      where: eq(schema.users.email, 'user@taptch.local'),
    });
    if (!user) throw new Error('user@taptch.local not found in users table');
    if (user.systemRole !== 'user') throw new Error(`Expected role user, got ${user.systemRole}`);
  });

  // Suite 4: Core Domain CRUD & Persistence
  console.log('\n--- SUITE 4: CORE APPLICATION DOMAIN CRUD ---');
  let createdProfileId = '';
  const testSlug = `test-profile-${Date.now()}`;
  let createdQrId = '';
  let createdMediaId = '';

  await recordTest('Digital Profiles', 'creates draft digital profile in Supabase', async () => {
    const [profile] = await db.insert(schema.profiles).values({
      id: `prof-test-${Date.now()}`,
      slug: testSlug,
      ownerId: testUserId,
      displayName: 'Verification Profile',
      headline: 'Principal Engineer & Architect',
      bio: 'Automated test bio for live Supabase verification.',
      themeId: 'obsidian',
      status: 'draft',
    }).returning();
    if (!profile?.id) throw new Error('Failed to insert draft profile');
    createdProfileId = profile.id;
  });

  await recordTest('Digital Profiles', 'updates profile content and publishes snapshot', async () => {
    const snapshot = {
      headline: 'Principal Engineer & Architect (Updated)',
      displayName: 'Verification Profile',
      theme: 'obsidian',
      publishedAt: new Date().toISOString(),
    };
    const [updated] = await db.update(schema.profiles)
      .set({
        headline: snapshot.headline,
        status: 'published',
        publishedJson: snapshot,
        publishedAt: new Date(),
      })
      .where(eq(schema.profiles.id, createdProfileId))
      .returning();
    if (updated.status !== 'published') throw new Error('Profile status not updated to published');
  });

  await recordTest('Dynamic QR Engine', 'creates dynamic QR short token linked to profile', async () => {
    const [qr] = await db.insert(schema.qrCodes).values({
      id: `qr-test-${Date.now()}`,
      serialNumber: `TPZ-TEST-${Date.now()}`,
      token: `tst_${crypto.randomBytes(4).toString('hex')}`,
      ownerUserId: testUserId,
      profileId: createdProfileId,
      destinationType: 'profile',
      targetUrl: `https://taptch.com/p/${testSlug}`,
      status: 'active',
      isDynamic: true,
    }).returning();
    if (!qr?.token) throw new Error('Failed to create dynamic QR token');
    createdQrId = qr.id;
  });

  await recordTest('Media Storage Registry', 'persists provider-neutral media asset metadata', async () => {
    const testUrl = `https://imagedelivery.net/test-hash/test_${Date.now()}/avatar`;
    const [media] = await db.insert(schema.mediaAssets).values({
      id: `med-test-${Date.now()}`,
      ownerId: testUserId,
      profileId: createdProfileId,
      storageProvider: 'cloudflare_images',
      storageKey: `profiles/avatars/test_${Date.now()}.webp`,
      storageObjectId: `cf_obj_${Date.now()}`,
      assetUrl: testUrl,
      secureUrl: testUrl,
      assetType: 'image',
      mimeType: 'image/webp',
      mediaCategory: 'avatar',
      format: 'webp',
      isPublic: true,
    }).returning();
    if (!media?.id) throw new Error('Failed to insert media asset metadata');
    createdMediaId = media.id;
  });

  // Suite 5: Cleanup Test Entities
  console.log('\n--- CLEANUP TEMPORARY TEST ENTITIES ---');
  await recordTest('Cleanup', 'cleans up temporary verification entities from Supabase', async () => {
    if (createdMediaId) {
      await db.delete(schema.mediaAssets).where(eq(schema.mediaAssets.id, createdMediaId));
    }
    if (createdQrId) {
      await db.delete(schema.qrCodes).where(eq(schema.qrCodes.id, createdQrId));
    }
    if (createdProfileId) {
      await db.delete(schema.profiles).where(eq(schema.profiles.id, createdProfileId));
    }
    if (testUserId) {
      await db.delete(schema.users).where(eq(schema.users.id, testUserId));
    }
  });

  // Print Summary Table
  console.log('\n================================================================');
  console.log('VERIFICATION SUMMARY');
  console.log('================================================================');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  console.log(`Total Tests Run: ${results.length}`);
  console.log(`Passed:          ${passed}`);
  console.log(`Failed:          ${failed}`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllVerifications().then(() => process.exit(0)).catch(err => {
  console.error('CRITICAL ERROR IN SUITE:', err);
  process.exit(1);
});
