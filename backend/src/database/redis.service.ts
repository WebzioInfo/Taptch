import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  public client: Redis;
  private isAvailable = false;
  private hasLoggedOfflineNotice = false;
  private readonly memoryCache = new Map<string, { value: string; expiresAt?: number }>();

  constructor(private configService: ConfigService) {
    const redisUrl =
      this.configService.get<string>('REDIS_URL') ||
      process.env.REDIS_URL ||
      'redis://localhost:6379';

    this.logger.log(`[REDIS] Initializing Redis client...`);
    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy: (times) => {
        // Discontinue retrying after 2 attempts when Redis server is offline locally
        if (times >= 2) {
          return null;
        }
        return 300;
      },
    });

    // CRITICAL: Attach explicit 'error' event handler immediately to prevent Node.js unhandled EventEmitter errors
    this.client.on('error', (err) => {
      this.isAvailable = false;
      if (!this.hasLoggedOfflineNotice) {
        this.hasLoggedOfflineNotice = true;
        this.logger.warn(`[REDIS] Redis server unreachable (${err.message}). High-performance in-memory cache fallback active.`);
      }
    });

    this.client.on('connect', () => {
      this.isAvailable = true;
      this.hasLoggedOfflineNotice = false;
      this.logger.log(`[REDIS] Connected successfully to Redis server.`);
    });

    this.client.connect().catch((err) => {
      this.isAvailable = false;
      if (!this.hasLoggedOfflineNotice) {
        this.hasLoggedOfflineNotice = true;
        this.logger.warn(`[REDIS] Initial connection notice: ${err.message}. Cache fallback operational.`);
      }
    });
  }

  async get(key: string): Promise<string | null> {
    if (this.isAvailable && this.client.status === 'ready') {
      try {
        return await this.client.get(key);
      } catch {
        // Fall back to memoryCache
      }
    }

    const item = this.memoryCache.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.memoryCache.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.isAvailable && this.client.status === 'ready') {
      try {
        if (ttlSeconds) {
          await this.client.set(key, value, 'EX', ttlSeconds);
        } else {
          await this.client.set(key, value);
        }
        return;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.debug(`[REDIS] Set error, falling back to memory: ${msg}`);
      }
    }

    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.memoryCache.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    this.memoryCache.delete(key);
    if (this.isAvailable && this.client.status === 'ready') {
      try {
        await this.client.del(key);
      } catch {
        // Non-blocking
      }
    }
  }

  async onModuleDestroy() {
    try {
      await this.client.quit();
    } catch {
      this.client.disconnect();
    }
  }
}

