import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { getSocialPlatformIcon, SOCIAL_BRAND_COLORS } from '../lib/social-icons';
import { validateSocialUsername, getSocialPlatform } from '../modules/social/platforms';
import { SocialLinksSection } from '../components/profile/SocialLinksSection';
import { CinematicProfileTemplate } from '../components/templates/layouts/CinematicProfileTemplate';
import { DarkPremiumTemplate } from '../components/templates/layouts/DarkPremiumTemplate';
import { ProfessionalServicesTemplate } from '../components/templates/layouts/ProfessionalServicesTemplate';
import type { ProfileRenderData } from '../components/templates/ProfileRenderer';

const ALL_16_CHANNELS = [
  'instagram',
  'facebook',
  'linkedin',
  'twitter',
  'youtube',
  'github',
  'tiktok',
  'snapchat',
  'pinterest',
  'threads',
  'telegram',
  'twitch',
  'medium',
  'behance',
  'dribbble',
  'reddit',
] as const;

function makeProfile(overrides: Partial<ProfileRenderData> = {}): ProfileRenderData {
  return {
    id: 'prof_polish_1',
    slug: 'alex-mercer',
    displayName: 'Alex Mercer',
    headline: 'Founder & Architect',
    bio: 'Building digital products.',
    profileType: 'personal',
    templateId: 'cinematic-noir',
    phone: '+91 98765 43210',
    whatsapp: '+91 98765 43210',
    email: 'alex@example.com',
    location: 'Bengaluru, India',
    socialLinks: ALL_16_CHANNELS.map((platform, idx) => ({
      id: `soc-${idx}`,
      platform,
      url: `alex${idx}`,
    })),
    businesses: [
      {
        id: 'biz-1',
        companyName: 'Alpha Studio',
        roleTitle: 'Founder',
        description: 'Design systems',
        websiteUrl: 'https://alpha.example',
      },
      {
        id: 'biz-2',
        companyName: 'Beta Labs',
        roleTitle: 'Advisor',
        description: 'Hardware engineering',
        websiteUrl: 'https://beta.example',
      },
    ],
    customFields: {
      skipIntro: true,
    },
    ...overrides,
  };
}

describe('Profile Template UI Polish: WhatsApp, Social Brand Icons & Ventures', () => {
  it('renders recognizable WhatsApp brand icon in dark and light templates', () => {
    const profile = makeProfile();
    const handlers = {
      onDownloadVCard: vi.fn(),
      onOpenExchange: vi.fn(),
      onOpenQr: vi.fn(),
      copiedUrl: false,
      onCopyLink: vi.fn(),
    };

    const cinematicHtml = renderToString(
      <CinematicProfileTemplate profile={profile} {...handlers} />,
    );
    expect(cinematicHtml).toContain('text-[#25D366]');
    expect(cinematicHtml).toContain('M12.031 2c-5.516 0-9.969');
    expect(cinematicHtml).toContain('WhatsApp');

    const darkHtml = renderToString(
      <DarkPremiumTemplate profile={profile} {...handlers} />,
    );
    expect(darkHtml).toContain('text-[#25D366]');
    expect(darkHtml).toContain('M12.031 2c-5.516 0-9.969');

    const lightHtml = renderToString(
      <ProfessionalServicesTemplate profile={profile} {...handlers} />,
    );
    expect(lightHtml).toContain('text-[#25D366]');
    expect(lightHtml).toContain('M12.031 2c-5.516 0-9.969');
  });

  it('renders distinct recognizable brand SVG logos for all 16 social channels', () => {
    const renderedSvgs = ALL_16_CHANNELS.map((platform) => {
      const html = renderToString(
        getSocialPlatformIcon(platform, 'w-4 h-4', 16, { branded: true }),
      );
      expect(html).toContain('<svg');
      if (SOCIAL_BRAND_COLORS[platform]) {
        expect(html).toContain(SOCIAL_BRAND_COLORS[platform]!);
      }
      return html;
    });

    // Ensure all 16 icons are distinct SVGs (no fallback collisions)
    expect(new Set(renderedSvgs).size).toBe(ALL_16_CHANNELS.length);

    const sectionHtml = renderToString(
      <SocialLinksSection
        socialLinks={ALL_16_CHANNELS.map((platform, idx) => ({
          id: `s-${idx}`,
          platform,
          url: `user${idx}`,
        }))}
      />,
    );
    expect(sectionHtml).toContain('Threads');
    expect(sectionHtml).toContain('Twitch');
    expect(sectionHtml).toContain('Medium');
    expect(sectionHtml).toContain('Reddit');
    expect(sectionHtml).toContain('https://threads.net/@user9');
    expect(sectionHtml).toContain('https://twitch.tv/user11');
    expect(sectionHtml).toContain('https://medium.com/@user12');
    expect(sectionHtml).toContain('https://reddit.com/u/user15');

    const cinematicHtml = renderToString(
      <CinematicProfileTemplate
        profile={makeProfile()}
        onDownloadVCard={vi.fn()}
        onOpenExchange={vi.fn()}
        onOpenQr={vi.fn()}
        copiedUrl={false}
        onCopyLink={vi.fn()}
      />,
    );
    expect(cinematicHtml).toContain('https://www.threads.net/@alex9');
    expect(cinematicHtml).toContain('https://www.reddit.com/user/alex15');
  });

  it('removes automatic venture numbering while preserving venture content and links', () => {
    const html = renderToString(
      <CinematicProfileTemplate
        profile={makeProfile()}
        onDownloadVCard={vi.fn()}
        onOpenExchange={vi.fn()}
        onOpenQr={vi.fn()}
        copiedUrl={false}
        onCopyLink={vi.fn()}
      />,
    );

    expect(html).not.toContain('cn-venture-num');
    expect(html).not.toContain('Venture #');
    expect(html).toContain('Alpha Studio');
    expect(html).toContain('Beta Labs');
    expect(html).toContain('https://alpha.example');
    expect(html).toContain('https://beta.example');
  });

  it('enforces platform-specific validation (e.g. X rejects dots like ft.sanoof, accepts underscores)', () => {
    expect(getSocialPlatform('x')?.id).toBe('twitter');
    expect(validateSocialUsername('twitter', 'ft.sanoof').valid).toBe(false);
    expect(validateSocialUsername('twitter', 'sanoof_dev').valid).toBe(true);
    expect(validateSocialUsername('instagram', 'ft.sanoof').valid).toBe(true);
    expect(validateSocialUsername('threads', 'ft.sanoof').valid).toBe(true);
    expect(validateSocialUsername('reddit', 'u/alex_dev').valid).toBe(true);
  });
});
