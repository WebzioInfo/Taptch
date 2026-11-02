import { NextRequest } from 'next/server';
import { getActorFromRequest } from '@/lib/auth/session';
import { apiSuccess, apiError } from '@/lib/api/response';
import { db } from '@/db';
import { mediaAssets, users, profiles } from '@/db/schema';
import { desc, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const actor = await getActorFromRequest(req.headers);
  if (!actor || (!actor.isAdmin && actor.role !== 'super_admin')) {
    return apiError('FORBIDDEN', 'Super Admin access required.', 403);
  }

  try {
    const assets = await db
      .select({
        id: mediaAssets.id,
        ownerId: mediaAssets.ownerId,
        ownerName: users.name,
        ownerEmail: users.email,
        profileId: mediaAssets.profileId,
        profileSlug: profiles.slug,
        resourceType: mediaAssets.resourceType,
        mediaCategory: mediaAssets.mediaCategory,
        cloudinaryPublicId: mediaAssets.cloudinaryPublicId,
        secureUrl: mediaAssets.secureUrl,
        format: mediaAssets.format,
        fileSize: mediaAssets.fileSize,
        width: mediaAssets.width,
        height: mediaAssets.height,
        duration: mediaAssets.duration,
        visibilityStatus: mediaAssets.visibilityStatus,
        createdAt: mediaAssets.createdAt,
      })
      .from(mediaAssets)
      .leftJoin(users, sql`${mediaAssets.ownerId} = ${users.id}`)
      .leftJoin(profiles, sql`${mediaAssets.profileId} = ${profiles.id}`)
      .orderBy(desc(mediaAssets.createdAt))
      .limit(100);

    const totalStats = await db
      .select({
        totalFiles: sql<number>`count(*)`,
        totalBytes: sql<number>`coalesce(sum(${mediaAssets.fileSize}), 0)`,
      })
      .from(mediaAssets);

    return apiSuccess(assets, {
      totalCount: Number(totalStats[0]?.totalFiles || 0),
      totalBytes: Number(totalStats[0]?.totalBytes || 0),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return apiError('INTERNAL_ERROR', errorMsg, 500);
  }
}
