import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getActorFromRequest } from '@/lib/auth/session';
import {
  updateProfileSections,
  ProfileNotFoundError,
  UnauthorizedProfileAccessError,
} from '@/modules/profiles';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

const sectionSchema = z.object({
  sectionType: z.string(),
  title: z.string().optional().nullable(),
  isEnabled: z.boolean(),
  displayOrder: z.number().int(),
  configJson: z.record(z.string(), z.unknown()).optional(),
});

const updateSectionsBodySchema = z.object({
  sections: z.array(sectionSchema),
});

export async function PUT(
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
    const validated = updateSectionsBodySchema.parse(body);

    const updatedSections = await updateProfileSections(actor, id, validated.sections);
    return apiSuccess(updatedSections);
  } catch (error) {
    if (error instanceof ProfileNotFoundError) {
      return apiError('PROFILE_NOT_FOUND', error.message, 404);
    }
    if (error instanceof UnauthorizedProfileAccessError) {
      return apiError('FORBIDDEN', error.message, 403);
    }
    return handleApiError(error);
  }
}
