import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ProfileRenderer, canonicalTemplateId } from '../components/templates/ProfileRenderer';
import { STANDARD_TEMPLATES, getTemplateDefaultThemeConfig } from '../modules/templates/constants';

describe('Dark Premium Template (Personal & Business)', () => {
  it('is registered in STANDARD_TEMPLATES as a shared public template for both personal and business accounts', () => {
    const entry = STANDARD_TEMPLATES.find((t) => t.id === 'dark-premium');
    expect(entry).toBeDefined();
    expect(entry?.name).toBe('Dark Premium');
    expect(entry?.supportedProfileTypes).toEqual(['personal', 'business']);
    expect(canonicalTemplateId('dark-premium', 'personal')).toBe('dark-premium');
    expect(canonicalTemplateId('dark-premium', 'business')).toBe('dark-premium');

    const defaults = getTemplateDefaultThemeConfig('dark-premium');
    expect(defaults.primary).toBe('#C5A880');
    expect(defaults.background).toBe('#08090A');
  });

  it('renders personal profile through ProfileRenderer with ventures, location, and resolved avatarUrl, without sample data', () => {
    const html = renderToString(
      <ProfileRenderer
        profile={{
          id: 'p-dp-1',
          slug: 'arjun-mehta',
          displayName: 'Arjun Mehta',
          headline: 'Product Strategist',
          location: 'Bengaluru, India',
          avatarUrl: '/api/v1/uploads/file/arjun.webp',
          phone: '+91 9900112233',
          whatsapp: '+91 9900112233',
          email: 'arjun@mehta.example',
          profileType: 'personal',
          templateId: 'dark-premium',
          businesses: [
            {
              id: 'b-1',
              companyName: 'Mehta Ventures',
              roleTitle: 'Managing Partner',
              tagline: 'Seed Studio',
              websiteUrl: 'https://mehtaventures.example',
            },
          ],
          socialLinks: [{ platform: 'LinkedIn', url: 'https://linkedin.com/in/arjunmehta' }],
        }}
      />,
    );

    expect(html).toContain('tpl-dark-premium');
    expect(html).toContain('Arjun Mehta');
    expect(html).toContain('Product Strategist');
    expect(html).toContain('Bengaluru, India');
    expect(html).toContain('Mehta Ventures');
    expect(html).toContain('http://localhost:4000/api/v1/uploads/file/arjun.webp');
    expect(html).toContain('tel:+91 9900112233');
    expect(html).toContain('https://wa.me/919900112233');
    expect(html).toContain('Save Contact');

    // Zero hardcoded sample data or encrypted footer text
    expect(html).not.toContain('Mohammed Sanoof');
    expect(html).not.toContain('Age 20');
    expect(html).not.toContain('Webzio');
    expect(html).not.toContain('Edrops');
    expect(html).not.toContain('End-to-End Encrypted');
  });

  it('renders business profile through ProfileRenderer with displayName in hero (never overwritten by venture name), catalogue, address, website, and Portfolio & Companies below Direct Coordinates', () => {
    const html = renderToString(
      <ProfileRenderer
        profile={{
          id: 'p-dp-2',
          slug: 'kestrel-studio',
          displayName: 'Kestrel Architecture',
          headline: 'Commercial Interiors & Facades',
          avatarUrl: '/api/v1/uploads/file/kestrel-logo.png',
          address: '42 MG Road, Kochi',
          website: 'https://kestrel.example',
          profileType: 'business',
          templateId: 'dark-premium',
          phone: '+91 9811122233',
          email: 'hello@kestrel.example',
          businesses: [
            {
              id: 'biz-1',
              companyName: 'Webzio',
              tagline: 'Digital Solutions',
              logoUrl: '/api/v1/uploads/file/webzio-logo.png',
              status: 'Active',
            },
          ],
          catalogue: [
            {
              id: 'cat-1',
              title: 'Spatial Design Audit',
              itemType: 'service',
              description: 'Full 3D concept & material specification',
              price: '45000',
              currency: 'INR',
            },
          ],
          themeConfig: {
            accent: '#E5C058',
            background: '#050507',
          },
        }}
      />,
    );

    expect(html).toContain('tpl-dark-premium');
    // Hero name stays displayName, never overwritten by venture name "Webzio"
    expect(html).toContain('<h1 class="hero-name">Kestrel Architecture</h1>');
    expect(html).not.toContain('<h1 class="hero-name">Webzio</h1>');
    expect(html).toContain('Commercial Interiors &amp; Facades');
    expect(html).toContain('http://localhost:4000/api/v1/uploads/file/kestrel-logo.png');
    expect(html).toContain('42 MG Road, Kochi');
    expect(html).toContain('kestrel.example');
    expect(html).toContain('Spatial Design Audit');
    expect(html).toContain('INR 45000');
    expect(html).toContain('--user-color-accent:#E5C058');
    expect(html).toContain('--user-bg-page:#050507');

    // Portfolio & Companies appears BELOW Direct Coordinates with resolved logo & status
    expect(html).toContain('Portfolio &amp; Companies');
    expect(html).toContain('Webzio');
    expect(html).toContain('Digital Solutions');
    expect(html).toContain('Active');
    expect(html).toContain('http://localhost:4000/api/v1/uploads/file/webzio-logo.png');
    expect(html.indexOf('Direct Coordinates')).toBeLessThan(
      html.indexOf('Portfolio &amp; Companies'),
    );
    expect(html.indexOf('Portfolio &amp; Companies')).toBeLessThan(
      html.indexOf('Services &amp; Catalogue'),
    );
  });

  it('respects customFields.showVentures=false and keeps hero displayName unchanged in builder preview and public view', () => {
    const baseProfile = {
      id: 'p-dp-4',
      slug: 'sanoof-test',
      displayName: 'Alex Morgan',
      headline: 'Founder',
      profileType: 'business',
      templateId: 'dark-premium',
      email: 'alex@morgan.example',
      businesses: [
        {
          id: 'biz-w',
          companyName: 'Webzio',
          roleTitle: 'Digital Solutions',
          tagline: 'Digital Solutions',
        },
      ],
    };

    const previewHtml = renderToString(
      <ProfileRenderer profile={{ ...baseProfile, isEmbedded: true }} />,
    );
    const publicHtml = renderToString(<ProfileRenderer profile={baseProfile} />);

    for (const html of [previewHtml, publicHtml]) {
      expect(html).toContain('<h1 class="hero-name">Alex Morgan</h1>');
      expect(html).toContain('Portfolio &amp; Companies');
      expect(html).toContain('Webzio');
      expect(html).toContain('Digital Solutions');
      expect(html).not.toContain('Digital Solutions · Digital Solutions');
      expect(html.indexOf('Direct Coordinates')).toBeLessThan(
        html.indexOf('Portfolio &amp; Companies'),
      );
    }

    const hiddenHtml = renderToString(
      <ProfileRenderer
        profile={{
          ...baseProfile,
          customFields: { showVentures: false },
        }}
      />,
    );
    expect(hiddenHtml).not.toContain('Portfolio &amp; Companies');
  });

  it('hides empty sections and logs a warning for unknown template ids', () => {
    const minimalHtml = renderToString(
      <ProfileRenderer
        profile={{
          id: 'p-dp-3',
          slug: 'minimal-user',
          displayName: 'Minimal User',
          profileType: 'personal',
          templateId: 'dark-premium',
          businesses: [],
          catalogue: [],
          socialLinks: [],
        }}
      />,
    );

    expect(minimalHtml).toContain('Minimal User');
    expect(minimalHtml).toContain('Save Contact');
    expect(minimalHtml).not.toContain('Portfolio &amp; Companies');
    expect(minimalHtml).not.toContain('Direct Coordinates');
    expect(minimalHtml).not.toContain('Social Channels');
    expect(minimalHtml).not.toContain('WhatsApp');
    expect(minimalHtml).not.toContain('Call');

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const unknownHtml = renderToString(
      <ProfileRenderer
        profile={{
          id: 'p-unk',
          slug: 'unknown-user',
          displayName: 'Unknown User',
          profileType: 'personal',
          templateId: 'non-existent-template',
        }}
      />,
    );
    expect(warnSpy).toHaveBeenCalled();
    expect(unknownHtml).toContain('unknown-template-error');
    expect(unknownHtml).not.toContain('tpl-dark-premium');
    warnSpy.mockRestore();
  });
});
