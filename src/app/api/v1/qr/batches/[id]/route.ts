import { NextRequest } from 'next/server';
import { z } from 'zod';
import { eq, and, gte, lte } from 'drizzle-orm';
import { db } from '@/db';
import { qrBatches, qrCodes } from '@/db/schema/qr';
import { getActorFromRequest } from '@/lib/auth/session';
import { interpolateUrlTemplate } from '@/modules/qr/token';
import { redis } from '@/lib/redis';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const applyTemplateSchema = z.object({
  templateUrl: z.string().url(),
  paramName: z.string().optional(),
  valuePrefix: z.string().optional(),
  sep: z.string().default('-'),
  startSeq: z.number().int().min(1).optional(),
  endSeq: z.number().int().min(1).optional(),
});

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const actor = await getActorFromRequest(request.headers);
    if (!actor || (!actor.isAdmin && actor.role !== 'owner' && actor.role !== 'admin')) {
      return apiError('FORBIDDEN', 'Administrative privileges required to inspect batch.', 403);
    }

    const { id } = await params;

    const [batch] = await db
      .select()
      .from(qrBatches)
      .where(eq(qrBatches.id, id))
      .limit(1);

    const items = await db
      .select({
        id: qrCodes.id,
        serialNumber: qrCodes.serialNumber,
        token: qrCodes.token,
        label: qrCodes.label,
        batchSequence: qrCodes.batchSequence,
        status: qrCodes.status,
        manualRedirectUrl: qrCodes.manualRedirectUrl,
        scanCount: qrCodes.scanCount,
        batchLabel: qrCodes.batchLabel,
      })
      .from(qrCodes)
      .where(eq(qrCodes.batchId, id))
      .orderBy(qrCodes.batchSequence);

    return apiSuccess({
      batch: batch || null,
      items,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const actor = await getActorFromRequest(request.headers);
    if (!actor || (!actor.isAdmin && actor.role !== 'owner' && actor.role !== 'admin')) {
      return apiError('FORBIDDEN', 'Administrative privileges required to modify batch.', 403);
    }

    const { id } = await params;
    const body = await request.json();
    const validated = applyTemplateSchema.safeParse(body);

    if (!validated.success) {
      return apiError('VALIDATION_ERROR', 'Invalid template parameters.', 400, validated.error.format());
    }

    const { templateUrl, paramName, valuePrefix, sep, startSeq, endSeq } = validated.data;

    // Fetch batch items within range
    const conditions = [eq(qrCodes.batchId, id)];
    if (startSeq !== undefined) conditions.push(gte(qrCodes.batchSequence, startSeq));
    if (endSeq !== undefined) conditions.push(lte(qrCodes.batchSequence, endSeq));

    const targetItems = await db
      .select({
        id: qrCodes.id,
        token: qrCodes.token,
        sequence: qrCodes.batchSequence,
      })
      .from(qrCodes)
      .where(and(...conditions));

    if (targetItems.length === 0) {
      return apiError('NOT_FOUND', 'No QR items matched the specified batch sequence range.', 404);
    }

    // Update each item with interpolated destination URL
    for (const item of targetItems) {
      const seq = item.sequence || 1;
      const interpolated = interpolateUrlTemplate(templateUrl, paramName, valuePrefix, sep, seq);

      await db
        .update(qrCodes)
        .set({
          manualRedirectUrl: interpolated,
          targetUrl: interpolated,
          status: 'assigned',
          updatedAt: new Date(),
        })
        .where(eq(qrCodes.id, item.id));

      try {
        await redis.del(`qr:token:${item.token.toLowerCase()}`);
      } catch {
        // Ignore redis cache error
      }
    }

    return apiSuccess({
      message: `Successfully applied template URL to ${targetItems.length} QR codes.`,
      updatedCount: targetItems.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

