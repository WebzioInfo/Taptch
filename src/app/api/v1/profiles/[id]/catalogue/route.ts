import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getActorFromRequest } from '@/lib/auth/session';
import {
  addCatalogueItem,
  ProfileNotFoundError,
  UnauthorizedProfileAccessError,
} from '@/modules/profiles';
import { EntitlementLimitExceededError } from '@/modules/entitlements';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

const createCatalogueSchema = z.object({
  businessId: z.string().optional().nullable(),
  type: z.enum(['product', 'service']),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  price: z.string().max(64).optional(),
  currency: z.string().max(8).optional().default('INR'),
  imageUrl: z.string().optional(),
  actionUrl: z.string().optional(),
  actionLabel: z.string().max(64).optional().default('Enquire'),
  displayOrder: z.number().int().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await getActorFromRequest(request.headers);
    if (!actor) {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }

    const { id } = await params;
    const body = await request.json();
    const validated = createCatalogueSchema.parse(body);

    const item = await addCatalogueItem(actor, id, validated);
    return apiSuccess(item, undefined, 201);
  } catch (error) {
    if (error instanceof ProfileNotFoundError) {
      return apiError('PROFILE_NOT_FOUND', error.message, 404);
    }
    if (error instanceof UnauthorizedProfileAccessError) {
      return apiError('FORBIDDEN', error.message, 403);
    }
    if (error instanceof EntitlementLimitExceededError) {
      return apiError('ENTITLEMENT_LIMIT_EXCEEDED', error.message, 403, {
        limitKey: error.limitKey,
        maxAllowed: error.maxAllowed,
      });
    }
    return handleApiError(error);
  }
}
