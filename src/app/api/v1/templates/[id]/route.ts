import { NextRequest } from 'next/server';
import { getTemplateById, getTemplateBySlug, TemplateNotFoundError } from '@/modules/templates';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let template;
    try {
      template = await getTemplateById(id);
    } catch {
      // Fallback search by slug
      template = await getTemplateBySlug(id);
    }

    return apiSuccess(template);
  } catch (error) {
    if (error instanceof TemplateNotFoundError) {
      return apiError('TEMPLATE_NOT_FOUND', error.message, 404);
    }
    return handleApiError(error);
  }
}
