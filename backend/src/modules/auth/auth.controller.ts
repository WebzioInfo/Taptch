import { Controller, Post, Get, Body, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';

@ApiTags('Authentication')
@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('sign-in/email')
  @ApiOperation({ summary: 'Email & Password Sign In' })
  async signIn(@Body() body: any, @Res({ passthrough: true }) res: Response) {
    const email = body?.email;
    const password = body?.password;
    const result = await this.authService.signIn(email, password);

    // Set HTTP-only session cookie
    res.cookie('better-auth.session_token', result.session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: result.session.expiresAt,
      path: '/',
    });

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

    res.cookie('better-auth.session_token', result.session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: result.session.expiresAt,
      path: '/',
    });

    return result;
  }

  @Public()
  @Post('sign-out')
  @ApiOperation({ summary: 'Sign Out' })
  async signOut(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.['better-auth.session_token'];
    await this.authService.signOut(token);

    res.clearCookie('better-auth.session_token', { path: '/' });
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
  async googleOAuthRedirect(@Res() res: Response) {
    const url = this.authService.getGoogleAuthUrl();
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
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    if (!code) {
      return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
    }

    try {
      const result = await this.authService.handleGoogleOAuthCallback(code);

      res.cookie('better-auth.session_token', result.session.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: result.session.expiresAt,
        path: '/',
      });

      // Role-based post-login redirect
      let targetPath = '/dashboard';
      if (result.user.systemRole === 'super_admin' || result.user.systemRole === 'admin') {
        targetPath = '/admin';
      } else if (result.user.systemRole === 'support_admin') {
        targetPath = '/support';
      }

      return res.redirect(`${frontendUrl}${targetPath}`);
    } catch {
      return res.redirect(`${frontendUrl}/login?error=google_token_exchange_failed`);
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

    res.cookie('better-auth.session_token', result.session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: result.session.expiresAt,
      path: '/',
    });

    return result;
  }
}

