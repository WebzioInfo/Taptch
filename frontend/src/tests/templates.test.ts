import { describe, it, expect } from 'vitest';
import {
  STANDARD_TEMPLATES,
  TEMPLATE_PREVIEW_PLACEHOLDER,
  canAccessTemplate,
  PLAN_TIER_RANK,
} from '../modules/templates/constants';
import { brandConfig, defaultBrandConfig } from '../config/brand';

describe('TAPTCH Templates & Design System', () => {
  it('should register active templates including Cinematic Digital Profile and shared Dark Premium', () => {
    expect(STANDARD_TEMPLATES.length).toBe(2);
    const templateIds = STANDARD_TEMPLATES.map((t) => t.id);
    expect(templateIds).toEqual(['cinematic-noir', 'dark-premium']);
    expect(STANDARD_TEMPLATES[0].name).toBe('Cinematic Digital Profile');
    expect(STANDARD_TEMPLATES[0].supportedProfileTypes).toEqual(['personal']);
    expect(STANDARD_TEMPLATES[1].name).toBe('Dark Premium');
    expect(STANDARD_TEMPLATES[1].supportedProfileTypes).toEqual(['personal', 'business']);
  });

  it('filters templates strictly by accountType (personal vs business)', () => {
    const personalTemplates = STANDARD_TEMPLATES.filter(
      (t) => t.templateType === 'PERSONAL' || t.supportedProfileTypes.includes('personal')
    );
    expect(personalTemplates.map((t) => t.id)).toEqual(['cinematic-noir', 'dark-premium']);

    const businessTemplates = STANDARD_TEMPLATES.filter(
      (t) => t.templateType === 'BUSINESS' || t.supportedProfileTypes.includes('business')
    );
    expect(businessTemplates.map((t) => t.id)).toEqual(['dark-premium']);
  });

  it('should provide neutral dummy preview data without any real personal details', () => {
    expect(TEMPLATE_PREVIEW_PLACEHOLDER.displayName).toBe('Alex Morgan');
    expect(TEMPLATE_PREVIEW_PLACEHOLDER.email).toBe('alex@example.com');
    expect(TEMPLATE_PREVIEW_PLACEHOLDER.businesses.length).toBeGreaterThan(0);
    const serialized = JSON.stringify(TEMPLATE_PREVIEW_PLACEHOLDER).toLowerCase();
    expect(serialized).not.toContain('abdullah');
    expect(serialized).not.toContain('rikhash');
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

