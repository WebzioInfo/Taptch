import { describe, it, expect, beforeAll } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { eq, sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import * as schema from '../database/schema';
import { AdminService } from '../modules/admin/admin.service';
import { CardsService } from '../modules/cards/cards.service';
import { ActivityLogService } from '../modules/admin/activity-log.service';
import { buildCardUrl } from '../modules/cards/card-serializer';
import type { ActorContext } from '../common/types';

describe('NFC Resolution & Card Lifecycle Real PGlite Integration Tests', () => {
  let db: any;
  let dbService: any;
  let adminService: AdminService;
  let cardsService: CardsService;

  const adminActor: ActorContext = { userId: 'adm_nfc_1', orgId: null, role: 'admin', isAdmin: true };
  const customerActor: ActorContext = { userId: 'cust_nfc_1', orgId: null, role: 'user', isAdmin: false };

  beforeAll(async () => {
    const pglite = new PGlite();
    db = drizzle(pglite, { schema });

    const migrationsDir = path.resolve(__dirname, '../database/migrations');
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
    for (const file of files) {
      const migrationSql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      await pglite.exec(migrationSql);
    }

    dbService = {
      db,
      withActor: async (_actor: ActorContext, fn: (tx: any) => Promise<any>) => {
        return db.transaction(async (tx: any) => {
          await tx.execute(sql`SELECT set_config('app.current_user_id', ${_actor.userId}, true)`);
          await tx.execute(sql`SELECT set_config('app.is_admin', ${_actor.isAdmin ? 'true' : 'false'}, true)`);
          return fn(tx);
        });
      },
    };

    const activityLogService = new ActivityLogService(dbService);
    adminService = new AdminService(dbService, undefined, activityLogService);
    cardsService = new CardsService(dbService);

    await db.insert(schema.users).values([
      {
        id: 'adm_nfc_1',
        name: 'Admin NFC',
        email: 'admin-nfc@taptch.test',
        systemRole: 'admin',
        status: 'active',
        emailVerified: true,
      },
      {
        id: 'cust_nfc_1',
        name: 'Customer NFC',
        email: 'cust-nfc@taptch.test',
        systemRole: 'user',
        status: 'active',
        emailVerified: true,
      },
    ]);

    await db.insert(schema.cardProducts).values({
      id: 'prod_nfc_test',
      name: 'Obsidian Metal',
      slug: 'obsidian-metal-test',
      description: 'Test metal card',
      material: 'metal',
      colorName: 'Black',
      color: '#000000',
      basePrice: 1999,
      isActive: true,
    });

    await db.insert(schema.profiles).values([
      {
        id: 'prof_pub_1',
        ownerId: 'cust_nfc_1',
        displayName: 'dafs',
        slug: 'sdf',
        profileType: 'personal',
        status: 'PUBLISHED',
        templateId: 'cinematic-noir',
      },
      {
        id: 'prof_pub_2',
        ownerId: 'cust_nfc_1',
        displayName: 'Second Profile',
        slug: 'second-prof',
        profileType: 'business',
        status: 'PUBLISHED',
        templateId: 'obsidian-luxury',
      },
      {
        id: 'prof_draft_1',
        ownerId: 'cust_nfc_1',
        displayName: 'Draft Profile',
        slug: 'draft-prof',
        profileType: 'personal',
        status: 'DRAFT',
        templateId: 'cinematic-noir',
      },
    ]);
  });

  it('1-7: Admin-issued local card resolves locally, keeps consistent status across Admin & Customer, and preserves URL on reassignment', async () => {
    const prevBase = process.env.PUBLIC_BASE_URL;
    process.env.PUBLIC_BASE_URL = 'http://localhost:5173';
    try {
      const issued = await adminService.registerCard(
        {
          userId: 'cust_nfc_1',
          productId: 'prod_nfc_test',
          profileId: 'prof_pub_1',
          quantity: 1,
        },
        adminActor,
      );

      expect(issued.items).toHaveLength(1);
      const card = issued.items[0];
      expect(card.cardCode).toBeTruthy();
      expect(card.nfcUrl).toBe(`http://localhost:5173/${card.cardCode}`);

      // Admin detail view
      const adminDetail = await adminService.getCardDetails(card.id);
      expect(adminDetail.card.status).toBe('ASSIGNED');
      expect(adminDetail.card.profileSlug).toBe('sdf');

      // Customer dashboard view
      const customerCards = await cardsService.findPurchasedCardsForActor(customerActor);
      const custCard = customerCards.find((c: any) => c.id === card.id);
      expect(custCard).toBeDefined();
      expect(custCard.status).toBe('ASSIGNED');
      expect(custCard.isRegistered).toBe(false);
      expect(custCard.isActivated).toBe(false);
      expect(custCard.profileAttached).toBe(true);
      expect(custCard.nfcUrl).toBe(`http://localhost:5173/${card.cardCode}`);

      // Public resolution
      const resolved1 = await cardsService.resolvePublicNfcToken(card.cardCode);
      expect(resolved1).toMatchObject({
        status: 'active',
        destinationType: 'profile',
        destinationUrl: '/p/sdf',
        profileSlug: 'sdf',
      });

      // Reassign to second published profile (business) without changing permanent URL
      await adminService.updateCardAdmin(card.id, { profileId: 'prof_pub_2' }, adminActor);
      const customerAfterReassign = await cardsService.findPurchasedCardsForActor(customerActor);
      const reassignedCard = customerAfterReassign.find((c: any) => c.id === card.id);
      expect(reassignedCard.nfcUrl).toBe(`http://localhost:5173/${card.cardCode}`);
      expect(reassignedCard.status).toBe('ASSIGNED');

      const resolved2 = await cardsService.resolvePublicNfcToken(card.cardCode);
      expect(resolved2).toMatchObject({
        status: 'active',
        destinationType: 'profile',
        destinationUrl: '/b/second-prof',
        profileSlug: 'second-prof',
      });
    } finally {
      if (prevBase === undefined) delete process.env.PUBLIC_BASE_URL;
      else process.env.PUBLIC_BASE_URL = prevBase;
    }
  });

  it('3 & 8: Production URL generation and legacy redirectToken resolution work cleanly', async () => {
    const prevBase = process.env.PUBLIC_BASE_URL;
    process.env.PUBLIC_BASE_URL = 'https://taptch.com';
    try {
      expect(buildCardUrl('73zz7caxpv')).toBe('https://taptch.com/73zz7caxpv');

      const legacyToken = 'legacytok_1234567890abcdef';
      await db.insert(schema.purchasedCards).values({
        id: 'pc_legacy_test',
        userId: 'cust_nfc_1',
        unitIndex: 1,
        redirectToken: legacyToken,
        nfcUrl: `https://taptch.com/p/${legacyToken}`,
        profileId: 'prof_pub_1',
        status: 'ASSIGNED',
        profileAssignmentStatus: 'PROFILE_ATTACHED',
      });

      const resolved = await cardsService.resolvePublicNfcToken(legacyToken);
      expect(resolved).toMatchObject({
        status: 'active',
        destinationType: 'profile',
        destinationUrl: '/p/sdf',
        profileSlug: 'sdf',
      });
    } finally {
      if (prevBase === undefined) delete process.env.PUBLIC_BASE_URL;
      else process.env.PUBLIC_BASE_URL = prevBase;
    }
  });

  it('9: Handles revoked, refunded, suspended, lost, and unpublished profile states', async () => {
    const [order] = await db
      .insert(schema.orders)
      .values({
        id: 'ord_refund_test',
        orderNumber: 'TAP-2026-9991',
        userId: 'cust_nfc_1',
        productType: 'metal',
        quantity: 1,
        amountInr: 1999,
        orderStatus: 'ORDER_CONFIRMED',
        paymentStatus: 'REFUNDED',
        shippingAddress: {
          fullName: 'Customer NFC',
          line1: '123 Test St',
          city: 'Mumbai',
          state: 'MH',
          pincode: '400001',
        },
      })
      .returning();

    await db.insert(schema.purchasedCards).values([
      {
        id: 'pc_revoked_1',
        userId: 'cust_nfc_1',
        unitIndex: 1,
        cardCode: 'revoked001',
        redirectToken: 'revoked001',
        profileId: 'prof_pub_1',
        status: 'ASSIGNED',
        profileAssignmentStatus: 'REVOKED',
      },
      {
        id: 'pc_suspended_1',
        userId: 'cust_nfc_1',
        unitIndex: 1,
        cardCode: 'suspend001',
        redirectToken: 'suspend001',
        profileId: 'prof_pub_1',
        status: 'SUSPENDED',
        profileAssignmentStatus: 'PROFILE_ATTACHED',
      },
      {
        id: 'pc_lost_1',
        userId: 'cust_nfc_1',
        unitIndex: 1,
        cardCode: 'lostcard01',
        redirectToken: 'lostcard01',
        profileId: 'prof_pub_1',
        status: 'LOST',
        profileAssignmentStatus: 'PROFILE_ATTACHED',
      },
      {
        id: 'pc_refunded_1',
        userId: 'cust_nfc_1',
        orderId: order.id,
        unitIndex: 1,
        cardCode: 'refunded01',
        redirectToken: 'refunded01',
        profileId: 'prof_pub_1',
        status: 'ASSIGNED',
        profileAssignmentStatus: 'PROFILE_ATTACHED',
      },
      {
        id: 'pc_unpub_1',
        userId: 'cust_nfc_1',
        unitIndex: 1,
        cardCode: 'unpubprof1',
        redirectToken: 'unpubprof1',
        profileId: 'prof_draft_1',
        status: 'ASSIGNED',
        profileAssignmentStatus: 'PROFILE_ATTACHED',
      },
    ]);

    expect((await cardsService.resolvePublicNfcToken('revoked001')).status).toBe('suspended');
    expect((await cardsService.resolvePublicNfcToken('suspend001')).status).toBe('suspended');
    expect((await cardsService.resolvePublicNfcToken('lostcard01')).status).toBe('lost');
    expect((await cardsService.resolvePublicNfcToken('refunded01')).status).toBe('unavailable');
    expect((await cardsService.resolvePublicNfcToken('unpubprof1')).status).toBe('unavailable');
  });
});
