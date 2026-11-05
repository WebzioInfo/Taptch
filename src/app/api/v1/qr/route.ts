import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getActorFromRequest } from '@/lib/auth/session';
import { createQRCode, listQRCodes, InvalidDestinationError } from '@/modules/qr';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

const createQRSchema = z.object({
  name: z.string().max(128).optional(),
  destinationType: z.enum(['profile', 'url', 'whatsapp', 'vcard', 'multilink']),
  profileId: z.string().optional().nullable(),
  targetUrl: z.string().optional().nullable(),
  destinationPayload: z.record(z.string(), z.unknown()).optional().nullable(),
  isDynamic: z.boolean().optional(),
  designConfig: z
    .object({
      fgColor: z.string().optional(),
      bgColor: z.string().optional(),
      errorCorrectionLevel: z.enum(['L', 'M', 'Q', 'H']).optional(),
      cornerShape: z.enum(['square', 'rounded', 'dots']).optional(),
      dotShape: z.enum(['square', 'rounded']).optional(),
      centerLogoUrl: z.string().optional().nullable(),
      frameText: z.string().optional().nullable(),
    })
    .optional(),
});

export async function GET(request: NextRequest) {
  try {
    const actor = await getActorFromRequest(request.headers);
    if (!actor) {
      return apiError('UNAUTHORIZED', 'Authentication required to view QR codes.', 401);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const result = await listQRCodes({
      userId: actor.userId,
      organizationId: actor.orgId || undefined,
      status,
      limit,
      offset,
    });

    return apiSuccess(result.items, { totalCount: result.total, pageSize: result.limit });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await getActorFromRequest(request.headers);
    if (!actor) {
      return apiError('UNAUTHORIZED', 'Authentication required to create a QR code.', 401);
    }

    const body = await request.json();
    const validated = createQRSchema.safeParse(body);

    if (!validated.success) {
      return apiError('VALIDATION_ERROR', 'Invalid QR creation payload.', 400, validated.error.format());
    }

    try {
      const created = await createQRCode({
        ...validated.data,
        ownerUserId: actor.userId,
        organizationId: actor.orgId || null,
      });

      return apiSuccess(created, undefined, 201);
    } catch (err) {
      if (err instanceof InvalidDestinationError) {
        return apiError('BAD_REQUEST', err.message, 400);
      }
      throw err;
    }
  } catch (error) {
    return handleApiError(error);
  }
}

