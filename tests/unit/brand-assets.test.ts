import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { brandConfig } from '@/config/brand';

describe('TAPTCH Brand Identity & Logo Assets Suite', () => {
  const publicDir = path.resolve(process.cwd(), 'public');
  const brandingLogoDir = path.join(publicDir, 'branding', 'logo');
  const brandingIconsDir = path.join(publicDir, 'branding', 'icons');
  const brandingBrandDir = path.join(publicDir, 'branding', 'brand');

  it('verifies all 7 SVG logo variations exist and are valid SVG vectors', () => {
    const requiredLogos = [
      'taptch-logo-primary.svg',
      'taptch-logo-light.svg',
      'taptch-logo-dark.svg',
      'taptch-logo-horizontal.svg',
      'taptch-logo-stacked.svg',
      'taptch-symbol.svg',
      'taptch-monochrome.svg',
    ];

    for (const file of requiredLogos) {
      const filePath = path.join(brandingLogoDir, file);
      expect(fs.existsSync(filePath), `Missing logo file: ${file}`).toBe(true);

      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('<svg');
      expect(content).toContain('viewBox=');
      expect(content.length).toBeGreaterThan(100);
    }
  });

  it('verifies production favicon and application icons exist', () => {
    const iconFiles = [
      path.join(brandingIconsDir, 'favicon.svg'),
      path.join(brandingIconsDir, 'icon-192.png'),
      path.join(brandingIconsDir, 'icon-512.png'),
      path.join(brandingIconsDir, 'apple-touch-icon.png'),
      path.join(publicDir, 'favicon.svg'),
      path.join(publicDir, 'favicon.ico'),
      path.join(publicDir, 'apple-touch-icon.png'),
    ];

    for (const filePath of iconFiles) {
      expect(fs.existsSync(filePath), `Missing icon file: ${filePath}`).toBe(true);
      const stat = fs.statSync(filePath);
      expect(stat.size).toBeGreaterThan(50);
    }
  });

  it('verifies brand configuration assets map to valid physical files', () => {
    const assetMap = [
      brandConfig.assets.logoUrl,
      brandConfig.assets.logoDarkUrl,
      brandConfig.assets.logoLightUrl,
      brandConfig.assets.logoHorizontalUrl,
      brandConfig.assets.logoStackedUrl,
      brandConfig.assets.symbolUrl,
      brandConfig.assets.monochromeUrl,
      brandConfig.assets.faviconUrl,
    ];

    for (const relativeUrl of assetMap) {
      const localPath = path.join(publicDir, relativeUrl.replace(/^\//, ''));
      expect(fs.existsSync(localPath), `brandConfig asset does not exist: ${relativeUrl} -> ${localPath}`).toBe(true);
    }
  });

  it('verifies brand guidelines documentation exists', () => {
    const guidelinesPath = path.join(brandingBrandDir, 'brand-guidelines.md');
    const archRecordPath = path.resolve(process.cwd(), 'docs', 'TAPTCH_BRAND_IDENTITY.md');

    expect(fs.existsSync(guidelinesPath), 'brand-guidelines.md missing').toBe(true);
    expect(fs.existsSync(archRecordPath), 'TAPTCH_BRAND_IDENTITY.md missing').toBe(true);

    const content = fs.readFileSync(guidelinesPath, 'utf-8');
    expect(content).toContain('Harmonic Nexus');
    expect(content).toContain('#D4AF37');
    expect(content).toContain('#0A0A0C');
  });
});

