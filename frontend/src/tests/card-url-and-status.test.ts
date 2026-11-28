import { describe, it, expect } from 'vitest';
import { resolveCardPublicUrl, buildCardUrl } from '../lib/card-url';
import { normalizeCardStatus, CARD_STATUS_LABELS } from '../lib/card-status';

describe('Canonical Card URL & Status Helpers', () => {
  it('resolveCardPublicUrl uses cardCode, urlId, redirectToken, or id consistently without /c/ prefix', () => {
    const urlFromCode = resolveCardPublicUrl({
      id: 'card-123',
      cardCode: '73zz7caxpv',
      redirectToken: 'tok_old',
    });
    expect(urlFromCode).toBe(buildCardUrl('73zz7caxpv'));
    expect(urlFromCode).not.toContain('/c/');

    const urlFromToken = resolveCardPublicUrl({
      id: 'card-456',
      cardCode: null,
      redirectToken: 'tok_only_123',
    });
    expect(urlFromToken).toBe(buildCardUrl('tok_only_123'));
    expect(urlFromToken).not.toContain('/c/');
  });

  it('normalizeCardStatus keeps ASSIGNED distinct from ACTIVE and maps REVOKED to SUSPENDED', () => {
    expect(normalizeCardStatus('ASSIGNED')).toBe('ASSIGNED');
    expect(CARD_STATUS_LABELS.ASSIGNED).toBe('Assigned');
    expect(normalizeCardStatus('PROFILE_ATTACHED')).toBe('ASSIGNED');
    expect(normalizeCardStatus('ACTIVE')).toBe('ACTIVE');
    expect(normalizeCardStatus('REVOKED')).toBe('SUSPENDED');
    expect(normalizeCardStatus('LOST')).toBe('LOST');
    expect(normalizeCardStatus('UNASSIGNED')).toBe('UNASSIGNED');
  });
});
