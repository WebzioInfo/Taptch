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
  accountType?: 'personal' | 'business' | null;
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
      return { ...TIER_LIMITS.max, accountType: 'business' };
    }

    // Check user's accountType and assigned subscription
    const [userRows, subRows] = await Promise.all([
      this.dbService.db
        .select({ accountType: schema.users.accountType })
        .from(schema.users)
        .where(eq(schema.users.id, actor.userId))
        .limit(1),
      this.dbService.db
        .select({ planId: schema.tenantSubscriptions.planId })
        .from(schema.tenantSubscriptions)
        .where(eq(schema.tenantSubscriptions.userId, actor.userId))
        .limit(1),
    ]);

    const accountType = (userRows[0]?.accountType as 'personal' | 'business' | null) || null;
    const explicitPlanTier = subRows[0]?.planId as PlanTier | undefined;

    if (explicitPlanTier && TIER_LIMITS[explicitPlanTier]) {
      const base = TIER_LIMITS[explicitPlanTier];
      if (accountType === 'business') {
        return {
          ...base,
          maxProfiles: Math.max(base.maxProfiles, 20),
          maxCards: Math.max(base.maxCards, 50),
          accountType,
        };
      }
      return { ...base, accountType };
    }

    if (accountType === 'business') {
      return {
        ...TIER_LIMITS.mini,
        maxProfiles: 20,
        maxCards: 50,
        accountType: 'business',
      };
    }

    // Personal account (or unset default): strictly 1 profile, 1 card
    return {
      ...TIER_LIMITS.nano,
      maxProfiles: 1,
      maxCards: 1,
      accountType: accountType || 'personal',
    };
  }
}
