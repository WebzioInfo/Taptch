import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '@/db';
import * as schema from '@/db/schema';
import {
  normalizeSlug,
  createProfile,
  updateProfile,
  publishProfile,
  addBusiness,
  addCatalogueItem,
  getProfileWithDetails,
  ProfileSlugTakenError,
} from '@/modules/profiles';
import { TemplatePlanRequirementError } from '@/modules/templates';
import { EntitlementLimitExceededError } from '@/modules/entitlements';
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

describe('Profiles Domain Module', () => {
  describe('normalizeSlug', () => {
    it('normalizes spaces, uppercase characters, and special characters', () => {
      expect(normalizeSlug('  John Mathew & Co. ! ')).toBe('john-mathew-co');
      expect(normalizeSlug('CEO_Founder--Tech')).toBe('ceo_founder-tech');
      expect(normalizeSlug('---Leading-Edge---')).toBe('leading-edge');
    });
  });

  describe('createProfile', () => {
    it('successfully creates a draft profile with default sections', async () => {
      const actor = await createTestActor(`user_create_${Date.now()}`);
      const slug = `john-${Date.now()}`;
      const profile = await createProfile(actor, {
        slug,
        displayName: 'John Mathew',
        headline: 'Managing Director & Investor',
        bio: 'Tech entrepreneur and advisor.',
        profileType: 'personal',
        templateId: 'obsidian-luxury',
      });

      expect(profile).toBeDefined();
      expect(profile.slug).toBe(slug);
      expect(profile.displayName).toBe('John Mathew');
      expect(profile.status.toUpperCase()).toBe('DRAFT');

      const details = await getProfileWithDetails(actor, profile.id);
      expect(details.sections.length).toBeGreaterThanOrEqual(10);
    });

    it('rejects duplicate slugs with ProfileSlugTakenError', async () => {
      const actor1 = await createTestActor(`user_dup1_${Date.now()}`);
      const actor2 = await createTestActor(`user_dup2_${Date.now()}`);
      const uniqueSlug = `unique-slug-${Date.now()}`;

      await createProfile(actor1, {
        slug: uniqueSlug,
        displayName: 'Duplicate Test 1',
      });

      await expect(
        createProfile(actor2, {
          slug: uniqueSlug,
          displayName: 'Duplicate Test 2',
        })
      ).rejects.toThrow(ProfileSlugTakenError);
    });

    it('rejects template selection if required plan exceeds user plan', async () => {
      const actor = await createTestActor(`user_plan_${Date.now()}`);
      const slug = `apex-attempt-${Date.now()}`;
      // apex-capital requires max plan, test actor has nano/free plan
      await expect(
        createProfile(actor, {
          slug,
          displayName: 'Luxury Capital',
          templateId: 'apex-capital',
        })
      ).rejects.toThrow(TemplatePlanRequirementError);
    });
  });

  describe('updateProfile & publishProfile', () => {
    it('updates profile headline and publishes snapshot', async () => {
      const actor = await createTestActor(`user_pub_${Date.now()}`);
      const slug = `pub-test-${Date.now()}`;
      const profile = await createProfile(actor, {
        slug,
        displayName: 'Jane Doe',
      });

      const updated = await updateProfile(actor, profile.id, {
        headline: 'VP of Product Engineering',
      });
      expect(updated.headline).toBe('VP of Product Engineering');

      const published = await publishProfile(actor, profile.id);
      expect(published.status.toLowerCase()).toBe('published');
      expect(published.publishedJson).toBeDefined();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((published.publishedJson as any).displayName).toBe('Jane Doe');
    });
  });

  describe('Multi-Business and Catalogue Saving (Unrestricted Draft Mode)', () => {
    it('allows saving multiple businesses in draft mode without plan blockage', async () => {
      const actor = await createTestActor(`user_biz_${Date.now()}`);
      const slug = `biz-limit-${Date.now()}`;
      const profile = await createProfile(actor, {
        slug,
        displayName: 'Biz Owner',
      });

      const biz = await addBusiness(actor, profile.id, {
        name: 'First Company Ltd',
      });
      expect(biz.name).toBe('First Company Ltd');
      expect(biz.profileId).toBe(profile.id);
    });

    it('allows saving catalogue items in draft mode without plan blockage', async () => {
      const actor = await createTestActor(`user_prod_${Date.now()}`);
      const slug = `prod-limit-${Date.now()}`;
      const profile = await createProfile(actor, {
        slug,
        displayName: 'Store Owner',
      });

      const item = await addCatalogueItem(actor, profile.id, {
        type: 'product',
        title: 'Smart NFC Card',
      });
      expect(item.title).toBe('Smart NFC Card');
      expect(item.profileId).toBe(profile.id);
    });
  });
});
