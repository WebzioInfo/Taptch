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
}

