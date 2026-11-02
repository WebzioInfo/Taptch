import { describe, it, expect } from 'vitest';
import { getEntitlements, assertWithinLimit, EntitlementLimitExceededError } from '@/modules/entitlements';

describe('Entitlement Engine', () => {
  it('defaults to Free Forever plan for users without an explicit subscription', async () => {
    const res = await getEntitlements({ userId: 'usr-unknown-random' });
    expect(res.planId).toBe('free');
    expect(res.entitlements.max_profiles).toBe(1);
    expect(res.entitlements.max_cards).toBe(0);
    expect(res.entitlements.custom_domain_allowed).toBe(false);
  });

  it('retrieves the active plan and entitlements for an enrolled organization', async () => {
    // Apex Capital Partners was seeded with Business plan
    const res = await getEntitlements({ organizationId: 'org-apex-capital' });
    expect(res.planId).toBe('business');
    expect(res.entitlements.max_profiles).toBe(10);
    expect(res.entitlements.max_cards).toBe(5);
    expect(res.entitlements.custom_domain_allowed).toBe(true);
  });

  it('assertWithinLimit passes when count is within the allowance', async () => {
    await expect(
      assertWithinLimit({ organizationId: 'org-apex-capital' }, 'max_profiles', 5)
    ).resolves.toBeUndefined();

    await expect(
      assertWithinLimit({ organizationId: 'org-apex-capital' }, 'custom_domain_allowed')
    ).resolves.toBeUndefined();
  });

  it('assertWithinLimit throws EntitlementLimitExceededError when count exceeds allowance', async () => {
    try {
      await assertWithinLimit({ organizationId: 'org-apex-capital' }, 'max_profiles', 15);
      expect.fail('Should have thrown EntitlementLimitExceededError');
    } catch (err) {
      expect(err).toBeInstanceOf(EntitlementLimitExceededError);
      const e = err as EntitlementLimitExceededError;
      expect(e.limitKey).toBe('max_profiles');
      expect(e.maxAllowed).toBe(10);
      expect(e.currentCount).toBe(15);
      expect(e.planId).toBe('business');
    }
  });

  it('assertWithinLimit throws when a boolean feature is disabled for the plan', async () => {
    try {
      await assertWithinLimit({ userId: 'usr-unsubscribed' }, 'custom_domain_allowed');
      expect.fail('Should have thrown EntitlementLimitExceededError');
    } catch (err) {
      expect(err).toBeInstanceOf(EntitlementLimitExceededError);
      const e = err as EntitlementLimitExceededError;
      expect(e.limitKey).toBe('custom_domain_allowed');
      expect(e.maxAllowed).toBe(false);
      expect(e.planId).toBe('free');
    }
  });

  it('correctly validates the Nano tier feature matrix boundaries', async () => {
    // Default fallback entitlements for unsubscribed user match Nano baseline
    const res = await getEntitlements({ userId: 'usr-unsubscribed-nano' });
    expect(res.entitlements.has_gallery).toBe(false);
    expect(res.entitlements.max_businesses).toBe(0);
    expect(res.entitlements.has_product_catalogue).toBe(false);
    expect(res.entitlements.has_service_catalogue).toBe(false);

    // Asserting gallery on Nano throws EntitlementLimitExceededError
    await expect(
      assertWithinLimit({ userId: 'usr-unsubscribed-nano' }, 'has_gallery')
    ).rejects.toThrow(EntitlementLimitExceededError);
  });
});
