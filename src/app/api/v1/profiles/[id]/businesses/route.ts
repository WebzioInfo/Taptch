import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getActorFromRequest } from '@/lib/auth/session';
import {
  addBusiness,
  ProfileNotFoundError,
  UnauthorizedProfileAccessError,
} from '@/modules/profiles';
import { EntitlementLimitExceededError } from '@/modules/entitlements';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

const createBusinessSchema = z.object({
  name: z.string().min(1).max(255),
  tagline: z.string().max(255).optional(),
  logoUrl: z.string().optional(),
  coverUrl: z.string().optional(),
  description: z.string().optional(),
  website: z.string().max(255).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(32).optional(),
  whatsapp: z.string().max(32).optional(),
  address: z.string().optional(),
  googleMapsUrl: z.string().optional(),
  googleReviewUrl: z.string().optional(),
  brochureUrl: z.string().optional(),
  socialLinks: z
    .array(
      z.object({
        platform: z.string(),
        url: z.string(),
      })
    )
    .optional(),
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
    const validated = createBusinessSchema.parse(body);

    const business = await addBusiness(actor, id, validated);
    return apiSuccess(business, undefined, 201);
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
