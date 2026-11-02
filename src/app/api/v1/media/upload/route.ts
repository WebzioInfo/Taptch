import { NextRequest } from 'next/server';
import { getActorFromRequest } from '@/lib/auth/session';
import { apiSuccess, apiError } from '@/lib/api/response';
import {
  uploadMediaBuffer,
  CLOUDINARY_FOLDERS,
} from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB
const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024; // 20 MB

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'application/pdf',
]);

const FOLDER_MAP: Record<string, string> = {
  avatar: CLOUDINARY_FOLDERS.personalAvatars,
  cover: CLOUDINARY_FOLDERS.personalCovers,
  gallery: CLOUDINARY_FOLDERS.personalGalleries,
  logo: CLOUDINARY_FOLDERS.businessLogos,
  business_cover: CLOUDINARY_FOLDERS.businessCovers,
  product: CLOUDINARY_FOLDERS.businessProducts,
  service: CLOUDINARY_FOLDERS.businessServices,
  business_gallery: CLOUDINARY_FOLDERS.businessGalleries,
  brochure: CLOUDINARY_FOLDERS.documents,
  video: CLOUDINARY_FOLDERS.videos,
  template: CLOUDINARY_FOLDERS.templates,
  nfc_product: CLOUDINARY_FOLDERS.nfcProducts,
};

export async function POST(req: NextRequest) {
  const actor = await getActorFromRequest(req.headers);
  if (!actor || !actor.userId) {
    return apiError('UNAUTHORIZED', 'Authentication required to upload media.', 401);
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const mediaCategory = (formData.get('mediaCategory') as string) || 'gallery';
    const profileId = (formData.get('profileId') as string) || undefined;
    const businessId = (formData.get('businessId') as string) || undefined;

    if (!file) {
      return apiError('BAD_REQUEST', 'No file provided in request.', 400);
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return apiError(
        'VALIDATION_FAILED',
        `Unsupported media type "${file.type}". Allowed: JPEG, PNG, WebP, AVIF, GIF, SVG, MP4, WebM, PDF.`,
        400
      );
    }

    const isVideo = file.type.startsWith('video/');
    const isPdf = file.type === 'application/pdf';

    const maxSize = isVideo ? MAX_VIDEO_SIZE : isPdf ? MAX_DOCUMENT_SIZE : MAX_IMAGE_SIZE;
    if (file.size > maxSize) {
      return apiError(
        'VALIDATION_FAILED',
        `File size exceeds limit (${Math.round(maxSize / (1024 * 1024))}MB).`,
        400
      );
    }

    const folder = FOLDER_MAP[mediaCategory] || 'tappzio/uploads';
    const resourceType: 'image' | 'video' | 'raw' = isVideo ? 'video' : isPdf ? 'raw' : 'image';

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadMediaBuffer(buffer, {
      folder,
      resourceType,
      mediaCategory: mediaCategory as Parameters<typeof uploadMediaBuffer>[1]['mediaCategory'],
      ownerId: actor.userId,
      profileId,
      businessId,
    });

    return apiSuccess(result, undefined, 201);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return apiError('INTERNAL_ERROR', `Media upload failed: ${errorMsg}`, 500);
  }
}
