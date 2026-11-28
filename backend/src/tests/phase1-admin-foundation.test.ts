import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard, PERMISSIONS_KEY, ROLE_ONLY_ACCESS_KEY } from '../common/guards/permissions.guard';
import { AdminController } from '../modules/admin/admin.controller';
import { getPermissionsForRole, hasRolePermission } from '../common/rbac/permissions';
import { ActivityLogService } from '../modules/admin/activity-log.service';
import { AdminService } from '../modules/admin/admin.service';
import * as schema from '../database/schema';
import type { ActorContext } from '../common/types';

describe('Phase 1: Admin Foundation (RBAC, Activity Logs, Admin Management)', () => {
  const superAdmin: ActorContext = { userId: 'sa_1', orgId: null, role: 'super_admin', isAdmin: true };
  const adminActor: ActorContext = { userId: 'adm_1', orgId: null, role: 'admin', isAdmin: true };
  const supportActor: ActorContext = { userId: 'sup_1', orgId: null, role: 'support_admin', isAdmin: false };
  const staffActor: ActorContext = { userId: 'stf_1', orgId: null, role: 'staff', isAdmin: false };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('RBAC Matrix & PermissionsGuard', () => {
    it('grants granular permissions per role', () => {
      expect(hasRolePermission('super_admin', 'roles.manage')).toBe(true);
      expect(hasRolePermission('admin', 'staff.manage')).toBe(true);
      expect(hasRolePermission('admin', 'roles.manage')).toBe(false);
      expect(hasRolePermission('support_admin', 'profiles.edit')).toBe(true);
      expect(hasRolePermission('support_admin', 'finance.manage')).toBe(false);
      expect(hasRolePermission('staff', 'orders.view')).toBe(true);
      expect(hasRolePermission('staff', 'users.suspend')).toBe(false);
      expect(getPermissionsForRole('user')).toEqual([]);
    });

    it('enforces @RequirePermissions in PermissionsGuard', () => {
      const reflector = {
        getAllAndOverride: vi.fn(() => ['staff.manage']),
      } as unknown as Reflector;
      const guard = new PermissionsGuard(reflector);

      const makeCtx = (actor: any) =>
        ({
          getHandler: () => ({}),
          getClass: () => ({}),
          switchToHttp: () => ({ getRequest: () => ({ actor }) }),
        }) as any;

      expect(guard.canActivate(makeCtx(superAdmin))).toBe(true);
      expect(guard.canActivate(makeCtx(adminActor))).toBe(true);
      expect(() => guard.canActivate(makeCtx(supportActor))).toThrow(ForbiddenException);
      expect(() => guard.canActivate(makeCtx(staffActor))).toThrow(ForbiddenException);
      expect(() => guard.canActivate(makeCtx(null))).toThrow(ForbiddenException);
    });
  });

  describe('ActivityLogService', () => {
    it('redacts sensitive fields from before/after metadata and records immutable audit entry', async () => {
      const inserted: any[] = [];
      const mockDb: any = {
        db: {
          insert: () => ({
            values: (val: any) => {
              inserted.push(val);
              return { returning: async () => [val] };
            },
          }),
        },
      };

      const svc = new ActivityLogService(mockDb);
      await svc.record({
        actorId: superAdmin.userId,
        actorRole: superAdmin.role,
        action: 'admin:role_change',
        resourceType: 'user',
        resourceId: 'u_1',
        before: { systemRole: 'staff', password: 'secret_password' },
        after: { systemRole: 'admin', apiKey: 'sk_live_123' },
      });

      expect(inserted).toHaveLength(1);
      expect(inserted[0].metadata.before.password).toBe('[REDACTED]');
      expect(inserted[0].metadata.after.apiKey).toBe('[REDACTED]');
      expect(inserted[0].metadata.after.systemRole).toBe('admin');
    });
  });

  describe('AdminService Role Management', () => {
    it('prevents self-escalation, non-super_admin assigning super_admin, and demoting last super_admin', async () => {
      const targetUser = { id: 'u_target', systemRole: 'staff', status: 'active' };
      const lastSuperAdmin = { id: 'sa_other', systemRole: 'super_admin', status: 'active' };
      const recordedLogs: any[] = [];

      const mockTx: any = {
        select: () => ({
          from: (table: any) => ({
            where: () => ({
              for: () => {
                if (table === schema.users) {
                  return {
                    limit: async () => [targetUser],
                  };
                }
                return { limit: async () => [] };
              },
            }),
          }),
        }),
        update: () => ({
          set: () => ({
            where: async () => [],
          }),
        }),
      };
      const mockDb: any = {
        db: {
          ...mockTx,
          transaction: async (fn: any) => fn(mockTx),
        },
      };
      const mockActivityLog: any = {
        record: vi.fn(async (entry: any) => {
          recordedLogs.push(entry);
          return entry;
        }),
      };

      const svc = new AdminService(mockDb, undefined, mockActivityLog);

      // Self-escalation blocked
      await expect(svc.updateAdminRole(adminActor.userId, 'super_admin', adminActor)).rejects.toThrow(
        BadRequestException,
      );

      // Non-super_admin cannot assign super_admin
      await expect(svc.updateAdminRole('u_target', 'super_admin', adminActor)).rejects.toThrow(
        ForbiddenException,
      );

      // Valid role change by super_admin records audit log
      const res = await svc.updateAdminRole('u_target', 'support_admin', superAdmin);
      expect(res.systemRole).toBe('support_admin');
      expect(recordedLogs).toHaveLength(1);
      expect(recordedLogs[0].action).toBe('admin:role_change');

      // Last super_admin protection
      const mockLastSaDb: any = {
        db: {
              transaction: async (fn: any) =>
                fn({
                  select: () => ({
                    from: () => ({
                      where: () => ({
                        for: () => ({
                          limit: async () => [lastSuperAdmin],
                          then: (resolve: any) => resolve([lastSuperAdmin]),
                        }),
                      }),
                    }),
                  }),
                }),
          },
      };
        const svcLast = new AdminService(mockLastSaDb, undefined, mockActivityLog);
        await expect(svcLast.updateAdminRole('sa_other', 'admin', superAdmin)).rejects.toThrow(
          BadRequestException,
        );
      });
  });

  describe('Phase 1.2: RBAC Fail-Closed & Audit Integrity', () => {
    it('fails closed in PermissionsGuard when no @RequirePermissions and no @RoleOnlyAccess', () => {
      const reflector = {
        getAllAndOverride: vi.fn().mockReturnValue(undefined),
      } as unknown as Reflector;
      const guard = new PermissionsGuard(reflector);
      const ctx: any = {
        getHandler: () => () => { },
        getClass: () => class { },
        switchToHttp: () => ({ getRequest: () => ({ actor: superAdmin }) }),
      };

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('allows @RoleOnlyAccess() endpoints when actor is present', () => {
      const reflector = {
        getAllAndOverride: vi.fn((key: string) => {
          if (key === ROLE_ONLY_ACCESS_KEY) return true;
          return undefined;
        }),
      } as unknown as Reflector;
      const guard = new PermissionsGuard(reflector);
      const ctx: any = {
        getHandler: () => () => { },
        getClass: () => class { },
        switchToHttp: () => ({ getRequest: () => ({ actor: staffActor }) }),
      };

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('recursively redacts sensitive keys inside nested objects and arrays (case-insensitive)', async () => {
      const inserted: any[] = [];
      const mockDb: any = {
        db: {
          insert: () => ({
            values: (val: any) => {
              inserted.push(val);
              return { returning: async () => [val] };
            },
          }),
        },
      };

      const service = new ActivityLogService(mockDb);
      await service.record({
        actorId: 'sa_1',
        actorRole: 'super_admin',
        action: 'admin:test_redaction',
        resourceType: 'system',
        after: {
          Password: 'secret-value',
          items: [
            { apiKey: 'key_123', safe: 'ok' },
            { nested: { Refresh_Token: 'rt_999', Authorization: 'Bearer xyz' } },
          ],
        },
      });

      expect(inserted).toHaveLength(1);
      expect(inserted[0].metadata.after.Password).toBe('[REDACTED]');
      expect(inserted[0].metadata.after.items[0].apiKey).toBe('[REDACTED]');
      expect(inserted[0].metadata.after.items[0].safe).toBe('ok');
      expect(inserted[0].metadata.after.items[1].nested.Refresh_Token).toBe('[REDACTED]');
      expect(inserted[0].metadata.after.items[1].nested.Authorization).toBe('[REDACTED]');
    });

    it('ensures every AdminController route has @RequirePermissions or @RoleOnlyAccess', () => {
      const proto = AdminController.prototype;
      const methodNames = Object.getOwnPropertyNames(proto).filter(
        (name) => name !== 'constructor' && typeof (proto as any)[name] === 'function',
      );

      for (const name of methodNames) {
        const handler = (proto as any)[name];
        const perms = Reflect.getMetadata(PERMISSIONS_KEY, handler);
        const roleOnly = Reflect.getMetadata(ROLE_ONLY_ACCESS_KEY, handler);
        expect(
          (Array.isArray(perms) && perms.length > 0) || roleOnly === true,
          `AdminController.${name} is missing @RequirePermissions or @RoleOnlyAccess`,
        ).toBe(true);
      }
    });

    it('records audit log inside transaction for recordExpense and assignSubscription', async () => {
      const txInserts: any[] = [];
      const mockTx: any = {
        select: () => ({
          from: () => ({
            where: () => ({
              limit: async () => [{ id: 'u_1' }],
            }),
          }),
        }),
        insert: () => ({
          values: (val: any) => {
            txInserts.push(val);
            return {
              returning: async () => [{ id: 'exp_1', ...val }],
            };
          },
        }),
      };
      const mockDb: any = {
        db: {
          transaction: async (fn: any) => fn(mockTx),
        },
      };
      const logService = new ActivityLogService(mockDb);
      const svc = new AdminService(mockDb, undefined, logService);

      await svc.recordExpense(
        { category: 'MARKETING', title: 'Ads', amount: 50000 },
        superAdmin,
      );
      await svc.assignSubscription('u_1', 'micro', superAdmin);

      const auditActions = txInserts.filter((r) => r.action).map((r) => r.action);
      expect(auditActions).toContain('admin:expense_record');
      expect(auditActions).toContain('admin:subscription_assign');
    });
  });
});
