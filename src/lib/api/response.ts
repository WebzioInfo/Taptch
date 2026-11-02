import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { logger } from '@/lib/logger';

export interface ApiEnvelope<T = unknown> {
  data: T | null;
  error: {
    code: string;
    message: string;
    details?: unknown;
  } | null;
  meta?: {
    page?: number;
    pageSize?: number;
    totalCount?: number;
    hasMore?: boolean;
    requestId?: string;
    totalBytes?: number;
  };
}

export function apiSuccess<T>(
  data: T,
  meta?: ApiEnvelope['meta'],
  status: number = 200
): NextResponse<ApiEnvelope<T>> {
  return NextResponse.json(
    {
      data,
      error: null,
      meta,
    },
    { status }
  );
}

export function apiError(
  code: string,
  message: string,
  status: number = 400,
  details?: unknown,
  requestId?: string
): NextResponse<ApiEnvelope<null>> {
  return NextResponse.json(
    {
      data: null,
      error: {
        code,
        message,
        details,
      },
      meta: requestId ? { requestId } : undefined,
    },
    { status }
  );
}

export function handleApiError(error: unknown, requestId?: string): NextResponse<ApiEnvelope<null>> {
  if (error instanceof ZodError) {
    const fieldErrors = error.flatten().fieldErrors;
    const formattedFields = Object.entries(fieldErrors)
      .map(([field, msgs]) => `${field}: ${msgs?.join(', ')}`)
      .join('; ');
    const message = formattedFields
      ? `Validation failed: ${formattedFields}`
      : 'The submitted payload did not match the required schema';

    return apiError(
      'VALIDATION_FAILED',
      message,
      400,
      fieldErrors,
      requestId
    );
  }

  // Log internal unexpected error via Pino
  logger.error({ err: error, requestId }, '[API INTERNAL ERROR]');

  // Do NOT leak raw stack trace or database error message to client
  return apiError(
    'INTERNAL_ERROR',
    'An unexpected internal error occurred. Please contact support.',
    500,
    undefined,
    requestId
  );
}

