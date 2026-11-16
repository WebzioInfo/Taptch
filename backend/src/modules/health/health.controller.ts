import { Controller, Get, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { DatabaseService } from '../../database/database.service';
import { RedisService } from '../../database/redis.service';
import { Response } from 'express';

@ApiTags('Health & Diagnostics')
@Controller('api')
export class HealthController {
  constructor(
    private dbService: DatabaseService,
    private redisService: RedisService,
  ) {}

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Comprehensive System & Infrastructure Health Check' })
  async health() {
    const dbHealth = await this.dbService.checkHealth();
    const cacheStatus = this.redisService.getCacheStatus();
    const mem = process.memoryUsage();

    const isGoogleOAuthConfigured = Boolean(
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_ID.trim() !== '' &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_CLIENT_SECRET.trim() !== ''
    );

    const isSmtpConfigured = Boolean(
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.SMTP_PASS !== 'password'
    );

    const isOverallHealthy = dbHealth.status === 'healthy';

    return {
      status: isOverallHealthy ? 'healthy' : 'degraded',
      service: 'taptch-backend',
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        status: dbHealth.status,
        connected: dbHealth.status === 'healthy',
        latencyMs: dbHealth.latencyMs,
        serverTime: dbHealth.serverTime || null,
        error: dbHealth.error || null,
      },
      cache: {
        status: cacheStatus.status,
        mode: cacheStatus.mode,
        connected: cacheStatus.connected,
      },
      integrations: {
        googleOAuth: {
          configured: isGoogleOAuthConfigured,
          callbackUrl:
            process.env.GOOGLE_CALLBACK_URL ||
            `${process.env.BACKEND_URL || 'https://api.taptch.com'}/api/auth/oauth/google/callback`,
        },
        smtp: {
          configured: isSmtpConfigured,
          host: process.env.SMTP_HOST || 'not_configured',
        },
        betterAuth: {
          configured: Boolean(process.env.BETTER_AUTH_SECRET),
        },
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        memoryUsageMB: {
          heapUsed: Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100,
          heapTotal: Math.round((mem.heapTotal / 1024 / 1024) * 100) / 100,
          rss: Math.round((mem.rss / 1024 / 1024) * 100) / 100,
        },
      },
    };
  }

  @Public()
  @Get('ready')
  @ApiOperation({ summary: 'Readiness Probe for Load Balancers & Probes' })
  async ready(@Res({ passthrough: true }) res: Response) {
    const dbHealth = await this.dbService.checkHealth();
    const cacheStatus = this.redisService.getCacheStatus();

    const isReady = dbHealth.status === 'healthy';

    if (!isReady) {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
    }

    return {
      status: isReady ? 'ready' : 'not_ready',
      database: {
        status: dbHealth.status,
        latencyMs: dbHealth.latencyMs,
        error: dbHealth.error || null,
      },
      cache: cacheStatus,
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('health/db')
  @ApiOperation({ summary: 'Deep Database Connectivity & Query Verification' })
  async checkDatabaseOnly(@Res({ passthrough: true }) res: Response) {
    const dbHealth = await this.dbService.checkHealth();
    if (dbHealth.status !== 'healthy') {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
    }
    return {
      database: dbHealth,
      timestamp: new Date().toISOString(),
    };
  }
}
