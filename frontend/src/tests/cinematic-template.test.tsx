import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { CinematicProfileTemplate } from '../components/templates/layouts/CinematicProfileTemplate';
import type { ProfileRenderData } from '../components/templates/ProfileRenderer';

describe('CinematicProfileTemplate', () => {
  const baseHandlers = {
    onDownloadVCard: vi.fn(),
    onOpenExchange: vi.fn(),
    onOpenQr: vi.fn(),
    copiedUrl: false,
    onCopyLink: vi.fn(),
  };

  it('renders dynamic customer profile fields without dummy fallback data', () => {
    const customerProfile: ProfileRenderData = {
      id: 'prof-1',
      slug: 'jane-doe',
      displayName: 'Jane Doe',
      headline: 'Principal Architect',
      location: 'Bengaluru, India',
      bio: 'Designing resilient digital systems.',
      phone: '+91 98765 43210',
      whatsapp: '+91 98765 43210',
      email: 'jane@studio.example',
      socialLinks: [{ platform: 'instagram', url: 'https://instagram.com/janedoe' }],
      businesses: [
        {
          id: 'biz-1',
          companyName: 'Studio Meridian',
          roleTitle: 'Founder',
          websiteUrl: 'https://meridian.example',
        },
      ],
      customFields: {
        education: 'M.Arch, Urban Design',
        upiId: 'janedoe@upi',
        upiPayeeName: 'Jane Doe',
        skipIntro: true,
      },
      isDemo: false,
    };

    const html = renderToString(
      <CinematicProfileTemplate profile={customerProfile} {...baseHandlers} />,
    );

    expect(html).toContain('Jane Doe');
    expect(html).toContain('Principal Architect');
    expect(html).toContain('Bengaluru, India');
    expect(html).toContain('Studio Meridian');
    expect(html).toContain('M.Arch, Urban Design');
    expect(html).toContain('Pay via UPI');
    expect(html).toContain('@janedoe');
    expect(html).not.toContain('Alex Morgan');
    expect(html).not.toContain('Nova Technologies');
  });

  it('hides optional sections on published profiles when data is absent', () => {
    const minimalProfile: ProfileRenderData = {
      id: 'prof-2',
      slug: 'minimal-user',
      displayName: 'Sam Rivera',
      customFields: {
        skipIntro: true,
      },
      isDemo: false,
    };

    const html = renderToString(
      <CinematicProfileTemplate profile={minimalProfile} {...baseHandlers} />,
    );

    expect(html).toContain('Sam Rivera');
    expect(html).not.toContain('Ventures');
    expect(html).not.toContain('Pay via UPI');
    expect(html).not.toContain('WhatsApp');
    expect(html).not.toContain('Alex Morgan');
    expect(html).not.toContain('Nova Technologies');
  });

  it('renders neutral dummy showcase data when isDemo is true', () => {
    const demoProfile: ProfileRenderData = {
      id: 'demo-cinematic',
      slug: 'alex-morgan',
      displayName: '',
      customFields: {
        skipIntro: true,
      },
      isDemo: true,
    };

    const html = renderToString(
      <CinematicProfileTemplate profile={demoProfile} {...baseHandlers} />,
    );

    expect(html).toContain('Alex Morgan');
    expect(html).toContain('Nova Technologies');
    expect(html).toContain('Creative Labs');
    expect(html).toContain('Business Administration');
  });

  it('bypasses intro curtain and renders venture descriptions in embedded builder mode', () => {
    const embeddedProfile: ProfileRenderData = {
      id: 'prof-embedded',
      slug: 'builder-user',
      displayName: 'Elena Vance',
      headline: 'Product Director',
      bio: 'Crafting tactile digital experiences.',
      businesses: [
        {
          id: 'b-1',
          companyName: 'Vance Studio',
          roleTitle: 'Founder',
          address: 'Kozhikode, Kerala',
          description: 'Industrial design and connected hardware.',
        },
      ],
      isDemo: false,
      isEmbedded: true,
    };

    const html = renderToString(
      <CinematicProfileTemplate profile={embeddedProfile} {...baseHandlers} />,
    );

    expect(html).toContain('cinematic-noir-root is-embedded intro-settled');
    expect(html).not.toContain('cn-intro-overlay');
    expect(html).toContain('Elena Vance');
    expect(html).toContain('Vance Studio');
    expect(html).toContain('Kozhikode, Kerala');
    expect(html).toContain('Industrial design and connected hardware.');
    expect(html).toContain('cn-venture-location-row');
    expect(html).toContain('cn-venture-location-text');
    expect(html).toContain('cn-bio-section');
    expect(html.indexOf('cn-caption-card')).toBeLessThan(html.indexOf('cn-bio-section'));
    expect(html.indexOf('cn-bio-section')).toBeLessThan(html.indexOf('cn-credits-section'));
  });

  it('renders right-aligned external link arrow when websiteUrl is present and valid, and hides it when absent', () => {
    const profileWithUrl: ProfileRenderData = {
      id: 'prof-link-1',
      slug: 'with-link',
      displayName: 'Alex Morgan',
      businesses: [
        {
          id: 'b-1',
          companyName: 'Nova Technologies',
          websiteUrl: 'https://novatech.example',
        },
        {
          id: 'b-2',
          companyName: 'Offline Studio',
          websiteUrl: '',
        },
      ],
      isDemo: false,
    };

    const html = renderToString(
      <CinematicProfileTemplate profile={profileWithUrl} {...baseHandlers} />,
    );

    expect(html).toContain('href="https://novatech.example/"');
    expect(html).toContain('cn-venture-right-action');
    expect(html).toContain('cn-venture-arrow');
    expect(html).toContain('Visit Website');
    // For Offline Studio, it should not render a link tag or external arrow
    expect(html).toContain('Offline Studio');
  });
});
