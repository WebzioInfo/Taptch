import { NextRequest } from 'next/server';
import { updateTemplate, TemplateNotFoundError } from '@/modules/templates';
import { getActorFromRequest } from '@/lib/auth/session';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  description: z.string().optional(),
  requiredPlanId: z.enum(['nano', 'micro', 'mini', 'max']).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await getActorFromRequest(request.headers);
    if (!actor || (!actor.isAdmin && actor.role !== 'super_admin')) {
      return apiError('FORBIDDEN', 'Super Admin access required.', 403);
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateSchema.parse(body);

    const updated = await updateTemplate(actor, id, parsed);

    return apiSuccess(updated);
  } catch (error) {
    if (error instanceof TemplateNotFoundError) {
      return apiError('TEMPLATE_NOT_FOUND', error.message, 404);
    }
    if (error instanceof z.ZodError) {
      return apiError('VALIDATION_ERROR', error.issues[0]?.message || 'Invalid request data.', 400);
    }
    return handleApiError(error);
  }
}
