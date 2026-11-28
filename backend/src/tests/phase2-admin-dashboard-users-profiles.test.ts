import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard, PERMISSIONS_KEY } from '../common/guards/permissions.guard';
import { AdminController } from '../modules/admin/admin.controller';
import { AdminService } from '../modules/admin/admin.service';
import { ActivityLogService } from '../modules/admin/activity-log.service';
import * as schema from '../database/schema';
import type { ActorContext } from '../common/types';

describe('Phase 2: Admin Dashboard, User Management & Profile Management (Unit & Guard Tests)', () => {
  const adminActor: ActorContext = { userId: 'adm_1', orgId: null, role: 'admin', isAdmin: true };
  const supportActor: ActorContext = { userId: 'sup_1', orgId: null, role: 'support_admin', isAdmin: false };
  const staffActor: ActorContext = { userId: 'stf_1', orgId: null, role: 'staff', isAdmin: false };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('enforces @RequirePermissions on all Phase 2 AdminController endpoints and rejects unauthorized roles with 403', () => {
    const reflector = new Reflector();
    const guard = new PermissionsGuard(reflector);

    const endpoints: Array<{ method: keyof AdminController; actor: ActorContext; allowed: boolean }> = [
      { method: 'getDashboard', actor: staffActor, allowed: true },
      { method: 'getUserById', actor: staffActor, allowed: false },
      { method: 'getUserById', actor: supportActor, allowed: true },
      { method: 'updateUserStatus', actor: staffActor, allowed: false },
      { method: 'getProfiles', actor: staffActor, allowed: false },
      { method: 'getProfiles', actor: supportActor, allowed: true },
      { method: 'getProfileById', actor: supportActor, allowed: true },
      { method: 'updateProfileStatus', actor: staffActor, allowed: false },
      { method: 'updateProfileStatus', actor: supportActor, allowed: true },
      { method: 'updateOrderPayment', actor: supportActor, allowed: false },
    ];

    for (const tc of endpoints) {
      const handler = AdminController.prototype[tc.method] as Function;
      const perms = Reflect.getMetadata(PERMISSIONS_KEY, handler);
      expect(Array.isArray(perms) && perms.length > 0).toBe(true);

      const ctx: any = {
        getHandler: () => handler,
        getClass: () => AdminController,
        switchToHttp: () => ({ getRequest: () => ({ actor: tc.actor }) }),
      };

      if (tc.allowed) {
        expect(guard.canActivate(ctx)).toBe(true);
      } else {
        expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
      }
    }
  });

  it('gates recentActivity in getDashboardOverview by activity_logs.view permission', async () => {
    const selectCalls: any[] = [];
    const mockDb: any = {
      db: {
        select: () => ({
          from: (table: any) => {
            selectCalls.push(table);
            if (table === schema.users) {
              return {
                orderBy: () => ({ limit: async () => [{ id: 'u_1', name: 'A', email: 'a@b.com', systemRole: 'user', status: 'active', createdAt: new Date() }] }),
                then: (res: any) => res([{ totalUsers: 10, activeUsers: 8, suspendedUsers: 2 }]),
              };
            }
            if (table === schema.profiles) {
              return Promise.resolve([{ totalProfiles: 5, publishedProfiles: 4, unpublishedProfiles: 1 }]);
            }
            if (table === schema.auditLogs) {
              return {
                orderBy: () => ({ limit: async () => [{ id: 'log_1', action: 'admin:test', resourceType: 'user', resourceId: 'u_1', createdAt: new Date() }] }),
              };
            }
            return Promise.resolve([]);
          },
        }),
      },
    };

    const svc = new AdminService(mockDb);

    const staffRes = await svc.getDashboardOverview(staffActor);
    expect(staffRes.metrics.totalUsers).toBe(10);
    expect(staffRes.permissions.canViewActivity).toBe(false);
    expect(staffRes.recentActivity).toEqual([]);

    const adminRes = await svc.getDashboardOverview(adminActor);
    expect(adminRes.permissions.canViewActivity).toBe(true);
    expect(adminRes.recentActivity).toHaveLength(1);
  });

  it('revokes sessions, invalidates Redis profile caches, and records audit log on updateUserStatus', async () => {
    const deletedSessions: any[] = [];
    const txInserts: any[] = [];
    const redisDel = vi.fn().mockResolvedValue(1);

    const mockTx: any = {
      select: () => ({
        from: (table: any) => ({
          where: () => {
            if (table === schema.users) {
              return {
                for: () => ({
                  limit: async () => [{ id: 'u_2', systemRole: 'user', status: 'active' }],
                }),
              };
            }
            if (table === schema.profiles) {
              return Promise.resolve([{ slug: 'Shareef' }]);
            }
            return Promise.resolve([]);
          },
        }),
      }),
      update: () => ({
        set: () => ({
          where: async () => [],
        }),
      }),
      delete: () => ({
        where: async (cond: any) => {
          deletedSessions.push(cond);
        },
      }),
      insert: () => ({
        values: (val: any) => {
          txInserts.push(val);
          return { returning: async () => [val] };
        },
      }),
    };

    const mockDb: any = {
      db: {
        transaction: async (fn: any) => fn(mockTx),
      },
    };
    const mockRedis: any = { del: redisDel };
    const logService = new ActivityLogService(mockDb);
    const svc = new AdminService(mockDb, mockRedis, logService);

    await expect(svc.updateUserStatus(adminActor.userId, 'suspended', adminActor)).rejects.toThrow(
      BadRequestException,
    );

    const res = await svc.updateUserStatus('u_2', 'suspended', adminActor);
    expect(res.success).toBe(true);
    expect(deletedSessions).toHaveLength(1);
    expect(redisDel).toHaveBeenCalledWith('profile:slug:shareef');
    expect(redisDel).toHaveBeenCalledWith('profile:notfound:shareef');
    expect(txInserts.some((i) => i.action === 'admin:user_status_suspended')).toBe(true);
  });

  it('updates profile status transactionally, invalidates Redis cache, and records audit log', async () => {
    const txInserts: any[] = [];
    const redisDel = vi.fn().mockResolvedValue(1);

    const mockTx: any = {
      select: () => ({
        from: () => ({
          where: () => ({
            for: () => ({
              limit: async () => [{ id: 'p_1', slug: 'Shareef', status: 'PUBLISHED' }],
            }),
          }),
        }),
      }),
      update: () => ({
        set: () => ({
          where: () => ({
            returning: async () => [{ id: 'p_1', slug: 'Shareef', status: 'DRAFT' }],
          }),
        }),
      }),
      insert: () => ({
        values: (val: any) => {
          txInserts.push(val);
          return { returning: async () => [val] };
        },
      }),
    };

    const mockDb: any = {
      db: {
        transaction: async (fn: any) => fn(mockTx),
      },
    };
    const logService = new ActivityLogService(mockDb);
    const svc = new AdminService(mockDb, { del: redisDel } as any, logService);

    const res = await svc.updateProfileStatus('p_1', 'DRAFT', supportActor);
    expect(res.status).toBe('DRAFT');
    expect(redisDel).toHaveBeenCalledWith('profile:slug:shareef');
    expect(redisDel).toHaveBeenCalledWith('profile:notfound:shareef');
    expect(txInserts.some((i) => i.action === 'admin:profile_status_update')).toBe(true);
  });
});
