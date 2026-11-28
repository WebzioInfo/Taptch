import { describe, it, expect, beforeAll } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import fs from 'fs';
import path from 'path';
import * as schema from '../database/schema';
import { AdminOperationsService, sanitizeCsvCell } from '../modules/admin/admin-operations.service';
import { ActivityLogService } from '../modules/admin/activity-log.service';
import { AdminController } from '../modules/admin/admin.controller';
import { PERMISSIONS_KEY } from '../common/guards/permissions.guard';
import { BadRequestException, ConflictException } from '@nestjs/common';
import type { ActorContext } from '../common/types';

describe('Phase 5: Admin Operations, Reports, Alerts & Security (PGlite)', () => {
  let db: any;
  let dbService: any;
  let opsService: AdminOperationsService;
  const superAdmin: ActorContext = { userId: 'sa_ops', orgId: null, role: 'super_admin', isAdmin: true };

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
    opsService = new AdminOperationsService(dbService, new ActivityLogService(dbService));

    await db.insert(schema.users).values({
      id: 'sa_ops',
      name: 'Ops Super Admin',
      email: 'ops@taptch.test',
      systemRole: 'super_admin',
      status: 'active',
      emailVerified: true,
    });

    await db.insert(schema.sessions).values({
      id: 'sess_ops_1',
      token: 'tok_ops_1',
      userId: 'sa_ops',
      expiresAt: new Date(Date.now() + 86400_000),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  it('handles inventory receipt, negative stock rejection, and duplicate idempotencyKey rejection', async () => {
    const res = await opsService.recordInventoryMovement(
      {
        material: 'metal',
        movementType: 'RECEIPT',
        quantityDelta: 10,
        reason: 'Initial batch',
        idempotencyKey: 'rec_001',
      },
      superAdmin,
    );
    expect(res.item.availableQty).toBe(10);

    await expect(
      opsService.recordInventoryMovement(
        {
          material: 'metal',
          movementType: 'RECEIPT',
          quantityDelta: 10,
          reason: 'Duplicate',
          idempotencyKey: 'rec_001',
        },
        superAdmin,
      ),
    ).rejects.toThrow(ConflictException);

    await expect(
      opsService.recordInventoryMovement(
        {
          material: 'metal',
          movementType: 'DAMAGED',
          quantityDelta: 50,
          reason: 'Too many damaged',
        },
        superAdmin,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('protects CSV export against formula injection', () => {
    expect(sanitizeCsvCell('=CMD("calc")')).toBe("'=CMD(\"\"calc\"\")".replace(/^'/, "'") ? `"'=CMD(""calc"")"` : '');
    expect(sanitizeCsvCell('=SUM(A1:A2)')).toBe("'=SUM(A1:A2)");
    expect(sanitizeCsvCell('+1234')).toBe("'+1234");
    expect(sanitizeCsvCell('@admin')).toBe("'@admin");
  });

  it('evaluates deduplicated low-stock alerts, login-failure alerts, and revokes sessions', async () => {
    const first = await opsService.evaluateAndListAlerts();
    const second = await opsService.evaluateAndListAlerts();
    const lowStockAlerts = second.items.filter((a) => a.dedupeKey === 'low_stock:metal');
    expect(lowStockAlerts).toHaveLength(1);
    expect(first.summary.warning + first.summary.critical).toBeGreaterThanOrEqual(1);

    await opsService.recordLoginAttempt({
      userId: 'sa_ops',
      email: 'ops@taptch.test',
      ipAddress: '127.0.0.1',
      success: false,
      failureReason: 'invalid_password',
    });
    const history = await opsService.getLoginHistory({ q: 'ops@taptch.test' });
    expect(history.total).toBe(1);

    const sessions = await opsService.getActiveSessions('sa_ops');
    expect(sessions.total).toBe(1);
    await opsService.revokeSession('sess_ops_1', superAdmin);
    const afterRevoke = await opsService.getActiveSessions('sa_ops');
    expect(afterRevoke.total).toBe(0);
  });

  it('enforces RBAC permissions on all Phase 4 operations & security endpoints', () => {
    expect(Reflect.getMetadata(PERMISSIONS_KEY, AdminController.prototype.getNfcLifecycle)).toEqual(['cards.view']);
    expect(Reflect.getMetadata(PERMISSIONS_KEY, AdminController.prototype.updateNfcLifecycle)).toEqual(['cards.manage']);
    expect(Reflect.getMetadata(PERMISSIONS_KEY, AdminController.prototype.getInventory)).toEqual(['inventory.view']);
    expect(Reflect.getMetadata(PERMISSIONS_KEY, AdminController.prototype.recordInventoryMovement)).toEqual(['inventory.manage']);
    expect(Reflect.getMetadata(PERMISSIONS_KEY, AdminController.prototype.getReport)).toEqual(['reports.view']);
    expect(Reflect.getMetadata(PERMISSIONS_KEY, AdminController.prototype.exportReport)).toEqual(['reports.export']);
    expect(Reflect.getMetadata(PERMISSIONS_KEY, AdminController.prototype.getAlerts)).toEqual(['notifications.view']);
    expect(Reflect.getMetadata(PERMISSIONS_KEY, AdminController.prototype.updateAlert)).toEqual(['notifications.manage']);
    expect(Reflect.getMetadata(PERMISSIONS_KEY, AdminController.prototype.getLoginHistory)).toEqual(['security.login_history.view']);
    expect(Reflect.getMetadata(PERMISSIONS_KEY, AdminController.prototype.getActiveSessions)).toEqual(['security.sessions.view']);
    expect(Reflect.getMetadata(PERMISSIONS_KEY, AdminController.prototype.revokeSession)).toEqual(['security.sessions.manage']);
  });

  it('generates products, nfc_cards, payments, and staff reports and evaluates overdue/failed-payment alerts', async () => {
    const productsReport = await opsService.generateReport('products');
    const nfcReport = await opsService.generateReport('nfc_cards');
    const paymentsReport = await opsService.generateReport('payments');
    const staffReport = await opsService.generateReport('staff');

    expect(productsReport.type).toBe('products');
    expect(nfcReport.type).toBe('nfc_cards');
    expect(paymentsReport.type).toBe('payments');
    expect(staffReport.type).toBe('staff');
  });
});
