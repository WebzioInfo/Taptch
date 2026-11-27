/**
 * TAPTCH — Cloudflare Worker Public Profile Reverse Proxy
 *
 * Keeps `https://taptch.com/` as the Coming Soon website while transparently
 * proxying public profile URLs (`https://taptch.com/{username}`) and required
 * SPA assets to `https://taptch.webziotech.in` without changing the browser URL.
 *
 * IMPORTANT:
 * - Primary loop prevention: upstream hostname (`taptch.webziotech.in`) is distinct
 *   from incoming hostnames (`taptch.com` / `www.taptch.com`). Requests already on
 *   `taptch.webziotech.in` are never proxied.
 * - `/sw.js` is intentionally NOT proxied so the PWA service worker cannot cache
 *   Coming Soon's `/` or `style.css` / `script.js` on `taptch.com`.
 */

export const UPSTREAM_ORIGIN = 'https://taptch.webziotech.in';
export const UPSTREAM_HOSTNAME = 'taptch.webziotech.in';

/**
 * Keep synchronized with:
 * - frontend/src/config/reservedUsernames.ts
 * - backend/src/common/constants/reserved-usernames.ts
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

const EXACT_SPA_ASSET_PATHS = new Set<string>([
  '/manifest.webmanifest',
  '/taptch-logo-orange.png',
  '/card-matte.png',
  '/avatar.svg',
]);

const SPA_ASSET_PREFIXES = ['/assets/', '/products/'];
const LEGACY_NFC_PREFIXES = ['/p/', '/b/', '/nfc/', '/claim/'];

export function isValidPublicUsername(segment: string): boolean {
  if (!segment) return false;
  const clean = segment.toLowerCase();
  if (clean.length < 3 || clean.length > 32) return false;
  if (clean.includes('--')) return false;
  if (RESERVED_USERNAMES.has(clean)) return false;
  return /^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/.test(clean) || /^[a-z0-9]{3,32}$/.test(clean);
}

export type RouteDecision =
  | { action: 'proxy'; reason: 'spa_asset' | 'legacy_nfc' | 'public_profile' }
  | { action: 'passthrough'; reason: 'upstream_host' | 'coming_soon' | 'reserved_or_non_profile' };

export function classifyRequest(url: URL): RouteDecision {
  // Primary loop prevention: never proxy if already targeting upstream hostname
  if (url.hostname.toLowerCase() === UPSTREAM_HOSTNAME) {
    return { action: 'passthrough', reason: 'upstream_host' };
  }

  const pathname = url.pathname;

  // Preserve Coming Soon homepage and its assets/SEO files + block /sw.js from interfering
  if (
    pathname === '/' ||
    pathname === '/style.css' ||
    pathname === '/script.js' ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/sw.js'
  ) {
    return { action: 'passthrough', reason: 'coming_soon' };
  }

  // Proxy required Vite/SPA assets so public profile pages render cleanly on taptch.com
  if (
    EXACT_SPA_ASSET_PATHS.has(pathname) ||
    SPA_ASSET_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  ) {
    return { action: 'proxy', reason: 'spa_asset' };
  }

  // Proxy legacy NFC token & claim routes (/p/:key, /b/:key, /nfc/:token, /claim/:token)
  if (LEGACY_NFC_PREFIXES.some((prefix) => pathname.startsWith(prefix) && pathname.length > prefix.length)) {
    const rest = pathname.slice(pathname.indexOf('/', 1) + 1);
    if (rest && !rest.includes('/')) {
      return { action: 'proxy', reason: 'legacy_nfc' };
    }
  }

  // Proxy single-segment public profile usernames: /{username}
  const trimmed = pathname.replace(/^\/+|\/+$/g, '');
  if (!trimmed.includes('/') && isValidPublicUsername(trimmed)) {
    return { action: 'proxy', reason: 'public_profile' };
  }

  // All other routes (/login, /register, /dashboard, /api, etc.) stay untouched
  return { action: 'passthrough', reason: 'reserved_or_non_profile' };
}

export async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const decision = classifyRequest(url);

  if (decision.action === 'passthrough') {
    return fetch(request);
  }

  const upstreamUrl = new URL(url.pathname + url.search, UPSTREAM_ORIGIN);
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.set('x-forwarded-host', url.host);
  headers.set('x-forwarded-proto', url.protocol.replace(':', ''));

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: 'manual',
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = request.body;
  }

  const upstreamResponse = await fetch(upstreamUrl.toString(), init);

  // Clone headers and rewrite any Location header leaking taptch.webziotech.in
  const responseHeaders = new Headers(upstreamResponse.headers);
  const location = responseHeaders.get('location');
  if (location) {
    try {
      const locUrl = new URL(location, UPSTREAM_ORIGIN);
      if (locUrl.hostname.toLowerCase() === UPSTREAM_HOSTNAME) {
        locUrl.protocol = url.protocol;
        locUrl.host = url.host;
        responseHeaders.set('location', locUrl.toString());
      }
    } catch {
      // Relative Location header already stays on taptch.com
    }
  }

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  });
}

export default {
  async fetch(request: Request): Promise<Response> {
    return handleRequest(request);
  },
};
