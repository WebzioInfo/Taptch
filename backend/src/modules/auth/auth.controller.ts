import { Controller, Post, Get, Body, Req, Res, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import * as crypto from 'crypto';

@ApiTags('Authentication')
@Controller('api/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(private authService: AuthService) {}

  private getSessionCookieOptions(expires?: Date) {
    const isProd = process.env.NODE_ENV === 'production';
    const sameSite = (process.env.COOKIE_SAME_SITE as 'none' | 'lax' | 'strict') || (isProd ? 'none' : 'lax');
    const secure = process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === 'true' : isProd;
    const domain = process.env.COOKIE_DOMAIN ? process.env.COOKIE_DOMAIN.trim() : undefined;

    return {
      httpOnly: true,
      secure,
      sameSite,
      path: '/',
      ...(expires ? { expires } : {}),
      ...(domain ? { domain } : {}),
    };
  }

  private isAllowedFrontendOrigin(originUrl: string): boolean {
    try {
      const parsed = new URL(originUrl);
      const hostname = parsed.hostname.toLowerCase();

      // Check taptch.com subdomains and root domain
      if (hostname === 'taptch.com' || hostname.endsWith('.taptch.com')) {
        return true;
      }

      // Check webziotech.in staging domains
      if (hostname === 'webziotech.in' || hostname.endsWith('.webziotech.in')) {
        return true;
      }

      // Check local development
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  @Public()
  @Post('sign-in/email')
  @ApiOperation({ summary: 'Email & Password Sign In' })
  async signIn(@Body() body: any, @Res({ passthrough: true }) res: Response) {
    const email = body?.email;
    const password = body?.password;
    const result = await this.authService.signIn(email, password);

    // Set secure HTTP-only session cookie
    res.cookie('better-auth.session_token', result.session.token, this.getSessionCookieOptions(result.session.expiresAt));

    return result;
  }

  @Public()
  @Post('sign-up/email')
  @ApiOperation({ summary: 'Email Registration' })
  async signUp(@Body() body: any, @Res({ passthrough: true }) res: Response) {
    const name = body?.name;
    const email = body?.email;
    const password = body?.password;
    const accountType = body?.accountType;
    const result = await this.authService.signUp(name, email, password, accountType);

    res.cookie('better-auth.session_token', result.session.token, this.getSessionCookieOptions(result.session.expiresAt));

    return result;
  }

  @Public()
  @Post('account-type')
  @ApiOperation({ summary: 'Set initial account type (personal | business)' })
  async setAccountType(@Req() req: Request, @Body() body: { accountType: string }) {
    const token = req.cookies?.['better-auth.session_token'] || req.headers.authorization?.replace('Bearer ', '');
    const sessionData = await this.authService.getSession(token || '');
    if (!sessionData?.user?.id) {
      throw new UnauthorizedException('Authentication required.');
    }
    return this.authService.setAccountType(sessionData.user.id, body?.accountType);
  }

  @Public()
  @Post('upgrade-business')
  @ApiOperation({ summary: 'Upgrade a personal account to a business account' })
  async upgradeToBusiness(@Req() req: Request, @Body() body: { businessName?: string }) {
    const token = req.cookies?.['better-auth.session_token'] || req.headers.authorization?.replace('Bearer ', '');
    const sessionData = await this.authService.getSession(token || '');
    if (!sessionData?.user?.id) {
      throw new UnauthorizedException('Authentication required.');
    }
    return this.authService.upgradeToBusiness(sessionData.user.id, body?.businessName);
  }

  @Public()
  @Post('sign-out')
  @ApiOperation({ summary: 'Sign Out' })
  async signOut(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.['better-auth.session_token'] || req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      await this.authService.signOut(token);
    }

    const clearOptions = this.getSessionCookieOptions();
    delete (clearOptions as any).expires;
    res.clearCookie('better-auth.session_token', clearOptions);
    return { success: true };
  }

  @Public()
  @Get('get-session')
  @ApiOperation({ summary: 'Get Active User Session' })
  async getSession(@Req() req: Request) {
    const token = req.cookies?.['better-auth.session_token'] || req.headers.authorization?.replace('Bearer ', '');
    return this.authService.getSession(token);
  }

  @Public()
  @Get('oauth/google')
  @ApiOperation({ summary: 'Initiate Google OAuth flow' })
  async googleOAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const returnToQuery = (req.query?.returnTo as string) || (req.query?.redirect_uri as string);
    const referer = req.headers?.referer;
    let targetOrigin = '';
    let redirectPath = '';

    if (returnToQuery && this.isAllowedFrontendOrigin(returnToQuery)) {
      const parsed = new URL(returnToQuery);
      targetOrigin = parsed.origin;
      const candidatePath = `${parsed.pathname}${parsed.search}`;
      if (candidatePath.startsWith('/') && !candidatePath.startsWith('//') && candidatePath !== '/') {
        redirectPath = candidatePath;
      }
    } else if (referer && this.isAllowedFrontendOrigin(referer)) {
      try {
        targetOrigin = new URL(referer).origin;
      } catch {
        targetOrigin = '';
      }
    }

    const statePayload =
      targetOrigin || redirectPath
        ? Buffer.from(JSON.stringify({ returnTo: targetOrigin, redirectPath })).toString('base64url')
        : 'taptch_auth_state';

    const url = this.authService.getGoogleAuthUrl(statePayload);
    const fallbackFrontend = (process.env.FRONTEND_URL || 'https://taptch.com').replace(/\/+$/, '');

    if (!url) {
      const redirectBase = targetOrigin || fallbackFrontend;
      return res.redirect(`${redirectBase}/login?error=google_not_configured`);
    }
    return res.redirect(url);
  }

  @Public()
  @Get('oauth/google/callback')
  @ApiOperation({ summary: 'Handle Google OAuth callback and session creation' })
  async googleOAuthCallback(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const code = req.query?.code as string;
    const stateParam = req.query?.state as string;
    let resolvedFrontend = (process.env.FRONTEND_URL || 'https://taptch.com').replace(/\/+$/, '');
    let customRedirectPath = '';

    if (stateParam && stateParam !== 'taptch_auth_state') {
      try {
        const decoded = JSON.parse(Buffer.from(stateParam, 'base64url').toString('utf-8'));
        if (decoded?.returnTo && this.isAllowedFrontendOrigin(decoded.returnTo)) {
          resolvedFrontend = new URL(decoded.returnTo).origin;
        }
        if (
          typeof decoded?.redirectPath === 'string' &&
          decoded.redirectPath.startsWith('/') &&
          !decoded.redirectPath.startsWith('//')
        ) {
          customRedirectPath = decoded.redirectPath;
        }
      } catch {
        // Fallback to resolvedFrontend
      }
    }

    const txId = `tx_${crypto.randomBytes(4).toString('hex')}`;
    this.logger.log(`[OAuth] tx=${txId} Callback received -> resolvedFrontend=${resolvedFrontend}`);

    if (!code) {
      this.logger.warn(`[OAuth] tx=${txId} Callback missing authorization code`);
      return res.redirect(`${resolvedFrontend}/login?error=google_auth_failed`);
    }

    try {
      const result = await this.authService.handleGoogleOAuthCallback(code);
      this.logger.log(`[OAuth] tx=${txId} Google user verified user=${result.user.id}`);

      res.cookie('better-auth.session_token', result.session.token, this.getSessionCookieOptions(result.session.expiresAt));

      // Generate short-lived single-use auth code (NEVER expose raw 30-day session token in URLs!)
      const authCode = await this.authService.createExchangeCode(result.session.token, result.user.id, txId);

      // Role-based post-login redirect (preserving pending purchase/checkout path if provided)
      let targetPath = customRedirectPath || '/dashboard';
      if (!customRedirectPath) {
        if (result.user.systemRole === 'super_admin' || result.user.systemRole === 'admin') {
          targetPath = '/admin';
        } else if (result.user.systemRole === 'support_admin') {
          targetPath = '/support';
        }
      }

      const separator = targetPath.includes('?') ? '&' : '?';
      return res.redirect(`${resolvedFrontend}${targetPath}${separator}auth_code=${encodeURIComponent(authCode)}`);
    } catch (err: any) {
      const errorMsg = err?.response?.message || err?.message || 'google_token_exchange_failed';
      this.logger.warn(`[OAuth] tx=${txId} Callback failed: ${errorMsg}`);
      return res.redirect(`${resolvedFrontend}/login?error=${encodeURIComponent(errorMsg)}`);
    }
  }

  @Public()
  @Post('oauth/exchange-code')
  @ApiOperation({ summary: 'Exchange single-use auth code for user session (Zero Token Leakage)' })
  async exchangeCode(
    @Body() body: { code: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const txId = `tx_${crypto.randomBytes(4).toString('hex')}`;
    const code = body?.code;
    if (!code) {
      this.logger.warn(`[OAuth] tx=${txId} Exchange rejected: missing_code`);
      throw new BadRequestException('Exchange code is required.');
    }

    const payload = await this.authService.consumeExchangeCode(code, txId);
    if (!payload) {
      throw new UnauthorizedException('Authentication code is invalid or has expired.');
    }

    const sessionData = await this.authService.getSession(payload.token);
    if (!sessionData?.session) {
      this.logger.warn(`[OAuth] tx=${txId} Exchange rejected: session_not_found_in_db`);
      throw new UnauthorizedException('Session could not be established.');
    }

    // Set secure HttpOnly cookie
    res.cookie(
      'better-auth.session_token',
      sessionData.session.token,
      this.getSessionCookieOptions(new Date(sessionData.session.expiresAt)),
    );

    this.logger.log(`[OAuth] tx=${txId} Exchange succeeded for user=${sessionData.user.id}`);
    return sessionData;
  }

  @Public()
  @Post('oauth/google/verify-token')
  @ApiOperation({ summary: 'Verify Google One Tap / GIS ID token' })
  async verifyGoogleToken(
    @Body() body: { credential?: string; idToken?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const idToken = body.credential || body.idToken;
    const result = await this.authService.verifyGoogleIdToken(idToken!);

    res.cookie('better-auth.session_token', result.session.token, this.getSessionCookieOptions(result.session.expiresAt));

    return result;
  }
}

