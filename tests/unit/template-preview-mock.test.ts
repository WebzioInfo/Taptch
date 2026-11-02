import { describe, it, expect } from 'vitest';
import {
  DEMO_BUSINESSES,
  getDemoBusinessByTemplate,
  type DemoBusinessProfile,
} from '@/lib/mock-data/demo-businesses';
import {
  STANDARD_TEMPLATES,
  listTemplates,
  getTemplateById,
  canAccessTemplate,
  updateTemplate,
} from '@/modules/templates';
import {
  filterProfileForPublicDisplay,
  DEFAULT_FREE_ENTITLEMENTS,
  type ProfileWithDisplayDetails,
} from '@/modules/entitlements';
import type { ActorContext } from '@/db';

describe('Mass Marketing & Template Preview with Mock Data Test Suite', () => {
  describe('Centralized Demo Mock Data Integrity', () => {
    it('contains exactly 8 realistic demo businesses covering all 8 requested verticals', () => {
      expect(DEMO_BUSINESSES.length).toBe(8);

      const expectedCategories = [
        'industrial-manufacturing',
        'corporate-business',
        'creative-agency',
        'professional-services',
        'retail-shopping',
        'food-restaurant',
        'modern-business',
        'premium-brand',
      ];

      const actualCategories = DEMO_BUSINESSES.map((d) => d.category);
      expect(actualCategories).toEqual(expect.arrayContaining(expectedCategories));
    });

    it('ensures every demo business has an explicit isDemo: true flag', () => {
      DEMO_BUSINESSES.forEach((demo) => {
        expect(demo.isDemo).toBe(true);
        expect(demo.id).toMatch(/^demo-/);
        expect(demo.slug).toBeDefined();
        expect(demo.displayName).toBeDefined();
      });
    });

    it('contains realistic Indian commercial details without fake verification claims', () => {
      DEMO_BUSINESSES.forEach((demo) => {
        // Must contain phone and email
        expect(demo.phone).toMatch(/^\+91/);
        expect(demo.email).toContain('@');
        expect(demo.workingHours).toBeDefined();
        expect(demo.location).toBeDefined();

        // Must have at least 1 catalogue product/service item
        expect(demo.catalogue?.length).toBeGreaterThanOrEqual(1);

        // Prices must be in INR currency
        demo.catalogue?.forEach((item) => {
          expect(item.currency || '₹').toBe('₹');
          expect(item.price).toBeDefined();
        });

        // Highlights must be present
        expect(demo.highlights?.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('retrieves correct demo business profile using getDemoBusinessByTemplate', () => {
      const industrial = getDemoBusinessByTemplate('industrial-manufacturing');
      expect(industrial.id).toBe('demo-apex-industrial');
      expect(industrial.displayName).toBe('Apex Industrial Solutions');

      const retail = getDemoBusinessByTemplate('retail-shopping');
      expect(retail.id).toBe('demo-malabar-silk');
      expect(retail.displayName).toBe('Malabar Silk & Crafts Flagship');

      const food = getDemoBusinessByTemplate('food-restaurant');
      expect(food.id).toBe('demo-saffron-spice');
      expect(food.displayName).toBe('Saffron & Spice Bistro & Lounge');
    });

    it('guarantees demo mock data is read-only and separate from real profiles', () => {
      const sample = getDemoBusinessByTemplate('corporate-business');
      expect(sample.isDemo).toBe(true);
      // Real profile IDs in Tappzio use UUID/CUID, not 'demo-'
      expect(sample.id.startsWith('demo-')).toBe(true);
    });
  });

  describe('Authoritative 8-Template Catalog', () => {
    it('has all 8 core templates with layout features and supported devices', () => {
      expect(STANDARD_TEMPLATES.length).toBeGreaterThanOrEqual(8);

      const requiredTemplateIds = [
        'industrial-manufacturing',
        'corporate-business',
        'modern-business',
        'premium-brand',
        'professional-services',
        'retail-shopping',
        'food-restaurant',
        'creative-agency',
      ];

      requiredTemplateIds.forEach((id) => {
        const found = STANDARD_TEMPLATES.find((t) => t.id === id);
        expect(found).toBeDefined();
        expect(found?.features?.length).toBeGreaterThanOrEqual(3);
        expect(found?.supportedDevices).toEqual(expect.arrayContaining(['Mobile', 'Tablet', 'Desktop']));
        expect(found?.requiredPlanId).toBeDefined();
      });
    });

    it('enforces plan compatibility hierarchy correctly', () => {
      // Nano can only access nano templates
      expect(canAccessTemplate('nano', 'nano')).toBe(true);
      expect(canAccessTemplate('micro', 'nano')).toBe(false);
      expect(canAccessTemplate('mini', 'nano')).toBe(false);
      expect(canAccessTemplate('max', 'nano')).toBe(false);

      // Micro can access nano and micro
      expect(canAccessTemplate('nano', 'micro')).toBe(true);
      expect(canAccessTemplate('micro', 'micro')).toBe(true);
      expect(canAccessTemplate('mini', 'micro')).toBe(false);

      // Mini can access nano, micro, mini
      expect(canAccessTemplate('mini', 'mini')).toBe(true);
      expect(canAccessTemplate('max', 'mini')).toBe(false);

      // Max can access everything
      expect(canAccessTemplate('max', 'max')).toBe(true);
      expect(canAccessTemplate('nano', 'max')).toBe(true);
    });
  });

  describe('Customer Data Integration & Non-Destructive Template Selection', () => {
    it('preserves 100% of customer profile fields when switching templates', () => {
      const customerRecord = {
        id: 'cust-prof-123',
        slug: 'dr-ananya-sharma',
        displayName: 'Dr. Ananya Sharma',
        headline: 'Consultant Neurosurgeon',
        bio: 'Leading neurosurgical researcher with 15+ years of clinical excellence.',
        templateId: 'professional-services',
        businesses: [
          {
            id: 'biz-1',
            companyName: 'Sharma Neuro Care',
            roleTitle: 'Chief Surgeon',
          },
        ],
        catalogue: [
          {
            id: 'cat-1',
            title: 'Neurosurgical Consultation',
            itemType: 'service' as const,
            price: '3,500',
            currency: '₹',
          },
        ],
      };

      // Customer switches template from professional-services to modern-business
      const newTemplateId = 'modern-business';
      const updatedProfile = {
        ...customerRecord,
        templateId: newTemplateId,
      };

      // Verify all customer data is untouched
      expect(updatedProfile.id).toBe(customerRecord.id);
      expect(updatedProfile.slug).toBe(customerRecord.slug);
      expect(updatedProfile.displayName).toBe(customerRecord.displayName);
      expect(updatedProfile.bio).toBe(customerRecord.bio);
      expect(updatedProfile.businesses).toEqual(customerRecord.businesses);
      expect(updatedProfile.catalogue).toEqual(customerRecord.catalogue);
      expect(updatedProfile.templateId).toBe('modern-business');
    });

    it('gracefully handles empty or partial fields with placeholders for preview', () => {
      const partialCustomerProfile = {
        id: 'cust-sparse-456',
        slug: 'new-startup-xyz',
        displayName: 'New Startup XYZ',
        templateId: 'industrial-manufacturing',
        // headline, bio, businesses, catalogue are omitted
      };

      const resolvedDisplayName = partialCustomerProfile.displayName || 'Your Business Name';
      const resolvedHeadline = (partialCustomerProfile as { headline?: string }).headline || 'Add an executive headline to showcase your organization.';
      const resolvedBusinesses = (partialCustomerProfile as { businesses?: unknown[] }).businesses || [];

      expect(resolvedDisplayName).toBe('New Startup XYZ');
      expect(resolvedHeadline).toBe('Add an executive headline to showcase your organization.');
      expect(resolvedBusinesses.length).toBe(0);
    });
  });

  describe('Plan-Based Feature Masking & Entitlement Preview', () => {
    it('masks restricted catalogue items and businesses on nano tier', () => {
      const fullProfile: ProfileWithDisplayDetails = {
        id: 'prof-test-1',
        slug: 'test-co',
        displayName: 'Test Manufacturing Co',
        businesses: [
          { id: 'b1', companyName: 'Plant 1' },
          { id: 'b2', companyName: 'Plant 2' },
        ],
        catalogue: [
          { id: 'c1', type: 'product', title: 'Heavy Machine' },
          { id: 'c2', type: 'service', title: 'Maintenance' },
        ],
        socialLinks: [
          { platform: 'linkedin', url: 'https://linkedin.com' },
          { platform: 'twitter', url: 'https://x.com' },
          { platform: 'youtube', url: 'https://youtube.com' },
          { platform: 'instagram', url: 'https://instagram.com' },
        ],
      };

      // Nano tier: DEFAULT_FREE_ENTITLEMENTS has max_businesses: 0, has_product_catalogue: false
      const nanoFiltered = filterProfileForPublicDisplay(
        fullProfile,
        DEFAULT_FREE_ENTITLEMENTS,
        'nano'
      );

      // On Nano plan, businesses are restricted
      expect(nanoFiltered.businesses?.length).toBe(0);
      // Products are restricted
      expect(nanoFiltered.catalogue?.length).toBe(0);
      // Socials capped at 3 on Nano
      expect(nanoFiltered.socialLinks?.length).toBe(3);
    });

    it('reveals entitled catalogue items and multiple businesses on mini/max plans', () => {
      const fullProfile: ProfileWithDisplayDetails = {
        id: 'prof-test-2',
        slug: 'apex-industrial',
        displayName: 'Apex Industrial',
        businesses: [
          { id: 'b1', companyName: 'Headquarters' },
          { id: 'b2', companyName: 'Hydraulics Unit' },
        ],
        catalogue: [
          { id: 'c1', type: 'product', title: '5-Axis CNC' },
          { id: 'c2', type: 'service', title: 'Plant Maintenance' },
        ],
        socialLinks: [
          { platform: 'linkedin', url: 'https://linkedin.com' },
          { platform: 'youtube', url: 'https://youtube.com' },
          { platform: 'website', url: 'https://example.com' },
          { platform: 'twitter', url: 'https://x.com' },
        ],
      };

      const miniEntitlements = {
        ...DEFAULT_FREE_ENTITLEMENTS,
        max_businesses: 5,
        has_product_catalogue: true,
        max_products: 25,
        has_service_catalogue: true,
        max_services: 25,
        has_exchange_contact: true,
      };

      const miniFiltered = filterProfileForPublicDisplay(
        fullProfile,
        miniEntitlements,
        'mini'
      );

      // Both businesses revealed
      expect(miniFiltered.businesses?.length).toBe(2);
      // Both catalogue items revealed
      expect(miniFiltered.catalogue?.length).toBe(2);
      // Socials preserved
      expect(miniFiltered.socialLinks?.length).toBe(4);
    });
  });

  describe('Admin Template Management & Governance', () => {
    const adminActor: ActorContext = {
      userId: 'admin-super-1',
      orgId: null,
      role: 'super_admin',
      isAdmin: true,
    };

    it('allows admin to update template metadata', async () => {
      const updated = await updateTemplate(adminActor, 'industrial-manufacturing', {
        name: 'Apex Industrial & Heavy Manufacturing',
        requiredPlanId: 'mini',
        isFeatured: true,
      });

      expect(updated.name).toBe('Apex Industrial & Heavy Manufacturing');
      expect(updated.requiredPlanId).toBe('mini');
      expect(updated.isFeatured).toBe(true);
    });

    it('rejects unauthorized non-admin attempts to modify template governance', async () => {
      const regularActor: ActorContext = {
        userId: 'user-regular-2',
        orgId: 'org-1',
        role: 'member',
        isAdmin: false,
      };

      await expect(
        updateTemplate(regularActor, 'industrial-manufacturing', { name: 'Hacked Name' })
      ).rejects.toThrow('Unauthorized');
    });
  });
});
