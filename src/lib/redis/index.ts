import Redis from 'ioredis';
import { logger } from '@/lib/logger';

/**
 * In-memory fallback Redis implementation for testing / dev environments
 * where an external Redis instance is unavailable.
 * MOCK implementation per Rule 11.
 */
class InMemoryRedisMock {
  private store = new Map<string, { value: string; expiresAt?: number }>();

  constructor() {
    logger.warn('[MOCK] Using InMemoryRedisMock. External Redis connection is disabled or in fallback mode.');
  }

  private cleanIfExpired(key: string): boolean {
    const item = this.store.get(key);
    if (!item) return false;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  async get(key: string): Promise<string | null> {
    if (!this.cleanIfExpired(key)) return null;
    return this.store.get(key)?.value ?? null;
  }

  async set(key: string, value: string, ...args: (string | number)[]): Promise<'OK'> {
    let ttlMs: number | undefined;
    for (let i = 0; i < args.length; i++) {
      const arg = String(args[i]).toUpperCase();
      if (arg === 'EX' && args[i + 1] !== undefined) {
        ttlMs = Number(args[i + 1]) * 1000;
        i++;
      } else if (arg === 'PX' && args[i + 1] !== undefined) {
        ttlMs = Number(args[i + 1]);
        i++;
      }
    }
    this.store.set(key, {
      value: String(value),
      expiresAt: ttlMs ? Date.now() + ttlMs : undefined,
    });
    return 'OK';
  }

  async setex(key: string, seconds: number, value: string): Promise<'OK'> {
    return this.set(key, value, 'EX', seconds);
  }

  async del(...keys: string[]): Promise<number> {
    let count = 0;
    for (const key of keys) {
      if (this.store.delete(key)) count++;
    }
    return count;
  }

  async incr(key: string): Promise<number> {
    this.cleanIfExpired(key);
    const existing = this.store.get(key);
    const num = existing ? parseInt(existing.value, 10) || 0 : 0;
    const next = num + 1;
    this.store.set(key, {
      value: String(next),
      expiresAt: existing?.expiresAt,
    });
    return next;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const item = this.store.get(key);
    if (!item) return 0;
    item.expiresAt = Date.now() + seconds * 1000;
    return 1;
  }

  async ttl(key: string): Promise<number> {
    const item = this.store.get(key);
    if (!item) return -2;
    if (!item.expiresAt) return -1;
    const remaining = Math.ceil((item.expiresAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  async ping(): Promise<string> {
    return 'PONG';
  }

  async quit(): Promise<'OK'> {
    this.store.clear();
    return 'OK';
  }

  status = 'ready';
}

export type RedisClient = Redis | InMemoryRedisMock;

declare global {
  var __taptch_redis__: RedisClient | undefined;
}

function createRedisClient(): RedisClient {
  const redisUrl = process.env.REDIS_URL;
  const forceMock = process.env.USE_IN_MEMORY_REDIS === 'true';

  // In test or serverless environments where no external Redis URL is provided, safely use in-memory mock
  if (forceMock || !redisUrl) {
    return new InMemoryRedisMock();
  }

  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    enableReadyCheck: false,
    connectTimeout: 3000,
    retryStrategy: (times) => {
      if (times > 3) {
        return null;
      }
      return Math.min(times * 100, 1000);
    },
    lazyConnect: true,
  });

  client.on('error', (err: Error) => {
    try {
      logger.warn({ err: err?.message || String(err) }, 'Redis connection issue, continuing');
    } catch {
      console.warn('[REDIS WARN FALLBACK]', err?.message || err);
    }
  });

  return client;
}

export const redis: RedisClient =
  globalThis.__taptch_redis__ ||
  (globalThis.__taptch_redis__ = createRedisClient());

export const redisClient = redis;

