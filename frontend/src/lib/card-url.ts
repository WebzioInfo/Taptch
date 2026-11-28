import { env } from '../config/env';

/**
 * Single shared helper for building the public NFC card URL: https://{base}/{id}
 */
export function buildCardUrl(id: string): string {
  const base = (env.nfcPublicBaseUrl || env.appUrl || '').trim().replace(/\/+$/, '');
  const cleanId = (id || '').trim();
  if (!cleanId) return base;
  return `${base}/${encodeURIComponent(cleanId)}`;
}

/**
 * Single shared helper for building the public profile URL:
 * https://{base}/p/{slug} (personal) or https://{base}/b/{slug} (business)
 */
export function buildProfileUrl(profile: {
  slug?: string | null;
  profileType?: string | null;
}): string {
  const base = (env.nfcPublicBaseUrl || env.appUrl || '').trim().replace(/\/+$/, '');
  const slug = (profile?.slug || '').trim();
  const prefix = profile?.profileType === 'business' ? 'b' : 'p';
  if (!slug) return base;
  return `${base}/${prefix}/${encodeURIComponent(slug)}`;
}

export function formatCardUrlDisplay(id: string): string {
  const full = buildCardUrl(id);
  return full.replace(/^https?:\/\//i, '');
}

/**
 * Canonical URL resolver for any card object (purchased_cards or cards)
 * across Admin, Customer Dashboard, QR, Copy, and Write-to-Tag flows.
 */
export function resolveCardPublicUrl(card?: {
  cardCode?: string | null;
  urlId?: string | null;
  redirectToken?: string | null;
  id?: string | null;
} | null): string {
  if (!card) return '';
  const identifier = (card.cardCode || card.urlId || card.redirectToken || card.id || '').trim();
  if (!identifier) return '';
  return buildCardUrl(identifier);
}

