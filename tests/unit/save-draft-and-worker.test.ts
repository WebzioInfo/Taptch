import { describe, it, expect, vi } from 'vitest';
import { db } from '@/db';
import * as schema from '@/db/schema';
import {
  createProfile,
  updateProfile,
  publishProfile,
  getProfileWithDetails,
  updateProfileSchema,
} from '@/modules/profiles';
import { logger } from '@/lib/logger';
import { redisClient } from '@/lib/redis';
import type { ActorContext } from '@/db';

async function createTestActor(id: string): Promise<ActorContext> {
  await db
    .insert(schema.users)
    .values({
      id,
      name: `User ${id}`,
      email: `${id}@example.com`,
      systemRole: 'user',
    })
    .onConflictDoNothing();

  return {
    userId: id,
    orgId: null,
    role: 'user',
    isAdmin: false,
  };
}

describe('Save Draft, Partial Updates & Worker Resilience', () => {
  describe('API Zod Schema Validation (updateProfileSchema)', () => {
    it('accepts null, undefined, and empty strings for optional fields without 400 rejection', () => {
      const payload = {
        displayName: 'Aarav Sharma',
        headline: null,
        bio: null,
        avatarUrl: null,
        coverUrl: null,
        phone: null,
        whatsapp: null,
        email: null,
        website: null,
        address: null,
        socialLinks: {},
      };

      const result = updateProfileSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.headline).toBeNull();
        expect(result.data.phone).toBeNull();
      }
    });

    it('accepts complete profile payloads with all sections', () => {
      const payload = {
        displayName: 'Priya Patel',
        headline: 'Chief Technology Officer',
        bio: '15+ years in cloud native distributed systems',
        avatarUrl: 'https://images.unsplash.com/photo-avatar',
        coverUrl: 'https://images.unsplash.com/photo-cover',
        phone: '+91 98765 43210',
        whatsapp: '+91 98765 43210',
        email: 'priya@example.com',
        website: 'https://priyapatel.dev',
        address: 'Bengaluru, India',
        location: 'Bengaluru',
        socialLinks: {
          linkedin: 'https://linkedin.com/in/priyapatel',
          twitter: 'https://x.com/priyapatel',
          github: 'https://github.com/priyapatel',
        },
        skills: ['TypeScript', 'Distributed Systems', 'Architecture'],
        customFields: {
          googleReviewUrl: 'https://g.page/r/sample/review',
          brochureUrl: 'https://priyapatel.dev/brochure.pdf',
        },
      };

      const result = updateProfileSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('rejects invalid email formats with field-specific validation message', () => {
      const payload = {
        email: 'invalid-email-address',
      };

      const result = updateProfileSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const emailIssue = result.error.issues.find(
          (issue) => issue.path.includes('email')
        );
        expect(emailIssue).toBeDefined();
        expect(emailIssue?.message).toContain('email');
      }
    });

    it('rejects headlines exceeding 255 characters with clear message', () => {
      const payload = {
        headline: 'A'.repeat(256),
      };

      const result = updateProfileSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const headlineIssue = result.error.issues.find(
          (issue) => issue.path.includes('headline')
        );
        expect(headlineIssue).toBeDefined();
        expect(headlineIssue?.message).toContain('255');
      }
    });
  });

  describe('Database Persistence & Partial Section Updates', () => {
    it('preserves untouched fields during partial section updates', async () => {
      const actor = await createTestActor(`user_partial_${Date.now()}`);
      const slug = `partial-test-${Date.now()}`;

      // 1. Initial creation
      const initial = await createProfile(actor, {
        slug,
        displayName: 'Initial Full Name',
        headline: 'Initial Headline',
        bio: 'Initial Bio',
        profileType: 'personal',
        templateId: 'obsidian-luxury',
      });

      // 2. Partial Section Update: Contacts only
      const updatedAfterContacts = await updateProfile(actor, initial.id, {
        phone: '+91 99999 88888',
        email: 'test@example.com',
      });

      expect(updatedAfterContacts.phone).toBe('+91 99999 88888');
      expect(updatedAfterContacts.email).toBe('test@example.com');
      // Crucial check: headline and bio must NOT be wiped
      expect(updatedAfterContacts.headline).toBe('Initial Headline');
      expect(updatedAfterContacts.bio).toBe('Initial Bio');
      expect(updatedAfterContacts.displayName).toBe('Initial Full Name');

      // 3. Partial Section Update: Socials only
      const updatedAfterSocials = await updateProfile(actor, initial.id, {
        socialLinks: { linkedin: 'https://linkedin.com/in/test' },
      });

      expect(updatedAfterSocials.socialLinks).toEqual({ linkedin: 'https://linkedin.com/in/test' });
      // Phone and email from previous update must remain intact
      expect(updatedAfterSocials.phone).toBe('+91 99999 88888');
      expect(updatedAfterSocials.email).toBe('test@example.com');
      expect(updatedAfterSocials.headline).toBe('Initial Headline');
    });

    it('clears nullable fields when explicitly set to null', async () => {
      const actor = await createTestActor(`user_clear_${Date.now()}`);
      const slug = `clear-test-${Date.now()}`;

      const created = await createProfile(actor, {
        slug,
        displayName: 'Clearable Profile',
        headline: 'Temporary Headline',
        bio: 'Temporary Bio',
        profileType: 'personal',
      });

      expect(created.headline).toBe('Temporary Headline');

      const cleared = await updateProfile(actor, created.id, {
        headline: null,
        bio: null,
      });

      expect(cleared.headline).toBeNull();
      expect(cleared.bio).toBeNull();
      expect(cleared.displayName).toBe('Clearable Profile');
    });
  });

  describe('Worker & Logger Crash-Proof Fallback', () => {
    it('never throws unhandled exceptions when logger methods are invoked', () => {
      expect(() => {
        logger.info('Test info logging output');
        logger.warn('Test warn logging output');
        logger.error('Test error logging output');
        logger.debug('Test debug logging output');
      }).not.toThrow();
    });

    it('safely handles circular or malformed data in logger calls without crashing', () => {
      const circularObj: Record<string, unknown> = { key: 'value' };
      circularObj.self = circularObj;

      expect(() => {
        logger.warn(circularObj, 'Circular reference log');
      }).not.toThrow();
    });
  });

  describe('Redis Resilience & Publishing Reliability', () => {
    it('publishes profile successfully even if Redis cache operations fail or Redis is offline', async () => {
      const actor = await createTestActor(`user_pub_${Date.now()}`);
      const slug = `pub-resilience-${Date.now()}`;

      const created = await createProfile(actor, {
        slug,
        displayName: 'Resilience Test User',
        headline: 'System Architect',
        profileType: 'personal',
      });

      // Mock redisClient.set to throw an error simulating Redis disconnection / worker crash
      const originalSet = redisClient.set.bind(redisClient);
      const setSpy = vi.spyOn(redisClient, 'set').mockRejectedValueOnce(new Error('Redis connection refused: worker exited'));

      // Publish should succeed because DB persistence is authoritative and Redis is non-blocking cache
      const published = await publishProfile(actor, created.id);

      expect(published).toBeDefined();
      expect(published.status).toBe('PUBLISHED');
      expect(published.publishedJson).toBeDefined();

      // Verify database reflects published status
      const fetched = await getProfileWithDetails(actor, created.id);
      expect(fetched?.status?.toUpperCase()).toBe('PUBLISHED');

      setSpy.mockRestore();
    });
  });
});
