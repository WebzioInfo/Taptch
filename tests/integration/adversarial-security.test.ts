import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '@/db';
import { organizations, users, members, qrCodes } from '@/db/schema';
import { eq } from 'drizzle-orm';
import {
  inviteStaff,
  updateStaffMember,
  removeStaffMember,
  PrivilegeEscalationError,
  StaffNotFoundError,
} from '@/modules/orgs';
import { resolveQRToken, createQRCode } from '@/modules/qr';
import { resolveRedirectToken, claimCard } from '@/modules/cards';

describe('Adversarial Security, Tenant Isolation & Benchmark Validation', () => {
  const timestamp = Date.now();
  const org1Id = `org_adv_1_${timestamp}`;
  const org2Id = `org_adv_2_${timestamp}`;
  const owner1Id = `usr_owner_1_${timestamp}`;
  const owner2Id = `usr_owner_2_${timestamp}`;
  const staff1Id = `usr_staff_1_${timestamp}`;
  let staff1MemberId: string = '';

  beforeAll(async () => {
    // 1. Seed two completely isolated organizations
    await db.insert(organizations).values([
      { id: org1Id, name: 'Adversarial Org Alpha', slug: `adv-alpha-${timestamp}` },
      { id: org2Id, name: 'Adversarial Org Beta', slug: `adv-beta-${timestamp}` },
    ]);

    // 2. Seed owners and staff
    await db.insert(users).values([
      { id: owner1Id, name: 'Owner Alpha', email: `owner-alpha-${timestamp}@test.com`, systemRole: 'user' },
      { id: owner2Id, name: 'Owner Beta', email: `owner-beta-${timestamp}@test.com`, systemRole: 'user' },
      { id: staff1Id, name: 'Staff Alpha', email: `staff-alpha-${timestamp}@test.com`, systemRole: 'user' },
    ]);

    // 3. Bind memberships
    await db.insert(members).values([
      { id: `mem_owner1_${timestamp}`, organizationId: org1Id, userId: owner1Id, role: 'owner', status: 'active' },
      { id: `mem_owner2_${timestamp}`, organizationId: org2Id, userId: owner2Id, role: 'owner', status: 'active' },
    ]);

    staff1MemberId = `mem_staff1_${timestamp}`;
    await db.insert(members).values([
      { id: staff1MemberId, organizationId: org1Id, userId: staff1Id, role: 'staff', status: 'active' },
    ]);
  });

  describe('1. Cross-Tenant Adversarial Mutations', () => {
    it('prevents user from Org Alpha from inviting staff into Org Beta', async () => {
      // Owner of Org 1 attempts to invite staff to Org 2
      await expect(
        inviteStaff({
          organizationId: org2Id,
          inviterUserId: owner1Id, // Belongs to org1, not org2
          email: `infiltrator-${timestamp}@test.com`,
          role: 'staff',
        })
      ).rejects.toThrow(PrivilegeEscalationError);
    });

    it('prevents staff member from elevating their own role to admin or owner', async () => {
      // Staff 1 tries to update their own role to admin
      await expect(
        updateStaffMember({
          organizationId: org1Id,
          actorUserId: staff1Id, // Staff role
          memberId: staff1MemberId,
          role: 'admin',
        })
      ).rejects.toThrow(PrivilegeEscalationError);
    });

    it('prevents admin from removing the organization owner', async () => {
      // Create admin in Org 1
      const admin1Id = `usr_admin_1_${timestamp}`;
      const admin1MemberId = `mem_admin_1_${timestamp}`;
      await db.insert(users).values({
        id: admin1Id,
        name: 'Admin Alpha',
        email: `admin-alpha-${timestamp}@test.com`,
        systemRole: 'user',
      });
      await db.insert(members).values({
        id: admin1MemberId,
        organizationId: org1Id,
        userId: admin1Id,
        role: 'admin',
        status: 'active',
      });

      // Admin tries to remove owner
      await expect(
        removeStaffMember({
          organizationId: org1Id,
          actorUserId: admin1Id,
          memberId: `mem_owner1_${timestamp}`,
        })
      ).rejects.toThrow(PrivilegeEscalationError);
    });
  });

  describe('2. Path Verification: /q/, /dq/, and /n/', () => {
    let testQRToken: string;

    beforeAll(async () => {
      const created = await createQRCode({
        ownerUserId: owner1Id,
        destinationType: 'url',
        targetUrl: 'https://example.com/target-landing',
        name: 'Benchmark QR',
      });
      testQRToken = created.token;
    });

    it('resolves assigned dynamic QR token with status=assigned and destination URL', async () => {
      const resolved = await resolveQRToken(testQRToken);
      expect(resolved.status).toBe('assigned');
      expect(resolved.redirectUrl).toBe('https://example.com/target-landing');
    });

    it('resolves non-existent token with status=not_found', async () => {
      const resolved = await resolveQRToken('non_existent_token_99999999');
      expect(resolved.status).toBe('not_found');
      expect(resolved.redirectUrl).toBeFalsy();
    });

    it('resolves non-existent NFC token with status=not_found', async () => {
      const resolved = await resolveRedirectToken('non_existent_nfc_token');
      expect(resolved.status).toBe('not_found');
      expect(resolved.slug).toBeFalsy();
    });
  });

  describe('3. Empirical Latency & Performance Benchmark', () => {
    it('measures empirical QR redirect resolution latency across 50 iterations', async () => {
      // Warm up cache
      const sample = await createQRCode({
        ownerUserId: owner1Id,
        destinationType: 'url',
        targetUrl: 'https://benchmark.taptch.com/test',
        name: 'Latency Benchmark',
      });

      const latencies: number[] = [];
      const ITERATIONS = 50;

      for (let i = 0; i < ITERATIONS; i++) {
        const start = performance.now();
        const res = await resolveQRToken(sample.token);
        const duration = performance.now() - start;
        latencies.push(duration);
        expect(res.status).toBe('assigned');
      }

      latencies.sort((a, b) => a - b);
      const p50 = latencies[Math.floor(ITERATIONS * 0.5)];
      const p95 = latencies[Math.floor(ITERATIONS * 0.95)];
      const p99 = latencies[Math.floor(ITERATIONS * 0.99)];
      const min = latencies[0];
      const max = latencies[latencies.length - 1];

      // Document empirical performance evidence
      expect(p50).toBeLessThan(50); // Must be strictly sub-50ms
      expect(p95).toBeLessThan(100);
      expect(min).toBeGreaterThanOrEqual(0);
    });
  });
});
