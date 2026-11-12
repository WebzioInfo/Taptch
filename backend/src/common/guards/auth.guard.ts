import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { DatabaseService } from '../../database/database.service';
import * as schema from '../../database/schema';
import { eq, and, gt } from 'drizzle-orm';
import type { ActorContext } from '../types';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private dbService: DatabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const actor = await this.resolveActor(request);

    request.actor = actor;

    if (isPublic) {
      return true;
    }

    if (!actor) {
      throw new UnauthorizedException('Authentication required to access this resource.');
    }

    return true;
  }

  private async resolveActor(request: any): Promise<ActorContext | null> {
    // 1. Automated testing headers (strictly in test/dev environment)
    if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
      const testUserId = request.headers['x-test-user-id'];
      if (testUserId) {
        const role = (request.headers['x-test-role'] as string) || 'user';
        return {
          userId: testUserId as string,
          orgId: (request.headers['x-test-org-id'] as string) || null,
          role,
          isAdmin: role === 'super_admin' || role === 'admin',
        };
      }
    }

    // 2. Cookie or Bearer Token Extraction
    let token: string | null = null;
    if (request.cookies) {
      token = request.cookies['better-auth.session_token'] || request.cookies['session_token'];
    }

    if (!token && request.headers.authorization) {
      const authHeader = request.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim();
      }
    }

    if (!token) {
      return null;
    }

    try {
      // 3. Database session validation against PostgreSQL
      const sessionRow = await this.dbService.db
        .select({
          session: schema.sessions,
          user: schema.users,
        })
        .from(schema.sessions)
        .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
        .where(
          and(
            eq(schema.sessions.token, token),
            gt(schema.sessions.expiresAt, new Date()),
          ),
        )
        .limit(1);

      if (!sessionRow || sessionRow.length === 0) {
        return null;
      }

      const { user } = sessionRow[0];

      // Immediate session rejection for suspended or deactivated accounts
      if (user.status === 'suspended' || user.status === 'deactivated') {
        return null;
      }

      const systemRole = user.systemRole || 'user';
      return {
        userId: user.id,
        orgId: null,
        role: systemRole,
        isAdmin: systemRole === 'super_admin' || systemRole === 'admin',
      };
    } catch {
      return null;
    }
  }
}

