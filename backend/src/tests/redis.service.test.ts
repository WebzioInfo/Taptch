import { describe, it, expect } from 'vitest';
import { RedisService } from '../database/redis.service';
import { ConfigService } from '@nestjs/config';

describe('RedisService Resilience & Fallback', () => {
  it('falls back seamlessly to in-memory caching when Redis is offline', async () => {
    // Pass non-existent port to simulate offline Redis
    const configService = {
      get: (key: string) => (key === 'REDIS_URL' ? 'redis://127.0.0.1:54321' : null),
    } as unknown as ConfigService;

    const redisService = new RedisService(configService);

    // Initial state: key should be null
    const initial = await redisService.get('test_key');
    expect(initial).toBeNull();

    // Set value with TTL
    await redisService.set('test_key', 'hello_resilience', 60);

    // Get value
    const cached = await redisService.get('test_key');
    expect(cached).toBe('hello_resilience');

    // Delete value
    await redisService.del('test_key');
    const afterDel = await redisService.get('test_key');
    expect(afterDel).toBeNull();

    await redisService.onModuleDestroy();
  });
});

