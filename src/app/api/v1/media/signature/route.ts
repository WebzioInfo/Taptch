import { NextRequest } from 'next/server';
import { getActorFromRequest } from '@/lib/auth/session';
import { apiSuccess, apiError } from '@/lib/api/response';
import { generateSignedUploadParams, CLOUDINARY_FOLDERS } from '@/lib/cloudinary';

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
        ? CLOUDINARY_FOLDERS.personalAvatars
        : category === 'logo'
        ? CLOUDINARY_FOLDERS.businessLogos
        : category === 'video'
        ? CLOUDINARY_FOLDERS.videos
        : category === 'brochure'
        ? CLOUDINARY_FOLDERS.documents
        : CLOUDINARY_FOLDERS.personalGalleries;

    const signatureData = generateSignedUploadParams(folder, ['tapzio', `user_${actor.userId}`]);

    return apiSuccess(signatureData);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return apiError('INTERNAL_ERROR', `Failed to generate upload signature: ${errorMsg}`, 500);
  }
}

