import { NextRequest } from 'next/server';
import { getActorFromRequest } from '@/lib/auth/session';
import { apiSuccess, apiError } from '@/lib/api/response';
import { deleteMediaAsset } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await getActorFromRequest(req.headers);
  if (!actor || !actor.userId) {
    return apiError('UNAUTHORIZED', 'Authentication required.', 401);
  }

  const { id } = await params;
  if (!id) {
    return apiError('BAD_REQUEST', 'Media asset ID is required.', 400);
  }

  try {
    const result = await deleteMediaAsset(id, actor.userId, actor.isAdmin);
    if (!result.success) {
      return apiError('FORBIDDEN', result.error || 'Failed to delete media asset.', 403);
    }

    return apiSuccess({ deletedId: id });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return apiError('INTERNAL_ERROR', `Deletion failed: ${errorMsg}`, 500);
  }
}

