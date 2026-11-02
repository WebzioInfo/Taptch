import { redis } from '@/lib/redis';
import { apiError } from './response';
import { NextResponse } from 'next/server';

export interface RateLimitOptions {
  key: string;
  limit: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

/**
 * Sliding/Fixed window rate limiter backed by Redis.
 * Uses atomic INCR + EXPIRE.
 */
export async function checkRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const { key, limit, windowSeconds } = options;
  const redisKey = `ratelimit:${key}`;

  try {
    const current = await redis.incr(redisKey);
    if (current === 1) {
      await redis.expire(redisKey, windowSeconds);
    }

    const ttl = await redis.ttl(redisKey);
    const resetAt = Date.now() + Math.max(ttl, 0) * 1000;
    const remaining = Math.max(0, limit - current);

    return {
      success: current <= limit,
      limit,
      remaining,
      resetAt,
    };
  } catch {
    // Fail-open in dev/fallback so an unreachable Redis doesn't block developers
    const fallbackReset = Date.now() + windowSeconds * 1000;
    return {
      success: true,
      limit,
      remaining: limit - 1,
      resetAt: fallbackReset,
    };
  }
}

/**
 * Helper to return a 429 Rate Limit Exceeded response with Retry-After header.
 */
export function rateLimitExceededResponse(result: RateLimitResult): NextResponse {
  const retryAfterSeconds = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
  const res = apiError(
    'RATE_LIMIT_EXCEEDED',
    `Too many requests. Please try again in ${retryAfterSeconds} seconds.`,
    429,
    {
      limit: result.limit,
      remaining: 0,
      retryAfterSeconds,
    }
  );
  res.headers.set('Retry-After', String(retryAfterSeconds));
  res.headers.set('X-RateLimit-Limit', String(result.limit));
  res.headers.set('X-RateLimit-Remaining', '0');
  res.headers.set('X-RateLimit-Reset', String(Math.floor(result.resetAt / 1000)));
  return res;
}

