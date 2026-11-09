import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';
import { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const handlers = toNextJsHandler(auth);

export const GET = async (req: NextRequest) => {
  return handlers.GET(req);
};

export const POST = async (req: NextRequest) => {
  try {
    return await handlers.POST(req);
  } catch (err: any) {
    logger.error({ err: err?.message || err, stack: err?.stack }, '[AUTH ROUTE HANDLER ERROR]');
    return new Response(
      JSON.stringify({
        error: 'Authentication failed',
        message: err?.message || 'Internal authentication error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};


