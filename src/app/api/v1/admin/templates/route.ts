import { NextRequest } from 'next/server';
import { listTemplates, getTemplateUsageStats } from '@/modules/templates';
import { getActorFromRequest } from '@/lib/auth/session';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const actor = await getActorFromRequest(request.headers);
    if (!actor || (!actor.isAdmin && actor.role !== 'super_admin')) {
      return apiError('FORBIDDEN', 'Super Admin access required.', 403);
    }

    const [templates, usageStats] = await Promise.all([
      listTemplates({ activeOnly: false }),
      getTemplateUsageStats(),
    ]);

    const enriched = templates.map((t) => ({
      ...t,
      usageCount: usageStats[t.id] || usageStats[t.slug] || 0,
    }));

    return apiSuccess(enriched, {
      totalCount: enriched.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

