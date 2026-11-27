import { describe, it, expect } from 'vitest';
import { SEEDED_TEMPLATES, TemplatesService } from '../modules/templates/templates.service';

describe('Backend Templates Service', () => {
  it('should expose only the active Phase 1 Cinematic Digital Profile template in SEEDED_TEMPLATES classified as PERSONAL', () => {
    expect(SEEDED_TEMPLATES.length).toBe(1);
    const ids = SEEDED_TEMPLATES.map((t) => t.id);
    expect(ids).toEqual(['cinematic-noir']);
    expect(SEEDED_TEMPLATES[0].templateType).toBe('PERSONAL');
    expect(SEEDED_TEMPLATES[0].supportedProfileTypes).toEqual(['personal']);
  });

  it('filters templates by accountType and templateType', async () => {
    const mockDbService: any = { db: {} };
    const service = new TemplatesService(mockDbService);

    const personalTemplates = await service.findAll({ accountType: 'personal' });
    expect(personalTemplates.length).toBe(1);
    expect(personalTemplates[0].id).toBe('cinematic-noir');

    const businessTemplates = await service.findAll({ accountType: 'business' });
    expect(businessTemplates.length).toBe(0);

    const explicitPersonal = await service.findAll({ templateType: 'PERSONAL' });
    expect(explicitPersonal.length).toBe(1);

    const explicitBusiness = await service.findAll({ templateType: 'BUSINESS' });
    expect(explicitBusiness.length).toBe(0);
  });

  it('should find template by id or slug correctly', async () => {
    const mockDbService: any = {
      db: {
        select: () => ({
          from: () => ({
            where: () => Promise.resolve([]),
          }),
        }),
      },
    };

    const service = new TemplatesService(mockDbService);
    const cinematic: any = await service.findOne('cinematic-noir');
    expect(cinematic.name).toBe('Cinematic Digital Profile');
    expect(cinematic.defaultColors.primary).toBe('#0866F8');
    expect(cinematic.premiumTier || cinematic.requiredPlanId).toBe('nano');
  });

  it('should throw NotFoundException for invalid template ID', async () => {
    const mockDbService: any = {
      db: {
        select: () => ({
          from: () => ({
            where: () => Promise.resolve([]),
          }),
        }),
      },
    };

    const service = new TemplatesService(mockDbService);
    await expect(service.findOne('non-existent-template-id')).rejects.toThrow(
      'Template "non-existent-template-id" not found.'
    );
  });
});
