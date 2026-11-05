import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getActorFromRequest } from '@/lib/auth/session';
import { createQRBatch } from '@/modules/qr';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

const createBatchSchema = z.object({
  name: z.string().min(2).max(128),
  quantity: z.number().int().min(1).max(1000),
  batchCodePrefix: z.string().max(16).optional(),
  productType: z.enum(['sticker', 'standee', 'card', 'packaging']).optional(),
  destinationCategory: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const actor = await getActorFromRequest(request.headers);
    if (!actor || (!actor.isAdmin && actor.role !== 'owner')) {
      return apiError('FORBIDDEN', 'Administrative privileges required for bulk QR minting.', 403);
    }

    const body = await request.json();
    const validated = createBatchSchema.safeParse(body);

    if (!validated.success) {
      return apiError('VALIDATION_ERROR', 'Invalid batch parameters.', 400, validated.error.format());
    }

    const result = await createQRBatch({
      ...validated.data,
      organizationId: actor.orgId || null,
      createdBy: actor.userId,
    });

    return apiSuccess(result, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

