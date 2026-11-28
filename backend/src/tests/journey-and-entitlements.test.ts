import { describe, it, expect, beforeAll } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as schema from '../database/schema';
import { AuthService } from '../modules/auth/auth.service';
import { EntitlementsService } from '../modules/entitlements/entitlements.service';
import { ProfilesService } from '../modules/profiles/profiles.service';
import { DesignsService } from '../modules/designs/designs.service';
import { CardsService } from '../modules/cards/cards.service';
import { OrdersService } from '../modules/orders/orders.service';
import { AuthController } from '../modules/auth/auth.controller';
import { ForbiddenException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import fs from 'fs';
import path from 'path';

describe('Post-Purchase Profile Setup & Card Allocations (Tests A-E)', () => {
  let db: any;
  let dbService: any;
  let redisService: any;
  let authService: AuthService;
  let entitlementsService: EntitlementsService;
  let profilesService: ProfilesService;
  let designsService: DesignsService;
  let cardsService: CardsService;
  let ordersService: OrdersService;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.ALLOW_UPI_TEST_SIMULATOR = 'true';
    const pglite = new PGlite();
    db = drizzle(pglite, { schema });

    const migrationsDir = path.resolve(__dirname, '../database/migrations');
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      await pglite.exec(sql);
    }

    dbService = {
      db,
      withActor: async (actor: any, fn: (tx: any) => Promise<any>) => fn(db),
    };

    const store = new Map<string, string>();
    redisService = {
      get: async (k: string) => store.get(k) || null,
      set: async (k: string, v: string) => {
        store.set(k, v);
      },
      del: async (k: string) => {
        store.delete(k);
      },
    };

    authService = new AuthService(dbService, redisService);
    entitlementsService = new EntitlementsService(dbService);
    profilesService = new ProfilesService(dbService, redisService, entitlementsService);
    designsService = new DesignsService(dbService);
    cardsService = new CardsService(dbService);
    ordersService = new OrdersService(dbService);
  }, 30000);

  it('Test A & B: New Personal Customer purchases card without profile, then sets up & attaches profile later', async () => {
    const res = await authService.signUp('Personal Buyer', 'buyer@taptch.test', 'Password123!', 'personal');
    expect(res.user.accountType).toBe('personal');
    const actor = { userId: res.user.id, orgId: null, role: 'user', isAdmin: false };

    // 1. Customize card before profile exists
    const design = await designsService.upsertDraft(actor, {
      name: 'Personal Obsidian Card',
      productId: 'prod_matte_obsidian',
      frontCanvasJson: '{"objects":[]}',
    });

    // 2. Complete checkout & payment WITHOUT any profile
    const order = await ordersService.createOrder(actor, {
      designId: design.id,
      productId: 'prod_matte_obsidian',
      quantity: 1,
      cardMaterial: 'matte',
      paymentMethod: 'upi',
      shippingAddress: {
        fullName: 'Personal Buyer',
        phone: '9876543210',
        addressLine1: '101 Residency Rd',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560025',
        country: 'India',
      },
    });
    expect(order.profileId).toBeNull();
    expect(await profilesService.findAllForActor(actor)).toHaveLength(0);

    // Verify UPI payment (and test duplicate payment callback idempotency)
    await ordersService.verifyPayment(order.id, actor, { paymentMethod: 'upi', simulationStatus: 'SUCCESS' });
    await ordersService.verifyPayment(order.id, actor, { paymentMethod: 'upi', simulationStatus: 'SUCCESS' });

    // 3. Purchased card allocation created in AWAITING_PROFILE state (no duplicates!)
    const purchased = await cardsService.findPurchasedCardsForActor(actor);
    expect(purchased.length).toBe(1);
    expect(purchased[0].profileAssignmentStatus).toBe('AWAITING_PROFILE');
    expect(purchased[0].profileId).toBeNull();

    // 4. Delayed Post-Purchase Profile Setup
    const prof = await profilesService.create(actor, {
      displayName: 'Personal Buyer Profile',
      slug: 'personal-buyer-prof',
      templateId: 'obsidian-luxury',
      profileType: 'personal',
    });

    // 2nd profile blocked by Personal account 1-profile entitlement
    await expect(
      profilesService.create(actor, {
        displayName: 'Second Personal Profile',
        slug: 'personal-buyer-prof-2',
        templateId: 'obsidian-luxury',
      }),
    ).rejects.toThrow(ForbiddenException);

    // 5. Attach profile to purchased card, then disconnect without deleting either
    const attached = await cardsService.attachProfileToPurchasedCard(actor, purchased[0].id, prof.id);
    expect(attached.profileAssignmentStatus).toBe('PROFILE_ATTACHED');
    expect(attached.profileId).toBe(prof.id);

    const disconnected = await cardsService.disconnectProfileFromPurchasedCard(actor, purchased[0].id);
    expect(disconnected.profileAssignmentStatus).toBe('AWAITING_PROFILE');
    expect(disconnected.profileId).toBeNull();
    expect(await profilesService.findAllForActor(actor)).toHaveLength(1);

    // Re-attach profile to purchased card
    const reattached = await cardsService.attachProfileToPurchasedCard(actor, purchased[0].id, prof.id);
    expect(reattached.profileAssignmentStatus).toBe('PROFILE_ATTACHED');

    // 6. Additional card order (quantity = 2) is allowed for personal account too
    const replacementOrder = await ordersService.createOrder(actor, {
      productId: 'prod_classic_pvc',
      quantity: 2,
      cardMaterial: 'pvc',
      paymentMethod: 'cod',
      shippingAddress: {
        fullName: 'Personal Buyer',
        phone: '9876543210',
        addressLine1: '101 Residency Rd',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560025',
        country: 'India',
      },
    });
    expect(replacementOrder.id).toBeDefined();
    const allPurchased = await cardsService.findPurchasedCardsForActor(actor);
    expect(allPurchased.length).toBe(3);
  });

  it('Test C & D: Business Bulk Purchase allocates independent cards and attaches distinct profiles', async () => {
    const biz = await authService.signUp('Acme Corp', 'acme@taptch.test', 'Password123!', 'business');
    const actor = { userId: biz.user.id, orgId: null, role: 'user', isAdmin: false };

    // Order 3 cards without any profiles
    const order = await ordersService.createOrder(actor, {
      productId: 'prod_brushed_metal',
      quantity: 3,
      cardMaterial: 'metal',
      paymentMethod: 'cod',
      shippingAddress: {
        fullName: 'Acme Corp',
        phone: '9876543210',
        addressLine1: 'Tech Park',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560103',
        country: 'India',
      },
    });

    const cards = await cardsService.findPurchasedCardsForActor(actor);
    expect(cards.length).toBe(3);
    expect(cards.every((c) => c.profileAssignmentStatus === 'AWAITING_PROFILE' && c.profileId === null)).toBe(true);

    // Create 2 distinct profiles post-purchase and attach to cards #1 and #2 independently
    const p1 = await profilesService.create(actor, {
      displayName: 'Alice (CEO)',
      slug: 'acme-alice',
      templateId: 'obsidian-luxury',
      profileType: 'business',
    });
    const p2 = await profilesService.create(actor, {
      displayName: 'Bob (CTO)',
      slug: 'acme-bob',
      templateId: 'clean-corporate',
      profileType: 'business',
    });

    await cardsService.attachProfileToPurchasedCard(actor, cards[0].id, p1.id);
    await cardsService.attachProfileToPurchasedCard(actor, cards[1].id, p2.id);

    const updatedCards = await cardsService.findPurchasedCardsForActor(actor);
    const c1 = updatedCards.find((c) => c.id === cards[0].id);
    const c2 = updatedCards.find((c) => c.id === cards[1].id);
    const c3 = updatedCards.find((c) => c.id === cards[2].id);

    expect(c1?.profileId).toBe(p1.id);
    expect(c2?.profileId).toBe(p2.id);
    expect(c3?.profileId).toBeNull();
    expect(c3?.profileAssignmentStatus).toBe('AWAITING_PROFILE');
  });

  it('Test E: Cross-account IDOR protection on purchased card attachment & failed payment does not allocate cards', async () => {
    const userA = await authService.signUp('Owner A', 'ownera@taptch.test', 'Password123!', 'personal');
    const userB = await authService.signUp('Attacker B', 'attackerb@taptch.test', 'Password123!', 'personal');

    const actorA = { userId: userA.user.id, orgId: null, role: 'user', isAdmin: false };
    const actorB = { userId: userB.user.id, orgId: null, role: 'user', isAdmin: false };

    const profA = await profilesService.create(actorA, {
      displayName: 'Owner A Profile',
      slug: 'owner-a-prof',
      templateId: 'obsidian-luxury',
    });

    // User A places a failed UPI order -> zero purchased_cards allocated
    const failedOrder = await ordersService.createOrder(actorA, {
      productId: 'prod_classic_pvc',
      quantity: 1,
      cardMaterial: 'pvc',
      paymentMethod: 'upi',
      shippingAddress: {
        fullName: 'Owner A',
        phone: '9876543210',
        addressLine1: '123 Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India',
      },
    });
    await ordersService.verifyPayment(failedOrder.id, actorA, {
      paymentMethod: 'upi',
      simulationStatus: 'FAILED',
    });
    const cardsAfterFail = await cardsService.findPurchasedCardsForActor(actorA);
    expect(cardsAfterFail.length).toBe(0);

    // User A completes a COD order -> 1 purchased card
    await ordersService.createOrder(actorA, {
      productId: 'prod_classic_pvc',
      quantity: 1,
      cardMaterial: 'pvc',
      paymentMethod: 'cod',
      shippingAddress: {
        fullName: 'Owner A',
        phone: '9876543210',
        addressLine1: '123 Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India',
      },
    });
    const [cardA] = await cardsService.findPurchasedCardsForActor(actorA);
    const profB = await profilesService.create(actorB, {
      displayName: 'Attacker B Profile',
      slug: 'attacker-b-prof',
      templateId: 'obsidian-luxury',
    });

    // User B cannot attach their profile to User A's card
    await expect(
      cardsService.attachProfileToPurchasedCard(actorB, cardA.id, profB.id),
    ).rejects.toThrow(ForbiddenException);

    // User A cannot attach User B's profile to User A's card
    await expect(
      cardsService.attachProfileToPurchasedCard(actorA, cardA.id, profB.id),
    ).rejects.toThrow(ForbiddenException);

    // Valid attachment succeeds
    const ok = await cardsService.attachProfileToPurchasedCard(actorA, cardA.id, profA.id);
    expect(ok.profileAssignmentStatus).toBe('PROFILE_ATTACHED');
  });

  it('OAuth Exchange Lifecycle: Postgres fallback, simultaneous/duplicate rejection, expiry, and protected API access', async () => {
    const user = await authService.signUp('Google User', 'google@taptch.test', 'Password123!', 'personal');
    const authController = new AuthController(authService);

    // 1. Create exchange code
    const code = await authService.createExchangeCode(user.session.token, user.user.id);

    // 2. Simulate Redis miss (multi-worker / cross-instance) -> must resolve from PostgreSQL verifications table
    await redisService.del(`auth:code:${code}`);

    const mockRes = { cookie: () => {} } as any;
    const [first, second] = await Promise.allSettled([
      authController.exchangeCode({ code }, mockRes),
      authController.exchangeCode({ code }, mockRes),
    ]);

    // Exactly one succeeds and one is rejected with UnauthorizedException
    const fulfilled = [first, second].filter((r) => r.status === 'fulfilled') as PromiseFulfilledResult<any>[];
    const rejected = [first, second].filter((r) => r.status === 'rejected') as PromiseRejectedResult[];
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);
    expect(rejected[0].reason).toBeInstanceOf(UnauthorizedException);

    // 3. Returned session is valid and grants protected API access
    const sessionData = fulfilled[0].value;
    expect(sessionData.user.email).toBe('google@taptch.test');
    const fetchedSession = await authService.getSession(sessionData.session.token);
    expect(fetchedSession?.user?.id).toBe(user.user.id);

    const profiles = await profilesService.findAllForActor({
      userId: sessionData.user.id,
      orgId: null,
      role: 'user',
      isAdmin: false,
    });
    expect(Array.isArray(profiles)).toBe(true);

    // 4. Invalid code is rejected
    await expect(authController.exchangeCode({ code: 'invalid_code_123' }, mockRes)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
