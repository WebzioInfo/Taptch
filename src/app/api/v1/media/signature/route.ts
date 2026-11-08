import { NextRequest } from 'next/server';
import { getActorFromRequest } from '@/lib/auth/session';
import { apiSuccess, apiError } from '@/lib/api/response';
import { generateSignedUploadParams, STORAGE_FOLDERS } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const actor = await getActorFromRequest(req.headers);
  if (!actor || !actor.userId) {
    return apiError('UNAUTHORIZED', 'Authentication required.', 401);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const category = (body.category as string) || 'gallery';

    const folder =
      category === 'avatar'
        ? STORAGE_FOLDERS.personalAvatars
        : category === 'logo'
        ? STORAGE_FOLDERS.businessLogos
        : category === 'video'
        ? STORAGE_FOLDERS.videos
        : category === 'brochure'
        ? STORAGE_FOLDERS.documents
        : STORAGE_FOLDERS.personalGalleries;

    const uploadParams = await generateSignedUploadParams(folder, ['taptch', `user_${actor.userId}`]);

    return apiSuccess(uploadParams);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return apiError('INTERNAL_ERROR', `Failed to generate direct upload URL: ${errorMsg}`, 500);
  }
}
