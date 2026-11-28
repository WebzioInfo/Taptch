import { describe, it, expect, beforeAll } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import * as schema from '../database/schema';
import { AdminService } from '../modules/admin/admin.service';
import { AdminController } from '../modules/admin/admin.controller';
import { PERMISSIONS_KEY } from '../common/guards/permissions.guard';
import { ActivityLogService } from '../modules/admin/activity-log.service';
import { BadRequestException } from '@nestjs/common';
import type { ActorContext } from '../common/types';

describe('Phase 3A: Admin Orders & Fulfillment Real PGlite Integration Tests', () => {
  let db: any;
  let dbService: any;
  let adminService: AdminService;
  const adminActor: ActorContext = { userId: 'adm_1', orgId: null, role: 'admin', isAdmin: true };

  beforeAll(async () => {
    const pglite = new PGlite();
    db = drizzle(pglite, { schema });

    const migrationsDir = path.resolve(__dirname, '../database/migrations');
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      await pglite.exec(sql);
    }

    dbService = { db };
    const activityLogService = new ActivityLogService(dbService);
    adminService = new AdminService(dbService, undefined, activityLogService);

    await db.insert(schema.users).values([
      {
        id: 'adm_1',
        name: 'Admin User',
        email: 'admin@taptch.test',
        systemRole: 'admin',
        status: 'active',
        emailVerified: true,
      },
      {
        id: 'cust_1',
        name: 'Customer One',
        email: 'cust1@taptch.test',
        phoneNumber: '+919999888877',
        systemRole: 'user',
        status: 'active',
        emailVerified: true,
      },
    ]);

    await db.insert(schema.orders).values([
      {
        id: 'ord_1',
        orderNumber: 'ORD-3A-001',
        userId: 'cust_1',
        material: 'metal',
        quantity: 1,
        shippingAddress: {
          recipientName: 'Customer One',
          phone: '+919999888877',
          street: '123 Main St',
          city: 'Bengaluru',
          state: 'KA',
          postalCode: '560001',
          country: 'IN',
        },
        orderStatus: 'ORDER_CONFIRMED',
        paymentStatus: 'PAID',
        paymentMethod: 'razorpay',
        totalAmount: 2949,
        createdAt: new Date('2026-03-01T10:00:00Z'),
        updatedAt: new Date('2026-03-01T10:00:00Z'),
      },
      {
        id: 'ord_cancelled',
        orderNumber: 'ORD-3A-CAN',
        userId: 'cust_1',
        material: 'pvc',
        quantity: 1,
        shippingAddress: {
          recipientName: 'Customer One',
          phone: '+919999888877',
          street: '123 Main St',
          city: 'Bengaluru',
          state: 'KA',
          postalCode: '560001',
          country: 'IN',
        },
        orderStatus: 'CANCELLED',
        paymentStatus: 'REFUNDED',
        paymentMethod: 'razorpay',
        totalAmount: 1868,
        createdAt: new Date('2026-03-02T10:00:00Z'),
        updatedAt: new Date('2026-03-02T10:00:00Z'),
      },
    ]);
  });

  it('lists, searches, filters, and paginates orders', async () => {
    const res = await adminService.getAllOrders({
      q: 'Customer One',
      orderStatus: 'ORDER_CONFIRMED',
      fromDate: '2026-03-01',
      toDate: '2026-03-01',
      page: 1,
      pageSize: 10,
    }) as any;

    expect(res.total).toBe(1);
    expect(res.items).toHaveLength(1);
    expect(res.items[0].orderNumber).toBe('ORD-3A-001');
  });

  it('rejects invalid transitions, cancelled order updates, and DISPATCHED without shipping info', async () => {
    await expect(
      adminService.updateOrderFulfillment('ord_cancelled', { orderStatus: 'ORDER_CONFIRMED' }, adminActor),
    ).rejects.toThrow(BadRequestException);

    await expect(
      adminService.updateOrderFulfillment('ord_1', { orderStatus: 'DELIVERED' }, adminActor),
    ).rejects.toThrow(BadRequestException);

    await expect(
      adminService.updateOrderFulfillment('ord_1', { orderStatus: 'DISPATCHED' }, adminActor),
    ).rejects.toThrow(BadRequestException);
  });

  it('updates fulfillment transactionally with history & audit log, and rolls back on audit failure', async () => {
    const updated = await adminService.updateOrderFulfillment(
      'ord_1',
      { orderStatus: 'CARD_PRODUCTION' },
      adminActor,
    );
    expect(updated.orderStatus).toBe('CARD_PRODUCTION');

    const history = await db
      .select()
      .from(schema.orderStatusHistory)
      .where(eq(schema.orderStatusHistory.orderId, 'ord_1'));
    expect(history.length).toBeGreaterThanOrEqual(1);

    const failingAudit = {
      record: async () => {
        throw new Error('Simulated order audit failure');
      },
    } as any;
    const failingAdminService = new AdminService(dbService, undefined, failingAudit);

    await expect(
      failingAdminService.updateOrderFulfillment(
        'ord_1',
        { orderStatus: 'CARD_READY' },
        adminActor,
      ),
    ).rejects.toThrow('Simulated order audit failure');

    const [afterRollback] = await db.select().from(schema.orders).where(eq(schema.orders.id, 'ord_1'));
    expect(afterRollback.orderStatus).toBe('CARD_PRODUCTION');
  });

  it('Phase 3A.2: enforces payment isolation, COD vs unpaid-online transitions, trackingUrl validation, and updateOrderStatus rollback', async () => {
    const controller = new AdminController(adminService, new ActivityLogService(dbService));

    // 1. General order update rejects paymentStatus & unexpected properties
    await expect(
      controller.updateOrder('ord_1', { status: 'CARD_READY', paymentStatus: 'PAID' } as any, adminActor),
    ).rejects.toThrow(BadRequestException);

    // 2. Dedicated payment endpoint retains finance.manage permission
    const paymentPerms = Reflect.getMetadata(PERMISSIONS_KEY, AdminController.prototype.updateOrderPayment);
    expect(paymentPerms).toEqual(['finance.manage']);

    // 3. Tracking URL rejects javascript:/data: and accepts https://
    await expect(
      controller.updateOrderFulfillment(
        'ord_1',
        { trackingUrl: 'javascript:alert(1)' },
        adminActor,
      ),
    ).rejects.toThrow(BadRequestException);

    await expect(
      controller.updateOrderFulfillment(
        'ord_1',
        { trackingUrl: 'https://track.example.com/AWB123' },
        adminActor,
      ),
    ).resolves.toBeTruthy();

    // 4. Unpaid online order cannot advance into production; COD order can
    await db.insert(schema.orders).values([
      {
        id: 'ord_unpaid_online',
        orderNumber: 'ORD-3A2-ONL',
        userId: 'cust_1',
        material: 'pvc',
        quantity: 1,
        shippingAddress: {
          recipientName: 'Customer One',
          phone: '+919999888877',
          street: '123 Main St',
          city: 'Bengaluru',
          state: 'KA',
          postalCode: '560001',
          country: 'IN',
        },
        orderStatus: 'PAYMENT_PENDING',
        paymentStatus: 'PENDING',
        paymentMethod: 'razorpay',
        totalAmount: 1868,
      },
      {
        id: 'ord_cod_pending',
        orderNumber: 'ORD-3A2-COD',
        userId: 'cust_1',
        material: 'pvc',
        quantity: 1,
        shippingAddress: {
          recipientName: 'Customer One',
          phone: '+919999888877',
          street: '123 Main St',
          city: 'Bengaluru',
          state: 'KA',
          postalCode: '560001',
          country: 'IN',
        },
        orderStatus: 'ORDER_PLACED',
        paymentStatus: 'COD_PENDING',
        paymentMethod: 'cod',
        totalAmount: 1868,
      },
    ]);

    await expect(
      adminService.updateOrderStatus('ord_unpaid_online', 'ORDER_CONFIRMED', adminActor),
    ).rejects.toThrow(BadRequestException);

    const codUpdated = await adminService.updateOrderStatus('ord_cod_pending', 'CARD_PRODUCTION', adminActor);
    expect(codUpdated.orderStatus).toBe('CARD_PRODUCTION');
    expect(codUpdated.paymentStatus).toBe('COD_PENDING');

    // 5. Audit failure rolls back updateOrderStatus
    const failingAudit = {
      record: async () => {
        throw new Error('Simulated status audit failure');
      },
    } as any;
    const failingAdminService = new AdminService(dbService, undefined, failingAudit);
    await expect(
      failingAdminService.updateOrderStatus('ord_cod_pending', 'CARD_READY', adminActor),
    ).rejects.toThrow('Simulated status audit failure');

    const [codAfterRollback] = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.id, 'ord_cod_pending'));
    expect(codAfterRollback.orderStatus).toBe('CARD_PRODUCTION');
  });

  it('Phase 3A.4: enforces full payment eligibility matrix across updateOrderStatus and updateOrderFulfillment', async () => {
    const cases: Array<{ method: string; status: string; allow: boolean }> = [
      { method: 'cod', status: 'COD_PENDING', allow: true },
      { method: 'cod', status: 'COD_COLLECTED', allow: true },
      { method: 'cod', status: 'PAID', allow: true },
      { method: 'cod', status: 'WAIVED', allow: true },
      { method: 'cod', status: 'PENDING', allow: false },
      { method: 'cod', status: 'FAILED', allow: false },
      { method: 'cod', status: 'REFUNDED', allow: false },
      { method: 'razorpay', status: 'PAID', allow: true },
      { method: 'razorpay', status: 'WAIVED', allow: true },
      { method: 'razorpay', status: 'PENDING', allow: false },
      { method: 'razorpay', status: 'FAILED', allow: false },
      { method: 'razorpay', status: 'REFUNDED', allow: false },
      { method: 'offline', status: 'PAID', allow: true },
      { method: 'offline', status: 'WAIVED', allow: true },
      { method: 'offline', status: 'PENDING', allow: false },
      { method: 'offline', status: 'FAILED', allow: false },
      { method: 'offline', status: 'REFUNDED', allow: false },
      { method: 'crypto_unknown', status: 'PAID', allow: false },
    ];

    for (let i = 0; i < cases.length; i++) {
      const c = cases[i];
      const orderId = `ord_mat_${i}`;
      await db.insert(schema.orders).values({
        id: orderId,
        orderNumber: `ORD-MAT-${i}`,
        userId: 'cust_1',
        material: 'pvc',
        quantity: 1,
        shippingAddress: {
          recipientName: 'Customer One',
          phone: '+919999888877',
          street: '123 Main St',
          city: 'Bengaluru',
          state: 'KA',
          postalCode: '560001',
          country: 'IN',
        },
        orderStatus: 'ORDER_PLACED',
        paymentStatus: c.status as any,
        paymentMethod: c.method as any,
        totalAmount: 1868,
      });

      if (c.allow) {
        const res1 = await adminService.updateOrderStatus(orderId, 'ORDER_CONFIRMED', adminActor);
        expect(res1.orderStatus).toBe('ORDER_CONFIRMED');
        expect(res1.paymentStatus).toBe(c.status);

        const res2 = await adminService.updateOrderFulfillment(
          orderId,
          { orderStatus: 'CARD_PRODUCTION' },
          adminActor,
        );
        expect(res2.orderStatus).toBe('CARD_PRODUCTION');
        expect(res2.paymentStatus).toBe(c.status);
      } else {
        await expect(
          adminService.updateOrderStatus(orderId, 'ORDER_CONFIRMED', adminActor),
        ).rejects.toThrow(BadRequestException);
        await expect(
          adminService.updateOrderFulfillment(orderId, { orderStatus: 'CARD_PRODUCTION' }, adminActor),
        ).rejects.toThrow(BadRequestException);

        const [unchanged] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId));
        expect(unchanged.orderStatus).toBe('ORDER_PLACED');
      }
    }
  });
});
