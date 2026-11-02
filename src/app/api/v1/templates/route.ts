import { NextRequest } from 'next/server';
import { listTemplates } from '@/modules/templates';
import { apiSuccess, handleApiError } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const profileType = searchParams.get('profileType') || undefined;
    const planId = searchParams.get('planId') || undefined;
    const search = searchParams.get('search') || undefined;
    const featured = searchParams.has('featured')
      ? searchParams.get('featured') === 'true'
      : undefined;

    const templates = await listTemplates({
      category,
      profileType,
      planId,
      search,
      featured,
    });

    return apiSuccess(templates, {
      totalCount: templates.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
