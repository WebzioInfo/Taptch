import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Optional,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { ActivityLogService } from './activity-log.service';
import * as schema from '../../database/schema';
import { eq, desc, sql, or, ilike, and } from 'drizzle-orm';
import type { ActorContext } from '../../common/types';
import * as crypto from 'crypto';

const FORMULA_INJECTION_PREFIX = /^[=+\-@\t\r]/;

export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  let str = String(value);
  if (FORMULA_INJECTION_PREFIX.test(str)) {
    str = `'${str}`;
  }
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

@Injectable()
export class AdminOperationsService {
  constructor(
    private dbService: DatabaseService,
    @Optional() private activityLogService?: ActivityLogService,
  ) {}

  // =========================================================================
  // 1. NFC & INVENTORY LIFECYCLE
  // =========================================================================

  async getNfcLifecycleCards(options?: {
    q?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, Number(options?.page || 1));
    const pageSize = Math.min(100, Math.max(1, Number(options?.pageSize || 25)));
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (options?.status && options.status !== 'ALL') {
      conditions.push(eq(schema.purchasedCards.profileAssignmentStatus, options.status as any));
    }
    if (options?.q && options.q.trim()) {
      const q = `%${options.q.trim()}%`;
      conditions.push(
        or(
          ilike(schema.purchasedCards.id, q),
          ilike(schema.purchasedCards.orderId, q),
        ),
      );
    }

    const whereClause = conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined;

    const [countRow] = await this.dbService.db
      .select({ total: sql<number>`count(*)` })
      .from(schema.purchasedCards)
      .where(whereClause);

    const items = await this.dbService.db
      .select({
        id: schema.purchasedCards.id,
        orderId: schema.purchasedCards.orderId,
        userId: schema.purchasedCards.userId,
        profileId: schema.purchasedCards.profileId,
        material: schema.purchasedCards.material,
        profileAssignmentStatus: schema.purchasedCards.profileAssignmentStatus,
        activationStatus: schema.purchasedCards.profileAssignmentStatus,
        createdAt: schema.purchasedCards.createdAt,
        updatedAt: schema.purchasedCards.updatedAt,
      })
      .from(schema.purchasedCards)
      .where(whereClause)
      .orderBy(desc(schema.purchasedCards.createdAt))
      .limit(pageSize)
      .offset(offset);

    return { items, total: Number(countRow?.total || 0), page, pageSize };
  }

  async updateNfcCardLifecycle(
    cardId: string,
    data: { action: 'activate' | 'damage' | 'revoke' | 'replace'; reason: string },
    actor: ActorContext,
  ) {
    return this.dbService.db.transaction(async (tx: any) => {
      const [card] = await tx
        .select()
        .from(schema.purchasedCards)
        .where(eq(schema.purchasedCards.id, cardId))
        .for('update')
        .limit(1);

      if (!card) {
        throw new NotFoundException(`NFC card ${cardId} not found.`);
      }

      const updates: any = { updatedAt: new Date() };
      if (data.action === 'activate') {
        updates.profileAssignmentStatus = 'ASSIGNED';
      } else if (data.action === 'revoke' || data.action === 'damage') {
        updates.profileId = null;
        updates.destinationType = null;
        updates.profileAssignmentStatus = 'REVOKED';
      } else if (data.action === 'replace') {
        updates.profileAssignmentStatus = 'ASSIGNED';
      }

      const [updated] = await tx
        .update(schema.purchasedCards)
        .set(updates)
        .where(eq(schema.purchasedCards.id, cardId))
        .returning();

      if (this.activityLogService) {
        await this.activityLogService.record(
          {
            actorId: actor.userId,
            actorRole: actor.role,
            action: `admin:nfc_card_${data.action}`,
            resourceType: 'purchased_card',
            resourceId: cardId,
            before: {
              profileAssignmentStatus: card.profileAssignmentStatus,
            },
            after: {
              action: data.action,
              reason: data.reason,
              profileAssignmentStatus: updated.profileAssignmentStatus,
            },
          },
          tx,
        );
      }

      return {
        id: updated.id,
        profileAssignmentStatus: updated.profileAssignmentStatus,
        activationStatus: updated.profileAssignmentStatus,
      };
    });
  }

  async getInventoryOverview() {
    const items = await this.dbService.db
      .select()
      .from(schema.inventoryItems)
      .orderBy(schema.inventoryItems.material);

    const movements = await this.dbService.db
      .select()
      .from(schema.inventoryMovements)
      .orderBy(desc(schema.inventoryMovements.createdAt))
      .limit(50);

    return { items, movements };
  }

  async recordInventoryMovement(
    data: {
      material: string;
      sku?: string;
      movementType: 'RECEIPT' | 'ADJUSTMENT' | 'DAMAGED' | 'LOST';
      quantityDelta: number;
      reason: string;
      idempotencyKey?: string;
    },
    actor: ActorContext,
  ) {
    if (data.quantityDelta === 0) {
      throw new BadRequestException('Quantity delta must be non-zero.');
    }

    return this.dbService.db.transaction(async (tx: any) => {
      if (data.idempotencyKey) {
        const [dup] = await tx
          .select()
          .from(schema.inventoryMovements)
          .where(eq(schema.inventoryMovements.idempotencyKey, data.idempotencyKey))
          .limit(1);
        if (dup) {
          throw new ConflictException(`Duplicate inventory movement idempotencyKey: ${data.idempotencyKey}`);
        }
      }

      let [item] = await tx
        .select()
        .from(schema.inventoryItems)
        .where(eq(schema.inventoryItems.material, data.material))
        .for('update')
        .limit(1);

      if (!item) {
        if (data.quantityDelta < 0) {
          throw new BadRequestException(`Cannot deduct stock for uninitialized material ${data.material}.`);
        }
        const [created] = await tx
          .insert(schema.inventoryItems)
          .values({
            id: crypto.randomUUID(),
            material: data.material,
            sku: data.sku || `SKU-${data.material.toUpperCase()}`,
            availableQty: 0,
            reservedQty: 0,
            soldQty: 0,
            damagedQty: 0,
            lowStockThreshold: 20,
          })
          .returning();
        item = created;
      }

      const effectiveDelta =
        data.movementType === 'DAMAGED' || data.movementType === 'LOST'
          ? -Math.abs(data.quantityDelta)
          : data.quantityDelta;

      const nextAvailable = item.availableQty + effectiveDelta;
      if (nextAvailable < 0) {
        throw new BadRequestException(
          `Insufficient stock for ${data.material}: available=${item.availableQty}, delta=${effectiveDelta}.`,
        );
      }

      const nextDamaged =
        data.movementType === 'DAMAGED' || data.movementType === 'LOST'
          ? item.damagedQty + Math.abs(data.quantityDelta)
          : item.damagedQty;

      const [updatedItem] = await tx
        .update(schema.inventoryItems)
        .set({
          availableQty: nextAvailable,
          damagedQty: nextDamaged,
          updatedAt: new Date(),
        })
        .where(eq(schema.inventoryItems.id, item.id))
        .returning();

      const [movement] = await tx
        .insert(schema.inventoryMovements)
        .values({
          id: crypto.randomUUID(),
          inventoryItemId: item.id,
          movementType: data.movementType,
          quantityDelta: effectiveDelta,
          reason: data.reason,
          idempotencyKey: data.idempotencyKey || null,
          actorId: actor.userId,
        })
        .returning();

      if (this.activityLogService) {
        await this.activityLogService.record(
          {
            actorId: actor.userId,
            actorRole: actor.role,
            action: 'admin:inventory_movement',
            resourceType: 'inventory_item',
            resourceId: item.id,
            before: { availableQty: item.availableQty, damagedQty: item.damagedQty },
            after: { availableQty: nextAvailable, damagedQty: nextDamaged, reason: data.reason },
          },
          tx,
        );
      }

      return { item: updatedItem, movement };
    });
  }

  // =========================================================================
  // 2. ADVANCED REPORTS & EXPORT
  // =========================================================================

  async generateReport(
    type: string,
    filters?: { fromDate?: string; toDate?: string; status?: string; includeSimulated?: boolean },
  ) {
    const includeSim = filters?.includeSimulated === true;

    if (type === 'orders' || type === 'sales') {
      const rows = await this.dbService.db
        .select({
          id: schema.orders.id,
          orderNumber: schema.orders.orderNumber,
          material: schema.orders.material,
          quantity: schema.orders.quantity,
          totalAmount: schema.orders.totalAmount,
          orderStatus: schema.orders.orderStatus,
          paymentStatus: schema.orders.paymentStatus,
          paymentMethod: schema.orders.paymentMethod,
          paymentReference: schema.orders.paymentReference,
          createdAt: schema.orders.createdAt,
        })
        .from(schema.orders)
        .orderBy(desc(schema.orders.createdAt))
        .limit(500);

      const filtered = rows.filter((r) => {
        const isSim = Boolean(r.paymentReference?.startsWith('SIM_TEST_'));
        if (!includeSim && isSim) return false;
        if (filters?.status && filters.status !== 'ALL' && r.orderStatus !== filters.status) return false;
        if (filters?.fromDate && new Date(r.createdAt) < new Date(filters.fromDate)) return false;
        if (filters?.toDate) {
          const to = new Date(filters.toDate);
          to.setHours(23, 59, 59, 999);
          if (new Date(r.createdAt) > to) return false;
        }
        return true;
      });

      return {
        type,
        rows: filtered.map(({ paymentReference: _ref, ...rest }) => rest),
        summary: {
          count: filtered.length,
          totalAmount: filtered.reduce((sum, r) => sum + Number(r.totalAmount || 0), 0),
        },
      };
    }

    if (type === 'inventory') {
      const rows = await this.dbService.db.select().from(schema.inventoryItems);
      return { type, rows, summary: { count: rows.length } };
    }

    if (type === 'products') {
      const orders = await this.dbService.db
        .select({
          material: schema.orders.material,
          quantity: schema.orders.quantity,
          totalAmount: schema.orders.totalAmount,
          paymentStatus: schema.orders.paymentStatus,
          paymentReference: schema.orders.paymentReference,
        })
        .from(schema.orders);

      const byMaterial = new Map<string, { material: string; orders: number; units: number; realRevenue: number }>();
      for (const o of orders) {
        const isSim = Boolean(o.paymentReference?.startsWith('SIM_TEST_'));
        if (!includeSim && isSim) continue;
        const cur = byMaterial.get(o.material) || { material: o.material, orders: 0, units: 0, realRevenue: 0 };
        cur.orders += 1;
        cur.units += Number(o.quantity || 1);
        if (o.paymentStatus === 'PAID') cur.realRevenue += Number(o.totalAmount || 0);
        byMaterial.set(o.material, cur);
      }
      const rows = Array.from(byMaterial.values());
      return { type, rows, summary: { count: rows.length } };
    }

    if (type === 'nfc_cards') {
      const rows = await this.dbService.db
        .select({
          id: schema.purchasedCards.id,
          orderId: schema.purchasedCards.orderId,
          material: schema.purchasedCards.material,
          profileAssignmentStatus: schema.purchasedCards.profileAssignmentStatus,
          createdAt: schema.purchasedCards.createdAt,
        })
        .from(schema.purchasedCards)
        .orderBy(desc(schema.purchasedCards.createdAt))
        .limit(500);
      return { type, rows, summary: { count: rows.length } };
    }

    if (type === 'payments') {
      const rows = await this.dbService.db
        .select({
          id: schema.payments.id,
          orderId: schema.payments.orderId,
          paymentMethod: schema.payments.paymentMethod,
          amount: schema.payments.amount,
          currency: schema.payments.currency,
          status: schema.payments.status,
          gatewayPaymentId: schema.payments.gatewayPaymentId,
          createdAt: schema.payments.createdAt,
        })
        .from(schema.payments)
        .orderBy(desc(schema.payments.createdAt))
        .limit(500);
      const filtered = rows.filter((r) => includeSim || !r.gatewayPaymentId?.startsWith('SIM_TEST_'));
      return {
        type,
        rows: filtered.map(({ gatewayPaymentId: _g, ...rest }) => rest),
        summary: {
          count: filtered.length,
          totalAmount: filtered.reduce((s, r) => s + Number(r.amount || 0), 0),
        },
      };
    }

    if (type === 'staff') {
      const logs = await this.dbService.db
        .select({
          actorId: schema.auditLogs.actorId,
          action: schema.auditLogs.action,
        })
        .from(schema.auditLogs)
        .limit(500);
      const counts = new Map<string, number>();
      for (const l of logs) {
        counts.set(l.actorId, (counts.get(l.actorId) || 0) + 1);
      }
      const rows = Array.from(counts.entries()).map(([actorId, actionsCount]) => ({ actorId, actionsCount }));
      return { type, rows, summary: { count: rows.length } };
    }

    const rows = await this.dbService.db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        systemRole: schema.users.systemRole,
        status: schema.users.status,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users)
      .orderBy(desc(schema.users.createdAt))
      .limit(500);

    return { type, rows, summary: { count: rows.length } };
  }

  buildCsvExport(rows: Record<string, unknown>[]): string {
    if (rows.length === 0) return '';
    const headers = Object.keys(rows[0]);
    const headerLine = headers.map(sanitizeCsvCell).join(',');
    const bodyLines = rows.map((row) => headers.map((h) => sanitizeCsvCell(row[h])).join(','));
    return [headerLine, ...bodyLines].join('\n');
  }

  // =========================================================================
  // 3. SMART ADMIN ALERTS & NOTIFICATIONS
  // =========================================================================

  async evaluateAndListAlerts(filters?: { status?: string; severity?: string }) {
    // Evaluate low-stock alerts with deduplication
    const lowStockItems = await this.dbService.db
      .select()
      .from(schema.inventoryItems)
      .where(sql`${schema.inventoryItems.availableQty} <= ${schema.inventoryItems.lowStockThreshold}`);

    for (const item of lowStockItems) {
      const dedupeKey = `low_stock:${item.material}`;
      const [existing] = await this.dbService.db
        .select()
        .from(schema.adminAlerts)
        .where(and(eq(schema.adminAlerts.dedupeKey, dedupeKey), eq(schema.adminAlerts.status, 'ACTIVE')))
        .limit(1);

      if (!existing) {
        await this.dbService.db.insert(schema.adminAlerts).values({
          id: crypto.randomUUID(),
          alertType: 'LOW_INVENTORY',
          severity: item.availableQty === 0 ? 'CRITICAL' : 'WARNING',
          dedupeKey,
          title: `Low stock: ${item.material.toUpperCase()}`,
          message: `Available quantity (${item.availableQty}) is at or below threshold (${item.lowStockThreshold}).`,
          resourceType: 'inventory_item',
          resourceId: item.id,
          status: 'ACTIVE',
          isRead: false,
        });
      }
    }

    // Overdue pending orders (> 48h)
    const overdueCutoff = new Date(Date.now() - 48 * 3600 * 1000);
    const overdueOrders = await this.dbService.db
      .select({ id: schema.orders.id, orderNumber: schema.orders.orderNumber })
      .from(schema.orders)
      .where(
        and(
          sql`${schema.orders.orderStatus} in ('ORDER_PLACED', 'PAYMENT_PENDING')`,
          sql`${schema.orders.createdAt} < ${overdueCutoff}`,
        ),
      )
      .limit(20);

    for (const ord of overdueOrders) {
      const dedupeKey = `overdue_order:${ord.id}`;
      const [existing] = await this.dbService.db
        .select()
        .from(schema.adminAlerts)
        .where(and(eq(schema.adminAlerts.dedupeKey, dedupeKey), eq(schema.adminAlerts.status, 'ACTIVE')))
        .limit(1);
      if (!existing) {
        await this.dbService.db.insert(schema.adminAlerts).values({
          id: crypto.randomUUID(),
          alertType: 'OVERDUE_ORDER',
          severity: 'WARNING',
          dedupeKey,
          title: `Overdue order: ${ord.orderNumber}`,
          message: `Order ${ord.orderNumber} has been pending for over 48 hours.`,
          resourceType: 'order',
          resourceId: ord.id,
          status: 'ACTIVE',
          isRead: false,
        });
      }
    }

    // Failed payments
    const failedPayments = await this.dbService.db
      .select({ id: schema.payments.id, orderId: schema.payments.orderId })
      .from(schema.payments)
      .where(eq(schema.payments.status, 'FAILED'))
      .limit(20);

    for (const pay of failedPayments) {
      const dedupeKey = `failed_payment:${pay.id}`;
      const [existing] = await this.dbService.db
        .select()
        .from(schema.adminAlerts)
        .where(and(eq(schema.adminAlerts.dedupeKey, dedupeKey), eq(schema.adminAlerts.status, 'ACTIVE')))
        .limit(1);
      if (!existing) {
        await this.dbService.db.insert(schema.adminAlerts).values({
          id: crypto.randomUUID(),
          alertType: 'FAILED_PAYMENT',
          severity: 'CRITICAL',
          dedupeKey,
          title: `Failed payment`,
          message: `Payment ${pay.id.slice(0, 8)} for order ${pay.orderId.slice(0, 8)} failed.`,
          resourceType: 'order',
          resourceId: pay.orderId,
          status: 'ACTIVE',
          isRead: false,
        });
      }
    }

    // Sold but unassigned NFC cards
    const unassignedCards = await this.dbService.db
      .select({ id: schema.purchasedCards.id, orderId: schema.purchasedCards.orderId })
      .from(schema.purchasedCards)
      .where(eq(schema.purchasedCards.profileAssignmentStatus, 'UNASSIGNED'))
      .limit(20);

    for (const card of unassignedCards) {
      const dedupeKey = `unassigned_card:${card.id}`;
      const [existing] = await this.dbService.db
        .select()
        .from(schema.adminAlerts)
        .where(and(eq(schema.adminAlerts.dedupeKey, dedupeKey), eq(schema.adminAlerts.status, 'ACTIVE')))
        .limit(1);
      if (!existing) {
        await this.dbService.db.insert(schema.adminAlerts).values({
          id: crypto.randomUUID(),
          alertType: 'UNASSIGNED_NFC_CARD',
          severity: 'INFO',
          dedupeKey,
          title: `Unassigned NFC card`,
          message: `Purchased card ${card.id.slice(0, 8)} is sold but not yet assigned to a profile.`,
          resourceType: 'purchased_card',
          resourceId: card.id,
          status: 'ACTIVE',
          isRead: false,
        });
      }
    }

    const conditions = [];
    if (filters?.status && filters.status !== 'ALL') {
      conditions.push(eq(schema.adminAlerts.status, filters.status));
    }
    if (filters?.severity && filters.severity !== 'ALL') {
      conditions.push(eq(schema.adminAlerts.severity, filters.severity));
    }

    const items = await this.dbService.db
      .select()
      .from(schema.adminAlerts)
      .where(conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined)
      .orderBy(desc(schema.adminAlerts.createdAt))
      .limit(100);

    return {
      items,
      summary: {
        critical: items.filter((a) => a.status === 'ACTIVE' && a.severity === 'CRITICAL').length,
        warning: items.filter((a) => a.status === 'ACTIVE' && a.severity === 'WARNING').length,
        unread: items.filter((a) => !a.isRead && a.status === 'ACTIVE').length,
      },
    };
  }

  async updateAlertStatus(
    alertId: string,
    action: 'read' | 'resolve' | 'dismiss',
    actor: ActorContext,
  ) {
    return this.dbService.db.transaction(async (tx: any) => {
      const [alert] = await tx
        .select()
        .from(schema.adminAlerts)
        .where(eq(schema.adminAlerts.id, alertId))
        .for('update')
        .limit(1);

      if (!alert) {
        throw new NotFoundException(`Alert ${alertId} not found.`);
      }

      const updates: any = {};
      if (action === 'read') {
        updates.isRead = true;
      } else {
        updates.status = action === 'resolve' ? 'RESOLVED' : 'DISMISSED';
        updates.isRead = true;
        updates.resolvedBy = actor.userId;
        updates.resolvedAt = new Date();
      }

      const [updated] = await tx
        .update(schema.adminAlerts)
        .set(updates)
        .where(eq(schema.adminAlerts.id, alertId))
        .returning();

      if (this.activityLogService) {
        await this.activityLogService.record(
          {
            actorId: actor.userId,
            actorRole: actor.role,
            action: `admin:alert_${action}`,
            resourceType: 'admin_alert',
            resourceId: alertId,
            after: { status: updated.status, isRead: updated.isRead },
          },
          tx,
        );
      }

      return updated;
    });
  }

  // =========================================================================
  // 4. ADMIN SECURITY CONTROLS (LOGIN HISTORY & SESSIONS)
  // =========================================================================

  async recordLoginAttempt(data: {
    userId?: string | null;
    email: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    success: boolean;
    failureReason?: string | null;
  }) {
    const [entry] = await this.dbService.db
      .insert(schema.adminLoginHistory)
      .values({
        id: crypto.randomUUID(),
        userId: data.userId || null,
        email: data.email,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        success: data.success,
        failureReason: data.failureReason || null,
      })
      .returning();

    if (!data.success) {
      const dedupeKey = `failed_login:${data.email}`;
      const [existing] = await this.dbService.db
        .select()
        .from(schema.adminAlerts)
        .where(and(eq(schema.adminAlerts.dedupeKey, dedupeKey), eq(schema.adminAlerts.status, 'ACTIVE')))
        .limit(1);

      if (!existing) {
        await this.dbService.db.insert(schema.adminAlerts).values({
          id: crypto.randomUUID(),
          alertType: 'FAILED_ADMIN_LOGIN',
          severity: 'WARNING',
          dedupeKey,
          title: `Failed admin login attempt`,
          message: `Failed login recorded for ${data.email} (${data.failureReason || 'invalid_credentials'}).`,
          resourceType: 'user',
          resourceId: data.userId || null,
          status: 'ACTIVE',
          isRead: false,
        });
      }
    }

    return entry;
  }

  async getLoginHistory(options?: { q?: string; page?: number; pageSize?: number }) {
    const page = Math.max(1, Number(options?.page || 1));
    const pageSize = Math.min(100, Math.max(1, Number(options?.pageSize || 25)));
    const offset = (page - 1) * pageSize;

    const whereClause =
      options?.q && options.q.trim()
        ? ilike(schema.adminLoginHistory.email, `%${options.q.trim()}%`)
        : undefined;

    const [countRow] = await this.dbService.db
      .select({ total: sql<number>`count(*)` })
      .from(schema.adminLoginHistory)
      .where(whereClause);

    const items = await this.dbService.db
      .select()
      .from(schema.adminLoginHistory)
      .where(whereClause)
      .orderBy(desc(schema.adminLoginHistory.createdAt))
      .limit(pageSize)
      .offset(offset);

    return { items, total: Number(countRow?.total || 0), page, pageSize };
  }

  async getActiveSessions(targetUserId?: string) {
    const rows = await this.dbService.db
      .select({
        id: schema.sessions.id,
        userId: schema.sessions.userId,
        expiresAt: schema.sessions.expiresAt,
        ipAddress: schema.sessions.ipAddress,
        userAgent: schema.sessions.userAgent,
        createdAt: schema.sessions.createdAt,
        updatedAt: schema.sessions.updatedAt,
      })
      .from(schema.sessions)
      .where(targetUserId ? eq(schema.sessions.userId, targetUserId) : undefined)
      .orderBy(desc(schema.sessions.updatedAt))
      .limit(100);

    return { items: rows, total: rows.length };
  }

  async revokeSession(sessionId: string, actor: ActorContext) {
    return this.dbService.db.transaction(async (tx: any) => {
      const [session] = await tx
        .select({ id: schema.sessions.id, userId: schema.sessions.userId })
        .from(schema.sessions)
        .where(eq(schema.sessions.id, sessionId))
        .limit(1);

      if (!session) {
        throw new NotFoundException(`Session ${sessionId} not found.`);
      }

      await tx.delete(schema.sessions).where(eq(schema.sessions.id, sessionId));

      if (this.activityLogService) {
        await this.activityLogService.record(
          {
            actorId: actor.userId,
            actorRole: actor.role,
            action: 'admin:session_revoke',
            resourceType: 'session',
            resourceId: sessionId,
            after: { targetUserId: session.userId },
          },
          tx,
        );
      }

      return { success: true, sessionId };
    });
  }
}
