import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getActorFromRequest } from '@/lib/auth/session';
import {
  updateBusiness,
  deleteBusiness,
  BusinessNotFoundError,
  UnauthorizedProfileAccessError,
} from '@/modules/profiles';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

const updateBusinessSchema = z.object({
  name: z.string().min(1).max(255).optional(),
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; bizId: string }> }
) {
  try {
    const actor = await getActorFromRequest(request.headers);
    if (!actor) {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }

    const { bizId } = await params;
    const body = await request.json();
    const validated = updateBusinessSchema.parse(body);

    const updated = await updateBusiness(actor, bizId, validated);
    return apiSuccess(updated);
  } catch (error) {
    if (error instanceof BusinessNotFoundError) {
      return apiError('BUSINESS_NOT_FOUND', error.message, 404);
    }
    if (error instanceof UnauthorizedProfileAccessError) {
      return apiError('FORBIDDEN', error.message, 403);
    }
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; bizId: string }> }
) {
  try {
    const actor = await getActorFromRequest(request.headers);
    if (!actor) {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }

    const { bizId } = await params;
    await deleteBusiness(actor, bizId);
    return apiSuccess({ deleted: true });
  } catch (error) {
    if (error instanceof BusinessNotFoundError) {
      return apiError('BUSINESS_NOT_FOUND', error.message, 404);
    }
    if (error instanceof UnauthorizedProfileAccessError) {
      return apiError('FORBIDDEN', error.message, 403);
    }
    return handleApiError(error);
  }
}
