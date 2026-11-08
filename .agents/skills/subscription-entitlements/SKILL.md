---
name: subscription-entitlements
description: "Master Taptch's 4-tier plan matrix (nano, micro, mini, max), resource limits enforcement, server-side permission gates (can), and tenant subscription overrides."
risk: safe
source: Taptch-core
date_added: "2026-11-02"
version: "1.0.0"
---

# Taptch Subscription & Entitlements Engine Skill

Engineering specification for Taptch's data-driven subscription plans, resource limits enforcement (`assertWithinLimit`), and server-side authorization gates (`can()`).

---

## 1. When to Use This Skill

- Enforcing feature gates or resource limits (e.g. maximum profiles, maximum businesses, custom domains).
- Modifying plan tiers or entitlement keys in `src/modules/entitlements/index.ts`.
- Evaluating user permissions with `can(actor, action, resource)`.
- Assigning subscription plans to individual users or corporate organizations.

---

## 2. The 4-Tier Plan Matrix

| Entitlement Key | Nano (Free) | Micro (Solo) | Mini (Growth) | Max (Enterprise) |
| :--- | :--- | :--- | :--- | :--- |
| `max_profiles` | 1 | 2 | 5 | 20 |
| `max_businesses` | 0 | 1 | 3 | 10 |
| `has_exchange_contact` | false | true | true | true |
| `has_gallery` | false | true (5 imgs) | true (15 imgs) | true (50 imgs) |
| `has_product_catalogue`| false | false | true (10 items)| true (50 items) |
| `has_service_catalogue`| false | false | false | true (50 items) |
| `has_brochure_download`| false | false | false | true |
| `has_youtube_videos` | false | false | false | true |
| `custom_domain_allowed`| false | false | false | true |
| **Price** | **₹0 / forever** | **₹499 / year** | **₹1,499 / year** | **₹3,999 / year** |

---

## 3. Server-Side Limit Assertion Pattern

Never rely on frontend UI disablement for entitlement enforcement. All resource creations must verify limits on the server before database mutation:

```ts
import { assertWithinLimit, getEntitlements } from '@/modules/entitlements';

export async function addBusiness(actor: ActorContext, profileId: string, input: CreateBusinessInput) {
  // 1. Resolve current business count
  const existingBusinesses = await db
    .select({ count: sql<number>`count(*)` })
    .from(profileBusinesses)
    .where(eq(profileBusinesses.profileId, profileId));

  const currentCount = Number(existingBusinesses[0]?.count || 0);

  // 2. Assert within plan limit (throws EntitlementLimitExceededError if limit reached)
  const target = actor.orgId ? { organizationId: actor.orgId } : { userId: actor.userId };
  await assertWithinLimit(target, 'max_businesses', currentCount + 1);

  // 3. Proceed with database insertion
}
```

---

## 4. Tenant Subscription Resolution & Fallback

Subscriptions can be assigned at two levels:
1. **Organization Subscription**: Applies to all members of a corporate tenant (`organizationId`).
2. **Individual User Subscription**: Assigned directly to a standalone user (`userId`).
3. **Default Fallback**: If no active subscription exists, the engine automatically falls back to the **Nano** (Free Forever) plan.

---

## 5. Mandatory Engineering Rules

1. **Phase 2 Payments Deferral**: Payment gateway SDKs (Razorpay, Stripe) are completely deferred. Plans are assigned manually by Super Admin or initialized upon registration.
2. **Never Catch and Ignore Limits**: When `assertWithinLimit` throws `EntitlementLimitExceededError`, propagate the error as an HTTP 403 or descriptive domain exception.
3. **Audit Log Plan Assignments**: Any manual upgrade by an administrator must log an entry in the `audit_logs` table recording `actorId`, `targetId`, `previousPlan`, and `newPlan`.

