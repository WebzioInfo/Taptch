import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { hasRolePermission, type Permission } from '../rbac/permissions';

export const PERMISSIONS_KEY = 'permissions';
export const ROLE_ONLY_ACCESS_KEY = 'role_only_access';

export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * Explicitly marks a handler as intentionally role-only (no granular permission required),
 * such as GET /api/v1/admin/rbac/me. All other handlers guarded by PermissionsGuard fail closed
 * if @RequirePermissions(...) is omitted.
 */
export const RoleOnlyAccess = () => SetMetadata(ROLE_ONLY_ACCESS_KEY, true);

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      const isRoleOnly = this.reflector.getAllAndOverride<boolean>(ROLE_ONLY_ACCESS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
      if (isRoleOnly) {
        return true;
      }
      throw new ForbiddenException('Access denied: Endpoint missing permission metadata.');
    }

    const { actor } = context.switchToHttp().getRequest();
    if (!actor) {
      throw new ForbiddenException('Access denied: Authentication context missing.');
    }

    if (actor.role === 'super_admin') {
      return true;
    }

    const missing = requiredPermissions.filter((perm) => !hasRolePermission(actor.role, perm));
    if (missing.length > 0) {
      throw new ForbiddenException(
        `Access denied: Missing required permission(s) [${missing.join(', ')}].`,
      );
    }

    return true;
  }
}
