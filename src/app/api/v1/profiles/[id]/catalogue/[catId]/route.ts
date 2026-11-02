import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getActorFromRequest } from '@/lib/auth/session';
import {
  updateCatalogueItem,
  deleteCatalogueItem,
  CatalogueItemNotFoundError,
  UnauthorizedProfileAccessError,
} from '@/modules/profiles';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

const updateCatalogueSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  price: z.string().max(64).optional(),
  currency: z.string().max(8).optional(),
  imageUrl: z.string().optional(),
  actionUrl: z.string().optional(),
  actionLabel: z.string().max(64).optional(),
  displayOrder: z.number().int().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; catId: string }> }
) {
  try {
    const actor = await getActorFromRequest(request.headers);
    if (!actor) {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }

    const { catId } = await params;
    const body = await request.json();
    const validated = updateCatalogueSchema.parse(body);

    const updated = await updateCatalogueItem(actor, catId, validated);
    return apiSuccess(updated);
  } catch (error) {
    if (error instanceof CatalogueItemNotFoundError) {
      return apiError('CATALOGUE_ITEM_NOT_FOUND', error.message, 404);
    }
    if (error instanceof UnauthorizedProfileAccessError) {
      return apiError('FORBIDDEN', error.message, 403);
    }
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; catId: string }> }
) {
  try {
    const actor = await getActorFromRequest(request.headers);
    if (!actor) {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }

    const { catId } = await params;
    await deleteCatalogueItem(actor, catId);
    return apiSuccess({ deleted: true });
  } catch (error) {
    if (error instanceof CatalogueItemNotFoundError) {
      return apiError('CATALOGUE_ITEM_NOT_FOUND', error.message, 404);
    }
    if (error instanceof UnauthorizedProfileAccessError) {
      return apiError('FORBIDDEN', error.message, 403);
    }
    return handleApiError(error);
  }
}
