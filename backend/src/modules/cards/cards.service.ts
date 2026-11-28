import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { activeProfiles } from '../../database/scopes';
import * as schema from '../../database/schema';
import { eq, desc, asc, and, gt, isNull, or, sql } from 'drizzle-orm';
import * as crypto from 'crypto';
import type { ActorContext } from '../../common/types';
import { resolveActiveTemplateId } from '../profiles/profiles.service';
import {
  assertCardNotLocked,
  buildCardUrl,
  isCardLockedStatus,
  normalizePurchasedCardStatus,
  serializePurchasedCardForUser,
} from './card-serializer';

export function hashActivationCode(code: string): string {
  const salt = process.env.ACTIVATION_CODE_SALT || 'taptch-card-activation';
  return crypto
    .createHash('sha256')
    .update(`${salt}:${code.trim().toUpperCase()}`)
    .digest('hex');
}

/**
 * Build the permanent NFC chip URL for a card using the canonical URL generator.
 * This URL NEVER changes when a profile is attached, reassigned, or disconnected.
 */
function buildNfcUrl(params: {
  cardCode?: string | null;
  profileUsername?: string | null;
  redirectToken?: string | null;
  profileType?: string | null;
}): string | null {
  const id = (params.cardCode || params.redirectToken || '').trim();
  if (!id) return null;
  return buildCardUrl(id);
}

@Injectable()
export class CardsService {
  constructor(private dbService: DatabaseService) { }

  // ─── Purchased Cards ─────────────────────────────────────────────────────────

  async findAllForActor(actor: ActorContext) {
    return this.dbService.withActor(actor, async (tx) => {
      const rows = await tx
        .select()
        .from(schema.cards)
        .where(eq(schema.cards.ownerUserId, actor.userId))
        .orderBy(desc(schema.cards.createdAt));

      return rows.map((c: any) => {
        if (isCardLockedStatus(c.status)) {
          return {
            id: c.id,
            serialNumber: c.serialNumber,
            material: c.material,
            status: normalizePurchasedCardStatus(c.status),
            isLocked: true,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
          };
        }
        return c;
      });
    });
  }

  private async enrichPurchasedCardForActor(tx: any, card: any) {
    const [orderRows, profileRows, productRows] = await Promise.all([
      card.orderId
        ? tx
          .select({
            id: schema.orders.id,
            orderNumber: schema.orders.orderNumber,
            orderStatus: schema.orders.orderStatus,
            paymentStatus: schema.orders.paymentStatus,
            createdAt: schema.orders.createdAt,
          })
          .from(schema.orders)
          .where(eq(schema.orders.id, card.orderId))
          .limit(1)
        : Promise.resolve([]),
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
          .where(and(eq(schema.profiles.id, card.profileId), activeProfiles()))
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

    const permanentNfcUrl = buildNfcUrl({ cardCode: card.cardCode, redirectToken: card.redirectToken });
    return serializePurchasedCardForUser(card, {
      order: orderRows[0] || null,
      profile: profileRows[0] || null,
      product: productRows[0] || null,
      permanentNfcUrl,
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
        enriched.push(await this.enrichPurchasedCardForActor(tx, card));
      }
      return enriched;
    });
  }

  async findPurchasedCardByIdForActor(actor: ActorContext, purchasedCardId: string) {
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
        throw new ForbiddenException('You do not have permission to view this card.');
      }
      return this.enrichPurchasedCardForActor(tx, card);
    });
  }

  async regeneratePurchasedCardUrlForActor(actor: ActorContext, purchasedCardId: string) {
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
      assertCardNotLocked(card);
      await this.assertPurchasedCardNotRevoked(tx, card);

      const newToken = crypto.randomBytes(8).toString('hex');
      const newUrl = buildNfcUrl({ redirectToken: newToken }) || card.nfcUrl;
      const [updated] = await tx
        .update(schema.purchasedCards)
        .set({
          redirectToken: newToken,
          nfcUrl: newUrl,
          updatedAt: new Date(),
        })
        .where(eq(schema.purchasedCards.id, purchasedCardId))
        .returning();

      return this.enrichPurchasedCardForActor(tx, updated);
    });
  }

  async updatePurchasedCardSettingsForActor(
    actor: ActorContext,
    purchasedCardId: string,
    body: { featureFlags?: Record<string, unknown>; customDestinationUrl?: string | null },
  ) {
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
      assertCardNotLocked(card);
      await this.assertPurchasedCardNotRevoked(tx, card);

      const [updated] = await tx
        .update(schema.purchasedCards)
        .set({
          updatedAt: new Date(),
        })
        .where(eq(schema.purchasedCards.id, purchasedCardId))
        .returning();

      return this.enrichPurchasedCardForActor(tx, updated);
    });
  }

  async getPurchasedCardQrForActor(actor: ActorContext, purchasedCardId: string) {
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
        throw new ForbiddenException('You do not have permission to access this card.');
      }
      assertCardNotLocked(card);
      return {
        id: card.id,
        url: buildNfcUrl({ redirectToken: card.redirectToken }) || card.nfcUrl || null,
      };
    });
  }

  async deletePurchasedCardForActor(actor: ActorContext, purchasedCardId: string) {
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
        throw new ForbiddenException('You do not have permission to delete this card.');
      }
      assertCardNotLocked(card);
      throw new ForbiddenException('Purchased NFC cards cannot be deleted.');
    });
  }

  // ─── Profile Attachment ───────────────────────────────────────────────────────

  /**
   * Attach a Taptch profile to a purchased NFC card.
   * Sets the NFC chip URL to https://taptch.com/{profileUsername}.
   * Locks the profile username if the card has a physicalCardId (chip already in customer's hands).
   */
  private async assertPurchasedCardNotRevoked(tx: any, card: any) {
    if (card.profileAssignmentStatus === 'REVOKED') {
      throw new BadRequestException(
        'This NFC card has been revoked because its order was cancelled or refunded.',
      );
    }
    if (card.orderId) {
      const [parentOrder] = await tx
        .select({
          orderStatus: schema.orders.orderStatus,
          paymentStatus: schema.orders.paymentStatus,
        })
        .from(schema.orders)
        .where(eq(schema.orders.id, card.orderId))
        .limit(1);

      if (
        parentOrder &&
        (parentOrder.orderStatus === 'CANCELLED' || parentOrder.paymentStatus === 'REFUNDED')
      ) {
        throw new BadRequestException(
          'This NFC card cannot be configured because its order was cancelled or refunded.',
        );
      }
    }
  }

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

      assertCardNotLocked(card);
      await this.assertPurchasedCardNotRevoked(tx, card);

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
      const permanentNfcUrl = buildNfcUrl({ cardCode: card.cardCode, redirectToken: card.redirectToken });

      const [updated] = await tx
        .update(schema.purchasedCards)
        .set({
          profileId,
          destinationType: 'profile',
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

      assertCardNotLocked(card);
      const permanentNfcUrl = buildNfcUrl({ cardCode: card.cardCode, redirectToken: card.redirectToken });

      const [updated] = await tx
        .update(schema.purchasedCards)
        .set({
          profileId: null,
          destinationType: null,
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

    // 'none' — clear destination (block if card is revoked)
    const [card] = await this.dbService.withActor(actor, async (tx) =>
      tx
        .select()
        .from(schema.purchasedCards)
        .where(eq(schema.purchasedCards.id, purchasedCardId))
        .limit(1),
    );
    if (card) {
      assertCardNotLocked(card);
      await this.dbService.withActor(actor, async (tx) =>
        this.assertPurchasedCardNotRevoked(tx, card),
      );
    }
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

  private async recordBlockedScanAttempt(
    cardId: string,
    cardStatus: 'SUSPENDED' | 'LOST',
    requestMeta?: { rawIp?: string; userAgent?: string; country?: string | null; city?: string | null },
  ) {
    try {
      const dayKey = new Date().toISOString().slice(0, 10);
      const salt = `${process.env.ANALYTICS_IP_SALT || 'taptch-blocked-scan'}:${dayKey}`;
      const visitorHash = crypto
        .createHash('sha256')
        .update(`${salt}:${requestMeta?.rawIp || 'unknown'}`)
        .digest('hex')
        .slice(0, 32);

      const ua = (requestMeta?.userAgent || '').toLowerCase();
      const deviceCategory = ua.includes('tablet') || ua.includes('ipad')
        ? 'tablet'
        : ua.includes('mobi') || ua.includes('android') || ua.includes('iphone')
          ? 'mobile'
          : ua
            ? 'desktop'
            : null;

      await this.dbService.db.insert(schema.blockedCardScans).values({
        id: crypto.randomUUID(),
        cardId,
        cardStatus,
        deviceCategory,
        country: requestMeta?.country || null,
        city: requestMeta?.city || null,
        visitorHash,
      });
    } catch {
      // Never fail public blocked response if logging fails
    }
  }

  /**
   * Resolves a legacy redirect token (from /p/{token} or /b/{token} NFC URLs).
   * Returns the profile username URL as the destination so the chip URL remains
   * backward compatible even after migrating to username-based URLs.
   */
  async resolvePublicNfcToken(
    token: string,
    expectedProfileType?: 'business' | 'personal',
    requestMeta?: { rawIp?: string; userAgent?: string; country?: string | null; city?: string | null },
  ): Promise<{
    status: 'active' | 'unconfigured' | 'unavailable' | 'suspended' | 'lost' | 'not_found';
    destinationType: 'profile' | 'custom_url' | null;
    destinationUrl: string | null;
    message?: string;
    profileId?: string | null;
    profileSlug?: string | null;
    profileType?: 'business' | 'personal' | null;
    templateId?: string | null;
  }> {
    const cleanToken = (token || '').trim();
    if (!cleanToken) {
      return { status: 'not_found', destinationType: null, destinationUrl: null };
    }

    // 1. Check provisioned physical cards table
    const [physicalCard] = await this.dbService.db
      .select()
      .from(schema.cards)
      .where(eq(schema.cards.redirectToken, cleanToken))
      .limit(1);

    if (physicalCard) {
      const physStatus = (physicalCard.status || '').toLowerCase();
      if (physStatus === 'lost') {
        return {
          status: 'lost',
          destinationType: null,
          destinationUrl: null,
          message: 'This card has been reported lost.',
        };
      }
      if (physStatus === 'suspended' || physStatus === 'deactivated') {
        return {
          status: 'suspended',
          destinationType: null,
          destinationUrl: null,
          message: 'This card is currently suspended.',
        };
      }
      if (physicalCard.profileId) {
        const [prof] = await this.dbService.db
          .select({
            id: schema.profiles.id,
            ownerId: schema.profiles.ownerId,
            slug: schema.profiles.slug,
            status: schema.profiles.status,
            profileType: schema.profiles.profileType,
            templateId: schema.profiles.templateId,
          })
          .from(schema.profiles)
          .where(and(eq(schema.profiles.id, physicalCard.profileId), activeProfiles()))
          .limit(1);
        if (prof) {
          if (prof.ownerId) {
            const [owner] = await this.dbService.db
              .select({ status: schema.users.status })
              .from(schema.users)
              .where(eq(schema.users.id, prof.ownerId))
              .limit(1);
            if (owner && (owner.status === 'suspended' || owner.status === 'deactivated')) {
              return { status: 'unavailable', destinationType: null, destinationUrl: null };
            }
          }
          if (prof.status === 'PUBLISHED' || prof.status === 'ACTIVE' || prof.status === 'APPROVED') {
            const resolvedType = prof.profileType === 'business' ? 'business' : 'personal';
            return {
              status: 'active',
              destinationType: 'profile',
              destinationUrl: `/${resolvedType === 'business' ? 'b' : 'p'}/${prof.slug}`,
              profileId: prof.id,
              profileSlug: prof.slug,
              profileType: resolvedType,
              templateId: resolveActiveTemplateId(prof.templateId, prof.profileType),
            };
          }
          return { status: 'unavailable', destinationType: null, destinationUrl: null };
        }
      }
      return { status: 'unconfigured', destinationType: null, destinationUrl: null };
    }

    // 2. Check purchased_cards allocations by case-insensitive cardCode or redirectToken
    const lowerToken = cleanToken.toLowerCase();
    const [purchasedCard] = await this.dbService.db
      .select()
      .from(schema.purchasedCards)
      .where(
        or(
          sql`lower(${schema.purchasedCards.cardCode}) = ${lowerToken}`,
          eq(schema.purchasedCards.redirectToken, cleanToken),
        ),
      )
      .limit(1);

    if (purchasedCard) {
      const cardStatus = normalizePurchasedCardStatus(
        purchasedCard.profileAssignmentStatus === 'REVOKED' ? 'SUSPENDED' : purchasedCard.status,
        purchasedCard.profileId,
      );

      if (cardStatus === 'LOST') {
        await this.recordBlockedScanAttempt(purchasedCard.id, 'LOST', requestMeta);
        return {
          status: 'lost',
          destinationType: null,
          destinationUrl: null,
          message: 'This card has been reported lost.',
        };
      }

      if (cardStatus === 'SUSPENDED') {
        await this.recordBlockedScanAttempt(purchasedCard.id, 'SUSPENDED', requestMeta);
        return {
          status: 'suspended',
          destinationType: null,
          destinationUrl: null,
          message: 'This card is currently suspended.',
        };
      }

      if (purchasedCard.orderId) {
        const [parentOrder] = await this.dbService.db
          .select({
            orderStatus: schema.orders.orderStatus,
            paymentStatus: schema.orders.paymentStatus,
          })
          .from(schema.orders)
          .where(eq(schema.orders.id, purchasedCard.orderId))
          .limit(1);
        if (
          parentOrder &&
          (parentOrder.orderStatus === 'CANCELLED' || parentOrder.paymentStatus === 'REFUNDED')
        ) {
          return { status: 'unavailable', destinationType: null, destinationUrl: null };
        }
      }

      if (purchasedCard.profileId) {
        const [prof] = await this.dbService.db
          .select({
            id: schema.profiles.id,
            ownerId: schema.profiles.ownerId,
            slug: schema.profiles.slug,
            status: schema.profiles.status,
            profileType: schema.profiles.profileType,
            templateId: schema.profiles.templateId,
          })
          .from(schema.profiles)
          .where(and(eq(schema.profiles.id, purchasedCard.profileId), activeProfiles()))
          .limit(1);
        if (prof) {
          if (prof.ownerId) {
            const [owner] = await this.dbService.db
              .select({ status: schema.users.status })
              .from(schema.users)
              .where(eq(schema.users.id, prof.ownerId))
              .limit(1);
            if (owner && (owner.status === 'suspended' || owner.status === 'deactivated')) {
              return { status: 'unavailable', destinationType: null, destinationUrl: null };
            }
          }
          if (prof.status === 'PUBLISHED' || prof.status === 'ACTIVE' || prof.status === 'APPROVED') {
            const resolvedType = prof.profileType === 'business' ? 'business' : 'personal';
            return {
              status: 'active',
              destinationType: 'profile',
              destinationUrl: `/${resolvedType === 'business' ? 'b' : 'p'}/${prof.slug}`,
              profileId: prof.id,
              profileSlug: prof.slug,
              profileType: resolvedType,
              templateId: resolveActiveTemplateId(prof.templateId, prof.profileType),
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
        id: schema.profiles.id,
        ownerId: schema.profiles.ownerId,
        slug: schema.profiles.slug,
        status: schema.profiles.status,
        profileType: schema.profiles.profileType,
        templateId: schema.profiles.templateId,
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
            id: schema.profiles.id,
            ownerId: schema.profiles.ownerId,
            slug: schema.profiles.slug,
            status: schema.profiles.status,
            profileType: schema.profiles.profileType,
            templateId: schema.profiles.templateId,
          })
          .from(schema.profiles)
          .where(eq(schema.profiles.id, aliasRow.profileId))
          .limit(1);
      }
    }

    if (slugProfile) {
      if (slugProfile.ownerId) {
        const [owner] = await this.dbService.db
          .select({ status: schema.users.status })
          .from(schema.users)
          .where(eq(schema.users.id, slugProfile.ownerId))
          .limit(1);
        if (owner && (owner.status === 'suspended' || owner.status === 'deactivated')) {
          return { status: 'unavailable', destinationType: null, destinationUrl: null };
        }
      }
      if (slugProfile.status === 'PUBLISHED' || slugProfile.status === 'ACTIVE' || slugProfile.status === 'APPROVED') {
        const resolvedType = slugProfile.profileType === 'business' ? 'business' : 'personal';
        return {
          status: 'active',
          destinationType: 'profile',
          destinationUrl: `/${resolvedType === 'business' ? 'b' : 'p'}/${slugProfile.slug}`,
          profileId: slugProfile.id,
          profileSlug: slugProfile.slug,
          profileType: resolvedType,
          templateId: resolveActiveTemplateId(slugProfile.templateId, slugProfile.profileType),
        };
      }
      return { status: 'unavailable', destinationType: null, destinationUrl: null };
    }

    return { status: 'not_found', destinationType: null, destinationUrl: null };
  }

  async resolveRootSlug(
    slug: string,
    requestMeta?: { rawIp?: string; userAgent?: string; country?: string | null; city?: string | null },
  ): Promise<{
    type: 'card' | 'profile';
    target: string | null;
    cardStatus?: string;
    message?: string;
    profileSlug?: string | null;
  }> {
    const clean = (slug || '').trim().toLowerCase();
    if (!clean) {
      throw new NotFoundException('Not found.');
    }

    // 1. Check card ID first (case-insensitive)
    const [purchasedCard] = await this.dbService.db
      .select({ id: schema.purchasedCards.id })
      .from(schema.purchasedCards)
      .where(
        or(
          sql`lower(${schema.purchasedCards.cardCode}) = ${clean}`,
          eq(schema.purchasedCards.redirectToken, clean),
        ),
      )
      .limit(1);

    if (purchasedCard) {
      const cardRes = await this.resolvePublicNfcToken(clean, undefined, requestMeta);
      return {
        type: 'card',
        target: cardRes.destinationUrl || null,
        cardStatus: cardRes.status,
        message: cardRes.message,
        profileSlug: cardRes.profileSlug || null,
      };
    }

    // 2. Check active profile username or alias
    const profRes = await this.resolvePublicUsername(clean);
    if (profRes.status === 'active' && profRes.profileSlug) {
      return {
        type: 'profile',
        target: `/${profRes.profileSlug}`,
        profileSlug: profRes.profileSlug,
      };
    }

    throw new NotFoundException('Not found.');
  }

  // ─── Username-Based Public Resolution ────────────────────────────────────────

  /**
   * Resolve a public username to a profile.
   * Used by the /:username route handler.
   * Also checks username_aliases table for legacy/changed usernames.
   */
  async resolvePublicUsername(username: string): Promise<{
    status: 'active' | 'unconfigured' | 'unavailable' | 'not_found';
    destinationUrl: string | null;
    profileSlug: string | null;
  }> {
    const clean = (username || '').toLowerCase().trim();
    if (!clean) {
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

    if (profile) {
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

    if (alias) {
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

      assertCardNotLocked(card);

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

  async linkCardToProfile(
    actor: ActorContext,
    cardId: string,
    profileId: string,
    activationCode?: string,
  ) {
    const [card] = await this.dbService.withActor(actor, async (tx) => {
      return tx
        .select()
        .from(schema.cards)
        .where(eq(schema.cards.id, cardId))
        .limit(1);
    });

    if (!card) {
      throw new NotFoundException(`Card ${cardId} not found.`);
    }

    assertCardNotLocked({ status: card.status });

    const isUnclaimed = !card.ownerUserId;
    if (!isUnclaimed && card.ownerUserId !== actor.userId && !actor.isAdmin) {
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

    if (isUnclaimed && !actor.isAdmin) {
      if (!activationCode || !activationCode.trim()) {
        throw new BadRequestException(
          'Activation code is required to claim an unowned physical NFC card.',
        );
      }

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentFailures = await this.dbService.db
        .select({ id: schema.activationAttempts.id })
        .from(schema.activationAttempts)
        .where(
          and(
            eq(schema.activationAttempts.token, card.redirectToken),
            eq(schema.activationAttempts.success, false),
            gt(schema.activationAttempts.createdAt, oneHourAgo),
          ),
        );

      if (recentFailures.length >= 5) {
        throw new BadRequestException(
          'Too many failed activation attempts for this card. Please try again later.',
        );
      }

      const candidateHash = hashActivationCode(activationCode);
      const storedHash = card.activationCodeHash || '';
      const candidateBuf = Buffer.from(candidateHash, 'utf8');
      const storedBuf = Buffer.from(storedHash, 'utf8');
      const isMatch =
        candidateBuf.length === storedBuf.length &&
        crypto.timingSafeEqual(candidateBuf, storedBuf);

      await this.dbService.db.insert(schema.activationAttempts).values({
        id: crypto.randomUUID(),
        token: card.redirectToken,
        userId: actor.userId,
        success: isMatch,
      });

      if (!isMatch) {
        throw new ForbiddenException('Invalid activation code for this NFC card.');
      }
    }

    const updated = await this.dbService.withActor(actor, async (tx) => {
      const updateCondition = isUnclaimed
        ? and(eq(schema.cards.id, cardId), isNull(schema.cards.ownerUserId))
        : eq(schema.cards.id, cardId);

      const [res] = await tx
        .update(schema.cards)
        .set({
          profileId,
          status: 'active',
          ...(isUnclaimed
            ? {
              ownerUserId: actor.userId,
              activatedAt: new Date(),
            }
            : {}),
          updatedAt: new Date(),
        })
        .where(updateCondition)
        .returning();

      if (!res) {
        throw new BadRequestException('This NFC card has already been claimed.');
      }

      await tx.insert(schema.cardAssignments).values({
        id: crypto.randomUUID(),
        cardId: res.id,
        profileId,
        assignedBy: actor.userId,
        reason: isUnclaimed ? 'claim' : 'reassign',
      });

      return res;
    });

    return updated;
  }
}
