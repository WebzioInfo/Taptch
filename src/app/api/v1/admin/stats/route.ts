import { NextRequest } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema/auth';
import { profiles } from '@/db/schema/profiles';
import { cards } from '@/db/schema/cards';
import { leads } from '@/db/schema/leads';
import { orders } from '@/db/schema/orders';
import { getActorFromRequest } from '@/lib/auth/session';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const actor = await getActorFromRequest(request.headers);
    if (!actor || (!actor.isAdmin && actor.role !== 'super_admin')) {
      return apiError('FORBIDDEN', 'Super Admin access required.', 403);
    }

    const [usersCount, profilesCount, cardsCount, leadsCount, ordersCount] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(users),
      db.select({ count: sql<number>`count(*)` }).from(profiles),
      db.select({ count: sql<number>`count(*)` }).from(cards),
      db.select({ count: sql<number>`count(*)` }).from(leads),
      db.select({ count: sql<number>`count(*)` }).from(orders),
    ]);

    return apiSuccess({
      totalUsers: Number(usersCount[0]?.count || 0),
      totalProfiles: Number(profilesCount[0]?.count || 0),
      totalCards: Number(cardsCount[0]?.count || 0),
      totalLeads: Number(leadsCount[0]?.count || 0),
      totalOrders: Number(ordersCount[0]?.count || 0),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

