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

  getGoogleAuthUrl(state?: string): string {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId || clientId.trim() === '' || clientId === 'dummy-google-client-id') {
      return '';
    }

    const callbackUrl =
      process.env.GOOGLE_CALLBACK_URL ||
      `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/auth/oauth/google/callback`;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
      state: state || 'taptch_auth_state',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async handleGoogleOAuthCallback(code: string) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const callbackUrl =
      process.env.GOOGLE_CALLBACK_URL ||
      `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/auth/oauth/google/callback`;

    if (!clientId || !clientSecret) {
      this.logger.warn('Google OAuth is not configured with client credentials.');
      throw new BadRequestException(
        'Google OAuth credentials are not fully configured on the server. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
      );
    }

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      throw new BadRequestException(`Google OAuth exchange failed: ${err}`);
    }

    const tokenData = await tokenRes.json();
    const idToken = tokenData.id_token;
    const accessToken = tokenData.access_token;

    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!userInfoRes.ok) {
      throw new BadRequestException('Failed to retrieve user profile from Google.');
    }
    const googleUser = await userInfoRes.json();
    return this.findOrCreateGoogleUser(googleUser, { idToken, accessToken });
  }

  async verifyGoogleIdToken(idToken: string) {
    if (!idToken) throw new BadRequestException('Google ID token is required.');

    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    if (!res.ok) {
      throw new BadRequestException('Invalid or expired Google credential token.');
    }
    const payload = await res.json();
    if (!payload.email || !payload.sub) {
      throw new BadRequestException('Malformed Google user token received.');
    }

    return this.findOrCreateGoogleUser(
      {
        sub: payload.sub,
        email: payload.email,
        name: payload.name || payload.email.split('@')[0],
        picture: payload.picture,
      },
      { idToken },
    );
  }

  private async findOrCreateGoogleUser(
    googleUser: { sub: string; email: string; name?: string; picture?: string },
    tokens: { idToken?: string; accessToken?: string },
  ) {
    const normalizedEmail = googleUser.email.trim().toLowerCase();

    // 1. Check if user already exists
    const [existingUser] = await this.dbService.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, normalizedEmail))
      .limit(1);

    let userId: string;
    let systemRole = 'user';

    if (existingUser) {
      userId = existingUser.id;
      systemRole = existingUser.systemRole || 'user';

      if (existingUser.status === 'suspended' || existingUser.status === 'deactivated') {
        throw new UnauthorizedException('Sign-in is temporarily restricted. Please contact support.');
      }

      await this.dbService.db
        .update(schema.users)
        .set({
          emailVerified: true,
          image: existingUser.image || googleUser.picture || null,
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, userId));
    } else {
      userId = crypto.randomUUID();
      await this.dbService.db.insert(schema.users).values({
        id: userId,
        name: googleUser.name?.trim() || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        emailVerified: true,
        image: googleUser.picture || null,
        systemRole: 'user',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // 2. Link or update accounts record
    const [existingAccount] = await this.dbService.db
      .select()
      .from(schema.accounts)
      .where(
        and(
          eq(schema.accounts.userId, userId),
          eq(schema.accounts.providerId, 'google'),
        ),
      )
      .limit(1);

    if (existingAccount) {
      await this.dbService.db
        .update(schema.accounts)
        .set({
          accountId: googleUser.sub,
          idToken: tokens.idToken || null,
          accessToken: tokens.accessToken || null,
          updatedAt: new Date(),
        })
        .where(eq(schema.accounts.id, existingAccount.id));
    } else {
      await this.dbService.db.insert(schema.accounts).values({
        id: crypto.randomUUID(),
        accountId: googleUser.sub,
        providerId: 'google',
        userId,
        idToken: tokens.idToken || null,
        accessToken: tokens.accessToken || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // 3. Issue session
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await this.dbService.db.insert(schema.sessions).values({
      id: crypto.randomUUID(),
      userId,
      token,
      expiresAt,
      ipAddress: null,
      userAgent: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return {
      user: {
        id: userId,
        email: normalizedEmail,
        name: googleUser.name || normalizedEmail,
        systemRole,
      },
      session: {
        token,
        expiresAt,
      },
    };
  }
}

