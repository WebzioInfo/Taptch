import { Controller, Post, Get, Body, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';

@ApiTags('Authentication')
@Controller('api/auth')
export class AuthController {
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
    const result = await this.authService.signUp(name, email, password);

    res.cookie('better-auth.session_token', result.session.token, this.getSessionCookieOptions(result.session.expiresAt));

    return result;
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

    if (returnToQuery && this.isAllowedFrontendOrigin(returnToQuery)) {
      targetOrigin = new URL(returnToQuery).origin;
    } else if (referer && this.isAllowedFrontendOrigin(referer)) {
      try {
        targetOrigin = new URL(referer).origin;
      } catch {
        targetOrigin = '';
      }
    }

    const statePayload = targetOrigin
      ? Buffer.from(JSON.stringify({ returnTo: targetOrigin })).toString('base64url')
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

    if (stateParam && stateParam !== 'taptch_auth_state') {
      try {
        const decoded = JSON.parse(Buffer.from(stateParam, 'base64url').toString('utf-8'));
        if (decoded?.returnTo && this.isAllowedFrontendOrigin(decoded.returnTo)) {
          resolvedFrontend = new URL(decoded.returnTo).origin;
        }
      } catch {
        // Fallback to resolvedFrontend
      }
    }

    if (!code) {
      return res.redirect(`${resolvedFrontend}/login?error=google_auth_failed`);
    }

    try {
      const result = await this.authService.handleGoogleOAuthCallback(code);

      res.cookie('better-auth.session_token', result.session.token, this.getSessionCookieOptions(result.session.expiresAt));

      // Role-based post-login redirect
      let targetPath = '/dashboard';
      if (result.user.systemRole === 'super_admin' || result.user.systemRole === 'admin') {
        targetPath = '/admin';
      } else if (result.user.systemRole === 'support_admin') {
        targetPath = '/support';
      }

      return res.redirect(`${resolvedFrontend}${targetPath}?session_token=${encodeURIComponent(result.session.token)}`);
    } catch {
      return res.redirect(`${resolvedFrontend}/login?error=google_token_exchange_failed`);
    }
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

