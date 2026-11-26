import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { EntitlementsService } from '../entitlements/entitlements.service';
import * as schema from '../../database/schema';
import { eq, desc, and, ne } from 'drizzle-orm';
import type { ActorContext } from '../../common/types';
import * as crypto from 'crypto';

export const VALID_JOURNEY_STAGES = [
  'EXPLORING',
  'AUTHENTICATION_REQUIRED',
  'ACCOUNT_SETUP',
  'PROFILE_TEMPLATE_SELECTION',
  'PROFILE_CREATION',
  'CARD_DESIGN',
  'CHECKOUT',
  'PAYMENT_PENDING',
  'COMPLETED',
] as const;

export type JourneyStage = (typeof VALID_JOURNEY_STAGES)[number];

export interface UpdateJourneyDto {
  stage?: JourneyStage;
  accountType?: 'personal' | 'business';
  selectedProductId?: string | null;
  selectedVariantId?: string | null;
  selectedCardTemplateId?: string | null;
  selectedProfileTemplateId?: string | null;
  profileId?: string | null;
  designId?: string | null;
  quantity?: number;
  orderId?: string | null;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class JourneyService {
  constructor(
    private dbService: DatabaseService,
    private entitlementsService: EntitlementsService,
  ) {}

  async getContext(actor: ActorContext) {
    const [userRows, entitlements, profiles, designs, journeyRows] = await Promise.all([
      this.dbService.db
        .select({
          id: schema.users.id,
          name: schema.users.name,
          email: schema.users.email,
          accountType: schema.users.accountType,
        })
        .from(schema.users)
        .where(eq(schema.users.id, actor.userId))
        .limit(1),
      this.entitlementsService.getActorEntitlements(actor),
      this.dbService.withActor(actor, async (tx) =>
        tx
          .select({
            id: schema.profiles.id,
            slug: schema.profiles.slug,
            displayName: schema.profiles.displayName,
            profileType: schema.profiles.profileType,
            templateId: schema.profiles.templateId,
            status: schema.profiles.status,
            avatarUrl: schema.profiles.avatarUrl,
            headline: schema.profiles.headline,
          })
          .from(schema.profiles)
          .where(eq(schema.profiles.ownerId, actor.userId))
          .orderBy(desc(schema.profiles.updatedAt)),
      ),
      this.dbService.withActor(actor, async (tx) =>
        tx
          .select({
            id: schema.cardDesigns.id,
            name: schema.cardDesigns.name,
            productId: schema.cardDesigns.productId,
            variantId: schema.cardDesigns.variantId,
            templateId: schema.cardDesigns.templateId,
            profileId: schema.cardDesigns.profileId,
            previewUrl: schema.cardDesigns.previewUrl,
            backPreviewUrl: schema.cardDesigns.backPreviewUrl,
            previewFrontUrl: schema.cardDesigns.previewFrontUrl,
            previewBackUrl: schema.cardDesigns.previewBackUrl,
            isDraft: schema.cardDesigns.isDraft,
            updatedAt: schema.cardDesigns.updatedAt,
          })
          .from(schema.cardDesigns)
          .where(eq(schema.cardDesigns.customerId, actor.userId))
          .orderBy(desc(schema.cardDesigns.updatedAt)),
      ),
      this.dbService.withActor(actor, async (tx) =>
        tx
          .select()
          .from(schema.purchaseJourneys)
          .where(
            and(
              eq(schema.purchaseJourneys.userId, actor.userId),
              ne(schema.purchaseJourneys.stage, 'COMPLETED'),
            ),
          )
          .orderBy(desc(schema.purchaseJourneys.updatedAt))
          .limit(1),
      ),
    ]);

    const user = userRows[0] || null;
    const journey = journeyRows[0] || null;

    return {
      user,
      entitlements,
      profiles,
      designs,
      journey,
    };
  }

  async upsertActiveJourney(actor: ActorContext, dto: UpdateJourneyDto) {
    if (dto.stage && !VALID_JOURNEY_STAGES.includes(dto.stage)) {
      throw new BadRequestException(`Invalid journey stage "${dto.stage}".`);
    }

    if (
      dto.accountType !== undefined &&
      dto.accountType !== null &&
      dto.accountType !== 'personal' &&
      dto.accountType !== 'business'
    ) {
      throw new BadRequestException('Invalid account type. Must be "personal" or "business".');
    }

    return this.dbService.withActor(actor, async (tx) => {
      // Verify ownership of referenced entities
      if (dto.profileId) {
        const [profile] = await tx
          .select({ id: schema.profiles.id, ownerId: schema.profiles.ownerId })
          .from(schema.profiles)
          .where(eq(schema.profiles.id, dto.profileId))
          .limit(1);
        if (!profile) throw new NotFoundException('Referenced profile not found.');
        if (profile.ownerId !== actor.userId && !actor.isAdmin) {
          throw new ForbiddenException('You do not own the referenced profile.');
        }
      }

      if (dto.designId) {
        const [design] = await tx
          .select({ id: schema.cardDesigns.id, customerId: schema.cardDesigns.customerId })
          .from(schema.cardDesigns)
          .where(eq(schema.cardDesigns.id, dto.designId))
          .limit(1);
        if (!design) throw new NotFoundException('Referenced card design not found.');
        if (design.customerId !== actor.userId && !actor.isAdmin) {
          throw new ForbiddenException('You do not own the referenced card design.');
        }
      }

      if (dto.orderId) {
        const [order] = await tx
          .select({ id: schema.orders.id, userId: schema.orders.userId })
          .from(schema.orders)
          .where(eq(schema.orders.id, dto.orderId))
          .limit(1);
        if (!order) throw new NotFoundException('Referenced order not found.');
        if (order.userId !== actor.userId && !actor.isAdmin) {
          throw new ForbiddenException('You do not own the referenced order.');
        }
      }

      // Find active (non-completed) journey
      const [existing] = await tx
        .select()
        .from(schema.purchaseJourneys)
        .where(
          and(
            eq(schema.purchaseJourneys.userId, actor.userId),
            ne(schema.purchaseJourneys.stage, 'COMPLETED'),
          ),
        )
        .orderBy(desc(schema.purchaseJourneys.updatedAt))
        .limit(1);

      const safeQuantity =
        typeof dto.quantity === 'number' && dto.quantity >= 1 ? Math.floor(dto.quantity) : undefined;

      if (existing) {
        const mergedMetadata = dto.metadata
          ? { ...(existing.metadata || {}), ...dto.metadata }
          : existing.metadata;

        const [updated] = await tx
          .update(schema.purchaseJourneys)
          .set({
            stage: dto.stage ?? existing.stage,
            accountType: dto.accountType ?? existing.accountType,
            selectedProductId:
              dto.selectedProductId !== undefined ? dto.selectedProductId : existing.selectedProductId,
            selectedVariantId:
              dto.selectedVariantId !== undefined ? dto.selectedVariantId : existing.selectedVariantId,
            selectedCardTemplateId:
              dto.selectedCardTemplateId !== undefined
                ? dto.selectedCardTemplateId
                : existing.selectedCardTemplateId,
            selectedProfileTemplateId:
              dto.selectedProfileTemplateId !== undefined
                ? dto.selectedProfileTemplateId
                : existing.selectedProfileTemplateId,
            profileId: dto.profileId !== undefined ? dto.profileId : existing.profileId,
            designId: dto.designId !== undefined ? dto.designId : existing.designId,
            quantity: safeQuantity ?? existing.quantity,
            orderId: dto.orderId !== undefined ? dto.orderId : existing.orderId,
            metadata: mergedMetadata || {},
            updatedAt: new Date(),
          })
          .where(eq(schema.purchaseJourneys.id, existing.id))
          .returning();

        return updated;
      }

      // Determine initial stage if creating a new journey
      const [userRow] = await tx
        .select({ accountType: schema.users.accountType })
        .from(schema.users)
        .where(eq(schema.users.id, actor.userId))
        .limit(1);

      const effectiveAccountType = dto.accountType || userRow?.accountType || null;
      const defaultStage: JourneyStage = effectiveAccountType
        ? 'CHECKOUT'
        : 'ACCOUNT_SETUP';

      const [created] = await tx
        .insert(schema.purchaseJourneys)
        .values({
          id: crypto.randomUUID(),
          userId: actor.userId,
          stage: dto.stage || defaultStage,
          accountType: effectiveAccountType,
          selectedProductId: dto.selectedProductId || null,
          selectedVariantId: dto.selectedVariantId || null,
          selectedCardTemplateId: dto.selectedCardTemplateId || null,
          selectedProfileTemplateId: dto.selectedProfileTemplateId || null,
          profileId: dto.profileId || null,
          designId: dto.designId || null,
          quantity: safeQuantity || 1,
          orderId: dto.orderId || null,
          metadata: dto.metadata || {},
        })
        .returning();

      return created;
    });
  }

  async resetJourney(actor: ActorContext, dto?: UpdateJourneyDto) {
    return this.dbService.withActor(actor, async (tx) => {
      // Mark any existing active journeys as COMPLETED or leave historical rows intact; insert a fresh active journey
      const [userRow] = await tx
        .select({ accountType: schema.users.accountType })
        .from(schema.users)
        .where(eq(schema.users.id, actor.userId))
        .limit(1);

      const effectiveAccountType = dto?.accountType || userRow?.accountType || null;
      const initialStage: JourneyStage =
        dto?.stage || (effectiveAccountType ? 'CHECKOUT' : 'ACCOUNT_SETUP');

      const [created] = await tx
        .insert(schema.purchaseJourneys)
        .values({
          id: crypto.randomUUID(),
          userId: actor.userId,
          stage: initialStage,
          accountType: effectiveAccountType,
          selectedProductId: dto?.selectedProductId || null,
          selectedVariantId: dto?.selectedVariantId || null,
          selectedCardTemplateId: dto?.selectedCardTemplateId || null,
          selectedProfileTemplateId: dto?.selectedProfileTemplateId || null,
          profileId: dto?.profileId || null,
          designId: dto?.designId || null,
          quantity: dto?.quantity && dto.quantity >= 1 ? Math.floor(dto.quantity) : 1,
          orderId: null,
          metadata: dto?.metadata || {},
        })
        .returning();

      return created;
    });
  }
}
