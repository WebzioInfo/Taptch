import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getActorFromRequest } from '@/lib/auth/session';
import {
  createProfile,
  listProfilesByOwner,
  ProfileSlugTakenError,
} from '@/modules/profiles';
import { TemplatePlanRequirementError } from '@/modules/templates';
import { EntitlementLimitExceededError } from '@/modules/entitlements';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

const createProfileSchema = z.object({
  slug: z.string().min(2).max(128),
  displayName: z.string().min(1).max(128),
  profileType: z.enum(['personal', 'business']).optional().default('personal'),
  headline: z.string().max(255).optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().optional(),
  coverUrl: z.string().optional(),
  templateId: z.string().optional().default('obsidian-luxury'),
  themeConfig: z.record(z.string(), z.unknown()).optional(),
  organizationId: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const actor = await getActorFromRequest(request.headers);
    if (!actor) {
      return apiError('UNAUTHORIZED', 'Authentication required to view profiles.', 401);
    }

    const profilesList = await listProfilesByOwner(actor);
    return apiSuccess(profilesList, { totalCount: profilesList.length });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await getActorFromRequest(request.headers);
    if (!actor) {
      return apiError('UNAUTHORIZED', 'Authentication required to create a profile.', 401);
    }

    const body = await request.json();
    const validated = createProfileSchema.parse(body);

    const newProfile = await createProfile(actor, validated);
    return apiSuccess(newProfile, undefined, 201);
  } catch (error) {
    if (error instanceof ProfileSlugTakenError) {
      return apiError('SLUG_ALREADY_EXISTS', error.message, 409);
    }
    if (error instanceof TemplatePlanRequirementError) {
      return apiError('TEMPLATE_PLAN_REQUIRED', error.message, 403);
    }
    if (error instanceof EntitlementLimitExceededError) {
      return apiError('ENTITLEMENT_LIMIT_EXCEEDED', error.message, 403, {
        limitKey: error.limitKey,
        maxAllowed: error.maxAllowed,
      });
    }
    return handleApiError(error);
  }
}
