import { describe, it, expect } from 'vitest';
import { STANDARD_TEMPLATES, canAccessTemplate, PLAN_TIER_RANK } from '../modules/templates/constants';
import { brandConfig, defaultBrandConfig } from '../config/brand';

describe('TAPTCH Templates & Design System', () => {
  it('should register all 9 bespoke luxury templates', () => {
    expect(STANDARD_TEMPLATES.length).toBe(9);
    const templateIds = STANDARD_TEMPLATES.map((t) => t.id);
    expect(templateIds).toContain('industrial-manufacturing');
    expect(templateIds).toContain('corporate-business');
    expect(templateIds).toContain('modern-business');
    expect(templateIds).toContain('premium-brand');
    expect(templateIds).toContain('professional-services');
    expect(templateIds).toContain('retail-shopping');
    expect(templateIds).toContain('food-restaurant');
    expect(templateIds).toContain('creative-agency');
    expect(templateIds).toContain('apex-capital');
  });

  it('should enforce proper 4-tier plan hierarchy (nano < micro < mini < max)', () => {
    expect(PLAN_TIER_RANK.nano).toBe(1);
    expect(PLAN_TIER_RANK.micro).toBe(2);
    expect(PLAN_TIER_RANK.mini).toBe(3);
    expect(PLAN_TIER_RANK.max).toBe(4);

    // Nano user cannot access mini template
    expect(canAccessTemplate('mini', 'nano')).toBe(false);
    // Micro user cannot access max template
    expect(canAccessTemplate('max', 'micro')).toBe(false);
    // Mini user can access mini and micro
    expect(canAccessTemplate('mini', 'mini')).toBe(true);
    expect(canAccessTemplate('micro', 'mini')).toBe(true);
    // Max user can access everything
    expect(canAccessTemplate('mini', 'max')).toBe(true);
    expect(canAccessTemplate('max', 'max')).toBe(true);
  });

  it('should enforce brand identity derivation from config', () => {
    expect(brandConfig.name).toBe('TAPTCH');
    expect(brandConfig.theme.primaryColor).toBe('#D4AF37'); // Brushed Metallic Gold
    expect(brandConfig.theme.surfaceColor).toBe('#121216'); // Obsidian Surface
    expect(defaultBrandConfig.supportEmail).toBe('support@taptch.com');
  });
});

