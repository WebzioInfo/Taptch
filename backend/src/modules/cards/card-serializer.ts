import { ForbiddenException } from '@nestjs/common';

export function getPublicBaseUrl(): string {
    const raw =
      process.env.PUBLIC_BASE_URL ||
      process.env.NFC_PUBLIC_BASE_URL ||
      process.env.PUBLIC_APP_URL ||
    process.env.FRONTEND_URL ||
      'https://taptch.com';
    return raw
      .trim()
      .replace(/^['"]|['"]$/g, '')
      .replace(/\/+$/, '');
  }

  export function buildCardUrl(id: string): string {
    const base = getPublicBaseUrl();
    const cleanId = (id || '').trim();
    if (!cleanId) return base;
    return `${base}/${encodeURIComponent(cleanId)}`;
  }

  export function buildProfileUrl(profile: {
    slug?: string | null;
    profileType?: string | null;
  }): string {
    const base = getPublicBaseUrl();
    const slug = (profile?.slug || '').trim();
    const prefix = profile?.profileType === 'business' ? 'b' : 'p';
    if (!slug) return base;
    return `${base}/${prefix}/${encodeURIComponent(slug)}`;
  }

  export type CanonicalCardStatus = 'UNASSIGNED' | 'ASSIGNED' | 'ACTIVE' | 'SUSPENDED' | 'LOST';

  export function normalizePurchasedCardStatus(
    rawStatus?: string | null,
    profileId?: string | null,
  ): CanonicalCardStatus {
    const upper = (rawStatus || '').trim().toUpperCase();
    if (upper === 'SUSPENDED' || upper === 'REVOKED' || upper === 'DEACTIVATED') {
      return 'SUSPENDED';
    }
    if (upper === 'LOST') {
      return 'LOST';
    }
    if (upper === 'ACTIVE') {
      return 'ACTIVE';
    }
    if (upper === 'ASSIGNED' || upper === 'PROFILE_ATTACHED' || upper === 'ACTIVATION_PENDING') {
      return 'ASSIGNED';
    }
    if (upper === 'UNASSIGNED') {
      return profileId ? 'ASSIGNED' : 'UNASSIGNED';
    }
    return profileId ? 'ASSIGNED' : 'UNASSIGNED';
  }

  export function isCardLockedStatus(rawStatus?: string | null, profileAssignmentStatus?: string | null): boolean {
    const upper = (rawStatus || '').trim().toUpperCase();
    const assignUpper = (profileAssignmentStatus || '').trim().toUpperCase();
    return (
      upper === 'SUSPENDED' ||
      upper === 'LOST' ||
      upper === 'REVOKED' ||
      upper === 'DEACTIVATED' ||
      assignUpper === 'REVOKED'
    );
  }

  export function assertCardNotLocked(card: {
    status?: string | null;
    profileAssignmentStatus?: string | null;
  }): void {
    const upper = (card.status || '').trim().toUpperCase();
    const assignUpper = (card.profileAssignmentStatus || '').trim().toUpperCase();
    if (upper === 'LOST') {
      throw new ForbiddenException('This card is marked as lost. Contact support.');
    }
    if (
      upper === 'SUSPENDED' ||
      upper === 'REVOKED' ||
      upper === 'DEACTIVATED' ||
      assignUpper === 'REVOKED'
    ) {
      throw new ForbiddenException('This card is suspended. Contact support.');
    }
  }

  export function getLockedCardMessage(status: 'SUSPENDED' | 'LOST'): string {
    if (status === 'LOST') {
      return 'This card is marked as lost and has been disabled.';
    }
    return "This card is suspended. It can't be used until it's reactivated.";
  }

  export interface PurchasedCardSerializeContext {
    order?: {
      id: string;
      orderNumber?: string | null;
      orderStatus?: string | null;
      paymentStatus?: string | null;
      createdAt?: Date | string | null;
    } | null;
    profile?: {
      id: string;
      displayName?: string | null;
      slug?: string | null;
      profileType?: string | null;
      templateId?: string | null;
      status?: string | null;
      usernameLocked?: boolean | null;
    } | null;
    product?: {
      id?: string;
      name?: string | null;
      material?: string | null;
      colorName?: string | null;
      color?: string | null;
      imageUrl?: string | null;
    } | null;
    permanentNfcUrl?: string | null;
  }

  /**
   * Shared user-facing serializer for purchased NFC cards.
   * When a card is SUSPENDED or LOST, all sensitive/functional fields
   * (URL, QR data, chip UID, assigned profile, custom redirect, feature toggles, tap counts)
   * are strictly omitted and only basic identity + status + message are returned.
   */
  export function serializePurchasedCardForUser(
    card: Record<string, any>,
    context: PurchasedCardSerializeContext = {},
  ): Record<string, any> {
    const normalizedStatus = normalizePurchasedCardStatus(
      card.profileAssignmentStatus === 'REVOKED' ? 'SUSPENDED' : card.status,
      card.profileId,
    );

    if (normalizedStatus === 'SUSPENDED' || normalizedStatus === 'LOST') {
      return {
        id: card.id,
        cardCode: card.cardCode ?? null,
        productName: card.productName || context.product?.name || null,
        variantName: card.variantName ?? null,
        material: card.material || context.product?.material || 'pvc',
        colorName: card.colorName || context.product?.colorName || card.variantName || null,
        color: card.color || context.product?.color || null,
        orderId: card.orderId ?? null,
        orderNumber: context.order?.orderNumber ?? null,
        unitIndex: card.unitIndex ?? 1,
        status: normalizedStatus,
        statusChangedAt: card.statusChangedAt || card.updatedAt || null,
        message: getLockedCardMessage(normalizedStatus),
        isLocked: true,
      };
    }

    const matchedProd = context.product || null;
    const permanentNfcUrl = context.permanentNfcUrl ?? null;
    const isActivated = normalizedStatus === 'ACTIVE';
    const isRegistered = Boolean(card.physicalCardId) || isActivated;
    const profileAttached = Boolean(card.profileId && context.profile);

    return {
      ...card,
      status: normalizedStatus,
      statusChangedAt: card.statusChangedAt || null,
      isLocked: false,
      isActivated,
      isRegistered,
      profileAttached,
      material: card.material || matchedProd?.material || 'pvc',
      colorName: card.colorName || matchedProd?.colorName || card.variantName || null,
      color: card.color || matchedProd?.color || null,
      previewFrontUrl: card.previewFrontUrl || matchedProd?.imageUrl || null,
      permanentUrl: permanentNfcUrl,
      nfcUrl: permanentNfcUrl || card.nfcUrl || null,
      order: context.order ?? null,
      profile: context.profile ?? null,
    };
  }
