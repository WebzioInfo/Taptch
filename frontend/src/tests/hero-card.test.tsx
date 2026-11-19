import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { HeroCardVisual } from '../components/marketing/HeroCardVisual';
import { brandConfig } from '../config/brand';

describe('HeroCardVisual Component', () => {
  it('renders the transparent PNG card stack asset correctly', () => {
    const html = renderToString(<HeroCardVisual />);

    // Asset verification
    expect(html).toContain('src="/card-matte.png"');
    expect(html).toContain('width="1672"');
    expect(html).toContain('height="941"');
    expect(html).toContain('loading="eager"');
    expect(html).toContain('decoding="async"');
    expect(html).toContain('object-contain');
  });

  it('uses brand name dynamically from brandConfig without hardcoded literals', () => {
    const html = renderToString(<HeroCardVisual />);
    expect(html).toContain(brandConfig.name);
    expect(html).toContain('Premium Matte Black Contactless NFC Card Stack');
  });

  it('includes the hardware-accelerated float animation and aspect ratio lock', () => {
    const html = renderToString(<HeroCardVisual />);
    expect(html).toContain('animate-hero-card-float');
    expect(html).toContain('aspect-[1672/941]');
    expect(html).toContain('[perspective:1200px]');
  });
});
