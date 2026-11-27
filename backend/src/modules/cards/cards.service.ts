import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import * as schema from '../../database/schema';
import { eq, desc, asc } from 'drizzle-orm';
import type { ActorContext } from '../../common/types';

/**
 * Public base URL for NFC chip encoding.
 * Format: https://taptch.com/{profileUsername}
 */
function getNfcBaseUrl(): string {
  return (
    process.env.NFC_PUBLIC_BASE_URL ||
    process.env.PUBLIC_APP_URL ||
    'https://taptch.com'
  )
    .trim()
    .replace(/\/+$/, '');
}

  /**
   * Build the permanent NFC chip URL for a card.
   *
   * Every physical NFC card has a permanent URL written once:
   *   https://taptch.com/p/{redirectToken}
   * This URL NEVER changes when a profile is attached, reassigned, or disconnected.
   */
  function buildNfcUrl(params: {
    profileUsername?: string | null;
    redirectToken?: string | null;
    profileType?: string | null;
  }): string | null {
    const base = getNfcBaseUrl();
    const token = (params.redirectToken || '').trim();
    if (!token) return null;
    return `${base}/p/${encodeURIComponent(token)}`;
  }

  @Injectable()
  export class CardsService {
    constructor(private dbService: DatabaseService) { }

  // ─── Purchased Cards ─────────────────────────────────────────────────────────

  async findAllForActor(actor: ActorContext) {
  return this.dbService.withActor(actor, async (tx) => {
    return tx
      .select()
      .from(schema.cards)
      .where(eq(schema.cards.ownerUserId, actor.userId))
      .orderBy(desc(schema.cards.createdAt));
  });
}

  async findPurchasedCardsForActor(actor: ActorContext) {
  return this.dbService.withActor(actor, async (tx) => {
    const allocations = await tx
      .select()
      .from(schema.purchasedCards)
      .where(eq(schema.purchasedCards.userId, actor.userId))
      .orderBy(desc(schema.purchasedCards.createdAt), asc(schema.purchasedCards.unitIndex));

    const enriched = [];
    for (const card of allocations) {
      const [orderRows, profileRows, productRows] = await Promise.all([
        tx
          .select({
            id: schema.orders.id,
            orderNumber: schema.orders.orderNumber,
            orderStatus: schema.orders.orderStatus,
            paymentStatus: schema.orders.paymentStatus,
            createdAt: schema.orders.createdAt,
          })
          .from(schema.orders)
          .where(eq(schema.orders.id, card.orderId))
          .limit(1),
        card.profileId
          ? tx
            .select({
              id: schema.profiles.id,
              displayName: schema.profiles.displayName,
              slug: schema.profiles.slug,
              profileType: schema.profiles.profileType,
              templateId: schema.profiles.templateId,
              status: schema.profiles.status,
              usernameLocked: schema.profiles.usernameLocked,
            })
            .from(schema.profiles)
            .where(eq(schema.profiles.id, card.profileId))
            .limit(1)
          : Promise.resolve([]),
        card.productId
          ? tx
            .select({
              id: schema.cardProducts.id,
              name: schema.cardProducts.name,
              material: schema.cardProducts.material,
              colorName: schema.cardProducts.colorName,
              color: schema.cardProducts.color,
              imageUrl: schema.cardProducts.imageUrl,
            })
            .from(schema.cardProducts)
            .where(eq(schema.cardProducts.id, card.productId))
            .limit(1)
          : Promise.resolve([]),
      ]);

      const matchedProd = productRows[0] || null;
      const linkedProfile = profileRows[0] || null;

        // Permanent NFC chip URL is always https://taptch.com/p/{redirectToken}
        const permanentNfcUrl = buildNfcUrl({
          redirectToken: card.redirectToken,
        });

        enriched.push({
          ...card,
          material: card.material || matchedProd?.material || 'pvc',
          colorName: card.colorName || matchedProd?.colorName || card.variantName || null,
          color: card.color || matchedProd?.color || null,
          previewFrontUrl: card.previewFrontUrl || matchedProd?.imageUrl || null,
          permanentUrl: permanentNfcUrl,
          nfcUrl: permanentNfcUrl,
          order: orderRows[0] || null,
          profile: linkedProfile,
        });
      }

      return enriched;
    });
}

  // ─── Profile Attachment ───────────────────────────────────────────────────────

  /**
   * Attach a Taptch profile to a purchased NFC card.
   * Sets the NFC chip URL to https://taptch.com/{profileUsername}.
   * Locks the profile username if the card has a physicalCardId (chip already in customer's hands).
   */
  async attachProfileToPurchasedCard(
  actor: ActorContext,
  purchasedCardId: string,
  profileId: string,
) {
  if (!profileId) {
    throw new BadRequestException('profileId is required.');
  }

  return this.dbService.withActor(actor, async (tx) => {
    const [card] = await tx
      .select()
      .from(schema.purchasedCards)
      .where(eq(schema.purchasedCards.id, purchasedCardId))
      .limit(1);

    if (!card) {
      throw new NotFoundException(`Purchased card ${purchasedCardId} not found.`);
    }

    if (card.userId !== actor.userId && !actor.isAdmin) {
      throw new ForbiddenException('You do not have permission to configure this card.');
    }

    const [profile] = await tx
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.id, profileId))
      .limit(1);

    if (!profile) {
      throw new NotFoundException(`Profile ${profileId} not found.`);
    }

    if (profile.ownerId !== actor.userId && !actor.isAdmin) {
      throw new ForbiddenException("You cannot attach a card to another user's profile.");
    }

    // Idempotent check
    if (card.profileId === profileId && card.profileAssignmentStatus === 'PROFILE_ATTACHED') {
      return { ...card, profile };
    }

    // Preserve permanent NFC chip URL (https://taptch.com/p/{redirectToken}); never overwrite with username
    const permanentNfcUrl = buildNfcUrl({ redirectToken: card.redirectToken });

    const [updated] = await tx
      .update(schema.purchasedCards)
      .set({
        profileId,
        destinationType: 'profile',
        customDestinationUrl: null,
        profileAssignmentStatus: 'PROFILE_ATTACHED',
        nfcUrl: permanentNfcUrl || card.nfcUrl,
        profileUsername: profile.slug,
        updatedAt: new Date(),
      })
      .where(eq(schema.purchasedCards.id, purchasedCardId))
      .returning();

    // Sync physical card record if already provisioned
    if (card.physicalCardId) {
      await tx
        .update(schema.cards)
        .set({
          profileId,
          destinationType: 'profile',
          customDestinationUrl: null,
          updatedAt: new Date(),
        })
        .where(eq(schema.cards.id, card.physicalCardId));

      // Lock the profile username — the chip is physically in the customer's hands.
      // This prevents the slug from ever being changed without invalidating the chip.
      if (!profile.usernameLocked) {
        await tx
          .update(schema.profiles)
          .set({
            usernameLocked: true,
            usernameLockedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(schema.profiles.id, profileId));
      }
    }

    return { ...updated, profile: { ...profile, usernameLocked: profile.usernameLocked } };
  });
}

  async disconnectProfileFromPurchasedCard(actor: ActorContext, purchasedCardId: string) {
  return this.dbService.withActor(actor, async (tx) => {
    const [card] = await tx
      .select()
      .from(schema.purchasedCards)
      .where(eq(schema.purchasedCards.id, purchasedCardId))
      .limit(1);

    if (!card) {
      throw new NotFoundException(`Purchased card ${purchasedCardId} not found.`);
    }

    if (card.userId !== actor.userId && !actor.isAdmin) {
      throw new ForbiddenException('You do not have permission to configure this card.');
    }

    const permanentNfcUrl = buildNfcUrl({ redirectToken: card.redirectToken });

    const [updated] = await tx
      .update(schema.purchasedCards)
      .set({
        profileId: null,
        destinationType: null,
        customDestinationUrl: null,
        nfcUrl: permanentNfcUrl || card.nfcUrl,
        profileUsername: null,
        profileAssignmentStatus: 'AWAITING_PROFILE',
        updatedAt: new Date(),
      })
      .where(eq(schema.purchasedCards.id, purchasedCardId))
      .returning();

    if (card.physicalCardId) {
      await tx
        .update(schema.cards)
        .set({
          profileId: null,
          destinationType: 'profile',
          customDestinationUrl: null,
          updatedAt: new Date(),
        })
        .where(eq(schema.cards.id, card.physicalCardId));
    }

    return { ...updated, profile: null };
  });
}

  /**
   * Configure the destination for a purchased NFC card.
   * Only 'profile' and 'none' (clear) are supported.
   * External 'custom_url' destinations are no longer accepted.
   */
  async setPurchasedCardDestination(
  actor: ActorContext,
  purchasedCardId: string,
  input: {
  destinationType: 'profile' | 'none';
  profileId?: string;
},
) {
    if (!input || !['profile', 'none'].includes(input.destinationType)) {
      throw new BadRequestException('destinationType must be "profile" or "none".');
    }

    if (input.destinationType === 'profile') {
      if (!input.profileId) {
        throw new BadRequestException('profileId is required when destinationType is "profile".');
      }
      return this.attachProfileToPurchasedCard(actor, purchasedCardId, input.profileId);
    }

    // 'none' — clear destination
    return this.disconnectProfileFromPurchasedCard(actor, purchasedCardId);
  }

    // ─── Legacy buildCanonicalNfcUrl (kept for backward compat with existing tests) ──

buildCanonicalNfcUrl(params: {
  redirectToken?: string | null;
  destinationType?: string | null;
  profileType?: string | null;
  customDestinationUrl?: string | null;
  profileUsername?: string | null;
}): string | null {
  return buildNfcUrl({
    profileUsername: params.profileUsername,
    redirectToken: params.redirectToken,
    profileType: params.profileType,
  });
}

  // ─── Public NFC Token Resolution (Legacy /p/{token} and /b/{token} routes) ───

  /**
   * Resolves a legacy redirect token (from /p/{token} or /b/{token} NFC URLs).
   * Returns the profile username URL as the destination so the chip URL remains
   * backward compatible even after migrating to username-based URLs.
   */
  async resolvePublicNfcToken(
  token: string,
  expectedProfileType ?: 'business' | 'personal',
): Promise < {
  status: 'active' | 'unconfigured' | 'unavailable' | 'not_found';
  destinationType: 'profile' | 'custom_url' | null;
  destinationUrl: string | null;
  profileSlug?: string | null;
  profileType?: 'business' | 'personal' | null;
} > {
  const cleanToken = (token || '').trim();
  if(!cleanToken) {
    return { status: 'not_found', destinationType: null, destinationUrl: null };
  }

    // 1. Check provisioned physical cards table
    const [physicalCard] = await this.dbService.db
    .select()
    .from(schema.cards)
    .where(eq(schema.cards.redirectToken, cleanToken))
    .limit(1);

  if(physicalCard) {
    if (physicalCard.status === 'lost' || physicalCard.status === 'deactivated') {
      return { status: 'unavailable', destinationType: null, destinationUrl: null };
    }
    if (physicalCard.profileId) {
      const [prof] = await this.dbService.db
        .select({
          slug: schema.profiles.slug,
          status: schema.profiles.status,
          profileType: schema.profiles.profileType,
        })
        .from(schema.profiles)
        .where(eq(schema.profiles.id, physicalCard.profileId))
        .limit(1);
        if (prof) {
          if (prof.status === 'PUBLISHED' || prof.status === 'ACTIVE' || prof.status === 'APPROVED') {
            const resolvedType = prof.profileType === 'business' ? 'business' : 'personal';
            return {
              status: 'active',
              destinationType: 'profile',
              destinationUrl: `/${prof.slug}`,
              profileSlug: prof.slug,
              profileType: resolvedType,
            };
          }
          return { status: 'unavailable', destinationType: null, destinationUrl: null };
        }
      }
      return { status: 'unconfigured', destinationType: null, destinationUrl: null };
    }

    // 2. Check purchased_cards allocations by permanent redirectToken
    const [purchasedCard] = await this.dbService.db
      .select()
      .from(schema.purchasedCards)
      .where(eq(schema.purchasedCards.redirectToken, cleanToken))
      .limit(1);

    if (purchasedCard) {
      if (purchasedCard.profileId) {
        const [prof] = await this.dbService.db
          .select({
            slug: schema.profiles.slug,
            status: schema.profiles.status,
            profileType: schema.profiles.profileType,
          })
          .from(schema.profiles)
          .where(eq(schema.profiles.id, purchasedCard.profileId))
          .limit(1);
        if (prof) {
          if (prof.status === 'PUBLISHED' || prof.status === 'ACTIVE' || prof.status === 'APPROVED') {
            const resolvedType = prof.profileType === 'business' ? 'business' : 'personal';
            return {
              status: 'active',
              destinationType: 'profile',
              destinationUrl: `/${prof.slug}`,
              profileSlug: prof.slug,
              profileType: resolvedType,
            };
          }
          return { status: 'unavailable', destinationType: null, destinationUrl: null };
        }
      }

      return { status: 'unconfigured', destinationType: null, destinationUrl: null };
    }

    // 3. Fallback: if someone opens a legacy /p/{username} URL (e.g. /p/sinan),
    //    check if the identifier matches a published profile slug or username alias.
    const normalizedSlug = cleanToken.toLowerCase();
    let [slugProfile] = await this.dbService.db
      .select({
        slug: schema.profiles.slug,
        status: schema.profiles.status,
        profileType: schema.profiles.profileType,
      })
      .from(schema.profiles)
      .where(eq(schema.profiles.slug, normalizedSlug))
      .limit(1);

    if (!slugProfile) {
      const [aliasRow] = await this.dbService.db
        .select({ profileId: schema.usernameAliases.profileId })
        .from(schema.usernameAliases)
        .where(eq(schema.usernameAliases.alias, normalizedSlug))
        .limit(1);

      if (aliasRow) {
        [slugProfile] = await this.dbService.db
          .select({
            slug: schema.profiles.slug,
            status: schema.profiles.status,
            profileType: schema.profiles.profileType,
          })
          .from(schema.profiles)
          .where(eq(schema.profiles.id, aliasRow.profileId))
          .limit(1);
      }
    }

    if (slugProfile) {
      if (slugProfile.status === 'PUBLISHED' || slugProfile.status === 'ACTIVE' || slugProfile.status === 'APPROVED') {
        const resolvedType = slugProfile.profileType === 'business' ? 'business' : 'personal';
        return {
          status: 'active',
          destinationType: 'profile',
          destinationUrl: `/${slugProfile.slug}`,
          profileSlug: slugProfile.slug,
          profileType: resolvedType,
        };
      }
      return { status: 'unavailable', destinationType: null, destinationUrl: null };
    }

    return { status: 'not_found', destinationType: null, destinationUrl: null };
  }

  // ─── Username-Based Public Resolution ────────────────────────────────────────

  /**
   * Resolve a public username to a profile.
   * Used by the /:username route handler.
   * Also checks username_aliases table for legacy/changed usernames.
   */
  async resolvePublicUsername(username: string): Promise < {
      status: 'active' | 'unconfigured' | 'unavailable' | 'not_found';
      destinationUrl: string | null;
      profileSlug: string | null;
    } > {
      const clean = (username || '').toLowerCase().trim();
      if(!clean) {
        return { status: 'not_found', destinationUrl: null, profileSlug: null };
      }

    // 1. Direct slug lookup
    const [profile] = await this.dbService.db
        .select({
          slug: schema.profiles.slug,
          status: schema.profiles.status,
          profileType: schema.profiles.profileType,
        })
        .from(schema.profiles)
        .where(eq(schema.profiles.slug, clean))
        .limit(1);

      if(profile) {
        if (profile.status === 'PUBLISHED' || profile.status === 'APPROVED') {
          return {
            status: 'active',
            destinationUrl: `/${profile.slug}`,
            profileSlug: profile.slug,
          };
        }
        return { status: 'unconfigured', destinationUrl: null, profileSlug: profile.slug };
      }

    // 2. Alias lookup (handles username changes)
    const [alias] = await this.dbService.db
        .select({
          profileId: schema.usernameAliases.profileId,
          alias: schema.usernameAliases.alias,
        })
        .from(schema.usernameAliases)
        .where(eq(schema.usernameAliases.alias, clean))
        .limit(1);

      if(alias) {
        const [aliasedProfile] = await this.dbService.db
          .select({
            slug: schema.profiles.slug,
            status: schema.profiles.status,
          })
          .from(schema.profiles)
          .where(eq(schema.profiles.id, alias.profileId))
          .limit(1);

        if (aliasedProfile && (aliasedProfile.status === 'PUBLISHED' || aliasedProfile.status === 'APPROVED')) {
          return {
            status: 'active',
            destinationUrl: `/${aliasedProfile.slug}`,
            profileSlug: aliasedProfile.slug,
          };
        }
      }

    return { status: 'not_found', destinationUrl: null, profileSlug: null };
    }

  // ─── Assignment Status ────────────────────────────────────────────────────────

  async updateAssignmentStatus(
      actor: ActorContext,
      purchasedCardId: string,
      status: 'AWAITING_PROFILE' | 'PROFILE_SETUP_IN_PROGRESS' | 'PROFILE_ATTACHED',
    ) {
      const allowed = ['AWAITING_PROFILE', 'PROFILE_SETUP_IN_PROGRESS', 'PROFILE_ATTACHED'];
      if (!allowed.includes(status)) {
        throw new BadRequestException(`Invalid profile assignment status "${status}".`);
      }

      return this.dbService.withActor(actor, async (tx) => {
        const [card] = await tx
          .select()
          .from(schema.purchasedCards)
          .where(eq(schema.purchasedCards.id, purchasedCardId))
          .limit(1);

        if (!card) {
          throw new NotFoundException(`Purchased card ${purchasedCardId} not found.`);
        }
        if (card.userId !== actor.userId && !actor.isAdmin) {
          throw new ForbiddenException('Unauthorized to update this card.');
        }

        const [updated] = await tx
          .update(schema.purchasedCards)
          .set({
            profileAssignmentStatus: status,
            updatedAt: new Date(),
          })
          .where(eq(schema.purchasedCards.id, purchasedCardId))
          .returning();

        return updated;
      });
    }

  async linkCardToProfile(actor: ActorContext, cardId: string, profileId: string) {
      const cardRows = await this.dbService.withActor(actor, async (tx) => {
        return tx
          .select()
          .from(schema.cards)
          .where(eq(schema.cards.id, cardId))
          .limit(1);
      });

      if (cardRows.length === 0) {
        throw new NotFoundException(`Card ${cardId} not found.`);
      }

      const card = cardRows[0];
      if (card.ownerUserId && card.ownerUserId !== actor.userId && !actor.isAdmin) {
        throw new ForbiddenException('You do not own this card.');
      }

      const [profile] = await this.dbService.withActor(actor, async (tx) =>
        tx
          .select({ id: schema.profiles.id, ownerId: schema.profiles.ownerId })
          .from(schema.profiles)
          .where(eq(schema.profiles.id, profileId))
          .limit(1),
      );

      if (!profile) {
        throw new NotFoundException(`Profile ${profileId} not found.`);
      }
      if (profile.ownerId !== actor.userId && !actor.isAdmin) {
        throw new ForbiddenException("You cannot link a card to another user's profile.");
      }

      const [updated] = await this.dbService.withActor(actor, async (tx) => {
        return tx
          .update(schema.cards)
          .set({
            profileId,
            status: 'ACTIVE',
            updatedAt: new Date(),
          })
          .where(eq(schema.cards.id, cardId))
          .returning();
      });

      return updated;
    }
  }
