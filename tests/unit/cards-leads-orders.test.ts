import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '@/db';
import * as schema from '@/db/schema';
import {
  hashActivationCode,
  anonymizeVisitorIp,
  claimCard,
  InvalidActivationCodeError,
} from '@/modules/cards';
import { captureLead, listUserLeads } from '@/modules/leads';
import { createOrder, listUserOrders } from '@/modules/orders';

describe('Cards, Leads & Hardware Orders Domain Modules', () => {
  const testUserId = `usr_test_clo_${Date.now()}`;
  let testProfileId: string;

  beforeAll(async () => {
    // Seed test user
    await db
      .insert(schema.users)
      .values({
        id: testUserId,
        name: 'Arjun Test Lead',
        email: `${testUserId}@example.com`,
        systemRole: 'user',
      })
      .onConflictDoNothing();

    // Seed test profile
    testProfileId = `prof_test_${Date.now()}`;
    await db
      .insert(schema.profiles)
      .values({
        id: testProfileId,
        slug: `arjun-${Date.now()}`,
        ownerId: testUserId,
        displayName: 'Arjun Test Lead',
        headline: 'Lead & Hardware Verification',
        status: 'published',
      })
      .onConflictDoNothing();
  });

  describe('NFC & Card Utilities', () => {
    it('generates consistent deterministic SHA-256 activation hashes regardless of casing', () => {
      const hash1 = hashActivationCode('tpz-act-9921');
      const hash2 = hashActivationCode('TPZ-ACT-9921');
      const hash3 = hashActivationCode('  tpz-act-9921  ');

      expect(hash1).toBe(hash2);
      expect(hash2).toBe(hash3);
      expect(hash1).toHaveLength(64);
    });

    it('anonymizes visitor IP addresses with rotating daily salt (DPDP compliant)', () => {
      const rawIp = '103.21.244.12';
      const hash = anonymizeVisitorIp(rawIp);

      expect(hash).not.toContain(rawIp);
      expect(hash).toHaveLength(32);
      expect(anonymizeVisitorIp(rawIp)).toBe(hash);
    });

    it('throws InvalidActivationCodeError when attempting to claim with non-existent code', async () => {
      await expect(
        claimCard(testUserId, 'INVALID-CODE-9999')
      ).rejects.toThrow(InvalidActivationCodeError);
    });
  });

  describe('Reciprocal Lead Capture', () => {
    it('captures an incoming contact card and retrieves it via listUserLeads', async () => {
      const leadId = await captureLead(testProfileId, {
        name: 'Kavita Client',
        email: 'kavita@client.in',
        phone: '+919876543210',
        company: 'Kavita Enterprises',
        jobTitle: 'Chief Strategy Officer',
        notes: 'Met at national business summit.',
      });

      expect(leadId).toMatch(/^lead_/);

      const userLeads = await listUserLeads(testUserId);
      const matched = userLeads.find((l) => l.id === leadId);

      expect(matched).toBeDefined();
      expect(matched?.name).toBe('Kavita Client');
      expect(matched?.email).toBe('kavita@client.in');
      expect(matched?.company).toBe('Kavita Enterprises');
    });
  });

  describe('Physical Hardware Orders', () => {
    it('creates an order request with initial unpaid status and requested lifecycle', async () => {
      const { orderId } = await createOrder(testUserId, {
        material: 'metal',
        quantity: 2,
        shippingAddress: {
          recipientName: 'Arjun Test Lead',
          street: '100 Outer Ring Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560103',
          country: 'India',
          phone: '+919876543210',
        },
        notes: 'Please engrave company emblem on front.',
      });

      expect(orderId).toMatch(/^ord_/);

      const orders = await listUserOrders(testUserId);
      const placed = orders.find((o) => o.id === orderId);

      expect(placed).toBeDefined();
      expect(placed?.material).toBe('metal');
      expect(placed?.quantity).toBe(2);
      expect(placed?.orderStatus).toBe('requested');
      expect(placed?.paymentStatus).toBe('unpaid');
    });
  });
});

