import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getActorFromRequest } from '@/lib/auth/session';
import { getQRCodeById, updateQRCode, QRNotFoundError, InvalidDestinationError } from '@/modules/qr';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateQRSchema = z.object({
  destinationType: z.enum(['profile', 'url', 'whatsapp', 'vcard', 'multilink']).optional(),
  profileId: z.string().optional().nullable(),
  targetUrl: z.string().optional().nullable(),
  destinationPayload: z.record(z.string(), z.unknown()).optional().nullable(),
  status: z.enum(['draft', 'available', 'assigned', 'active', 'disabled', 'archived']).optional(),
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

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const actor = await getActorFromRequest(request.headers);
    if (!actor) {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }

    const { id } = await params;
    try {
      const qr = await getQRCodeById(id);

      // Ownership check (unless super_admin)
      if (qr.ownerUserId && qr.ownerUserId !== actor.userId && !actor.isAdmin) {
        return apiError('FORBIDDEN', 'Access denied to this QR code.', 403);
      }

      return apiSuccess(qr);
    } catch (err) {
      if (err instanceof QRNotFoundError) {
        return apiError('NOT_FOUND', err.message, 404);
      }
      throw err;
    }
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const actor = await getActorFromRequest(request.headers);
    if (!actor) {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }

    const { id } = await params;
    const body = await request.json();
    const validated = updateQRSchema.safeParse(body);

    if (!validated.success) {
      return apiError('VALIDATION_ERROR', 'Invalid update payload.', 400, validated.error.format());
    }

    try {
      const existing = await getQRCodeById(id);
      if (existing.ownerUserId && existing.ownerUserId !== actor.userId && !actor.isAdmin) {
        return apiError('FORBIDDEN', 'You do not have permission to modify this QR code.', 403);
      }

      const updated = await updateQRCode(id, validated.data);
      return apiSuccess(updated);
    } catch (err) {
      if (err instanceof QRNotFoundError) {
        return apiError('NOT_FOUND', err.message, 404);
      }
      if (err instanceof InvalidDestinationError) {
        return apiError('BAD_REQUEST', err.message, 400);
      }
      throw err;
    }
  } catch (error) {
    return handleApiError(error);
  }
}

