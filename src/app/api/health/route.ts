import { NextResponse } from 'next/server';
import { db } from '@/db';
import { redis } from '@/lib/redis';
import { sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, 'ok' | 'degraded' | 'failed'> = {
    database: 'failed',
    redis: 'failed',
  };

  let allHealthy = true;

  // 1. Database check
  try {
    await db.execute(sql`SELECT 1`);
    checks.database = 'ok';
  } catch (err) {
    logger.error({ err }, 'Health check: database probe failed');
    allHealthy = false;
  }

  // 2. Redis check
  try {
    const pong = await redis.ping();
    if (pong === 'PONG') {
      checks.redis = 'ok';
    } else {
      checks.redis = 'degraded';
    }
  } catch (err) {
    logger.warn({ err }, 'Health check: redis probe degraded/failed');
    // Non-fatal if fallback mock is active, but flag as degraded
    checks.redis = 'degraded';
  }

  const statusCode = allHealthy ? 200 : 503;

  return NextResponse.json(
    {
      status: allHealthy ? 'healthy' : 'degraded',
      checks,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
}

