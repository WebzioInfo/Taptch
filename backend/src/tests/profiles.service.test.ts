import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfilesService } from '../modules/profiles/profiles.service';
import type { ActorContext } from '../common/types';
import { BadRequestException, ConflictException } from '@nestjs/common';

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
      // Mock existing slug collision
      mockDbService.db.limit.mockResolvedValueOnce([{ id: 'existing_prof_01' }]);

      await expect(
        service.create(mockActor, {
          displayName: 'Duplicate Profile',
          slug: 'taken-slug',
        }),
      ).rejects.toThrow(ConflictException);
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
});
