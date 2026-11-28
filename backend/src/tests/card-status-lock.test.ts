import { describe, it, expect } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import {
  assertCardNotLocked,
  serializePurchasedCardForUser,
} from '../modules/cards/card-serializer';

describe('Card Status Lock & Serializer', () => {
  const sampleCard = {
    id: 'pc_123',
    cardCode: 'TPZABC123',
    productName: 'Metal NFC Card — Black',
    variantName: 'Black',
    material: 'metal',
    colorName: 'Black',
    color: '#000000',
    orderId: 'ord_123',
    unitIndex: 1,
    status: 'ACTIVE',
    statusChangedAt: new Date('2026-11-28T10:00:00Z'),
    redirectToken: 'secret_tok_999',
    nfcUrl: 'https://taptch.com/p/secret_tok_999',
    chipUid: '04:AB:CD:EF',
    profileId: 'prof_123',
    profileUsername: 'alex',
    customDestinationUrl: 'https://example.com',
    destinationType: 'profile',
    featureFlags: {
      leadCapture: true,
      vcardDownload: true,
      whatsappButton: true,
      analytics: true,
      passwordProtection: false,
      linkExpiryDate: null,
    },
    tapCount: 42,
    lastTappedAt: new Date('2026-11-28T09:00:00Z'),
    assignedAt: new Date('2026-11-20T09:00:00Z'),
    physicalCardId: 'card_phys_1',
  };

  const sampleContext = {
    order: { id: 'ord_123', orderNumber: 'TPZ-1001' },
    profile: { id: 'prof_123', displayName: 'Alex Mercer', slug: 'alex', profileType: 'personal' },
    permanentNfcUrl: 'https://taptch.com/p/secret_tok_999',
  };

  it('omits URL, QR, chip UID, profile, toggles, and tap stats when SUSPENDED', () => {
    const result = serializePurchasedCardForUser(
      { ...sampleCard, status: 'SUSPENDED' },
      sampleContext,
    );

    expect(result.status).toBe('SUSPENDED');
    expect(result.isLocked).toBe(true);
    expect(result.cardCode).toBe('TPZABC123');
    expect(result.orderId).toBe('ord_123');
    expect(result.orderNumber).toBe('TPZ-1001');
    expect(result.message).toContain('suspended');

    expect(result).not.toHaveProperty('nfcUrl');
    expect(result).not.toHaveProperty('permanentUrl');
    expect(result).not.toHaveProperty('redirectToken');
    expect(result).not.toHaveProperty('chipUid');
    expect(result).not.toHaveProperty('profileId');
    expect(result).not.toHaveProperty('profileUsername');
    expect(result).not.toHaveProperty('profile');
    expect(result).not.toHaveProperty('customDestinationUrl');
    expect(result).not.toHaveProperty('featureFlags');
    expect(result).not.toHaveProperty('tapCount');
    expect(result).not.toHaveProperty('lastTappedAt');
  });

  it('omits URL, QR, chip UID, profile, toggles, and tap stats when LOST', () => {
    const result = serializePurchasedCardForUser(
      { ...sampleCard, status: 'LOST' },
      sampleContext,
    );

    expect(result.status).toBe('LOST');
    expect(result.isLocked).toBe(true);
    expect(result.message).toContain('lost');
    expect(result).not.toHaveProperty('nfcUrl');
    expect(result).not.toHaveProperty('profile');
    expect(result).not.toHaveProperty('tapCount');
  });

  it('restores full card details when reactivated to ACTIVE', () => {
    const result = serializePurchasedCardForUser(
      { ...sampleCard, status: 'ACTIVE' },
      sampleContext,
    );

    expect(result.status).toBe('ACTIVE');
    expect(result.isLocked).toBe(false);
    expect(result.nfcUrl).toBe('https://taptch.com/p/secret_tok_999');
    expect(result.profile).toEqual(sampleContext.profile);
    expect(result.featureFlags).toEqual(sampleCard.featureFlags);
    expect(result.tapCount).toBe(42);
  });

  it('rejects user actions on SUSPENDED and LOST cards with 403 ForbiddenException', () => {
    expect(() => assertCardNotLocked({ status: 'SUSPENDED' })).toThrow(ForbiddenException);
    expect(() => assertCardNotLocked({ status: 'LOST' })).toThrow(ForbiddenException);
    expect(() => assertCardNotLocked({ status: 'ACTIVE' })).not.toThrow();
    expect(() => assertCardNotLocked({ status: 'ASSIGNED' })).not.toThrow();
    expect(() => assertCardNotLocked({ status: 'UNASSIGNED' })).not.toThrow();
  });
});
