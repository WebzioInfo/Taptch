import { describe, it, expect, beforeAll } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import * as schema from '../database/schema';
import { AdminService } from '../modules/admin/admin.service';
import { ActivityLogService } from '../modules/admin/activity-log.service';
import { BadRequestException } from '@nestjs/common';
import type { ActorContext } from '../common/types';

describe('Phase 3B.1: Payment Transaction & Audit Hardening (PGlite)', () => {
  let db: any;
  let dbService: any;
  let adminService: AdminService;
  const adminActor: ActorContext = { userId: 'adm_3b1', orgId: null, role: 'admin', isAdmin: true };

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
    adminService = new AdminService(dbService, undefined, new ActivityLogService(dbService));

    await db.insert(schema.users).values({
      id: 'adm_3b1',
      name: 'Finance Admin',
      email: 'fin@taptch.test',
      systemRole: 'admin',
      status: 'active',
      emailVerified: true,
    });

    await db.insert(schema.orders).values([
      {
        id: 'ord_3b1_1',
        orderNumber: 'ORD-3B1-001',
        userId: 'adm_3b1',
        material: 'pvc',
        quantity: 1,
        shippingAddress: {
          recipientName: 'Finance Admin',
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
      {
        id: 'ord_3b1_failed',
        orderNumber: 'ORD-3B1-FAIL',
        userId: 'adm_3b1',
        material: 'pvc',
        quantity: 1,
        shippingAddress: {
          recipientName: 'Finance Admin',
          phone: '+919999888877',
          street: '123 Main St',
          city: 'Bengaluru',
          state: 'KA',
          postalCode: '560001',
          country: 'IN',
        },
        orderStatus: 'ORDER_PLACED',
        paymentStatus: 'FAILED',
        paymentMethod: 'razorpay',
        totalAmount: 1868,
      },
    ]);
}, 30000);

it('updates payment status transactionally, handles idempotent repeats, and blocks invalid transitions', async () => {
  const updated = await adminService.updateOrderPayment(
    'ord_3b1_1',
    { paymentStatus: 'COD_COLLECTED', paymentReference: 'COD-RCPT-1' },
    adminActor,
  );
  expect(updated.paymentStatus).toBe('COD_COLLECTED');
  expect(updated.orderStatus).toBe('ORDER_PLACED');

  const [payRow] = await db
    .select()
    .from(schema.payments)
    .where(eq(schema.payments.orderId, 'ord_3b1_1'));
  expect(payRow.status).toBe('COD_COLLECTED');

  // Repeated identical update is idempotent
  const repeat = await adminService.updateOrderPayment(
    'ord_3b1_1',
    { paymentStatus: 'COD_COLLECTED' },
    adminActor,
  );
  expect(repeat.paymentStatus).toBe('COD_COLLECTED');

  // FAILED -> PAID rejected
  await expect(
    adminService.updateOrderPayment('ord_3b1_failed', { paymentStatus: 'PAID' }, adminActor),
  ).rejects.toThrow(BadRequestException);

  // COD_COLLECTED -> REFUNDED allowed, then REFUNDED -> PAID/PENDING rejected
  await adminService.updateOrderPayment('ord_3b1_1', { paymentStatus: 'REFUNDED' }, adminActor);
  await expect(
    adminService.updateOrderPayment('ord_3b1_1', { paymentStatus: 'PAID' }, adminActor),
  ).rejects.toThrow(BadRequestException);
  await expect(
    adminService.updateOrderPayment('ord_3b1_1', { paymentStatus: 'PENDING' }, adminActor),
  ).rejects.toThrow(BadRequestException);
});

it('rolls back payment and history changes when audit insert fails', async () => {
  const failingAudit = {
    record: async () => {
      throw new Error('Simulated payment audit failure');
    },
  } as any;
  const failingService = new AdminService(dbService, undefined, failingAudit);

  await expect(
    failingService.updateOrderPayment('ord_3b1_failed', { paymentStatus: 'PENDING' }, adminActor),
  ).rejects.toThrow('Simulated payment audit failure');

  const [unchanged] = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.id, 'ord_3b1_failed'));
  expect(unchanged.paymentStatus).toBe('FAILED');
});
});
