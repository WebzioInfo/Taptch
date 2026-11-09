import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';
import { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const handlers = toNextJsHandler(auth);

function sanitizeAuthPath(path: string): string {
  const match = path.match(/\/api\/auth\/(.+)$/);
  return match ? match[1] : 'unknown';
}

function classifyErrorCategory(status: number, message: string): string {
  if (status === 401) return 'CREDENTIAL_FAILURE';
  if (status === 429) return 'RATE_LIMITED';
  if (status === 403) return 'FORBIDDEN_OR_LOCKED';
  if (status === 400) return 'VALIDATION_ERROR';
  if (status >= 500) {
    if (/database|postgres|timeout|connection/i.test(message)) return 'DATABASE_FAILURE';
    if (/session/i.test(message)) return 'SESSION_CREATION_FAILURE';
    return 'INTERNAL_SERVER_ERROR';
  }
  return 'UNEXPECTED_FAILURE';
}

export const GET = async (req: NextRequest) => {
  const correlationId = req.headers.get('x-correlation-id') || crypto.randomUUID();
  const startTime = Date.now();
  const operation = sanitizeAuthPath(req.nextUrl.pathname);

  try {
    const response = await handlers.GET(req);
    const durationMs = Date.now() - startTime;
    response.headers.set('x-correlation-id', correlationId);

    if (response.status >= 400) {
      logger.warn(
        {
          correlationId,
          operation,
          status: response.status,
          durationMs,
          category: classifyErrorCategory(response.status, ''),
        },
        `[AUTH DIAGNOSTIC GET] HTTP ${response.status} on ${operation}`
      );
    }
    return response;
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    const category = classifyErrorCategory(500, err?.message || '');
    logger.error(
      {
        correlationId,
        operation,
        status: 500,
        durationMs,
        category,
        error: err?.message || 'Unknown error',
      },
      `[AUTH DIAGNOSTIC GET ERROR] ${operation} failed: ${err?.message || 'Server error'}`
    );

    return new Response(
      JSON.stringify({
        error: 'Authentication failed',
        code: 'INTERNAL_SERVER_ERROR',
        correlationId,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'x-correlation-id': correlationId,
        },
      }
    );
  }
};

export const POST = async (req: NextRequest) => {
  const correlationId = req.headers.get('x-correlation-id') || crypto.randomUUID();
  const startTime = Date.now();
  const operation = sanitizeAuthPath(req.nextUrl.pathname);

  try {
    const response = await handlers.POST(req);
    const durationMs = Date.now() - startTime;
    response.headers.set('x-correlation-id', correlationId);

    if (response.status >= 400) {
      logger.warn(
        {
          correlationId,
          operation,
          status: response.status,
          durationMs,
          category: classifyErrorCategory(response.status, ''),
        },
        `[AUTH DIAGNOSTIC POST] HTTP ${response.status} on ${operation}`
      );
    } else {
      logger.info(
        {
          correlationId,
          operation,
          status: response.status,
          durationMs,
        },
        `[AUTH SUCCESS] ${operation} completed in ${durationMs}ms`
      );
    }
    return response;
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    const category = classifyErrorCategory(500, err?.message || '');
    logger.error(
      {
        correlationId,
        operation,
        status: 500,
        durationMs,
        category,
        error: err?.message || 'Unknown error',
      },
      `[AUTH DIAGNOSTIC POST ERROR] ${operation} failed: ${err?.message || 'Server error'}`
    );

    return new Response(
      JSON.stringify({
        error: 'Authentication failed',
        code: 'INTERNAL_SERVER_ERROR',
        correlationId,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'x-correlation-id': correlationId,
        },
      }
    );
  }
};


