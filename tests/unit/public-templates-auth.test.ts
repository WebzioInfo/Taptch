import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getSafeRedirectUrl, buildAuthQueryString } from '@/lib/auth/redirect';
import { listTemplates, getTemplateById } from '@/modules/templates';

describe('Public Template Gallery & Safe Auth Architecture', () => {
  it('ensures template gallery is NOT trapped inside protected (app) route group', () => {
    const appTemplatesPath = path.resolve('src/app/(app)/templates');
    const marketingTemplatesPath = path.resolve('src/app/(marketing)/templates/page.tsx');

    // (app)/templates must not exist to prevent inheriting blocking session layout
    expect(fs.existsSync(appTemplatesPath)).toBe(false);

    // (marketing)/templates/page.tsx must exist for public unauthenticated access
    expect(fs.existsSync(marketingTemplatesPath)).toBe(true);
  });

  it('allows unauthenticated retrieval of published templates with sanitized fields', async () => {
    // Calling listTemplates directly as the public API does
    const templates = await listTemplates();
    expect(templates.length).toBeGreaterThanOrEqual(6);

    for (const tpl of templates) {
      expect(tpl).toHaveProperty('id');
      expect(tpl).toHaveProperty('name');
      expect(tpl).toHaveProperty('description');
      expect(tpl).toHaveProperty('thumbnailUrl');
      expect(tpl).toHaveProperty('category');
      expect(tpl).toHaveProperty('requiredPlanId');
      expect(tpl).toHaveProperty('features');

      // Must never expose internal admin flags or private fields to public
      expect(tpl).not.toHaveProperty('databasePassword');
      expect(tpl).not.toHaveProperty('secretKey');
    }
  });

  it('allows unauthenticated retrieval of individual template details', async () => {
    const tpl = await getTemplateById('obsidian-luxury');
    expect(tpl.id).toBe('obsidian-luxury');
    expect(tpl.name).toBe('Obsidian Luxury');
    expect(tpl.requiredPlanId).toBe('nano');
    expect(Array.isArray(tpl.features)).toBe(true);
  });

  describe('Open Redirect Protection & Template Parameter Preservation', () => {
    it('redirects to profile builder when a valid template param is provided', () => {
      const url = getSafeRedirectUrl('obsidian-luxury', null);
      expect(url).toBe('/builder/new?template=obsidian-luxury');
    });

    it('sanitizes and allows alphanumeric template slugs with hyphens and underscores', () => {
      const url = getSafeRedirectUrl('zenith-corporate_v2', null);
      expect(url).toBe('/builder/new?template=zenith-corporate_v2');
    });

    it('rejects malicious template injection with script tags or path traversal', () => {
      const url = getSafeRedirectUrl('<script>alert(1)</script>', null);
      // Malicious string rejected, falls back to default
      expect(url).toBe('/dashboard');

      const traversalUrl = getSafeRedirectUrl('../../etc/passwd', null);
      expect(traversalUrl).toBe('/dashboard');
    });

    it('allows safe relative redirect paths starting with single slash', () => {
      const url = getSafeRedirectUrl(null, '/templates');
      expect(url).toBe('/templates');

      const subUrl = getSafeRedirectUrl(null, '/cards');
      expect(subUrl).toBe('/cards');
    });

    it('strictly prevents Open Redirect attacks (e.g. protocol-relative //attacker.com or javascript:)', () => {
      // Protocol-relative URLs
      expect(getSafeRedirectUrl(null, '//attacker.com')).toBe('/dashboard');
      expect(getSafeRedirectUrl(null, '//google.com/malware')).toBe('/dashboard');

      // Absolute HTTP/HTTPS external URLs
      expect(getSafeRedirectUrl(null, 'https://evil.com')).toBe('/dashboard');
      expect(getSafeRedirectUrl(null, 'http://evil.com')).toBe('/dashboard');

      // Javascript / data URI schemes
      expect(getSafeRedirectUrl(null, 'javascript:alert(1)')).toBe('/dashboard');

      // Windows backslash trickery (\attacker.com)
      expect(getSafeRedirectUrl(null, '/\\attacker.com')).toBe('/dashboard');
    });

    it('correctly constructs preserved auth query strings', () => {
      expect(buildAuthQueryString('industrial', '/templates')).toBe('?template=industrial&redirect=%2Ftemplates');
      expect(buildAuthQueryString('industrial', null)).toBe('?template=industrial');
      expect(buildAuthQueryString(null, '/cards')).toBe('?redirect=%2Fcards');
      expect(buildAuthQueryString(null, null)).toBe('');
    });
  });
});

