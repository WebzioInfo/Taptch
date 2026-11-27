import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import {
  SOCIAL_PLATFORMS,
  buildSocialProfileUrl,
  extractSocialUsername,
  validateSocialUsername,
} from '../modules/social/platforms';
import { CinematicProfileTemplate } from '../components/templates/layouts/CinematicProfileTemplate';
import type { ProfileRenderData } from '../components/templates/ProfileRenderer';

const EXPECTED_URLS: Record<string, string> = {
  instagram: 'https://www.instagram.com/johndoe/',
  facebook: 'https://www.facebook.com/johndoe',
  linkedin: 'https://www.linkedin.com/in/johndoe/',
  twitter: 'https://x.com/johndoe',
  youtube: 'https://www.youtube.com/@johndoe',
  github: 'https://github.com/johndoe',
  tiktok: 'https://www.tiktok.com/@johndoe',
  snapchat: 'https://www.snapchat.com/add/johndoe',
  pinterest: 'https://www.pinterest.com/johndoe/',
  threads: 'https://www.threads.net/@johndoe',
  telegram: 'https://t.me/johndoe',
  twitch: 'https://www.twitch.tv/johndoe',
  medium: 'https://medium.com/@johndoe',
  behance: 'https://www.behance.net/johndoe',
  dribbble: 'https://dribbble.com/johndoe',
  reddit: 'https://www.reddit.com/user/johndoe/',
};

describe('Social Channels — Complete Platform Support & URL Generation', () => {
  it('supports all 16 platforms and generates exact canonical URLs from username', () => {
    expect(SOCIAL_PLATFORMS.length).toBe(16);

    for (const platform of SOCIAL_PLATFORMS) {
      const built = buildSocialProfileUrl(platform.id, 'johndoe');
      expect(built).not.toBeNull();
      expect(built?.url).toBe(EXPECTED_URLS[platform.id]);
      expect(built?.username).toBe('johndoe');

      // Handles leading @ without duplicating @
      const withAt = buildSocialProfileUrl(platform.id, '@johndoe');
      expect(withAt?.url).toBe(EXPECTED_URLS[platform.id]);
      expect(withAt?.username).toBe('johndoe');
    }
  });

  it('extracts usernames cleanly from pasted full profile URLs', () => {
    expect(extractSocialUsername('instagram', 'https://www.instagram.com/john/')).toBe('john');
    expect(extractSocialUsername('linkedin', 'https://www.linkedin.com/in/john/')).toBe('john');
    expect(extractSocialUsername('youtube', 'https://www.youtube.com/@john')).toBe('john');
    expect(extractSocialUsername('snapchat', 'https://www.snapchat.com/add/john')).toBe('john');
    expect(extractSocialUsername('reddit', 'https://www.reddit.com/user/john/')).toBe('john');
  });

  it('rejects empty usernames, spaces, and unsafe protocols', () => {
    expect(validateSocialUsername('instagram', '').valid).toBe(false);
    expect(validateSocialUsername('github', 'bad user').valid).toBe(false);
    expect(buildSocialProfileUrl('instagram', 'javascript:alert(1)')).toBeNull();
  });

  it('renders all configured social platforms in CinematicProfileTemplate without duplicates', () => {
    const profile: ProfileRenderData = {
      id: 'social-test',
      slug: 'john',
      displayName: 'John Doe',
      socialLinks: [
        { platform: 'instagram', url: 'https://www.instagram.com/john/' },
        { platform: 'github', url: 'https://github.com/john' },
        { platform: 'linkedin', url: 'https://www.linkedin.com/in/john/' },
        { platform: 'instagram', url: 'https://www.instagram.com/duplicate/' },
      ],
      isDemo: false,
      isEmbedded: true,
    };

    const html = renderToString(
      React.createElement(CinematicProfileTemplate, {
        profile,
        onDownloadVCard: vi.fn(),
        onOpenExchange: vi.fn(),
        onOpenQr: vi.fn(),
        copiedUrl: false,
        onCopyLink: vi.fn(),
      }),
    );

    expect(html).toContain('https://www.instagram.com/john/');
    expect(html).toContain('https://github.com/john');
    expect(html).toContain('https://www.linkedin.com/in/john/');
    expect(html).not.toContain('duplicate');
  });
});
