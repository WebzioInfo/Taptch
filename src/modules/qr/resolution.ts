import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { qrCodes, qrScanEvents } from '@/db/schema/qr';
import { profiles } from '@/db/schema/profiles';
import { cards } from '@/db/schema/cards';
import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { ResolveQRTarget, RecordQRScanParams } from './types';
import { anonymizeVisitorIp } from './token';

/**
 * Checks if a destination URL is safe to redirect to (prevents open redirects and SSRF attacks).
 */
export function validateTargetUrl(rawUrl: string): { isValid: boolean; sanitizedUrl?: string; error?: string } {
  try {
    const trimmed = rawUrl.trim();
    const parsed = new URL(trimmed);

    // Whitelist allowed protocols
    const allowedProtocols = ['https:', 'http:', 'tel:', 'mailto:'];
    if (!allowedProtocols.includes(parsed.protocol)) {
      return { isValid: false, error: `Protocol "${parsed.protocol}" is not permitted.` };
    }

    // SSRF protection: Block private IP ranges and localhost in production
    const hostname = parsed.hostname.toLowerCase();
    const isLocalOrPrivate =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.local') ||
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^169\.254\.\d{1,3}\.\d{1,3}$/.test(hostname);

    if (process.env.NODE_ENV === 'production' && isLocalOrPrivate) {
      return { isValid: false, error: 'Private IP addresses and local networks are blocked.' };
    }

    return { isValid: true, sanitizedUrl: parsed.toString() };
  } catch {
    return { isValid: false, error: 'Invalid URL format.' };
  }
}

/**
 * Resolves a dynamic QR token to its configured destination.
 * Employs Redis edge cache (<50ms) with database fallback.
 */
export async function resolveQRToken(token: string): Promise<ResolveQRTarget> {
  const cacheKey = `qr:token:${token}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as ResolveQRTarget;
    }
  } catch (err) {
    logger.warn({ err }, 'Redis error during QR token lookup, falling back to database');
  }

  // 1. Primary lookup in qr_codes table
  const [qrRow] = await db
    .select({
      id: qrCodes.id,
      status: qrCodes.status,
      token: qrCodes.token,
      destinationType: qrCodes.destinationType,
      targetUrl: qrCodes.targetUrl,
      destinationPayload: qrCodes.destinationPayload,
      profileId: qrCodes.profileId,
      profileSlug: profiles.slug,
    })
    .from(qrCodes)
    .leftJoin(profiles, eq(qrCodes.profileId, profiles.id))
    .where(eq(qrCodes.token, token))
    .limit(1);

  if (qrRow) {
    if (qrRow.status === 'disabled' || qrRow.status === 'archived') {
      return { status: qrRow.status as 'disabled' | 'archived', token };
    }

    if (qrRow.status === 'available') {
      return { status: 'available', qrId: qrRow.id, token };
    }

    // Determine final redirect URL based on destination type
    let redirectUrl: string | undefined;

    switch (qrRow.destinationType) {
      case 'url': {
        if (qrRow.targetUrl) {
          const validated = validateTargetUrl(qrRow.targetUrl);
          if (validated.isValid && validated.sanitizedUrl) {
            redirectUrl = validated.sanitizedUrl;
          }
        }
        break;
      }
      case 'whatsapp': {
        if (qrRow.destinationPayload) {
          try {
            const payload = JSON.parse(qrRow.destinationPayload) as { phone?: string; message?: string };
            const cleanPhone = (payload.phone || '').replace(/[^0-9]/g, '');
            const encodedMsg = encodeURIComponent(payload.message || '');
            redirectUrl = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
          } catch {
            // fallback
          }
        }
        break;
      }
      case 'profile':
      default: {
        if (qrRow.profileSlug) {
          redirectUrl = `/p/${qrRow.profileSlug}?ref=qr`;
        }
        break;
      }
    }

    const result: ResolveQRTarget = {
      status: 'active',
      qrId: qrRow.id,
      destinationType: qrRow.destinationType as ResolveQRTarget['destinationType'],
      redirectUrl,
      slug: qrRow.profileSlug || undefined,
      profileId: qrRow.profileId,
      token,
    };

    // Cache active resolved targets in Redis for 120 seconds
    try {
      await redis.set(cacheKey, JSON.stringify(result), 'EX', 120);
    } catch {
      // ignore redis write error
    }

    return result;
  }

  // 2. Legacy fallback to cards table (backward compatibility for physical NFC/QR cards)
  const [cardRow] = await db
    .select({
      id: cards.id,
      status: cards.status,
      profileId: cards.profileId,
      slug: profiles.slug,
    })
    .from(cards)
    .leftJoin(profiles, eq(cards.profileId, profiles.id))
    .where(eq(cards.redirectToken, token))
    .limit(1);

  if (cardRow) {
    if (cardRow.status === 'active' && cardRow.slug) {
      const legacyResult: ResolveQRTarget = {
        status: 'active',
        qrId: cardRow.id,
        destinationType: 'profile',
        redirectUrl: `/p/${cardRow.slug}?ref=qr`,
        slug: cardRow.slug,
        profileId: cardRow.profileId,
        token,
      };
      return legacyResult;
    }
    if (cardRow.status === 'unclaimed') {
      return { status: 'available', qrId: cardRow.id, token };
    }
    return { status: 'disabled', token };
  }

  return { status: 'not_found', token };
}

/**
 * Detects whether incoming User-Agent belongs to a crawler/preview bot.
 */
export function isBotCrawler(userAgent?: string): boolean {
  if (!userAgent) return false;
  const lower = userAgent.toLowerCase();
  return (
    lower.includes('bot') ||
    lower.includes('crawl') ||
    lower.includes('spider') ||
    lower.includes('whatsapp') ||
    lower.includes('facebookexternalhit') ||
    lower.includes('twitterbot') ||
    lower.includes('linkedinbot') ||
    lower.includes('slackbot') ||
    lower.includes('telegrambot') ||
    lower.includes('discordbot')
  );
}

/**
 * Records QR scan telemetry asynchronously with privacy salt.
 */
export async function recordQRScanEvent(params: RecordQRScanParams): Promise<void> {
  try {
    const isBot = isBotCrawler(params.userAgent);
    const visitorHash = anonymizeVisitorIp(params.ip);

    await db.insert(qrScanEvents).values({
      id: `qre_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      qrId: params.qrId,
      profileId: params.profileId || null,
      destinationType: params.destinationType,
      resolvedUrl: params.resolvedUrl,
      referrer: params.referrer || null,
      country: params.country || null,
      city: params.city || null,
      visitorHash,
      isBot,
    });
  } catch (err) {
    logger.warn({ err }, 'Failed to record QR scan telemetry event');
  }
}

