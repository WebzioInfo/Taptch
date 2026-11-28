import { describe, it, expect, beforeAll } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import fs from 'fs';
import path from 'path';
import * as schema from '../database/schema';
import { OrdersService } from '../modules/orders/orders.service';
import { AdminService } from '../modules/admin/admin.service';
import { AdminController } from '../modules/admin/admin.controller';
import { ActivityLogService } from '../modules/admin/activity-log.service';
import { PERMISSIONS_KEY } from '../common/guards/permissions.guard';
import { ForbiddenException } from '@nestjs/common';
import type { ActorContext } from '../common/types';

describe('Phase 4: Simulated Payment System & Complete Admin Module (PGlite)', () => {
  let db: any;
  let dbService: any;
  let ordersService: OrdersService;
  let adminService: AdminService;
  const userActor: ActorContext = { userId: 'u_sim', orgId: null, role: 'user', isAdmin: false };

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
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
      withActor: async (_actor: any, fn: (tx: any) => Promise<any>) => db.transaction(fn),
    };
    ordersService = new OrdersService(dbService);
    adminService = new AdminService(dbService, undefined, new ActivityLogService(dbService));

    await db.insert(schema.users).values({
      id: 'u_sim',
      name: 'Sim User',
      email: 'sim@taptch.test',
      systemRole: 'user',
      status: 'active',
      emailVerified: true,
    });

    await db.insert(schema.orders).values({
      id: 'ord_sim_1',
      orderNumber: 'ORD-SIM-001',
      userId: 'u_sim',
      material: 'pvc',
      quantity: 1,
      shippingAddress: {
        recipientName: 'Sim User',
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
    });

    await db.insert(schema.payments).values({
      id: 'pay_sim_1',
      orderId: 'ord_sim_1',
      userId: 'u_sim',
      paymentMethod: 'razorpay',
      amount: 1868,
      currency: 'INR',
      status: 'PENDING',
    });
  });

  it('simulates failed -> retry success, flags isSimulated, and excludes simulated orders from realRevenue', async () => {
    const failed = await ordersService.simulatePayment('ord_sim_1', userActor, 'failed');
    expect(failed.simulated).toBe(true);
    expect(failed.order.paymentStatus).toBe('FAILED');
    expect(failed.paymentReference).toMatch(/^SIM_TEST_/);

    const retried = await ordersService.simulatePayment('ord_sim_1', userActor, 'success');
    expect(retried.order.paymentStatus).toBe('PAID');
    expect(retried.order.orderStatus).toBe('ORDER_CONFIRMED');

    const payments = await adminService.getAllPaymentsAdmin({ page: 1, pageSize: 10 });
    expect(payments.items[0].isSimulated).toBe(true);

    const analytics = await adminService.getAnalyticsOverview();
    expect(analytics.simulatedOrders).toBe(1);
    expect(analytics.realRevenue).toBe(0);
  });

  it('blocks simulatePayment in production unless ALLOW_PAYMENT_SIMULATOR is true', async () => {
    const prevEnv = process.env.NODE_ENV;
    const prevFlag = process.env.ALLOW_PAYMENT_SIMULATOR;
    process.env.NODE_ENV = 'production';
    delete process.env.ALLOW_PAYMENT_SIMULATOR;

    await expect(ordersService.simulatePayment('ord_sim_1', userActor, 'success')).rejects.toThrow(
      ForbiddenException,
    );

    process.env.NODE_ENV = prevEnv;
    if (prevFlag !== undefined) process.env.ALLOW_PAYMENT_SIMULATOR = prevFlag;
  });

  it('enforces RBAC permissions on all new AdminController endpoints', () => {
    expect(Reflect.getMetadata(PERMISSIONS_KEY, AdminController.prototype.getCards)).toEqual(['cards.view']);
    expect(Reflect.getMetadata(PERMISSIONS_KEY, AdminController.prototype.getProducts)).toEqual(['products.view']);
    expect(Reflect.getMetadata(PERMISSIONS_KEY, AdminController.prototype.getPayments)).toEqual(['finance.view']);
    expect(Reflect.getMetadata(PERMISSIONS_KEY, AdminController.prototype.getAnalytics)).toEqual(['finance.view']);
    expect(Reflect.getMetadata(PERMISSIONS_KEY, AdminController.prototype.getSettings)).toEqual(['settings.manage']);
  });
});
