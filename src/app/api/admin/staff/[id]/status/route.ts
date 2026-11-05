import { NextRequest } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema/auth';
import { getActorFromRequest } from '@/lib/auth/session';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateStatusSchema = z.object({
  status: z.enum(['active', 'suspended', 'deactivated']),
});

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const actor = await getActorFromRequest(request.headers);
    if (!actor || (!actor.isAdmin && actor.role !== 'owner')) {
      return apiError('FORBIDDEN', 'Administrative privileges required.', 403);
    }

    const { id } = await params;
    const body = await request.json();
    const validated = updateStatusSchema.safeParse(body);

    if (!validated.success) {
      return apiError('VALIDATION_ERROR', 'Invalid status.', 400);
    }

    const [updated] = await db
      .update(users)
      .set({ status: validated.data.status, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning({ id: users.id, name: users.name, status: users.status });

    if (!updated) {
      return apiError('NOT_FOUND', 'Staff member not found.', 404);
    }

    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

