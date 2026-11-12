import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { DatabaseService } from '../../database/database.service';
import { RedisService } from '../../database/redis.service';

@ApiTags('Health')
@Controller('api')
export class HealthController {
  constructor(
    private dbService: DatabaseService,
    private redisService: RedisService,
  ) {}

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Liveness probe' })
  health() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      service: 'taptch-backend',
    };
  }

  @Public()
  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe' })
  async ready() {
    let dbStatus = 'healthy';
    let redisStatus = 'healthy';

    try {
      await this.dbService.db.execute('SELECT 1');
    } catch {
      dbStatus = 'degraded';
    }

    try {
      await this.redisService.client.ping();
    } catch {
      redisStatus = 'degraded';
    }

    return {
      status: dbStatus === 'healthy' ? 'ready' : 'degraded',
      components: {
        database: dbStatus,
        redis: redisStatus,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
