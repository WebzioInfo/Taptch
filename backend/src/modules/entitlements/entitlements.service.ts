import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import * as schema from '../../database/schema';
import { eq } from 'drizzle-orm';
import type { ActorContext, PlanTier } from '../../common/types';

export interface PlanEntitlements {
  maxProfiles: number;
  maxCards: number;
  maxStorageMb: number;
  analyticsRetentionDays: number;
  allowCustomCss: boolean;
  allowCustomDomain: boolean;
  tier: PlanTier;
}

export const TIER_LIMITS: Record<PlanTier, PlanEntitlements> = {
  nano: {
    maxProfiles: 1,
    maxCards: 1,
    maxStorageMb: 25,
    analyticsRetentionDays: 7,
    allowCustomCss: false,
    allowCustomDomain: false,
    tier: 'nano',
  },
  micro: {
    maxProfiles: 3,
    maxCards: 3,
    maxStorageMb: 100,
    analyticsRetentionDays: 30,
    allowCustomCss: false,
    allowCustomDomain: false,
    tier: 'micro',
  },
  mini: {
    maxProfiles: 10,
    maxCards: 10,
    maxStorageMb: 500,
    analyticsRetentionDays: 90,
    allowCustomCss: true,
    allowCustomDomain: true,
    tier: 'mini',
  },
  max: {
    maxProfiles: 100,
    maxCards: 100,
    maxStorageMb: 2000,
    analyticsRetentionDays: 365,
    allowCustomCss: true,
    allowCustomDomain: true,
    tier: 'max',
  },
};

@Injectable()
export class EntitlementsService {
  constructor(private dbService: DatabaseService) {}

  async getActorEntitlements(actor: ActorContext): Promise<PlanEntitlements> {
    if (actor.isAdmin) {
      return TIER_LIMITS.max;
    }

    // Check user's assigned subscription
    const rows = await this.dbService.db
      .select({ planId: schema.tenantSubscriptions.planId })
      .from(schema.tenantSubscriptions)
      .where(eq(schema.tenantSubscriptions.userId, actor.userId))
      .limit(1);

    const planTier = (rows[0]?.planId as PlanTier) || 'nano';
    return TIER_LIMITS[planTier] || TIER_LIMITS.nano;
  }
}
