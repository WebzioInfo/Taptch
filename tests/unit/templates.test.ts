import { describe, it, expect } from 'vitest';
import {
  canAccessTemplate,
  listTemplates,
  getTemplateById,
  getTemplateBySlug,
  TemplateNotFoundError,
} from '@/modules/templates';

describe('Template Registry & Discovery Service', () => {
  describe('canAccessTemplate', () => {
    it('allows nano plan to access nano templates', () => {
      expect(canAccessTemplate('nano', 'nano')).toBe(true);
    });

    it('denies nano plan from accessing micro, mini, or max templates', () => {
      expect(canAccessTemplate('micro', 'nano')).toBe(false);
      expect(canAccessTemplate('mini', 'nano')).toBe(false);
      expect(canAccessTemplate('max', 'nano')).toBe(false);
    });

    it('allows max plan to access all tier templates', () => {
      expect(canAccessTemplate('nano', 'max')).toBe(true);
      expect(canAccessTemplate('micro', 'max')).toBe(true);
      expect(canAccessTemplate('mini', 'max')).toBe(true);
      expect(canAccessTemplate('max', 'max')).toBe(true);
    });

    it('handles uppercase and case differences cleanly', () => {
      expect(canAccessTemplate('MICRO', 'mini')).toBe(true);
      expect(canAccessTemplate('MINI', 'micro')).toBe(false);
    });
  });

  describe('listTemplates', () => {
    it('returns seeded templates', async () => {
      const all = await listTemplates();
      expect(all.length).toBeGreaterThanOrEqual(5);
    });

    it('filters templates by category', async () => {
      const personal = await listTemplates({ category: 'personal' });
      expect(personal.length).toBeGreaterThanOrEqual(1);
      personal.forEach((t) => expect(t.category).toBe('personal'));
    });

    it('filters templates by search query', async () => {
      const searchRes = await listTemplates({ search: 'Obsidian' });
      expect(searchRes.length).toBeGreaterThanOrEqual(1);
      expect(searchRes[0].slug).toBe('obsidian-luxury');
    });

    it('filters templates by supported profile type', async () => {
      const businessOnly = await listTemplates({ profileType: 'business' });
      expect(businessOnly.length).toBeGreaterThanOrEqual(1);
      businessOnly.forEach((t) => {
        expect(t.supportedProfileTypes).toContain('business');
      });
    });
  });

  describe('getTemplateById & getTemplateBySlug', () => {
    it('retrieves obsidian luxury template by id', async () => {
      const t = await getTemplateById('obsidian-luxury');
      expect(t.id).toBe('obsidian-luxury');
      expect(t.name).toBe('Obsidian Luxury');
      expect(t.requiredPlanId).toBe('nano');
    });

    it('retrieves ivory minimal template by slug', async () => {
      const t = await getTemplateBySlug('ivory-minimal');
      expect(t.slug).toBe('ivory-minimal');
      expect(t.name).toBe('Ivory Minimalist');
    });

    it('throws TemplateNotFoundError for nonexistent id', async () => {
      await expect(getTemplateById('non-existent-template-id')).rejects.toThrow(
        TemplateNotFoundError
      );
    });
  });
});
