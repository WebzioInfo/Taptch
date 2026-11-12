import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import * as schema from '../../database/schema';
import { eq, and, gt } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private dbService: DatabaseService) {}

  async signIn(email: string, pass: string) {
    if (!email || !email.trim()) {
      throw new BadRequestException('Enter your email address.');
    }
    if (!pass) {
      throw new BadRequestException('Enter your password.');
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Fetch user by email
    const users = await this.dbService.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, normalizedEmail))
      .limit(1);

    if (users.length === 0) {
      throw new UnauthorizedException('Email or password is incorrect. Check your details and try again.');
    }

    const user = users[0];

    // Check account status
    if (user.status === 'suspended' || user.status === 'deactivated') {
      throw new UnauthorizedException('Sign-in is temporarily restricted. Please contact support.');
    }

    // 2. Fetch password hash from accounts table
    const accounts = await this.dbService.db
      .select()
      .from(schema.accounts)
      .where(
        and(
          eq(schema.accounts.userId, user.id),
          eq(schema.accounts.providerId, 'credential'),
        ),
      )
      .limit(1);

    if (accounts.length === 0 || !accounts[0].password) {
      throw new UnauthorizedException('Email or password is incorrect. Check your details and try again.');
    }

    // 3. Verify password hash (supports bcrypt and better-auth scrypt)
    let isValid = false;
    const storedHash = accounts[0].password;
    if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$')) {
      isValid = await bcrypt.compare(pass, storedHash);
    } else {
      try {
        const { verifyPassword } = require('@better-auth/utils/password');
        isValid = await verifyPassword(storedHash, pass);
        if (isValid) {
          // Seamlessly migrate legacy scrypt hash to modern bcrypt
          const upgradedBcryptHash = await bcrypt.hash(pass, 10);
          await this.dbService.db
            .update(schema.accounts)
            .set({ password: upgradedBcryptHash })
            .where(eq(schema.accounts.id, accounts[0].id));
        }
      } catch {
        isValid = false;
      }
    }

    if (!isValid) {
      throw new UnauthorizedException('Email or password is incorrect. Check your details and try again.');
    }

    // 4. Create new session token (30 days validity)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const session = await this.dbService.db
      .insert(schema.sessions)
      .values({
        id: crypto.randomUUID(),
        userId: user.id,
        token,
        expiresAt,
        ipAddress: null,
        userAgent: null,
      })
      .returning();

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        systemRole: user.systemRole,
      },
      session: {
        token,
        expiresAt,
      },
    };
  }

  async signUp(name: string, email: string, pass: string) {
    if (!email || !email.includes('@')) {
      throw new BadRequestException('Enter a valid email address.');
    }
    if (!pass || pass.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters.');
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await this.dbService.db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, normalizedEmail))
      .limit(1);

    if (existing.length > 0) {
      throw new BadRequestException('An account with this email address already exists.');
    }

    const userId = crypto.randomUUID();
    const hashedPassword = await bcrypt.hash(pass, 10);

    await this.dbService.db.insert(schema.users).values({
      id: userId,
      name: name.trim(),
      email: normalizedEmail,
      systemRole: 'user',
    });

    await this.dbService.db.insert(schema.accounts).values({
      id: crypto.randomUUID(),
      userId,
      accountId: normalizedEmail,
      providerId: 'credential',
      password: hashedPassword,
    });

    return this.signIn(normalizedEmail, pass);
  }

  async signOut(token: string) {
    if (token) {
      await this.dbService.db
        .delete(schema.sessions)
        .where(eq(schema.sessions.token, token));
    }
    return { success: true };
  }

  async getSession(token: string) {
    if (!token) return null;

    const rows = await this.dbService.db
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

    if (rows.length === 0) return null;

    const { session, user } = rows[0];
    return {
      session,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        systemRole: user.systemRole,
      },
    };
  }
}

