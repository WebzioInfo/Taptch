import { describe, it, expect } from 'vitest';
import { SEEDED_TEMPLATES, TemplatesService } from '../modules/templates/templates.service';

describe('Backend Templates Service', () => {
  it('should have 13 luxury & signature templates configured in SEEDED_TEMPLATES', () => {
    expect(SEEDED_TEMPLATES.length).toBe(13);
    const ids = SEEDED_TEMPLATES.map((t) => t.id);
    expect(ids).toContain('obsidian-luxury');
    expect(ids).toContain('ivory-minimalist');
    expect(ids).toContain('aurora-creator');
    expect(ids).toContain('corporate-business');
    expect(ids).toContain('modern-business');
    expect(ids).toContain('apex-capital');
    expect(ids).toContain('industrial-manufacturing');
    expect(ids).toContain('retail-shopping');
    expect(ids).toContain('food-restaurant');
    expect(ids).toContain('clean-corporate');
    expect(ids).toContain('dark-premium');
    expect(ids).toContain('soft-modern');
    expect(ids).toContain('bold-editorial');
  });

  it('should find template by id or slug correctly', async () => {
    const mockDbService: any = {
      db: {
        select: () => ({
          from: () => Promise.resolve([]),
        }),
      },
    };

    const service = new TemplatesService(mockDbService);
    const obsidian: any = await service.findOne('obsidian-luxury');
    expect(obsidian.name).toBe('Obsidian Luxury');
    expect(obsidian.defaultColors.primary).toBe('#D4AF37');
    expect(obsidian.premiumTier || obsidian.requiredPlanId).toBe('nano');

    const apex: any = await service.findOne('apex-capital');
    expect(apex.name).toBe('Apex Capital & Wealth');
    expect(apex.premiumTier || apex.requiredPlanId).toBe('max');
  });

  it('should throw NotFoundException for invalid template ID', async () => {
    const mockDbService: any = {
      db: {
        select: () => ({
          from: () => Promise.resolve([]),
        }),
      },
    };

    const service = new TemplatesService(mockDbService);
    await expect(service.findOne('non-existent-template-id')).rejects.toThrow(
      'Template "non-existent-template-id" not found.'
    );
  });
});
