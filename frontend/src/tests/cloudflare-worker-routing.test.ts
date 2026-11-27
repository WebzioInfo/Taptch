import { describe, it, expect } from 'vitest';
import {
  classifyRequest,
  isValidPublicUsername,
  RESERVED_USERNAMES as WORKER_RESERVED,
} from '../../../cloudflare/taptch-profile-proxy/src/worker';
import { RESERVED_USERNAMES as FRONTEND_RESERVED } from '../config/reservedUsernames';

describe('Cloudflare Worker — Public Profile & Coming Soon Routing Rules', () => {
  it('stays synchronized with frontend RESERVED_USERNAMES', () => {
    for (const key of FRONTEND_RESERVED) {
      expect(WORKER_RESERVED.has(key)).toBe(true);
    }
  });

  it('preserves Coming Soon homepage, CSS, JS, favicon, SEO files, and /sw.js', () => {
    const comingSoonPaths = [
      'https://taptch.com/',
      'https://www.taptch.com/',
      'https://taptch.com/style.css',
      'https://taptch.com/script.js',
      'https://taptch.com/favicon.ico',
      'https://taptch.com/robots.txt',
      'https://taptch.com/sitemap.xml',
      'https://taptch.com/sw.js',
    ];

    for (const rawUrl of comingSoonPaths) {
      expect(classifyRequest(new URL(rawUrl))).toEqual({
        action: 'passthrough',
        reason: 'coming_soon',
      });
    }
  });

  it('proxies valid public profile usernames on both apex and www domains', () => {
    expect(classifyRequest(new URL('https://taptch.com/sinan'))).toEqual({
      action: 'proxy',
      reason: 'public_profile',
    });
    expect(classifyRequest(new URL('https://www.taptch.com/shareef'))).toEqual({
      action: 'proxy',
      reason: 'public_profile',
    });
    expect(classifyRequest(new URL('https://taptch.com/invalid-username-xyz?src=nfc'))).toEqual({
      action: 'proxy',
      reason: 'public_profile',
    });
  });

  it('proxies required Vite/SPA assets without proxying Coming Soon assets', () => {
    expect(classifyRequest(new URL('https://taptch.com/assets/index-DMY7DQnf.js'))).toEqual({
      action: 'proxy',
      reason: 'spa_asset',
    });
    expect(classifyRequest(new URL('https://taptch.com/assets/index-DFlobFE7.css'))).toEqual({
      action: 'proxy',
      reason: 'spa_asset',
    });
    expect(classifyRequest(new URL('https://taptch.com/products/metal-gold.svg'))).toEqual({
      action: 'proxy',
      reason: 'spa_asset',
    });
    expect(classifyRequest(new URL('https://taptch.com/manifest.webmanifest'))).toEqual({
      action: 'proxy',
      reason: 'spa_asset',
    });
    expect(classifyRequest(new URL('https://taptch.com/taptch-logo-orange.png'))).toEqual({
      action: 'proxy',
      reason: 'spa_asset',
    });
  });

  it('proxies legacy NFC token routes (/p/:token, /b/:token, /nfc/:token)', () => {
    expect(classifyRequest(new URL('https://taptch.com/p/50f8b595acd3'))).toEqual({
      action: 'proxy',
      reason: 'legacy_nfc',
    });
    expect(classifyRequest(new URL('https://taptch.com/b/50f8b595acd3'))).toEqual({
      action: 'proxy',
      reason: 'legacy_nfc',
    });
    expect(classifyRequest(new URL('https://taptch.com/nfc/50f8b595acd3'))).toEqual({
      action: 'proxy',
      reason: 'legacy_nfc',
    });
  });

  it('never proxies reserved auth, dashboard, or API routes', () => {
    const reservedPaths = [
      'https://taptch.com/login',
      'https://taptch.com/register',
      'https://taptch.com/dashboard',
      'https://taptch.com/admin',
      'https://taptch.com/checkout',
      'https://taptch.com/orders',
      'https://taptch.com/api/health',
      'https://taptch.com/auth/callback',
      'https://taptch.com/studio',
      'https://taptch.com/builder/new',
    ];

    for (const rawUrl of reservedPaths) {
      expect(classifyRequest(new URL(rawUrl)).action).toBe('passthrough');
    }
  });

  it('prevents proxy loops on the upstream hostname', () => {
    expect(classifyRequest(new URL('https://taptch.webziotech.in/sinan'))).toEqual({
      action: 'passthrough',
      reason: 'upstream_host',
    });
  });

  it('validates username rules consistently', () => {
    expect(isValidPublicUsername('sinan')).toBe(true);
    expect(isValidPublicUsername('shareef')).toBe(true);
    expect(isValidPublicUsername('ab')).toBe(false);
    expect(isValidPublicUsername('-sinan')).toBe(false);
    expect(isValidPublicUsername('sinan--dev')).toBe(false);
    expect(isValidPublicUsername('login')).toBe(false);
  });
});
