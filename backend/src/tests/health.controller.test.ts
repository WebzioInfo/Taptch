import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HealthController } from '../modules/health/health.controller';

describe('HealthController - Diagnostics & Verification API', () => {
  let controller: HealthController;
  let mockDbService: any;
  let mockRedisService: any;
  let mockResponse: any;

  beforeEach(() => {
    mockDbService = {
      checkHealth: vi.fn().mockResolvedValue({
        status: 'healthy',
        latencyMs: 15,
        serverTime: new Date().toISOString(),
      }),
    };

    mockRedisService = {
      getCacheStatus: vi.fn().mockReturnValue({
        mode: 'in-memory',
        status: 'operational',
        connected: false,
      }),
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
    };

    controller = new HealthController(mockDbService, mockRedisService);
  });

  it('GET /api/health should return comprehensive health metrics including database latency', async () => {
    const res = await controller.health();

    expect(res).toBeDefined();
    expect(res.status).toBe('healthy');
    expect(res.service).toBe('taptch-backend');
    expect(res.database).toBeDefined();
    expect(res.database.connected).toBe(true);
    expect(res.database.latencyMs).toBe(15);
    expect(res.cache.status).toBe('operational');
    expect(res.system.nodeVersion).toBeDefined();
    expect(res.system.memoryUsageMB).toBeDefined();
    expect(res.integrations).toBeDefined();
  });

  it('GET /api/ready should report ready when database is healthy', async () => {
    const res = await controller.ready(mockResponse);

    expect(res.status).toBe('ready');
    expect(res.database.status).toBe('healthy');
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('GET /api/ready should return 503 status code when database is unhealthy', async () => {
    mockDbService.checkHealth.mockResolvedValueOnce({
      status: 'unhealthy',
      latencyMs: 120,
      error: 'Connection timeout',
    });

    const res = await controller.ready(mockResponse);

    expect(res.status).toBe('not_ready');
    expect(res.database.error).toBe('Connection timeout');
    expect(mockResponse.status).toHaveBeenCalledWith(503);
  });

  it('GET /api/health/db should verify deep database query probe', async () => {
    const res = await controller.checkDatabaseOnly(mockResponse);

    expect(res.database.status).toBe('healthy');
    expect(res.database.latencyMs).toBe(15);
    expect(mockResponse.status).not.toHaveBeenCalled();
  });
});
