import { eq, and } from 'drizzle-orm';
import { createHash, randomBytes } from 'node:crypto';
import { db } from '@/db';
import { cards, cardEvents, cardAssignments } from '@/db/schema/cards';
import { profiles } from '@/db/schema/profiles';
import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';

export interface RedirectTarget {
  status: 'active' | 'unclaimed' | 'lost' | 'deactivated' | 'not_found';
  slug?: string;
  cardId?: string;
  profileId?: string;
  redirectToken?: string;
}

export interface RecordEventParams {
  cardId?: string;
  profileId?: string;
  eventType: 'nfc_open' | 'qr_scan' | 'profile_view';
  ip?: string;
  userAgent?: string;
  referrer?: string;
  country?: string;
  city?: string;
}

export class CardNotFoundError extends Error {
  constructor(identifier: string) {
    super(`Card with identifier or token "${identifier}" was not found.`);
    this.name = 'CardNotFoundError';
  }
}

export class CardAlreadyClaimedError extends Error {
  constructor(serialNumber: string) {
    super(`Card with serial "${serialNumber}" has already been claimed.`);
    this.name = 'CardAlreadyClaimedError';
  }
}

export class InvalidActivationCodeError extends Error {
  constructor() {
    super('The provided card activation code is invalid.');
    this.name = 'InvalidActivationCodeError';
  }
}

/**
 * Hash activation code securely using SHA-256
 */
export function hashActivationCode(code: string): string {
  return createHash('sha256').update(code.trim().toUpperCase()).digest('hex');
}

/**
 * Anonymize visitor IP with a daily rotating salt to comply with DPDP Act and privacy mandates
 */
export function anonymizeVisitorIp(ip?: string): string {
  const dayString = new Date().toISOString().slice(0, 10);
  const salt = process.env.VISITOR_SALT_SECRET || 'tappzio-visitor-salt-2026';
  return createHash('sha256')
    .update(`${ip || '127.0.0.1'}-${dayString}-${salt}`)
    .digest('hex')
    .slice(0, 32);
}

/**
 * Resolves an unguessable redirect token to its active target profile slug.
 * High-performance edge cache lookup via Redis (<50ms target).
 */
export async function resolveRedirectToken(token: string): Promise<RedirectTarget> {
  const cacheKey = `nfc:token:${token}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as RedirectTarget;
    }
  } catch (err) {
    logger.warn({ err }, 'Redis read error during redirect token lookup, falling back to DB');
  }

  // Database lookup
  const [row] = await db
    .select({
      cardId: cards.id,
      status: cards.status,
      serialNumber: cards.serialNumber,
      profileId: cards.profileId,
      slug: profiles.slug,
    })
    .from(cards)
    .leftJoin(profiles, eq(cards.profileId, profiles.id))
    .where(eq(cards.redirectToken, token))
    .limit(1);

  if (!row) {
    return { status: 'not_found' };
  }

  const result: RedirectTarget = {
    status: row.status as RedirectTarget['status'],
    cardId: row.cardId,
    profileId: row.profileId || undefined,
    slug: row.slug || undefined,
    redirectToken: token,
  };

  // Cache active redirects for 1 hour; unclaimed for 5 minutes
  try {
    const ttl = result.status === 'active' ? 3600 : 300;
    await redis.set(cacheKey, JSON.stringify(result), 'EX', ttl);
  } catch (err) {
    logger.warn({ err }, 'Redis cache set failed during token lookup');
  }

  return result;
}

/**
 * Record a high-volume telemetry event (NFC tap, QR scan, or direct profile view)
 */
export async function recordCardEvent(params: RecordEventParams): Promise<void> {
  try {
    const visitorHash = anonymizeVisitorIp(params.ip);
    const eventId = `evt_${Date.now()}_${randomBytes(4).toString('hex')}`;

    // Simple heuristic parser for user agent
    const ua = params.userAgent || '';
    const isMobile = /mobile|iphone|android|ipad/i.test(ua);
    const isTablet = /tablet|ipad/i.test(ua);
    const deviceCategory = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';

    let browser = 'other';
    if (/chrome|crios/i.test(ua)) browser = 'chrome';
    else if (/safari/i.test(ua)) browser = 'safari';
    else if (/firefox/i.test(ua)) browser = 'firefox';
    else if (/edg/i.test(ua)) browser = 'edge';

    let os = 'other';
    if (/iphone|ipad|ipod/i.test(ua)) os = 'ios';
    else if (/android/i.test(ua)) os = 'android';
    else if (/macintosh|mac os x/i.test(ua)) os = 'macos';
    else if (/windows/i.test(ua)) os = 'windows';
    else if (/linux/i.test(ua)) os = 'linux';

    await db.insert(cardEvents).values({
      id: eventId,
      cardId: params.cardId || null,
      profileId: params.profileId || null,
      eventType: params.eventType,
      deviceCategory,
      browser,
      os,
      country: params.country || 'IN',
      city: params.city || null,
      referrer: params.referrer || null,
      visitorHash,
    });
  } catch (err) {
    logger.error({ err }, 'Failed to record card event telemetry');
  }
}

/**
 * Claim an unactivated physical card using its secret activation code
 */
export async function claimCard(
  actorId: string,
  activationCode: string,
  profileId?: string
): Promise<{ cardId: string; serialNumber: string }> {
  const codeHash = hashActivationCode(activationCode);

  const [card] = await db
    .select()
    .from(cards)
    .where(eq(cards.activationCodeHash, codeHash))
    .limit(1);

  if (!card) {
    throw new InvalidActivationCodeError();
  }

  if (card.status !== 'unclaimed' && card.ownerUserId !== null && card.ownerUserId !== actorId) {
    throw new CardAlreadyClaimedError(card.serialNumber);
  }

  await db
    .update(cards)
    .set({
      ownerUserId: actorId,
      profileId: profileId || card.profileId || null,
      status: 'active',
      activatedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(cards.id, card.id));

  // Invalidate Redis token cache
  try {
    await redis.del(`nfc:token:${card.redirectToken}`);
  } catch (err) {
    logger.warn({ err }, 'Failed to clear token cache after claiming card');
  }

  return { cardId: card.id, serialNumber: card.serialNumber };
}

/**
 * Link an owned physical card to a specific digital profile
 */
export async function linkCardToProfile(
  actorId: string,
  cardId: string,
  profileId: string
): Promise<void> {
  const [card] = await db
    .select()
    .from(cards)
    .where(and(eq(cards.id, cardId), eq(cards.ownerUserId, actorId)))
    .limit(1);

  if (!card) {
    throw new CardNotFoundError(cardId);
  }

  await db
    .update(cards)
    .set({
      profileId,
      status: 'active',
      updatedAt: new Date(),
    })
    .where(eq(cards.id, cardId));

  // Log card assignment audit entry
  const assignmentId = `asgn_${Date.now()}_${randomBytes(4).toString('hex')}`;
  await db.insert(cardAssignments).values({
    id: assignmentId,
    cardId,
    profileId,
    assignedBy: actorId,
    reason: 'user_profile_link',
  });

  // Clear Redis cache
  try {
    await redis.del(`nfc:token:${card.redirectToken}`);
  } catch (err) {
    logger.warn({ err }, 'Failed to clear token cache after linking profile');
  }
}

/**
 * Retrieve all physical cards owned by a user
 */
export async function listUserCards(userId: string) {
  return await db
    .select({
      id: cards.id,
      serialNumber: cards.serialNumber,
      material: cards.material,
      chipType: cards.chipType,
      status: cards.status,
      redirectToken: cards.redirectToken,
      profileId: cards.profileId,
      profileName: profiles.displayName,
      profileSlug: profiles.slug,
      activatedAt: cards.activatedAt,
      createdAt: cards.createdAt,
    })
    .from(cards)
    .leftJoin(profiles, eq(cards.profileId, profiles.id))
    .where(eq(cards.ownerUserId, userId));
}

