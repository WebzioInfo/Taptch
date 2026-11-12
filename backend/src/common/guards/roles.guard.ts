import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => {
  const { SetMetadata } = require('@nestjs/common');
  return SetMetadata(ROLES_KEY, roles);
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { actor } = context.switchToHttp().getRequest();

    if (!actor) {
      throw new ForbiddenException('Access denied: Authentication context missing.');
    }

    if (actor.isAdmin) {
      return true; // Super admins bypass role restrictions
    }

    const hasRole = requiredRoles.includes(actor.role);
    if (!hasRole) {
      throw new ForbiddenException(`Access denied: Requires role [${requiredRoles.join(', ')}].`);
    }

    return true;
  }
}
