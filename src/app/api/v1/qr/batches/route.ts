import { NextRequest } from 'next/server';
import { z } from 'zod';
import { desc } from 'drizzle-orm';
import { db } from '@/db';
import { qrBatches } from '@/db/schema/qr';
import { getActorFromRequest } from '@/lib/auth/session';
import { createQRBatch } from '@/modules/qr';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

const createBatchSchema = z.object({
  name: z.string().min(2).max(128),
  quantity: z.number().int().min(1).max(2000).optional(),
  count: z.number().int().min(1).max(2000).optional(),
  startFrom: z.number().int().min(1).optional(),
  start_from: z.number().int().min(1).optional(),
  batchCodePrefix: z.string().max(16).optional(),
  productType: z.string().optional(),
  product_type: z.string().optional(),
  destinationCategory: z.string().optional(),
  paramName: z.string().max(64).optional(),
  param_name: z.string().max(64).optional(),
  valuePrefix: z.string().max(64).optional(),
  value_prefix: z.string().max(64).optional(),
  sep: z.string().max(16).optional(),
  manualRedirectUrl: z.string().url().optional(),
  manual_redirect_url: z.string().url().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const actor = await getActorFromRequest(request.headers);
    if (!actor || (!actor.isAdmin && actor.role !== 'owner' && actor.role !== 'admin')) {
      return apiError('FORBIDDEN', 'Administrative privileges required to list batches.', 403);
    }

    const batches = await db
      .select({
        id: qrBatches.id,
        batchCode: qrBatches.batchCode,
        name: qrBatches.name,
        quantity: qrBatches.quantity,
        productType: qrBatches.productType,
        destinationCategory: qrBatches.destinationCategory,
        createdAt: qrBatches.createdAt,
      })
      .from(qrBatches)
      .orderBy(desc(qrBatches.createdAt))
      .limit(100);

    return apiSuccess(batches);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await getActorFromRequest(request.headers);
    if (!actor || (!actor.isAdmin && actor.role !== 'owner' && actor.role !== 'admin')) {
      return apiError('FORBIDDEN', 'Administrative privileges required for bulk QR minting.', 403);
    }

    const body = await request.json();
    const validated = createBatchSchema.safeParse(body);

    if (!validated.success) {
      return apiError('VALIDATION_ERROR', 'Invalid batch parameters.', 400, validated.error.format());
    }

    const quantity = validated.data.quantity || validated.data.count || 50;
    const startFrom = validated.data.startFrom || validated.data.start_from || 1;
    const productType = (validated.data.productType || validated.data.product_type || 'sticker') as 'sticker' | 'standee' | 'card' | 'packaging';
    const paramName = validated.data.paramName || validated.data.param_name;
    const valuePrefix = validated.data.valuePrefix || validated.data.value_prefix;
    const manualRedirectUrl = validated.data.manualRedirectUrl || validated.data.manual_redirect_url;

    const result = await createQRBatch({
      name: validated.data.name,
      quantity,
      startFrom,
      productType,
      paramName,
      valuePrefix,
      sep: validated.data.sep || '-',
      manualRedirectUrl,
      batchCodePrefix: validated.data.batchCodePrefix,
      organizationId: actor.orgId || null,
      createdBy: actor.userId,
    });

    return apiSuccess(result, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
