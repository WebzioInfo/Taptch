import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as schema from '../database/schema';
import { ProfilesService } from '../modules/profiles/profiles.service';
import type { ActorContext } from '../common/types';
import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';

describe('Taptch Digital Profiles Engine — ProfilesService', () => {
  let mockDbService: any;
  let mockRedisService: any;
  let service: ProfilesService;

  const mockActor: ActorContext = {
    userId: 'user_dev_001',
    orgId: 'org_dev_001',
    role: 'user',
    isAdmin: false,
  };

  beforeEach(() => {
    mockRedisService = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue('OK'),
      del: vi.fn().mockResolvedValue(1),
    };

    mockDbService = {
      db: {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([]),
        limit: vi.fn().mockResolvedValue([]),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{
          id: 'prof_test_123',
          slug: 'vikram-singhania',
          ownerId: mockActor.userId,
          displayName: 'Vikramaditya Singhania',
          profileType: 'business',
          status: 'DRAFT',
          templateId: 'premium-brand',
          themeId: 'premium-brand',
        }]),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
      },
      withActor: vi.fn((actor, fn) => fn(mockDbService.db)),
    };

    service = new ProfilesService(mockDbService, mockRedisService);
  });

  describe('create profile', () => {
    it('creates profile draft with complete contact coordinates, location, and entities', async () => {
      // Mock slug uniqueness check: no existing profile with this slug
      mockDbService.db.limit.mockResolvedValueOnce([]);

      const result = await service.create(mockActor, {
        displayName: 'Vikramaditya Singhania',
        slug: 'vikram-singhania',
        headline: 'Managing Director & Group Chairman',
        bio: 'Leading luxury enterprise transformation across South Asia.',
        profileType: 'business',
        phone: '+91 98765 43210',
        whatsapp: '+91 98765 43210',
        email: 'vikram@singhania.com',
        website: 'https://singhania.com',
        address: 'Level 42, One World Center, Lower Parel, Mumbai',
        location: 'Mumbai, India',
        templateId: 'premium-brand',
        businesses: [
          {
            companyName: 'Singhania Capital Group',
            jobTitle: 'Chairman',
            businessWebsite: 'https://singhania.capital',
            businessAddress: 'Mumbai, India',
          },
        ],
        catalogue: [
          {
            title: 'Private Wealth Advisory',
            type: 'service',
            price: '₹5,00,000',
            actionUrl: 'https://singhania.capital/advisory',
            actionLabel: 'Book Consultation',
          },
        ],
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('prof_test_123');
      expect(mockDbService.db.insert).toHaveBeenCalled();
    });

    it('rejects reserved system usernames', async () => {
      await expect(
        service.create(mockActor, {
          displayName: 'Admin User',
          slug: 'admin',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects duplicate slugs on profile creation', async () => {
      // Mock user lookup first (if entitlementsService is undefined)
      mockDbService.db.limit
        .mockResolvedValueOnce([]) // for user accountType query
        .mockResolvedValueOnce([{ id: 'existing_prof_01' }]); // for slug collision check

      await expect(
        service.create(mockActor, {
          displayName: 'Duplicate Profile',
          slug: 'taken-slug',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('enforces accountType boundary: personal account cannot create business profile', async () => {
      // Mock user lookup returning personal accountType
      mockDbService.db.limit.mockResolvedValueOnce([{ accountType: 'personal' }]);

      await expect(
        service.create(mockActor, {
          displayName: 'Jane Doe',
          slug: 'jane-doe',
          profileType: 'business',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('enforces template classification boundary: personal account cannot create profile with business template', async () => {
      // Mock user lookup returning personal accountType
      mockDbService.db.limit.mockResolvedValueOnce([{ accountType: 'personal' }]);

      await expect(
        service.create(mockActor, {
          displayName: 'Jane Doe',
          slug: 'jane-doe',
          profileType: 'personal',
          templateId: 'corporate-pro',
        }),
      ).rejects.toThrow();
    });

    it('excludes DELETED and ARCHIVED profiles when counting user profiles against limit', async () => {
      const mockEntitlementsService: any = {
        getActorEntitlements: vi.fn().mockResolvedValue({
          maxProfiles: 1,
          accountType: 'personal',
          tier: 'nano',
        }),
      };

      const customService = new ProfilesService(
        mockDbService,
        mockRedisService,
        mockEntitlementsService
      );

      // The count query selects profiles with ne(status, 'DELETED') and ne(status, 'ARCHIVED')
      // Simulate that user had 1 deleted profile, so active count is 0
      mockDbService.db.where.mockReturnValueOnce(Promise.resolve([])); // 0 active profiles

      const res = await customService.create(mockActor, {
        displayName: 'Allowed Profile',
        slug: 'allowed-profile',
      });

      expect(res).toBeDefined();
      expect(mockEntitlementsService.getActorEntitlements).toHaveBeenCalled();
    });
  });

  describe('update profile', () => {
    it('updates profileType, location, contacts, and invalidates Redis cache', async () => {
      // Mock findOne lookup
      vi.spyOn(service, 'findOne').mockResolvedValueOnce({
        id: 'prof_test_123',
        slug: 'old-slug',
        ownerId: mockActor.userId,
        displayName: 'Old Name',
        profileType: 'personal',
        status: 'DRAFT',
      } as any);

      // Mock slug uniqueness check (if slug is changed)
      mockDbService.db.limit.mockResolvedValueOnce([]);

      mockDbService.db.returning.mockResolvedValueOnce([
        {
          id: 'prof_test_123',
          slug: 'new-slug',
          displayName: 'Updated Name',
          profileType: 'business',
          location: 'Bengaluru, India',
          status: 'DRAFT',
        },
      ]);

      const updated = await service.update(mockActor, 'prof_test_123', {
        displayName: 'Updated Name',
        slug: 'new-slug',
        profileType: 'business',
        location: 'Bengaluru, India',
        phone: '+91 99999 88888',
      });

      expect(updated).toBeDefined();
      expect(updated.profileType).toBe('business');
      // Invalidation called for old and new slugs
      expect(mockRedisService.del).toHaveBeenCalledWith('profile:slug:old-slug');
      expect(mockRedisService.del).toHaveBeenCalledWith('profile:slug:new-slug');
    });
  });

  describe('publish profile', () => {
    it('compiles fresh snapshot, updates status to PUBLISHED, and syncs Redis cache for 24h', async () => {
      vi.spyOn(service, 'findOne').mockResolvedValueOnce({
        id: 'prof_test_123',
        slug: 'vikram-singhania',
        ownerId: mockActor.userId,
        status: 'DRAFT',
      } as any);

      vi.spyOn(service, 'findBySlug').mockResolvedValueOnce({
        id: 'prof_test_123',
        slug: 'vikram-singhania',
        displayName: 'Vikramaditya Singhania',
        profileType: 'business',
        status: 'PUBLISHED',
      } as any);

      mockDbService.db.returning.mockResolvedValueOnce([
        {
          id: 'prof_test_123',
          slug: 'vikram-singhania',
          status: 'PUBLISHED',
          publishedAt: new Date(),
        },
      ]);

      const published = await service.publish(mockActor, 'prof_test_123');

      expect(published).toBeDefined();
      expect(published.status).toBe('PUBLISHED');
      expect(mockRedisService.set).toHaveBeenCalledWith(
        'profile:slug:vikram-singhania',
        expect.any(String),
        86400,
      );
    });

    it('re-publishing after editing bio overwrites publishedJson and Redis so findBySlug returns the new bio immediately', async () => {
      // Simulate real Redis get/set/del behavior
      const store = new Map<string, string>();
      mockRedisService.get.mockImplementation(async (k: string) => store.get(k) ?? null);
      mockRedisService.set.mockImplementation(async (k: string, v: string) => {
        store.set(k, v);
        return 'OK';
      });
      mockRedisService.del.mockImplementation(async (k: string) => {
        store.delete(k);
        return 1;
      });

      // Make where() chainable (.limit/.orderBy/.returning) and awaitable as [] for businesses query
      mockDbService.db.where.mockImplementation(() => {
        const arr: any = [];
        arr.limit = mockDbService.db.limit;
        arr.orderBy = mockDbService.db.orderBy;
        arr.returning = mockDbService.db.returning;
        return arr;
      });

      const dbProfile: any = {
        id: 'prof_bio_test',
        slug: 'bio-user',
        ownerId: mockActor.userId,
        displayName: 'Bio User',
        bio: 'Initial Bio v1',
        profileType: 'personal',
        templateId: 'cinematic-noir',
        themeId: 'cinematic-noir',
        status: 'DRAFT',
        publishedJson: {},
      };

      // Mock findOne / findBySlug DB queries for publish #1
      vi.spyOn(service, 'findOne').mockResolvedValue({ ...dbProfile } as any);
      mockDbService.db.limit.mockResolvedValue([{ ...dbProfile }]);
      mockDbService.db.returning.mockResolvedValue([{ ...dbProfile, status: 'PUBLISHED' }]);

      await service.publish(mockActor, 'prof_bio_test');
      const firstPublic = await service.findBySlug('bio-user');
      expect(firstPublic.bio).toBe('Initial Bio v1');
      expect(firstPublic.status).toBe('PUBLISHED');

      // Now edit bio to v2 and re-publish
      dbProfile.bio = 'Updated Bio v2';
      vi.spyOn(service, 'findOne').mockResolvedValue({ ...dbProfile } as any);
      mockDbService.db.limit.mockResolvedValue([{ ...dbProfile }]);
      mockDbService.db.returning.mockResolvedValue([{ ...dbProfile, status: 'PUBLISHED' }]);

      await service.publish(mockActor, 'prof_bio_test');
      const secondPublic = await service.findBySlug('bio-user');
      expect(secondPublic.bio).toBe('Updated Bio v2');
      expect(secondPublic.status).toBe('PUBLISHED');
    });

    it('stores Cloudinary avatarUrl in publishedJson and Redis cache and updates on republish', async () => {
      const store = new Map<string, string>();
      mockRedisService.get.mockImplementation(async (k: string) => store.get(k) ?? null);
      mockRedisService.set.mockImplementation(async (k: string, v: string) => {
        store.set(k, v);
        return 'OK';
      });
      mockRedisService.del.mockImplementation(async (k: string) => {
        store.delete(k);
        return 1;
      });

      mockDbService.db.where.mockImplementation(() => {
        const arr: any = [];
        arr.limit = mockDbService.db.limit;
        arr.orderBy = mockDbService.db.orderBy;
        arr.returning = mockDbService.db.returning;
        return arr;
      });

      const avatarV1 = 'https://res.cloudinary.com/demo-cloud/image/upload/v1/taptch/u1/avatars/a1.webp';
      const avatarV2 = 'https://res.cloudinary.com/demo-cloud/image/upload/v2/taptch/u1/avatars/a2.webp';
      const dbProfile: any = {
        id: 'prof_cloud_snap',
        slug: 'cloud-user',
        ownerId: mockActor.userId,
        displayName: 'Cloud User',
        avatarUrl: avatarV1,
        profileType: 'personal',
        templateId: 'cinematic-noir',
        themeId: 'cinematic-noir',
        status: 'DRAFT',
        publishedJson: {},
      };

      vi.spyOn(service, 'findOne').mockResolvedValue({ ...dbProfile } as any);
      mockDbService.db.limit.mockResolvedValue([{ ...dbProfile }]);
      mockDbService.db.returning.mockResolvedValue([{ ...dbProfile, status: 'PUBLISHED' }]);

      await service.publish(mockActor, 'prof_cloud_snap');
      expect(mockDbService.db.set).toHaveBeenCalledWith(
        expect.objectContaining({
          publishedJson: expect.objectContaining({ avatarUrl: avatarV1 }),
        }),
      );
      expect(JSON.parse(store.get('profile:slug:cloud-user')!).avatarUrl).toBe(avatarV1);

      dbProfile.avatarUrl = avatarV2;
      vi.spyOn(service, 'findOne').mockResolvedValue({ ...dbProfile } as any);
      mockDbService.db.limit.mockResolvedValue([{ ...dbProfile }]);
      await service.publish(mockActor, 'prof_cloud_snap');
      expect(JSON.parse(store.get('profile:slug:cloud-user')!).avatarUrl).toBe(avatarV2);
    });

    it('replaces a venture logo with a Cloudinary URL, publishes, and returns the Cloudinary URL from findBySlug', async () => {
      const store = new Map<string, string>();
      mockRedisService.get.mockImplementation(async (k: string) => store.get(k) ?? null);
      mockRedisService.set.mockImplementation(async (k: string, v: string) => {
        store.set(k, v);
        return 'OK';
      });
      mockRedisService.del.mockImplementation(async (k: string) => {
        store.delete(k);
        return 1;
      });

      const oldLogoUrl = '/api/v1/uploads/file/3c1b90c5-bc77-4a8d-8902-7e95c31f9a6f.jpg';
      const newLogoUrl =
        'https://res.cloudinary.com/dhydmxcq2/image/upload/v1795787153/taptch/u1/logos/c151ea8a-d98c-41c2-8222-00e2fd2b7002.jpg';

      let storedBusinesses = [
        {
          id: 'biz_essar',
          profileId: 'prof_venture_test',
          name: 'ESSAR Enterprises',
          tagline: 'Founder & Chairman',
          description: null,
          email: null,
          phone: null,
          website: 'https://www.essarenterprises.co.in/',
          address: null,
          logoUrl: oldLogoUrl,
          displayOrder: 0,
        },
      ];

      const dbProfile: any = {
        id: 'prof_venture_test',
        slug: 'venture-user',
        ownerId: mockActor.userId,
        displayName: 'Venture User',
        profileType: 'personal',
        templateId: 'cinematic-noir',
        themeId: 'cinematic-noir',
        status: 'PUBLISHED',
        publishedJson: {},
      };

      mockDbService.withActor.mockImplementation(async (_actor: any, fn: (tx: any) => Promise<any>) => {
        const tx: any = {
          update: () => ({
            set: () => ({
              where: () => ({
                returning: async () => [{ ...dbProfile, status: 'PUBLISHED' }],
              }),
            }),
          }),
          delete: () => ({
            where: async () => {
              storedBusinesses = [];
              return [];
            },
          }),
          insert: () => ({
            values: async (val: any) => {
              if (val && val.name) {
                storedBusinesses.push(val);
              }
              return [val];
            },
          }),
        };
        return fn(tx);
      });

      mockDbService.db.from = vi.fn((table: any) => ({
        where: () => {
          const rows = table === schema.profileBusinesses ? [...storedBusinesses] : [];
          const arr: any = rows;
          arr.limit = mockDbService.db.limit;
          arr.orderBy = mockDbService.db.orderBy;
          arr.returning = mockDbService.db.returning;
          return arr;
        },
      }));
      mockDbService.db.orderBy.mockResolvedValue([]);
      mockDbService.db.limit.mockResolvedValue([{ ...dbProfile }]);
      mockDbService.db.returning.mockResolvedValue([{ ...dbProfile, status: 'PUBLISHED' }]);
      vi.spyOn(service, 'findOne').mockResolvedValue({ ...dbProfile } as any);

      // Update venture logo to Cloudinary URL and publish
      await service.update(mockActor, 'prof_venture_test', {
        businesses: [
          {
            id: 'biz_essar',
            companyName: 'ESSAR Enterprises',
            jobTitle: 'Founder & Chairman',
            logoUrl: newLogoUrl,
          },
        ],
      });
      expect(mockRedisService.del).toHaveBeenCalledWith('profile:slug:venture-user');

      await service.publish(mockActor, 'prof_venture_test');
      const publicProfile = await service.findBySlug('venture-user');
      expect(publicProfile.businesses).toHaveLength(1);
      expect(publicProfile.businesses[0].companyName).toBe('ESSAR Enterprises');
      expect(publicProfile.businesses[0].logoUrl).toBe(newLogoUrl);
    });
  });

  describe('username rules, locking, and privacy', () => {
    it('rejects invalid usernames (spaces, leading/trailing hyphens, too short)', async () => {
      await expect(
        service.create(mockActor, { displayName: 'Test', slug: 'ab' }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.create(mockActor, { displayName: 'Test', slug: '-john' }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.create(mockActor, { displayName: 'Test', slug: 'john-' }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.create(mockActor, { displayName: 'Test', slug: 'john doe' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('blocks username changes when profile is NFC-locked', async () => {
      vi.spyOn(service, 'findOne').mockResolvedValueOnce({
        id: 'prof_locked',
        slug: 'john',
        ownerId: mockActor.userId,
        usernameLocked: true,
        status: 'PUBLISHED',
      } as any);

      await expect(
        service.update(mockActor, 'prof_locked', { slug: 'john-new' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('strips private contact fields when findBySlug is called on an unpublished profile', async () => {
      mockDbService.db.limit.mockResolvedValueOnce([
        {
          id: 'prof_draft',
          slug: 'private-user',
          status: 'DRAFT',
          displayName: 'Secret User',
          phone: '+91 99999 00000',
          email: 'secret@example.com',
        },
      ]);

      const snapshot = await service.findBySlug('private-user');
      expect(snapshot.status).toBe('DRAFT');
      expect((snapshot as any).phone).toBeUndefined();
      expect((snapshot as any).email).toBeUndefined();
    });
  });

  describe('delete profile (remove)', () => {
    it('soft-deletes profile by marking status=DELETED, invalidates Redis, and detaches cards', async () => {
      vi.spyOn(service, 'findOne').mockResolvedValueOnce({
        id: 'prof_to_delete',
        slug: 'mark-to-delete',
        ownerId: mockActor.userId,
      } as any);

      const result = await service.remove(mockActor, 'prof_to_delete');
      expect(result).toEqual({ success: true, id: 'prof_to_delete' });
      expect(mockDbService.db.update).toHaveBeenCalled();
      expect(mockRedisService.del).toHaveBeenCalledWith('profile:slug:mark-to-delete');
    });
  });

  describe('template restoration and legacy migration', () => {
    it('resolves legacy personal template IDs to cinematic-noir in findOne and findBySlug', async () => {
      mockDbService.db.limit.mockResolvedValueOnce([
        {
          id: 'prof_legacy',
          slug: 'legacy-user',
          ownerId: mockActor.userId,
          profileType: 'personal',
          templateId: 'obsidian-luxury',
          themeId: 'obsidian',
          displayName: 'Legacy User',
          status: 'PUBLISHED',
          publishedJson: {
            id: 'prof_legacy',
            slug: 'legacy-user',
            displayName: 'Legacy User',
            profileType: 'personal',
            templateId: 'obsidian-luxury',
          },
        },
      ]);

      const snapshot = await service.findBySlug('legacy-user');
      expect(snapshot.templateId).toBe('cinematic-noir');
      expect(snapshot.themeId).toBe('cinematic-noir');
      expect(snapshot.displayName).toBe('Legacy User');
    });

    it('preserves each user own chosen template across publish and public findBySlug', async () => {
      mockDbService.db.limit
        .mockResolvedValueOnce([
          {
            id: 'prof_user_a',
            slug: 'user-a',
            ownerId: 'user_a',
            profileType: 'personal',
            templateId: 'cinematic-noir',
            themeId: 'cinematic-noir',
            displayName: 'User A',
            status: 'PUBLISHED',
            publishedJson: {
              id: 'prof_user_a',
              slug: 'user-a',
              displayName: 'User A',
              profileType: 'personal',
              templateId: 'cinematic-noir',
              themeId: 'cinematic-noir',
            },
          },
        ])
        .mockResolvedValueOnce([{ status: 'active' }])
        .mockResolvedValueOnce([
          {
            id: 'prof_user_b',
            slug: 'user-b',
            ownerId: 'user_b',
            profileType: 'business',
            templateId: 'corporate-business',
            themeId: 'corporate-business',
            displayName: 'User B',
            status: 'PUBLISHED',
            publishedJson: {
              id: 'prof_user_b',
              slug: 'user-b',
              displayName: 'User B',
              profileType: 'business',
              templateId: 'corporate-business',
              themeId: 'corporate-business',
            },
          },
        ])
      .mockResolvedValueOnce([{ status: 'active' }]);

    const snapA = await service.findBySlug('user-a');
    const snapB = await service.findBySlug('user-b');
    expect(snapA.templateId).toBe('cinematic-noir');
    expect(snapB.templateId).toBe('corporate-business');
    expect(snapB.templateId).not.toBe('cinematic-noir');
  });
});
});
