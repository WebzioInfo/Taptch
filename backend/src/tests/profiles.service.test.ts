import { describe, it, expect, vi, beforeEach } from 'vitest';
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
  });
});
