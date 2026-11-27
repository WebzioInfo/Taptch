import { describe, it, expect } from 'vitest';
import { isReservedUsername, RESERVED_USERNAMES } from '../config/reservedUsernames';
import { STANDARD_TEMPLATES, getTemplateDefaultThemeConfig } from '../modules/templates/constants';

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
  it('includes the active Phase 1 cinematic template in standard catalog', () => {
    const templateIds = STANDARD_TEMPLATES.map((t) => t.id);
    expect(templateIds).toEqual(['cinematic-noir']);
  });

  it('verifies design tokens and typography for Cinematic Digital Profile', () => {
    const cinematic = STANDARD_TEMPLATES.find((t) => t.id === 'cinematic-noir');
    const theme = getTemplateDefaultThemeConfig('cinematic-noir');
    expect(cinematic?.defaultColors.primary).toBe('#0866F8');
    expect(cinematic?.defaultColors.background).toBe('#0A0A0B');
    expect(theme.primary).toBe('#0866F8');
    expect(theme.background).toBe('#0A0A0B');
  });
});

