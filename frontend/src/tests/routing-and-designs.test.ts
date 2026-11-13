import { describe, it, expect } from 'vitest';
import { isReservedUsername, RESERVED_USERNAMES } from '../config/reservedUsernames';
import { STANDARD_TEMPLATES } from '../modules/templates/constants';

describe('Public Profile Dynamic Routing & Reserved Slugs', () => {
  it('correctly protects all system routes from being claimed as usernames', () => {
    expect(isReservedUsername('dashboard')).toBe(true);
    expect(isReservedUsername('admin')).toBe(true);
    expect(isReservedUsername('support')).toBe(true);
    expect(isReservedUsername('login')).toBe(true);
    expect(isReservedUsername('register')).toBe(true);
    expect(isReservedUsername('api')).toBe(true);
    expect(isReservedUsername('settings')).toBe(true);
    expect(isReservedUsername('templates')).toBe(true);
    expect(isReservedUsername('sitemap.xml')).toBe(true);
    expect(isReservedUsername('robots.txt')).toBe(true);
  });

  it('permits valid user identity handles', () => {
    expect(isReservedUsername('sanoof')).toBe(false);
    expect(isReservedUsername('abdullah')).toBe(false);
    expect(isReservedUsername('webzio')).toBe(false);
    expect(isReservedUsername('john_smith')).toBe(false);
    expect(isReservedUsername('apex-ventures')).toBe(false);
  });

  it('normalizes leading slashes and whitespace when checking reserved names', () => {
    expect(isReservedUsername('/admin/')).toBe(true);
    expect(isReservedUsername('  login  ')).toBe(true);
    expect(isReservedUsername('/sanoof/')).toBe(false);
  });
});

describe('Public Profile Loading State Machine & Error Classification', () => {
  const classifyProfileError = (errorMsg: string, isTimeout: boolean): 'not_found' | 'error' => {
    if (isTimeout) return 'error';
    if (
      errorMsg.includes('not found') ||
      errorMsg.includes('404') ||
      errorMsg.includes('Not Found')
    ) {
      return 'not_found';
    }
    return 'error';
  };

  it('accurately classifies 404 responses as not_found', () => {
    expect(classifyProfileError('Profile "unknown" not found.', false)).toBe('not_found');
    expect(classifyProfileError('Request failed with status 404', false)).toBe('not_found');
  });

  it('accurately classifies network failures and 500 server errors as error with retry', () => {
    expect(classifyProfileError('Internal server error', false)).toBe('error');
    expect(classifyProfileError('Failed to fetch', false)).toBe('error');
    expect(classifyProfileError('', true)).toBe('error');
  });
});

describe('Design Systems Migration & Templates Registry', () => {
  it('includes all 4 personal design templates in standard catalog', () => {
    const templateIds = STANDARD_TEMPLATES.map((t) => t.id);
    expect(templateIds).toContain('clean-corporate');
    expect(templateIds).toContain('dark-premium');
    expect(templateIds).toContain('soft-modern');
    expect(templateIds).toContain('bold-editorial');
  });

  it('verifies distinct design tokens and fonts across all 4 templates', () => {
    const corporate = STANDARD_TEMPLATES.find((t) => t.id === 'clean-corporate');
    const dark = STANDARD_TEMPLATES.find((t) => t.id === 'dark-premium');
    const soft = STANDARD_TEMPLATES.find((t) => t.id === 'soft-modern');
    const editorial = STANDARD_TEMPLATES.find((t) => t.id === 'bold-editorial');

    expect(corporate?.defaultThemeConfig.fontFamily).toBe('Inter');
    expect(corporate?.defaultThemeConfig.primaryColor).toBe('#0A2540');

    expect(dark?.defaultThemeConfig.fontFamily).toBe('Plus Jakarta Sans');
    expect(dark?.defaultThemeConfig.primaryColor).toBe('#C5A880');

    expect(soft?.defaultThemeConfig.fontFamily).toBe('Fraunces');
    expect(soft?.defaultThemeConfig.primaryColor).toBe('#24352D');

    expect(editorial?.defaultThemeConfig.fontFamily).toBe('Space Grotesk');
    expect(editorial?.defaultThemeConfig.primaryColor).toBe('#000000');
  });
});

