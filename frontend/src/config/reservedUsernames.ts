/**
 * Centralized list of reserved system routes and keywords.
 * Root-level dynamic profile routes (/:username) must never conflict with these.
 * Keep synchronized with backend/src/common/constants/reserved-usernames.ts and frontend/src/routes/index.tsx.
 */
export const RESERVED_USERNAMES = new Set<string>([
  '',
  'api',
  'auth',
  'oauth',
  'login',
  'signin',
  'sign-in',
  'register',
  'signup',
  'sign-up',
  'forgot-password',
  'reset-password',
  'staff',
  'admin',
  'superadmin',
  'support',
  'portal-x',
  'dashboard',
  'cards',
  'card',
  'leads',
  'lead',
  'qr',
  'dq',
  'settings',
  'builder',
  'claim',
  'studio',
  'checkout',
  'orders',
  'order',
  'products',
  'product',
  'nfc',
  'nfc-cards',
  'journey',
  'profile-setup',
  'templates',
  'template',
  'pricing',
  'features',
  'how-it-works',
  'about',
  'contact',
  'faq',
  'nfc-business-card',
  'digital-business-card',
  'p',
  'b',
  'profile',
  'profiles',
  'assets',
  'static',
  'public',
  'branding',
  'icons',
  'images',
  'sitemap',
  'sitemap.xml',
  'robots',
  'robots.txt',
  'manifest',
  'manifest.json',
  'manifest.webmanifest',
  'favicon',
  'favicon.ico',
  'service-worker',
  'sw.js',
  'health',
  'docs',
  'swagger',
]);

export function isReservedUsername(username: string): boolean {
  if (!username) return true;
  const clean = username.toLowerCase().trim().replace(/^\/+|\/+$/g, '');
  return RESERVED_USERNAMES.has(clean);
}

export function validateUsernameFormat(username: string): string | null {
  if (!username || !username.trim()) return 'Username is required.';
  const clean = username.toLowerCase().trim();
  if (clean.length < 3) return 'Username must be at least 3 characters.';
  if (clean.length > 32) return 'Username must be at most 32 characters.';
  if (/\s/.test(clean)) return 'Username must not contain spaces.';
  if (!/^[a-z0-9-]+$/.test(clean)) {
    return 'Username may only contain lowercase letters, numbers, and hyphens.';
  }
  if (clean.startsWith('-') || clean.endsWith('-')) {
    return 'Username must not start or end with a hyphen.';
  }
  if (/--/.test(clean)) {
    return 'Username must not contain consecutive hyphens.';
  }
  if (isReservedUsername(clean)) {
    return `"${clean}" is reserved and cannot be used as a username.`;
  }
  return null;
}
